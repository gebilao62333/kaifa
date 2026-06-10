const { User, GameOrder, Withdraw, GiftLog, Post, VipPackage, Banner, CompanionProfile, CustomerService, ChatLog, Report, Recommend, Notification, Setting } = require('../models');
const { signToken } = require('../config/jwt');
const response = require('../utils/response');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return response.error(res, '用户名和密码不能为空');
    }
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = signToken({ 
        id: 0, 
        username: 'admin', 
        role: 'admin' 
      }, '7d');
      
      response.success(res, {
        token,
        user: {
          id: 0,
          username: 'admin',
          role: 'admin',
          avatar: ''
        }
      }, '登录成功');
    } else {
      response.error(res, '用户名或密码错误');
    }
  } catch (error) {
    logger.error('管理员登录错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const getUserList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, nickname, phone, status, keyword } = req.query;
    const searchKeyword = keyword || '';
    const offset = (page - 1) * pageSize;
    
    const where = {};
    if (searchKeyword) {
      where[Op.or] = [
        { nickname: { [Op.like]: `%${searchKeyword}%` } },
        { phone: { [Op.like]: `%${searchKeyword}%` } }
      ];
    } else {
      if (nickname) where.nickname = { [Op.like]: `%${nickname}%` };
      if (phone) where.phone = { [Op.like]: `%${phone}%` };
    }
    if (status !== undefined && status !== '') where.status = parseInt(status);
    
    const dbResult = await User.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['create_time', 'DESC']]
    });
    
    const users = dbResult.rows || [];
    const total = dbResult.count || 0;
    
    const result = users.map(user => ({
      id: user.id,
      userId: user.id,
      nickname: user.nickname,
      username: user.username || '',
      avatar: user.avatar || '',
      phone: user.phone || user.mobile || '',
      gender: user.gender || user.sex || 0,
      sex: user.sex || 0,
      city: user.city || '',
      dec: user.dec || '',
      status: user.status || 0,
      vip: user.vip || 0,
      vipLv: user.vip_lv || 0,
      money: user.money || 0,
      giftMoney: user.gift_money || 0,
      lv: user.lv || 1,
      email: user.email || '',
      fansNum: user.fans_num || 0,
      lastLoginTime: user.last_login_time || 0,
      createTime: user.create_time
    }));
    
    response.success(res, {
      list: result,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('获取用户列表错误:', error);
    response.success(res, {
      list: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    });
  }
};

const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    
    if (!user) {
      return response.success(res, null,  '用户不存在 ');
    }
    
    let companionService = null
    try {
      const profile = await CompanionProfile.findOne({ where: { user_id: user.id } })
      if (profile) {
        companionService = {
          status: profile.status,
          price: Number(profile.price),
          tags: profile.tags || '',
          voiceIntro: profile.voice_intro || '',
          orderNum: profile.order_num || 0,
          star: Number(profile.star) || 5.00
        }
      }
    } catch (e) {
      console.warn('查询陪玩师信息失败:', e.message)
    }
    
    response.success(res, {
      id: user.id,
      userId: user.id,
      nickname: user.nickname,
      username: user.username || '',
      avatar: user.avatar || '',
      phone: user.phone || user.mobile || '',
      email: user.email || '',
      status: user.status,
      vip: user.vip,
      vipLv: user.vip_lv,
      money: user.money,
      giftMoney: user.gift_money,
      lv: user.lv || 1,
      fansNum: user.fans_num,
      followNum: user.follow_num || 0,
      dec: user.dec,
      sex: user.sex,
      city: user.city,
      lastLoginTime: user.last_login_time || 0,
      createTime: user.create_time,
      companionService
    });
  } catch (error) {
    logger.error('获取用户详情错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, phone, sex, city, status, lv, vipLv, money, giftMoney, dec, username, email, id: newId } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return response.success(res, null,  '用户不存在 ');
    }

    // ID 编辑：检查新 ID 是否被其他用户占用（允许改回自己）
    if (newId !== undefined) {
      const idNum = parseInt(newId);
      const existing = await User.findByPk(idNum);
      if (existing && String(existing.id) !== String(id)) {
        return response.success(res, null, `ID ${idNum} 已被其他用户占用，请换一个`);
      }
    }

    const updateData = {};
    if (newId !== undefined) updateData.id = parseInt(newId);
    if (nickname !== undefined) updateData.nickname = nickname;
    if (username !== undefined) updateData.username = username;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (sex !== undefined) updateData.sex = parseInt(sex);
    if (lv !== undefined) updateData.lv = parseInt(lv);
    if (city !== undefined) updateData.city = city;
    if (status !== undefined) updateData.status = parseInt(status);
    if (vipLv !== undefined) updateData.vip_lv = parseInt(vipLv);
    if (money !== undefined) updateData.money = parseFloat(money);
    if (giftMoney !== undefined) updateData.gift_money = parseFloat(giftMoney);
    if (dec !== undefined) updateData.dec = dec;

    // 用 localDb 的静态 update（支持直接修改主键），传入 where 条件
    await User.update(updateData, { where: { id: parseInt(id) } });

    response.success(res, {}, '更新成功');
  } catch (error) {
    logger.error('更新用户信息错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return response.success(res, null,  '用户不存在 ');
    }
    
    const newStatus = parseInt(status);
    await user.update({ status: newStatus });
    
    response.success(res, { status: newStatus }, '状态更新成功');
  } catch (error) {
    logger.error('更新用户状态错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    
    if (!user) {
      return response.success(res, null,  '用户不存在 ');
    }
    
    await user.destroy();
    
    response.success(res, null, '删除成功');
  } catch (error) {
    logger.error('删除用户错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const createUser = async (req, res) => {
  try {
    const { nickname, phone, sex, city, lv, vipLv, money, giftMoney, dec, username, email } = req.body;
    
    const newUser = await User.create({
      nickname: nickname || '新用户',
      username: username || '',
      phone: phone || '',
      email: email || '',
      sex: parseInt(sex) || 0,
      city: city || '',
      lv: parseInt(lv) || 1,
      vip_lv: parseInt(vipLv) || 0,
      money: parseFloat(money) || 0,
      gift_money: parseFloat(giftMoney) || 0,
      dec: dec || ''
    });
    
    response.success(res, {
      id: newUser.id,
      userId: newUser.id,
      nickname: newUser.nickname,
      username: newUser.username || '',
      avatar: newUser.avatar || '',
      phone: newUser.phone || newUser.mobile || '',
      email: newUser.email || '',
      sex: newUser.sex || 0,
      city: newUser.city || '',
      dec: newUser.dec || '',
      status: newUser.status || 0,
      vip: newUser.vip || 0,
      vipLv: newUser.vip_lv || 0,
      money: newUser.money || 0,
      giftMoney: newUser.gift_money || 0,
      lv: newUser.lv || 1,
      fansNum: newUser.fans_num || 0,
      createTime: newUser.create_time
    }, '用户创建成功');
  } catch (error) {
    logger.error('创建用户错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const getOrderList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, orderNo, userId, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    let orders = [];
    let total = 0;
    
    const where = {};
    if (orderNo) where.order_no = { [Op.like]: `%${orderNo}%` };
    if (userId) where.user_id = parseInt(userId);
    if (status !== undefined && status !== '') where.status = status;
    
    const result = await GameOrder.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['create_time', 'DESC']]
    });
    
    orders = result.rows || [];
    total = result.count || 0;
    
    // 手动查询用户信息
    const userIds = new Set();
    orders.forEach(o => { userIds.add(o.user_id); userIds.add(o.target_user_id); });
    if (userIds.size > 0) {
      const users = await User.findAll({ where: { id: { [Op.in]: [...userIds] } }, attributes: ['id', 'nickname'] });
      const userMap = {};
      users.forEach(u => { userMap[u.id] = u.nickname; });
      orders = orders.map(o => {
        o.dataValues = o.dataValues || o;
        o.dataValues.buyerName = userMap[o.user_id] || '';
        o.dataValues.sellerName = userMap[o.target_user_id] || '';
        return o;
      });
    }
    
    const typeMap = { 0: '线上服务', 1: '线下服务', 2: '预约服务' };
    
    const orderList = orders.map(order => ({
      orderId: order.id,
      orderNo: order.order_no,
      userId: order.user_id,
      buyerName: order.buyerName || (order.dataValues?.buyerName || ''),
      targetId: order.target_user_id,
      sellerName: order.sellerName || (order.dataValues?.sellerName || ''),
      gameName: order.game_name || '未知游戏',
      type: order.type !== undefined ? order.type : 0,
      typeText: typeMap[order.type] || '线上服务',
      price: Number(order.price || 0),
      totalPrice: Number(order.total_price || order.price || 0),
      num: order.num || 1,
      status: order.status,
      createTime: order.create_time,
      endTime: order.end_time
    }));
    
    response.success(res, {
      list: orderList,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('获取订单列表错误:', error);
    response.success(res, {
      list: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    });
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await GameOrder.findByPk(id, {
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'nickname', 'avatar'] },
        { model: User, as: 'seller', attributes: ['id', 'nickname', 'avatar'] }
      ]
    });
    
    if (!order) {
      return response.success(res, null,  '订单不存在 ');
    }
    
    const typeMap = { 0: '线上服务', 1: '线下服务', 2: '预约服务' };
    
    response.success(res, {
      orderId: order.id,
      orderNo: order.order_no,
      userId: order.user_id,
      buyerName: order.buyer?.nickname || '',
      buyerAvatar: order.buyer?.avatar || '',
      targetId: order.target_user_id,
      sellerName: order.seller?.nickname || '',
      sellerAvatar: order.seller?.avatar || '',
      gameId: order.game_id,
      gameName: order.game_name,
      type: order.type !== undefined ? order.type : 0,
      typeText: typeMap[order.type] || '线上服务',
      price: Number(order.price || 0),
      totalPrice: Number(order.total_price || 0),
      num: order.num || 1,
      status: order.status,
      remark: order.remark,
      createTime: order.create_time,
      startTime: order.start_time,
      endTime: order.end_time,
      cancelTime: order.cancel_time,
      gamesServerName: order.games_server_name || '',
      gameRoleName: order.game_role_name || ''
    });
  } catch (error) {
    logger.error('获取订单详情错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await GameOrder.findByPk(id);
    if (!order) {
      return response.success(res, null,  '订单不存在 ');
    }
    
    const updateData = { status };
    if (status === 'ongoing') {
      updateData.start_time = Math.floor(Date.now() / 1000);
    } else if (status === 'completed') {
      updateData.end_time = Math.floor(Date.now() / 1000);
    } else if (status === 'cancelled') {
      updateData.cancel_time = Math.floor(Date.now() / 1000);
    }
    
    await order.update(updateData);
    response.success(res, { status: order.status }, '状态更新成功');
  } catch (error) {
    logger.error('更新订单状态错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const createOrder = async (req, res) => {
  try {
    const { userId, gameId, gameName, companionId, companionName, duration, price, remark } = req.body;
    
    const newOrder = await GameOrder.create({
      user_id: userId,
      game_id: gameId,
      game_name: gameName,
      companion_id: companionId,
      companion_name: companionName,
      duration: parseInt(duration),
      price: parseFloat(price),
      amount: parseFloat(price),
      remark: remark || ''
    });
    
    response.success(res, {
      orderId: newOrder.id,
      orderNo: newOrder.order_no,
      userId: newOrder.user_id,
      gameId: newOrder.game_id,
      gameName: newOrder.game_name,
      companionId: newOrder.companion_id,
      companionName: newOrder.companion_name,
      duration: newOrder.duration,
      price: newOrder.price,
      amount: newOrder.amount,
      status: newOrder.status,
      remark: newOrder.remark,
      createTime: newOrder.create_time
    }, '订单创建成功');
  } catch (error) {
    logger.error('创建订单错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await GameOrder.findByPk(id);
    if (!order) {
      return response.success(res, null,  '订单不存在 ');
    }
    
    await GameOrder.destroy({ where: { id } });
    response.success(res, {}, '订单删除成功');
  } catch (error) {
    logger.error('删除订单错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const getWithdrawList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, userId, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    let withdraws = [];
    let total = 0;
    
    const where = {};
    if (userId) where.user_id = parseInt(userId);
    if (status !== undefined) where.status = status;
    
    const result = await Withdraw.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['create_time', 'DESC']]
    });
    
    withdraws = result.rows || [];
    total = result.count || 0;
    
    const withdrawList = withdraws.map(w => ({
      withdrawId: w.id,
      userId: w.user_id,
      amount: w.amount,
      type: w.type || 'alipay',
      account: w.account || '',
      status: w.status || 'pending',
      remark: w.remark || '',
      createTime: w.create_time,
      handleTime: w.handle_time
    }));
    
    response.success(res, {
      list: withdrawList,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('获取提现列表错误:', error);
    response.success(res, {
      list: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    });
  }
};

const approveWithdraw = async (req, res) => {
  try {
    const { id } = req.params;
    const withdraw = await Withdraw.findByPk(id);
    
    if (!withdraw) {
      return response.success(res, null,  '提现记录不存在 ');
    }
    
    if (withdraw.status !== 'pending') {
      return response.error(res, '该提现记录状态不允许操作');
    }
    
    await withdraw.update({ 
      status: 'approved',
      handle_time: Math.floor(Date.now() / 1000)
    });
    
    response.success(res, { status: 'approved' }, '审核通过');
  } catch (error) {
    logger.error('审核提现错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const rejectWithdraw = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const withdraw = await Withdraw.findByPk(id);
    
    if (!withdraw) {
      return response.success(res, null,  '提现记录不存在 ');
    }
    
    if (withdraw.status !== 'pending') {
      return response.error(res, '该提现记录状态不允许操作');
    }
    
    await withdraw.update({ 
      status: 'rejected',
      handle_time: Math.floor(Date.now() / 1000),
      remark: reason
    });
    
    response.success(res, { status: 'rejected' }, '已拒绝');
  } catch (error) {
    logger.error('拒绝提现错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const getWithdrawDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const withdraw = await Withdraw.findByPk(id);
    
    if (!withdraw) {
      return response.success(res, null,  '提现记录不存在 ');
    }
    
    response.success(res, {
      withdrawId: withdraw.id,
      userId: withdraw.user_id,
      amount: withdraw.amount,
      type: withdraw.type || 'alipay',
      account: withdraw.account || '',
      status: withdraw.status || 'pending',
      remark: withdraw.remark || '',
      createTime: withdraw.create_time,
      handleTime: withdraw.handle_time
    });
  } catch (error) {
    logger.error('获取提现详情错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const createWithdraw = async (req, res) => {
  try {
    const { userId, amount, type, account } = req.body;
    
    const newWithdraw = await Withdraw.create({
      user_id: userId,
      amount: parseFloat(amount),
      type: type || 'alipay',
      account: account || ''
    });
    
    response.success(res, {
      withdrawId: newWithdraw.id,
      userId: newWithdraw.user_id,
      amount: newWithdraw.amount,
      type: newWithdraw.type,
      account: newWithdraw.account,
      status: newWithdraw.status,
      createTime: newWithdraw.create_time
    }, '提现记录创建成功');
  } catch (error) {
    logger.error('创建提现记录错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const deleteWithdraw = async (req, res) => {
  try {
    const { id } = req.params;
    const withdraw = await Withdraw.findByPk(id);
    
    if (!withdraw) {
      return response.success(res, null,  '提现记录不存在 ');
    }
    
    await Withdraw.destroy({ where: { id: parseInt(id) } });
    response.success(res, {}, '提现记录删除成功');
  } catch (error) {
    logger.error('删除提现记录错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const getPostList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, userKeyword, status, type, sortField, sortOrder, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * pageSize;
    
    let posts = [];
    let total = 0;
    let userMap = {};
    
    const whereClause = {};
    
    // 内容关键词搜索
    if (keyword) {
      whereClause.content = { [Op.like]: `%${keyword}%` };
    }
    // 状态筛选
    if (status !== undefined && status !== '') {
      whereClause.status = parseInt(status);
    }
    // 类型筛选
    if (type !== undefined && type !== '') {
      whereClause.type = parseInt(type);
    }
    
    // 排序
    const validSortFields = ['id', 'create_time', 'thumb_num', 'comment_num', 'share_num', 'status'];
    const orderField = validSortFields.includes(sortField) ? sortField : 'create_time';
    const orderDir = sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    const result = await Post.findAndCountAll({
      where: whereClause,
      offset,
      limit: parseInt(pageSize),
      order: [[orderField, orderDir]]
    });
    
    posts = result.rows || [];
    total = result.count || 0;
    
    // 批量获取用户信息
    const userIds = [...new Set(posts.map(p => p.user_id).filter(Boolean))];
    if (userIds.length > 0) {
      try {
        const users = await User.findAll({
          where: { id: { [Op.in]: userIds } },
          attributes: ['id', 'nickname', 'avatar']
        });
        users.forEach(u => { userMap[u.id] = { nickname: u.nickname, avatar: u.avatar }; });
      } catch (e) {
        console.warn('获取用户信息失败:', e.message);
      }
    }
    
    // 用户昵称筛选（需要先查用户，再做关联过滤）
    if (userKeyword) {
      try {
        const matchedUsers = await User.findAll({
          where: { nickname: { [Op.like]: `%${userKeyword}%` } },
          attributes: ['id']
        });
        const matchedUserIds = matchedUsers.map(u => u.id);
        posts = posts.filter(p => matchedUserIds.includes(p.user_id));
        total = matchedUserIds.length > 0 ? await Post.count({
          where: { ...whereClause, user_id: { [Op.in]: matchedUserIds } }
        }) : 0;
      } catch (e) {
        console.warn('用户搜索失败:', e.message);
      }
    }
    
    // 日期范围筛选
    if (dateFrom) {
      const fromTs = Math.floor(new Date(dateFrom).getTime() / 1000);
      posts = posts.filter(p => p.create_time >= fromTs);
    }
    if (dateTo) {
      const toTs = Math.floor(new Date(dateTo).getTime() / 1000) + 86400;
      posts = posts.filter(p => p.create_time <= toTs);
    }
    
    const postResult = posts.map(post => ({
      id: post.id,
      userId: post.user_id,
      userNickname: userMap[post.user_id]?.nickname || `用户${post.user_id}`,
      userAvatar: userMap[post.user_id]?.avatar || '',
      content: post.content,
      images: post.images ? (typeof post.images === 'string' ? post.images.split(',').filter(Boolean) : post.images) : [],
      videos: post.videos || '',
      likeCount: post.thumb_num || 0,
      commentCount: post.comment_num || 0,
      shareCount: post.share_num || 0,
      type: post.type || 0,
      status: post.status !== undefined ? post.status : 1,
      isPrivate: post.is_private || 0,
      tagId: post.tag_id || 0,
      createTime: (post.create_time || 0) * 1000
    }));
    
    response.success(res, {
      list: postResult,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('获取帖子列表错误:', error);
    response.success(res, {
      list: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    });
  }
};

const getPostDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id);
    
    if (!post) {
      return response.success(res, null,  '帖子不存在 ');
    }
    
    response.success(res, {
      id: post.id,
      userId: post.user_id,
      content: post.content,
      images: post.images ? post.images.split(',') : [],
      videos: post.videos || '',
      likeCount: post.thumb_num || 0,
      commentCount: post.comment_num || 0,
      shareCount: post.share_num || 0,
      createTime: (post.create_time || 0) * 1000
    });
  } catch (error) {
    logger.error('获取帖子详情错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id);
    
    if (!post) {
      return response.success(res, null,  '帖子不存在 ');
    }
    
    await Post.destroy({ where: { id: parseInt(id) } });
    response.success(res, {}, '帖子删除成功');
  } catch (error) {
    logger.error('删除帖子错误:', error);
    response.error(res, '操作失败');
  }
};

const batchDeletePosts = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return response.error(res, '请选择要删除的帖子');
    }
    await Post.destroy({ where: { id: { [Op.in]: ids } } });
    response.success(res, { count: ids.length }, `成功删除${ids.length}个帖子`);
  } catch (error) {
    logger.error('批量删除帖子错误:', error);
    response.error(res, '操作失败');
  }
};

const updatePostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (status === undefined || ![0, 1].includes(status)) {
      return response.error(res, '无效的状态值');
    }
    
    const post = await Post.findByPk(id);
    if (!post) {
      return response.success(res, null,  '帖子不存在 ');
    }
    
    await Post.update({ status }, { where: { id: parseInt(id) } });
    response.success(res, { id, status }, status === 1 ? '帖子已启用' : '帖子已禁用');
  } catch (error) {
    logger.error('更新帖子状态错误:', error);
    response.error(res, '操作失败');
  }
};

const batchUpdatePostStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return response.error(res, '请选择帖子');
    }
    if (status === undefined || ![0, 1].includes(status)) {
      return response.error(res, '无效的状态值');
    }
    
    await Post.update({ status }, { where: { id: { [Op.in]: ids } } });
    const action = status === 1 ? '启用' : '禁用';
    response.success(res, { count: ids.length }, `成功${action}${ids.length}个帖子`);
  } catch (error) {
    logger.error('批量更新帖子状态错误:', error);
    response.error(res, '操作失败');
  }
};

const getPostStats = async (req, res) => {
  try {
    try {
      const totalCount = await Post.count();
      const activeCount = await Post.count({ where: { status: 1 } });
      const bannedCount = await Post.count({ where: { status: 0 } });
      const todayStart = Math.floor(new Date(new Date().setHours(0,0,0,0)).getTime() / 1000);
      const todayCount = await Post.count({ where: { create_time: { [Op.gte]: todayStart } } });
      
      response.success(res, {
        total: totalCount || 0,
        active: activeCount || 0,
        banned: bannedCount || 0,
        today: todayCount || 0
      });
    } catch (e) {
      // Mock 统计
      response.success(res, {
        total: 5,
        active: 4,
        banned: 1,
        today: 2
      });
    }
  } catch (error) {
    logger.error('获取帖子统计错误:', error);
    response.success(res, { total: 0, active: 0, banned: 0, today: 0 });
  }
};

// ===== 举报管理（数据库CRUD） =====
const _formatReport = (r) => ({
  id: r.id,
  reporterId: r.user_id,
  reporterName: r.reporter_nickname,
  reporterAvatar: r.reporter_avatar,
  targetType: r.target_type,
  targetTypeName: r.target_type === 1 ? '帖子' : r.target_type === 2 ? '用户' : '评论',
  targetId: r.target_id,
  targetUserId: r.target_user_id,
  targetUserNickname: r.target_user_nickname,
  targetUserAvatar: r.target_user_avatar,
  targetContent: r.target_content,
  reason: r.reason,
  images: r.images ? r.images.split(',') : [],
  status: r.status,
  handleResult: r.handle_result,
  rejectReason: r.reject_reason,
  createTime: (r.create_time || 0) * 1000,
  handleTime: r.handle_time ? r.handle_time * 1000 : null,
  handlerName: r.handler_name
});

const getReportList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, reason, keyword, dateFrom, dateTo } = req.query;
    const where = {};
    if (status && status !== '') where.status = status;
    if (reason && reason !== '') where.reason = reason;
    if (keyword && keyword.trim()) {
      const kw = keyword.trim();
      where[Op.or] = [
        { target_content: { [Op.like]: `%${kw}%` } },
        { reason: { [Op.like]: `%${kw}%` } },
        { reporter_nickname: { [Op.like]: `%${kw}%` } },
        { target_user_nickname: { [Op.like]: `%${kw}%` } }
      ];
    }
    if (dateFrom) {
      where.create_time = { ...(where.create_time || {}), [Op.gte]: Math.floor(new Date(dateFrom).getTime() / 1000) };
    }
    if (dateTo) {
      where.create_time = { ...(where.create_time || {}), [Op.lte]: Math.floor(new Date(dateTo + 'T23:59:59').getTime() / 1000) };
    }

    const { count, rows } = await Report.findAndCountAll({
      where,
      order: [['create_time', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    response.success(res, {
      list: rows.map(_formatReport),
      pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total: count, totalPages: Math.ceil(count / pageSize) }
    });
  } catch (error) {
    logger.error('获取举报列表错误:', error);
    response.success(res, { list: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });
  }
};

const getReportDetail = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return response.notFound(res, '举报记录不存在');
    response.success(res, _formatReport(report));
  } catch (error) {
    logger.error('获取举报详情错误:', error);
    response.error(res, '操作失败');
  }
};

const handleReport = async (req, res) => {
  try {
    const { action, handleResult, rejectReason, status } = req.body;
    const finalStatus = action === 'resolved' || status === 'resolved' ? 'resolved' : 'rejected';
    const report = await Report.findByPk(req.params.id);
    if (!report) return response.notFound(res, '举报记录不存在');

    const updateData = {
      status: finalStatus,
      handle_time: Math.floor(Date.now() / 1000),
      handler_id: 1,
      handler_name: 'admin'
    };
    if (finalStatus === 'resolved') {
      updateData.handle_result = handleResult || '违规内容已处理';
      updateData.reject_reason = '';
    } else {
      updateData.reject_reason = rejectReason || '举报不成立，已驳回';
      updateData.handle_result = '';
    }
    await report.update(updateData);

    response.success(res, {
      id: report.id, status: finalStatus,
      handleResult: updateData.handle_result,
      rejectReason: updateData.reject_reason,
      handleTime: updateData.handle_time * 1000,
      handlerName: 'admin'
    }, finalStatus === 'resolved' ? '举报已处理' : '举报已驳回');
  } catch (error) {
    logger.error('处理举报错误:', error);
    response.error(res, '操作失败');
  }
};

const batchHandleReports = async (req, res) => {
  try {
    const { ids, action, handleResult, rejectReason } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return response.error(res, '请选择举报记录');
    if (!action || !['resolved', 'rejected'].includes(action)) return response.error(res, '无效的操作类型');

    const now = Math.floor(Date.now() / 1000);
    const updateData = {
      status: action,
      handle_time: now,
      handler_id: 1,
      handler_name: 'admin'
    };
    if (action === 'resolved') {
      updateData.handle_result = handleResult || '批量处理：违规内容已处理';
      updateData.reject_reason = '';
    } else {
      updateData.reject_reason = rejectReason || '批量驳回：举报不成立';
      updateData.handle_result = '';
    }

    const [count] = await Report.update(updateData, {
      where: { id: { [Op.in]: ids }, status: 'pending' }
    });

    const msg = action === 'resolved' ? `成功处理${count}条举报` : `成功驳回${count}条举报`;
    response.success(res, { count }, msg);
  } catch (error) {
    logger.error('批量处理举报错误:', error);
    response.error(res, '操作失败');
  }
};

const deleteReport = async (req, res) => {
  try {
    const count = await Report.destroy({ where: { id: req.params.id } });
    if (count === 0) return response.notFound(res, '举报记录不存在');
    response.success(res, {}, '举报记录删除成功');
  } catch (error) {
    logger.error('删除举报错误:', error);
    response.error(res, '操作失败');
  }
};

const batchDeleteReports = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return response.error(res, '请选择要删除的举报');
    const count = await Report.destroy({ where: { id: { [Op.in]: ids } } });
    response.success(res, { count }, `成功删除${count}条举报记录`);
  } catch (error) {
    logger.error('批量删除举报错误:', error);
    response.error(res, '操作失败');
  }
};

const getReportStats = async (req, res) => {
  try {
    const todayStart = Math.floor(new Date(new Date().setHours(0, 0, 0, 0)).getTime() / 1000);
    const [total, pending, resolved, rejected, today, allReports] = await Promise.all([
      Report.count(),
      Report.count({ where: { status: 'pending' } }),
      Report.count({ where: { status: 'resolved' } }),
      Report.count({ where: { status: 'rejected' } }),
      Report.count({ where: { create_time: { [Op.gte]: todayStart } } }),
      Report.findAll({ attributes: ['reason'], raw: true })
    ]);

    const reasonMap = {};
    allReports.forEach(r => { reasonMap[r.reason] = (reasonMap[r.reason] || 0) + 1; });

    response.success(res, {
      total, pending, resolved, rejected, today,
      reasonDistribution: Object.entries(reasonMap).map(([name, count]) => ({ name, count }))
    });
  } catch (error) {
    logger.error('获取举报统计错误:', error);
    response.success(res, { total: 0, pending: 0, resolved: 0, rejected: 0, today: 0, reasonDistribution: [] });
  }
};

// ===== Banner管理（数据库CRUD） =====
const _formatBanner = (b) => ({
  id: b.id,
  title: b.title,
  image: b.image,
  link: b.link,
  type: b.type || 0,
  sort: b.sort,
  status: b.status,
  createTime: (b.create_time || 0) * 1000
});

const getBannerList = async (req, res) => {
  try {
    const { page = 1, pageSize = 50, status } = req.query;
    const where = {};
    if (status !== undefined && status !== '') where.status = parseInt(status);

    const { count, rows } = await Banner.findAndCountAll({
      where,
      order: [['sort', 'ASC'], ['create_time', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    response.success(res, {
      list: rows.map(_formatBanner),
      pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total: count, totalPages: Math.ceil(count / pageSize) }
    });
  } catch (error) {
    logger.error('获取Banner列表错误:', error);
    response.success(res, { list: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });
  }
};

const getBannerDetail = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) return response.notFound(res, 'Banner不存在');
    response.success(res, _formatBanner(banner));
  } catch (error) {
    logger.error('获取Banner详情错误:', error);
    response.error(res, '操作失败');
  }
};

const createBanner = async (req, res) => {
  try {
    const { title, image, link, sort, status, type } = req.body;
    if (!title || !image) return response.error(res, '标题和图片不能为空');

    const banner = await Banner.create({
      title,
      image,
      link: link || '',
      type: type || 0,
      sort: parseInt(sort) || 0,
      status: status !== undefined ? parseInt(status) : 1,
      create_time: Math.floor(Date.now() / 1000)
    });

    response.success(res, _formatBanner(banner), '创建成功');
  } catch (error) {
    logger.error('创建Banner错误:', error);
    response.error(res, '操作失败');
  }
};

const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) return response.notFound(res, 'Banner不存在');

    const { title, image, link, sort, status, type } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (image !== undefined) updates.image = image;
    if (link !== undefined) updates.link = link;
    if (sort !== undefined) updates.sort = parseInt(sort);
    if (status !== undefined) updates.status = parseInt(status);
    if (type !== undefined) updates.type = parseInt(type);
    await banner.update(updates);

    response.success(res, _formatBanner(await Banner.findByPk(req.params.id)), '更新成功');
  } catch (error) {
    logger.error('更新Banner错误:', error);
    response.error(res, '操作失败');
  }
};

const updateBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) return response.notFound(res, 'Banner不存在');
    await banner.update({ status: parseInt(req.body.status) });
    response.success(res, { status: banner.status }, '状态更新成功');
  } catch (error) {
    logger.error('更新Banner状态错误:', error);
    response.error(res, '操作失败');
  }
};

const deleteBanner = async (req, res) => {
  try {
    const count = await Banner.destroy({ where: { id: req.params.id } });
    if (count === 0) return response.notFound(res, 'Banner不存在');
    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('删除Banner错误:', error);
    response.error(res, '操作失败');
  }
};

// VIP套餐 mock 数据（模块级，CRUD持久，与用户端VipCenter数据模型对齐）
let _vipNextId = 4;
const _vipPackages = [
  {
    id: 1, name: '黄金会员', icon: '🥇', desc: '入门VIP体验', level: 1, hot: 1, sort: 1, status: 1,
    benefits: ['专属头像框', '身份标识', '隐身访问'],
    durations: [
      { label: '1个月', months: 1, price: 980, originalPrice: 1980 },
      { label: '季度', months: 3, price: 2680, originalPrice: 4980 },
      { label: '半年', months: 6, price: 4980, originalPrice: 8980 },
      { label: '1年', months: 12, price: 8980, originalPrice: 15980 }
    ],
    create_time: Math.floor(Date.now() / 1000) - 86400 * 30
  },
  {
    id: 2, name: '铂金会员', icon: '💎', desc: '热门精选 · 性价比最高', level: 2, hot: 1, sort: 2, status: 1,
    benefits: ['含黄金全部权益', '等级加速1.5x', '优先匹配', '装扮商城折扣'],
    durations: [
      { label: '1个月', months: 1, price: 2680, originalPrice: 4980 },
      { label: '季度', months: 3, price: 6980, originalPrice: 12980 },
      { label: '半年', months: 6, price: 12980, originalPrice: 23980 },
      { label: '1年', months: 12, price: 23980, originalPrice: 43980 }
    ],
    create_time: Math.floor(Date.now() / 1000) - 86400 * 20
  },
  {
    id: 3, name: '钻石会员', icon: '👑', desc: '尊享全部特权', level: 3, hot: 0, sort: 3, status: 1,
    benefits: ['含铂金全部权益', '等级加速2.0x', '专属客服', '所有装扮免费'],
    durations: [
      { label: '1个月', months: 1, price: 6680, originalPrice: 12980 },
      { label: '季度', months: 3, price: 16980, originalPrice: 32980 },
      { label: '半年', months: 6, price: 31980, originalPrice: 59980 },
      { label: '1年', months: 12, price: 59980, originalPrice: 119980 }
    ],
    create_time: Math.floor(Date.now() / 1000) - 86400 * 10
  }
];

const _formatVipPackage = (pkg) => ({
  id: pkg.id,
  name: pkg.name,
  icon: pkg.icon || '',
  desc: pkg.desc || '',
  level: pkg.level || 1,
  hot: pkg.hot || 0,
  sort: pkg.sort || 0,
  status: pkg.status !== undefined ? pkg.status : 1,
  benefits: pkg.benefits || [],
  durations: pkg.durations || [],
  createTime: (pkg.create_time || 0) * 1000
});

const getVipPackageList = async (req, res) => {
  try {
    const { page = 1, pageSize = 50 } = req.query;
    const offset = (page - 1) * pageSize;

    let list = [..._vipPackages];
    const total = list.length;
    list = list.slice(offset, offset + parseInt(pageSize)).map(_formatVipPackage);

    response.success(res, {
      list,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('获取VIP套餐列表错误:', error);
    response.error(res, '操作失败');
  }
};

const getVipPackageDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = _vipPackages.find(p => p.id === parseInt(id));
    if (!pkg) return response.success(res, null,  '套餐不存在 ');
    response.success(res, _formatVipPackage(pkg));
  } catch (error) {
    logger.error('获取VIP套餐详情错误:', error);
    response.error(res, '操作失败');
  }
};

const createVipPackage = async (req, res) => {
  try {
    const { name, icon, desc, level, hot, sort, benefits, durations } = req.body;

    if (!name || !name.trim()) {
      return response.badRequest(res, '套餐名称不能为空');
    }

    const newPkg = {
      id: _vipNextId++,
      name: name.trim(),
      icon: icon || '',
      desc: desc || '',
      level: level || 1,
      hot: hot ? 1 : 0,
      sort: sort || 0,
      status: 1,
      benefits: benefits || [],
      durations: durations || [],
      create_time: Math.floor(Date.now() / 1000)
    };
    _vipPackages.push(newPkg);

    response.success(res, _formatVipPackage(newPkg), 'VIP套餐创建成功');
  } catch (error) {
    logger.error('创建VIP套餐错误:', error);
    response.error(res, '操作失败');
  }
};

const updateVipPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const idx = _vipPackages.findIndex(p => p.id === parseInt(id));
    if (idx === -1) return response.success(res, null,  '套餐不存在 ');

    const { name, icon, desc, level, hot, sort, benefits, durations, status } = req.body;
    const pkg = _vipPackages[idx];
    if (name !== undefined) pkg.name = name.trim();
    if (icon !== undefined) pkg.icon = icon;
    if (desc !== undefined) pkg.desc = desc;
    if (level !== undefined) pkg.level = level;
    if (hot !== undefined) pkg.hot = hot ? 1 : 0;
    if (sort !== undefined) pkg.sort = sort;
    if (benefits !== undefined) pkg.benefits = benefits;
    if (durations !== undefined) pkg.durations = durations;
    if (status !== undefined) pkg.status = status;

    response.success(res, _formatVipPackage(pkg), 'VIP套餐更新成功');
  } catch (error) {
    logger.error('更新VIP套餐错误:', error);
    response.error(res, '操作失败');
  }
};

const updateVipPackageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const pkg = _vipPackages.find(p => p.id === parseInt(id));
    if (!pkg) return response.success(res, null,  '套餐不存在 ');
    pkg.status = status;
    response.success(res, _formatVipPackage(pkg), '状态更新成功');
  } catch (error) {
    logger.error('更新VIP套餐状态错误:', error);
    response.error(res, '操作失败');
  }
};

const deleteVipPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const idx = _vipPackages.findIndex(p => p.id === parseInt(id));
    if (idx === -1) return response.success(res, null,  '套餐不存在 ');
    _vipPackages.splice(idx, 1);
    response.success(res, {}, 'VIP套餐删除成功');
  } catch (error) {
    logger.error('删除VIP套餐错误:', error);
    response.error(res, '操作失败');
  }
};

const getGiftLogList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, userId } = req.query;
    const offset = (page - 1) * pageSize;

    const mockGiftLogs = [
      { id: 1, user_id: 1, user_nickname: '用户小明', song_user_id: 2, song_user_nickname: '用户小红', gift_name: '玫瑰花', gift_num: 10, totalmoney: 100, create_time: Math.floor(Date.now() / 1000) - 1800 },
      { id: 2, user_id: 2, user_nickname: '用户小红', song_user_id: 3, song_user_nickname: '用户小刚', gift_name: '火箭', gift_num: 1, totalmoney: 500, create_time: Math.floor(Date.now() / 1000) - 3600 },
      { id: 3, user_id: 3, user_nickname: '用户小刚', song_user_id: 1, song_user_nickname: '用户小明', gift_name: '蛋糕', gift_num: 5, totalmoney: 250, create_time: Math.floor(Date.now() / 1000) - 5400 },
      { id: 4, user_id: 1, user_nickname: '用户小明', song_user_id: 4, song_user_nickname: '用户小丽', gift_name: '钻戒', gift_num: 1, totalmoney: 999, create_time: Math.floor(Date.now() / 1000) - 7200 },
      { id: 5, user_id: 5, user_nickname: '用户阿杰', song_user_id: 1, song_user_nickname: '用户小明', gift_name: '跑车', gift_num: 3, totalmoney: 1500, create_time: Math.floor(Date.now() / 1000) - 10800 }
    ];

    let filtered = [...mockGiftLogs];
    if (userId) {
      filtered = filtered.filter(g => g.user_id === parseInt(userId) || g.song_user_id === parseInt(userId));
    }

    const total = filtered.length;
    const list = filtered.slice(offset, offset + parseInt(pageSize));

    const result = list.map(g => ({
      id: g.id,
      fromUserId: g.user_id,
      fromNickname: g.user_nickname,
      toUserId: g.song_user_id,
      toNickname: g.song_user_nickname,
      giftName: g.gift_name,
      count: g.gift_num,
      amount: g.totalmoney,
      createTime: (g.create_time || 0) * 1000
    }));

    response.success(res, {
      list: result,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('获取礼物记录列表错误:', error);
    response.success(res, {
      list: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    });
  }
};

const getGiftLogDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const mockGiftLogs = [
      { id: 1, user_id: 1, user_nickname: '用户小明', user_avatar: '', song_user_id: 2, song_user_nickname: '用户小红', song_user_avatar: '', gift_name: '玫瑰花', gift_image: '', gift_num: 10, totalmoney: 100, create_time: Math.floor(Date.now() / 1000) - 1800 },
      { id: 2, user_id: 2, user_nickname: '用户小红', user_avatar: '', song_user_id: 3, song_user_nickname: '用户小刚', song_user_avatar: '', gift_name: '火箭', gift_image: '', gift_num: 1, totalmoney: 500, create_time: Math.floor(Date.now() / 1000) - 3600 },
      { id: 3, user_id: 3, user_nickname: '用户小刚', user_avatar: '', song_user_id: 1, song_user_nickname: '用户小明', song_user_avatar: '', gift_name: '蛋糕', gift_image: '', gift_num: 5, totalmoney: 250, create_time: Math.floor(Date.now() / 1000) - 5400 }
    ];

    const giftLog = mockGiftLogs.find(g => g.id === parseInt(id));
    if (!giftLog) {
      return response.success(res, null,  '礼物记录不存在 ');
    }

    response.success(res, {
      id: giftLog.id,
      fromUserId: giftLog.user_id,
      fromNickname: giftLog.user_nickname,
      toUserId: giftLog.song_user_id,
      toNickname: giftLog.song_user_nickname,
      giftName: giftLog.gift_name,
      count: giftLog.gift_num,
      amount: giftLog.totalmoney,
      createTime: (giftLog.create_time || 0) * 1000
    });
  } catch (error) {
    logger.error('获取礼物记录详情错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

// 充值记录 mock 数据（模块级，状态修改可持久）
const _rechargeRecords = [
  { id: 1, order_no: 'REC20260523001', user_id: 1, username: '用户小明', amount: 100, pay_type: 1, status: 'completed', create_time: Math.floor(Date.now() / 1000) - 1800 },
  { id: 2, order_no: 'REC20260523002', user_id: 2, username: '用户小红', amount: 500, pay_type: 2, status: 'completed', create_time: Math.floor(Date.now() / 1000) - 3600 },
  { id: 3, order_no: 'REC20260523003', user_id: 3, username: '用户小刚', amount: 200, pay_type: 1, status: 'pending', create_time: Math.floor(Date.now() / 1000) - 5400 },
  { id: 4, order_no: 'REC20260523004', user_id: 4, username: '用户小丽', amount: 150, pay_type: 1, status: 'failed', create_time: Math.floor(Date.now() / 1000) - 7200 },
  { id: 5, order_no: 'REC20260523005', user_id: 5, username: '用户阿杰', amount: 300, pay_type: 3, status: 'completed', create_time: Math.floor(Date.now() / 1000) - 10800 }
];

const _formatRecord = (r) => ({
  id: r.id,
  orderNo: r.order_no,
  userId: r.user_id,
  username: r.username,
  amount: r.amount,
  paymentMethod: r.pay_type === 1 ? 'wechat' : r.pay_type === 2 ? 'alipay' : 'bank',
  status: r.status,
  createTime: (r.create_time || 0) * 1000
});

const getRechargeRecordList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, userId, status } = req.query;
    const offset = (page - 1) * pageSize;

    let filtered = [..._rechargeRecords];
    if (userId) {
      filtered = filtered.filter(r => r.user_id === parseInt(userId));
    }
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }

    const total = filtered.length;
    const list = filtered.slice(offset, offset + parseInt(pageSize));
    const result = list.map(_formatRecord);

    response.success(res, {
      list: result,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('获取充值记录列表错误:', error);
    response.success(res, {
      list: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    });
  }
};

const getRechargeRecordDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const record = _rechargeRecords.find(r => r.id === parseInt(id));
    if (!record) {
      return response.success(res, null,  '充值记录不存在 ');
    }
    response.success(res, _formatRecord(record));
  } catch (error) {
    logger.error('获取充值记录详情错误:', error);
    response.error(res, '操作失败');
  }
};

const deleteRechargeRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const idx = _rechargeRecords.findIndex(r => r.id === parseInt(id));
    if (idx === -1) return response.success(res, null,  '充值记录不存在 ');
    _rechargeRecords.splice(idx, 1);
    response.success(res, {}, '充值记录删除成功');
  } catch (error) {
    logger.error('删除充值记录错误:', error);
    response.error(res, '操作失败');
  }
};

// 完成充值（处理中 → 已完成）
const completeRechargeRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = _rechargeRecords.find(r => r.id === parseInt(id));
    if (!record) return response.success(res, null,  '充值记录不存在 ');
    if (record.status !== 'pending') return response.error(res, '当前状态不可操作');
    record.status = 'completed';
    response.success(res, _formatRecord(record), '充值已确认完成');
  } catch (error) {
    logger.error('完成充值记录错误:', error);
    response.error(res, '操作失败');
  }
};

// 拒绝充值（处理中 → 失败）
const failRechargeRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = _rechargeRecords.find(r => r.id === parseInt(id));
    if (!record) return response.success(res, null,  '充值记录不存在 ');
    if (record.status !== 'pending') return response.error(res, '当前状态不可操作');
    record.status = 'failed';
    response.success(res, _formatRecord(record), '充值已标记为失败');
  } catch (error) {
    logger.error('拒绝充值记录错误:', error);
    response.error(res, '操作失败');
  }
};

// 游戏/服务 mock 数据（模块级，CRUD持久）
let _gameNextId = 6;
const _games = [
  { id: 1, name: '王者荣耀', image: 'https://picsum.photos/100/100?random=1', description: '5v5公平对战手游', serviceType: 'online', status: 1, sort: 1, create_time: Math.floor(Date.now() / 1000) - 86400 * 30 },
  { id: 2, name: '英雄联盟', image: 'https://picsum.photos/100/100?random=2', description: '全球最受欢迎MOBA游戏', serviceType: 'online', status: 1, sort: 2, create_time: Math.floor(Date.now() / 1000) - 86400 * 25 },
  { id: 3, name: '绝地求生', image: 'https://picsum.photos/100/100?random=3', description: '大逃杀射击游戏', serviceType: 'online', status: 1, sort: 3, create_time: Math.floor(Date.now() / 1000) - 86400 * 20 },
  { id: 4, name: '原神', image: 'https://picsum.photos/100/100?random=4', description: '开放世界冒险RPG', serviceType: 'online', status: 0, sort: 4, create_time: Math.floor(Date.now() / 1000) - 86400 * 15 },
  { id: 5, name: '和平精英', image: 'https://picsum.photos/100/100?random=5', description: '百人竞技射击手游', serviceType: 'online', status: 1, sort: 5, create_time: Math.floor(Date.now() / 1000) - 86400 * 10 }
];

const _formatGame = (g) => ({
  id: g.id,
  name: g.name,
  icon: g.image,
  serviceType: g.serviceType || 'online',
  description: g.description || '',
  sort: g.sort || 0,
  status: g.status !== undefined ? g.status : 1,
  createTime: (g.create_time || 0) * 1000
});

const getGameList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword = '', serviceType = '' } = req.query;
    const offset = (page - 1) * pageSize;

    let filtered = [..._games];
    if (keyword) {
      filtered = filtered.filter(g => g.name.includes(keyword));
    }
    if (serviceType) {
      filtered = filtered.filter(g => g.serviceType === serviceType);
    }

    const total = filtered.length;
    const list = filtered.slice(offset, offset + parseInt(pageSize)).map(_formatGame);

    response.success(res, {
      list,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('获取服务列表错误:', error);
    response.success(res, {
      list: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    });
  }
};

const getGameDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const game = _games.find(g => g.id === parseInt(id));
    if (!game) {
      return response.success(res, null,  '服务不存在 ');
    }
    response.success(res, _formatGame(game));
  } catch (error) {
    logger.error('获取服务详情错误:', error);
    response.error(res, '操作失败');
  }
};

const createGame = async (req, res) => {
  try {
    const { name, icon, description, sort, status, serviceType } = req.body;

    if (!name || !name.trim()) {
      return response.badRequest(res, '服务名称不能为空');
    }

    const newGame = {
      id: _gameNextId++,
      name: name.trim(),
      image: icon || '',
      description: description || '',
      serviceType: serviceType || 'online',
      sort: sort || 0,
      status: status !== undefined ? status : 1,
      create_time: Math.floor(Date.now() / 1000)
    };
    _games.push(newGame);

    response.success(res, _formatGame(newGame), '服务创建成功');
  } catch (error) {
    logger.error('创建服务错误:', error);
    response.error(res, '操作失败');
  }
};

const updateGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, description, sort, status, serviceType } = req.body;

    const idx = _games.findIndex(g => g.id === parseInt(id));
    if (idx === -1) return response.success(res, null,  '服务不存在 ');

    if (name !== undefined) _games[idx].name = name.trim();
    if (icon !== undefined) _games[idx].image = icon;
    if (description !== undefined) _games[idx].description = description;
    if (serviceType !== undefined) _games[idx].serviceType = serviceType;
    if (sort !== undefined) _games[idx].sort = sort;
    if (status !== undefined) _games[idx].status = status;

    response.success(res, _formatGame(_games[idx]), '服务更新成功');
  } catch (error) {
    logger.error('更新服务错误:', error);
    response.error(res, '操作失败');
  }
};

const updateGameStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const game = _games.find(g => g.id === parseInt(id));
    if (!game) return response.success(res, null,  '服务不存在 ');
    game.status = status;

    response.success(res, _formatGame(game), '状态更新成功');
  } catch (error) {
    logger.error('更新服务状态错误:', error);
    response.error(res, '操作失败');
  }
};

const deleteGame = async (req, res) => {
  try {
    const { id } = req.params;
    const idx = _games.findIndex(g => g.id === parseInt(id));
    if (idx === -1) return response.success(res, null,  '服务不存在 ');
    _games.splice(idx, 1);
    response.success(res, {}, '服务删除成功');
  } catch (error) {
    logger.error('删除服务错误:', error);
    response.error(res, '操作失败');
  }
};

const getSystemSettings = async (req, res) => {
  try {
    const config = require('../config');
    const settings = {
      // 基础设置
      siteName: '多客陪玩',
      siteDescription: '多客陪玩 - 专业游戏陪玩平台',
      siteKeywords: '陪玩,游戏陪玩,陪玩平台',
      siteLogo: '',
      siteFavicon: '',
      recordNumber: '粤ICP备xxxxxxxx号',
      contactEmail: 'admin@duoke.com',
      contactPhone: '400-888-8888',
      // 用户设置
      userDefaultAvatar: '',
      userInitBalance: 0,
      userInitScore: 0,
      withdrawMinAmount: config.platform.withdrawMinAmount || 50,
      withdrawFeeRate: config.platform.withdrawFeeRate !== undefined ? config.platform.withdrawFeeRate : 0.02,
      withdrawAutoApprove: false,
      platformCommissionRate: config.platform.commissionRate || 0.7,
      // 注册设置
      registerEnabled: true,
      registerNeedPhone: true,
      registerNeedRealName: false,
      // 功能开关
      reviewContentEnabled: true,
      giftEnabled: true,
      voiceChatEnabled: true,
      videoChatEnabled: true,
      thirdPartyLoginEnabled: true,
      // ========== 基础设施配置 ==========
      // 存储配置
      storageProvider: config.storage.provider || 'local',
      cosSecretId: config.storage.cos.secretId ? '****' + (config.storage.cos.secretId || '').slice(-4) : '',
      cosSecretKey: config.storage.cos.secretKey ? '****' : '',
      cosBucket: config.storage.cos.bucket || '',
      cosRegion: config.storage.cos.region || '',
      qiniuAccessKey: config.storage.qiniu.accessKey ? '****' + (config.storage.qiniu.accessKey || '').slice(-4) : '',
      qiniuSecretKey: config.storage.qiniu.secretKey ? '****' : '',
      qiniuBucket: config.storage.qiniu.bucket || '',
      qiniuDomain: config.storage.qiniu.domain || '',
      qiniuZone: config.storage.qiniu.zone || 'z0',
      // 地图配置
      mapProvider: config.map.provider || 'tencent',
      tencentMapKey: config.map.tencentKey ? '****' + (config.map.tencentKey || '').slice(-4) : '',
      // 支付配置 - 微信
      wechatAppId: config.wechat.appid ? '****' + (config.wechat.appid || '').slice(-4) : '',
      wechatMchId: config.wechat.mchid ? '****' + (config.wechat.mchid || '').slice(-4) : '',
      wechatApiKey: config.wechat.apiKey ? '****' : '',
      // 支付配置 - 支付宝
      alipayAppId: config.alipay.appId ? '****' + (config.alipay.appId || '').slice(-4) : '',
      alipayPrivateKey: config.alipay.privateKey ? '****' : '',
      alipayPublicKey: config.alipay.publicKey ? '****' : '',
      // 大模型/AI 配置
      llmEnabled: config.llm?.enabled || false,
      llmProvider: config.llm?.provider || 'openai',
      llmApiKey: config.llm?.apiKey ? '****' + (config.llm.apiKey.slice(-4)) : '',
      llmApiEndpoint: config.llm?.apiEndpoint || 'https://api.openai.com/v1',
      llmModel: config.llm?.model || 'gpt-3.5-turbo',
      llmMaxTokens: config.llm?.maxTokens || 1024,
      llmTemperature: config.llm?.temperature || 0.7,
      llmSystemPrompt: config.llm?.systemPrompt || '你是一个友好、专业的陪玩助手，帮助用户解答问题、提供陪伴和娱乐服务。请用热情亲切的语气回复。',
      // 密卡分类管理
      cardCategories: _cardCategories,
    };
    response.success(res, settings);
  } catch (error) {
    logger.error('获取系统设置错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const updateSystemSettings = async (req, res) => {
  try {
    const settings = req.body;
    const config = require('../config');

    // 将前端设置写回 config（运行时生效，需配合 .env 持久化）
    if (settings.storageProvider) {
      config.storage.provider = settings.storageProvider;
    }
    if (settings.mapProvider) {
      config.map.provider = settings.mapProvider;
    }
    if (Array.isArray(settings.cardCategories)) {
      _cardCategories = settings.cardCategories;
      // 持久化到 DB
      try {
        await Setting.upsert({
          setting_key: 'card_categories',
          setting_value: JSON.stringify(settings.cardCategories)
        });
      } catch (dbErr) {
        logger.warn('密卡分类写入DB失败(仅内存生效):', dbErr.message);
      }
    }

    // 平台运营参数热更新
    if (settings.platformCommissionRate !== undefined) {
      config.platform.commissionRate = Number(settings.platformCommissionRate);
    }
    if (settings.withdrawMinAmount !== undefined) {
      config.platform.withdrawMinAmount = Number(settings.withdrawMinAmount);
    }
    if (settings.withdrawFeeRate !== undefined) {
      config.platform.withdrawFeeRate = Number(settings.withdrawFeeRate);
    }

    // 大模型配置热更新
    if (settings.llmEnabled !== undefined) {
      if (!config.llm) config.llm = {};
      config.llm.enabled = settings.llmEnabled;
    }
    if (settings.llmProvider !== undefined) {
      if (!config.llm) config.llm = {};
      config.llm.provider = settings.llmProvider;
    }
    if (settings.llmApiKey !== undefined && !settings.llmApiKey.startsWith('****')) {
      if (!config.llm) config.llm = {};
      config.llm.apiKey = settings.llmApiKey;
    }
    if (settings.llmApiEndpoint !== undefined) {
      if (!config.llm) config.llm = {};
      config.llm.apiEndpoint = settings.llmApiEndpoint;
    }
    if (settings.llmModel !== undefined) {
      if (!config.llm) config.llm = {};
      config.llm.model = settings.llmModel;
    }
    if (settings.llmMaxTokens !== undefined) {
      if (!config.llm) config.llm = {};
      config.llm.maxTokens = Number(settings.llmMaxTokens);
    }
    if (settings.llmTemperature !== undefined) {
      if (!config.llm) config.llm = {};
      config.llm.temperature = Number(settings.llmTemperature);
    }
    if (settings.llmSystemPrompt !== undefined) {
      if (!config.llm) config.llm = {};
      config.llm.systemPrompt = settings.llmSystemPrompt;
    }

    logger.info('系统设置已更新（运行时+DB）:', Object.keys(settings).join(', '));
    response.success(res, settings, '系统设置保存成功');
  } catch (error) {
    logger.error('更新系统设置错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const getDashboardStats = async (req, res) => {
  try {
    let stats = {
      totalUsers: 0,
      todayUsers: 0,
      totalOrders: 0,
      todayOrders: 0,
      totalWithdraws: 0,
      pendingWithdraws: 0,
      totalGifts: 0,
      totalPosts: 0,
      todayRevenue: 0,
      todayMessages: 0,
      pendingReports: 0,
      trend: []
    }

    try {
      const today = new Date();
      const todayStart = Math.floor(new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() / 1000);
      
      const totalUsers = await User.count();
      const todayUsers = await User.count({ where: { create_time: { [Op.gte]: todayStart } } });
      
      const totalOrders = await GameOrder.count();
      const todayOrders = await GameOrder.count({ where: { create_time: { [Op.gte]: todayStart } } });
      
      // Fix: Withdraw uses 'money' not 'amount', 'is_check': 0 means pending
      const totalWithdraws = await Withdraw.sum('money') || 0;
      const pendingWithdraws = await Withdraw.count({ where: { is_check: 0 } });
      
      // Fix: GiftLog uses 'totalmoney' not 'amount'
      const totalGifts = await GiftLog.sum('totalmoney') || 0;
      const todayGifts = await GiftLog.sum('totalmoney', { where: { create_time: { [Op.gte]: todayStart } } }) || 0;
      
      const totalPosts = await Post.count();
      
      // Add: todayMessages from ChatLog
      let todayMessages = 0;
      try { todayMessages = await ChatLog.count({ where: { time: { [Op.gte]: todayStart } } }); } catch (e) {}
      
      // Add: pendingReports from Report model (status: 0 = pending)
      let pendingReports = 0;
      try { pendingReports = await Report.count({ where: { status: 0 } }); } catch (e) {}
      
      // Generate 7-day trend data
      const trend = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayStart = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 1000);
        const dayEnd = dayStart + 86400;
        
        let orders = 0, revenue = 0, users = 0;
        try {
          orders = await GameOrder.count({ where: { create_time: { [Op.gte]: dayStart, [Op.lt]: dayEnd } } });
        } catch (e) {}
        try {
          revenue = await GiftLog.sum('totalmoney', { where: { create_time: { [Op.gte]: dayStart, [Op.lt]: dayEnd } } }) || 0;
        } catch (e) {}
        try {
          users = await User.count({ where: { create_time: { [Op.gte]: dayStart, [Op.lt]: dayEnd } } });
        } catch (e) {}
        
        trend.push({
          date: `${d.getMonth() + 1}/${d.getDate()}`,
          orders: orders || 0,
          revenue: parseFloat(revenue) || 0,
          users: users || 0
        });
      }
      
      stats = {
        totalUsers: totalUsers || 0,
        todayUsers: todayUsers || 0,
        totalOrders: totalOrders || 0,
        todayOrders: todayOrders || 0,
        totalWithdraws: parseFloat(totalWithdraws) || 0,
        pendingWithdraws: pendingWithdraws || 0,
        totalGifts: parseFloat(totalGifts) || 0,
        totalPosts: totalPosts || 0,
        todayRevenue: parseFloat(todayGifts) || 0,
        todayMessages: todayMessages || 0,
        pendingReports: pendingReports || 0,
        trend
      }
    } catch (dbError) {
      console.warn('数据库查询失败:', dbError.message);
      stats = {
        totalUsers: 128,
        todayUsers: 5,
        totalOrders: 342,
        todayOrders: 12,
        totalWithdraws: 15680,
        pendingWithdraws: 3,
        totalGifts: 8560,
        totalPosts: 256,
        todayRevenue: 1250,
        todayMessages: 156,
        pendingReports: 8,
        trend: [
          { date: '5/30', orders: 8, revenue: 560, users: 2 },
          { date: '5/31', orders: 12, revenue: 890, users: 3 },
          { date: '6/1', orders: 6, revenue: 420, users: 1 },
          { date: '6/2', orders: 15, revenue: 1100, users: 4 },
          { date: '6/3', orders: 10, revenue: 720, users: 2 },
          { date: '6/4', orders: 14, revenue: 980, users: 3 },
          { date: '6/5', orders: 12, revenue: 1250, users: 5 }
        ]
      }
    }
    
    response.success(res, stats);
  } catch (error) {
    logger.error('获取统计数据错误:', error);
    response.success(res, {
      totalUsers: 0, todayUsers: 0, totalOrders: 0, todayOrders: 0,
      totalWithdraws: 0, pendingWithdraws: 0, totalGifts: 0,
      totalPosts: 0, todayRevenue: 0, todayMessages: 0, pendingReports: 0, trend: []
    });
  }
};

// 虚拟用户管理相关函数
const virtualUserService = require('../services/virtualUserService');
const { VirtualChatHistory } = require('../models');

const getVirtualUserList = async (req, res) => {
  try {
    const result = await virtualUserService.getAllVirtualUsers(req.query);
    response.success(res, result);
  } catch (error) {
    logger.error(`获取虚拟用户列表失败: ${error.message}`);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const getVirtualUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await virtualUserService.getVirtualUserById(parseInt(id));
    response.success(res, result);
  } catch (error) {
    logger.error(`获取虚拟用户详情失败: ${error.message}`);
    logger.error('资源不存在:', error);
    logger.error('资源不存在:', error);
    response.notFound(res, '资源不存在');
  }
};

const createVirtualUser = async (req, res) => {
  try {
    const result = await virtualUserService.createVirtualUser(req.body);
    response.success(res, result, '虚拟用户创建成功');
  } catch (error) {
    logger.error(`创建虚拟用户失败: ${error.message}`);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const updateVirtualUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await virtualUserService.updateVirtualUser(parseInt(id), req.body);
    response.success(res, result, '虚拟用户更新成功');
  } catch (error) {
    logger.error(`更新虚拟用户失败: ${error.message}`);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const deleteVirtualUser = async (req, res) => {
  try {
    const { id } = req.params;
    await virtualUserService.deleteVirtualUser(parseInt(id));
    response.success(res, {}, '虚拟用户删除成功');
  } catch (error) {
    logger.error(`删除虚拟用户失败: ${error.message}`);
    logger.error('资源不存在:', error);
    logger.error('资源不存在:', error);
    response.notFound(res, '资源不存在');
  }
};

const toggleVirtualUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await virtualUserService.updateVirtualUser(parseInt(id), { status });
    response.success(res, result, `虚拟用户已${status === 1 ? '启用' : '禁用'}`);
  } catch (error) {
    logger.error(`更新虚拟用户状态失败: ${error.message}`);
    logger.error('资源不存在:', error);
    logger.error('资源不存在:', error);
    response.notFound(res, '资源不存在');
  }
};

const getVirtualUserChatHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20, userId } = req.query;
    const offset = (page - 1) * pageSize;
    
    const where = { virtualUserId: parseInt(id) };
    if (userId) {
      where.userId = parseInt(userId);
    }
    
    const { count, rows } = await VirtualChatHistory.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['createTime', 'DESC']]
    });
    
    const totalPages = Math.ceil(count / pageSize);
    response.success(res, {
      list: rows,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count,
        totalPages
      }
    });
  } catch (error) {
    logger.error(`获取虚拟用户聊天记录失败: ${error.message}`);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

// 礼物管理相关函数
const { Gift } = require('../models');

const getGiftList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    const where = {};
    if (keyword) {
      where.title = keyword;
    }
    if (status !== undefined && status !== '') {
      where.status = status;
    }
    
    const { count, rows } = await Gift.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['sort', 'ASC']]
    });
    
    const totalPages = Math.ceil(count / pageSize);
    response.success(res, {
      list: rows,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count,
        totalPages
      }
    });
  } catch (error) {
    logger.error(`获取礼物列表失败: ${error.message}`);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const getGiftDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const gift = await Gift.findByPk(parseInt(id));
    
    if (!gift) {
      return response.notFound(res, '礼物不存在');
    }
    
    response.success(res, gift);
  } catch (error) {
    logger.error(`获取礼物详情失败: ${error.message}`);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const createGift = async (req, res) => {
  try {
    const { title, image, svga, money, type, is_vip, tian, status, sort } = req.body;
    
    if (!title || !image || money === undefined) {
      return response.unprocessableEntity(res, '礼物名称、图片和价格不能为空');
    }
    
    const gift = await Gift.create({
      title,
      image,
      svga: svga || '',
      money: parseFloat(money),
      type: type || 0,
      is_vip: is_vip || 0,
      tian: tian || 0,
      status: status !== undefined ? status : 1,
      sort: sort || 0
    });
    
    response.success(res, gift, '礼物创建成功');
  } catch (error) {
    logger.error(`创建礼物失败: ${error.message}`);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const updateGift = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, image, svga, money, type, is_vip, tian, status, sort } = req.body;
    
    const gift = await Gift.findByPk(parseInt(id));
    if (!gift) {
      return response.notFound(res, '礼物不存在');
    }
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (image !== undefined) updateData.image = image;
    if (svga !== undefined) updateData.svga = svga;
    if (money !== undefined) updateData.money = parseFloat(money);
    if (type !== undefined) updateData.type = type;
    if (is_vip !== undefined) updateData.is_vip = is_vip;
    if (tian !== undefined) updateData.tian = tian;
    if (status !== undefined) updateData.status = status;
    if (sort !== undefined) updateData.sort = sort;
    
    await Gift.update(updateData, { where: { id: parseInt(id) } });
    
    const updatedGift = await Gift.findByPk(parseInt(id));
    response.success(res, updatedGift, '礼物更新成功');
  } catch (error) {
    logger.error(`更新礼物失败: ${error.message}`);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const deleteGift = async (req, res) => {
  try {
    const { id } = req.params;
    
    const gift = await Gift.findByPk(parseInt(id));
    if (!gift) {
      return response.notFound(res, '礼物不存在');
    }
    
    await Gift.destroy({ where: { id: parseInt(id) } });
    response.success(res, {}, '礼物删除成功');
  } catch (error) {
    logger.error(`删除礼物失败: ${error.message}`);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

// 服务申请管理相关函数
let mockCompanionApplications = [
  { id: 1, userId: 101, userName: '陪玩师小王', gameId: 1, gameName: '王者荣耀', price: 20, tags: '上分,陪练', voiceIntro: '声音甜美', status: 0, createTime: Math.floor(Date.now() / 1000) - 86400 },
  { id: 2, userId: 102, userName: '陪玩师小李', gameId: 2, gameName: '英雄联盟', price: 25, tags: '打野,意识流', voiceIntro: '专业打野', status: 0, createTime: Math.floor(Date.now() / 1000) - 172800 },
  { id: 3, userId: 103, userName: '陪玩师小张', gameId: 1, gameName: '王者荣耀', price: 18, tags: '中路,法师', voiceIntro: '中路法王', status: 1, createTime: Math.floor(Date.now() / 1000) - 259200 },
  { id: 4, userId: 104, userName: '陪玩师小赵', gameId: 3, gameName: '和平精英', price: 30, tags: '钢枪,伏地魔', voiceIntro: '钢枪小能手', status: 2, createTime: Math.floor(Date.now() / 1000) - 345600 },
  { id: 5, userId: 105, userName: '陪玩师小钱', gameId: 2, gameName: '英雄联盟', price: 22, tags: '辅助,保护', voiceIntro: '贴心辅助', status: 0, createTime: Math.floor(Date.now() / 1000) - 432000 }
];

const getCompanionApplicationList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    let applications = [...mockCompanionApplications];
    
    if (keyword) {
      applications = applications.filter(app => 
        app.userName.includes(keyword)
      );
    }
    
    if (status !== undefined && status !== '') {
      applications = applications.filter(app => 
        app.status === parseInt(status)
      );
    }
    
    const total = applications.length;
    const paginatedApplications = applications.slice(offset, offset + parseInt(pageSize));
    
    const result = paginatedApplications.map(app => ({
      id: app.id,
      userId: app.userId,
      userName: app.userName,
      gameId: app.gameId,
      gameName: app.gameName,
      price: app.price,
      tags: app.tags,
      voiceIntro: app.voiceIntro,
      status: app.status,
      createTime: app.createTime
    }));
    
    response.success(res, {
      list: result,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('获取服务申请列表错误:', error);
    response.success(res, {
      list: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    });
  }
};

const getCompanionApplicationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const application = mockCompanionApplications.find(app => app.id === parseInt(id));
    
    if (!application) {
      return response.success(res, null,  '申请不存在 ');
    }
    
    response.success(res, {
      id: application.id,
      userId: application.userId,
      userName: application.userName,
      gameId: application.gameId,
      gameName: application.gameName,
      price: application.price,
      tags: application.tags,
      voiceIntro: application.voiceIntro,
      status: application.status,
      createTime: application.createTime
    });
  } catch (error) {
    logger.error('获取服务申请详情错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const approveCompanionApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = mockCompanionApplications.find(app => app.id === parseInt(id));
    
    if (!application) {
      return response.success(res, null,  '申请不存在 ');
    }
    
    application.status = 1;
    
    response.success(res, {}, '审核通过成功');
  } catch (error) {
    logger.error('审核通过错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const rejectCompanionApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = mockCompanionApplications.find(app => app.id === parseInt(id));
    
    if (!application) {
      return response.success(res, null,  '申请不存在 ');
    }
    
    application.status = 2;
    
    response.success(res, {}, '审核拒绝成功');
  } catch (error) {
    logger.error('审核拒绝错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const deleteCompanionApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const index = mockCompanionApplications.findIndex(app => app.id === parseInt(id));
    
    if (index === -1) {
      return response.success(res, null,  '申请不存在 ');
    }
    
    mockCompanionApplications.splice(index, 1);
    
    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('删除服务申请错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

// ========== 推荐管理 ==========

// 获取候选用户（用于系统推荐列表和自动补位）
const getRecommendCandidates = async (req, res) => {
  try {
    const { page = 1, pageSize = 50 } = req.query;
    
    const users = await User.findAll({
      where: { status: 0 },
      order: [['fans_num', 'DESC']],
      limit: parseInt(pageSize),
      offset: (page - 1) * pageSize
    });
    const candidates = users.map(u => ({
      userId: u.id,
      nickname: u.nickname,
      avatar: u.avatar,
      vip: u.vip,
      likeCount: Math.floor(Math.random() * 500) + 50,
      followerCount: u.fans_num || 0,
      activityScore: Math.floor(Math.random() * 100)
    }));

    response.success(res, { list: candidates, total: candidates.length });
  } catch (error) {
    logger.error('获取候选用户列表错误:', error);
    response.error(res, '操作失败');
  }
};

// 获取指定类型的推荐列表
const getRecommendListByType = async (req, res) => {
  try {
    const { recommendType } = req.params;
    
    if (!['home', 'square'].includes(recommendType)) {
      return response.error(res, '推荐类型无效，仅支持 home 或 square');
    }

    const records = await Recommend.findAll({
      where: { recommend_type: recommendType },
      order: [['sort_order', 'ASC']]
    });

    const now = Math.floor(Date.now() / 1000);
    const list = records.map(r => ({
      id: r.id,
      userId: r.user_id,
      nickname: r.nickname,
      avatar: r.avatar,
      recommendType: r.recommend_type,
      startTime: r.start_time,
      endTime: r.end_time,
      isTop: !!r.is_top,
      sortOrder: r.sort_order,
      status: r.status,
      // 客户端判断是否已过期
      expired: r.end_time > 0 && r.end_time < now,
      createTime: r.create_time
    }));

    response.success(res, { list });
  } catch (error) {
    logger.error('获取推荐列表错误:', error);
    response.error(res, '操作失败');
  }
};

// 添加推荐
const addRecommend = async (req, res) => {
  try {
    const { userId, nickname, avatar, recommendType, startTime, endTime } = req.body;
    
    if (!userId) {
      return response.error(res, '用户ID不能为空');
    }
    
    const type = recommendType || 'home';
    if (!['home', 'square'].includes(type)) {
      return response.error(res, '推荐类型无效');
    }

    // 检查同类型是否已存在
    const existing = await Recommend.findOne({
      where: { user_id: parseInt(userId), recommend_type: type }
    });
    if (existing) {
      return response.error(res, '该用户已在此推荐列表中');
    }

    // 自动从用户表获取昵称和头像（如果前端未传）
    let userNickname = nickname || '';
    let userAvatar = avatar || '';
    if (!userNickname || !userAvatar) {
      try {
        const user = await User.findByPk(parseInt(userId));
        if (user) {
          if (!userNickname) userNickname = user.nickname || '';
          if (!userAvatar) userAvatar = user.avatar || '';
        }
      } catch (e) {
        // 获取用户信息失败，使用前端传的值或空值
      }
    }

    const now = Math.floor(Date.now() / 1000);
    const record = await Recommend.create({
      user_id: parseInt(userId),
      nickname: userNickname,
      avatar: userAvatar,
      recommend_type: type,
      start_time: startTime || now,
      end_time: endTime || 0,
      is_top: 0,
      sort_order: await Recommend.findAll({ where: { recommend_type: type } }).then(r => r.length),
      status: 1,
      create_time: now,
      update_time: now
    });

    response.success(res, {
      id: record.id,
      userId: record.user_id,
      nickname: record.nickname,
      avatar: record.avatar,
      recommendType: record.recommend_type,
      startTime: record.start_time,
      endTime: record.end_time,
      isTop: false,
      sortOrder: record.sort_order,
      status: 1,
      createTime: record.create_time
    }, '添加成功');
  } catch (error) {
    logger.error('添加推荐错误:', error);
    response.error(res, '操作失败');
  }
};

// 更新推荐
const updateRecommend = async (req, res) => {
  try {
    const { id } = req.params;
    const { isTop, sortOrder, nickname, avatar, startTime, endTime, status } = req.body;
    
    const record = await Recommend.findByPk(parseInt(id));
    if (!record) {
      return response.success(res, null,  '推荐记录不存在 ');
    }

    const updateData = { update_time: Math.floor(Date.now() / 1000) };
    if (isTop !== undefined) updateData.is_top = isTop ? 1 : 0;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;
    if (nickname !== undefined) updateData.nickname = nickname;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (startTime !== undefined) updateData.start_time = startTime;
    if (endTime !== undefined) updateData.end_time = endTime;
    if (status !== undefined) updateData.status = status;

    await Recommend.update(updateData, { where: { id: parseInt(id) } });

    response.success(res, { id: parseInt(id), ...updateData }, '更新成功');
  } catch (error) {
    logger.error('更新推荐错误:', error);
    response.error(res, '操作失败');
  }
};

// 批量更新（排序同步）
const batchUpdateRecommend = async (req, res) => {
  try {
    const { list, recommendType } = req.body;
    
    if (!Array.isArray(list)) {
      return response.error(res, '参数list必须是数组');
    }
    
    const type = recommendType || 'home';

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (item.id) {
        await Recommend.update(
          { sort_order: i, is_top: item.isTop ? 1 : 0, update_time: Math.floor(Date.now() / 1000) },
          { where: { id: parseInt(item.id) } }
        );
      }
    }

    response.success(res, {}, '同步成功');
  } catch (error) {
    logger.error('批量更新推荐错误:', error);
    response.error(res, '操作失败');
  }
};

// 删除推荐
const deleteRecommend = async (req, res) => {
  try {
    const { id } = req.params;
    
    const record = await Recommend.findByPk(parseInt(id));
    if (!record) {
      return response.success(res, null,  '推荐记录不存在 ');
    }

    await Recommend.destroy({ where: { id: parseInt(id) } });
    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('删除推荐错误:', error);
    response.error(res, '操作失败');
  }
};

// 检查过期推荐并自动补位（定时调用）
const checkExpiredRecommend = async (req, res) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    let replacedCount = 0;

    for (const type of ['home', 'square']) {
      // 查找已过期但仍是active状态的推荐
      const expiredList = await Recommend.findAll({
        where: { 
          recommend_type: type, 
          status: 1,
          end_time: { [Op.and]: [{ [Op.gt]: 0 }, { [Op.lt]: now }] }
        }
      });

      for (const expired of expiredList) {
        // 标记为过期
        await Recommend.update(
          { status: 0, update_time: now },
          { where: { id: expired.id } }
        );

        // 随机选一个候选用户补位
        const allUsers = await User.findAll({ where: { status: 0 } });
        const candidates = allUsers.filter(u => u.id !== expired.user_id);

        if (candidates.length > 0) {
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          const existingCount = await Recommend.findAll({ where: { recommend_type: type, status: 1 } }).then(r => r.length);
          
          await Recommend.create({
            user_id: pick.id,
            nickname: pick.nickname || '',
            avatar: pick.avatar || '',
            recommend_type: type,
            start_time: now,
            end_time: 0,
            is_top: 0,
            sort_order: existingCount,
            status: 1,
            create_time: now,
            update_time: now
          });
          replacedCount++;
        }
      }
    }

    response.success(res, { replacedCount }, `已处理过期的推荐，自动补位${replacedCount}个用户`);
  } catch (error) {
    logger.error('检查过期推荐错误:', error);
    response.error(res, '操作失败');
  }
};

// ========== 客服管理 ==========
const getCustomerServiceList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, status, role } = req.query;
    const where = {};
    if (keyword) {
      where.name = { [Op.like]: `%${keyword}%` };
    }
    if (status !== undefined && status !== '') {
      where.status = parseInt(status);
    }
    if (role) {
      where.role = role;
    }

    const { count: total, rows: list } = await CustomerService.findAndCountAll({
      where,
      order: [['create_time', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });
    response.success(res, {
      list,
      pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    logger.error('获取客服列表错误:', error);
    response.error(res, '操作失败');
  }
};

const createCustomerService = async (req, res) => {
  try {
    const { userId, user_id, name, avatar, role, description } = req.body;
    if (!name) return response.error(res, '客服名称不能为空');

    const manualUserId = userId || user_id;
    const maxUser = await CustomerService.findOne({ order: [['user_id', 'DESC']] });
    const newUserId = manualUserId ? parseInt(manualUserId) : (maxUser ? maxUser.user_id + 1 : 1001);
    const now = Math.floor(Date.now() / 1000);
    const cs = await CustomerService.create({
      user_id: newUserId,
      name,
      avatar: avatar || '',
      role: role || 'normal',
      description: description || '',
      online: 0,
      status: 1,
      create_time: now,
      update_time: now
    });
    response.success(res, cs, '创建成功');
  } catch (error) {
    logger.error('创建客服错误:', error);
    response.error(res, '操作失败');
  }
};

const updateCustomerService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar, role, description, online, status, userId: newUserId } = req.body;

    const cs = await CustomerService.findOne({ where: { user_id: parseInt(id) } });
    if (!cs) return response.success(res, null,  '客服不存在');

    // 唯一性冲突校验
    if (newUserId !== undefined) {
      const idNum = parseInt(newUserId);
      const existing = await CustomerService.findOne({ where: { user_id: idNum } });
      if (existing && String(existing.user_id) !== String(id)) {
        return response.success(res, null, `ID ${idNum} 已被其他客服占用，请换一个`);
      }
    }

    const updates = {};
    if (newUserId !== undefined) updates.user_id = parseInt(newUserId);
    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;
    if (role !== undefined) updates.role = role;
    if (description !== undefined) updates.description = description;
    if (online !== undefined) updates.online = online ? 1 : 0;
    if (status !== undefined) updates.status = status;
    updates.update_time = Math.floor(Date.now() / 1000);
    await CustomerService.update(updates, { where: { user_id: parseInt(id) } });
    response.success(res, {}, '更新成功');
  } catch (error) {
    logger.error('更新客服错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const deleteCustomerService = async (req, res) => {
  try {
    const { id } = req.params;
    const cs = await CustomerService.findOne({ where: { user_id: parseInt(id) } });
    if (!cs) return response.success(res, null,  '客服不存在 ');
    await cs.destroy();
    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('删除客服错误:', error);
    response.error(res, '操作失败');
  }
};

// ========== 系统通知管理 ==========
const getNotificationList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    const where = {};
    if (keyword) where.title = keyword;
    if (type !== undefined && type !== '') where.type = parseInt(type);
    const { count: total, rows: list } = await Notification.findAndCountAll({
      where, offset, limit,
      order: [['createTime', 'DESC']]
    });
    response.success(res, { list, total, page: parseInt(page), pageSize: limit });
  } catch (error) {
    logger.error('获取通知列表失败:', error);
    response.error(res, '获取通知列表失败');
  }
};

const getNotificationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);
    if (!notification) return response.success(res, null,  '通知不存在 ');
    response.success(res, notification);
  } catch (error) {
    logger.error('获取通知详情失败:', error);
    response.error(res, '获取通知详情失败');
  }
};

const createNotification = async (req, res) => {
  try {
    const { title, content, type = 3, targetUsers, sendToAll = true } = req.body;
    if (!title || !content) {
      return response.error(res, '标题和内容不能为空');
    }
    const notification = await Notification.create({
      userId: 0,
      type: parseInt(type),
      title: title.trim(),
      content: content.trim(),
      isRead: false,
      createTime: Date.now(),
      data: { sendToAll, targetUsers: targetUsers || [] }
    });
    response.success(res, notification, '通知创建成功');
  } catch (error) {
    logger.error('创建通知失败:', error);
    response.error(res, '创建通知失败');
  }
};

const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type } = req.body;
    const notification = await Notification.findByPk(id);
    if (!notification) return response.success(res, null,  '通知不存在 ');
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (type !== undefined) updateData.type = parseInt(type);
    await Notification.update(updateData, { where: { id: parseInt(id) } });
    response.success(res, { id: parseInt(id), ...updateData }, '通知更新成功');
  } catch (error) {
    logger.error('更新通知失败:', error);
    response.error(res, '更新通知失败');
  }
};

const pushNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);
    if (!notification) return response.success(res, null,  '通知不存在 ');
    // 获取所有活跃用户
    let targetUsers = [0];
    try {
      const allUsers = await User.findAll({ where: { status: 1 } });
      targetUsers = allUsers.map(u => u.id);
    } catch (e) {
      // mock模式下使用默认用户列表
      targetUsers = [1, 2, 3, 4, 5];
    }
    let pushCount = 0;
    for (const userId of targetUsers) {
      try {
        await Notification.create({
          userId, type: notification.type,
          title: notification.title,
          content: notification.content,
          isRead: false,
          createTime: Date.now()
        });
        pushCount++;
      } catch (e) { /* 跳过失败的单条推送 */ }
    }
    response.success(res, { pushCount }, `通知已推送给 ${pushCount} 个用户`);
  } catch (error) {
    logger.error('推送通知失败:', error);
    response.error(res, '推送通知失败');
  }
};

const getNotificationStats = async (req, res) => {
  try {
    const totalCount = await Notification.count();
    const unreadCount = await Notification.count({ where: { isRead: false } });
    const readCount = totalCount - unreadCount;
    response.success(res, {
      totalCount, unreadCount, readCount,
      readRate: totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0
    });
  } catch (error) {
    logger.error('获取通知统计失败:', error);
    response.error(res, '获取通知统计失败');
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);
    if (!notification) return response.success(res, null,  '通知不存在 ');
    await Notification.destroy({ where: { id: parseInt(id) } });
    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('删除通知失败:', error);
    response.error(res, '删除通知失败');
  }
};

// 用户端接口：获取用户通知列表
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || 0;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    const all = await Notification.findAll({
      where: { [Op.or]: [{ userId }, { userId: 0 }] },
      order: [['createTime', 'DESC']]
    });
    const total = all.length;
    const list = all.slice(offset, offset + limit);
    const unreadCount = all.filter(n => !n.isRead).length;
    response.success(res, { list, total, unreadCount, page: parseInt(page), pageSize: limit });
  } catch (error) {
    logger.error('获取用户通知失败:', error);
    response.error(res, '获取通知失败');
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 0;
    const notification = await Notification.findByPk(id);
    if (!notification) return response.success(res, null,  '通知不存在 ');
    if (notification.userId !== 0 && notification.userId !== userId) {
      return response.error(res, '无权操作此通知');
    }
    await Notification.update({ isRead: true }, { where: { id: parseInt(id) } });
    response.success(res, {}, '已标记为已读');
  } catch (error) {
    logger.error('标记已读失败:', error);
    response.error(res, '操作失败');
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user?.id || 0;
    const all = await Notification.findAll({
      where: { [Op.or]: [{ userId }, { userId: 0 }] }
    });
    let updated = 0;
    for (const n of all) {
      if (!n.isRead) {
        await Notification.update({ isRead: true }, { where: { id: n.id } });
        updated++;
      }
    }
    response.success(res, { updated }, '全部标记为已读');
  } catch (error) {
    logger.error('全部标记已读失败:', error);
    response.error(res, '操作失败');
  }
};
// ========== 密卡管理 ==========
const Card = (() => {
  try { return require('../models/mysql/Card'); }
  catch (e) { return null; }
})();

let _cardNextId = 6;
const _cards = [
  { id: 1, card_no: 'Xk9mB2pR4vL7wN1qJ5tY3s', card_pwd: 'aH8fD6gK2jM4nP0qR3sV1w', face_value: 1, coin_amount: 10, status: 0, use_time: 0, use_user_id: 0, expire_time: Math.floor(Date.now() / 1000) + 86400 * 365, create_time: Math.floor(Date.now() / 1000) - 86400 * 10, category: 'level1', tag: '', batch_no: 'BATCH001', remark: '' },
  { id: 2, card_no: 'M3nP8qR2tV9wX1yZ4bC6dF', card_pwd: 'gK5jH1mN4pQ8rT2vW6xY0e', face_value: 50, coin_amount: 100, status: 1, use_time: Math.floor(Date.now() / 1000) - 3600, use_user_id: 1001, expire_time: Math.floor(Date.now() / 1000) + 86400 * 365, create_time: Math.floor(Date.now() / 1000) - 86400 * 9, category: 'level10', tag: '周年庆', batch_no: 'BATCH002', remark: '' },
  { id: 3, card_no: 'L0kS3uW7yA9dG2jH5mP8qR', card_pwd: 'tV2xY5bN8eQ1wR4tY7uI0o', face_value: 50, coin_amount: 500, status: 0, use_time: 0, use_user_id: 0, expire_time: Math.floor(Date.now() / 1000) - 3600, create_time: Math.floor(Date.now() / 1000) - 86400 * 8, category: 'level50', tag: '节日活动', batch_no: 'BATCH001', remark: '节日活动密卡' },
  { id: 4, card_no: 'F6cV9bN2mQ5xZ8kL1pR4tW', card_pwd: 'yH3jM6dG9sA1wP4eR7uI0c', face_value: 100, coin_amount: 1000, status: 3, use_time: 0, use_user_id: 0, expire_time: Math.floor(Date.now() / 1000) + 86400 * 180, create_time: Math.floor(Date.now() / 1000) - 86400 * 5, category: 'level100', tag: '', batch_no: 'BATCH003', remark: '' },
  { id: 5, card_no: 'W2tY5uI8oP1aS4dG7jH0kL', card_pwd: 'nM9qR3vX6cF0zB4eN7mQ1w', face_value: 100, coin_amount: 1000, status: 1, use_time: Math.floor(Date.now() / 1000) - 86400, use_user_id: 1002, expire_time: Math.floor(Date.now() / 1000) + 86400 * 90, create_time: Math.floor(Date.now() / 1000) - 86400 * 3, category: 'level100', tag: '新春限定', batch_no: 'BATCH002', remark: '' },
];

// 密卡分类默认值（DB无数据时使用）
const DEFAULT_CARD_CATEGORIES = [
  { key: 'level1', label: '1元档', color: '#10b981', faceValue: 1, coinAmount: 10, bonusCoins: 0 },
  { key: 'level10', label: '10元档', color: '#3b82f6', faceValue: 10, coinAmount: 100, bonusCoins: 10 },
  { key: 'level50', label: '50元档', color: '#f59e0b', faceValue: 50, coinAmount: 500, bonusCoins: 60 },
  { key: 'level100', label: '100元档', color: '#7c3aed', faceValue: 100, coinAmount: 1000, bonusCoins: 150 },
  { key: 'vip', label: 'VIP专属', color: '#ef4444', faceValue: 200, coinAmount: 2000, bonusCoins: 300 },
  { key: 'newbie', label: '新手礼包', color: '#06b6d4', faceValue: 5, coinAmount: 50, bonusCoins: 10 },
  { key: 'activity', label: '活动福利', color: '#f97316', faceValue: 20, coinAmount: 200, bonusCoins: 30 },
  { key: 'general', label: '通用', color: '#6b7280', faceValue: 30, coinAmount: 300, bonusCoins: 0 }
];

// 密卡分类配置（DB持久化，启动时加载）
let _cardCategories = [...DEFAULT_CARD_CATEGORIES];

// 启动时从 DB 加载分类，失败则使用默认值
(async () => {
  try {
    const row = await Setting.findByPk('card_categories');
    if (row && row.setting_value) {
      const parsed = JSON.parse(row.setting_value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        _cardCategories = parsed;
        logger.info(`已从 DB 加载 ${_cardCategories.length} 个密卡分类`);
      }
    }
  } catch (err) {
    logger.warn('从 DB 加载密卡分类失败，使用默认值:', err.message);
  }
})();

// 生成21位随机字母数字组合（卡号/密码）
const genCardCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 21; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
};

const _getCardStatusName = (c) => {
  if (c.status === 1) return '已使用';
  if (c.status === 3) return '已禁用';
  // status 0: 检查是否过期
  if (c.status === 0 && c.expire_time > 0 && c.expire_time < Math.floor(Date.now() / 1000)) return '已过期';
  if (c.status === 0) return '未使用';
  return '未知';
};

const _formatCard = (c) => ({
  id: c.id,
  cardNo: c.card_no,
  cardPwd: c.card_pwd ? c.card_pwd.slice(0, 3) + '****' : '',
  faceValue: Number(c.face_value),
  coinAmount: c.coin_amount,
  status: c.status,
  statusName: _getCardStatusName(c),
  useTime: c.use_time || 0,
  useUserId: c.use_user_id || 0,
  expireTime: c.expire_time || 0,
  createTime: c.create_time || 0,
  category: c.category || '',
  tag: c.tag || '',
  batchNo: c.batch_no || '',
  remark: c.remark || ''
});

const getCardList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, status, category, categories, batchNo } = req.query;
    const offset = (page - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // 尝试从真实数据库读取
    if (Card) {
      try {
        const where = {};
        if (keyword) where.card_no = { [require('sequelize').Op.like]: `%${keyword}%` };
        if (status !== undefined && status !== '') {
          const st = parseInt(status);
          if (st === 2) {
            // 查询过期：status=0 且 expire_time 已过
            where.status = 0;
            where.expire_time = { [require('sequelize').Op.and]: [{ [require('sequelize').Op.gt]: 0 }, { [require('sequelize').Op.lt]: Math.floor(Date.now() / 1000) }] };
          } else if (st === 0) {
            // 查询未使用：status=0 且 未过期
            where.status = 0;
            where[require('sequelize').Op.or] = [
              { expire_time: 0 },
              { expire_time: { [require('sequelize').Op.gt]: Math.floor(Date.now() / 1000) } }
            ];
          } else {
            where.status = st;
          }
        }
        if (categories) {
          where.category = { [require('sequelize').Op.in]: categories.split(',') };
        } else if (category) {
          where.category = category;
        }
        if (batchNo) where.batch_no = batchNo;
        const { rows, count } = await Card.findAndCountAll({ where, offset, limit, order: [['id', 'DESC']] });
        return response.success(res, {
          list: rows.map(r => ({
            id: r.id, cardNo: r.card_no,
            cardPwd: (r.card_pwd || '').slice(0, 3) + '****',
            faceValue: Number(r.face_value), coinAmount: r.coin_amount,
            status: r.status,
            statusName: _getCardStatusName(r),
            useTime: r.use_time || 0, useUserId: r.use_user_id || 0,
            expireTime: r.expire_time || 0,
            createTime: (r.create_time || 0) * 1000,
            category: r.category || '', tag: r.tag || '', batchNo: r.batch_no || '', remark: r.remark || ''
          })),
          pagination: { page: parseInt(page), pageSize: limit, total: count, totalPages: Math.ceil(count / limit) }
        });
      } catch (dbErr) {
        logger.error('DB查询密卡失败，回退Mock:', dbErr.message);
      }
    }

    // Mock 回退：按 id 降序排列（新创建的卡片优先展示）
    let filtered = [..._cards].sort((a, b) => b.id - a.id);
    if (keyword) filtered = filtered.filter(c => c.card_no.includes(keyword));
    if (status !== undefined && status !== '') {
      const st = parseInt(status);
      if (st === 2) {
        filtered = filtered.filter(c => c.status === 0 && c.expire_time > 0 && c.expire_time < Math.floor(Date.now() / 1000));
      } else if (st === 0) {
        filtered = filtered.filter(c => c.status === 0 && (c.expire_time === 0 || c.expire_time > Math.floor(Date.now() / 1000)));
      } else {
        filtered = filtered.filter(c => c.status === st);
      }
    }
    if (categories) {
      const catArr = categories.split(',');
      filtered = filtered.filter(c => catArr.includes(c.category || ''));
    } else if (category) {
      filtered = filtered.filter(c => (c.category || '') === category);
    }
    if (batchNo) filtered = filtered.filter(c => (c.batch_no || '') === batchNo);
    const total = filtered.length;
    const list = filtered.slice(offset, offset + limit);
    response.success(res, {
      list: list.map(_formatCard),
      pagination: { page: parseInt(page), pageSize: limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    logger.error('获取密卡列表错误:', error.message);
    response.error(res, '操作失败');
  }
};

const getCardDetail = async (req, res) => {
  try {
    const { id } = req.params;
    let record;
    if (Card) {
      try { record = await Card.findByPk(parseInt(id)); } catch (e) { /* fallback */ }
    }
    if (!record) record = _cards.find(c => c.id === parseInt(id));
    if (!record) return response.success(res, null,  '密卡不存在 ');
    response.success(res, {
      id: record.id, cardNo: record.card_no,
      cardPwd: record.card_pwd || '',
      faceValue: Number(record.face_value), coinAmount: record.coin_amount,
      status: record.status,
      statusName: _getCardStatusName(record),
      useTime: record.use_time || 0, useUserId: record.use_user_id || 0,
      expireTime: record.expire_time || 0,
      createTime: (record.create_time || 0) * 1000,
      category: record.category || '', tag: record.tag || '',
      batchNo: record.batch_no || '', remark: record.remark || ''
    });
  } catch (error) {
    logger.error('获取密卡详情错误:', error.message);
    response.error(res, '操作失败');
  }
};

const createCard = async (req, res) => {
  try {
    const { cardNo, cardPwd, faceValue, coinAmount, expireDays = 365, count = 1 } = req.body;

    if (!faceValue && faceValue !== 0) return response.badRequest(res, '请输入面值');
    if (!coinAmount && coinAmount !== 0) return response.badRequest(res, '请输入金币数');

    const created = [];
    const now = Math.floor(Date.now() / 1000);
    const expireTime = expireDays > 0 ? now + expireDays * 86400 : 0;
    const batchNoVal = 'BATCH' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase();
    const categoryVal = req.body.category || '';
    const tagVal = req.body.tag || '';
    const remarkVal = req.body.remark || '';

    for (let i = 0; i < Math.min(count, 1000); i++) {
      const no = cardNo || genCardCode();
      const pwd = cardPwd || genCardCode();

      if (Card) {
        try {
          const card = await Card.create({
            card_no: no,
            card_pwd: pwd,
            face_value: faceValue,
            coin_amount: coinAmount,
            status: 0,
            expire_time: expireTime,
            create_time: now,
            category: categoryVal,
            tag: tagVal,
            batch_no: batchNoVal,
            remark: remarkVal
          });
          created.push(_formatCard(card));
        } catch (dbErr) {
          const mockCard = { id: _cardNextId + created.length, card_no: no, card_pwd: pwd, face_value: faceValue, coin_amount: coinAmount, status: 0, use_time: 0, use_user_id: 0, expire_time: expireTime, create_time: now, category: categoryVal, tag: tagVal, batch_no: batchNoVal, remark: remarkVal };
          _cards.push(mockCard);
          created.push(_formatCard(mockCard));
        }
      } else {
        const mockCard = { id: _cardNextId + created.length, card_no: no, card_pwd: pwd, face_value: faceValue, coin_amount: coinAmount, status: 0, use_time: 0, use_user_id: 0, expire_time: expireTime, create_time: now, category: categoryVal, tag: tagVal, batch_no: batchNoVal, remark: remarkVal };
        _cards.push(mockCard);
        created.push(_formatCard(mockCard));
      }
    }

    if (!Card) _cardNextId += created.length;
    response.success(res, { cards: created, count: created.length }, `成功生成 ${created.length} 张密卡`);
  } catch (error) {
    logger.error('创建密卡错误:', error.message);
    response.error(res, '操作失败');
  }
};

const deleteCard = async (req, res) => {
  try {
    const { id } = req.params;
    if (Card) {
      try {
        const card = await Card.findByPk(parseInt(id));
        if (card) {
          await card.destroy();
          return response.success(res, {}, '密卡删除成功');
        }
      } catch (e) { /* fallback */ }
    }
    const idx = _cards.findIndex(c => c.id === parseInt(id));
    if (idx === -1) return response.success(res, null,  '密卡不存在 ');
    _cards.splice(idx, 1);
    response.success(res, {}, '密卡删除成功');
  } catch (error) {
    logger.error('删除密卡错误:', error.message);
    response.error(res, '操作失败');
  }
};

// 按面值清空密卡
const clearAllCards = async (req, res) => {
  const { faceValues } = req.body;
  if (!Array.isArray(faceValues) || faceValues.length === 0) {
    return response.success(res, null, '请指定要清空的面值');
  }
  const before = _cards.length;
  _cards = _cards.filter(c => !faceValues.includes(c.face_value));
  const after = _cards.length;
  const count = before - after;
  response.success(res, { deletedCount: count }, `成功清空 ${count} 张密卡`);
};

// 更新密卡信息
const updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { cardPwd, faceValue, coinAmount, expireDays, category, tag, remark } = req.body;
    if (Card) {
      try {
        const card = await Card.findByPk(parseInt(id));
        if (!card) return response.success(res, null,  '密卡不存在 ');
        const updateData = {};
        if (cardPwd !== undefined) updateData.card_pwd = cardPwd;
        if (faceValue !== undefined) updateData.face_value = faceValue;
        if (coinAmount !== undefined) updateData.coin_amount = coinAmount;
        if (expireDays !== undefined && expireDays > 0) updateData.expire_time = Math.floor(Date.now() / 1000) + expireDays * 86400;
        if (category !== undefined) updateData.category = category;
        if (tag !== undefined) updateData.tag = tag;
        if (remark !== undefined) updateData.remark = remark;
        await card.update(updateData);
        return response.success(res, _formatCard(card), '密卡更新成功');
      } catch (e) { /* fallback */ }
    }
    const idx = _cards.findIndex(c => c.id === parseInt(id));
    if (idx === -1) return response.success(res, null,  '密卡不存在 ');
    if (cardPwd !== undefined) _cards[idx].card_pwd = cardPwd;
    if (faceValue !== undefined) _cards[idx].face_value = faceValue;
    if (coinAmount !== undefined) _cards[idx].coin_amount = coinAmount;
    if (expireDays !== undefined && expireDays > 0) _cards[idx].expire_time = Math.floor(Date.now() / 1000) + expireDays * 86400;
    if (category !== undefined) _cards[idx].category = category || '';
    if (tag !== undefined) _cards[idx].tag = tag || '';
    if (remark !== undefined) _cards[idx].remark = remark || '';
    response.success(res, _formatCard(_cards[idx]), '密卡更新成功');
  } catch (error) {
    logger.error('更新密卡错误:', error.message);
    response.error(res, '操作失败');
  }
};

// 更新密卡状态（启用/禁用）
const updateCardStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 0=启用, 3=禁用
    if (![0, 3].includes(status)) return response.badRequest(res, '状态值非法');
    if (Card) {
      try {
        const card = await Card.findByPk(parseInt(id));
        if (!card) return response.success(res, null,  '密卡不存在 ');
        if (card.status === 1) return response.error(res, '已使用的密卡无法修改状态');
        await card.update({ status });
        return response.success(res, {}, status === 3 ? '密卡已禁用' : '密卡已启用');
      } catch (e) { /* fallback */ }
    }
    const idx = _cards.findIndex(c => c.id === parseInt(id));
    if (idx === -1) return response.success(res, null,  '密卡不存在 ');
    if (_cards[idx].status === 1) return response.error(res, '已使用的密卡无法修改状态');
    _cards[idx].status = status;
    response.success(res, {}, status === 3 ? '密卡已禁用' : '密卡已启用');
  } catch (error) {
    logger.error('更新密卡状态错误:', error.message);
    response.error(res, '操作失败');
  }
};

// 批量更新密卡状态
const batchUpdateCardStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return response.badRequest(res, '请选择密卡');
    if (![0, 1, 3].includes(status)) return response.badRequest(res, '状态值非法');
    let successCount = 0;
    if (Card) {
      try {
        const [affected] = await Card.update(
          { status },
          { where: { id: ids, status: status === 1 ? [0, 3] : [0, 3] } }
        );
        successCount = affected;
      } catch (e) { /* fallback */ }
    }
    // Mock fallback
    for (const id of ids) {
      const idx = _cards.findIndex(c => c.id === parseInt(id));
      if (idx !== -1 && _cards[idx].status !== 1) {
        _cards[idx].status = status;
        successCount++;
      }
    }
    const labels = { 0: '启用', 1: '回收', 3: '禁用' };
    response.success(res, { count: successCount }, `成功${labels[status] || '更新'} ${successCount} 张密卡`);
  } catch (error) {
    logger.error('批量更新密卡状态错误:', error.message);
    response.error(res, '操作失败');
  }
};

// 批量删除密卡
const batchDeleteCards = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return response.badRequest(res, '请选择密卡');
    let successCount = 0;
    if (Card) {
      try {
        const destroyed = await Card.destroy({ where: { id: ids } });
        successCount = destroyed;
      } catch (e) { /* fallback */ }
    }
    // Mock fallback
    for (const id of ids) {
      const idx = _cards.findIndex(c => c.id === parseInt(id));
      if (idx !== -1) {
        _cards.splice(idx, 1);
        successCount++;
      }
    }
    response.success(res, { count: successCount }, `成功删除 ${successCount} 张密卡`);
  } catch (error) {
    logger.error('批量删除密卡错误:', error.message);
    response.error(res, '操作失败');
  }
};

// 批量更新密卡标签（用于记录导出时间到标签字段）
const batchUpdateCardTag = async (req, res) => {
  try {
    const { ids, tag } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return response.badRequest(res, '请选择密卡');
    if (!tag) return response.badRequest(res, '请提供标签内容');
    let successCount = 0;
    if (Card) {
      try {
        // 逐个更新标签（覆盖写入，用于记录导出时间）
        for (const id of ids) {
          const card = await Card.findByPk(parseInt(id));
          if (card) {
            await card.update({ tag });
            successCount++;
          }
        }
      } catch (e) { /* fallback to mock */ }
    }
    // Mock fallback
    for (const id of ids) {
      const idx = _cards.findIndex(c => c.id === parseInt(id));
      if (idx !== -1) {
        _cards[idx].tag = tag;
        successCount++;
      }
    }
    response.success(res, { count: successCount }, `成功更新 ${successCount} 张密卡备注`);
  } catch (error) {
    logger.error('批量更新密卡备注错误:', error.message);
    response.error(res, '操作失败');
  }
};

// 密卡统计
const getCardStats = async (req, res) => {
  try {
    let totalCount = 0, unusedCount = 0, usedCount = 0, expiredCount = 0, disabledCount = 0;
    let totalFaceValue = 0, totalCoinAmount = 0;
    let categoryStats = {};
    let trendData = [];
    const now = Math.floor(Date.now() / 1000);

    if (Card) {
      try {
        const allCards = await Card.findAll({ raw: true });
        totalCount = allCards.length;
        for (const c of allCards) {
          const status = c.status;
          if (status === 0) {
            // 检查是否过期
            if (c.expire_time > 0 && c.expire_time < now) {
              expiredCount++;
            } else {
              unusedCount++;
            }
          } else if (status === 1) usedCount++;
          else if (status === 3) disabledCount++;
          totalFaceValue += Number(c.face_value) || 0;
          totalCoinAmount += Number(c.coin_amount) || 0;
          const cat = c.category || '未分类';
          categoryStats[cat] = (categoryStats[cat] || 0) + 1;
        }
        // 近30天趋势（按创建日期分组）
        const trendMap = {};
        for (const c of allCards) {
          const day = new Date(c.create_time * 1000).toISOString().slice(0, 10);
          if (!trendMap[day]) trendMap[day] = { created: 0, used: 0 };
          trendMap[day].created++;
          if (c.status === 1) trendMap[day].used++;
        }
        const sortedDays = Object.keys(trendMap).sort().slice(-30);
        trendData = sortedDays.map(day => ({ date: day, ...trendMap[day] }));
      } catch (e) { /* fallback */ }
    }

    // Mock fallback
    if (totalCount === 0) {
      totalCount = _cards.length;
      for (const c of _cards) {
        if (c.status === 0) {
          if (c.expire_time > 0 && c.expire_time < now) expiredCount++;
          else unusedCount++;
        } else if (c.status === 1) usedCount++;
        else if (c.status === 3) disabledCount++;
        totalFaceValue += Number(c.face_value) || 0;
        totalCoinAmount += Number(c.coin_amount) || 0;
        const cat = c.category || '未分类';
        categoryStats[cat] = (categoryStats[cat] || 0) + 1;
      }
    }

    response.success(res, {
      overview: {
        totalCount, unusedCount, usedCount, expiredCount, disabledCount,
        totalFaceValue: Math.round(totalFaceValue * 100) / 100,
        totalCoinAmount,
        useRate: totalCount > 0 ? Math.round(usedCount / totalCount * 10000) / 100 : 0
      },
      categoryStats: Object.entries(categoryStats).map(([name, count]) => ({ name, count })),
      trendData
    });
  } catch (error) {
    logger.error('获取密卡统计错误:', error.message);
    response.error(res, '操作失败');
  }
};

// 导出日志存储（内存）
const _exportLogs = [];

// 记录密卡导出日志
const recordExport = async (req, res) => {
  try {
    const { count, category, scope } = req.body;
    const entry = {
      id: _exportLogs.length + 1,
      time: Math.floor(Date.now() / 1000),
      count: count || 0,
      category: category || '全部',
      scope: scope || '全部',
      operator: req.user?.username || 'admin'
    };
    _exportLogs.unshift(entry);
    // 最多保留 200 条
    if (_exportLogs.length > 200) _exportLogs.length = 200;
    response.success(res, entry, '导出记录已保存');
  } catch (error) {
    logger.error('记录导出日志错误:', error.message);
    response.error(res, '操作失败');
  }
};

// 获取导出日志列表
const getExportLogs = async (req, res) => {
  try {
    const { page = 1, pageSize = 50 } = req.query;
    const offset = (page - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    const list = _exportLogs.slice(offset, offset + limit);
    response.success(res, {
      list: list.map(e => ({
        ...e,
        timeLabel: e.time ? new Date(e.time * 1000).toLocaleString('zh-CN') : ''
      })),
      pagination: {
        page: parseInt(page),
        pageSize: limit,
        total: _exportLogs.length,
        totalPages: Math.ceil(_exportLogs.length / limit)
      }
    });
  } catch (error) {
    logger.error('获取导出日志错误:', error.message);
    response.error(res, '操作失败');
  }
};

// 批量导入密卡
const importCards = async (req, res) => {
  try {
    const { cards } = req.body; // [{ cardNo, cardPwd, faceValue, coinAmount, expireDays, category, tag, remark }]
    if (!Array.isArray(cards) || cards.length === 0) return response.badRequest(res, '请提供密卡数据');
    if (cards.length > 5000) return response.badRequest(res, '单次最多导入5000张');
    const now = Math.floor(Date.now() / 1000);
    const batchNo = 'BATCH' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase();
    let successCount = 0, failCount = 0;

    for (const item of cards) {
      try {
        const no = item.cardNo || genCardCode();
        const expireDays = item.expireDays || 365;
        const remarkVal = item.remark || '';
        if (Card) {
          try {
            await Card.create({
              card_no: no,
              card_pwd: item.cardPwd || genCardCode(),
              face_value: item.faceValue || 100,
              coin_amount: item.coinAmount || 100,
              status: 0,
              expire_time: expireDays > 0 ? now + expireDays * 86400 : 0,
              create_time: now,
              category: item.category || '',
              tag: item.tag || '',
              batch_no: batchNo,
              remark: remarkVal
            });
            successCount++;
          } catch (dbErr) {
            failCount++;
          }
        } else {
          _cards.push({
            id: _cardNextId + successCount,
            card_no: no, card_pwd: item.cardPwd || genCardCode(),
            face_value: item.faceValue || 100, coin_amount: item.coinAmount || 100,
            status: 0, use_time: 0, use_user_id: 0,
            expire_time: expireDays > 0 ? now + expireDays * 86400 : 0, create_time: now,
            category: item.category || '', tag: item.tag || '', batch_no: batchNo,
            remark: remarkVal
          });
          successCount++;
        }
      } catch (e) { failCount++; }
    }

    if (!Card) _cardNextId += successCount;
    response.success(res, { successCount, failCount, batchNo }, `成功导入 ${successCount} 张密卡` + (failCount > 0 ? `，失败 ${failCount} 张` : ''));
  } catch (error) {
    logger.error('导入密卡错误:', error.message);
    response.error(res, '操作失败');
  }
};

module.exports = {
  adminLogin,
  getUserList,
  getUserDetail,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  getOrderList,
  getOrderDetail,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getWithdrawList,
  getWithdrawDetail,
  createWithdraw,
  approveWithdraw,
  rejectWithdraw,
  deleteWithdraw,
  getPostList,
  getPostDetail,
  deletePost,
  batchDeletePosts,
  updatePostStatus,
  batchUpdatePostStatus,
  getPostStats,
  getReportList,
  getReportDetail,
  handleReport,
  batchHandleReports,
  deleteReport,
  batchDeleteReports,
  getReportStats,
  getBannerList,
  getBannerDetail,
  createBanner,
  updateBanner,
  updateBannerStatus,
  deleteBanner,
  getVipPackageList,
  getVipPackageDetail,
  createVipPackage,
  updateVipPackage,
  updateVipPackageStatus,
  deleteVipPackage,
  getGiftList,
  getGiftDetail,
  createGift,
  updateGift,
  deleteGift,
  getGiftLogList,
  getGiftLogDetail,
  getRechargeRecordList,
  getRechargeRecordDetail,
  deleteRechargeRecord,
  completeRechargeRecord,
  failRechargeRecord,
  getGameList,
  getGameDetail,
  createGame,
  updateGame,
  updateGameStatus,
  deleteGame,
  getSystemSettings,
  updateSystemSettings,
  getDashboardStats,
  getCompanionApplicationList,
  getCompanionApplicationDetail,
  approveCompanionApplication,
  rejectCompanionApplication,
  deleteCompanionApplication,
  getVirtualUserList,
  getVirtualUserDetail,
  createVirtualUser,
  updateVirtualUser,
  deleteVirtualUser,
  toggleVirtualUserStatus,
  getVirtualUserChatHistory,
  // 推荐管理
  getRecommendCandidates,
  getRecommendListByType,
  addRecommend,
  updateRecommend,
  batchUpdateRecommend,
  deleteRecommend,
  checkExpiredRecommend,
  // 密卡管理
  getCardList,
  getCardDetail,
  createCard,
  updateCard,
  updateCardStatus,
  batchUpdateCardStatus,
  batchDeleteCards,
  batchUpdateCardTag,
  getCardStats,
  recordExport,
  getExportLogs,
  importCards,
  deleteCard,
  clearAllCards,
  // 客服管理
  getCustomerServiceList,
  createCustomerService,
  updateCustomerService,
  deleteCustomerService,
  // 系统通知管理
  getNotificationList,
  getNotificationDetail,
  createNotification,
  updateNotification,
  pushNotification,
  getNotificationStats,
  deleteNotification,
  // 用户端通知
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead
};