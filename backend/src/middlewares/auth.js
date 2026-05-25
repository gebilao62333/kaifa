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
  
  // 支持多种认证方式
  let isValidAdmin = false;
  
  // 方式1: x-admin-token
  const adminToken = req.headers['x-admin-token'];
  if (adminToken && adminToken === config.admin.token) {
    isValidAdmin = true;
  }
  
  // 方式2: Bearer token (从 admin/login 获得)
  const bearerToken = req.headers.authorization?.replace('Bearer ', '');
  if (bearerToken) {
    // 支持模拟token用于开发
    if (config.nodeEnv === 'development' && bearerToken.startsWith('mock-admin-token-')) {
      isValidAdmin = true;
    }
    // 也可以检查是否是有效的管理员登录token
    else if (bearerToken === config.admin.token) {
      isValidAdmin = true;
    }
    // 验证从 adminLogin 返回的 JWT token
    else {
      try {
        const decoded = verifyToken(bearerToken);
        // 检查是否是管理员token
        if (decoded && decoded.role === 'admin') {
          isValidAdmin = true;
        }
      } catch (err) {
        // token无效，继续尝试其他方式
      }
    }
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
