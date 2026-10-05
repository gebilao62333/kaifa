const { Op } = require('sequelize');
const { VipPackage, VipOrder, User } = require('../models');
const { affectedCount } = require('../utils/sql');
const { getTimestamp, generateOrderNo } = require('../utils/helper');

const getVipPackages = async () => {
  const packages = await VipPackage.findAll({
    where: { status: 1 },
    order: [['sort', 'ASC'], ['id', 'ASC']]
  });

  return packages.map(pkg => ({
    id: pkg.id,
    name: pkg.name,
    price: Number(pkg.price),
    original: pkg.original_price ? Number(pkg.original_price) : null,
    duration: pkg.duration,
    level: pkg.level,
    hot: pkg.hot === 1,
    // 套餐的价格（金币）与时长（天）由管理端维护，用户端按此单一档位下单，
    // 避免出现"前端选 12 个月、后端按套餐原价扣款"的口径不一致。
    durations: [{
      label: `${pkg.duration}天`,
      months: 1,
      price: Number(pkg.price),
      original: pkg.original_price ? Number(pkg.original_price) : null
    }]
  }));
};

const getUserVipInfo = async (userId) => {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  const now = getTimestamp();
  const isVip = user.vip === 1 && user.vip_expire_time > now;
  
  return {
    isVip,
    vipLevel: isVip ? user.vip_lv : 0,
    expireTime: user.vip_expire_time > 0 ? user.vip_expire_time : null
  };
};

const createVipOrder = async (userId, packageId) => {
  const pkg = await VipPackage.findByPk(packageId);
  
  if (!pkg || pkg.status !== 1) {
    throw new Error('VIP套餐不存在');
  }
  
  const orderNo = generateOrderNo();
  
  const order = await VipOrder.create({
    user_id: userId,
    order_no: orderNo,
    package_id: pkg.id,
    price: Number(pkg.price),
    duration: pkg.duration,
    level: pkg.level,
    pay_type: 1,
    status: 0,
    create_time: getTimestamp()
  });
  
  return {
    orderId: order.id,
    orderNo: order.order_no,
    amount: Number(pkg.price),
    packageName: pkg.name
  };
};

// 资损修复（2026-10-04）：金币购买 VIP 必须在此扣款，且只允许订单归属人完成。
// 扣减走同一事务内的条件更新（WHERE money >= price），避免"先查余额再扣"的 TOCTOU，
// 与 controllers/user.js savePref 的扣币实现保持一致。
const completeVipOrder = async (orderNo, transactionId = null, userId = null) => {
  const where = { order_no: orderNo, status: 0 };
  if (userId !== undefined && userId !== null) {
    where.user_id = userId;
  }

  const order = await VipOrder.findOne({ where });

  if (!order) {
    throw new Error('订单不存在或已处理');
  }

  const price = Number(order.price) || 0;
  const transaction = await User.sequelize.transaction();

  try {
    if (price > 0) {
      const decreaseResult = await User.decrement('money', {
        by: price,
        where: { id: order.user_id, money: { [Op.gte]: price } },
        transaction
      });
      // decrement 在 MySQL 下返回 [[null, N]]，不能用真值判断（[null,0] 也是真值）。
      if (affectedCount(decreaseResult) !== 1) {
        await transaction.rollback();
        throw new Error('余额不足');
      }
    }

    await order.update({
      status: 1,
      pay_no: transactionId,
      pay_time: getTimestamp()
    }, { transaction });

    const user = await User.findByPk(order.user_id, { transaction });
    if (!user) {
      await transaction.rollback();
      throw new Error('用户不存在');
    }
    const now = getTimestamp();
    let newExpireTime = now + order.duration * 24 * 60 * 60;

    if (user.vip_expire_time > now) {
      newExpireTime = user.vip_expire_time + order.duration * 24 * 60 * 60;
    }

    await User.update({
      vip: 1,
      vip_lv: Math.max(user.vip_lv, order.level),
      vip_expire_time: newExpireTime
    }, {
      where: { id: order.user_id },
      transaction
    });

    await transaction.commit();

    return {
      success: true,
      expireTime: newExpireTime,
      amount: price
    };
  } catch (error) {
    if (!transaction.finished) {
      try { await transaction.rollback(); } catch (rollbackError) { /* 已回滚 */ }
    }
    throw error;
  }
};

// 审计 B-12：原实现只按订单号查询，任何登录用户都能查到他人的 VIP 订单状态（IDOR）。
const getVipOrderStatus = async (orderNo, requesterId) => {
  const order = await VipOrder.findOne({
    where: { order_no: orderNo }
  });
  
  if (!order) {
    throw new Error('订单不存在');
  }

  if (requesterId !== undefined && requesterId !== null && Number(order.user_id) !== Number(requesterId)) {
    throw new Error('无权查看此订单');
  }
  
  return {
    orderNo: order.order_no,
    status: order.status,
    payTime: order.pay_time,
    amount: Number(order.price)
  };
};

const getUserVipOrders = async (userId, page = 1, pageSize = 20) => {
  const offset = (page - 1) * pageSize;
  
  const { count, rows } = await VipOrder.findAndCountAll({
    where: { user_id: userId },
    order: [['create_time', 'DESC']],
    offset,
    limit: pageSize
  });
  
  return {
    list: rows.map(order => ({
      orderNo: order.order_no,
      packageName: order.package_name,
      amount: Number(order.price),
      duration: order.duration,
      status: order.status,
      createTime: order.create_time,
      payTime: order.pay_time
    })),
    total: count,
    page,
    pageSize
  };
};

module.exports = {
  getVipPackages,
  getUserVipInfo,
  createVipOrder,
  completeVipOrder,
  getVipOrderStatus,
  getUserVipOrders
};