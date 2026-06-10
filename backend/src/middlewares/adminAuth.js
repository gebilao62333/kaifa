const { verifyToken } = require('../config/jwt');
const response = require('../utils/response');
const logger = require('../utils/logger');

let Admin, AdminRole;

try {
  const models = require('../models');
  Admin = models.Admin;
  AdminRole = models.AdminRole;
} catch (e) {
  logger.warn('AdminAuth middleware: models not available, using mock');
}

const DEFAULT_PERMISSIONS = [
  'dashboard', 'users', 'orders', 'withdraws', 'posts', 'reports', 'banners',
  'vip-packages', 'gift-management', 'gifts', 'recharges', 'games',
  'companion-applications', 'virtual-users', 'admins', 'admin-roles', 'settings', 'api'
];

/**
 * 管理员认证中间件
 * - 验证 Bearer token 的有效性
 * - 优先从数据库查询管理员信息，DB不可用时使用 Mock
 * - 注入 req.admin
 */
const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return response.unauthorized(res, '未提供认证令牌');
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return response.unauthorized(res, '未提供认证令牌');
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return response.unauthorized(res, '令牌已过期或无效');
    }
    
    let admin = null;

    // 优先从数据库查询
    if (Admin) {
      try {
        const adminId = decoded.id || 0;
        const dbAdmin = await Admin.findByPk(adminId, {
          attributes: { exclude: ['password'] }
        });

        if (dbAdmin) {
          // 同时查询角色权限
          let permissions = [];
          if (AdminRole && dbAdmin.role_id) {
            const role = await AdminRole.findByPk(dbAdmin.role_id);
            if (role && role.permissions) {
              try {
                permissions = JSON.parse(role.permissions);
              } catch (e) {
                permissions = [];
              }
            }
          }

          admin = {
            id: dbAdmin.id,
            username: dbAdmin.username,
            nickname: dbAdmin.nickname || dbAdmin.username,
            avatar: dbAdmin.avatar || '',
            email: dbAdmin.email || '',
            phone: dbAdmin.phone || '',
            role_id: dbAdmin.role_id,
            permissions: permissions.length > 0 ? permissions : DEFAULT_PERMISSIONS,
            status: dbAdmin.status
          };
        }
      } catch (dbError) {
        logger.warn('AdminAuth: DB query failed, falling back to mock:', dbError.message);
      }
    }

    // DB 不可用或无数据时使用 Mock（仅在 token payload 包含有效的 admin 标识时）
    if (!admin) {
      // 验证 payload 是否包含管理员标识
      const hasValidAdminPayload = decoded.role_id >= 1 || decoded.id >= 1;
      if (!hasValidAdminPayload) {
        return response.unauthorized(res, '令牌无效：缺少管理员标识');
      }

      admin = {
        id: decoded.id || 1,
        username: decoded.username || 'admin',
        nickname: '超级管理员',
        avatar: '',
        email: '',
        phone: '',
        role_id: decoded.role_id || 1,
        permissions: DEFAULT_PERMISSIONS,
        status: 1
      };
    }

    if (admin.status !== 1) {
      return response.forbidden(res, '账号已被禁用');
    }
    
    req.admin = admin;
    next();
  } catch (error) {
    logger.error('Admin auth error:', error);
    next(error);
  }
};

module.exports = adminAuth;
