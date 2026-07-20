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
    
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        code: 401,
        message: '令牌无效或已过期'
      });
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

  // 收集所有候选管理员令牌：Authorization: Bearer <token> 或 x-admin-token
  const bearerToken = req.headers.authorization?.replace('Bearer ', '');
  const adminToken = req.headers['x-admin-token'];
  const candidates = [bearerToken, adminToken].filter(Boolean);

  for (const token of candidates) {
    // 应急固定管理员令牌：仅当通过 ADMIN_TOKEN 环境变量显式配置强随机密文时生效
    if (config.admin && config.admin.token && token === config.admin.token) {
      req.admin = { id: 0, username: 'admin', role: 'admin', role_id: 1 };
      return next();
    }

    try {
      const decoded = verifyToken(token);
      // 严格校验：必须是管理员登录签发、且携带管理员角色声明的合法 JWT
      if (decoded && (decoded.role === 'admin' || decoded.role_id === 1)) {
        req.admin = decoded;
        return next();
      }
    } catch (err) {
      // 令牌无效，尝试下一个候选
    }
  }

  return res.status(403).json({
    code: 403,
    message: '无管理员权限'
  });
};

module.exports = {
  authMiddleware,
  optionalAuth,
  adminAuth
};
