const { Game, CompanionProfile, GameOrder, User } = require('../models');
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
    image: game.image,
    backgroundImage: game.image_bg
  }));
};

const getCompanions = async (gameId, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });
  
  const where = {
    status: 2
  };
  
  if (gameId) {
    where.game_id = gameId;
  }
  
  const { count, rows } = await CompanionProfile.findAndCountAll({
    where,
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'nickname', 'avatar', 'city', 'lv', 'fans_num']
    }],
    offset,
    limit,
    order: [['star', 'DESC'], ['order_num', 'DESC']]
  });
  
  const companions = await Promise.all(rows.map(async (profile) => {
    const user = await User.findByPk(profile.user_id);
    return {
      userId: profile.user_id,
      nickName: user?.nickname || '',
      avatar: user?.avatar || '',
      location: user?.city || '',
      level: user?.lv || 1,
      fansCount: user?.fans_num || 0,
      gameId: profile.game_id,
      price: Number(profile.price),
      tags: profile.tags ? profile.tags.split(',') : [],
      voiceIntro: profile.voice_intro,
      voiceDuration: profile.voice_time,
      totalOrders: profile.order_num,
      rating: Number(profile.star),
      ratingCount: profile.pingjia_num,
      online: true,
      serviceType: profile.service_type || 'both',
      vip: user?.vip === 1,
      vipLevel: user?.vip_lv || 0
    };
  }));
  
  return {
    total: count,
    list: companions
  };
};

const createOrder = async (userId, targetUserId, gameId, num = 1) => {
  const targetProfile = await CompanionProfile.findOne({
    where: {
      user_id: targetUserId,
      status: 2
    }
  });
  
  if (!targetProfile) {
    throw new Error('陪玩师不存在或未认证');
  }
  
  const game = await Game.findByPk(gameId);
  
  const orderNo = generateOrderNo();
  const totalPrice = Number(targetProfile.price) * num;
  
  const user = await User.findByPk(userId);
  
  if (Number(user.money) < totalPrice) {
    throw new Error('余额不足');
  }
  
  const order = await GameOrder.create({
    order_no: orderNo,
    user_id: userId,
    target_user_id: targetUserId,
    game_id: gameId,
    game_name: game?.name || '',
    price: targetProfile.price,
    num,
    total_price: totalPrice,
    status: 0,
    create_time: getTimestamp()
  });
  
  return {
    orderId: order.id,
    orderNo: order.order_no,
    totalPrice
  };
};

const grabOrder = async (companionId, orderId) => {
  const order = await GameOrder.findByPk(orderId);
  
  if (!order) {
    throw new Error('订单不存在');
  }
  
  if (order.status !== 0) {
    throw new Error('订单已被抢或已取消');
  }
  
  const profile = await CompanionProfile.findOne({
    where: {
      user_id: companionId,
      status: 2
    }
  });
  
  if (!profile) {
    throw new Error('您不是认证陪玩师');
  }
  
  await order.update({
    status: 1,
    add_time: getTimestamp()
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
  
  await order.update({ status: 2 });
  
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
    user_time: getTimestamp(),
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
      num: order.num,
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
  const existing = await CompanionProfile.findOne({
    where: { user_id: userId }
  });
  
  if (existing) {
    if (existing.status === 1) {
      throw new Error('申请正在审核中');
    }
    if (existing.status === 2) {
      throw new Error('您已经是认证陪玩师');
    }
    
    await existing.update({
      game_id: gameId,
      price,
      tags,
      status: 1,
      update_time: getTimestamp()
    });
  } else {
    await CompanionProfile.create({
      user_id: userId,
      game_id: gameId,
      price,
      tags,
      status: 1,
      create_time: getTimestamp(),
      update_time: getTimestamp()
    });
  }
  
  return true;
};

const getApplyStatus = async (userId) => {
  const profile = await CompanionProfile.findOne({
    where: { user_id: userId }
  });
  
  if (!profile) {
    return { status: 0 };
  }
  
  return {
    status: profile.status,
    gameId: profile.game_id,
    price: Number(profile.price),
    tags: profile.tags ? profile.tags.split(',') : []
  };
};

module.exports = {
  getCategories,
  getCompanions,
  createOrder,
  grabOrder,
  startOrder,
  completeOrder,
  cancelOrder,
  getOrders,
  applyAsCompanion,
  getApplyStatus
};
