const { isSuperAdmin, hasPermission } = require('../utils/permissions');

// 接口权限校验中间件：requirePermission('user:read')
const requirePermission = (perm) => {
  return (req, res, next) => {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({ code: 401, message: '未登录' });
    }
    if (isSuperAdmin(admin)) return next();
    if (hasPermission(admin.permissions, perm)) return next();
    // error 字段：管理端请求层据此区分「权限不足」与「账号/令牌失效」，前者不清本地登录态
    return res.status(403).json({ code: 403, error: 'PERMISSION_DENIED', message: `无权限操作，需要权限: ${perm}` });
  };
};

module.exports = { requirePermission };
