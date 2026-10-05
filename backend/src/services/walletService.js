const { Op } = require('sequelize');
const { Withdraw, User } = require('../models');
const sequelize = require('../config/mysql');
const { CURRENCY_UNIT, calculateWithdrawFee } = require('../utils/currency');
const { assertFiniteNumber, affectedCount } = require('../utils/sql');

// 收入来源元信息（与前端一致，按实际业务构成，不编造）
const SOURCE_META = {
  order: { name: '接单', icon: '🎮', bgColor: 'linear-gradient(135deg, #667eea, #764ba2)' },
  voice: { name: '语音聊天', icon: '💬', bgColor: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  video: { name: '视频聊天', icon: '📹', bgColor: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  gift: { name: '礼物', icon: '🎁', bgColor: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  redpacket: { name: '红包', icon: '🧧', bgColor: 'linear-gradient(135deg, #ff6b6b, #ff8e53)' },
  invite: { name: '邀请返现', icon: '🤝', bgColor: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  album: { name: '相册付费查看', icon: '📷', bgColor: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
  post: { name: '私密帖解锁', icon: '🔒', bgColor: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' }
};

// 支出来源元信息
const EXPENSE_META = {
  game: { name: '陪玩订单', icon: '🎮', bgColor: 'linear-gradient(135deg, #667eea, #764ba2)' },
  vip: { name: '开通会员', icon: '👑', bgColor: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  post: { name: '私密内容', icon: '🔒', bgColor: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' }
};

const WITHDRAW_MIN = 100; // 最低提现金额（与礼物提现保持一致）

// xn_withdraw 收款信息列长：name(50)/account(255)/bank(255)/image(255)。
// 收款码必须是上传后返回的图片链接：整段 base64 dataURL 远超 255，
// 严格模式报 Data too long 使提现失败，非严格模式静默截断导致审核端二维码不可用。
const WITHDRAW_FIELD_LIMITS = {
  name: ['收款人姓名', 50],
  account: ['收款账号', 255],
  bank: ['开户银行', 255],
  image: ['收款码图片', 255]
};

const checkWithdrawFieldLengths = (fields) => {
  for (const [key, raw] of Object.entries(fields)) {
    const [label, max] = WITHDRAW_FIELD_LIMITS[key];
    const value = raw === null || raw === undefined ? '' : String(raw);
    if (key === 'image' && value.startsWith('data:')) {
      throw new Error('收款码请先上传图片，再提交图片链接');
    }
    if (value.length > max) {
      throw new Error(`${label}过长，请控制在 ${max} 个字符以内`);
    }
  }
};

// 收入流水聚合：从各真实业务表实时汇总用户收入（替代不存在的 xn_income_record）
const collectIncomeRecords = async (userId) => {
  const records = [];
  const push = (rows, sourceType, remark) => {
    for (const r of rows) {
      const amt = Number(r.amount);
      if (!amt || amt <= 0) continue;
      records.push({
        id: `${sourceType}-${r.id}`,
        userId,
        sourceType,
        remark,
        amount: amt,
        createTime: r.create_time || r.pay_time || 0
      });
    }
  };

  // 1) 接单：作为陪玩接单，仅统计已完成订单；金额取订单 amount（= 陪玩师到手分成，完成时写入）
  const [orders] = await sequelize.query(
    "SELECT id, amount, create_time FROM xn_game_order WHERE target_user_id = :uid AND status = 3",
    { replacements: { uid: userId } }
  );
  push(orders, 'order', '接单收入');

  // 2) 礼物：收到礼物（xn_gift_log.user_id 为收款人，金额列名为 totalmoney）
  const [gifts] = await sequelize.query(
    'SELECT id, totalmoney AS amount, create_time FROM xn_gift_log WHERE user_id = :uid',
    { replacements: { uid: userId } }
  );
  push(gifts, 'gift', '收到礼物');

  // 3) 红包：抢到红包（真实列名为 amount）
  const [packets] = await sequelize.query(
    'SELECT id, amount, create_time FROM xn_red_packet_log WHERE user_id = :uid',
    { replacements: { uid: userId } }
  );
  push(packets, 'redpacket', '抢到红包');

  // 4) 语音/视频通话：作为被叫方（主播）的通话收入
  //    真实列：xn_call_billing.call_id / total_amount，xn_call_record.call_type / callee_id
  const [calls] = await sequelize.query(
    `SELECT b.id, b.total_amount AS amount, b.create_time, r.call_type
     FROM xn_call_billing b
     JOIN xn_call_record r ON b.call_id = r.id
     WHERE r.callee_id = :uid AND b.status = 1`,
    { replacements: { uid: userId } }
  );
  for (const r of calls) {
    const amt = Number(r.amount);
    if (!amt || amt <= 0) continue;
    const st = Number(r.call_type) === 2 ? 'video' : 'voice';
    records.push({
      id: `${st}-${r.id}`,
      userId,
      sourceType: st,
      remark: st === 'video' ? '视频通话收入' : '语音通话收入',
      amount: amt,
      createTime: r.create_time || 0
    });
  }

  // 5) 私密帖解锁：作为帖子作者，收到他人付费解锁的收入
  const [postUnlocks] = await sequelize.query(
    `SELECT pu.id, pu.price AS amount, pu.create_time
     FROM xn_post_unlock pu
     JOIN xn_post p ON pu.post_id = p.id
     WHERE p.user_id = :uid`,
    { replacements: { uid: userId } }
  );
  push(postUnlocks, 'post', '私密帖解锁收入');

  return records;
};

// 支出流水聚合：用户消费（充值属于人民币兑换金币，不计入金币支出）
const collectExpenseRecords = async (userId) => {
  const records = [];
  const push = (rows, sourceType, remark) => {
    for (const r of rows) {
      const amt = Number(r.amount);
      if (!amt || amt <= 0) continue;
      records.push({
        id: `${sourceType}-${r.id}`,
        userId,
        sourceType,
        remark,
        amount: amt,
        createTime: r.create_time || r.pay_time || 0
      });
    }
  };

  // 1) 请陪玩下单：下单即扣款，故统计进行中(2)与已完成(3)；金额取订单 total_price（实付）
  const [orders] = await sequelize.query(
    "SELECT id, total_price AS amount, create_time FROM xn_game_order WHERE user_id = :uid AND status IN (2, 3)",
    { replacements: { uid: userId } }
  );
  push(orders, 'game', '陪玩订单');

  // 2) 开通 VIP（真实列名为 price）
  const [vips] = await sequelize.query(
    'SELECT id, price AS amount, pay_time AS create_time FROM xn_vip_order WHERE user_id = :uid AND status = 1',
    { replacements: { uid: userId } }
  );
  push(vips, 'vip', '开通会员');

  // 3) 解锁私密帖
  const [unlocks] = await sequelize.query(
    'SELECT id, price AS amount, create_time FROM xn_post_unlock WHERE user_id = :uid',
    { replacements: { uid: userId } }
  );
  push(unlocks, 'post', '私密内容');

  return records;
};

// 将记录统一为普通对象（兼容 sequelize 实例与 mock 对象）
const toPlain = (row) => (row && typeof row.get === 'function' ? row.get({ plain: true }) : row);

// 时间戳统一为毫秒
const toMs = (t) => {
  if (!t) return 0;
  if (t instanceof Date) return t.getTime();
  const n = Number(t);
  return n > 1e11 ? n : n * 1000; // 秒 -> 毫秒
};

const toHM = (t) => {
  const d = new Date(toMs(t));
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

// 提现记录统一结构（兼容 gift / wallet 两种渠道、real/mock 两种形态）
const normalizeWithdraw = (row) => {
  const w = toPlain(row);
  const ms = toMs(w.create_time);
  const status = w.status
    || (w.is_check === 0 ? 'pending' : w.is_check === 1 ? 'approved' : w.is_check === 2 ? 'rejected' : w.state || 'pending');
  return {
    id: w.id,
    userId: w.user_id,
    amount: Number(w.amount ?? w.money ?? 0),
    type: w.type,
    account: w.account || w.bank || '',
    channel: w.channel || 'gift',
    status,
    createTime: ms
  };
};

// 取该用户的提现总额（已申请即扣减，与前端"申请即扣减"一致）
const sumWalletWithdraw = async (userId) => {
  const { rows } = await Withdraw.findAndCountAll({
    where: { user_id: userId },
    attributes: ['id', 'user_id', 'amount', 'status', 'create_time']
  });
  return rows
    .filter((w) => Number(w.status) !== 2) // 排除已拒绝的提现
    .reduce((sum, w) => sum + Number(w.amount), 0);
};

const getIncomeRecords = async (userId, { page = 1, pageSize = 50 } = {}) => {
  const all = await collectIncomeRecords(userId);
  all.sort((a, b) => b.createTime - a.createTime);
  const total = all.length;
  const start = (page - 1) * pageSize;
  const rows = all.slice(start, start + pageSize).map((rec) => {
    const meta = SOURCE_META[rec.sourceType] || {};
    return {
      id: rec.id,
      icon: meta.icon || '💰',
      title: meta.name || rec.remark,
      desc: rec.remark || '',
      time: toHM(rec.createTime),
      amount: rec.amount,
      bgColor: meta.bgColor || ''
    };
  });
  return { list: rows, total, page: Number(page), pageSize: Number(pageSize) };
};

// 按来源聚合，供"总资产构成"弹层使用
const getIncomeBreakdown = async (userId) => {
  const all = await collectIncomeRecords(userId);
  const map = new Map();
  let total = 0;
  for (const rec of all) {
    const amt = Number(rec.amount);
    const st = rec.sourceType;
    total += amt;
    if (!map.has(st)) {
      const meta = SOURCE_META[st] || { name: rec.remark, icon: '💰', bgColor: '' };
      map.set(st, { sourceType: st, name: meta.name, icon: meta.icon, bgColor: meta.bgColor, amount: 0 });
    }
    map.get(st).amount += amt;
  }
  const list = [...map.values()]
    .map((x) => ({ ...x, percent: total ? Math.round((x.amount / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.amount - a.amount);
  return { list, total: Math.round(total * 100) / 100 };
};

// 总资产口径 = 用户真实余额 xn_user.money（审计 C-2）。
// 历史实现用「累计收入 - 已申请提现」派生总资产：既不含已消费（下单/VIP/解锁），也不含充值余额，
// 于是同一笔收入可以「花完再提一次」，且申请提现时并不从 money 扣款，属于资损。
// 收入聚合（grossIncome / todayIncome）与提现聚合（totalWithdraw）保留作统计展示，不再参与余额判定。
const getWalletOverview = async (userId) => {
  const user = await User.findByPk(userId, { attributes: ['id', 'money', 'gift_money'] });
  if (!user) {
    throw new Error('用户不存在');
  }

  const all = await collectIncomeRecords(userId);
  const grossIncome = all.reduce((sum, r) => sum + Number(r.amount), 0);

  const startOfTodayMs = new Date().setHours(0, 0, 0, 0); // 当日 00:00
  const todayIncome = all
    .filter((r) => toMs(r.createTime) >= startOfTodayMs)
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const totalWithdraw = await sumWalletWithdraw(userId);
  // DECIMAL 列在 mysql2 下回传字符串，统一 Number() 兜底为 0
  const balance = Math.max(0, Math.round((Number(user.money) || 0) * 100) / 100);
  const giftMoney = Math.max(0, Math.round((Number(user.gift_money) || 0) * 100) / 100);

  const allExpense = await collectExpenseRecords(userId);
  const todayExpense = allExpense
    .filter((r) => toMs(r.createTime) >= startOfTodayMs)
    .reduce((sum, r) => sum + Number(r.amount), 0);

  return {
    totalAssets: balance,
    balance,
    giftMoney,
    grossIncome: Math.round(grossIncome * 100) / 100,
    totalWithdraw: Math.round(totalWithdraw * 100) / 100,
    todayIncome: Math.round(todayIncome * 100) / 100,
    todayExpense: Math.round(todayExpense * 100) / 100,
    currencyUnit: CURRENCY_UNIT,
    minWithdraw: WITHDRAW_MIN
  };
};

// 支出明细列表（与收入明细对称）
const getExpenseRecords = async (userId, { page = 1, pageSize = 50 } = {}) => {
  const all = await collectExpenseRecords(userId);
  all.sort((a, b) => b.createTime - a.createTime);
  const total = all.length;
  const start = (page - 1) * pageSize;
  const rows = all.slice(start, start + pageSize).map((rec) => {
    const meta = EXPENSE_META[rec.sourceType] || {};
    return {
      id: rec.id,
      icon: meta.icon || '💸',
      title: meta.name || rec.remark,
      desc: rec.remark || '',
      time: toHM(rec.createTime),
      amount: rec.amount,
      bgColor: meta.bgColor || '',
      sourceType: rec.sourceType
    };
  });
  const totalExpense = all.reduce((s, r) => s + Number(r.amount), 0);
  const startOfTodayMs = new Date().setHours(0, 0, 0, 0);
  const todayExpense = all
    .filter((r) => toMs(r.createTime) >= startOfTodayMs)
    .reduce((s, r) => s + Number(r.amount), 0);
  return {
    list: rows,
    totalExpense: Math.round(totalExpense * 100) / 100,
    todayExpense: Math.round(todayExpense * 100) / 100,
    total,
    page: Number(page),
    pageSize: Number(pageSize)
  };
};

// 支出总览：支出总额 / 今日支出
const getExpenseOverview = async (userId) => {
  const all = await collectExpenseRecords(userId);
  const totalExpense = all.reduce((s, r) => s + Number(r.amount), 0);
  const startOfTodayMs = new Date().setHours(0, 0, 0, 0);
  const todayExpense = all
    .filter((r) => toMs(r.createTime) >= startOfTodayMs)
    .reduce((s, r) => s + Number(r.amount), 0);
  return {
    totalExpense: Math.round(totalExpense * 100) / 100,
    todayExpense: Math.round(todayExpense * 100) / 100,
    currencyUnit: CURRENCY_UNIT
  };
};

const getWithdrawRecords = async (userId) => {
  const { rows } = await Withdraw.findAndCountAll({
    where: { user_id: userId },
    attributes: ['id', 'user_id', 'amount', 'type', 'account', 'status', 'create_time']
  });
  return rows
    .map(normalizeWithdraw)
    .sort((a, b) => b.createTime - a.createTime);
};

// 从真实余额提现：申请即从 xn_user.money 条件扣减（审计 C-2）
const applyWithdraw = async (userId, { amount, type = 1, account = '', name = '', image = '', bank = '' }) => {
  const amountNum = assertFiniteNumber(amount, '提现金额');

  if (amountNum <= 0) {
    throw new Error('提现金额必须大于0');
  }
  if (amountNum < WITHDRAW_MIN) {
    throw new Error(`最低提现金额为 ${WITHDRAW_MIN} ${CURRENCY_UNIT}`);
  }

  checkWithdrawFieldLengths({ name, account, bank, image });

  const fee = calculateWithdrawFee(amountNum);
  const netAmount = Math.round((amountNum - fee) * 100) / 100;
  const typeInt = parseInt(type, 10) || 1;

  // 审计 C-2：历史实现只把提现单写库，靠「累计收入 - 已申请提现」的派生聚合扣减总资产，
  // xn_user.money 一分未动 —— 用户可把同一笔余额既消费又提现，还能反复发起。
  // 现改为与礼物/管理端一致的「条件扣减 + 影响行数判定」：where 带 money >= amount，
  // 并发下最多扣成功一次，不需要额外行锁（原先的 SELECT ... FOR UPDATE 锁的是用户行，
  // 而余额判断读的是提现表聚合，锁不住判断依据）。
  // 审核拒绝时由 controllers/admin.js rejectWithdraw 原路退回 money。
  const transaction = await sequelize.transaction();
  try {
    const decreaseResult = await User.decrement('money', {
      by: amountNum,
      where: { id: userId, money: { [Op.gte]: amountNum } },
      transaction
    });

    if (affectedCount(decreaseResult) !== 1) {
      // 不在这里 rollback：统一交给下方 catch，避免二次回滚覆盖真实业务错误
      throw new Error('可提现余额不足');
    }

    await Withdraw.create({
      user_id: userId,
      money: amountNum,
      amount: amountNum,
      pay_money: netAmount,
      shouxufei: fee,
      type: typeInt,
      account,
      name: name || '',
      image: image || '',
      bank: bank || '',
      is_check: 0,
      status: 0,
      channel: 'wallet',
      remark: '',
      create_time: Math.floor(Date.now() / 1000),
      update_time: Math.floor(Date.now() / 1000)
    }, { transaction });

    await transaction.commit();
  } catch (e) {
    if (!transaction.finished) {
      try { await transaction.rollback(); } catch (rollbackError) { /* 已回滚 */ }
    }
    throw e;
  }

  return {
    success: true,
    message: '提现申请已提交，请等待审核',
    goldCoins: amountNum,
    fee,
    netAmount,
    currencyUnit: CURRENCY_UNIT
  };
};

module.exports = {
  getIncomeRecords,
  getIncomeBreakdown,
  getWalletOverview,
  getWithdrawRecords,
  applyWithdraw,
  getExpenseRecords,
  getExpenseOverview
};
