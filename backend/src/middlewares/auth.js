const { verifyToken } = require('../config/jwt');
const { User } = require('../models');
const { getRedisClient } = require('../config/redis');
const config = require('../config');
const logger = require('../utils/logger');
const response = require('../utils/response');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // Dev mode auto-auth: 仅当 NODE_ENV 显式为 development 且 USE_MOCK_DB=true 时启用
    // 生产环境或使用真实数据库时，此功能自动禁用
    const isDevMockMode = config.nodeEnv === 'development' && config.useMockDb === true;
    
    if (isDevMockMode) {
      let userId = null;
      
      if (token) {
        const decoded = verifyToken(token);
        if (decoded) userId = decoded.userId;
      }
      
      if (!userId) {
        // 查找或创建 mock 用户
        let devUser = await User.findOne({ where: { nickname: 'dev-preview' } });
        if (!devUser) {
          devUser = await User.create({
            nickname: 'dev-preview',
            mobile: '13000000000',
            username: 'devpreview',
            sex: 1,
            lv: 5,
            vip: 1,
            vip_lv: 1,
            create_time: Math.floor(Date.now() / 1000),
            last_login_time: Math.floor(Date.now() / 1000)
          });
          logger.info('Dev preview 用户已创建:', devUser.id);
        }
        userId = devUser.id;
        req.user = devUser;
        req.userId = userId;
        req.token = token || 'dev-mock-token';
        return next();
      }
      
      // Token 有效，正常查询用户
      const user = await User.findByPk(userId);
      if (user) {
        req.user = user;
        req.userId = userId;
        req.token = token;
        return next();
      }
      
      // User not found in dev mode, fall back to mock
      logger.warn('Dev mode: user not found for userId:', userId, ', using mock');
      const devUser = await User.findOne({ where: { nickname: 'dev-preview' } });
      req.user = devUser;
      req.userId = devUser.id;
      req.token = token || 'dev-mock-token';
      return next();
    }
    
    // 生产环境：严格的认证流程
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
  
  // Dev mode: 仅当 NODE_ENV=development 且 USE_MOCK_DB=true 时允许便捷认证
  // 生产环境或使用真实数据库时，必须通过正规认证流程
  const isDevMockMode = config.nodeEnv === 'development' && config.useMockDb === true;
  
  if (isDevMockMode) {
    const adminToken = req.headers['x-admin-token'];
    if (adminToken && adminToken === 'dev-preview-token') {
      isValidAdmin = true;
    }
    const bearerToken = req.headers.authorization?.replace('Bearer ', '');
    if (bearerToken) {
      if (bearerToken === 'dev-preview-token' || bearerToken === config.admin?.token) {
        isValidAdmin = true;
      } else {
        try {
          const decoded = verifyToken(bearerToken);
          if (decoded) {
            isValidAdmin = true; // dev+mock 模式下任何合法 JWT 都放行
          }
        } catch (err) {
          // token verification failed
        }
      }
    }
    if (!isValidAdmin) {
      return response.forbidden(res, '无管理员权限');
    }
    return next();
  }
  
  // 生产环境：严格的管理员认证
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
