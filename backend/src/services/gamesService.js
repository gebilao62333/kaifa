const { Game, CompanionProfile, GameOrder, User } = require('../models');
const { getTimestamp, generateOrderNo, parseQuery } = require('../utils/helper');
const { Op } = require('sequelize');
const sequelize = require('../config/mysql');
const { getCommissionRate } = require('./settingsService');

// 订单分账比例（陪玩师分成）默认值：系统设置 order_commission_rate 缺省时使用
const ORDER_COMMISSION_DEFAULT = 0.7;

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
      nickname: user?.nickname || '',
      avatar: user?.avatar || '',
      city: user?.city || '',
      level: user?.lv || 1,
      fansCount: user?.fans_num || 0,
      gameId: profile.game_id,
      servicePrice: Number(profile.price),
      tags: profile.tags ? profile.tags.split(',') : [],
      voiceIntro: profile.voice_intro,
      voiceDuration: profile.voice_time,
      totalOrders: profile.order_num,
      rating: Number(profile.star),
      ratingCount: profile.pingjia_num
    };
  }));
  
  return {
    total: count,
    list: companions
  };
};

const createOrder = async (userId, targetUserId, gameId, num = 1, price) => {
  const game = await Game.findByPk(gameId);
  if (!game) {
    throw new Error('游戏不存在');
  }

  let unitPrice;
  if (targetUserId) {
    // 指定陪玩师：单价取该陪玩师的服务定价
    const targetProfile = await CompanionProfile.findOne({
      where: {
        user_id: targetUserId,
        status: 2
      }
    });

    if (!targetProfile) {
      throw new Error('陪玩师不存在或未认证');
    }
    unitPrice = Number(targetProfile.price);
  } else {
    // 不指定陪玩师：派单大厅悬赏单，单价由发布者指定
    if (!price || Number(price) <= 0) {
      throw new Error('请填写悬赏单价');
    }
    unitPrice = Number(price);
  }

  const orderNo = generateOrderNo();
  const totalPrice = unitPrice * num;
  
  // 下单即从用户余额中真实扣款，与订单创建保持事务一致性
  const transaction = await User.sequelize.transaction();
  
  try {
    const order = await GameOrder.create({
      order_no: orderNo,
      user_id: userId,
      // 悬赏单 target_user_id=0，等待陪玩师抢单后回填
      target_user_id: targetUserId || 0,
      game_id: gameId,
      game_name: game?.name || '',
      price: unitPrice,
      num,
      total_price: totalPrice,
      status: 0,
      create_time: getTimestamp()
    }, { transaction });
    
    // 原子扣款：仅当余额充足时才扣减，避免并发超扣
    const [affected] = await User.update(
      { money: sequelize.literal(`money - ${totalPrice}`) },
      { where: { id: userId, money: { [Op.gte]: totalPrice } }, transaction }
    );
    if (!affected) {
      throw new Error('余额不足');
    }
    
    await transaction.commit();
    
    return {
      orderId: order.id,
      orderNo: order.order_no,
      totalPrice
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// 派单大厅：列出待抢的悬赏单（target_user_id=0，不含自己发布的）
const getPool = async (userId, gameId, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });

  const where = { status: 0, target_user_id: 0 };
  if (gameId) {
    where.game_id = gameId;
  }
  if (userId) {
    where.user_id = { [Op.ne]: userId };
  }

  const { count, rows } = await GameOrder.findAndCountAll({
    where,
    offset,
    limit,
    order: [['create_time', 'DESC']]
  });

  const list = await Promise.all(rows.map(async (order) => {
    const publisher = await User.findByPk(order.user_id);
    return {
      orderId: order.id,
      orderNo: order.order_no,
      userId: order.user_id,
      nickName: publisher?.nickname || '',
      avatar: publisher?.avatar || '',
      level: publisher?.lv || 1,
      gameId: order.game_id,
      gameName: order.game_name,
      price: Number(order.price),
      num: order.num,
      totalPrice: Number(order.total_price),
      remark: order.remark || '',
      createTime: order.create_time
    };
  }));

  return { total: count, list };
};

const grabOrder = async (companionId, orderId) => {
  const order = await GameOrder.findByPk(orderId);
  
  if (!order) {
    throw new Error('订单不存在');
  }

  if (order.user_id === companionId) {
    throw new Error('不能接自己发布的订单');
  }
  
  const profile = await CompanionProfile.findOne({
    where: { user_id: companionId }
  });

  if (!profile || profile.status !== 2) {
    throw new Error('您不是在线接单的陪玩师');
  }

  const companion = await User.findByPk(companionId);
  
  // 原子抢单：仅当订单仍为待接单(0)时才更新，避免并发被两名陪玩师同时抢到
  const [affected] = await GameOrder.update({
    status: 1,
    target_user_id: companionId,
    companion_id: companionId,
    companion_name: companion?.nickname || '',
    add_time: getTimestamp()
  }, {
    where: { id: orderId, status: 0 }
  });
  
  if (!affected) {
    throw new Error('订单已被抢或已取消');
  }
  
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
  
  const companionUserId = order.target_user_id || order.companion_id;
  const totalPrice = Number(order.total_price) || 0;
  const rate = await getCommissionRate('order_commission_rate', ORDER_COMMISSION_DEFAULT);
  const companionIncome = Math.round(totalPrice * rate * 100) / 100;
  
  // 完成订单：给陪玩师分账 + 累加其资料（收入/单量），全部在同一事务内保证一致
  const transaction = await User.sequelize.transaction();
  
  try {
    await order.update({
      status: 3,
      // 复用 amount 列记录陪玩师实际到手收入，供钱包收入聚合
      amount: companionIncome,
      user_time: getTimestamp(),
      end_time: getTimestamp()
    }, { transaction });
    
    if (companionUserId && companionIncome > 0) {
      await User.increment('gift_money', {
        by: companionIncome,
        where: { id: companionUserId },
        transaction
      });
      await User.increment('gift_money_zong', {
        by: companionIncome,
        where: { id: companionUserId },
        transaction
      });
    }
    
    const profile = await CompanionProfile.findOne({
      where: { user_id: companionUserId },
      transaction
    });
    if (profile) {
      await profile.update({
        income_total: Number(profile.income_total) + companionIncome,
        order_num: (profile.order_num || 0) + 1,
        update_time: getTimestamp()
      }, { transaction });
    }
    
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  
  return true;
};

const appealOrder = async (userId, orderId, reason = '') => {
  const order = await GameOrder.findByPk(orderId);
  
  if (!order) {
    throw new Error('订单不存在');
  }
  
  if (order.user_id !== userId) {
    throw new Error('无权操作此订单');
  }
  
  if (![1, 2, 3].includes(order.status)) {
    throw new Error('当前订单状态不可申诉');
  }
  
  await order.update({
    status: 5,
    appeal_reason: reason || '',
    appeal_time: getTimestamp()
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
  
  // 取消订单时退回已扣款项
  const transaction = await User.sequelize.transaction();
  
  try {
    await order.update({
      status: 4,
      end_time: getTimestamp()
    }, { transaction });
    
    await User.increment('money', {
      by: Number(order.total_price) || 0,
      where: { id: order.user_id },
      transaction
    });
    
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  
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

const applyAsCompanion = async (userId, gameId, price, tags, profile = {}) => {
  const existing = await CompanionProfile.findOne({
    where: { user_id: userId }
  });
  
  // 仅写入模型实际存在的列，避免 Unknown column
  const extraFields = {
    icon: profile.icon || null,
    description: profile.description || null,
    voice_intro: profile.voiceIntro || null,
    voice_time: parseInt(profile.voiceTime) || 0
  };
  
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
      ...extraFields,
      status: 1,
      update_time: getTimestamp()
    });
  } else {
    await CompanionProfile.create({
      user_id: userId,
      game_id: gameId,
      price,
      tags,
      ...extraFields,
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

const searchCompanions = async (keyword, gameId, page, pageSize) => {
  const { offset, limit } = parseQuery({ page, pageSize });

  const where = { status: 2 };
  if (gameId) {
    where.game_id = gameId;
  }
  if (keyword) {
    where[Op.or] = [
      { tags: { [Op.like]: `%${keyword}%` } },
      { '$user.nickname$': { [Op.like]: `%${keyword}%` } }
    ];
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
    const user = profile.user || await User.findByPk(profile.user_id);
    return {
      userId: profile.user_id,
      nickname: user?.nickname || '',
      avatar: user?.avatar || '',
      city: user?.city || '',
      level: user?.lv || 1,
      fansCount: user?.fans_num || 0,
      gameId: profile.game_id,
      servicePrice: Number(profile.price),
      tags: profile.tags ? profile.tags.split(',') : [],
      voiceIntro: profile.voice_intro,
      voiceDuration: profile.voice_time,
      totalOrders: profile.order_num,
      rating: Number(profile.star),
      ratingCount: profile.pingjia_num
    };
  }));

  return { total: count, list: companions };
};

const getCompanionDetail = async (companionId) => {
  const profile = await CompanionProfile.findOne({
    where: { user_id: companionId, status: 2 },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'nickname', 'avatar', 'city', 'lv', 'fans_num', 'signature', 'gender', 'age']
    }]
  });

  if (!profile) {
    throw new Error('陪玩师不存在');
  }

  const user = profile.user || await User.findByPk(profile.user_id);
  return {
    userId: profile.user_id,
    nickname: user?.nickname || '',
    avatar: user?.avatar || '',
    city: user?.city || '',
    level: user?.lv || 1,
    fansCount: user?.fans_num || 0,
    signature: user?.signature || '',
    gender: user?.gender || 0,
    age: user?.age || null,
    gameId: profile.game_id,
    servicePrice: Number(profile.price),
    tags: profile.tags ? profile.tags.split(',') : [],
    voiceIntro: profile.voice_intro,
    voiceDuration: profile.voice_time,
    totalOrders: profile.order_num,
    rating: Number(profile.star),
    ratingCount: profile.pingjia_num
  };
};

const evaluateOrder = async (userId, orderId, rating, comment) => {
  const order = await GameOrder.findByPk(orderId);
  if (!order) {
    throw new Error('订单不存在');
  }
  if (order.user_id !== userId) {
    throw new Error('无权评价他人订单');
  }
  if (order.status !== 3) {
    throw new Error('订单尚未完成');
  }
  if (order.pingjia_status === 1) {
    throw new Error('该订单已评价');
  }

  const score = Number(rating);
  if (!Number.isFinite(score) || score < 1 || score > 5) {
    throw new Error('评分需在 1-5 之间');
  }

  const companionUserId = order.target_user_id || order.companion_id;

  // 评价：写订单并回写陪玩师滚动平均分与评价数，事务内完成避免半更新
  const transaction = await User.sequelize.transaction();
  try {
    await order.update({
      star: score,
      content: comment || '',
      pingjia_status: 1,
      pingjia_time: getTimestamp()
    }, { transaction });

    const profile = await CompanionProfile.findOne({
      where: { user_id: companionUserId },
      transaction
    });
    if (profile) {
      const count = profile.pingjia_num || 0;
      const oldAvg = Number(profile.star) || 0;
      const newAvg = Math.round(((oldAvg * count + score) / (count + 1)) * 100) / 100;
      await profile.update({
        star: newAvg,
        pingjia_num: count + 1,
        update_time: getTimestamp()
      }, { transaction });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return {
    orderId: order.id,
    orderNo: order.order_no,
    rating: score,
    comment
  };
};

const getOrderDetail = async (orderId) => {
  const order = await GameOrder.findByPk(orderId);
  if (!order) {
    throw new Error('订单不存在');
  }

  const user = await User.findByPk(order.user_id);
  const targetUser = await User.findByPk(order.target_user_id);

  return {
    orderId: order.id,
    orderNo: order.order_no,
    user: {
      userId: user?.id,
      nickname: user?.nickname || '',
      avatar: user?.avatar || ''
    },
    targetUser: {
      userId: targetUser?.id,
      nickname: targetUser?.nickname || '',
      avatar: targetUser?.avatar || ''
    },
    gameId: order.game_id,
    gameName: order.game_name,
    price: Number(order.price),
    num: order.num,
    totalPrice: Number(order.total_price),
    status: order.status,
    star: order.star,
    content: order.content,
    createTime: order.create_time,
    addTime: order.add_time,
    endTime: order.end_time
  };
};

const getStatistics = async (userId) => {
  const totalOrders = await GameOrder.count({
    where: { user_id: userId }
  });

  const completedOrders = await GameOrder.count({
    where: { user_id: userId, status: 3 }
  });

  const totalSpent = await GameOrder.sum('total_price', {
    where: { user_id: userId, status: 3 }
  });

  const ratedOrders = await GameOrder.findAll({
    where: { user_id: userId, status: 3, star: { [Op.gt]: 0 } },
    attributes: ['star']
  });

  const avgRating = ratedOrders.length > 0
    ? (ratedOrders.reduce((sum, o) => sum + o.star, 0) / ratedOrders.length).toFixed(1)
    : 0;

  return {
    totalOrders,
    completedOrders,
    totalSpent: Number(totalSpent) || 0,
    avgRating
  };
};

// 我的服务（陪玩师端）：CompanionProfile 每用户一行，携带游戏名与接单状态
const getMyServices = async (userId) => {
  const profiles = await CompanionProfile.findAll({
    where: { user_id: userId },
    order: [['update_time', 'DESC']]
  });

  const list = await Promise.all(profiles.map(async (profile) => {
    const game = await Game.findByPk(profile.game_id);
    return {
      serviceId: profile.id,
      gameId: profile.game_id,
      gameName: game?.name || '',
      image: game?.image || '',
      price: Number(profile.price),
      tags: profile.tags ? profile.tags.split(',') : [],
      // status: 1=审核中 2=接单中 3=已暂停
      status: profile.status,
      orderCount: profile.order_num || 0,
      incomeTotal: Number(profile.income_total) || 0,
      rating: Number(profile.star) || 0,
      ratingCount: profile.pingjia_num || 0
    };
  }));

  return { total: list.length, list };
};

// 上下线切换：接单中(2) <-> 已暂停(3)
const toggleServiceStatus = async (userId, serviceId) => {
  const profile = await CompanionProfile.findByPk(serviceId);

  if (!profile || profile.user_id !== userId) {
    throw new Error('服务不存在');
  }

  if (profile.status !== 2 && profile.status !== 3) {
    throw new Error('当前状态不可切换');
  }

  const next = profile.status === 2 ? 3 : 2;
  await profile.update({ status: next, update_time: getTimestamp() });

  return { serviceId: profile.id, status: next };
};

module.exports = {
  getCategories,
  getCompanions,
  searchCompanions,
  createOrder,
  getPool,
  grabOrder,
  startOrder,
  completeOrder,
  cancelOrder,
  getOrders,
  applyAsCompanion,
  getApplyStatus,
  getMyServices,
  toggleServiceStatus,
  getCompanionDetail,
  evaluateOrder,
  getOrderDetail,
  getStatistics,
  appealOrder
};
