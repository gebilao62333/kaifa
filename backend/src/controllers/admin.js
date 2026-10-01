const bcrypt = require('bcryptjs');
const { User, GameOrder, Withdraw, GiftLog, Post, VipPackage, RechargePackage, Banner, SplashScreen, CompanionProfile, Game, OrderChong, Report, Admin, AdminRole } = require('../models');
const { signToken } = require('../config/jwt');
const response = require('../utils/response');
const { resolvePermissions } = require('../utils/permissions');
const { Op, fn, col, literal } = require('sequelize');
const logger = require('../utils/logger');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// 数据库错误统一响应：不再静默降级，显式报错
function dbErrorResponse(res, operation, dbError) {
  logger.error(`[DB_CRITICAL] ${operation} 失败:`, dbError.message);
  return response.dbError(res, operation, dbError.message);
}

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return response.error(res, '用户名和密码不能为空');
    }

    // 优先走数据库账号校验（支持角色权限体系）
    try {
      const admin = await Admin.findOne({ where: { username } });
      if (admin && admin.status === 1) {
        const valid = await bcrypt.compare(password, admin.password);
        if (valid) {
          // 合并角色权限：角色权限 ∪ 账号自身权限
          let role = null;
          if (admin.role_id) {
            role = await AdminRole.findByPk(admin.role_id);
          }
          const permissions = resolvePermissions(admin.permissions, role);
          const token = signToken({
            id: admin.id,
            username: admin.username,
            role: 'admin',
            role_id: admin.role_id,
            roleId: admin.role_id,
            permissions
          }, '7d');

          return response.success(res, {
            token,
            user: {
              id: admin.id,
              username: admin.username,
              nickname: admin.nickname || admin.username,
              role: 'admin',
              role_id: admin.role_id,
              permissions,
              avatar: admin.avatar || ''
            }
          }, '登录成功');
        }
      }

      // 角色账号校验：角色也可配置独立登录账号密码（登录后权限即该角色权限）
      if (!admin) {
        const role = await AdminRole.findOne({ where: { username } });
        if (role && role.status === 1 && role.password) {
          const valid = await bcrypt.compare(password, role.password);
          if (valid) {
            const permissions = resolvePermissions(role.permissions, role);
            const token = signToken({
              id: role.id,
              username: role.username,
              role: 'admin',
              role_id: role.id,
              roleId: role.id,
              permissions
            }, '7d');

            return response.success(res, {
              token,
              user: {
                id: role.id,
                username: role.username,
                nickname: role.name || role.username,
                role: 'admin',
                role_id: role.id,
                permissions,
                avatar: ''
              }
            }, '登录成功');
          }
        }
      }
    } catch (dbError) {
      logger.warn('[adminLogin] 数据库账号校验不可用，回退环境变量:', dbError.message);
    }

    // 环境变量回退（兼容历史账号 / 数据库不可用紧急通道）
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = signToken({
        id: 0,
        username: ADMIN_USERNAME,
        role: 'admin',
        role_id: 0,
        roleId: 0,
        permissions: ['all']
      }, '7d');

      return response.success(res, {
        token,
        user: {
          id: 0,
          username: ADMIN_USERNAME,
          role: 'admin',
          role_id: 0,
          permissions: ['all'],
          avatar: ''
        }
      }, '登录成功');
    }

    return response.unauthorized(res, '用户名或密码错误');
  } catch (error) {
    logger.error('管理员登录错误:', error);
    response.error(res, error.message);
  }
};

const getUserList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, nickname, phone, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    const where = {};
    if (nickname) where.nickname = { [Op.like]: `%${nickname}%` };
    if (phone) where.mobile = { [Op.like]: `%${phone}%` };
    if (status !== undefined) where.status = parseInt(status);
    
    const result = await User.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['create_time', 'DESC']]
    });
    
    const users = result.rows || [];
    const total = result.count || 0;
    
    const mapped = users.map(user => ({
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
      list: mapped,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('获取用户列表错误:', error);
    return dbErrorResponse(res, '获取用户列表', error);
  }
};

const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return response.notFound(res, '用户不存在');
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
      logger.warn('查询陪玩师信息失败:', e.message)
    }
    
    response.success(res, {
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
    response.error(res, error.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, phone, sex, city, status, vipLv, money, giftMoney, dec, username, email } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return response.notFound(res, '用户不存在');
    }
    
    const updateData = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (username !== undefined) updateData.username = username;
    if (phone !== undefined) updateData.mobile = phone;
    if (email !== undefined) updateData.email = email;
    if (sex !== undefined) updateData.sex = parseInt(sex);
    if (city !== undefined) updateData.city = city;
    if (status !== undefined) updateData.status = parseInt(status);
    if (vipLv !== undefined) updateData.vip_lv = parseInt(vipLv);
    if (money !== undefined) updateData.money = parseFloat(money);
    if (giftMoney !== undefined) updateData.gift_money = parseFloat(giftMoney);
    if (dec !== undefined) updateData.dec = dec;
    
    await user.update(updateData);
    response.success(res, {}, '更新成功');
  } catch (error) {
    logger.error('更新用户信息错误:', error);
    response.error(res, `更新用户失败: ${error.message}`);
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return response.notFound(res, '用户不存在');
    }
    
    const newStatus = parseInt(status);
    await user.update({ status: newStatus });
    response.success(res, { status: newStatus }, '状态更新成功');
  } catch (error) {
    logger.error('更新用户状态错误:', error);
    response.error(res, `更新用户状态失败: ${error.message}`);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return response.notFound(res, '用户不存在');
    }
    
    await user.destroy();
    response.success(res, null, '删除成功');
  } catch (error) {
    logger.error('删除用户错误:', error);
    response.error(res, `删除用户失败: ${error.message}`);
  }
};

const createUser = async (req, res) => {
  try {
    const { nickname, phone, sex, city, vipLv, money, giftMoney, dec, username, email } = req.body;
    
    const newUser = await User.create({
      nickname: nickname || '新用户',
      username: username || '',
      mobile: phone || '',
      email: email || '',
      sex: parseInt(sex) || 0,
      city: city || '',
      vip_lv: parseInt(vipLv) || 0,
      money: parseFloat(money) || 0,
      gift_money: parseFloat(giftMoney) || 0,
      dec: dec || ''
    });
    
    response.success(res, {
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
    response.error(res, `创建用户失败: ${error.message}`);
  }
};

const getOrderList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, orderNo, userId, status } = req.query;
    const offset = (page - 1) * pageSize;
    
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
    
    let orders = result.rows || [];
    const total = result.count || 0;
    
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
    
    const mapped = orders.map(order => ({
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
      list: mapped,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('获取订单列表错误:', error);
    return dbErrorResponse(res, '获取订单列表', error);
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
      return response.notFound(res, '订单不存在');
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
    response.error(res, error.message);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await GameOrder.findByPk(id);
    if (!order) {
      return response.notFound(res, '订单不存在');
    }
    
    const updateData = { status };
    if (status === 'ongoing') {
      updateData.start_time = Date.now();
    } else if (status === 'completed') {
      updateData.end_time = Date.now();
    } else if (status === 'cancelled') {
      updateData.cancel_time = Date.now();
    }
    
    await order.update(updateData);
    response.success(res, { status: order.status }, '状态更新成功');
  } catch (error) {
    logger.error('更新订单状态错误:', error);
    response.error(res, `更新订单状态失败: ${error.message}`);
  }
};

const createOrder = async (req, res) => {
  try {
    const { userId, gameId, gameName, companionId, companionName, duration, price, remark } = req.body;
    
    const orderNo = 'ADM' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
    const amountVal = parseFloat(price);
    const newOrder = await GameOrder.create({
      order_no: orderNo,
      user_id: userId,
      game_id: gameId,
      game_name: gameName,
      target_user_id: companionId || 0,
      companion_id: companionId,
      companion_name: companionName,
      duration: parseInt(duration) || 0,
      price: amountVal,
      amount: amountVal,
      total_price: amountVal,
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
    response.error(res, error.message);
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await GameOrder.findByPk(id);
    if (!order) {
      return response.notFound(res, '订单不存在');
    }
    
    await GameOrder.destroy({ where: { id } });
    response.success(res, {}, '订单删除成功');
  } catch (error) {
    logger.error('删除订单错误:', error);
    response.error(res, `删除订单失败: ${error.message}`);
  }
};

const getWithdrawList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, userId, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    const where = {};
    if (userId) where.user_id = parseInt(userId);
    // status 映射: pending=0, approved=1, rejected=2
    if (status !== undefined && status !== '') {
      if (status === 'pending') where.is_check = 0;
      else if (status === 'approved') where.is_check = 1;
      else if (status === 'rejected') where.is_check = 2;
    }
    
    const result = await Withdraw.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['create_time', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname'] }]
    });
    
    const withdraws = result.rows || [];
    const total = result.count || 0;
    
    const mapped = withdraws.map(w => {
      const auditStatus = w.is_check; // 0=待审核, 1=已通过, 2=已拒绝
      const typeMap = { 1: '支付宝', 2: '微信', 3: '银行卡' };
      return {
        id: w.id,
        userId: w.user_id,
        username: w.user?.username || '',
        nickname: w.user?.nickname || '',
        amount: parseFloat(w.money) || parseFloat(w.amount) || 0,
        fee: parseFloat(w.shouxufei) || 0,
        actualPay: parseFloat(w.pay_money) || 0,
        type: w.type,
        withdrawType: typeMap[w.type] || ('type_' + w.type),
        account: w.account || '',
        bank: w.bank || '',
        name: w.name || '',
        mobile: w.mobile || '',
        auditStatus: auditStatus,
        remark: w.remark || '',
        createTime: w.create_time,
        handleTime: w.handle_time
      };
    });
    
    response.success(res, {
      list: mapped,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('获取提现列表错误:', error);
    return dbErrorResponse(res, '获取提现列表', error);
  }
};

const approveWithdraw = async (req, res) => {
  try {
    const { id } = req.params;
    
    const withdraw = await Withdraw.findByPk(id);
    if (!withdraw) {
      return response.notFound(res, '提现记录不存在');
    }
    
    if (withdraw.is_check !== 0) {
      return response.badRequest(res, '该提现记录状态不允许操作');
    }
    
    await withdraw.update({
      is_check: 1,
      state: 'approved',
      handle_time: Math.floor(Date.now() / 1000),
      update_time: Math.floor(Date.now() / 1000)
    });
    response.success(res, { auditStatus: 1 }, '审核通过');
  } catch (error) {
    logger.error('审核提现错误:', error);
    response.error(res, `审核提现失败: ${error.message}`);
  }
};

const rejectWithdraw = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const withdraw = await Withdraw.findByPk(id);
    if (!withdraw) {
      return response.notFound(res, '提现记录不存在');
    }
    
    if (withdraw.is_check !== 0) {
      return response.badRequest(res, '该提现记录状态不允许操作');
    }
    
    await withdraw.update({
      is_check: 2,
      state: 'rejected',
      remark: reason || withdraw.remark,
      handle_time: Math.floor(Date.now() / 1000),
      update_time: Math.floor(Date.now() / 1000)
    });
    response.success(res, { auditStatus: 2 }, '已拒绝');
  } catch (error) {
    logger.error('拒绝提现错误:', error);
    response.error(res, `拒绝提现失败: ${error.message}`);
  }
};

const getWithdrawDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const withdraw = await Withdraw.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] }]
    });
    
    if (!withdraw) {
      return response.notFound(res, '提现记录不存在');
    }
    
    const typeMap = { 1: '支付宝', 2: '微信', 3: '银行卡' };
    response.success(res, {
      id: withdraw.id,
      userId: withdraw.user_id,
      username: withdraw.user?.username || '',
      nickname: withdraw.user?.nickname || '',
      userAvatar: withdraw.user?.avatar || '',
      amount: parseFloat(withdraw.money) || parseFloat(withdraw.amount) || 0,
      fee: parseFloat(withdraw.shouxufei) || 0,
      actualPay: parseFloat(withdraw.pay_money) || 0,
      type: withdraw.type,
      withdrawType: typeMap[withdraw.type] || ('type_' + withdraw.type),
      account: withdraw.account || '',
      bank: withdraw.bank || '',
      name: withdraw.name || '',
      mobile: withdraw.mobile || '',
      image: withdraw.image || '',
      auditStatus: withdraw.is_check,
      state: withdraw.state || '',
      remark: withdraw.remark || '',
      createTime: withdraw.create_time,
      handleTime: withdraw.handle_time,
      updateTime: withdraw.update_time
    });
  } catch (error) {
    logger.error('获取提现详情错误:', error);
    response.error(res, '获取提现详情失败');
  }
};

const createWithdraw = async (req, res) => {
  try {
    const { userId, amount, type, account } = req.body;
    const moneyVal = parseFloat(amount) || 0;
    
    const newWithdraw = await Withdraw.create({
      user_id: userId,
      money: moneyVal,
      amount: moneyVal,
      pay_money: moneyVal,
      type: 1,
      account: account || '',
      bank: '',
      name: '',
      mobile: '',
      image: '',
      is_check: 0,
      status: 0,
      state: 'pending',
      create_time: Math.floor(Date.now() / 1000),
      update_time: Math.floor(Date.now() / 1000)
    });
    
    response.success(res, {
      withdrawId: newWithdraw.id,
      userId: newWithdraw.user_id,
      amount: parseFloat(newWithdraw.money) || parseFloat(newWithdraw.amount) || moneyVal,
      type: newWithdraw.type,
      account: newWithdraw.account,
      status: newWithdraw.status,
      createTime: newWithdraw.create_time
    }, '提现记录创建成功');
  } catch (error) {
    logger.error('创建提现记录错误:', error);
    response.error(res, `创建提现记录失败: ${error.message}`);
  }
};

const deleteWithdraw = async (req, res) => {
  try {
    const { id } = req.params;
    const withdraw = await Withdraw.findByPk(id);
    
    if (!withdraw) {
      return response.notFound(res, '提现记录不存在');
    }
    
    await Withdraw.destroy({ where: { id: parseInt(id) } });
    response.success(res, {}, '提现记录删除成功');
  } catch (error) {
    logger.error('删除提现记录错误:', error);
    response.error(res, `删除提现记录失败: ${error.message}`);
  }
};

const getPostList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query;
    const offset = (page - 1) * pageSize;
    
    const where = {};
    if (keyword) where.content = keyword;
    
    const result = await Post.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['create_time', 'DESC']]
    });
    
    const posts = result.rows || [];
    const total = result.count || 0;
    
    const mapped = posts.map(post => ({
      id: post.id,
      userId: post.user_id,
      content: post.content,
      images: post.images ? post.images.split(',') : [],
      likeCount: post.thumb_num || 0,
      commentCount: post.comment_num || 0,
      createTime: (post.create_time || 0) * 1000
    }));
    
    response.success(res, {
      list: mapped,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('获取帖子列表错误:', error);
    return dbErrorResponse(res, '获取帖子列表', error);
  }
};

const getPostDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id);
    
    if (!post) {
      return response.notFound(res, '帖子不存在');
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
    response.error(res, error.message);
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findByPk(id);
    if (!post) {
      return response.notFound(res, '帖子不存在');
    }
    
    await Post.destroy({ where: { id: parseInt(id) } });
    response.success(res, {}, '帖子删除成功');
  } catch (error) {
    logger.error('删除帖子错误:', error);
    response.error(res, `删除帖子失败: ${error.message}`);
  }
};

const getReportList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, status, type } = req.query;
    const where = {};
    if (status !== undefined && status !== '') where.status = parseInt(status);
    if (type !== undefined && type !== '') where.target_type = type;

    const queryOptions = {
      where,
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      limit: parseInt(pageSize),
      order: [['create_time', 'DESC']]
    };

    let list;
    let total;

    try {
      const { count, rows } = await Report.findAndCountAll(queryOptions);
      list = rows; total = count;
    } catch (dbErr) {
      logger.error('[DB] Report 表查询失败:', dbErr.message);
      list = []; total = 0;
    }

    response.success(res, {
      list: list.map(r => ({
        id: r.id,
        reporterId: r.user_id,
        reportedUserId: r.target_user_id,
        type: r.target_type,
        targetId: r.target_id,
        description: r.reason,
        images: r.images && typeof r.images === 'string' ? (() => { try { return JSON.parse(r.images); } catch { return []; } })() : (Array.isArray(r.images) ? r.images : []),
        status: r.status,
        handleResult: r.handle_result || '',
        handleTime: r.handle_time || 0,
        createTime: r.create_time || 0
      })),
      pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total, totalPages: Math.ceil(total / parseInt(pageSize)) }
    });
  } catch (error) {
    logger.error('获取举报列表错误:', error);
    response.error(res, error.message);
  }
};

const getReportDetail = async (req, res) => {
  try {
    let report;
    try {
      report = await Report.findByPk(parseInt(req.params.id));
    } catch (dbErr) {
      logger.error('[DB] Report 查询失败:', dbErr.message);
      return response.error(res, '数据库查询失败');
    }
    if (!report) return response.notFound(res, '举报不存在');

    response.success(res, {
      id: report.id,
      reporterId: report.user_id,
      reportedUserId: report.target_user_id,
      type: report.target_type,
      targetId: report.target_id,
      description: report.reason,
      images: report.images && typeof report.images === 'string' ? (() => { try { return JSON.parse(report.images); } catch { return []; } })() : (Array.isArray(report.images) ? report.images : []),
      status: report.status,
      handleResult: report.handle_result || '',
      handleTime: report.handle_time || 0,
      createTime: report.create_time || 0
    });
  } catch (error) {
    logger.error('获取举报详情错误:', error);
    response.error(res, error.message);
  }
};

const handleReport = async (req, res) => {
  try {
    const { status, handleResult } = req.body;
    if (status === undefined) return response.badRequest(res, '处理状态不能为空');

    const report = await Report.findByPk(parseInt(req.params.id));
    if (!report) return response.notFound(res, '举报不存在');

    await report.update({
      status: parseInt(status),
      handle_result: handleResult || '',
      handle_time: Math.floor(Date.now() / 1000)
    });

    response.success(res, {}, '处理成功');
  } catch (error) {
    logger.error('处理举报错误:', error);
    response.error(res, '处理举报失败: ' + error.message);
  }
};

const deleteReport = async (req, res) => {
  try {
    const report = await Report.findByPk(parseInt(req.params.id));
    if (!report) return response.notFound(res, '举报不存在');

    await report.destroy();
    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('删除举报错误:', error);
    response.error(res, '删除举报失败: ' + error.message);
  }
};

// ==================== Banner 管理 ====================
// 已对接 Banner 数据表

const getBannerList = async (req, res) => {
  try {
    const { page = 1, pageSize = 50, status, keyword } = req.query;
    const where = {};
    if (status !== undefined && status !== '') where.status = parseInt(status);
    if (keyword) {
      const { Op } = require('sequelize');
      where.title = { [Op.like]: `%${keyword}%` };
    }

    const { count, rows } = await Banner.findAndCountAll({
      where,
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      limit: parseInt(pageSize),
      order: [['sort_order', 'ASC'], ['create_time', 'DESC']]
    });

    response.success(res, {
      list: rows.map(b => ({
        id: b.id,
        title: b.title,
        image: b.image,
        link: b.link_url || '',
        sort: b.sort_order,
        status: b.status,
        create_time: b.create_time,
        createTime: b.create_time ? b.create_time * 1000 : Date.now()
      })),
      pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total: count, totalPages: Math.ceil(count / parseInt(pageSize)) }
    });
  } catch (error) {
    logger.error('获取Banner列表错误:', error);
    return dbErrorResponse(res, '获取Banner列表', error);
  }
};

const getBannerDetail = async (req, res) => {
  try {
    const banner = await Banner.findByPk(parseInt(req.params.id));
    if (!banner) return response.notFound(res, 'Banner不存在');

    response.success(res, {
      id: banner.id,
      title: banner.title,
      image: banner.image,
      link: banner.link_url || '',
      sort: banner.sort_order,
      status: banner.status,
      create_time: banner.create_time,
      createTime: banner.create_time ? banner.create_time * 1000 : Date.now()
    });
  } catch (error) {
    logger.error('获取Banner详情错误:', error);
    response.error(res, error.message);
  }
};

const createBanner = async (req, res) => {
  try {
    const { title, image, link, sort, status } = req.body;
    if (!title || !image) return response.badRequest(res, '标题和图片不能为空');

    const banner = await Banner.create({
      title,
      image,
      link_url: link || '',
      sort_order: parseInt(sort) || 0,
      status: status !== undefined ? parseInt(status) : 1,
      create_time: Math.floor(Date.now() / 1000),
      update_time: Math.floor(Date.now() / 1000)
    });

    response.created(res, {
      id: banner.id,
      title: banner.title,
      image: banner.image,
      link: banner.link_url || '',
      sort: banner.sort_order,
      status: banner.status,
      createTime: Date.now()
    }, '创建成功');
  } catch (error) {
    logger.error('创建Banner错误:', error);
    response.error(res, '创建Banner失败: ' + error.message);
  }
};

const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByPk(parseInt(req.params.id));
    if (!banner) return response.notFound(res, 'Banner不存在');

    const { title, image, link, sort, status } = req.body;
    if (title !== undefined) banner.title = title;
    if (image !== undefined) banner.image = image;
    if (link !== undefined) banner.link_url = link;
    if (sort !== undefined) banner.sort_order = parseInt(sort);
    if (status !== undefined) banner.status = parseInt(status);
    banner.update_time = Math.floor(Date.now() / 1000);

    await banner.save();
    response.success(res, {}, '更新成功');
  } catch (error) {
    logger.error('更新Banner错误:', error);
    response.error(res, '更新Banner失败: ' + error.message);
  }
};

const updateBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findByPk(parseInt(req.params.id));
    if (!banner) return response.notFound(res, 'Banner不存在');

    const { status } = req.body;
    if (status === undefined) return response.badRequest(res, '状态不能为空');

    banner.status = parseInt(status);
    await banner.save();
    response.success(res, { status: banner.status }, '状态更新成功');
  } catch (error) {
    logger.error('更新Banner状态错误:', error);
    response.error(res, error.message);
  }
};

const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByPk(parseInt(req.params.id));
    if (!banner) return response.notFound(res, 'Banner不存在');

    await banner.destroy();
    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('删除Banner错误:', error);
    response.error(res, error.message);
  }
};

// ==================== 开屏弹窗管理 ====================
const getSplashList = async (req, res) => {
  try {
    const { page = 1, pageSize = 50, status, keyword } = req.query;
    const where = {};
    if (status !== undefined && status !== '') where.status = parseInt(status);
    if (keyword) {
      where.title = { [Op.like]: `%${keyword}%` };
    }

    const { count, rows } = await SplashScreen.findAndCountAll({
      where,
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      limit: parseInt(pageSize),
      order: [['sort', 'DESC'], ['created_at', 'DESC']]
    });

    response.success(res, {
      list: rows.map(s => ({
        id: s.id,
        title: s.title,
        image: s.image,
        link: s.link || '',
        frequency: s.frequency,
        start_time: s.start_time,
        end_time: s.end_time,
        sort: s.sort,
        status: s.status,
        created_at: s.created_at,
        createTime: s.created_at ? s.created_at * 1000 : Date.now()
      })),
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count,
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    logger.error('获取开屏弹窗列表错误:', error);
    response.error(res, error.message);
  }
};

const getSplashDetail = async (req, res) => {
  try {
    const splash = await SplashScreen.findByPk(parseInt(req.params.id));
    if (!splash) return response.notFound(res, '开屏弹窗不存在');

    response.success(res, {
      id: splash.id,
      title: splash.title,
      image: splash.image,
      link: splash.link || '',
      frequency: splash.frequency,
      start_time: splash.start_time,
      end_time: splash.end_time,
      sort: splash.sort,
      status: splash.status,
      created_at: splash.created_at,
      createTime: splash.created_at ? splash.created_at * 1000 : Date.now()
    });
  } catch (error) {
    logger.error('获取开屏弹窗详情错误:', error);
    response.error(res, error.message);
  }
};

const createSplash = async (req, res) => {
  try {
    const { title, image, link, frequency, start_time, end_time, sort, status } = req.body;
    if (!image) return response.badRequest(res, '弹窗图片不能为空');

    const splash = await SplashScreen.create({
      title: title || '',
      image,
      link: link || '',
      frequency: frequency !== undefined ? parseInt(frequency) : 1,
      start_time: start_time ? parseInt(start_time) : 0,
      end_time: end_time ? parseInt(end_time) : 0,
      sort: parseInt(sort) || 0,
      status: status !== undefined ? parseInt(status) : 1,
      created_at: Math.floor(Date.now() / 1000)
    });

    response.created(res, {
      id: splash.id,
      title: splash.title,
      image: splash.image,
      link: splash.link,
      frequency: splash.frequency,
      start_time: splash.start_time,
      end_time: splash.end_time,
      sort: splash.sort,
      status: splash.status,
      createTime: Date.now()
    }, '创建成功');
  } catch (error) {
    logger.error('创建开屏弹窗错误:', error);
    response.error(res, '创建开屏弹窗失败: ' + error.message);
  }
};

const updateSplash = async (req, res) => {
  try {
    const splash = await SplashScreen.findByPk(parseInt(req.params.id));
    if (!splash) return response.notFound(res, '开屏弹窗不存在');

    const { title, image, link, frequency, start_time, end_time, sort, status } = req.body;
    if (title !== undefined) splash.title = title;
    if (image !== undefined) splash.image = image;
    if (link !== undefined) splash.link = link;
    if (frequency !== undefined) splash.frequency = parseInt(frequency);
    if (start_time !== undefined) splash.start_time = parseInt(start_time);
    if (end_time !== undefined) splash.end_time = parseInt(end_time);
    if (sort !== undefined) splash.sort = parseInt(sort);
    if (status !== undefined) splash.status = parseInt(status);

    await splash.save();
    response.success(res, {}, '更新成功');
  } catch (error) {
    logger.error('更新开屏弹窗错误:', error);
    response.error(res, '更新开屏弹窗失败: ' + error.message);
  }
};

const updateSplashStatus = async (req, res) => {
  try {
    const splash = await SplashScreen.findByPk(parseInt(req.params.id));
    if (!splash) return response.notFound(res, '开屏弹窗不存在');

    const { status } = req.body;
    if (status === undefined) return response.badRequest(res, '状态不能为空');

    splash.status = parseInt(status);
    await splash.save();
    response.success(res, { status: splash.status }, '状态更新成功');
  } catch (error) {
    logger.error('更新开屏弹窗状态错误:', error);
    response.error(res, error.message);
  }
};

const deleteSplash = async (req, res) => {
  try {
    const splash = await SplashScreen.findByPk(parseInt(req.params.id));
    if (!splash) return response.notFound(res, '开屏弹窗不存在');

    await splash.destroy();
    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('删除开屏弹窗错误:', error);
    response.error(res, error.message);
  }
};

// ==================== VIP 套餐管理 ====================
// 已对接 VipPackage 数据表

const getVipPackageList = async (req, res) => {
  try {
    const { page = 1, pageSize = 50, status, keyword } = req.query;
    const where = {};
    if (status !== undefined && status !== '') where.status = parseInt(status);
    if (keyword) {
      const { Op } = require('sequelize');
      where.name = { [Op.like]: `%${keyword}%` };
    }

    const { count, rows } = await VipPackage.findAndCountAll({
      where,
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      limit: parseInt(pageSize),
      order: [['sort', 'ASC']]
    });

    response.success(res, {
      list: rows.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.original_price || null,
        duration: p.duration || 30,
        description: p.description || '',
        sort: p.sort,
        status: p.status,
        createTime: p.create_time ? p.create_time * 1000 : Date.now()
      })),
      pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total: count, totalPages: Math.ceil(count / parseInt(pageSize)) }
    });
  } catch (error) {
    logger.error('获取VIP套餐列表错误:', error);
    return dbErrorResponse(res, '获取VIP套餐列表', error);
  }
};

const getVipPackageDetail = async (req, res) => {
  try {
    const pkg = await VipPackage.findByPk(parseInt(req.params.id));
    if (!pkg) return response.notFound(res, 'VIP套餐不存在');

    response.success(res, {
      id: pkg.id,
      name: pkg.name,
      price: pkg.price,
      originalPrice: pkg.original_price || null,
      duration: pkg.duration || 30,
      description: pkg.description || '',
      sort: pkg.sort,
      status: pkg.status,
      createTime: pkg.create_time ? pkg.create_time * 1000 : Date.now()
    });
  } catch (error) {
    logger.error('获取VIP套餐详情错误:', error);
    response.error(res, error.message);
  }
};

const createVipPackage = async (req, res) => {
  try {
    const { name, price, originalPrice, duration, description, sort, status } = req.body;
    if (!name || price === undefined) return response.badRequest(res, '套餐名称和价格不能为空');

    const pkg = await VipPackage.create({
      name,
      price: parseFloat(price),
      original_price: originalPrice ? parseFloat(originalPrice) : null,
      duration: parseInt(duration) || 30,
      description: description || '',
      sort: parseInt(sort) || 0,
      status: status !== undefined ? parseInt(status) : 1,
      create_time: Math.floor(Date.now() / 1000)
    });

    response.created(res, {
      id: pkg.id,
      name: pkg.name,
      price: pkg.price,
      originalPrice: pkg.original_price,
      duration: pkg.duration,
      description: pkg.description,
      sort: pkg.sort,
      status: pkg.status,
      createTime: Date.now()
    }, 'VIP套餐创建成功');
  } catch (error) {
    logger.error('创建VIP套餐错误:', error);
    response.error(res, '创建VIP套餐失败: ' + error.message);
  }
};

const updateVipPackage = async (req, res) => {
  try {
    const pkg = await VipPackage.findByPk(parseInt(req.params.id));
    if (!pkg) return response.notFound(res, 'VIP套餐不存在');

    const { name, price, originalPrice, duration, description, sort, status } = req.body;
    if (name !== undefined) pkg.name = name;
    if (price !== undefined) pkg.price = parseFloat(price);
    if (originalPrice !== undefined) pkg.original_price = originalPrice ? parseFloat(originalPrice) : null;
    if (duration !== undefined) pkg.duration = parseInt(duration);
    if (description !== undefined) pkg.description = description;
    if (sort !== undefined) pkg.sort = parseInt(sort);
    if (status !== undefined) pkg.status = parseInt(status);

    await pkg.save();
    response.success(res, {}, 'VIP套餐更新成功');
  } catch (error) {
    logger.error('更新VIP套餐错误:', error);
    response.error(res, '更新VIP套餐失败: ' + error.message);
  }
};

const updateVipPackageStatus = async (req, res) => {
  try {
    const pkg = await VipPackage.findByPk(parseInt(req.params.id));
    if (!pkg) return response.notFound(res, 'VIP套餐不存在');

    const { status } = req.body;
    if (status === undefined) return response.badRequest(res, '状态不能为空');

    pkg.status = parseInt(status);
    await pkg.save();
    response.success(res, { status: pkg.status }, '状态更新成功');
  } catch (error) {
    logger.error('更新VIP套餐状态错误:', error);
    response.error(res, error.message);
  }
};

const deleteVipPackage = async (req, res) => {
  try {
    const pkg = await VipPackage.findByPk(parseInt(req.params.id));
    if (!pkg) return response.notFound(res, 'VIP套餐不存在');

    await pkg.destroy();
    response.success(res, {}, 'VIP套餐删除成功');
  } catch (error) {
    logger.error('删除VIP套餐错误:', error);
    response.error(res, error.message);
  }
};

// ==================== 充值金额档位管理 ====================
// 已对接 RechargePackage 数据表（充值金额 + 赠送金币）

const getRechargePackageList = async (req, res) => {
  try {
    const { page = 1, pageSize = 50, status, keyword } = req.query;
    const where = {};
    if (status !== undefined && status !== '') where.status = parseInt(status);
    if (keyword) {
      where.name = { [Op.like]: `%${keyword}%` };
    }

    const { count, rows } = await RechargePackage.findAndCountAll({
      where,
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      limit: parseInt(pageSize),
      order: [['sort', 'ASC']]
    });

    response.success(res, {
      list: rows.map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price) || 0,
        coins: p.coins || 0,
        bonusCoins: p.bonus_coins || 0,
        totalCoins: (p.coins || 0) + (p.bonus_coins || 0),
        hot: p.hot || 0,
        sort: p.sort,
        status: p.status,
        createTime: p.create_time ? p.create_time * 1000 : Date.now()
      })),
      pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total: count, totalPages: Math.ceil(count / parseInt(pageSize)) }
    });
  } catch (error) {
    logger.error('获取充值金额档位列表错误:', error);
    return dbErrorResponse(res, '获取充值金额档位列表', error);
  }
};

const getRechargePackageDetail = async (req, res) => {
  try {
    const pkg = await RechargePackage.findByPk(parseInt(req.params.id));
    if (!pkg) return response.notFound(res, '充值金额档位不存在');

    response.success(res, {
      id: pkg.id,
      name: pkg.name,
      price: Number(pkg.price) || 0,
      coins: pkg.coins || 0,
      bonusCoins: pkg.bonus_coins || 0,
      totalCoins: (pkg.coins || 0) + (pkg.bonus_coins || 0),
      hot: pkg.hot || 0,
      sort: pkg.sort,
      status: pkg.status,
      createTime: pkg.create_time ? pkg.create_time * 1000 : Date.now()
    });
  } catch (error) {
    logger.error('获取充值金额档位详情错误:', error);
    response.error(res, error.message);
  }
};

const createRechargePackage = async (req, res) => {
  try {
    const { name, price, coins, bonusCoins, hot, sort, status } = req.body;
    if (!name || price === undefined || coins === undefined) return response.badRequest(res, '名称、充值金额和金币数量不能为空');

    const pkg = await RechargePackage.create({
      name,
      price: parseFloat(price),
      coins: parseInt(coins) || 0,
      bonus_coins: parseInt(bonusCoins) || 0,
      hot: hot !== undefined ? parseInt(hot) : 0,
      sort: parseInt(sort) || 0,
      status: status !== undefined ? parseInt(status) : 1,
      create_time: Math.floor(Date.now() / 1000),
      update_time: Math.floor(Date.now() / 1000)
    });

    response.created(res, {
      id: pkg.id,
      name: pkg.name,
      price: Number(pkg.price),
      coins: pkg.coins,
      bonusCoins: pkg.bonus_coins || 0,
      hot: pkg.hot,
      sort: pkg.sort,
      status: pkg.status
    }, '充值金额档位创建成功');
  } catch (error) {
    logger.error('创建充值金额档位错误:', error);
    response.error(res, '创建充值金额档位失败: ' + error.message);
  }
};

const updateRechargePackage = async (req, res) => {
  try {
    const pkg = await RechargePackage.findByPk(parseInt(req.params.id));
    if (!pkg) return response.notFound(res, '充值金额档位不存在');

    const { name, price, coins, bonusCoins, hot, sort, status } = req.body;
    if (name !== undefined) pkg.name = name;
    if (price !== undefined) pkg.price = parseFloat(price);
    if (coins !== undefined) pkg.coins = parseInt(coins) || 0;
    if (bonusCoins !== undefined) pkg.bonus_coins = parseInt(bonusCoins) || 0;
    if (hot !== undefined) pkg.hot = parseInt(hot);
    if (sort !== undefined) pkg.sort = parseInt(sort);
    if (status !== undefined) pkg.status = parseInt(status);
    pkg.update_time = Math.floor(Date.now() / 1000);

    await pkg.save();
    response.success(res, {}, '充值金额档位更新成功');
  } catch (error) {
    logger.error('更新充值金额档位错误:', error);
    response.error(res, '更新充值金额档位失败: ' + error.message);
  }
};

const updateRechargePackageStatus = async (req, res) => {
  try {
    const pkg = await RechargePackage.findByPk(parseInt(req.params.id));
    if (!pkg) return response.notFound(res, '充值金额档位不存在');

    const { status } = req.body;
    if (status === undefined) return response.badRequest(res, '状态不能为空');

    pkg.status = parseInt(status);
    pkg.update_time = Math.floor(Date.now() / 1000);
    await pkg.save();
    response.success(res, { status: pkg.status }, '状态更新成功');
  } catch (error) {
    logger.error('更新充值金额档位状态错误:', error);
    response.error(res, error.message);
  }
};

const deleteRechargePackage = async (req, res) => {
  try {
    const pkg = await RechargePackage.findByPk(parseInt(req.params.id));
    if (!pkg) return response.notFound(res, '充值金额档位不存在');

    await pkg.destroy();
    response.success(res, {}, '充值金额档位删除成功');
  } catch (error) {
    logger.error('删除充值金额档位错误:', error);
    response.error(res, error.message);
  }
};

// ==================== 礼物记录管理 ====================
// 已对接 GiftLog 数据表

const getGiftLogList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, userId, keyword } = req.query;
    const where = {};
    if (userId) where.user_id = parseInt(userId);

    let queryOptions = { where, order: [['create_time', 'DESC']] };

    try {
      const { count, rows } = await GiftLog.findAndCountAll({
        ...queryOptions,
        offset: (parseInt(page) - 1) * parseInt(pageSize),
        limit: parseInt(pageSize)
      });

      let result = rows.map(g => ({
        id: g.id,
        fromUserId: g.song_user_id,
        fromUserName: g.song_user_nickname || '',
        toUserId: g.user_id,
        toUserName: g.user_nickname || '',
        giftName: g.gift_name || '',
        giftNum: g.gift_num || 1,
        giftPrice: Number(g.totalmoney) || 0,
        giftImage: g.gift_image || '',
        createTime: g.create_time ? g.create_time * 1000 : Date.now()
      }));

      if (keyword) {
        result = result.filter(r =>
          r.giftName.includes(keyword) || r.toUserName.includes(keyword)
        );
      }

      const total = count;
      response.success(res, {
        list: result,
        pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total, totalPages: Math.ceil(total / parseInt(pageSize)) }
      });
    } catch (dbErr) {
      logger.error('[DB] GiftLog 查询失败:', dbErr.message);
      return dbErrorResponse(res, '获取礼物记录列表', dbErr);
    }
  } catch (error) {
    logger.error('获取礼物记录列表错误:', error);
    response.error(res, error.message);
  }
};

const getGiftLogDetail = async (req, res) => {
  try {
    const giftLog = await GiftLog.findByPk(parseInt(req.params.id));
    if (!giftLog) return response.notFound(res, '礼物记录不存在');

    response.success(res, {
      id: giftLog.id,
      fromUserId: giftLog.song_user_id,
      fromUserName: giftLog.song_user_nickname || '',
      toUserId: giftLog.user_id,
      toUserName: giftLog.user_nickname || '',
      giftName: giftLog.gift_name || '',
      giftNum: giftLog.gift_num || 1,
      giftPrice: Number(giftLog.totalmoney) || 0,
      giftImage: giftLog.gift_image || '',
      createTime: giftLog.create_time ? giftLog.create_time * 1000 : Date.now()
    });
  } catch (error) {
    logger.error('获取礼物记录详情错误:', error);
    response.error(res, error.message);
  }
};

// ==================== 充值记录管理 ====================
// 已对接 OrderChong / xn_order_chong 数据表

const getRechargeRecordList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, userId, status, keyword } = req.query;
    const where = {};
    if (userId) where.user_id = parseInt(userId);
    if (status !== undefined && status !== '') {
      const statusMap = { 'completed': 1, 'paid': 1, 'pending': 0, 'failed': 2 };
      where.status = statusMap[status] !== undefined ? statusMap[status] : parseInt(status);
    }

    try {
      const { count, rows } = await OrderChong.findAndCountAll({
        where,
        offset: (parseInt(page) - 1) * parseInt(pageSize),
        limit: parseInt(pageSize),
        order: [['id', 'DESC']]
      });

      const payTypeMap = { 'wechat': '微信支付', 'alipay': '支付宝', 'apple': '苹果支付', 'admin': '后台充值' };
      let result = rows.map(r => ({
        id: r.id,
        orderNo: r.order_no || '',
        userId: r.user_id,
        amount: parseFloat(r.amount) || 0,
        coins: r.coins || 0,
        paymentMethod: payTypeMap[r.pay_type] || (r.pay_type || '微信支付'),
        payType: r.pay_type || '',
        status: r.status === 1 ? 'completed' : r.status === 0 ? 'pending' : 'failed',
        statusText: r.status === 1 ? '已完成' : r.status === 0 ? '待支付' : '支付失败',
        payTime: r.pay_time || 0,
        createTime: r.create_time ? r.create_time * 1000 : Date.now()
      }));

      if (keyword) {
        result = result.filter(r =>
          r.orderNo.includes(keyword) || String(r.userId).includes(keyword)
        );
      }

      response.success(res, {
        list: result,
        pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total: count, totalPages: Math.ceil(count / parseInt(pageSize)) }
      });
    } catch (dbErr) {
      logger.error('[DB] OrderChong 查询失败:', dbErr.message);
      return dbErrorResponse(res, '获取充值记录列表', dbErr);
    }
  } catch (error) {
    logger.error('获取充值记录列表错误:', error);
    response.error(res, error.message);
  }
};

const getRechargeRecordDetail = async (req, res) => {
  try {
    const record = await OrderChong.findByPk(parseInt(req.params.id));
    if (!record) return response.notFound(res, '充值记录不存在');

    response.success(res, {
      id: record.id,
      orderNo: record.order_no || '',
      userId: record.user_id,
      amount: parseFloat(record.amount) || 0,
      coins: record.coins || 0,
      paymentMethod: (function(pt) {
        const map = { 'wechat': '微信支付', 'alipay': '支付宝', 'apple': '苹果支付', 'admin': '后台充值' };
        return map[pt] || pt || '微信支付';
      })(record.pay_type),
      payType: record.pay_type || '',
      status: record.status === 1 ? 'completed' : record.status === 0 ? 'pending' : 'failed',
      statusText: record.status === 1 ? '已完成' : record.status === 0 ? '待支付' : '支付失败',
      payTime: record.pay_time || 0,
      createTime: record.create_time ? record.create_time * 1000 : Date.now(),
      updateTime: record.update_time ? record.update_time * 1000 : null
    });
  } catch (error) {
    logger.error('获取充值记录详情错误:', error);
    response.error(res, error.message);
  }
};

const deleteRechargeRecord = async (req, res) => {
  try {
    const record = await OrderChong.findByPk(parseInt(req.params.id));
    if (!record) return response.notFound(res, '充值记录不存在');

    await record.destroy();
    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('删除充值记录错误:', error);
    response.error(res, error.message);
  }
};

// ==================== 游戏/服务分类管理 ====================
// 已对接 Game / xn_game 数据表

const getGameList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword = '', status } = req.query;
    const where = {};
    if (status !== undefined && status !== '') where.status = parseInt(status);
    if (keyword) {
      const { Op } = require('sequelize');
      where.name = { [Op.like]: `%${keyword}%` };
    }

    const { count, rows } = await Game.findAndCountAll({
      where,
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      limit: parseInt(pageSize),
      order: [['sort', 'ASC']]
    });

    response.success(res, {
      list: rows.map(g => ({
        id: g.id,
        name: g.name || '',
        icon: g.icon || '',
        description: g.description || '',
        status: g.status || 0,
        sort: g.sort || 0,
        createTime: g.create_time ? g.create_time * 1000 : Date.now()
      })),
      pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total: count, totalPages: Math.ceil(count / parseInt(pageSize)) }
    });
  } catch (error) {
    logger.error('获取游戏列表错误:', error);
    return dbErrorResponse(res, '获取游戏列表', error);
  }
};

const getGameDetail = async (req, res) => {
  try {
    const game = await Game.findByPk(parseInt(req.params.id));
    if (!game) return response.notFound(res, '服务不存在');

    response.success(res, {
      id: game.id,
      name: game.name || '',
      icon: game.icon || '',
      description: game.description || '',
      status: game.status || 0,
      sort: game.sort || 0,
      createTime: game.create_time ? game.create_time * 1000 : Date.now()
    });
  } catch (error) {
    logger.error('获取游戏详情错误:', error);
    response.error(res, error.message);
  }
};

const createGame = async (req, res) => {
  try {
    const { name, icon, description, sort, status } = req.body;
    if (!name) return response.badRequest(res, '服务名称不能为空');

    const game = await Game.create({
      name,
      icon: icon || '',
      description: description || '',
      sort: parseInt(sort) || 0,
      status: status !== undefined ? parseInt(status) : 1,
      create_time: Math.floor(Date.now() / 1000)
    });

    response.created(res, {
      id: game.id,
      name: game.name,
      icon: game.icon,
      description: game.description,
      sort: game.sort,
      status: game.status,
      createTime: Date.now()
    }, '服务创建成功');
  } catch (error) {
    logger.error('创建游戏错误:', error);
    response.error(res, '创建失败: ' + error.message);
  }
};

const updateGame = async (req, res) => {
  try {
    const game = await Game.findByPk(parseInt(req.params.id));
    if (!game) return response.notFound(res, '服务不存在');

    const { name, icon, description, sort, status } = req.body;
    if (name !== undefined) game.name = name;
    if (icon !== undefined) game.icon = icon;
    if (description !== undefined) game.description = description;
    if (sort !== undefined) game.sort = parseInt(sort);
    if (status !== undefined) game.status = parseInt(status);

    await game.save();
    response.success(res, {}, '服务更新成功');
  } catch (error) {
    logger.error('更新游戏错误:', error);
    response.error(res, '更新失败: ' + error.message);
  }
};

const updateGameStatus = async (req, res) => {
  try {
    const game = await Game.findByPk(parseInt(req.params.id));
    if (!game) return response.notFound(res, '服务不存在');

    const { status } = req.body;
    if (status === undefined) return response.badRequest(res, '状态不能为空');

    game.status = parseInt(status);
    await game.save();
    response.success(res, { status: game.status }, '状态更新成功');
  } catch (error) {
    logger.error('更新游戏状态错误:', error);
    response.error(res, error.message);
  }
};

const deleteGame = async (req, res) => {
  try {
    const game = await Game.findByPk(parseInt(req.params.id));
    if (!game) return response.notFound(res, '服务不存在');

    await game.destroy();
    response.success(res, {}, '服务删除成功');
  } catch (error) {
    logger.error('删除游戏错误:', error);
    response.error(res, error.message);
  }
};

const getSystemSettings = async (req, res) => {
  try {
    const defaults = {
      siteName: 'eu搭子',
      siteDescription: 'eu搭子 - 专业游戏陪玩平台',
      siteKeywords: '陪玩,游戏陪玩,陪玩平台',
      siteLogo: '',
      siteFavicon: '',
      recordNumber: '粤ICP备xxxxxxxx号',
      contactEmail: 'admin@eudazi.com',
      contactPhone: '400-888-8888',
      userDefaultAvatar: '',
      userInitBalance: 0,
      userInitScore: 0,
      withdrawMinAmount: 50,
      withdrawFeeRate: 0.02,
      withdrawAutoApprove: false,
      registerEnabled: true,
      registerNeedPhone: true,
      registerNeedRealName: false,
      reviewContentEnabled: true,
      giftEnabled: true,
      voiceChatEnabled: false,
      videoChatEnabled: false,
      shareEnabled: true,
      shareRewardEnabled: false,
      shareRewardAmount: 0
    };

    try {
      const { SystemSettings } = require('../models');
      const rows = await SystemSettings.findAll({ raw: true });
      const dbSettings = {};
      for (const row of rows) {
        let val = row.value;
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (!isNaN(val) && val !== '' && val !== null) val = Number(val);
        dbSettings[row.key] = val;
      }
      response.success(res, { ...defaults, ...dbSettings });
    } catch (dbErr) {
      logger.error('[DB_CRITICAL] 数据库读取设置失败，使用默认值:', dbErr.message);
      response.success(res, { ...defaults, _dbFallback: true, _dbErrorMessage: dbErr.message });
    }
  } catch (error) {
    logger.error('获取系统设置错误:', error);
    response.error(res, error.message);
  }
};

const updateSystemSettings = async (req, res) => {
  try {
    const settings = req.body;
    const { SystemSettings } = require('../models');

    const booleanKeys = ['registerEnabled', 'registerNeedPhone', 'registerNeedRealName',
      'reviewContentEnabled', 'giftEnabled', 'voiceChatEnabled', 'videoChatEnabled',
      'shareEnabled', 'shareRewardEnabled', 'withdrawAutoApprove'];

    for (const [key, value] of Object.entries(settings)) {
      let val = String(value);
      if (booleanKeys.includes(key)) {
        val = value === true || value === 'true' ? 'true' : 'false';
      }
      await SystemSettings.upsert({ key, value: val, group: 'system' });
    }

    response.success(res, settings, '系统设置保存成功');
  } catch (error) {
    logger.error('更新系统设置错误:', error);
    response.error(res, error.message);
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const todayStart = Math.floor(new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() / 1000);
    
    const totalUsers = await User.count();
    const todayUsers = await User.count({ where: { create_time: { [Op.gte]: todayStart } } });
    
    const totalOrders = await GameOrder.count();
    const todayOrders = await GameOrder.count({ where: { create_time: { [Op.gte]: todayStart } } });
    
    const totalWithdraws = await Withdraw.sum('money') || 0;
    const pendingWithdraws = await Withdraw.count({ where: { is_check: 0 } });
    
    const totalGifts = await GiftLog.sum('totalmoney') || 0;
    const totalPosts = await Post.count();
    
    response.success(res, {
      totalUsers: totalUsers || 0,
      todayUsers: todayUsers || 0,
      totalOrders: totalOrders || 0,
      todayOrders: todayOrders || 0,
      totalWithdraws: parseFloat(totalWithdraws) || 0,
      pendingWithdraws: pendingWithdraws || 0,
      totalGifts: parseFloat(totalGifts) || 0,
      totalPosts: totalPosts || 0
    });
  } catch (error) {
    logger.error('获取仪表板统计错误:', error);
    return response.dbError(res, '获取仪表板统计', error.message);
  }
};

// 财务管理相关函数
const getFinanceStats = async (req, res) => {
  try {
    const sequelize = require('../config/mysql');
    const todayStart = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime() / 1000);
    const [totalRecharge, todayRecharge, rechargeCount, withdrawMoney, withdrawCount, pendingWithdraw, totalGift, totalOrder, totalVip, totalCard] = await Promise.all([
      OrderChong.sum('amount', { where: { status: 1 } }),
      OrderChong.sum('amount', { where: { status: 1, pay_time: { [Op.gte]: todayStart } } }),
      OrderChong.count({ where: { status: 1 } }),
      Withdraw.sum('amount', { where: { status: 1 } }),
      Withdraw.count({ where: { status: 1 } }),
      Withdraw.count({ where: { status: 0 } }),
      sequelize.query("SELECT COALESCE(SUM(totalmoney),0) AS v FROM xn_gift_log", { type: sequelize.QueryTypes.SELECT }).then(r => r[0].v).catch(err => { logger.error('财务统计-礼物汇总查询失败:', err.message); return 0; }),
      GameOrder.sum('amount'),
      sequelize.query("SELECT COALESCE(SUM(amount),0) AS v FROM xn_vip_order WHERE status = 1", { type: sequelize.QueryTypes.SELECT }).then(r => r[0].v).catch(err => { logger.error('财务统计-VIP汇总查询失败:', err.message); return 0; }),
      sequelize.query("SELECT COALESCE(SUM(value),0) AS v FROM xn_card WHERE status = 1", { type: sequelize.QueryTypes.SELECT }).then(r => r[0].v).catch(err => { logger.error('财务统计-卡密汇总查询失败:', err.message); return 0; })
    ]);

    response.success(res, {
      totalRecharge: parseFloat(totalRecharge) || 0,
      todayRecharge: parseFloat(todayRecharge) || 0,
      rechargeCount: rechargeCount || 0,
      totalWithdraw: parseFloat(withdrawMoney) || 0,
      withdrawCount: withdrawCount || 0,
      pendingWithdraw: pendingWithdraw || 0,
      totalGift: parseFloat(totalGift) || 0,
      totalOrder: parseFloat(totalOrder) || 0,
      totalVip: parseFloat(totalVip) || 0,
      totalCard: parseFloat(totalCard) || 0
    });
  } catch (error) {
    logger.error('获取财务统计错误:', error);
    return response.dbError(res, '获取财务统计', error.message);
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
    response.error(res, error.message);
  }
};

const getVirtualUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await virtualUserService.getVirtualUserById(parseInt(id));
    response.success(res, result);
  } catch (error) {
    logger.error(`获取虚拟用户详情失败: ${error.message}`);
    response.notFound(res, error.message);
  }
};

const createVirtualUser = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.name) {
      return response.badRequest(res, '姓名不能为空');
    }
    const result = await virtualUserService.createVirtualUser(data);
    response.created(res, result, '虚拟用户创建成功');
  } catch (error) {
    logger.error(`创建虚拟用户失败: ${error.message}`);
    response.unprocessableEntity(res, error.message);
  }
};

const updateVirtualUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await virtualUserService.updateVirtualUser(parseInt(id), req.body);
    response.success(res, result, '虚拟用户更新成功');
  } catch (error) {
    logger.error(`更新虚拟用户失败: ${error.message}`);
    response.unprocessableEntity(res, error.message);
  }
};

const deleteVirtualUser = async (req, res) => {
  try {
    const { id } = req.params;
    await virtualUserService.deleteVirtualUser(parseInt(id));
    response.success(res, {}, '虚拟用户删除成功');
  } catch (error) {
    logger.error(`删除虚拟用户失败: ${error.message}`);
    response.notFound(res, error.message);
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
    response.notFound(res, error.message);
  }
};

const getVirtualUserChatHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20, type, userId } = req.query;
    const offset = (page - 1) * pageSize;

    const where = { virtual_user_id: parseInt(id) };
    if (type !== undefined && type !== '') {
      where.type = parseInt(type);
    }
    if (userId !== undefined && userId !== '') {
      where.user_id = parseInt(userId);
    }

    const { count, rows } = await VirtualChatHistory.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['create_time', 'DESC']]
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
    response.error(res, error.message);
  }
};

// 礼物管理相关函数
const { Gift } = require('../models');

const getGiftList = async (req, res) => {
  try {
    const { Gift } = require('../models');
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
    const { toFullUrl } = require('../utils/url');
    const list = rows.map(g => {
      const d = g.toJSON();
      d.image = toFullUrl(d.image);
      d.svga = toFullUrl(d.svga);
      return d;
    });
    response.success(res, {
      list,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count,
        totalPages
      }
    });
  } catch (error) {
    logger.error(`获取礼物列表失败: ${error.message}`);
    response.error(res, error.message);
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
    response.error(res, error.message);
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
      type: parseInt(type) || 0,
      is_vip: parseInt(is_vip) || 0,
      tian: parseInt(tian) || 0,
      status: status !== undefined ? parseInt(status) : 1,
      sort: parseInt(sort) || 0
    });
    
    response.created(res, gift, '礼物创建成功');
  } catch (error) {
    logger.error(`创建礼物失败: ${error.message}`);
    response.unprocessableEntity(res, error.message);
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
    response.unprocessableEntity(res, error.message);
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
    response.error(res, error.message);
  }
};

// ==================== 陪玩师申请管理 ====================
// 已对接 CompanionProfile / xn_companion_profile 数据表

const getCompanionApplicationList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, status } = req.query;
    const where = {};
    if (status !== undefined && status !== '') where.status = parseInt(status);

    let queryOptions = {
      where,
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      limit: parseInt(pageSize),
      order: [['create_time', 'DESC']]
    };

    if (keyword) {
      const { Op } = require('sequelize');
      where.tags = { [Op.like]: `%${keyword}%` };
    }

    try {
      const { count, rows } = await CompanionProfile.findAndCountAll(queryOptions);
      const list = rows.map(cp => ({
        id: cp.id,
        userId: cp.user_id,
        gameId: cp.game_id,
        price: cp.price ? parseFloat(cp.price) : 0,
        description: cp.description || '',
        tags: cp.tags || '',
        voiceIntro: cp.voice_intro || '',
        status: cp.status,
        approveTime: cp.approve_time,
        rejectReason: cp.reject_reason || '',
        createTime: cp.create_time ? cp.create_time * 1000 : Date.now()
      }));

      response.success(res, {
        list,
        pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total: count, totalPages: Math.ceil(count / parseInt(pageSize)) }
      });
    } catch (dbErr) {
      logger.error('[DB] CompanionProfile 查询失败:', dbErr.message);
      return dbErrorResponse(res, '获取陪玩师申请列表', dbErr);
    }
  } catch (error) {
    logger.error('获取服务申请列表错误:', error);
    response.error(res, error.message);
  }
};

const getCompanionApplicationDetail = async (req, res) => {
  try {
    const cp = await CompanionProfile.findByPk(parseInt(req.params.id));
    if (!cp) return response.notFound(res, '申请不存在');

    response.success(res, {
      id: cp.id,
      userId: cp.user_id,
      gameId: cp.game_id,
      price: cp.price ? parseFloat(cp.price) : 0,
      description: cp.description || '',
      tags: cp.tags || '',
      voiceIntro: cp.voice_intro || '',
      status: cp.status,
      approveTime: cp.approve_time,
      rejectReason: cp.reject_reason || '',
      createTime: cp.create_time ? cp.create_time * 1000 : Date.now()
    });
  } catch (error) {
    logger.error('获取服务申请详情错误:', error);
    response.error(res, error.message);
  }
};

const approveCompanionApplication = async (req, res) => {
  try {
    const cp = await CompanionProfile.findByPk(parseInt(req.params.id));
    if (!cp) return response.notFound(res, '申请不存在');

    await cp.update({
      status: 1,
      approve_time: Math.floor(Date.now() / 1000)
    });

    response.success(res, {}, '审核通过成功');
  } catch (error) {
    logger.error('审核通过错误:', error);
    response.error(res, error.message);
  }
};

const rejectCompanionApplication = async (req, res) => {
  try {
    const cp = await CompanionProfile.findByPk(parseInt(req.params.id));
    if (!cp) return response.notFound(res, '申请不存在');

    const { reason } = req.body;
    await cp.update({
      status: 2,
      reject_reason: reason || '',
      approve_time: Math.floor(Date.now() / 1000)
    });

    response.success(res, {}, '审核拒绝成功');
  } catch (error) {
    logger.error('审核拒绝错误:', error);
    response.error(res, error.message);
  }
};

const deleteCompanionApplication = async (req, res) => {
  try {
    const cp = await CompanionProfile.findByPk(parseInt(req.params.id));
    if (!cp) return response.notFound(res, '申请不存在');

    await cp.destroy();
    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('删除服务申请错误:', error);
    response.error(res, error.message);
  }
};

// ==================== 卡密管理 ====================
// 注意: 卡密功能已对接 Card 模型数据库

const { Card } = require('../models');


const getCardList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;

    const { count, rows } = await Card.findAndCountAll({
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      limit: parseInt(pageSize),
      order: [['create_time', 'DESC']]
    });
    
    response.success(res, {
      list: rows.map(c => ({
        id: c.id,
        cardNo: c.card_no,
        cardPwd: c.card_password,
        cardKey: (c.card_no || '') + (c.card_password || ''),
        faceValue: parseFloat(c.value) || 0,
        coinAmount: parseInt(c.coin_amount) || 0,
        type: c.type || 1,
        status: c.status,
        useTime: c.use_time || 0,
        useUserId: c.use_user_id || 0,
        adminId: c.admin_id || 0,
        adminName: c.admin_name || '',
        createTime: c.create_time || 0
      })),
      pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total: count }
    });
  } catch (error) {
    logger.error('获取卡密列表错误:', error);
    return dbErrorResponse(res, '获取卡密列表', error);
  }
};

const createCard = async (req, res) => {
  try {
    const { faceValue, coinAmount, count = 1, adminId = 0, adminName = '' } = req.body;
    if (!faceValue || faceValue <= 0) return response.error(res, '请输入有效面值');
    const genCount = Math.min(parseInt(count) || 1, 100);

    const generateCardNo = () => {
      const ts = Date.now().toString(36).toUpperCase();
      const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `DK${ts}${rand}`;
    };
    const generateCardPwd = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let pwd = '';
      for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
      return pwd;
    };
    const generateCardKey = () => {
      let key = '';
      for (let i = 0; i < 25; i++) key += Math.floor(Math.random() * 10);
      return key;
    };

    const createdCards = [];
    const now = Math.floor(Date.now() / 1000);

    for (let i = 0; i < genCount; i++) {
      const cardNo = generateCardNo();
      const cardPwd = generateCardPwd();
      const card = await Card.create({
        card_no: cardNo,
        card_password: cardPwd,
        value: parseFloat(faceValue),
        coin_amount: parseInt(coinAmount) || 0,
        type: 1,
        status: 0,
        admin_id: adminId ? parseInt(adminId) : null,
        admin_name: adminName || null,
        create_time: now
      });
      createdCards.push({
        id: card.id,
        cardKey: cardNo + cardPwd,
        cardNo: card.card_no,
        cardPwd: card.card_password,
        faceValue: parseFloat(card.value) || parseFloat(faceValue),
        coinAmount: parseInt(coinAmount) || 0
      });
    }

    response.success(res, { list: createdCards }, `成功生成 ${genCount} 张卡密`);
  } catch (error) {
    logger.error('生成卡密错误:', error);
    response.error(res, `生成卡密失败: ${error.message}`);
  }
};

const deleteCard = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await Card.findByPk(parseInt(id));
    if (!card) return response.notFound(res, '卡密不存在');
    if (card.status !== 0) return response.badRequest(res, '只能删除未使用的卡密');
    await card.destroy();

    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('删除卡密错误:', error);
    response.error(res, `删除卡密失败: ${error.message}`);
  }
};

// 批量清除卡密：支持按状态 / 负责管理员 / 创建时间 筛选
const clearCards = async (req, res) => {
  try {
    const { status, adminId, beforeTime } = req.body;
    const where = {};

    // status: 0 未使用 / 1 已使用 / 2 已过期；不传或为 -1/空 表示全部
    if (status !== undefined && status !== null && status !== '' && parseInt(status) !== -1) {
      where.status = parseInt(status);
    }
    if (adminId && parseInt(adminId) !== 0) {
      where.admin_id = parseInt(adminId);
    }
    if (beforeTime) {
      where.create_time = { [Op.lt]: parseInt(beforeTime) };
    }

    const count = await Card.count({ where });
    if (!count) return response.success(res, { count: 0 }, '没有符合条件的卡密可清除');

    await Card.destroy({ where });
    response.success(res, { count }, `已清除 ${count} 张卡密`);
  } catch (error) {
    logger.error('清除卡密错误:', error);
    response.error(res, `清除卡密失败: ${error.message}`);
  }
};

// 卡密分配用：返回可选的负责管理员列表（含管理员账号与角色账号）
const getCardAdminOptions = async (req, res) => {
  try {
    const [admins, roles] = await Promise.all([
      Admin.findAll({
        where: { status: 1 },
        attributes: ['id', 'username', 'nickname'],
        order: [['id', 'ASC']]
      }),
      AdminRole.findAll({
        where: {
          status: 1,
          username: { [Op.ne]: null, [Op.ne]: '' }
        },
        attributes: ['id', 'username', 'name'],
        order: [['id', 'ASC']]
      })
    ]);
    const list = [];
    admins.forEach(a => {
      list.push({ id: a.id, username: a.username, name: a.nickname || a.username, type: 'admin' });
    });
    roles.forEach(r => {
      // 角色账号 id 加偏移（100000+），避免与管理员账号 id 冲突
      list.push({ id: 100000 + r.id, username: r.username, name: r.name || r.username, type: 'role' });
    });
    response.success(res, { list });
  } catch (error) {
    logger.error('获取卡密管理员选项错误:', error);
    response.error(res, `获取管理员列表失败: ${error.message}`);
  }
};

const getCardAdminStats = async (req, res) => {
  try {
    // 1. 按管理员汇总卡密数量
    const adminRows = await Card.findAll({
      attributes: [
        'admin_id',
        [fn('MAX', col('admin_name')), 'admin_name'],
        [fn('COUNT', col('id')), 'total'],
        [literal('SUM(status = 0)'), 'unused'],
        [literal('SUM(status = 1)'), 'used'],
        [literal('SUM(status = 2)'), 'expired']
      ],
      where: { admin_id: { [Op.ne]: null } },
      group: ['admin_id'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      raw: true
    });

    // 2. 按管理员 + 面值/金币数 + 状态分组统计类型
    const typeRows = await Card.findAll({
      attributes: [
        'admin_id',
        'value',
        'coin_amount',
        'status',
        [fn('COUNT', col('id')), 'cnt']
      ],
      where: { admin_id: { [Op.ne]: null } },
      group: ['admin_id', 'value', 'coin_amount', 'status'],
      raw: true
    });

    const typeMap = {};
    (typeRows || []).forEach(r => {
      const aKey = String(r.admin_id);
      if (!typeMap[aKey]) typeMap[aKey] = {};
      const tKey = `${r.value}|${r.coin_amount}`;
      if (!typeMap[aKey][tKey]) {
        typeMap[aKey][tKey] = { faceValue: parseFloat(r.value) || 0, coinAmount: parseInt(r.coin_amount) || 0, total: 0, unused: 0, used: 0, expired: 0 };
      }
      const cnt = parseInt(r.cnt) || 0;
      const item = typeMap[aKey][tKey];
      item.total += cnt;
      const st = parseInt(r.status);
      if (st === 0) item.unused += cnt;
      else if (st === 1) item.used += cnt;
      else if (st === 2) item.expired += cnt;
    });

    // 3. 关联 xn_admin 表获取账号 username 与昵称 nickname
    const adminIds = (adminRows || []).map(r => r.admin_id).filter(v => v !== null && v !== undefined);
    const adminMap = {};
    if (adminIds.length) {
      const admins = await Admin.findAll({ where: { id: { [Op.in]: adminIds } }, attributes: ['id', 'username', 'nickname'], raw: true });
      (admins || []).forEach(a => { adminMap[String(a.id)] = { username: a.username || '', nickname: a.nickname || '' }; });
    }

    const list = (adminRows || []).map(r => ({
      adminId: r.admin_id,
      adminName: r.admin_name || '',
      username: (adminMap[String(r.admin_id)] || {}).username || '',
      nickname: (adminMap[String(r.admin_id)] || {}).nickname || '',
      total: parseInt(r.total) || 0,
      unused: parseInt(r.unused) || 0,
      used: parseInt(r.used) || 0,
      expired: parseInt(r.expired) || 0,
      types: Object.values(typeMap[String(r.admin_id)] || {}).sort((a, b) => a.faceValue - b.faceValue)
    }));

    response.success(res, { list });
  } catch (error) {
    logger.error('获取卡密管理员统计错误:', error);
    return dbErrorResponse(res, '获取卡密管理员统计', error);
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
  getReportList,
  getReportDetail,
  handleReport,
  deleteReport,
  getBannerList,
  getBannerDetail,
  createBanner,
  updateBanner,
  updateBannerStatus,
  deleteBanner,
  getSplashList,
  getSplashDetail,
  createSplash,
  updateSplash,
  updateSplashStatus,
  deleteSplash,
  getVipPackageList,
  getVipPackageDetail,
  createVipPackage,
  updateVipPackage,
  updateVipPackageStatus,
  deleteVipPackage,
  getRechargePackageList,
  getRechargePackageDetail,
  createRechargePackage,
  updateRechargePackage,
  updateRechargePackageStatus,
  deleteRechargePackage,
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
  getGameList,
  getGameDetail,
  createGame,
  updateGame,
  updateGameStatus,
  deleteGame,
  getSystemSettings,
  updateSystemSettings,
  getDashboardStats,
  getFinanceStats,
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
  getCardList,
  createCard,
  deleteCard,
  clearCards,
  getCardAdminOptions,
  getCardAdminStats
};