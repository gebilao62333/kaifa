const { User, GameOrder, Withdraw, GiftLog, Post, VipPackage, Banner, CompanionProfile, CustomerService, ChatLog, Report, Recommend, Notification } = require('../models');
const { signToken } = require('../config/jwt');
const response = require('../utils/response');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// 全局Mock用户数据
const mockUsers = [
  { id: 1, nickname: '游戏达人小王', phone: '138****1234', avatar: 'https://picsum.photos/100/100?random=1', gender: 1, status: 0, create_time: Date.now() - 86400000, vip: 1, vip_lv: 2, money: 5000, fans_num: 120, sex: 1, city: '北京', dec: '喜欢玩各种游戏', gift_money: 200 },
  { id: 2, nickname: '玩家小美', phone: '139****5678', avatar: 'https://picsum.photos/100/100?random=2', gender: 0, status: 0, create_time: Date.now() - 172800000, vip: 0, vip_lv: 0, money: 1200, fans_num: 35, sex: 0, city: '上海', dec: '', gift_money: 50 },
  { id: 3, nickname: '新手玩家', phone: '137****9012', avatar: 'https://picsum.photos/100/100?random=3', gender: 1, status: 1, create_time: Date.now() - 259200000, vip: 0, vip_lv: 0, money: 0, fans_num: 0, sex: 1, city: '广州', dec: '刚注册的用户', gift_money: 0 },
  { id: 4, nickname: '游戏爱好者', phone: '136****3456', avatar: 'https://picsum.photos/100/100?random=4', gender: 1, status: 0, create_time: Date.now() - 345600000, vip: 0, vip_lv: 0, money: 800, fans_num: 15, sex: 0, city: '深圳', dec: '新人报道', gift_money: 100 },
  { id: 5, nickname: '资深玩家', phone: '135****7890', avatar: 'https://picsum.photos/100/100?random=5', gender: 1, status: 0, create_time: Date.now() - 432000000, vip: 1, vip_lv: 3, money: 15000, fans_num: 500, sex: 1, city: '杭州', dec: '资深游戏玩家', gift_money: 500 },
  { id: 6, nickname: '电竞小白', phone: '134****1111', avatar: 'https://picsum.photos/100/100?random=6', gender: 1, status: 0, create_time: Date.now() - 518400000, vip: 0, vip_lv: 0, money: 500, fans_num: 8, sex: 1, city: '成都', dec: '喜欢打电竞', gift_money: 30 },
  { id: 7, nickname: '萌妹子玩家', phone: '133****2222', avatar: 'https://picsum.photos/100/100?random=7', gender: 0, status: 0, create_time: Date.now() - 604800000, vip: 1, vip_lv: 1, money: 2000, fans_num: 200, sex: 0, city: '武汉', dec: '声音超好听', gift_money: 300 },
  { id: 8, nickname: '王者荣耀大神', phone: '132****3333', avatar: 'https://picsum.photos/100/100?random=8', gender: 1, status: 0, create_time: Date.now() - 691200000, vip: 1, vip_lv: 2, money: 8000, fans_num: 350, sex: 1, city: '南京', dec: '王者百星选手', gift_money: 800 },
  { id: 9, nickname: '和平精英玩家', phone: '131****4444', avatar: 'https://picsum.photos/100/100?random=9', gender: 1, status: 0, create_time: Date.now() - 777600000, vip: 0, vip_lv: 0, money: 300, fans_num: 25, sex: 1, city: '重庆', dec: '和平精英吃鸡', gift_money: 20 },
  { id: 10, nickname: '原神旅行者', phone: '130****5555', avatar: 'https://picsum.photos/100/100?random=10', gender: 0, status: 0, create_time: Date.now() - 864000000, vip: 1, vip_lv: 3, money: 20000, fans_num: 800, sex: 0, city: '西安', dec: '原神满命玩家', gift_money: 2000 },
  { id: 11, nickname: '永劫无间高手', phone: '129****6666', avatar: 'https://picsum.photos/100/100?random=11', gender: 1, status: 1, create_time: Date.now() - 950400000, vip: 0, vip_lv: 0, money: 100, fans_num: 5, sex: 1, city: '苏州', dec: '练刀中', gift_money: 10 },
  { id: 12, nickname: '英雄联盟钻石', phone: '128****7777', avatar: 'https://picsum.photos/100/100?random=12', gender: 1, status: 0, create_time: Date.now() - 1036800000, vip: 1, vip_lv: 2, money: 6000, fans_num: 280, sex: 1, city: '天津', dec: 'LOL钻石段位', gift_money: 600 },
  { id: 13, nickname: '休闲玩家小雨', phone: '127****8888', avatar: 'https://picsum.photos/100/100?random=13', gender: 0, status: 0, create_time: Date.now() - 1123200000, vip: 0, vip_lv: 0, money: 200, fans_num: 12, sex: 0, city: '长沙', dec: '玩游戏开心就好', gift_money: 40 },
  { id: 14, nickname: '陪玩师小乐', phone: '126****9999', avatar: 'https://picsum.photos/100/100?random=14', gender: 0, status: 0, create_time: Date.now() - 1209600000, vip: 1, vip_lv: 1, money: 3000, fans_num: 150, sex: 0, city: '青岛', dec: '专业陪玩', gift_money: 400 },
  { id: 15, nickname: '吃鸡大神', phone: '125****0000', avatar: 'https://picsum.photos/100/100?random=15', gender: 1, status: 0, create_time: Date.now() - 1296000000, vip: 1, vip_lv: 3, money: 12000, fans_num: 450, sex: 1, city: '大连', dec: '场均10杀', gift_money: 1200 },
  { id: 16, nickname: '游戏小萌新', phone: '124****1212', avatar: 'https://picsum.photos/100/100?random=16', gender: 0, status: 0, create_time: Date.now() - 1382400000, vip: 0, vip_lv: 0, money: 50, fans_num: 2, sex: 0, city: '厦门', dec: '刚玩游戏，求带', gift_money: 5 },
  { id: 17, nickname: '王者荣耀主播', phone: '123****3434', avatar: 'https://picsum.photos/100/100?random=17', gender: 1, status: 0, create_time: Date.now() - 1468800000, vip: 1, vip_lv: 3, money: 50000, fans_num: 2000, sex: 1, city: '广州', dec: '王者荣耀主播', gift_money: 5000 },
  { id: 18, nickname: '休闲斗地主', phone: '122****5656', avatar: 'https://picsum.photos/100/100?random=18', gender: 1, status: 1, create_time: Date.now() - 1555200000, vip: 0, vip_lv: 0, money: 0, fans_num: 0, sex: 1, city: '福州', dec: '喜欢玩斗地主', gift_money: 0 },
  { id: 19, nickname: '原神萌新', phone: '121****7878', avatar: 'https://picsum.photos/100/100?random=19', gender: 0, status: 0, create_time: Date.now() - 1641600000, vip: 0, vip_lv: 0, money: 150, fans_num: 8, sex: 0, city: '东莞', dec: '原神新手玩家', gift_money: 15 },
  { id: 20, nickname: '电竞少女', phone: '120****9090', avatar: 'https://picsum.photos/100/100?random=20', gender: 0, status: 0, create_time: Date.now() - 1728000000, vip: 1, vip_lv: 2, money: 4000, fans_num: 180, sex: 0, city: '宁波', dec: '电竞少女一枚', gift_money: 400 }
];

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
    
    let users = [];
    let total = 0;
    
    try {
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
      if (status !== undefined) where.status = parseInt(status);
      
      const result = await User.findAndCountAll({
        where,
        offset,
        limit: parseInt(pageSize),
        order: [['create_time', 'DESC']]
      });
      
      users = result.rows || [];
      total = result.count || 0;
    } catch (dbError) {
      console.warn('数据库查询失败，使用Mock数据:', dbError.message);
      let filteredUsers = [...mockUsers];
      if (searchKeyword) {
        filteredUsers = filteredUsers.filter(u => 
          u.nickname.includes(searchKeyword) || u.phone.includes(searchKeyword)
        );
      } else {
        if (nickname) {
          filteredUsers = filteredUsers.filter(u => u.nickname.includes(nickname));
        }
        if (phone) {
          filteredUsers = filteredUsers.filter(u => u.phone.includes(phone));
        }
      }
      if (status !== undefined && status !== '') {
        filteredUsers = filteredUsers.filter(u => u.status === parseInt(status));
      }
      
      // 按创建时间倒序排序
      filteredUsers.sort((a, b) => b.create_time - a.create_time);
      
      users = filteredUsers.slice(offset, offset + parseInt(pageSize));
      total = filteredUsers.length;
    }
    
    const result = users.map(user => ({
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
    let user = null;
    
    try {
      user = await User.findByPk(id);
    } catch (dbError) {
      console.warn('数据库查询失败，使用Mock数据:', dbError.message);
      user = mockUsers.find(u => u.id === parseInt(id));
    }
    
    if (!user) {
      return response.error(res, '用户不存在');
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
    const { nickname, phone, sex, city, status, vipLv, money, giftMoney, dec, username, email } = req.body;
    
    let user = null;
    let dbErrorOccurred = false;
    
    try {
      user = await User.findByPk(id);
    } catch (dbError) {
      dbErrorOccurred = true;
      console.warn('数据库查询失败，使用Mock数据:', dbError.message);
      const userIndex = mockUsers.findIndex(u => u.id === parseInt(id));
      if (userIndex !== -1) {
        user = mockUsers[userIndex];
      }
    }
    
    if (!user) {
      return response.error(res, '用户不存在');
    }
    
    if (dbErrorOccurred) {
      const userIndex = mockUsers.findIndex(u => u.id === parseInt(id));
      if (nickname !== undefined) mockUsers[userIndex].nickname = nickname;
      if (username !== undefined) mockUsers[userIndex].username = username;
      if (phone !== undefined) mockUsers[userIndex].phone = phone;
      if (email !== undefined) mockUsers[userIndex].email = email;
      if (sex !== undefined) mockUsers[userIndex].sex = parseInt(sex);
      if (city !== undefined) mockUsers[userIndex].city = city;
      if (status !== undefined) mockUsers[userIndex].status = parseInt(status);
      if (vipLv !== undefined) mockUsers[userIndex].vip_lv = parseInt(vipLv);
      if (money !== undefined) mockUsers[userIndex].money = parseFloat(money);
      if (giftMoney !== undefined) mockUsers[userIndex].gift_money = parseFloat(giftMoney);
      if (dec !== undefined) mockUsers[userIndex].dec = dec;
    } else {
      const updateData = {};
      if (nickname !== undefined) updateData.nickname = nickname;
      if (username !== undefined) updateData.username = username;
      if (phone !== undefined) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;
      if (sex !== undefined) updateData.sex = parseInt(sex);
      if (city !== undefined) updateData.city = city;
      if (status !== undefined) updateData.status = parseInt(status);
      if (vipLv !== undefined) updateData.vip_lv = parseInt(vipLv);
      if (money !== undefined) updateData.money = parseFloat(money);
      if (giftMoney !== undefined) updateData.gift_money = parseFloat(giftMoney);
      if (dec !== undefined) updateData.dec = dec;
      
      await user.update(updateData);
    }
    
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
    
    let user = null;
    let dbErrorOccurred = false;
    
    try {
      user = await User.findByPk(id);
    } catch (dbError) {
      dbErrorOccurred = true;
      console.warn('数据库查询失败，使用Mock数据:', dbError.message);
      const userIndex = mockUsers.findIndex(u => u.id === parseInt(id));
      if (userIndex !== -1) {
        user = mockUsers[userIndex];
      }
    }
    
    if (!user) {
      return response.error(res, '用户不存在');
    }
    
    let newStatus = parseInt(status);
    
    if (dbErrorOccurred) {
      const userIndex = mockUsers.findIndex(u => u.id === parseInt(id));
      mockUsers[userIndex].status = newStatus;
    } else {
      await user.update({ status: newStatus });
    }
    
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
    let user = null;
    let dbErrorOccurred = false;
    
    try {
      user = await User.findByPk(id);
    } catch (dbError) {
      dbErrorOccurred = true;
      console.warn('数据库查询失败，使用Mock数据:', dbError.message);
      const userIndex = mockUsers.findIndex(u => u.id === parseInt(id));
      if (userIndex !== -1) {
        user = mockUsers[userIndex];
      }
    }
    
    if (!user) {
      return response.error(res, '用户不存在');
    }
    
    if (dbErrorOccurred) {
      const userIndex = mockUsers.findIndex(u => u.id === parseInt(id));
      mockUsers.splice(userIndex, 1);
    } else {
      await user.destroy();
    }
    
    response.success(res, null, '删除成功');
  } catch (error) {
    logger.error('删除用户错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const createUser = async (req, res) => {
  try {
    const { nickname, phone, sex, city, vipLv, money, giftMoney, dec, username, email } = req.body;
    
    let newUser = null;
    
    try {
      newUser = await User.create({
        nickname: nickname || '新用户',
        username: username || '',
        phone: phone || '',
        email: email || '',
        sex: parseInt(sex) || 0,
        city: city || '',
        vip_lv: parseInt(vipLv) || 0,
        money: parseFloat(money) || 0,
        gift_money: parseFloat(giftMoney) || 0,
        dec: dec || ''
      });
    } catch (dbError) {
      console.warn('数据库查询失败，使用Mock数据:', dbError.message);
      const maxId = mockUsers.length > 0 ? Math.max(...mockUsers.map(u => u.id)) : 0;
      newUser = {
        id: maxId + 1,
        nickname: nickname || '新用户',
        username: username || '',
        phone: phone || '',
        email: email || '',
        avatar: '',
        sex: parseInt(sex) || 0,
        gender: parseInt(sex) || 0,
        city: city || '',
        vip_lv: parseInt(vipLv) || 0,
        vip: parseInt(vipLv) > 0 ? 1 : 0,
        money: parseFloat(money) || 0,
        gift_money: parseFloat(giftMoney) || 0,
        lv: 1,
        dec: dec || '',
        status: 0,
        fans_num: 0,
        create_time: Date.now()
      };
      mockUsers.push(newUser);
    }
    
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
    
    try {
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
    } catch (dbError) {
      console.warn('数据库查询失败，使用Mock数据:', dbError.message);
      const mockOrders = [
        { id: 1, order_no: 'ORD202605230001', user_id: 1, target_user_id: 2, game_name: '王者荣耀', price: 50, total_price: 100, num: 2, status: 0, type: 0, create_time: Math.floor(Date.now() / 1000) - 3600 },
        { id: 2, order_no: 'ORD202605230002', user_id: 2, target_user_id: 3, game_name: '英雄联盟', price: 75, total_price: 150, num: 2, status: 2, type: 0, create_time: Math.floor(Date.now() / 1000) - 7200 },
        { id: 3, order_no: 'ORD202605230003', user_id: 3, target_user_id: 4, game_name: '王者荣耀', price: 100, total_price: 200, num: 2, status: 3, type: 1, create_time: Math.floor(Date.now() / 1000) - 10800 },
        { id: 4, order_no: 'ORD202605230004', user_id: 4, target_user_id: 5, game_name: '绝地求生', price: 60, total_price: 120, num: 2, status: 4, type: 2, create_time: Math.floor(Date.now() / 1000) - 14400 },
        { id: 5, order_no: 'ORD202605230005', user_id: 5, target_user_id: 1, game_name: '英雄联盟', price: 90, total_price: 180, num: 2, status: 0, type: 0, create_time: Math.floor(Date.now() / 1000) - 18000 }
      ];
      
      orders = mockOrders.slice(offset, offset + parseInt(pageSize));
      total = mockOrders.length;
    }
    
    const typeMap = { 0: '线上服务', 1: '线下服务', 2: '预约服务' };
    
    const result = orders.map(order => ({
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
      list: result,
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
      return response.error(res, '订单不存在');
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
      return response.error(res, '订单不存在');
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
      return response.error(res, '订单不存在');
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
    
    try {
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
    } catch (dbError) {
      console.warn('数据库查询失败，使用Mock数据:', dbError.message);
      const mockWithdraws = [
        { id: 1, user_id: 1, amount: 500, type: 'alipay', account: '138****1234', status: 'pending', remark: '', create_time: Date.now() - 3600000, handle_time: null },
        { id: 2, user_id: 2, amount: 1200, type: 'wechat', account: '139****5678', status: 'pending', remark: '', create_time: Date.now() - 7200000, handle_time: null },
        { id: 3, user_id: 3, amount: 800, type: 'alipay', account: '137****9012', status: 'approved', remark: '审核通过', create_time: Date.now() - 10800000, handle_time: Date.now() - 3600000 },
        { id: 4, user_id: 4, amount: 2000, type: 'bank', account: '6222****8888', status: 'pending', remark: '', create_time: Date.now() - 14400000, handle_time: null },
        { id: 5, user_id: 5, amount: 300, type: 'wechat', account: '135****7890', status: 'rejected', remark: '账户信息错误', create_time: Date.now() - 18000000, handle_time: Date.now() - 7200000 }
      ];
      
      withdraws = mockWithdraws.slice(offset, offset + parseInt(pageSize));
      total = mockWithdraws.length;
    }
    
    const result = withdraws.map(w => ({
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
      list: result,
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
      return response.error(res, '提现记录不存在');
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
      return response.error(res, '提现记录不存在');
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
      return response.error(res, '提现记录不存在');
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
      return response.error(res, '提现记录不存在');
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
    
    try {
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
      
    } catch (dbError) {
      console.warn('数据库查询失败，使用Mock数据:', dbError.message);
      const mockPosts = [
        { id: 1, user_id: 1, content: '今天和陪玩师一起打王者荣耀，太开心了！', images: 'https://picsum.photos/400/300?random=1', videos: '', thumb_num: 42, comment_num: 8, share_num: 5, type: 0, status: 1, is_private: 0, tag_id: 1, create_time: Math.floor(Date.now() / 1000) - 3600 },
        { id: 2, user_id: 2, content: '晒一下今天的游戏成果，吃鸡三连！', images: 'https://picsum.photos/400/300?random=2', videos: '', thumb_num: 28, comment_num: 5, share_num: 3, type: 0, status: 1, is_private: 0, tag_id: 2, create_time: Math.floor(Date.now() / 1000) - 7200 },
        { id: 3, user_id: 3, content: '有没有一起玩原神的小伙伴？周末可以组队！', images: '', videos: '', thumb_num: 15, comment_num: 12, share_num: 2, type: 0, status: 1, is_private: 0, tag_id: 3, create_time: Math.floor(Date.now() / 1000) - 10800 },
        { id: 4, user_id: 4, content: '今天又抽到了SSR，欧皇附体！', images: 'https://picsum.photos/400/300?random=4', videos: '', thumb_num: 56, comment_num: 20, share_num: 8, type: 1, status: 1, is_private: 0, tag_id: 1, create_time: Math.floor(Date.now() / 1000) - 14400 },
        { id: 5, user_id: 5, content: '深夜emo，有没有人聊聊天...', images: '', videos: '', thumb_num: 8, comment_num: 25, share_num: 0, type: 0, status: 0, is_private: 1, tag_id: 4, create_time: Math.floor(Date.now() / 1000) - 18000 },
      ];
      posts = mockPosts;
      total = mockPosts.length;
      
      // Mock筛选
      if (keyword) posts = posts.filter(p => p.content.includes(keyword));
      if (status !== undefined && status !== '') posts = posts.filter(p => p.status === parseInt(status));
      if (type !== undefined && type !== '') posts = posts.filter(p => p.type === parseInt(type));
      
      const orderDir = sortOrder === 'asc' ? 1 : -1;
      posts.sort((a, b) => {
        const f = sortField || 'create_time';
        return ((a[f] || 0) - (b[f] || 0)) * orderDir;
      });
      total = posts.length;
      posts = posts.slice(offset, offset + parseInt(pageSize));
      
      // Mock用户昵称
      const mockUserMap = { 1: '游戏达人小王', 2: '玩家小美', 3: '新手玩家', 4: '游戏爱好者', 5: '资深玩家' };
      posts.forEach(p => { userMap[p.user_id] = { nickname: mockUserMap[p.user_id] || `用户${p.user_id}`, avatar: '' }; });
    }
    
    const result = posts.map(post => ({
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
      list: result,
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
      return response.error(res, '帖子不存在');
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
      return response.error(res, '帖子不存在');
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
      return response.error(res, '帖子不存在');
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

// ===== 举报Mock数据（模块级缓存，支持状态变更） =====
const mockReports = [
  { id: 1, user_id: 101, reporter_nickname: '用户小明', reporter_avatar: '', target_type: 1, target_id: 201, target_user_id: 301, target_user_nickname: '广告发布者', target_user_avatar: '', target_content: '这是一个违规帖子内容，包含广告信息，严重影响社区氛围', reason: '垃圾广告', images: '', status: 'pending', handle_result: '', reject_reason: '', create_time: Math.floor(Date.now() / 1000) - 3600, handle_time: 0, handler_id: 0, handler_name: '' },
  { id: 2, user_id: 102, reporter_nickname: '用户小红', reporter_avatar: '', target_type: 2, target_id: 301, target_user_id: 302, target_user_nickname: '骚扰用户', target_user_avatar: '', target_content: '该用户频繁骚扰其他玩家，发送大量垃圾私信', reason: '恶意骚扰', images: '', status: 'pending', handle_result: '', reject_reason: '', create_time: Math.floor(Date.now() / 1000) - 7200, handle_time: 0, handler_id: 0, handler_name: '' },
  { id: 3, user_id: 103, reporter_nickname: '用户小刚', reporter_avatar: '', target_type: 1, target_id: 202, target_user_id: 303, target_user_nickname: '谩骂用户', target_user_avatar: '', target_content: '这是一条违规评论，包含侮辱性词汇，对他人人身攻击', reason: '侮辱谩骂', images: '', status: 'resolved', handle_result: '违规内容已删除', reject_reason: '', create_time: Math.floor(Date.now() / 1000) - 10800, handle_time: Math.floor(Date.now() / 1000) - 3600, handler_id: 1, handler_name: 'admin' },
  { id: 4, user_id: 104, reporter_nickname: '用户小丽', reporter_avatar: '', target_type: 3, target_id: 401, target_user_id: 304, target_user_nickname: '虚假信息用户', target_user_avatar: '', target_content: '用户个人资料中包含明显虚假的头衔和认证信息', reason: '虚假信息', images: '', status: 'rejected', handle_result: '', reject_reason: '经核实，该用户资料属实，未发现虚假信息，举报不成立', create_time: Math.floor(Date.now() / 1000) - 14400, handle_time: Math.floor(Date.now() / 1000) - 7200, handler_id: 1, handler_name: 'admin' },
  { id: 5, user_id: 105, reporter_nickname: '用户阿杰', reporter_avatar: '', target_type: 1, target_id: 203, target_user_id: 305, target_user_nickname: '欺诈用户', target_user_avatar: '', target_content: '该帖子内容涉及诱导付费欺诈行为，已有多人上当', reason: '欺诈行为', images: '', status: 'pending', handle_result: '', reject_reason: '', create_time: Math.floor(Date.now() / 1000) - 18000, handle_time: 0, handler_id: 0, handler_name: '' },
  { id: 6, user_id: 106, reporter_nickname: '用户大鹏', reporter_avatar: '', target_type: 1, target_id: 204, target_user_id: 306, target_user_nickname: '色情内容发布者', target_user_avatar: '', target_content: '帖子内容含有低俗色情图文信息', reason: '色情低俗', images: '', status: 'pending', handle_result: '', reject_reason: '', create_time: Math.floor(Date.now() / 1000) - 21600, handle_time: 0, handler_id: 0, handler_name: '' },
  { id: 7, user_id: 107, reporter_nickname: '用户小芳', reporter_avatar: '', target_type: 1, target_id: 205, target_user_id: 307, target_user_nickname: '违规用户A', target_user_avatar: '', target_content: '发布涉及政治敏感话题的讨论内容', reason: '政治敏感', images: '', status: 'resolved', handle_result: '帖子已下架，用户警告一次', reject_reason: '', create_time: Math.floor(Date.now() / 1000) - 28800, handle_time: Math.floor(Date.now() / 1000) - 14400, handler_id: 1, handler_name: 'admin' },
  { id: 8, user_id: 108, reporter_nickname: '用户老刘', reporter_avatar: '', target_type: 2, target_id: 302, target_user_id: 308, target_user_nickname: '恶意差评用户', target_user_avatar: '', target_content: '该用户通过恶意差评敲诈陪玩师索要退款', reason: '恶意差评', images: '', status: 'pending', handle_result: '', reject_reason: '', create_time: Math.floor(Date.now() / 1000) - 36000, handle_time: 0, handler_id: 0, handler_name: '' },
  { id: 9, user_id: 109, reporter_nickname: '用户小梅', reporter_avatar: '', target_type: 1, target_id: 206, target_user_id: 309, target_user_nickname: '刷屏用户', target_user_avatar: '', target_content: '连续发布多条无意义刷屏内容', reason: '刷屏灌水', images: '', status: 'rejected', handle_result: '', reject_reason: '用户发布的是活动打卡帖，属于正常行为，不予处理', create_time: Math.floor(Date.now() / 1000) - 43200, handle_time: Math.floor(Date.now() / 1000) - 21600, handler_id: 1, handler_name: 'admin' },
  { id: 10, user_id: 110, reporter_nickname: '用户阿强', reporter_avatar: '', target_type: 1, target_id: 207, target_user_id: 310, target_user_nickname: '侵权用户', target_user_avatar: '', target_content: '发布的图片侵犯他人肖像权', reason: '侵犯隐私', images: '', status: 'pending', handle_result: '', reject_reason: '', create_time: Math.floor(Date.now() / 1000) - 50400, handle_time: 0, handler_id: 0, handler_name: '' }
];

const getReportList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, reason, keyword, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * pageSize;

    let filtered = [...mockReports];
    
    // 多维筛选
    if (status && status !== '') {
      filtered = filtered.filter(r => r.status === status);
    }
    if (reason && reason !== '') {
      filtered = filtered.filter(r => r.reason === reason);
    }
    if (keyword && keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      filtered = filtered.filter(r => 
        r.target_content.toLowerCase().includes(kw) ||
        r.reason.toLowerCase().includes(kw) ||
        r.reporter_nickname.toLowerCase().includes(kw) ||
        r.target_user_nickname.toLowerCase().includes(kw)
      );
    }
    if (dateFrom) {
      const fromTs = Math.floor(new Date(dateFrom).getTime() / 1000);
      filtered = filtered.filter(r => r.create_time >= fromTs);
    }
    if (dateTo) {
      const toTs = Math.floor(new Date(dateTo + 'T23:59:59').getTime() / 1000);
      filtered = filtered.filter(r => r.create_time <= toTs);
    }

    const total = filtered.length;
    const list = filtered.slice(offset, offset + parseInt(pageSize));

    const result = list.map(r => ({
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
    logger.error('获取举报列表错误:', error);
    response.success(res, {
      list: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    });
  }
};

const getReportDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const report = mockReports.find(r => r.id === parseInt(id));
    if (!report) {
      return response.error(res, '举报记录不存在');
    }

    response.success(res, {
      id: report.id,
      reporterId: report.user_id,
      reporterName: report.reporter_nickname,
      reporterAvatar: report.reporter_avatar,
      targetType: report.target_type,
      targetTypeName: report.target_type === 1 ? '帖子' : report.target_type === 2 ? '用户' : '评论',
      targetId: report.target_id,
      targetUserId: report.target_user_id,
      targetUserNickname: report.target_user_nickname,
      targetUserAvatar: report.target_user_avatar,
      targetContent: report.target_content,
      reason: report.reason,
      images: report.images ? report.images.split(',') : [],
      status: report.status,
      handleResult: report.handle_result,
      rejectReason: report.reject_reason,
      createTime: (report.create_time || 0) * 1000,
      handleTime: report.handle_time ? report.handle_time * 1000 : null,
      handlerName: report.handler_name
    });
  } catch (error) {
    logger.error('获取举报详情错误:', error);
    response.error(res, '操作失败');
  }
};

const handleReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, handleResult, rejectReason, status } = req.body;
    
    const finalStatus = action === 'resolved' || status === 'resolved' ? 'resolved' : 'rejected';
    
    const report = mockReports.find(r => r.id === parseInt(id));
    if (!report) {
      return response.error(res, '举报记录不存在');
    }
    
    // 更新mock数据
    report.status = finalStatus;
    report.handle_time = Math.floor(Date.now() / 1000);
    report.handler_id = 1;
    report.handler_name = 'admin';
    
    if (finalStatus === 'resolved') {
      report.handle_result = handleResult || '违规内容已处理';
      report.reject_reason = '';
    } else {
      report.reject_reason = rejectReason || '举报不成立，已驳回';
      report.handle_result = '';
    }
    
    const message = finalStatus === 'resolved' ? '举报已处理' : '举报已驳回';
    response.success(res, { 
      id: report.id,
      status: finalStatus, 
      handleResult: report.handle_result,
      rejectReason: report.reject_reason,
      handleTime: report.handle_time * 1000,
      handlerName: report.handler_name
    }, message);
  } catch (error) {
    logger.error('处理举报错误:', error);
    response.error(res, '操作失败');
  }
};

const batchHandleReports = async (req, res) => {
  try {
    const { ids, action, handleResult, rejectReason } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return response.error(res, '请选择举报记录');
    }
    if (!action || !['resolved', 'rejected'].includes(action)) {
      return response.error(res, '无效的操作类型');
    }
    
    const now = Math.floor(Date.now() / 1000);
    let count = 0;
    
    ids.forEach(id => {
      const report = mockReports.find(r => r.id === parseInt(id));
      if (report && report.status === 'pending') {
        report.status = action;
        report.handle_time = now;
        report.handler_id = 1;
        report.handler_name = 'admin';
        if (action === 'resolved') {
          report.handle_result = handleResult || '批量处理：违规内容已处理';
          report.reject_reason = '';
        } else {
          report.reject_reason = rejectReason || '批量驳回：举报不成立';
          report.handle_result = '';
        }
        count++;
      }
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
    const { id } = req.params;
    const idx = mockReports.findIndex(r => r.id === parseInt(id));
    if (idx !== -1) {
      mockReports.splice(idx, 1);
    }
    response.success(res, {}, '举报记录删除成功');
  } catch (error) {
    logger.error('删除举报错误:', error);
    response.error(res, '操作失败');
  }
};

const batchDeleteReports = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return response.error(res, '请选择要删除的举报');
    }
    let count = 0;
    ids.forEach(id => {
      const idx = mockReports.findIndex(r => r.id === parseInt(id));
      if (idx !== -1) {
        mockReports.splice(idx, 1);
        count++;
      }
    });
    response.success(res, { count }, `成功删除${count}条举报记录`);
  } catch (error) {
    logger.error('批量删除举报错误:', error);
    response.error(res, '操作失败');
  }
};

const getReportStats = async (req, res) => {
  try {
    const total = mockReports.length;
    const pending = mockReports.filter(r => r.status === 'pending').length;
    const resolved = mockReports.filter(r => r.status === 'resolved').length;
    const rejected = mockReports.filter(r => r.status === 'rejected').length;
    const todayStart = Math.floor(new Date(new Date().setHours(0,0,0,0)).getTime() / 1000);
    const today = mockReports.filter(r => r.create_time >= todayStart).length;
    
    // 举报原因分布
    const reasonMap = {};
    mockReports.forEach(r => {
      reasonMap[r.reason] = (reasonMap[r.reason] || 0) + 1;
    });
    
    response.success(res, {
      total, pending, resolved, rejected, today,
      reasonDistribution: Object.entries(reasonMap).map(([name, count]) => ({ name, count }))
    });
  } catch (error) {
    logger.error('获取举报统计错误:', error);
    response.success(res, { total: 0, pending: 0, resolved: 0, rejected: 0, today: 0, reasonDistribution: [] });
  }
};

const mockBanners = [
  { id: 1, title: '新手礼包', image: 'https://picsum.photos/600/300?random=1', link: '', sort: 1, status: 1, create_time: Math.floor(Date.now() / 1000) },
  { id: 2, title: 'VIP特权', image: 'https://picsum.photos/600/300?random=2', link: '', sort: 2, status: 1, create_time: Math.floor(Date.now() / 1000) },
  { id: 3, title: '活动推荐', image: 'https://picsum.photos/600/300?random=3', link: '', sort: 3, status: 0, create_time: Math.floor(Date.now() / 1000) }
];

const getBannerList = async (req, res) => {
  try {
    const { page = 1, pageSize = 50, status } = req.query;
    const offset = (page - 1) * pageSize;

    let banners = [...mockBanners];
    
    if (status !== undefined && status !== '') {
      banners = banners.filter(b => b.status === parseInt(status));
    }

    const total = banners.length;
    const list = banners.slice(offset, offset + parseInt(pageSize));

    response.success(res, {
      list: list.map(b => ({
        ...b,
        createTime: b.create_time * 1000
      })),
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error('获取Banner列表错误:', error);
    response.success(res, {
      list: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    });
  }
};

const getBannerDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = mockBanners.find(b => b.id === parseInt(id));
    
    if (!banner) {
      return response.error(res, 'Banner不存在');
    }
    
    response.success(res, {
      ...banner,
      createTime: banner.create_time * 1000
    });
  } catch (error) {
    logger.error('获取Banner详情错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const createBanner = async (req, res) => {
  try {
    const { title, image, link, sort, status } = req.body;
    
    if (!title || !image) {
      return response.error(res, '标题和图片不能为空');
    }

    const newBanner = {
      id: mockBanners.length > 0 ? Math.max(...mockBanners.map(b => b.id)) + 1 : 1,
      title,
      image,
      link: link || '',
      sort: sort || 0,
      status: status !== undefined ? parseInt(status) : 1,
      create_time: Math.floor(Date.now() / 1000)
    };
    
    mockBanners.push(newBanner);

    response.success(res, {
      ...newBanner,
      createTime: newBanner.create_time * 1000
    }, '创建成功');
  } catch (error) {
    logger.error('创建Banner错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, image, link, sort, status } = req.body;
    
    const banner = mockBanners.find(b => b.id === parseInt(id));
    
    if (!banner) {
      return response.error(res, 'Banner不存在');
    }
    
    if (title !== undefined) banner.title = title;
    if (image !== undefined) banner.image = image;
    if (link !== undefined) banner.link = link;
    if (sort !== undefined) banner.sort = parseInt(sort);
    if (status !== undefined) banner.status = parseInt(status);

    response.success(res, {}, '更新成功');
  } catch (error) {
    logger.error('更新Banner错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const updateBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const banner = mockBanners.find(b => b.id === parseInt(id));
    
    if (!banner) {
      return response.error(res, 'Banner不存在');
    }
    
    banner.status = parseInt(status);

    response.success(res, { status: banner.status }, '状态更新成功');
  } catch (error) {
    logger.error('更新Banner状态错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const index = mockBanners.findIndex(b => b.id === parseInt(id));
    
    if (index === -1) {
      return response.error(res, 'Banner不存在');
    }
    
    mockBanners.splice(index, 1);

    response.success(res, {}, '删除成功');
  } catch (error) {
    logger.error('删除Banner错误:', error);
    logger.error('操作失败:', error);
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
    if (!pkg) return response.error(res, '套餐不存在');
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
    if (idx === -1) return response.error(res, '套餐不存在');

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
    if (!pkg) return response.error(res, '套餐不存在');
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
    if (idx === -1) return response.error(res, '套餐不存在');
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
      return response.error(res, '礼物记录不存在');
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
      return response.error(res, '充值记录不存在');
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
    if (idx === -1) return response.error(res, '充值记录不存在');
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
    if (!record) return response.error(res, '充值记录不存在');
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
    if (!record) return response.error(res, '充值记录不存在');
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
      return response.error(res, '服务不存在');
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
    if (idx === -1) return response.error(res, '服务不存在');

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
    if (!game) return response.error(res, '服务不存在');
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
    if (idx === -1) return response.error(res, '服务不存在');
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
      withdrawMinAmount: 50,
      withdrawFeeRate: 0.02,
      withdrawAutoApprove: false,
      // 注册设置
      registerEnabled: true,
      registerNeedPhone: true,
      registerNeedRealName: false,
      // 功能开关
      reviewContentEnabled: true,
      giftEnabled: true,
      voiceChatEnabled: true,
      videoChatEnabled: true,
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

    logger.info('系统设置已更新（运行时）:', Object.keys(settings).join(', '));
    response.success(res, settings, '系统设置保存成功（运行时生效，敏感配置请通过环境变量持久化）');
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
      console.warn('数据库查询失败，使用Mock数据:', dbError.message);
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
    response.created(res, result, '虚拟用户创建成功');
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
    
    response.created(res, gift, '礼物创建成功');
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
  { id: 1, userId: 101, userName: '陪玩师小王', gameId: 1, gameName: '王者荣耀', price: 20, tags: '上分,陪练', voiceIntro: '声音甜美', status: 0, createTime: Date.now() - 86400000 },
  { id: 2, userId: 102, userName: '陪玩师小李', gameId: 2, gameName: '英雄联盟', price: 25, tags: '打野,意识流', voiceIntro: '专业打野', status: 0, createTime: Date.now() - 172800000 },
  { id: 3, userId: 103, userName: '陪玩师小张', gameId: 1, gameName: '王者荣耀', price: 18, tags: '中路,法师', voiceIntro: '中路法王', status: 1, createTime: Date.now() - 259200000 },
  { id: 4, userId: 104, userName: '陪玩师小赵', gameId: 3, gameName: '和平精英', price: 30, tags: '钢枪,伏地魔', voiceIntro: '钢枪小能手', status: 2, createTime: Date.now() - 345600000 },
  { id: 5, userId: 105, userName: '陪玩师小钱', gameId: 2, gameName: '英雄联盟', price: 22, tags: '辅助,保护', voiceIntro: '贴心辅助', status: 0, createTime: Date.now() - 432000000 }
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
      return response.error(res, '申请不存在');
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
      return response.error(res, '申请不存在');
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
      return response.error(res, '申请不存在');
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
      return response.error(res, '申请不存在');
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
    
    let candidates = [];
    try {
      const users = await User.findAll({
        where: { status: 0 },
        order: [['fans_num', 'DESC']],
        limit: parseInt(pageSize),
        offset: (page - 1) * pageSize
      });
      candidates = users.map(u => ({
        userId: u.id,
        nickname: u.nickname,
        avatar: u.avatar,
        vip: u.vip,
        likeCount: Math.floor(Math.random() * 500) + 50,
        followerCount: u.fans_num || 0,
        activityScore: Math.floor(Math.random() * 100)
      }));
    } catch (e) {
      candidates = mockUsers
        .filter(u => u.status === 0)
        .sort((a, b) => b.fans_num - a.fans_num)
        .slice(0, parseInt(pageSize))
        .map(u => ({
          userId: u.id,
          nickname: u.nickname,
          avatar: u.avatar,
          vip: u.vip,
          likeCount: Math.floor(Math.random() * 500) + 50,
          followerCount: u.fans_num || 0,
          activityScore: Math.floor(Math.random() * 100)
        }));
    }

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
      return response.error(res, '推荐记录不存在');
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
      return response.error(res, '推荐记录不存在');
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
        let candidates = [];
        try {
          const allUsers = await User.findAll({ where: { status: 0 } });
          candidates = allUsers.filter(u => u.id !== expired.user_id);
        } catch (e) {
          candidates = mockUsers.filter(u => u.status === 0 && u.id !== expired.user_id);
        }

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
// 内存缓存作为数据库不可用时的降级方案
let customerServiceCache = [
  { id: 1, userId: 1001, name: '客服小美', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cs1', role: 'senior', description: '资深客服，5年经验', online: true, status: 1, create_time: Date.now() - 86400000 * 30 },
  { id: 2, userId: 1002, name: '客服小王', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cs2', role: 'normal', description: '在线客服', online: false, status: 1, create_time: Date.now() - 86400000 * 20 },
  { id: 3, userId: 1003, name: '客服小李', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cs3', role: 'normal', description: '新入职客服', online: true, status: 1, create_time: Date.now() - 86400000 * 10 }
];
const getCustomerServiceList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query;
    const where = {};
    if (keyword) {
      where.name = { [Op.like]: `%${keyword}%` };
    }

    try {
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
    } catch (dbError) {
      // Fallback to cache if DB not available
      console.warn('客服DB查询失败，使用缓存:', dbError.message);
      let list = [...customerServiceCache];
      if (keyword) list = list.filter(cs => cs.name.includes(keyword));
      const total = list.length;
      const offset = (page - 1) * pageSize;
      response.success(res, {
        list: list.slice(offset, offset + parseInt(pageSize)),
        pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total, totalPages: Math.ceil(total / pageSize) }
      });
    }
  } catch (error) {
    logger.error('获取客服列表错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const createCustomerService = async (req, res) => {
  try {
    const { userId, user_id, name, avatar, role, description } = req.body;
    if (!name) return response.error(res, '客服名称不能为空');

    try {
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
    } catch (dbError) {
      const manualUserId = userId || user_id;
      const autoId = Math.max(...customerServiceCache.map(c => c.userId), 1000) + 1;
      const newUserId = manualUserId ? parseInt(manualUserId) : autoId;
      const newCs = {
        id: Math.max(...customerServiceCache.map(c => c.id), 0) + 1,
        userId: newUserId,
        name, avatar: avatar || '', role: role || 'normal', description: description || '',
        online: false, status: 1, create_time: Date.now()
      };
      customerServiceCache.push(newCs);
      response.success(res, newCs, '创建成功');
    }
  } catch (error) {
    logger.error('创建客服错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const updateCustomerService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar, role, description, online, status } = req.body;

    try {
      const cs = await CustomerService.findOne({ where: { user_id: parseInt(id) } });
      if (!cs) return response.error(res, '客服不存在');
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (avatar !== undefined) updates.avatar = avatar;
      if (role !== undefined) updates.role = role;
      if (description !== undefined) updates.description = description;
      if (online !== undefined) updates.online = online ? 1 : 0;
      if (status !== undefined) updates.status = status;
      updates.update_time = Math.floor(Date.now() / 1000);
      await cs.update(updates);
      response.success(res, cs, '更新成功');
    } catch (dbError) {
      const idx = customerServiceCache.findIndex(c => c.userId === parseInt(id));
      if (idx === -1) return response.error(res, '客服不存在');
      if (name !== undefined) customerServiceCache[idx].name = name;
      if (avatar !== undefined) customerServiceCache[idx].avatar = avatar;
      if (role !== undefined) customerServiceCache[idx].role = role;
      if (description !== undefined) customerServiceCache[idx].description = description;
      if (online !== undefined) customerServiceCache[idx].online = online;
      if (status !== undefined) customerServiceCache[idx].status = status;
      response.success(res, customerServiceCache[idx], '更新成功');
    }
  } catch (error) {
    logger.error('更新客服错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const deleteCustomerService = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      const cs = await CustomerService.findOne({ where: { user_id: parseInt(id) } });
      if (!cs) return response.error(res, '客服不存在');
      await cs.destroy();
      response.success(res, {}, '删除成功');
    } catch (dbError) {
      const idx = customerServiceCache.findIndex(c => c.userId === parseInt(id));
      if (idx === -1) return response.error(res, '客服不存在');
      customerServiceCache.splice(idx, 1);
      response.success(res, {}, '删除成功');
    }
  } catch (error) {
    logger.error('删除客服错误:', error);
    logger.error('操作失败:', error);
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
    if (!notification) return response.error(res, '通知不存在');
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
    if (!notification) return response.error(res, '通知不存在');
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
    if (!notification) return response.error(res, '通知不存在');
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
    if (!notification) return response.error(res, '通知不存在');
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
    if (!notification) return response.error(res, '通知不存在');
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
  { id: 1, card_no: 'CARD20260500001', card_pwd: 'abc123', face_value: 100, coin_amount: 100, status: 0, use_time: 0, use_user_id: 0, expire_time: Math.floor(Date.now() / 1000) + 86400 * 365, create_time: Math.floor(Date.now() / 1000) - 86400 * 10, category: 'vip', tag: 'VIP专属', batch_no: 'BATCH001', remark: '' },
  { id: 2, card_no: 'CARD20260500002', card_pwd: 'def456', face_value: 50, coin_amount: 50, status: 1, use_time: Math.floor(Date.now() / 1000) - 3600, use_user_id: 1001, expire_time: Math.floor(Date.now() / 1000) + 86400 * 365, create_time: Math.floor(Date.now() / 1000) - 86400 * 9, category: 'newbie', tag: '新人礼包', batch_no: 'BATCH002', remark: '' },
  { id: 3, card_no: 'CARD20260500003', card_pwd: 'ghi789', face_value: 200, coin_amount: 200, status: 0, use_time: 0, use_user_id: 0, expire_time: Math.floor(Date.now() / 1000) - 3600, create_time: Math.floor(Date.now() / 1000) - 86400 * 8, category: 'activity', tag: '活动赠送', batch_no: 'BATCH001', remark: '春节活动密卡' },
  { id: 4, card_no: 'CARD20260500004', card_pwd: 'jkl012', face_value: 500, coin_amount: 500, status: 3, use_time: 0, use_user_id: 0, expire_time: Math.floor(Date.now() / 1000) + 86400 * 180, create_time: Math.floor(Date.now() / 1000) - 86400 * 5, category: 'vip', tag: 'VIP专属', batch_no: 'BATCH003', remark: '' },
  { id: 5, card_no: 'CARD20260500005', card_pwd: 'mno345', face_value: 1000, coin_amount: 1000, status: 1, use_time: Math.floor(Date.now() / 1000) - 86400, use_user_id: 1002, expire_time: Math.floor(Date.now() / 1000) + 86400 * 90, create_time: Math.floor(Date.now() / 1000) - 86400 * 3, category: 'general', tag: '通用', batch_no: 'BATCH002', remark: '' },
];

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
  createTime: (c.create_time || 0) * 1000,
  category: c.category || '',
  tag: c.tag || '',
  batchNo: c.batch_no || '',
  remark: c.remark || ''
});

const getCardList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, status, category, batchNo } = req.query;
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
        if (category) where.category = category;
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

    // Mock 回退
    let filtered = [..._cards];
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
    if (category) filtered = filtered.filter(c => (c.category || '') === category);
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
    if (!record) return response.error(res, '密卡不存在');
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

    for (let i = 0; i < Math.min(count, 1000); i++) {
      const no = cardNo || ('CARD' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + String(_cardNextId + i).padStart(5, '0'));
      const pwd = cardPwd || Math.random().toString(36).slice(2, 10);

      if (Card) {
        try {
          const card = await Card.create({
            card_no: no + (count > 1 ? '_' + (i + 1) : ''),
            card_pwd: pwd,
            face_value: faceValue,
            coin_amount: coinAmount,
            status: 0,
            expire_time: expireTime,
            create_time: now,
            category: categoryVal,
            tag: tagVal,
            batch_no: batchNoVal
          });
          created.push(_formatCard(card));
        } catch (dbErr) {
          const mockCard = { id: _cardNextId + created.length, card_no: no, card_pwd: pwd, face_value: faceValue, coin_amount: coinAmount, status: 0, use_time: 0, use_user_id: 0, expire_time: expireTime, create_time: now, category: categoryVal, tag: tagVal, batch_no: batchNoVal, remark: '' };
          _cards.push(mockCard);
          created.push(_formatCard(mockCard));
        }
      } else {
        const mockCard = { id: _cardNextId + created.length, card_no: no, card_pwd: pwd, face_value: faceValue, coin_amount: coinAmount, status: 0, use_time: 0, use_user_id: 0, expire_time: expireTime, create_time: now, category: categoryVal, tag: tagVal, batch_no: batchNoVal, remark: '' };
        _cards.push(mockCard);
        created.push(_formatCard(mockCard));
      }
    }

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
        if (card && card.status === 0) {
          await card.destroy();
          return response.success(res, {}, '密卡删除成功');
        } else if (card) {
          return response.error(res, '只能删除未使用的密卡');
        }
      } catch (e) { /* fallback */ }
    }
    const idx = _cards.findIndex(c => c.id === parseInt(id));
    if (idx === -1) return response.error(res, '密卡不存在');
    if (_cards[idx].status !== 0) return response.error(res, '只能删除未使用的密卡');
    _cards.splice(idx, 1);
    response.success(res, {}, '密卡删除成功');
  } catch (error) {
    logger.error('删除密卡错误:', error.message);
    response.error(res, '操作失败');
  }
};

// 更新密卡信息
const updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { cardPwd, faceValue, coinAmount, expireDays, category, tag, remark } = req.body;
    if (Card) {
      try {
        const card = await Card.findByPk(parseInt(id));
        if (!card) return response.error(res, '密卡不存在');
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
    if (idx === -1) return response.error(res, '密卡不存在');
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
        if (!card) return response.error(res, '密卡不存在');
        if (card.status === 1) return response.error(res, '已使用的密卡无法修改状态');
        await card.update({ status });
        return response.success(res, {}, status === 3 ? '密卡已禁用' : '密卡已启用');
      } catch (e) { /* fallback */ }
    }
    const idx = _cards.findIndex(c => c.id === parseInt(id));
    if (idx === -1) return response.error(res, '密卡不存在');
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
        const destroyed = await Card.destroy({ where: { id: ids, status: 0 } });
        successCount = destroyed;
      } catch (e) { /* fallback */ }
    }
    // Mock fallback
    for (const id of ids) {
      const idx = _cards.findIndex(c => c.id === parseInt(id));
      if (idx !== -1 && _cards[idx].status === 0) {
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

// 批量导入密卡
const importCards = async (req, res) => {
  try {
    const { cards } = req.body; // [{ cardNo, cardPwd, faceValue, coinAmount, expireDays, category, tag }]
    if (!Array.isArray(cards) || cards.length === 0) return response.badRequest(res, '请提供密卡数据');
    if (cards.length > 5000) return response.badRequest(res, '单次最多导入5000张');
    const now = Math.floor(Date.now() / 1000);
    const batchNo = 'BATCH' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase();
    let successCount = 0, failCount = 0;

    for (const item of cards) {
      try {
        const no = item.cardNo || ('CARD' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + String(_cardNextId + successCount).padStart(5, '0'));
        const expireDays = item.expireDays || 365;
        if (Card) {
          try {
            await Card.create({
              card_no: no,
              card_pwd: item.cardPwd || Math.random().toString(36).slice(2, 10),
              face_value: item.faceValue || 100,
              coin_amount: item.coinAmount || 100,
              status: 0,
              expire_time: expireDays > 0 ? now + expireDays * 86400 : 0,
              create_time: now,
              category: item.category || '',
              tag: item.tag || '',
              batch_no: batchNo
            });
            successCount++;
          } catch (dbErr) {
            failCount++;
          }
        } else {
          _cards.push({
            id: _cardNextId + successCount,
            card_no: no, card_pwd: item.cardPwd || Math.random().toString(36).slice(2, 10),
            face_value: item.faceValue || 100, coin_amount: item.coinAmount || 100,
            status: 0, use_time: 0, use_user_id: 0,
            expire_time: expireDays > 0 ? now + expireDays * 86400 : 0, create_time: now,
            category: item.category || '', tag: item.tag || '', batch_no: batchNo
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
  getCardStats,
  importCards,
  deleteCard,
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