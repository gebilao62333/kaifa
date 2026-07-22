const { IncomeRecord, Withdraw, ExpenseRecord } = require('../models');
const { CURRENCY_UNIT, calculateWithdrawFee } = require('../utils/currency');

// 收入来源元信息（与前端一致，按实际业务构成，不编造）
const SOURCE_META = {
  order: { name: '接单', icon: '🎮', bgColor: 'linear-gradient(135deg, #667eea, #764ba2)' },
  voice: { name: '语音聊天', icon: '💬', bgColor: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  video: { name: '视频聊天', icon: '📹', bgColor: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  gift: { name: '礼物', icon: '🎁', bgColor: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  redpacket: { name: '红包', icon: '🧧', bgColor: 'linear-gradient(135deg, #ff6b6b, #ff8e53)' },
  invite: { name: '邀请返现', icon: '🤝', bgColor: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  album: { name: '相册付费查看', icon: '📷', bgColor: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' }
};

const WITHDRAW_MIN = 100; // 最低提现金额（与礼物提现保持一致）

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

// 取该用户的钱包渠道提现总额（已申请即扣减，与前端"申请即扣减"一致）
const sumWalletWithdraw = async (userId) => {
  const { rows } = await Withdraw.findAndCountAll({ where: { user_id: userId } });
  return rows
    .map(normalizeWithdraw)
    .filter((w) => w.channel === 'wallet')
    .reduce((sum, w) => sum + Number(w.amount), 0);
};

const getIncomeRecords = async (userId, { page = 1, pageSize = 50 } = {}) => {
  const all = await IncomeRecord.findAll({ where: { user_id: userId }, order: [['create_time', 'DESC']] });
  const total = all.length;
  const start = (page - 1) * pageSize;
  const rows = all.slice(start, start + pageSize).map((r) => {
    const rec = toPlain(r);
    return {
      id: rec.id,
      icon: rec.icon,
      title: rec.source_name,
      desc: rec.remark || '',
      time: toHM(rec.create_time),
      amount: Number(rec.amount),
      bgColor: rec.bg_color
    };
  });
  return { list: rows, total, page: Number(page), pageSize: Number(pageSize) };
};

// 按来源聚合，供"总资产构成"弹层使用
const getIncomeBreakdown = async (userId) => {
  const all = await IncomeRecord.findAll({ where: { user_id: userId } });
  const map = new Map();
  let total = 0;
  for (const r of all) {
    const rec = toPlain(r);
    const amt = Number(rec.amount);
    const st = rec.source_type;
    total += amt;
    if (!map.has(st)) {
      const meta = SOURCE_META[st] || { name: rec.source_name, icon: rec.icon, bgColor: rec.bg_color };
      map.set(st, { sourceType: st, name: meta.name, icon: meta.icon, bgColor: meta.bgColor, amount: 0 });
    }
    map.get(st).amount += amt;
  }
  const list = [...map.values()]
    .map((x) => ({ ...x, percent: total ? Math.round((x.amount / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.amount - a.amount);
  return { list, total: Math.round(total * 100) / 100 };
};

// 总资产 = 累计收入 - 已提现（钱包渠道）
const getWalletOverview = async (userId) => {
  const all = await IncomeRecord.findAll({ where: { user_id: userId } });
  const grossIncome = all.reduce((sum, r) => sum + Number(toPlain(r).amount), 0);

  const startOfTodayMs = new Date().setHours(0, 0, 0, 0); // 当日 00:00
  const todayIncome = all
    .filter((r) => toMs(toPlain(r).create_time) >= startOfTodayMs)
    .reduce((sum, r) => sum + Number(toPlain(r).amount), 0);

  const totalWithdraw = await sumWalletWithdraw(userId);
  const totalAssets = Math.max(0, Math.round((grossIncome - totalWithdraw) * 100) / 100);

  const allExpense = await ExpenseRecord.findAll({ where: { user_id: userId } });
  const todayExpense = allExpense
    .filter((r) => toMs(toPlain(r).create_time) >= startOfTodayMs)
    .reduce((sum, r) => sum + Number(toPlain(r).amount), 0);

  return {
    totalAssets,
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
  const all = await ExpenseRecord.findAll({ where: { user_id: userId }, order: [['create_time', 'DESC']] });
  const total = all.length;
  const start = (page - 1) * pageSize;
  const rows = all.slice(start, start + pageSize).map((r) => {
    const rec = toPlain(r);
    return {
      id: rec.id,
      icon: rec.icon,
      title: rec.source_name,
      desc: rec.remark || '',
      time: toHM(rec.create_time),
      amount: Number(rec.amount),
      bgColor: rec.bg_color,
      sourceType: rec.source_type
    };
  });
  const totalExpense = all.reduce((s, r) => s + Number(toPlain(r).amount), 0);
  const startOfTodayMs = new Date().setHours(0, 0, 0, 0);
  const todayExpense = all
    .filter((r) => toMs(toPlain(r).create_time) >= startOfTodayMs)
    .reduce((s, r) => s + Number(toPlain(r).amount), 0);
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
  const all = await ExpenseRecord.findAll({ where: { user_id: userId } });
  const totalExpense = all.reduce((s, r) => s + Number(toPlain(r).amount), 0);
  const startOfTodayMs = new Date().setHours(0, 0, 0, 0);
  const todayExpense = all
    .filter((r) => toMs(toPlain(r).create_time) >= startOfTodayMs)
    .reduce((s, r) => s + Number(toPlain(r).amount), 0);
  return {
    totalExpense: Math.round(totalExpense * 100) / 100,
    todayExpense: Math.round(todayExpense * 100) / 100,
    currencyUnit: CURRENCY_UNIT
  };
};

const getWithdrawRecords = async (userId) => {
  const { rows } = await Withdraw.findAndCountAll({ where: { user_id: userId } });
  return rows
    .map(normalizeWithdraw)
    .filter((w) => w.channel === 'wallet')
    .sort((a, b) => b.createTime - a.createTime);
};

// 从总资产提现：记录提现单，可用余额随"累计收入-已提现"自动减少
const applyWithdraw = async (userId, { amount, type = 1, account = '' }) => {
  const amountNum = Number(amount);

  if (!amountNum || amountNum <= 0) {
    throw new Error('提现金额必须大于0');
  }
  if (amountNum < WITHDRAW_MIN) {
    throw new Error(`最低提现金额为 ${WITHDRAW_MIN} ${CURRENCY_UNIT}`);
  }

  const overview = await getWalletOverview(userId);
  if (amountNum > overview.totalAssets + 1e-9) {
    throw new Error('可提现余额不足');
  }

  const fee = calculateWithdrawFee(amountNum);
  const netAmount = Math.round((amountNum - fee) * 100) / 100;
  const typeInt = parseInt(type, 10) || 1;

  await Withdraw.create({
    user_id: userId,
    // 兼容 mock(使用 amount) 与 real(使用 money) 两种形态
    amount: amountNum,
    money: amountNum,
    pay_money: netAmount,
    shouxufei: fee,
    type: typeInt,
    channel: 'wallet',
    account,
    is_check: 0,
    state: 'pending',
    currency: CURRENCY_UNIT,
    create_time: Math.floor(Date.now() / 1000)
  });

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
