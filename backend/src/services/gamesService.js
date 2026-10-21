const { Game, CompanionProfile, GameOrder, User } = require('../models');
const { getTimestamp, generateOrderNo, parseQuery } = require('../utils/helper');
const { Op } = require('sequelize');
const sequelize = require('../config/mysql');
const { getCommissionRate } = require('./settingsService');
const { moneyMinus } = require('../utils/sql');
const levelService = require('./levelService');
const { getPrivacyPrefsForUsers, getPriorityUserIds } = require('../utils/privacyPrefs');
const notificationCenterService = require('./notificationCenterService');
const logger = require('../utils/logger');

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

const getCompanions = async (gameId, page, pageSize, options = {}) => {
  const { offset, limit } = parseQuery({ page, pageSize });
  const { serviceType, sort } = options;
  
  const where = {
    status: 2
  };
  
  if (gameId) {
    where.game_id = gameId;
  }
  // 线上/线下筛选：service_type 由入驻表单写入（缺省 online）
  if (serviceType === 'online' || serviceType === 'offline') {
    where.service_type = serviceType;
  }

  const orderMap = {
    hot: [['order_num', 'DESC'], ['star', 'DESC']],
    new: [['create_time', 'DESC'], ['id', 'DESC']]
  };
  const order = orderMap[sort] || [['star', 'DESC'], ['order_num', 'DESC']];
  
  const { count, rows } = await CompanionProfile.findAndCountAll({
    where,
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'nickname', 'avatar', 'city', 'lv', 'fans_num']
    }],
    offset,
    limit,
    order
  });
  
  // U-20：优先匹配（VIP priorityPush）在当页内优先展示
  const priorityIds = await getPriorityUserIds(rows.map(profile => profile.user_id));
  const orderedRows = [...rows].sort((a, b) => Number(priorityIds.has(Number(b.user_id))) - Number(priorityIds.has(Number(a.user_id))));
  const companions = await Promise.all(orderedRows.map(async (profile) => {
    const user = await User.findByPk(profile.user_id);
    return {
      userId: profile.user_id,
      priority: priorityIds.has(Number(profile.user_id)),
      nickname: user?.nickname || '',
      avatar: user?.avatar || '',
      city: user?.city || profile.city || '',
      level: user?.lv || 1,
      fansCount: user?.fans_num || 0,
      // 前端 ChatUsers 性别筛选依赖 sex（0=未设置 1=男 2=女），与详情页 gender 字段并行保留
      sex: user?.sex || 0,
      gameId: profile.game_id,
      servicePrice: Number(profile.price),
      tags: profile.tags ? profile.tags.split(',') : [],
      voiceIntro: profile.voice_intro,
      voiceDuration: profile.voice_time,
      // P1-9：入驻资料字段（历史数据/缺列统一回落空串，保持 DTO 稳定）
      skillLevel: profile.skill_level || '',
      zone: profile.zone || '',
      position: profile.position || '',
      playType: profile.play_type || '',
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
      { money: moneyMinus('money', totalPrice) },
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
  
  // 审计 H-7：条件更新占位（WHERE status=1），并发「开始 / 取消 / 申诉」不会互相覆盖状态。
  const [affected] = await GameOrder.update(
    { status: 2 },
    { where: { id: orderId, target_user_id: companionId, status: 1 } }
  );

  if (!affected) {
    throw new Error('订单状态不正确');
  }
  
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
  
  // 完成订单：给陪玩师分账 + 累加其资料（收入/单量），全部在同一事务内保证一致
  const transaction = await User.sequelize.transaction();
  
  try {
    // 审计 H-7：分账比例在事务内读取，并先抢占状态迁移（WHERE status=2）再打款——
    // 改造前「findByPk 判 status=2 → update(status=3) → increment(gift_money)」，
    // 两个并发完成请求会各自通过校验并各分一次账（重复分账），同项目 cancelOrder 早已是条件更新写法。
    const rate = await getCommissionRate('order_commission_rate', ORDER_COMMISSION_DEFAULT, transaction);
    const companionIncome = Math.round(totalPrice * rate * 100) / 100;

    const [claimed] = await GameOrder.update({
      status: 3,
      // 复用 amount 列记录陪玩师实际到手收入，供钱包收入聚合
      amount: companionIncome,
      user_time: getTimestamp(),
      end_time: getTimestamp()
    }, {
      where: { id: orderId, user_id: userId, status: 2 },
      transaction
    });

    if (!claimed) {
      throw new Error('订单状态不正确');
    }
    
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
    
    // 锁住陪玩师资料行：income_total/order_num 是「读旧值再写新值」，
    // 不加锁时并发完成两单会丢掉其中一单的累加（同 skinService 的处理）。
    const lock = transaction.LOCK ? transaction.LOCK.UPDATE : undefined;
    const profile = await CompanionProfile.findOne({
      where: { user_id: companionUserId },
      transaction,
      lock
    });
    if (profile) {
      await profile.update({
        income_total: Number(profile.income_total) + companionIncome,
        order_num: (profile.order_num || 0) + 1,
        update_time: getTimestamp()
      }, { transaction });
    }
    
    await transaction.commit();
    // U-12：订单完成通知接单方（失败不影响订单）
    try {
      if (companionUserId && Number(companionUserId) > 0) {
        await notificationCenterService.create(
          companionUserId,
          'order',
          '订单已完成',
          `订单 ${order.order_no || order.id} 已完成，收入 ${companionIncome} 金币`,
          { orderId: Number(order.id), amount: companionIncome }
        );
      }
    } catch (e) { /* 通知失败降级 */ }
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  // 经验来源：完成陪玩订单 +50（给接单方）。
  // 必须在分账事务提交之后再记，经验失败不能回滚订单，也不能影响已完成的主流程。
  if (companionUserId) {
    try {
      await levelService.addExp(companionUserId, 'order_completed');
    } catch (e) {
      logger.error('[订单] 记录完成经验失败:', e.message);
    }
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
  
  // 审计 H-7：条件更新占位（WHERE status IN (1,2,3)），并发申诉或与其他状态迁移交错时
  // 只有一次生效，不会出现「已完成又被改回申诉中」的覆盖。
  const [affected] = await GameOrder.update(
    {
      status: 5,
      appeal_reason: reason || '',
      appeal_time: getTimestamp()
    },
    { where: { id: orderId, user_id: userId, status: { [Op.in]: [1, 2, 3] } } }
  );

  if (!affected) {
    throw new Error('当前订单状态不可申诉');
  }
  
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
  // 审计 B-02：状态校验原本在事务外，两个并发取消请求会各自通过校验并各退一次款。
  // 改为事务内**条件更新**：只有仍处于 0/1（可取消）状态时更新才成功，成功者才退款。
  const transaction = await User.sequelize.transaction();
  
  try {
    const [affected] = await GameOrder.update(
      { status: 4, end_time: getTimestamp() },
      { where: { id: order.id, status: { [Op.in]: [0, 1] } }, transaction }
    );

    if (!affected) {
      await transaction.rollback();
      throw new Error('订单无法取消');
    }

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
      // 审计 B-15：列表接口此前不返回评价态，前端只能用「不存在的 item.rated」判断，
      // 刷新后「已评价」状态丢失、可重复进入评价页。这里补权威字段：
      // pingjiaStatus=1 表示已评价，rated 为兼容前端的布尔投影。
      pingjiaStatus: Number(order.pingjia_status) || 0,
      rated: Number(order.pingjia_status) === 1,
      star: Number(order.star) || 0,
      createTime: order.create_time
    };
  }));
  
  return {
    total: count,
    list: orders
  };
};

// P1-9：入驻表单 5 字段归一化——去空白、空串存 NULL、按列宽截断（列已在迁移中补齐）
const normalizeApplyField = (value, maxLength) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.slice(0, maxLength);
};

const applyAsCompanion = async (userId, gameId, price, tags, profile = {}) => {
  const existing = await CompanionProfile.findOne({
    where: { user_id: userId }
  });

  // 仅写入模型实际存在的列，避免 Unknown column
  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(profile, key);
  const extraFields = {
    icon: profile.icon || null,
    description: profile.description || null,
    voice_intro: profile.voiceIntro || null,
    voice_time: parseInt(profile.voiceTime) || 0,
    // 未显式带类型时沿用原服务类型，避免编辑线上服务把线下类型改没
    service_type: ['online', 'offline'].includes(profile.serviceType)
      ? profile.serviceType
      : (existing?.service_type || 'online')
  };
  // P1-9：5 个入驻字段只在请求体显式携带时写入；旧客户端/局部编辑未传时沿用既有值，
  // 避免「编辑服务一次就把已填的城市/等级等清空」。显式传空串表示清空（写 NULL）。
  const applyFieldMap = [
    ['city', 'city', 50],
    ['skillLevel', 'skill_level', 20],
    ['zone', 'zone', 50],
    ['position', 'position', 50],
    ['playType', 'play_type', 20]
  ];
  for (const [requestKey, column, maxLength] of applyFieldMap) {
    if (hasOwn(requestKey)) extraFields[column] = normalizeApplyField(profile[requestKey], maxLength);
    else if (existing) extraFields[column] = existing[column] == null ? null : existing[column];
    else extraFields[column] = null;
  }

  const isEdit = !!profile.edit;
  if (existing) {
    // 编辑已上架服务（MyServices）允许修改认证资料，但不能把状态打回审核中；
    // 新申请/重新提交仍要求未在审核且未认证。
    if (!isEdit && existing.status === 1) {
      throw new Error('申请正在审核中');
    }
    if (!isEdit && existing.status === 2) {
      throw new Error('您已经是认证陪玩师');
    }
    
    await existing.update({
      game_id: gameId,
      price,
      tags,
      ...extraFields,
      // 编辑已通过(2)/已暂停(3)的服务必须保留原状态；只有新申请/被拒重提才回到审核中(1)。
      status: (isEdit && (existing.status === 2 || existing.status === 3)) ? existing.status : 1,
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

// U-18：线下服务目录统一挂到真实 xn_game「线下服务」记录下，
// 不再把 201-304 这类前端假 id 当 gameId 落库。
const OFFLINE_SERVICES = [
  { serviceId: 201, name: '逛街购物', icon: '🛍️', price: 150, desc: '陪同逛街购物', bgColor: 'var(--gradient-primary)' },
  { serviceId: 202, name: '看电影', icon: '🎬', price: 200, desc: '陪同观看电影', bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { serviceId: 203, name: '美食探店', icon: '🍽️', price: 180, desc: '陪同品尝美食', bgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { serviceId: 204, name: '密室逃脱', icon: '🔐', price: 160, desc: '组队密室挑战', bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { serviceId: 301, name: '运动健身', icon: '💪', price: 120, desc: '陪同健身指导', bgColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { serviceId: 302, name: '羽毛球', icon: '🏸', price: 100, desc: '双人羽毛球对打', bgColor: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { serviceId: 303, name: '跑步陪练', icon: '🏃', price: 80, desc: '户外跑步陪伴', bgColor: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { serviceId: 304, name: '篮球', icon: '🏀', price: 150, desc: '组队篮球比赛', bgColor: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }
];

const getOfflineServices = async () => {
  let game = await Game.findOne({ where: { name: '线下服务' } });
  if (!game) {
    game = await Game.create({ name: '线下服务', status: 1, sort: 99, image: '', create_time: getTimestamp() });
  }
  return OFFLINE_SERVICES.map(item => ({ ...item, gameId: Number(game.id) }));
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
      attributes: ['id', 'nickname', 'avatar', 'city', 'lv', 'fans_num', 'sex']
    }],
    offset,
    limit,
    order: [['star', 'DESC'], ['order_num', 'DESC']]
  });

  // C-9：allowSearch —— 关闭「允许被搜索」的陪玩师不返回；批量读取偏好避免 N+1
  const prefsMap = await getPrivacyPrefsForUsers(rows.map(profile => profile.user_id));
  const visibleRows = rows.filter(profile => prefsMap[profile.user_id]?.allowSearch !== false);

  const searchPriorityIds = await getPriorityUserIds(visibleRows.map(profile => profile.user_id));
  const orderedVisibleRows = [...visibleRows].sort((a, b) => Number(searchPriorityIds.has(Number(b.user_id))) - Number(searchPriorityIds.has(Number(a.user_id))));
  const companions = await Promise.all(orderedVisibleRows.map(async (profile) => {
    const user = profile.user || await User.findByPk(profile.user_id);
    return {
      userId: profile.user_id,
      priority: searchPriorityIds.has(Number(profile.user_id)),
      nickname: user?.nickname || '',
      avatar: user?.avatar || '',
      city: user?.city || profile.city || '',
      level: user?.lv || 1,
      fansCount: user?.fans_num || 0,
      // 与列表保持一致：前端性别筛选统一读 sex（0=未设置 1=男 2=女）
      sex: user?.sex || 0,
      gameId: profile.game_id,
      servicePrice: Number(profile.price),
      tags: profile.tags ? profile.tags.split(',') : [],
      voiceIntro: profile.voice_intro,
      voiceDuration: profile.voice_time,
      // P1-9：与 getCompanions 保持同一套入驻资料字段
      skillLevel: profile.skill_level || '',
      zone: profile.zone || '',
      position: profile.position || '',
      playType: profile.play_type || '',
      totalOrders: profile.order_num,
      rating: Number(profile.star),
      ratingCount: profile.pingjia_num
    };
  }));

  // 受隐私开关影响，当前页条数可能少于 count；total 按过滤后的可见数对当前页做修正
  const hidden = rows.length - visibleRows.length;
  return { total: Math.max(0, count - hidden), list: companions };
};

const getCompanionDetail = async (companionId) => {
  const profile = await CompanionProfile.findOne({
    where: { user_id: companionId, status: 2 },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'nickname', 'avatar', 'city', 'lv', 'fans_num', 'sex', 'dec']
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
    city: user?.city || profile.city || '',
    level: user?.lv || 1,
    fansCount: user?.fans_num || 0,
    signature: user?.dec || '',
    // gender 为历史字段名保持不动，新增 sex 供列表/筛选统一消费
    gender: user?.sex || 0,
    sex: user?.sex || 0,
    age: null,
    gameId: profile.game_id,
    // 前端 UserProfile 据此区分线上/线下服务状态（历史数据缺省为线上）
    serviceType: profile.service_type || 'online',
    servicePrice: Number(profile.price),
    tags: profile.tags ? profile.tags.split(',') : [],
    voiceIntro: profile.voice_intro,
    voiceDuration: profile.voice_time,
    // P1-9：入驻资料字段（历史数据回落空串）
    skillLevel: profile.skill_level || '',
    zone: profile.zone || '',
    position: profile.position || '',
    playType: profile.play_type || '',
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
    const lock = transaction.LOCK ? transaction.LOCK.UPDATE : undefined;

    // 审计 H-7：锁住订单行后重读，两个并发评价只有一个能落库；
    // 否则同一单会被计两次，陪玩师的滚动平均分与评价数一并虚增。
    const freshOrder = await GameOrder.findByPk(orderId, { transaction, lock });
    if (!freshOrder || freshOrder.status !== 3 || freshOrder.user_id !== userId) {
      throw new Error('订单尚未完成');
    }
    if (freshOrder.pingjia_status === 1) {
      throw new Error('该订单已评价');
    }

    await freshOrder.update({
      star: score,
      content: comment || '',
      pingjia_status: 1,
      pingjia_time: getTimestamp()
    }, { transaction });

    // 平均分同样是「读旧值再写新值」，锁住资料行才能让并发评价串行累加。
    const profile = await CompanionProfile.findOne({
      where: { user_id: companionUserId },
      transaction,
      lock
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

// 审计 B-11：原实现不校验归属，任何登录用户都能按 orderId 查看任意订单详情（IDOR）。
const getOrderDetail = async (orderId, requesterId) => {
  const order = await GameOrder.findByPk(orderId);
  if (!order) {
    throw new Error('订单不存在');
  }

  if (requesterId !== undefined && requesterId !== null) {
    const isBuyer = Number(order.user_id) === Number(requesterId);
    const isCompanion = Number(order.target_user_id) === Number(requesterId);
    if (!isBuyer && !isCompanion) {
      throw new Error('无权查看此订单');
    }
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
      serviceType: profile.service_type || 'online',
      serviceIcon: profile.icon || '',
      voiceIntro: profile.voice_intro || '',
      voiceTime: profile.voice_time || 0,
      tags: profile.tags ? profile.tags.split(',') : [],
      // P1-9：编辑弹窗回填所需的入驻资料字段
      city: profile.city || '',
      // 统一请求/其它 DTO 的命名；level 保留一版兼容旧前端
      skillLevel: profile.skill_level || '',
      level: profile.skill_level || '',
      zone: profile.zone || '',
      position: profile.position || '',
      playType: profile.play_type || '',
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
  getOfflineServices,
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
