const { OrderChong, RechargePackage, Card, User } = require('../models');
const { getTimestamp, generateOrderNo } = require('../utils/helper');
const { CURRENCY_UNIT, validateGoldCoins } = require('../utils/currency');
const { Op } = require('sequelize');
const crypto = require('crypto');

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

const wxPayCallback = async (payNo, transactionId) => {
  const order = await OrderChong.findOne({
    where: { order_no: payNo, status: 0 }
  });
  
  if (!order) {
    throw new Error('订单不存在或已处理');
  }
  
  // 订单已存有到账金币（coins），无需再反查套餐；xn_order_chong 无 pay_no 列，故不落第三方流水号
  const transaction = await User.sequelize.transaction();
  
  try {
    await order.update({
      status: 1,
      pay_time: getTimestamp()
    }, { transaction });
    
    await User.increment('money', {
      by: order.coins,
      where: { id: order.user_id },
      transaction
    });
    
    await transaction.commit();
    
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getOrderStatus = async (orderNo) => {
  const order = await OrderChong.findOne({
    where: { order_no: orderNo }
  });
  
  if (!order) {
    throw new Error('订单不存在');
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

const validateCard = async (cardCode) => {
  const card = await Card.findOne({
    where: { card_no: cardCode }
  });

  if (!card) {
    throw new Error('密卡不存在');
  }

  if (card.status !== 0) {
    throw new Error('密卡已被使用或已禁用');
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

const useCard = async (userId, cardCode) => {
  const card = await Card.findOne({
    where: { card_no: cardCode }
  });

  if (!card) {
    throw new Error('密卡不存在');
  }

  if (card.status !== 0) {
    throw new Error('密卡已被使用或已禁用');
  }

  return consumeCardOnce(userId, card, '密卡已被使用或已禁用');
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
