const express = require('express');
const router = express.Router();
const adminManageController = require('../controllers/adminManage.js');
const logger = require('../utils/logger');
const { verifyToken } = require('../config/jwt');
const { requirePermission } = require('../middlewares/permission');

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ code: 401, message: '未提供认证令牌' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ code: 401, message: '令牌已过期或无效' });
    }

    // 严格校验管理员身份：令牌需包含管理员标识
    if (!decoded.roleId && decoded.role !== 'admin' && decoded.role_id !== 1) {
      return res.status(403).json({ code: 403, message: '无管理员权限' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    logger.error('Admin auth error:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

router.post('/login', adminManageController.adminLogin);

router.use(adminAuth);

router.get('/current', adminManageController.getCurrentAdmin);

// 管理员账号管理（需 admin:write 权限）
router.get('/admins', requirePermission('admin:write'), adminManageController.getAdminList);
router.post('/admins', requirePermission('admin:write'), adminManageController.createAdmin);
router.put('/admins/:id', requirePermission('admin:write'), adminManageController.updateAdmin);
router.put('/admins/:id/password', requirePermission('admin:write'), adminManageController.updateAdminPassword);
router.delete('/admins/:id', requirePermission('admin:write'), adminManageController.deleteAdmin);

// 角色管理（需 admin:write 权限）
router.get('/roles', requirePermission('admin:write'), adminManageController.getRoleList);
router.post('/roles', requirePermission('admin:write'), adminManageController.createRole);
router.put('/roles/:id', requirePermission('admin:write'), adminManageController.updateRole);
router.delete('/roles/:id', requirePermission('admin:write'), adminManageController.deleteRole);

// 权限定义列表（需 admin:write 权限）
router.get('/permissions', requirePermission('admin:write'), adminManageController.getPermissions);

module.exports = router;
