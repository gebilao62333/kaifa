const { Op } = require('sequelize');
const { User, UserPref } = require('../models');
const sequelize = require('../config/mysql');
const { affectedCount } = require('../utils/sql');
const { getTimestamp } = require('../utils/helper');
const { findBenefit } = require('../utils/level');
const { SKINS, SKIN_TYPES, findSkin, findSkinByKey, isFreeSkin } = require('../utils/skinCatalog');
const levelService = require('./levelService');
const logger = require('../utils/logger');

// 装扮商城服务端化（审计 H-6）
//
// 改造前的信任边界是错的：客户端提交 body.spend 当扣款额、body.data.skinShop.owned 当所有权，
// 服务端只判断余额够不够。于是「spend=0 + owned 全 true」就能白拿任意装扮，
// 而 skin_shop 的 Lv.45 门槛又只在 spend>0 时才入列检查（controllers/user.js 的 benefitsRequested），
// 白拿的同时连等级门槛一起绕过。
//
// 现在的口径：
//   1. 价格与 VIP 门槛只由 utils/skinCatalog.js 决定，客户端只提交 skinId；
//   2. 所有权只由本服务写入 xn_user_pref.data.skinShop，读写都按目录过滤；
//   3. 门槛校验、条件扣款、所有权落库在同一事务内完成；
//   4. 历史脏数据（客户端伪造的 owned）按目录过滤后保留，但不再新增伪造入口（详见后端开发文档 H-6 遗留）。

const STATE_KEY = 'skinShop';

const BUSINESS_ERROR_CODES = [
  'SKIN_NOT_FOUND',
  'SKIN_NOT_OWNED',
  'SKIN_VIP_REQUIRED',
  'INSUFFICIENT_BALANCE'
];

const businessError = (code, message, extra = {}) => {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extra);
  return error;
};

const isBusinessError = (error) => !!error && BUSINESS_ERROR_CODES.indexOf(error.code) >= 0;

// 与 levelService.getInfo 保持同一口径：vip_expire_time 为 0 视为不限期。
const effectiveVipLevel = (user) => {
  if (!user || !user.vip) return 0;
  const expire = Number(user.vip_expire_time) || 0;
  if (expire > 0 && expire <= getTimestamp()) return 0;
  return Number(user.vip_lv) || 0;
};

const USER_ATTRIBUTES = ['id', 'lv', 'money', 'vip', 'vip_lv', 'vip_expire_time'];

const parsePrefData = (row) => {
  if (!row || !row.data) return {};
  try {
    return JSON.parse(row.data) || {};
  } catch (e) {
    return {};
  }
};

// 只接受目录里真实存在的键；其余（历史客户端伪造、已下架装扮）直接丢弃。
const sanitizeState = (raw) => {
  const owned = {};
  const using = {};
  const source = raw && typeof raw === 'object' ? raw : {};
  const absorb = (from, target) => {
    if (!from || typeof from !== 'object') return;
    Object.keys(from).forEach((key) => {
      if (!from[key]) return;
      const skin = findSkinByKey(key);
      if (skin) target[skin.key] = true;
    });
  };
  absorb(source.owned, owned);
  absorb(source.using, using);
  Object.keys(using).forEach((key) => {
    if (!owned[key] && !isFreeSkin(findSkinByKey(key))) delete using[key];
  });
  return { owned, using };
};

const readState = async (userId, transaction) => {
  const row = await UserPref.findOne({ where: { user_id: userId }, transaction });
  return sanitizeState(parsePrefData(row)[STATE_KEY]);
};

// 只覆盖 skinShop 这一段，其它偏好（隐身、优先匹配等）原样保留。
const writeState = async (userId, state, transaction) => {
  const row = await UserPref.findOne({ where: { user_id: userId }, transaction });
  const merged = parsePrefData(row);
  merged[STATE_KEY] = { owned: state.owned, using: state.using };
  const payload = JSON.stringify(merged);
  if (row) {
    await row.update({ data: payload, update_time: getTimestamp() }, { transaction });
  } else {
    await UserPref.create({ user_id: userId, data: payload, update_time: getTimestamp() }, { transaction });
  }
};

const isOwned = (skin, state) => isFreeSkin(skin) || !!state.owned[skin.key];

// 同一时刻只使用一套装扮（沿用改造前的产品口径：四类共用一个「使用中」位）。
const markUsing = (state, skin) => {
  state.using = { [skin.key]: true };
  state.owned[skin.key] = true;
};

const resolveSkin = (skinId) => {
  const skin = findSkin(skinId);
  if (!skin) throw businessError('SKIN_NOT_FOUND', '装扮不存在或已下架');
  return skin;
};

const buildItem = (skin, state) => ({
  id: skin.id,
  type: skin.type,
  name: skin.name,
  price: Number(skin.price) || 0,
  vipLevel: Number(skin.vipLevel) || 0,
  vipOnly: Number(skin.vipLevel) > 0,
  assets: skin.assets,
  owned: isOwned(skin, state),
  using: !!state.using[skin.key]
});

const readBalance = async (userId, transaction) => {
  const fresh = await User.findByPk(userId, { attributes: ['money'], transaction });
  return Number(fresh ? fresh.money : 0) || 0;
};

// 目录 + 当前用户状态：前端不再硬编码价格，也不再自己声明拥有关系。
const listForUser = async (userId) => {
  const user = await User.findByPk(userId, { attributes: USER_ATTRIBUTES });
  if (!user) throw new Error('用户不存在');
  const state = await readState(userId);
  const needLevel = Number(findBenefit('skin_shop').level) || 0;
  const lv = Number(user.lv) || 1;
  return {
    balance: Number(user.money) || 0,
    lv,
    vipLevel: effectiveVipLevel(user),
    needLevel,
    unlocked: lv >= needLevel,
    types: SKIN_TYPES,
    items: SKINS.map((skin) => buildItem(skin, state))
  };
};

// 购买（0 金币的免费装扮也走这里，等价于「领取」）：金额一律取自服务端目录。
const purchase = async (userId, skinId) => {
  const skin = resolveSkin(skinId);

  // 任何购买都要过 Lv.45 门槛——改造前 spend=0 会让这条判定整个被跳过。
  await levelService.requireLevel(userId, 'skin_shop');

  const transaction = await sequelize.transaction();
  try {
    // 锁住用户行：并发重复提交同一装扮时，第二个请求进来已能看到 owned，不会二次扣款。
    const lock = transaction.LOCK ? transaction.LOCK.UPDATE : undefined;
    const user = await User.findByPk(userId, { attributes: USER_ATTRIBUTES, transaction, lock });
    if (!user) throw new Error('用户不存在');

    const state = await readState(userId, transaction);
    if (isOwned(skin, state)) {
      markUsing(state, skin);
      await writeState(userId, state, transaction);
      const balance = await readBalance(userId, transaction);
      await transaction.commit();
      return { skin, charged: 0, alreadyOwned: true, balance };
    }

    const vipLevel = effectiveVipLevel(user);
    if (skin.vipOnly && vipLevel < skin.vipLevel) {
      throw businessError('SKIN_VIP_REQUIRED', `需要 VIP${skin.vipLevel} 及以上才可购买`, {
        needVipLevel: skin.vipLevel,
        currentVipLevel: vipLevel
      });
    }

    const price = Number(skin.price) || 0;
    if (price > 0) {
      // 条件扣减（WHERE money >= price）：扣款与所有权写入同生共死，失败整体回滚。
      const decreased = await User.decrement('money', {
        by: price,
        where: { id: userId, money: { [Op.gte]: price } },
        transaction
      });
      if (affectedCount(decreased) !== 1) {
        throw businessError('INSUFFICIENT_BALANCE', '金币不足，请先充值', {
          price,
          balance: Number(user.money) || 0
        });
      }
    }

    markUsing(state, skin);
    await writeState(userId, state, transaction);
    const balance = await readBalance(userId, transaction);
    await transaction.commit();
    logger.info(`[装扮] 用户 ${userId} 获得 ${skin.key}，实付 ${price}`);
    return { skin, charged: price, alreadyOwned: false, balance };
  } catch (error) {
    if (transaction.finished !== 'commit') {
      try { await transaction.rollback(); } catch (rollbackError) { /* 已回滚 */ }
    }
    throw error;
  }
};

// 切换已拥有的装扮：不扣款，因此不要求 Lv.45（沿用「切换已有装扮不该被门槛挡住」的口径）。
const use = async (userId, skinId) => {
  const skin = resolveSkin(skinId);
  const transaction = await sequelize.transaction();
  try {
    const state = await readState(userId, transaction);
    if (!isOwned(skin, state)) {
      throw businessError('SKIN_NOT_OWNED', '尚未拥有该装扮，请先购买');
    }
    markUsing(state, skin);
    await writeState(userId, state, transaction);
    const balance = await readBalance(userId, transaction);
    await transaction.commit();
    return { skin, charged: 0, alreadyOwned: true, balance };
  } catch (error) {
    if (transaction.finished !== 'commit') {
      try { await transaction.rollback(); } catch (rollbackError) { /* 已回滚 */ }
    }
    throw error;
  }
};

module.exports = {
  STATE_KEY,
  SKIN_TYPES,
  SKINS,
  listForUser,
  purchase,
  use,
  sanitizeState,
  effectiveVipLevel,
  isBusinessError,
  BUSINESS_ERROR_CODES
};
