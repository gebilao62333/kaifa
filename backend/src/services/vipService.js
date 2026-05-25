const { VipPackage, VipOrder, User } = require('../models');
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
    hot: pkg.hot === 1
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
    price: pkg.price,
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

const completeVipOrder = async (orderNo, transactionId = null) => {
  const order = await VipOrder.findOne({
    where: { order_no: orderNo, status: 0 }
  });
  
  if (!order) {
    throw new Error('订单不存在或已处理');
  }
  
  const transaction = await User.sequelize.transaction();
  
  try {
    await order.update({
      status: 1,
      pay_no: transactionId,
      pay_time: getTimestamp()
    }, { transaction });
    
    const user = await User.findByPk(order.user_id);
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
      expireTime: newExpireTime
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getVipOrderStatus = async (orderNo) => {
  const order = await VipOrder.findOne({
    where: { order_no: orderNo }
  });
  
  if (!order) {
    throw new Error('订单不存在');
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