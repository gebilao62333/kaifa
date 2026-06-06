const { verifyToken } = require('../config/jwt');
const { User } = require('../models');
const { getRedisClient } = require('../config/redis');
const config = require('../config');
const logger = require('../utils/logger');
const response = require('../utils/response');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return response.unauthorized(res, '未提供认证令牌');
    }
    
    let decoded = verifyToken(token);
    
    if (!decoded) {
      return response.unauthorized(res, '令牌无效或已过期');
    }
    
    const userId = decoded.userId;
    
    const redis = getRedisClient();
    if (redis) {
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return response.unauthorized(res, '令牌已失效');
      }
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return response.unauthorized(res, '用户不存在');
    }
    
    if (user.status === 1) {
      return response.forbidden(res, '用户已被禁言');
    }
    
    req.user = user;
    req.userId = userId;
    req.token = token;
    
    next();
  } catch (error) {
    logger.error('认证中间件错误:', error);
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return next();
    }
    
    const user = await User.findByPk(decoded.userId);
    
    if (user) {
      req.user = user;
      req.userId = user.id;
    }
    
    next();
  } catch (error) {
    logger.error('可选认证中间件错误:', error);
    next();
  }
};

const adminAuth = (req, res, next) => {
  let isValidAdmin = false;
  
  const adminToken = req.headers['x-admin-token'];
  if (adminToken && adminToken === config.admin.token) {
    isValidAdmin = true;
  }
  
  const bearerToken = req.headers.authorization?.replace('Bearer ', '');
  if (bearerToken) {
    if (bearerToken === config.admin.token) {
      isValidAdmin = true;
    }
    else {
      try {
        const decoded = verifyToken(bearerToken);
        if (decoded && (decoded.role === 'admin' || decoded.username === 'admin' || decoded.id === 0)) {
          isValidAdmin = true;
        }
      } catch (err) {
        // token verification failed
      }
    }
  }
  
  if (!isValidAdmin) {
    return response.forbidden(res, '无管理员权限');
  }
  
  next();
};

module.exports = {
  authMiddleware,
  optionalAuth,
  adminAuth
};
