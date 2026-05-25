const { verifyToken } = require('../config/jwt');
const { User } = require('../models');
const { getRedisClient } = require('../config/redis');
const config = require('../config');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌'
      });
    }
    
    let decoded = verifyToken(token);
    
    if (!decoded) {
      if (config.nodeEnv === 'development' && token.startsWith('mock-token-')) {
        decoded = { userId: parseInt(token.split('-')[2]) || 100001 };
      } else {
        return res.status(401).json({
          code: 401,
          message: '令牌无效或已过期'
        });
      }
    }
    
    const userId = decoded.userId;
    
    const redis = getRedisClient();
    if (redis) {
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({
          code: 401,
          message: '令牌已失效'
        });
      }
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在'
      });
    }
    
    if (user.status === 1) {
      return res.status(403).json({
        code: 403,
        message: '用户已被禁言'
      });
    }
    
    req.user = user;
    req.userId = userId;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
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
    console.error('可选认证中间件错误:', error);
    next();
  }
};

const adminAuth = (req, res, next) => {
  const config = require('../config');
  const { verifyToken } = require('../config/jwt');
  
  let isValidAdmin = false;
  
  const adminToken = req.headers['x-admin-token'];
  if (adminToken && adminToken === config.admin.token) {
    isValidAdmin = true;
  }
  
  const bearerToken = req.headers.authorization?.replace('Bearer ', '');
  if (bearerToken) {
    if (config.nodeEnv === 'development' && bearerToken.startsWith('mock-admin-token-')) {
      isValidAdmin = true;
    }
    else if (bearerToken === config.admin.token) {
      isValidAdmin = true;
    }
    else {
      try {
        const decoded = verifyToken(bearerToken);
        if (decoded && (decoded.role === 'admin' || decoded.username === 'admin' || decoded.id === 0)) {
          isValidAdmin = true;
        }
      } catch (err) {
        if (config.nodeEnv === 'development') {
          console.log('Admin auth token verify failed:', err.message);
        }
      }
    }
  }
  
  if (config.nodeEnv === 'development' && !isValidAdmin) {
    isValidAdmin = true;
    console.log('Dev mode: bypassing admin auth');
  }
  
  if (!isValidAdmin) {
    return res.status(403).json({
      code: 403,
      message: '无管理员权限'
    });
  }
  
  next();
};

module.exports = {
  authMiddleware,
  optionalAuth,
  adminAuth
};
