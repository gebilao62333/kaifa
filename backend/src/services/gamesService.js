const { Game, VirtualUser, GameOrder, User, CompanionProfile } = require('../models');
const { getTimestamp, generateOrderNo, parseQuery } = require('../utils/helper');
const { Op } = require('sequelize');

const getCategories = async () => {
  const games = await Game.findAll({
    where: { status: 1 },
    order: [['sort', 'ASC'], ['id', 'ASC']]
  });
  
  return games.map(game => ({
    gameId: game.id,
    gameName: game.name,
    image: game.icon,
    backgroundImage: ''
  }));
};

const getCompanions = async (gameId, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });

  const where = {
    status: 1
  };

  if (gameId) {
    where.game_ids = { [Op.like]: `%${gameId}%` };
  }

  const { count, rows } = await CompanionProfile.findAndCountAll({
    where,
    offset,
    limit,
    order: [['create_time', 'DESC']]
  });

  const companions = await Promise.all(rows.map(async (profile) => {
    const user = await User.findByPk(profile.user_id);
    let gameIds = [];
    try {
      if (profile.game_ids) {
        gameIds = JSON.parse(profile.game_ids);
      }
    } catch (e) {
      gameIds = [];
    }

    return {
      userId: user ? user.id : profile.user_id,
      nickName: user ? user.nickname : '',
      avatar: user ? user.avatar : '',
      location: user ? user.region : '',
      level: user ? (user.lv || 1) : 1,
      fansCount: 0,
      gameId: gameIds[0] || null,
      gameIds,
      price: Number(profile.price_per_hour) || 0,
      tags: [],
      voiceIntro: profile.intro || '',
      voiceDuration: 0,
      totalOrders: 0,
      rating: 5.0,
      ratingCount: 0,
      online: profile.online_status === 1,
      serviceType: 'both',
      vip: false,
      vipLevel: 0
    };
  }));

  return {
    total: count,
    list: companions
  };
};

const getCompanionDetail = async (id) => {
  const profile = await CompanionProfile.findByPk(id);
  if (!profile) {
    throw new Error('陪玩师不存在');
  }

  const user = await User.findByPk(profile.user_id);

  let gameIds = [];
  try {
    if (profile.game_ids) {
      gameIds = JSON.parse(profile.game_ids);
    }
  } catch (e) {
    gameIds = [];
  }

  return {
    userId: user ? user.id : profile.user_id,
    nickName: user ? user.nickname : '',
    avatar: user ? user.avatar : '',
    location: user ? user.region : '',
    level: user ? (user.lv || 1) : 1,
    fansCount: 0,
    price: Number(profile.price_per_hour) || 0,
    gameIds,
    tags: [],
    voiceIntro: profile.intro || '',
    voiceDuration: 0,
    totalOrders: 0,
    rating: 5.0,
    ratingCount: 0,
    online: profile.online_status === 1,
    serviceType: 'both',
    vip: false,
    vipLevel: 0
  };
};

const createOrder = async (userId, targetUserId, gameId, num = 1) => {
  const targetProfile = await CompanionProfile.findByPk(targetUserId);
  
  if (!targetProfile) {
    throw new Error('陪玩师不存在');
  }
  
  const game = await Game.findByPk(gameId);
  const targetUser = await User.findByPk(targetProfile.user_id);
  
  const orderNo = generateOrderNo();
  const totalPrice = Number(targetProfile.price_per_hour) * num;
  
  const order = await GameOrder.create({
    order_no: orderNo,
    user_id: userId,
    game_id: gameId,
    game_name: game?.name || '',
    target_user_id: targetProfile.user_id,
    price: targetProfile.price_per_hour,
    num,
    total_price: totalPrice,
    status: 0,
    add_time: getTimestamp(),
    create_time: getTimestamp()
  });
  
  return {
    orderId: order.id,
    orderNo: order.order_no,
    totalPrice: Number(order.total_price)
  };
};

const grabOrder = async (companionId, orderId) => {
  const order = await GameOrder.findByPk(orderId);
  
  if (!order) {
    throw new Error('订单不存在');
  }
  
  if (order.status !== 0) {
    throw new Error('订单已被处理');
  }
  
  await order.update({
    status: 1,
    user_time: getTimestamp()
  });
  
  return {
    orderId: order.id,
    orderNo: order.order_no
  };
};

const startOrder = async (companionId, orderId) => {
  const order = await GameOrder.findByPk(orderId);
  
  if (!order) {
    throw new Error('订单不存在');
  }
  
  if (order.target_user_id !== companionId) {
    throw new Error('无权操作此订单');
  }
  
  if (order.status !== 1) {
    throw new Error('订单状态不正确');
  }
  
  await order.update({ status: 2, add_time: getTimestamp() });
  
  return true;
};

const completeOrder = async (userId, orderId) => {
  const order = await GameOrder.findByPk(orderId);
  
  if (!order) {
    throw new Error('订单不存在');
  }
  
  if (order.user_id !== userId) {
    throw new Error('无权操作此订单');
  }
  
  if (order.status !== 2) {
    throw new Error('订单状态不正确');
  }
  
  await order.update({
    status: 3,
    end_time: getTimestamp()
  });
  
  return true;
};

const cancelOrder = async (userId, orderId, role) => {
  const order = await GameOrder.findByPk(orderId);
  
  if (!order) {
    throw new Error('订单不存在');
  }
  
  if (role === 'user' && order.user_id !== userId) {
    throw new Error('无权操作此订单');
  }
  
  if (role === 'companion' && order.target_user_id !== userId) {
    throw new Error('无权操作此订单');
  }
  
  if (order.status !== 0 && order.status !== 1) {
    throw new Error('订单无法取消');
  }
  
  await order.update({
    status: 4,
    end_time: getTimestamp()
  });
  
  return true;
};

const getOrders = async (userId, role, status, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });
  
  const where = role === 'companion' 
    ? { target_user_id: userId }
    : { user_id: userId };
  
  if (status !== undefined && status !== null) {
    where.status = status;
  }
  
  const { count, rows } = await GameOrder.findAndCountAll({
    where,
    offset,
    limit,
    order: [['create_time', 'DESC']]
  });
  
  const orders = await Promise.all(rows.map(async (order) => {
    const otherUserId = role === 'companion' ? order.user_id : order.target_user_id;
    const otherUser = await User.findByPk(otherUserId);
    
    return {
      orderId: order.id,
      orderNo: order.order_no,
      userId: order.user_id,
      targetUserId: order.target_user_id,
      targetNickName: otherUser?.nickname || '',
      targetAvatar: otherUser?.avatar || '',
      gameId: order.game_id,
      gameName: order.game_name,
      price: Number(order.price),
      num: order.num || 1,
      totalPrice: Number(order.total_price),
      status: order.status,
      createTime: order.create_time
    };
  }));
  
  return {
    total: count,
    list: orders
  };
};

const applyAsCompanion = async (userId, gameId, price, tags) => {
  return true;
};

const getApplyStatus = async (userId) => {
  return { status: 0 };
};

module.exports = {
  getCategories,
  getCompanions,
  getCompanionDetail,
  createOrder,
  grabOrder,
  startOrder,
  completeOrder,
  cancelOrder,
  getOrders,
  applyAsCompanion,
  getApplyStatus
};
