// 管理员鉴权中间件：优先校验应急固定令牌，其次校验 JWT 中的管理员角色声明。
// 不依赖数据库 / Redis，使用配置中的密钥，保证独立可运行。
const config = require('../config');
const { verifyToken } = require('../config/jwt');

const adminAuth = (req, res, next) => {
  const bearerToken = req.headers.authorization?.replace('Bearer ', '');
  const adminToken = req.headers['x-admin-token'];
  const candidates = [bearerToken, adminToken].filter(Boolean);

  for (const token of candidates) {
    if (config.admin.token && token === config.admin.token) {
      req.admin = { id: 0, username: 'admin', role: 'admin' };
      return next();
    }
    try {
      const decoded = verifyToken(token);
      if (decoded && (decoded.role === 'admin' || decoded.role_id === 1)) {
        req.admin = decoded;
        return next();
      }
    } catch {
      // 尝试下一个候选
    }
  }

  return res.status(403).json({ code: 403, message: '无管理员权限' });
};

module.exports = { adminAuth };
