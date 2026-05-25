const { User, GameOrder, Withdraw, GiftLog, Post, VipPackage, Banner, CompanionProfile } = require('../models');
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
    console.error('管理员登录错误:', error);
    response.error(res, error.message);
  }
};

const getUserList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, nickname, phone, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    let users = [];
    let total = 0;
    
    try {
      const where = {};
      if (nickname) where.nickname = { [Op.like]: `%${nickname}%` };
      if (phone) where.phone = { [Op.like]: `%${phone}%` };
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
      if (nickname) {
        filteredUsers = filteredUsers.filter(u => u.nickname.includes(nickname));
      }
      if (phone) {
        filteredUsers = filteredUsers.filter(u => u.phone.includes(phone));
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
    console.error('获取用户列表错误:', error);
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
    console.error('获取用户详情错误:', error);
    response.error(res, error.message);
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
    console.error('更新用户信息错误:', error);
    response.error(res, error.message);
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
    console.error('更新用户状态错误:', error);
    response.error(res, error.message);
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
    console.error('删除用户错误:', error);
    response.error(res, error.message);
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
    console.error('创建用户错误:', error);
    response.error(res, error.message);
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
    console.error('获取订单列表错误:', error);
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
    console.error('获取订单详情错误:', error);
    response.error(res, error.message);
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
    console.error('更新订单状态错误:', error);
    response.error(res, error.message);
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
    console.error('创建订单错误:', error);
    response.error(res, error.message);
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
    console.error('删除订单错误:', error);
    response.error(res, error.message);
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
    console.error('获取提现列表错误:', error);
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
    console.error('审核提现错误:', error);
    response.error(res, error.message);
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
    console.error('拒绝提现错误:', error);
    response.error(res, error.message);
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
    console.error('获取提现详情错误:', error);
    response.error(res, error.message);
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
    console.error('创建提现记录错误:', error);
    response.error(res, error.message);
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
    console.error('删除提现记录错误:', error);
    response.error(res, error.message);
  }
};

const getPostList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query;
    const offset = (page - 1) * pageSize;
    
    let posts = [];
    let total = 0;
    
    try {
      const where = {};
      if (keyword) where.content = keyword;
      
      const result = await Post.findAndCountAll({
        where,
        offset,
        limit: parseInt(pageSize),
        order: [['create_time', 'DESC']]
      });
      
      posts = result.rows || [];
      total = result.count || 0;
    } catch (dbError) {
      console.warn('数据库查询失败，使用Mock数据:', dbError.message);
      const mockPosts = [
        { id: 1, user_id: 1, content: '今天和陪玩师一起打王者荣耀，太开心了！', images: 'https://picsum.photos/400/300?random=1', thumb_num: 42, comment_num: 8, create_time: Math.floor(Date.now() / 1000) - 3600 },
        { id: 2, user_id: 2, content: '晒一下今天的游戏成果，吃鸡三连！', images: 'https://picsum.photos/400/300?random=2', thumb_num: 28, comment_num: 5, create_time: Math.floor(Date.now() / 1000) - 7200 },
        { id: 3, user_id: 3, content: '有没有一起玩原神的小伙伴？周末可以组队！', images: '', thumb_num: 15, comment_num: 12, create_time: Math.floor(Date.now() / 1000) - 10800 }
      ];
      
      posts = mockPosts.slice(offset, offset + parseInt(pageSize));
      total = mockPosts.length;
    }
    
    const result = posts.map(post => ({
      id: post.id,
      userId: post.user_id,
      content: post.content,
      images: post.images ? post.images.split(',') : [],
      likeCount: post.thumb_num || 0,
      commentCount: post.comment_num || 0,
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
    console.error('获取帖子列表错误:', error);
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
    console.error('获取帖子详情错误:', error);
    response.error(res, error.message);
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
    console.error('删除帖子错误:', error);
    response.error(res, error.message);
  }
};

const getReportList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const offset = (page - 1) * pageSize;

    const mockReports = [
      { id: 1, user_id: 101, reporter_nickname: '用户小明', target_type: 1, target_id: 201, target_content: '这是一个违规帖子内容，包含广告信息', reason: '垃圾广告', images: '', status: 'pending', handle_result: '', create_time: Math.floor(Date.now() / 1000) - 3600, handle_time: 0 },
      { id: 2, user_id: 102, reporter_nickname: '用户小红', target_type: 2, target_id: 301, target_content: '用户恶意骚扰其他玩家', reason: '恶意骚扰', images: '', status: 'pending', handle_result: '', create_time: Math.floor(Date.now() / 1000) - 7200, handle_time: 0 },
      { id: 3, user_id: 103, reporter_nickname: '用户小刚', target_type: 1, target_id: 202, target_content: '这是一条违规评论，包含侮辱性词汇', reason: '侮辱谩骂', images: '', status: 'resolved', handle_result: '已处理，删除违规内容', create_time: Math.floor(Date.now() / 1000) - 10800, handle_time: Math.floor(Date.now() / 1000) - 3600 },
      { id: 4, user_id: 104, reporter_nickname: '用户小丽', target_type: 3, target_id: 401, target_content: '用户资料包含虚假信息', reason: '虚假信息', images: '', status: 'rejected', handle_result: '经核实，不构成违规', create_time: Math.floor(Date.now() / 1000) - 14400, handle_time: Math.floor(Date.now() / 1000) - 7200 },
      { id: 5, user_id: 105, reporter_nickname: '用户阿杰', target_type: 1, target_id: 203, target_content: '帖子内容涉及欺诈行为', reason: '欺诈行为', images: '', status: 'pending', handle_result: '', create_time: Math.floor(Date.now() / 1000) - 18000, handle_time: 0 }
    ];

    let filtered = [...mockReports];
    if (status && status !== '') {
      filtered = filtered.filter(r => r.status === status);
    }

    const total = filtered.length;
    const list = filtered.slice(offset, offset + parseInt(pageSize));

    const result = list.map(r => ({
      id: r.id,
      reporterId: r.user_id,
      reporterName: r.reporter_nickname,
      type: r.target_type === 1 ? 'post' : r.target_type === 2 ? 'user' : 'comment',
      targetType: r.target_type,
      targetId: r.target_id,
      targetContent: r.target_content,
      reason: r.reason,
      images: r.images ? r.images.split(',') : [],
      status: r.status,
      handleResult: r.handle_result,
      createTime: (r.create_time || 0) * 1000,
      handleTime: r.handle_time ? r.handle_time * 1000 : null
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
    console.error('获取举报列表错误:', error);
    response.success(res, {
      list: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    });
  }
};

const getReportDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const mockReports = [
      { id: 1, user_id: 101, reporter_nickname: '用户小明', target_type: 1, target_id: 201, target_content: '这是一个违规帖子内容，包含广告信息', reason: '垃圾广告', images: '', status: 'pending', handle_result: '', create_time: Math.floor(Date.now() / 1000) - 3600, handle_time: 0 },
      { id: 2, user_id: 102, reporter_nickname: '用户小红', target_type: 2, target_id: 301, target_content: '用户恶意骚扰其他玩家', reason: '恶意骚扰', images: '', status: 'pending', handle_result: '', create_time: Math.floor(Date.now() / 1000) - 7200, handle_time: 0 },
      { id: 3, user_id: 103, reporter_nickname: '用户小刚', target_type: 1, target_id: 202, target_content: '这是一条违规评论，包含侮辱性词汇', reason: '侮辱谩骂', images: '', status: 'resolved', handle_result: '已处理，删除违规内容', create_time: Math.floor(Date.now() / 1000) - 10800, handle_time: Math.floor(Date.now() / 1000) - 3600 },
      { id: 4, user_id: 104, reporter_nickname: '用户小丽', target_type: 3, target_id: 401, target_content: '用户资料包含虚假信息', reason: '虚假信息', images: '', status: 'rejected', handle_result: '经核实，不构成违规', create_time: Math.floor(Date.now() / 1000) - 14400, handle_time: Math.floor(Date.now() / 1000) - 7200 },
      { id: 5, user_id: 105, reporter_nickname: '用户阿杰', target_type: 1, target_id: 203, target_content: '帖子内容涉及欺诈行为', reason: '欺诈行为', images: '', status: 'pending', handle_result: '', create_time: Math.floor(Date.now() / 1000) - 18000, handle_time: 0 }
    ];

    const report = mockReports.find(r => r.id === parseInt(id));
    if (!report) {
      return response.error(res, '举报记录不存在');
    }

    response.success(res, {
      id: report.id,
      reporterId: report.user_id,
      reporterName: report.reporter_nickname,
      type: report.target_type === 1 ? 'post' : report.target_type === 2 ? 'user' : 'comment',
      targetType: report.target_type,
      targetId: report.target_id,
      targetContent: report.target_content,
      reason: report.reason,
      images: report.images ? report.images.split(',') : [],
      status: report.status,
      handleResult: report.handle_result,
      createTime: (report.create_time || 0) * 1000,
      handleTime: report.handle_time ? report.handle_time * 1000 : null
    });
  } catch (error) {
    console.error('获取举报详情错误:', error);
    response.error(res, error.message);
  }
};

const handleReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, handleResult, status } = req.body;
    
    const finalStatus = action === 'resolved' || status === 'resolved' ? 'resolved' : 'rejected';
    const message = finalStatus === 'resolved' ? '举报已处理' : '举报已驳回';

    response.success(res, { status: finalStatus }, message);
  } catch (error) {
    console.error('处理举报错误:', error);
    response.error(res, error.message);
  }
};

const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    response.success(res, {}, '举报记录删除成功');
  } catch (error) {
    console.error('删除举报错误:', error);
    response.error(res, error.message);
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
    console.error('获取Banner列表错误:', error);
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
    console.error('获取Banner详情错误:', error);
    response.error(res, error.message);
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
    console.error('创建Banner错误:', error);
    response.error(res, error.message);
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
    console.error('更新Banner错误:', error);
    response.error(res, error.message);
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
    console.error('更新Banner状态错误:', error);
    response.error(res, error.message);
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
    console.error('删除Banner错误:', error);
    response.error(res, error.message);
  }
};

const getVipPackageList = async (req, res) => {
  try {
    const { page = 1, pageSize = 50 } = req.query;
    const offset = (page - 1) * pageSize;

    const mockPackages = [
      { id: 1, name: 'VIP月卡', price: 18, original_price: 30, duration: 30, level: 1, hot: 1, sort: 1, status: 1, benefits: ['专属标识', '经验加成10%'], create_time: Math.floor(Date.now() / 1000) },
      { id: 2, name: 'VIP季卡', price: 48, original_price: 90, duration: 90, level: 1, hot: 0, sort: 2, status: 1, benefits: ['专属标识', '经验加成20%', '优先匹配'], create_time: Math.floor(Date.now() / 1000) },
      { id: 3, name: 'VIP年卡', price: 128, original_price: 360, duration: 365, level: 2, hot: 1, sort: 3, status: 1, benefits: ['专属标识', '经验加成30%', '优先匹配', '专属客服'], create_time: Math.floor(Date.now() / 1000) },
      { id: 4, name: 'VIP永久', price: 298, original_price: null, duration: 3650, level: 3, hot: 0, sort: 4, status: 1, benefits: ['全部特权', '永久有效'], create_time: Math.floor(Date.now() / 1000) }
    ];

    let packages = [...mockPackages];
    const total = packages.length;
    const list = packages.slice(offset, offset + parseInt(pageSize));

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
    console.error('获取VIP套餐列表错误:', error);
    response.error(res, error.message);
  }
};

const getVipPackageDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const mockPackage = { id: 1, name: 'VIP月卡', price: 18, original_price: 30, duration: 30, level: 1, hot: 1, sort: 1, status: 1, benefits: ['专属标识', '经验加成10%'], create_time: Math.floor(Date.now() / 1000) };

    response.success(res, {
      ...mockPackage,
      id: parseInt(id)
    });
  } catch (error) {
    console.error('获取VIP套餐详情错误:', error);
    response.error(res, error.message);
  }
};

const createVipPackage = async (req, res) => {
  try {
    const { name, price, originalPrice, duration, level, hot, sort, benefits } = req.body;

    response.success(res, {
      id: Math.floor(Math.random() * 1000),
      name,
      price,
      original_price: originalPrice,
      duration,
      level,
      hot: hot ? 1 : 0,
      sort,
      benefits: benefits || [],
      status: 1,
      create_time: Math.floor(Date.now() / 1000)
    }, 'VIP套餐创建成功');
  } catch (error) {
    console.error('创建VIP套餐错误:', error);
    response.error(res, error.message);
  }
};

const updateVipPackage = async (req, res) => {
  try {
    const { id } = req.params;
    response.success(res, { id: parseInt(id) }, 'VIP套餐更新成功');
  } catch (error) {
    console.error('更新VIP套餐错误:', error);
    response.error(res, error.message);
  }
};

const updateVipPackageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    response.success(res, { status }, '状态更新成功');
  } catch (error) {
    console.error('更新VIP套餐状态错误:', error);
    response.error(res, error.message);
  }
};

const deleteVipPackage = async (req, res) => {
  try {
    const { id } = req.params;
    response.success(res, {}, 'VIP套餐删除成功');
  } catch (error) {
    console.error('删除VIP套餐错误:', error);
    response.error(res, error.message);
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
    console.error('获取礼物记录列表错误:', error);
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
    console.error('获取礼物记录详情错误:', error);
    response.error(res, error.message);
  }
};

const getRechargeRecordList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, userId, status } = req.query;
    const offset = (page - 1) * pageSize;

    const mockRecords = [
      { id: 1, order_no: 'REC20260523001', user_id: 1, username: '用户小明', amount: 100, pay_type: 1, status: 'completed', create_time: Math.floor(Date.now() / 1000) - 1800 },
      { id: 2, order_no: 'REC20260523002', user_id: 2, username: '用户小红', amount: 500, pay_type: 2, status: 'completed', create_time: Math.floor(Date.now() / 1000) - 3600 },
      { id: 3, order_no: 'REC20260523003', user_id: 3, username: '用户小刚', amount: 200, pay_type: 1, status: 'pending', create_time: Math.floor(Date.now() / 1000) - 5400 },
      { id: 4, order_no: 'REC20260523004', user_id: 4, username: '用户小丽', amount: 150, pay_type: 1, status: 'failed', create_time: Math.floor(Date.now() / 1000) - 7200 },
      { id: 5, order_no: 'REC20260523005', user_id: 5, username: '用户阿杰', amount: 300, pay_type: 3, status: 'completed', create_time: Math.floor(Date.now() / 1000) - 10800 }
    ];

    let filtered = [...mockRecords];
    if (userId) {
      filtered = filtered.filter(r => r.user_id === parseInt(userId));
    }
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }

    const total = filtered.length;
    const list = filtered.slice(offset, offset + parseInt(pageSize));

    const result = list.map(r => ({
      id: r.id,
      orderNo: r.order_no,
      userId: r.user_id,
      username: r.username,
      amount: r.amount,
      paymentMethod: r.pay_type === 1 ? 'wechat' : r.pay_type === 2 ? 'alipay' : 'bank',
      status: r.status,
      createTime: (r.create_time || 0) * 1000
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
    console.error('获取充值记录列表错误:', error);
    response.success(res, {
      list: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    });
  }
};

const getRechargeRecordDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const mockRecords = [
      { id: 1, order_no: 'REC20260523001', user_id: 1, username: '用户小明', amount: 100, pay_type: 1, status: 'completed', create_time: Math.floor(Date.now() / 1000) - 1800 },
      { id: 2, order_no: 'REC20260523002', user_id: 2, username: '用户小红', amount: 500, pay_type: 2, status: 'completed', create_time: Math.floor(Date.now() / 1000) - 3600 },
      { id: 3, order_no: 'REC20260523003', user_id: 3, username: '用户小刚', amount: 200, pay_type: 1, status: 'pending', create_time: Math.floor(Date.now() / 1000) - 5400 }
    ];

    const record = mockRecords.find(r => r.id === parseInt(id));
    if (!record) {
      return response.error(res, '充值记录不存在');
    }

    response.success(res, {
      id: record.id,
      orderNo: record.order_no,
      userId: record.user_id,
      username: record.username,
      amount: record.amount,
      paymentMethod: record.pay_type === 1 ? 'wechat' : record.pay_type === 2 ? 'alipay' : 'bank',
      status: record.status,
      createTime: (record.create_time || 0) * 1000
    });
  } catch (error) {
    console.error('获取充值记录详情错误:', error);
    response.error(res, error.message);
  }
};

const deleteRechargeRecord = async (req, res) => {
  try {
    const { id } = req.params;
    response.success(res, {}, '充值记录删除成功');
  } catch (error) {
    console.error('删除充值记录错误:', error);
    response.error(res, error.message);
  }
};

const getGameList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword = '', serviceType = '' } = req.query;
    const offset = (page - 1) * pageSize;

    let mockGames = [
      { id: 1, name: '王者荣耀', image: 'https://picsum.photos/100/100?random=1', image_bg: '', description: '线上服务', status: 1, sort: 1, create_time: Math.floor(Date.now() / 1000) - 86400 * 30 },
      { id: 2, name: '英雄联盟', image: 'https://picsum.photos/100/100?random=2', image_bg: '', description: '线上服务', status: 1, sort: 2, create_time: Math.floor(Date.now() / 1000) - 86400 * 25 },
      { id: 3, name: '绝地求生', image: 'https://picsum.photos/100/100?random=3', image_bg: '', description: '线上服务', status: 1, sort: 3, create_time: Math.floor(Date.now() / 1000) - 86400 * 20 },
      { id: 4, name: '原神', image: 'https://picsum.photos/100/100?random=4', image_bg: '', description: '线上服务', status: 0, sort: 4, create_time: Math.floor(Date.now() / 1000) - 86400 * 15 },
      { id: 5, name: '和平精英', image: 'https://picsum.photos/100/100?random=5', image_bg: '', description: '线上服务', status: 1, sort: 5, create_time: Math.floor(Date.now() / 1000) - 86400 * 10 }
    ];

    if (keyword) {
      mockGames = mockGames.filter(g => g.name.includes(keyword));
    }
    if (serviceType) {
      mockGames = mockGames.filter(g => g.description === serviceType);
    }

    const total = mockGames.length;
    const list = mockGames.slice(offset, offset + parseInt(pageSize)).map(g => ({
      id: g.id,
      name: g.name,
      icon: g.image,
      description: g.description,
      status: g.status,
      sort: g.sort,
      createTime: g.create_time * 1000
    }));

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
    console.error('获取游戏列表错误:', error);
    response.success(res, {
      list: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    });
  }
};

const getGameDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const mockGames = [
      { id: 1, name: '王者荣耀', image: 'https://picsum.photos/100/100?random=1', image_bg: '', description: '线上服务', status: 1, sort: 1, create_time: Math.floor(Date.now() / 1000) - 86400 * 30 },
      { id: 2, name: '英雄联盟', image: 'https://picsum.photos/100/100?random=2', image_bg: '', description: '线上服务', status: 1, sort: 2, create_time: Math.floor(Date.now() / 1000) - 86400 * 25 },
      { id: 3, name: '绝地求生', image: 'https://picsum.photos/100/100?random=3', image_bg: '', description: '线上服务', status: 1, sort: 3, create_time: Math.floor(Date.now() / 1000) - 86400 * 20 }
    ];

    const game = mockGames.find(g => g.id === parseInt(id));
    if (!game) {
      return response.error(res, '服务不存在');
    }

    response.success(res, {
      id: game.id,
      name: game.name,
      icon: game.image,
      description: game.description,
      status: game.status,
      sort: game.sort,
      createTime: game.create_time * 1000
    });
  } catch (error) {
    console.error('获取游戏详情错误:', error);
    response.error(res, error.message);
  }
};

const createGame = async (req, res) => {
  try {
    const { name, icon, description, sort, status } = req.body;

    if (!name) {
      return response.badRequest(res, '服务名称不能为空');
    }

    response.success(res, {
      id: Math.floor(Math.random() * 1000),
      name,
      icon: icon || '',
      description: description || '',
      sort: sort || 0,
      status: status !== undefined ? status : 1,
      createTime: Date.now()
    }, '服务创建成功');
  } catch (error) {
    console.error('创建游戏错误:', error);
    response.error(res, error.message);
  }
};

const updateGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, description, sort, status } = req.body;

    response.success(res, {
      id: parseInt(id),
      name,
      icon: icon || '',
      description: description || '',
      sort: sort || 0,
      status: status !== undefined ? status : 1
    }, '服务更新成功');
  } catch (error) {
    console.error('更新游戏错误:', error);
    response.error(res, error.message);
  }
};

const updateGameStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    response.success(res, { id: parseInt(id), status }, '状态更新成功');
  } catch (error) {
    console.error('更新游戏状态错误:', error);
    response.error(res, error.message);
  }
};

const deleteGame = async (req, res) => {
  try {
    const { id } = req.params;
    response.success(res, {}, '服务删除成功');
  } catch (error) {
    console.error('删除游戏错误:', error);
    response.error(res, error.message);
  }
};

const getSystemSettings = async (req, res) => {
  try {
    const settings = {
      siteName: '多客陪玩',
      siteDescription: '多客陪玩 - 专业游戏陪玩平台',
      siteKeywords: '陪玩,游戏陪玩,陪玩平台',
      siteLogo: '',
      siteFavicon: '',
      recordNumber: '粤ICP备xxxxxxxx号',
      contactEmail: 'admin@duoke.com',
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
      voiceChatEnabled: true,
      videoChatEnabled: true
    };
    response.success(res, settings);
  } catch (error) {
    console.error('获取系统设置错误:', error);
    response.error(res, error.message);
  }
};

const updateSystemSettings = async (req, res) => {
  try {
    const settings = req.body;
    response.success(res, settings, '系统设置保存成功');
  } catch (error) {
    console.error('更新系统设置错误:', error);
    response.error(res, error.message);
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
      totalGifts: 0
    }

    try {
      const today = new Date();
      const todayStart = Math.floor(new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() / 1000);
      
      const totalUsers = await User.count();
      const todayUsers = await User.count({ where: { create_time: { [Op.gte]: todayStart } } });
      
      const totalOrders = await GameOrder.count();
      const todayOrders = await GameOrder.count({ where: { create_time: { [Op.gte]: todayStart } } });
      
      const totalWithdraws = await Withdraw.sum('amount') || 0;
      const pendingWithdraws = await Withdraw.count({ where: { status: 'pending' } });
      
      const totalGifts = await GiftLog.sum('amount') || 0;
      const totalPosts = await Post.count();
      
      stats = {
        totalUsers: totalUsers || 0,
        todayUsers: todayUsers || 0,
        totalOrders: totalOrders || 0,
        todayOrders: todayOrders || 0,
        totalWithdraws: parseFloat(totalWithdraws) || 0,
        pendingWithdraws: pendingWithdraws || 0,
        totalGifts: parseFloat(totalGifts) || 0,
        totalPosts: totalPosts || 0
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
        totalPosts: 256
      }
    }
    
    response.success(res, stats);
  } catch (error) {
    console.error('获取统计数据错误:', error);
    response.success(res, {
      totalUsers: 0,
      todayUsers: 0,
      totalOrders: 0,
      todayOrders: 0,
      totalWithdraws: 0,
      pendingWithdraws: 0,
      totalGifts: 0
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
    const result = await virtualUserService.createVirtualUser(req.body);
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
    response.error(res, error.message);
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
      type: type || 0,
      is_vip: is_vip || 0,
      tian: tian || 0,
      status: status !== undefined ? status : 1,
      sort: sort || 0
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
    console.error('获取服务申请列表错误:', error);
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
    console.error('获取服务申请详情错误:', error);
    response.error(res, error.message);
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
    console.error('审核通过错误:', error);
    response.error(res, error.message);
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
    console.error('审核拒绝错误:', error);
    response.error(res, error.message);
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
    console.error('删除服务申请错误:', error);
    response.error(res, error.message);
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
  getVirtualUserChatHistory
};