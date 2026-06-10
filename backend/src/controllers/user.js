const { authService, smsService } = require('../services');
const logger = require('../utils/logger');
const response = require('../utils/response');
const { generateToken } = require('../config/jwt');
const config = require('../config');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return response.badRequest(res, '用户名和密码不能为空');
    }

    if (password.length < 6) {
      return response.badRequest(res, '密码至少6位');
    }

    const result = await authService.loginWithPassword(username, password);
    response.success(res, result, '登录成功');
  } catch (error) {
    logger.error('登录错误:', error);
    if (error.message === '用户不存在') {
      response.unprocessableEntity(res, '用户不存在', { username: ['用户不存在，请检查用户名或使用手机号登录'] });
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
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
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
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const updateUserInfo = async (req, res) => {
  try {
    await authService.updateUserInfo(req.userId, req.body);
    response.success(res, {}, '更新成功');
  } catch (error) {
    logger.error('更新用户信息错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const sendSms = async (req, res) => {
  try {
    const { mobile } = req.body;
    
    if (!mobile || !/^1[3-9]\d{9}$/.test(mobile)) {
      return response.badRequest(res, '请输入正确的手机号');
    }
    
    const result = await smsService.sendSMS(mobile);
    response.success(res, result, '发送成功');
  } catch (error) {
    logger.error('发送验证码错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const checkSmsConfig = async (req, res) => {
  try {
    const smsConfigured = config.nodeEnv === 'production' && !!config.sms.appId;
    const thirdPartyLoginEnabled = config.thirdPartyLoginEnabled !== false;
    response.success(res, { smsConfigured, thirdPartyLoginEnabled }, '获取成功');
  } catch (error) {
    logger.error('检查短信配置错误:', error);
    response.error(res, '获取短信配置失败');
  }
};

const loginMobile = async (req, res) => {
  try {
    const { mobile, code, deviceId, platform } = req.body;
    
    if (!mobile || !code) {
      return response.badRequest(res, '手机号和验证码不能为空');
    }
    
    const result = await authService.loginWithMobile(mobile, code, deviceId, platform);
    response.success(res, result, '登录成功');
  } catch (error) {
    logger.error('手机号登录错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const loginThird = async (req, res) => {
  try {
    // 检查第三方登录功能是否启用
    if (config.thirdPartyLoginEnabled === false) {
      return response.forbidden(res, '第三方登录功能已关闭');
    }
    
    const { type, code, encryptedData, iv } = req.body;
    
    if (!type || !code) {
      return response.badRequest(res, '登录类型和授权码不能为空');
    }
    
    const result = await authService.loginWithThird(type, code, encryptedData, iv);
    response.success(res, result, '登录成功');
  } catch (error) {
    logger.error('第三方登录错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const follow = async (req, res) => {
  try {
    const { targetUserId, action = 1 } = req.body;
    
    if (!targetUserId) {
      return response.badRequest(res, '目标用户ID不能为空');
    }
    
    const result = await authService.followUser(req.userId, targetUserId);
    response.success(res, result, action === 1 ? '关注成功' : '取消关注成功');
  } catch (error) {
    logger.error('关注用户错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const getFans = async (req, res) => {
  try {
    const { User, UserFollow } = require('../models');
    const { parseQuery } = require('../utils/helper');
    
    const userId = req.query.userId || req.userId;
    const { page, pageSize, offset } = parseQuery(req.query);
    
    const follows = await UserFollow.findAndCountAll({
      where: { target_user_id: userId },
      offset,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    });
    
    const fans = await Promise.all(follows.rows.map(async (follow) => {
      const user = await User.findByPk(follow.user_id);
      const isFollow = await UserFollow.findOne({
        where: { user_id: req.userId, target_user_id: follow.user_id }
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
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const getFollows = async (req, res) => {
  try {
    const { User, UserFollow } = require('../models');
    const { parseQuery } = require('../utils/helper');
    
    const userId = req.query.userId || req.userId;
    const { page, pageSize, offset } = parseQuery(req.query);
    
    const follows = await UserFollow.findAndCountAll({
      where: { user_id: userId },
      offset,
      limit: pageSize,
      order: [['create_time', 'DESC']]
    });
    
    const list = await Promise.all(follows.rows.map(async (follow) => {
      const user = await User.findByPk(follow.target_user_id);
      const isFollow = await UserFollow.findOne({
        where: { user_id: req.userId, target_user_id: follow.target_user_id }
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
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
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
      logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
    } else {
      response.error(res, '刷新token失败');
    }
  }
};

module.exports = {
  login,
  register,
  resetPassword,
  getUserInfo,
  updateUserInfo,
  sendSms,
  checkSmsConfig,
  loginMobile,
  loginThird,
  follow,
  getFans,
  getFollows,
  refreshToken
};
