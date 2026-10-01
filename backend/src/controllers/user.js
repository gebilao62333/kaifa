const { authService, smsService } = require('../services');
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
  refreshToken
};
