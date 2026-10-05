const { User, Post, GameOrder } = require('../models');
const { Op } = require('sequelize');
const { getTimestamp } = require('../utils/helper');
const { affectedCount } = require('../utils/sql');
const logger = require('../utils/logger');
const {
  expToNextLevel,
  VIP_BOOST,
  vipBoost,
  applyExp,
  BENEFITS,
  findBenefit,
  EXP_SOURCES
} = require('../utils/level');

const TAG = '[等级]';

// 加经验：按 VIP 等级乘倍率，跨级时溢出结转。
// 经验是业务成功的副作用，调用方应在事务提交后调用并自行决定是否吞掉异常。
const addExp = async (userId, source, baseOverride = null) => {
  const base = baseOverride === null || baseOverride === undefined
    ? EXP_SOURCES[source]
    : Number(baseOverride);
  if (!Number.isFinite(base) || base <= 0) {
    throw new Error(`无效的经验来源: ${source}`);
  }

  const transaction = await User.sequelize.transaction();
  try {
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      throw new Error('用户不存在');
    }
    const boost = vipBoost(user.vip_lv);
    const amount = Math.max(1, Math.round(base * boost));
    const next = applyExp(user.lv, user.exp, amount);
    await user.update({ lv: next.lv, exp: next.exp }, { transaction });
    await transaction.commit();

    logger.info(`${TAG} 用户 ${user.id} ${source} +${amount}（基础 ${base} × 倍率 ${boost}）→ Lv.${next.lv} exp=${next.exp}${next.leveledUp ? '（升级）' : ''}`);
    return {
      lv: next.lv,
      exp: next.exp,
      added: amount,
      leveledUp: next.leveledUp,
      boost
    };
  } catch (error) {
    if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    throw error;
  }
};

// 每日签到：同一自然日只能领一次
const checkIn = async (userId) => {
  const user = await User.findByPk(userId, { attributes: ['id', 'last_check_in_time'] });
  if (!user) {
    throw new Error('用户不存在');
  }

  const now = getTimestamp();
  const todayStart = Math.floor(now / 86400) * 86400;

  // 原子占位：只有把「今日 0 点之前」的签到时间改成当前时间才算抢到这次机会，
  // 两个并发请求不会都通过日期判断后各发一份经验。
  const claimed = affectedCount(await User.update(
    { last_check_in_time: now },
    { where: { id: userId, last_check_in_time: { [Op.lt]: todayStart } } }
  ));
  if (claimed !== 1) {
    throw new Error('今日已签到');
  }

  const result = await addExp(userId, 'daily_check_in');
  return { ...result, alreadyCheckedIn: false };
};

const buildBenefits = (lv) => BENEFITS.map(b => ({
  key: b.key,
  name: b.name,
  level: b.level,
  unlocked: b.level <= (Number(lv) || 1)
}));

const getInfo = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('用户不存在');
  }
  const lv = Number(user.lv) || 1;
  const exp = Math.max(0, Number(user.exp) || 0);
  const next = expToNextLevel(lv);
  return {
    lv,
    exp,
    nextLevelExp: next,
    remainExp: Math.max(0, next - exp),
    percent: Math.min(100, Math.round((exp / next) * 100)),
    vip: !!user.vip && (!user.vip_expire_time || user.vip_expire_time > getTimestamp()),
    vipLevel: Number(user.vip_lv) || 0,
    boost: vipBoost(user.vip_lv),
    checkedInToday: Math.floor(getTimestamp() / 86400) === Math.floor((user.last_check_in_time || 0) / 86400),
    expSources: EXP_SOURCES,
    boostTable: VIP_BOOST,
    benefits: buildBenefits(lv)
  };
};

// 权益门槛：等级不足直接抛错，由控制层转成 422
const requireLevel = async (userId, benefitKey) => {
  const benefit = findBenefit(benefitKey);
  if (!benefit) {
    throw new Error(`未知的权益项: ${benefitKey}`);
  }
  const user = await User.findByPk(userId, { attributes: ['id', 'lv'] });
  if (!user) {
    throw new Error('用户不存在');
  }
  const lv = Number(user.lv) || 1;
  if (lv < benefit.level) {
    const err = new Error(`等级不足：${benefit.name}需要 Lv.${benefit.level}（当前 Lv.${lv}）`);
    err.code = 'LEVEL_NOT_ENOUGH';
    err.needLevel = benefit.level;
    throw err;
  }
  return user;
};

const getLevelOf = async (userId) => {
  const user = await User.findByPk(userId, { attributes: ['id', 'lv'] });
  return Number(user?.lv) || 1;
};

// 非抛错版本：用于「额度上限取哪一档」这类需要判断而不中断请求的场景
const canUse = async (userId, benefitKey) => {
  const benefit = findBenefit(benefitKey);
  if (!benefit) {
    return true;
  }
  const lv = await getLevelOf(userId);
  return lv >= benefit.level;
};

/**
 * 历史经验回填：门槛一旦生效，存量用户 lv 全为 1 会被直接锁死，
 * 故首次运行按已有行为折算一次基线经验（不乘 VIP 倍率）。
 * 幂等：仅处理 level_backfill_time=0 且尚未被新链路记过经验的账号。
 */
const backfillExperience = async ({ batchSize = 200, dryRun = false } = {}) => {
  const pending = await User.findAll({
    where: { level_backfill_time: 0, exp: 0 },
    attributes: ['id', 'lv', 'exp', 'real_name_status'],
    order: [['id', 'ASC']],
    limit: batchSize
  });

  let processed = 0;
  let changed = 0;

  for (const user of pending) {
    const [orderCount, postCount] = await Promise.all([
      GameOrder.count({ where: { target_user_id: user.id, status: 3 } }),
      Post.count({ where: { user_id: user.id } })
    ]);
    const baseline = orderCount * EXP_SOURCES.order_completed
      + postCount * EXP_SOURCES.post_created
      + (Number(user.real_name_status) === 2 ? EXP_SOURCES.real_name_verified : 0);
    const next = applyExp(1, 0, baseline);
    if (next.lv > 1 || next.exp > 0) changed += 1;

    if (!dryRun) {
      await user.update({
        lv: next.lv,
        exp: next.exp,
        level_backfill_time: getTimestamp()
      });
    }
    processed += 1;
  }

  return { processed, changed, remaining: processed === batchSize };
};

module.exports = {
  addExp,
  checkIn,
  getInfo,
  requireLevel,
  canUse,
  getLevelOf,
  backfillExperience
};
