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
  
  const orderNo = generateOrderNo();
  
  const order = await OrderChong.create({
    user_id: userId,
    order_no: orderNo,
    cid: packageId,
    money: pkg.price,
    gold_coins: pkg.coins + (pkg.bonus_coins || 0),
    pay_type: payType,
    status: 0,
    currency: CURRENCY_UNIT,
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
  
  const pkg = await RechargePackage.findByPk(order.cid);
  
  const transaction = await User.sequelize.transaction();
  
  try {
    await order.update({
      status: 1,
      pay_no: transactionId,
      pay_time: getTimestamp()
    }, { transaction });
    
    const totalCoins = pkg.coins + (pkg.bonus_coins || 0);
    
    await User.increment('money', {
      by: totalCoins,
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
    coinAmount: Math.floor(Number(card.value))
  };
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
  
  const amount = Math.floor(Number(card.value));
  const transaction = await User.sequelize.transaction();
  
  try {
    await card.update({
      status: 1,
      use_time: getTimestamp(),
      use_user_id: userId
    }, { transaction });
    
    await User.increment('money', {
      by: amount,
      where: { id: userId },
      transaction
    });
    
    await transaction.commit();
    
    return { amount };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
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

  const amount = Math.floor(Number(card.value));
  const transaction = await User.sequelize.transaction();

  try {
    await card.update({
      status: 1,
      use_time: getTimestamp(),
      use_user_id: userId
    }, { transaction });

    await User.increment('money', {
      by: amount,
      where: { id: userId },
      transaction
    });

    await transaction.commit();

    return { amount };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
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
    amount: Number(order.money),
    goldCoins: order.gold_coins,
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
