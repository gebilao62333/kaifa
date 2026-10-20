const { OrderChong, RechargePackage, Card, User } = require('../models');
const { getTimestamp, generateOrderNo } = require('../utils/helper');
const { CURRENCY_UNIT, validateGoldCoins } = require('../utils/currency');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const crypto = require('crypto');
// 《未完成事项清单》B-10：卡密密码静态加密（与实名 PII 共用 pii 工具；存量明文行透明兼容）
const pii = require('../utils/pii');

// 审计 H-2：支付入账相关业务错误的稳定标识。
// controller 按 code 分流 HTTP 状态码，不靠 message 文案匹配（文案会为体验改写，code 才是契约）。
const PAY_ERRORS = {
  NOT_FOUND: 'PAY_ORDER_NOT_FOUND',
  FORBIDDEN: 'PAY_ORDER_FORBIDDEN',
  UNVERIFIED: 'PAY_ORDER_UNVERIFIED',
  AMOUNT_MISMATCH: 'PAY_ORDER_AMOUNT_MISMATCH',
  SETTLED: 'PAY_ORDER_ALREADY_SETTLED'
};

const payError = (code, message) => Object.assign(new Error(message), { code });

// 下单时上报给支付平台的金额换算（单位：分），与 wechatPayService.createUnifiedOrder 保持一致。
const toCents = (amount) => Math.round(Number(amount) * 100);

const getPackages = async () => {
  const packages = await RechargePackage.findAll({
    where: { status: 1 },
    order: [['sort', 'ASC'], ['id', 'ASC']]
  });
  
  return packages.map(pkg => ({
    id: pkg.id,
    coins: pkg.coins,
    price: Number(pkg.price),
    tag: pkg.hot ? '热门' : '',
    bonus: pkg.bonus_coins || 0,
    name: pkg.name,
    hot: pkg.hot || 0,
    sort: pkg.sort || 0,
    status: pkg.status
  }));
};

const createOrder = async (userId, packageId, payType = 1) => {
  const pkg = await RechargePackage.findByPk(packageId);
  
  if (!pkg || pkg.status !== 1) {
    throw new Error('充值套餐不存在');
  }
  
  // 审计 M13：防重复下单——同一用户对同一金额在 2 分钟内的未支付订单直接复用，
  // 避免用户连点/网络重试在库里堆出一串待支付订单。
  const recentUnpaid = await OrderChong.findOne({
    where: {
      user_id: userId,
      amount: Number(pkg.price),
      status: 0,
      create_time: { [Op.gte]: getTimestamp() - 120 }
    },
    order: [['id', 'DESC']]
  });

  if (recentUnpaid) {
    return {
      orderId: recentUnpaid.id,
      orderNo: recentUnpaid.order_no,
      fiatAmount: Number(recentUnpaid.amount),
      goldCoins: recentUnpaid.coins,
      currencyUnit: CURRENCY_UNIT,
      reused: true
    };
  }

  const orderNo = generateOrderNo();
  
  // xn_order_chong 真实列为 amount(金额)/coins(到账金币，含赠送)，无 cid/money/gold_coins/currency
  const order = await OrderChong.create({
    user_id: userId,
    order_no: orderNo,
    amount: Number(pkg.price),
    coins: Number(pkg.coins) + Number(pkg.bonus_coins || 0),
    pay_type: payType,
    status: 0,
    create_time: getTimestamp()
  });
  
  return {
    orderId: order.id,
    orderNo: order.order_no,
    fiatAmount: Number(pkg.price),
    goldCoins: pkg.coins + (pkg.bonus_coins || 0),
    currencyUnit: CURRENCY_UNIT
  };
};

// 支付订单入账的唯一收口：/wx-notify（微信服务端通知）与 /wx-callback（客户端回执反查后）都走这里。
//
// 审计 H-2 的三个要点：
//   1) 幂等：不能写成「先 findOne 读 status → 再 update」。微信对同一笔订单会并发、多次重发通知，
//      两个请求都能在对方提交前读到 status=0，于是同一笔订单加两次币（重复入账竞态）。
//      这里把「占用订单」收敛成一条带 status=0 条件的原子 UPDATE 并检查影响行数，
//      只有真正抢到的请求才继续加币，抢输的一方拿 affected=0 退出——与卡密核销 consumeCardOnce 同一套做法。
//   2) 金额：入账金币只取我们下单时写进订单的 coins，绝不由回执里的金额或客户端参数推导；
//      另外把平台回传的实付分值与下单应付分值比对，不一致就拒绝入账并留日志，宁可人工核对。
//   3) 校验来源：verification.verified 必须由服务端校验路径显式置真；
//      本地联调（未配置支付参数）走 source='local-unverified' 且不传 paidCents，因此跳过金额比对。
const settleRechargeOrder = async (order, verification = {}) => {
  if (verification.verified !== true) {
    throw payError(PAY_ERRORS.UNVERIFIED, '支付结果未经服务端校验，拒绝入账');
  }

  const paidCents = verification.paidCents;
  if (paidCents !== undefined && paidCents !== null) {
    const payableCents = toCents(order.amount);
    if (Number(paidCents) !== payableCents) {
      logger.error(`[pay] 实付金额与订单应付不一致 orderNo=${order.order_no} paid=${paidCents} payable=${payableCents}`);
      throw payError(PAY_ERRORS.AMOUNT_MISMATCH, '支付金额与订单不一致，已拒绝入账');
    }
  }

  return User.sequelize.transaction(async (transaction) => {
    const now = getTimestamp();
    const [affected] = await OrderChong.update(
      { status: 1, pay_time: now, update_time: now },
      { where: { id: order.id, status: 0 }, transaction }
    );

    if (!affected) {
      // 已被另一笔并发请求/上一次通知入账：钱只加过一次，对调用方是幂等成功而非故障
      throw payError(PAY_ERRORS.SETTLED, '订单已入账');
    }

    await User.increment('money', {
      by: Number(order.coins) || 0,
      where: { id: order.user_id },
      transaction
    });

    logger.info(
      `[pay] 充值入账完成 orderNo=${order.order_no} coins=${order.coins}` +
      ` source=${verification.source || 'unknown'}` +
      // 平台流水号只做日志线索：xn_order_chong 没有可落库的支付流水列（见文档遗留项）
      (verification.transactionId ? ` platformTxn=${verification.transactionId}` : '')
    );
    return { orderNo: order.order_no, coins: Number(order.coins) || 0, duplicated: false };
  });
};

// 客户端支付回执入账（POST /api/pay/wx-callback）。
// 审计 H-2 归属校验：原先这条路由不带登录态、也不看订单属于谁，
// 任何知道（或枚举到）订单号的人都能替别人「确认支付」并触发入账流程。
// 现在要求：调用者本人就是下单用户，且支付结果已由 controller 经服务端反查确认（verification）。
const wxPayCallback = async (userId, payNo, verification = {}) => {
  const order = await OrderChong.findOne({ where: { order_no: payNo } });

  if (!order) {
    throw payError(PAY_ERRORS.NOT_FOUND, '订单不存在');
  }
  if (Number(order.user_id) !== Number(userId)) {
    throw payError(PAY_ERRORS.FORBIDDEN, '无权处理该订单');
  }

  return settleRechargeOrder(order, verification);
};

// 按订单号操作支付平台的接口（反查 / 关单）同样要先确认订单归属，
// 否则任何人都能用 /wx-query 探测他人订单的支付状态、用 /wx-close 关掉他人的待支付订单。
const requireOwnedOrder = async (userId, orderNo) => {
  const order = await OrderChong.findOne({ where: { order_no: orderNo } });

  if (!order) {
    throw payError(PAY_ERRORS.NOT_FOUND, '订单不存在');
  }
  if (Number(order.user_id) !== Number(userId)) {
    throw payError(PAY_ERRORS.FORBIDDEN, '无权操作该订单');
  }

  return order;
};

// 审计 H-2：订单状态查询此前不带 user_id，任意登录用户凭订单号即可读他人订单的支付状态。
const getOrderStatus = async (userId, orderNo) => {
  const order = await OrderChong.findOne({
    where: { order_no: orderNo, user_id: userId }
  });
  
  if (!order) {
    throw payError(PAY_ERRORS.NOT_FOUND, '订单不存在');
  }
  
  return {
    orderNo: order.order_no,
    status: order.status,
    payTime: order.pay_time
  };
};

// 卡密入账金额：优先取金币数（coin_amount），未设置时回落到面值。
// 管理端按充值套餐生成卡密时 faceValue=套餐价、coinAmount=套餐金币数，二者不等，必须用金币数入账。
const resolveCardCoins = (card) => {
  const coins = Math.floor(Number(card.coin_amount) || 0);
  return coins > 0 ? coins : Math.floor(Number(card.value) || 0);
};

// 审计 C-3：卡号+密码是唯一的兑现凭证，必须两者都校验。
//   - 只比卡号（原实现）等于「拿到卡号即可入账」，密码形同虚设；
//   - 卡号/密码不匹配一律回同一条文案，避免免登录枚举出「哪些卡号存在」；
//   - 比对先做 sha256 摘要再 timingSafeEqual，不直接 `===` 比明文（长度与逐字符早退都会泄露信息）。
// B-10 起卡密密码静态加密存于 xn_card.card_password（管理端列表展示时解密），
// 这里先解密再恒定时间比较；存量明文行由 pii.decryptField 原样返回，行为与历史一致。
const CARD_CREDENTIAL_ERROR = '卡号或密码错误';

const safeCompare = (a, b) => {
  const digestA = crypto.createHash('sha256').update(String(a)).digest();
  const digestB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(digestA, digestB);
};

// 按卡号取卡并校验密码；返回 null 表示凭证无效（不存在或密码错）。
const findCardByCredentials = async (cardCode, cardPwd) => {
  const code = typeof cardCode === 'string' ? cardCode.trim() : '';
  const pwd = typeof cardPwd === 'string' ? cardPwd.trim() : '';
  if (!code || !pwd) {
    throw new Error('请输入卡号和密码');
  }

  const card = await Card.findOne({ where: { card_no: code } });
  if (!card) {
    return null;
  }
  if (!card.card_password) {
    return null;
  }
  // 密文先解密；若密钥缺失导致解密为空，按「密码错误」拒绝（不泄露内部原因）
  const storedPwd = pii.decryptField(card.card_password);
  if (!storedPwd || !safeCompare(storedPwd, pwd)) {
    return null;
  }
  return card;
};

const validateCard = async (cardCode, cardPwd) => {
  const card = await findCardByCredentials(cardCode, cardPwd);
  if (!card) {
    throw new Error(CARD_CREDENTIAL_ERROR);
  }

  if (card.status !== 0) {
    throw new Error('该卡密已被使用或已禁用');
  }

  return {
    cardId: card.id,
    faceValue: Number(card.value),
    coinAmount: resolveCardCoins(card)
  };
};

// 原子核销卡密并给用户入账。
//
// 安全要点：不能写成「先 findOne 读 status → 再 update」——那样两个并发请求会
// 同时通过 status===0 检查，各自执行一次 User.increment，同一张卡被重复入账（刷币漏洞）。
// 这里把占用动作收敛成一条带 status=0 条件的原子 UPDATE，并检查影响行数：
// 只有真正把 status 从 0 改成 1 的那个请求才会入账，其余请求 affected=0 直接失败。
const consumeCardOnce = async (userId, card, usedMessage) => {
  const amount = resolveCardCoins(card);
  return User.sequelize.transaction(async (transaction) => {
    const [affected] = await Card.update(
      { status: 1, use_time: getTimestamp(), use_user_id: userId },
      { where: { id: card.id, status: 0 }, transaction }
    );

    if (!affected) {
      throw new Error(usedMessage);
    }

    await User.increment('money', {
      by: amount,
      where: { id: userId },
      transaction
    });

    return { amount };
  });
};

const useCard = async (userId, cardCode, cardPwd) => {
  const card = await findCardByCredentials(cardCode, cardPwd);
  if (!card) {
    throw new Error(CARD_CREDENTIAL_ERROR);
  }

  if (card.status !== 0) {
    throw new Error('该卡密已被使用或已禁用');
  }

  return consumeCardOnce(userId, card, '该卡密已被使用或已禁用');
};

// 通过 25 位密钥一键充值（不需要卡号+密码）
const redeemCardByKey = async (userId, key) => {
  const card = await Card.findOne({
    where: { card_key: key }
  });

  if (!card) {
    throw new Error('密钥无效，请检查是否输入正确');
  }

  if (card.status !== 0) {
    throw new Error('该密钥已被使用');
  }

  return consumeCardOnce(userId, card, '该密钥已被使用');
};

const getWalletBalance = async (userId) => {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  return {
    balance: Number(user.money),
    giftMoney: Number(user.gift_money),
    currencyUnit: CURRENCY_UNIT
  };
};

const rechargeWallet = async (userId, amount, source = 'admin') => {
  const transaction = await User.sequelize.transaction();
  
  try {
    await User.increment('money', {
      by: amount,
      where: { id: userId },
      transaction
    });
    
    await transaction.commit();
    
    return {
      success: true,
      amount,
      source
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getPaymentHistory = async (userId, page, pageSize) => {
  const { offset, limit } = require('../utils/helper').parseQuery({ page, pageSize });
  
  const { count, rows } = await OrderChong.findAndCountAll({
    where: { user_id: userId },
    offset,
    limit,
    order: [['create_time', 'DESC']]
  });
  
  const history = rows.map(order => ({
    orderId: order.id,
    orderNo: order.order_no,
    amount: Number(order.amount),
    goldCoins: order.coins,
    payType: order.pay_type,
    status: order.status,
    createTime: order.create_time,
    payTime: order.pay_time
  }));
  
  return {
    total: count,
    list: history
  };
};

module.exports = {
  PAY_ERRORS,
  settleRechargeOrder,
  requireOwnedOrder,
  getPackages,
  createOrder,
  wxPayCallback,
  getOrderStatus,
  validateCard,
  useCard,
  redeemCardByKey,
  getWalletBalance,
  rechargeWallet,
  getPaymentHistory
};
