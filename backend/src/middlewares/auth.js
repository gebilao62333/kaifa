const { verifyToken } = require('../config/jwt');
const { User } = require('../models');
const { getRedisClient } = require('../config/redis');
const config = require('../config');
const logger = require('../utils/logger');

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
      // 审计 B-06：原实现把"Redis 超时/报错"和"未命中黑名单"都当成 null（fail-open），
      // 于是 Redis 一挂，已登出的 token 全部复活。现在区分两种情况：
      //   - 正常返回 null → 未拉黑，放行；
      //   - 查询失败/超时 → 按 AUTH_BLACKLIST_FAIL_MODE 处理，生产默认 fail-closed（503）。
      const failMode = process.env.AUTH_BLACKLIST_FAIL_MODE
        || (config.nodeEnv === 'production' ? 'closed' : 'open');

      let isBlacklisted = null;
      let redisFailed = false;
      try {
        isBlacklisted = await Promise.race([
          redis.get(`blacklist:${token}`),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Redis 黑名单查询超时')), 2000))
        ]);
      } catch (redisError) {
        redisFailed = true;
        logger.warn('[auth] 黑名单查询失败:', redisError.message);
      }

      if (redisFailed && failMode === 'closed') {
        return res.status(503).json({
          code: 503,
          message: '认证服务暂时不可用，请稍后重试'
        });
      }

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
    
    // status: 1=正常，其余=禁用；jinyan_time: 禁言截止时间戳，大于当前时间说明仍在禁言
    if (user.status !== 1) {
      return res.status(403).json({
        code: 403,
        message: '账号已被禁用'
      });
    }

    const now = Math.floor(Date.now() / 1000);
    if (user.jinyan_time && user.jinyan_time > now) {
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
    logger.error('认证中间件错误:', error);
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
    logger.error('可选认证中间件错误:', error);
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
      req.admin = { id: 0, username: 'admin', role: 'admin', role_id: 1, permissions: ['all'] };
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
