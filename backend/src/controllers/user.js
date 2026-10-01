const { authService, smsService } = require('../services');
const { User, Post, PostLike, UserVisit, UserPref } = require('../models');
const { Op } = require('sequelize');
const response = require('../utils/response');
const logger = require('../utils/logger');
const { generateToken } = require('../config/jwt');

const login = async (req, res) => {
  try {
    const { username, mobile, phone, password } = req.body;
    const account = username || mobile || phone;

    if (!account || !password) {
      return response.badRequest(res, '手机号和密码不能为空');
    }

    const result = await authService.loginWithPassword(account, password);
    response.success(res, result, '登录成功');
  } catch (error) {
    logger.error('登录错误:', error);
    if (error.message === '用户不存在') {
      response.unprocessableEntity(res, '用户不存在', { phone: ['用户不存在，请检查手机号或使用验证码登录'] });
    } else if (error.message === '密码错误') {
      response.unprocessableEntity(res, '密码错误', { password: ['密码错误，请重新输入'] });
    } else if (error.message === '该用户未设置密码') {
      response.unprocessableEntity(res, '该用户未设置密码', { password: ['该用户未设置密码，请使用验证码登录或重置密码'] });
    } else {
      response.error(res, '登录失败');
    }
  }
};

const register = async (req, res) => {
  try {
    const { phone, password, code } = req.body;

    if (!phone || !password || !code) {
      return response.badRequest(res, '手机号、密码和验证码不能为空');
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return response.badRequest(res, '请输入正确的手机号');
    }

    if (password.length < 6 || password.length > 16) {
      return response.badRequest(res, '密码长度6-16位');
    }

    const result = await authService.register(phone, password, `用户${phone.slice(-4)}`);
    response.created(res, result, '注册成功');
  } catch (error) {
    logger.error('注册错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { phone, password, code } = req.body;

    if (!phone || !password || !code) {
      return response.badRequest(res, '手机号、密码和验证码不能为空');
    }

    if (password.length < 6 || password.length > 16) {
      return response.badRequest(res, '密码长度6-16位');
    }

    const { User } = require('../models');
    const bcrypt = require('bcryptjs');

    const user = await User.findOne({ where: { mobile: phone } });
    if (!user) {
      return response.notFound(res, '用户不存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({ password: hashedPassword });

    response.success(res, {}, '密码重置成功');
  } catch (error) {
    logger.error('重置密码错误:', error);
    response.error(res, '密码重置失败');
  }
};

const getUserInfo = async (req, res) => {
  try {
    const targetUserId = req.query.userId || req.userId;
    const userInfo = await authService.getUserInfo(req.userId, targetUserId);
    response.success(res, userInfo);
  } catch (error) {
    logger.error('获取用户信息错误:', error);
    response.error(res, error.message);
  }
};

const updateUserInfo = async (req, res) => {
  try {
    await authService.updateUserInfo(req.userId, req.body);
    response.success(res, {}, '更新成功');
  } catch (error) {
    logger.error('更新用户信息错误:', error);
    response.error(res, error.message);
  }
};

const sendSms = async (req, res) => {
  try {
    const { phone, mobile } = req.body;
    const phoneNumber = phone || mobile;
    
    if (!phoneNumber || !/^1[3-9]\d{9}$/.test(phoneNumber)) {
      return response.badRequest(res, '请输入正确的手机号');
    }
    
    const result = await smsService.sendSMS(phoneNumber);
    // 开发环境下返回验证码方便调试
    const responseData = result.code ? { code: result.code } : {};
    response.success(res, responseData, '发送成功');
  } catch (error) {
    logger.error('发送验证码错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const loginMobile = async (req, res) => {
  try {
    const { mobile, phone, code, deviceId, platform } = req.body;
    const mobileNumber = phone || mobile;
    
    if (!mobileNumber || !code) {
      return response.badRequest(res, '手机号和验证码不能为空');
    }
    
    const result = await authService.loginWithMobile(mobileNumber, code, deviceId, platform);
    response.success(res, result, '登录成功');
  } catch (error) {
    logger.error('手机号登录错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const loginThird = async (req, res) => {
  try {
    const { type, code, encryptedData, iv } = req.body;
    
    if (!type || !code) {
      return response.badRequest(res, '登录类型和授权码不能为空');
    }
    
    const result = await authService.loginWithThird(type, code, encryptedData, iv);
    response.success(res, result, '登录成功');
  } catch (error) {
    logger.error('第三方登录错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const follow = async (req, res) => {
  try {
    const { targetUserId, action = 1 } = req.body;
    
    if (!targetUserId) {
      return response.badRequest(res, '目标用户ID不能为空');
    }
    
    const result = await authService.followUser(req.userId, targetUserId, Number(action));
    response.success(res, result, action === 1 ? '关注成功' : '取消关注成功');
  } catch (error) {
    logger.error('关注用户错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const getFans = async (req, res) => {
  try {
    const { User, UserFollow } = require('../models');
    const { parseQuery } = require('../utils/helper');
    
    const userId = req.query.userId || req.userId;
    const { page, pageSize, offset } = parseQuery(req.query);
    
    const follows = await UserFollow.findAndCountAll({
      where: { following_id: userId },
      offset,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    });
    
    const fans = await Promise.all(follows.rows.map(async (follow) => {
      const user = await User.findByPk(follow.follower_id);
      const isFollow = await UserFollow.findOne({
        where: { follower_id: req.userId, following_id: follow.follower_id }
      });
      
      return {
        userId: user?.id,
        nickname: user?.nickname || '',
        avatar: user?.avatar || '',
        level: user?.lv || 1,
        isFollow: !!isFollow
      };
    }));
    
    response.success(res, {
      total: follows.count,
      list: fans
    });
  } catch (error) {
    logger.error('获取粉丝列表错误:', error);
    response.error(res, error.message);
  }
};

const getFollows = async (req, res) => {
  try {
    const { User, UserFollow } = require('../models');
    const { parseQuery } = require('../utils/helper');
    
    const userId = req.query.userId || req.userId;
    const { page, pageSize, offset } = parseQuery(req.query);
    
    const follows = await UserFollow.findAndCountAll({
      where: { follower_id: userId },
      offset,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    });
    
    const list = await Promise.all(follows.rows.map(async (follow) => {
      const user = await User.findByPk(follow.following_id);
      const isFollow = await UserFollow.findOne({
        where: { follower_id: req.userId, following_id: follow.following_id }
      });
      
      return {
        userId: user?.id,
        nickname: user?.nickname || '',
        avatar: user?.avatar || '',
        level: user?.lv || 1,
        isFollow: !!isFollow
      };
    }));

    response.success(res, {
      total: follows.count,
      list
    });
  } catch (error) {
    logger.error('获取关注列表错误:', error);
    response.error(res, error.message);
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: refreshTokenStr } = req.body;
    
    if (!refreshTokenStr) {
      return response.badRequest(res, 'refresh token不能为空');
    }
    
    const result = await authService.refreshToken(refreshTokenStr);
    response.success(res, result, '刷新token成功');
  } catch (error) {
    logger.error('刷新token错误:', error);
    if (error.message === '无效的refresh token' || error.message === 'refresh token不能为空') {
      response.unprocessableEntity(res, error.message);
    } else {
      response.error(res, '刷新token失败');
    }
  }
};

const checkFollow = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return response.badRequest(res, '用户ID不能为空');
    }

    const isFollow = await UserFollow.findOne({
      where: { follower_id: req.userId, following_id: parseInt(userId) }
    });

    response.success(res, { isFollowing: !!isFollow });
  } catch (error) {
    logger.error('检查关注状态错误:', error);
    response.error(res, error.message);
  }
};

const submitRealName = async (req, res) => {
  try {
    const { realName, idCard, front, back } = req.body;
    if (!realName || !idCard || !front || !back) {
      return response.badRequest(res, '姓名、身份证号及正反面照片不能为空');
    }
    if (!/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(String(idCard))) {
      return response.badRequest(res, '身份证号格式不正确');
    }
    const user = await User.findByPk(req.userId);
    if (!user) {
      return response.error(res, '用户不存在');
    }
    await user.update({
      real_name: realName,
      id_card: idCard,
      real_name_front: front,
      real_name_back: back,
      real_name_status: 1,
      real_name_time: Math.floor(Date.now() / 1000)
    });
    response.success(res, { status: 1 }, '认证信息已提交，等待审核');
  } catch (error) {
    logger.error('实名认证提交错误:', error);
    response.error(res, error.message);
  }
};

const getRealNameStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return response.error(res, '用户不存在');
    }
    response.success(res, {
      status: user.real_name_status || 0,
      realName: user.real_name ? String(user.real_name).replace(/.(?=.{1})/g, '*') : '',
      idCard: user.id_card ? String(user.id_card).replace(/^(.{3}).*(.{4})$/, '$1***********$2') : '',
      time: user.real_name_time || 0
    });
  } catch (error) {
    logger.error('查询实名状态错误:', error);
    response.error(res, error.message);
  }
};

// 点赞记录：谁赞过我的动态
const getLikes = async (req, res) => {
  try {
    const posts = await Post.findAll({ where: { user_id: req.userId }, attributes: ['id'] });
    const postIds = posts.map(p => p.id);
    if (!postIds.length) {
      return response.success(res, { list: [], total: 0 });
    }
    const likes = await PostLike.findAll({
      where: { post_id: { [Op.in]: postIds } },
      order: [['create_time', 'DESC']],
      limit: 200
    });
    const userIds = [...new Set(likes.map(l => l.user_id))];
    const users = userIds.length
      ? await User.findAll({ where: { id: { [Op.in]: userIds } }, attributes: ['id', 'nickname', 'avatar'] })
      : [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const list = likes.map(l => ({
      userId: l.user_id,
      nickname: userMap[l.user_id]?.nickname || '',
      avatar: userMap[l.user_id]?.avatar || '',
      postId: l.post_id,
      time: l.create_time
    }));
    response.success(res, { list, total: list.length });
  } catch (error) {
    logger.error('获取点赞记录错误:', error);
    response.error(res, error.message);
  }
};

// 访客记录：谁访问过我的主页
const getVisitors = async (req, res) => {
  try {
    const visits = await UserVisit.findAll({
      where: { user_id: req.userId },
      order: [['create_time', 'DESC']],
      limit: 100
    });
    const visitorIds = [...new Set(visits.map(v => v.visitor_id))];
    const users = visitorIds.length
      ? await User.findAll({ where: { id: { [Op.in]: visitorIds } }, attributes: ['id', 'nickname', 'avatar'] })
      : [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const list = visits.map(v => ({
      userId: v.visitor_id,
      nickname: userMap[v.visitor_id]?.nickname || '',
      avatar: userMap[v.visitor_id]?.avatar || '',
      time: v.create_time
    }));
    response.success(res, { list, total: list.length });
  } catch (error) {
    logger.error('获取访客记录错误:', error);
    response.error(res, error.message);
  }
};

// 记录一次主页访问（同访问者去重，更新最近时间）
const recordVisit = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return response.badRequest(res, '目标用户ID不能为空');
    }
    const targetId = parseInt(targetUserId);
    if (targetId === req.userId) {
      return response.success(res, {}, 'ok');
    }
    const now = Math.floor(Date.now() / 1000);
    const exist = await UserVisit.findOne({ where: { user_id: targetId, visitor_id: req.userId } });
    if (exist) {
      await exist.update({ create_time: now });
    } else {
      await UserVisit.create({ user_id: targetId, visitor_id: req.userId, create_time: now });
    }
    response.success(res, {}, 'ok');
  } catch (error) {
    logger.error('记录访问错误:', error);
    response.error(res, error.message);
  }
};

// ===== 用户偏好/装扮数据（服务端持久化，替代纯前端 localStorage） =====
const getPref = async (req, res) => {
  try {
    const row = await UserPref.findOne({ where: { user_id: req.userId } });
    let data = {};
    if (row && row.data) {
      try { data = JSON.parse(row.data); } catch (e) { data = {}; }
    }
    response.success(res, { data });
  } catch (error) {
    logger.error('获取用户偏好错误:', error);
    response.error(res, error.message);
  }
};

const savePref = async (req, res) => {
  try {
    const { data, spend } = req.body;
    const spendNum = Number(spend) || 0;
    if (spendNum > 0) {
      const user = await User.findByPk(req.userId);
      if (!user) return response.error(res, '用户不存在');
      if (Number(user.money) < spendNum) {
        return response.unprocessableEntity(res, '余额不足');
      }
      await user.decrement('money', { by: spendNum });
    }
    const now = Math.floor(Date.now() / 1000);
    const row = await UserPref.findOne({ where: { user_id: req.userId } });
    let merged = {};
    if (row && row.data) {
      try { merged = JSON.parse(row.data) || {}; } catch (e) { merged = {}; }
    }
    Object.assign(merged, data || {});
    const payload = JSON.stringify(merged);
    if (row) {
      await row.update({ data: payload, update_time: now });
    } else {
      await UserPref.create({ user_id: req.userId, data: payload, update_time: now });
    }
    const fresh = await User.findByPk(req.userId, { attributes: ['money'] });
    response.success(res, { balance: fresh ? Number(fresh.money) : undefined }, '已保存');
  } catch (error) {
    logger.error('保存用户偏好错误:', error);
    response.error(res, error.message);
  }
};

module.exports = {
  login,
  register,
  resetPassword,
  getUserInfo,
  updateUserInfo,
  sendSms,
  loginMobile,
  loginThird,
  follow,
  getFans,
  getFollows,
  checkFollow,
  refreshToken,
  submitRealName,
  getRealNameStatus,
  getLikes,
  getVisitors,
  recordVisit,
  getPref,
  savePref
};
