const express = require('express');
const router = express.Router();
const adminManageController = require('../controllers/adminManage.js');
const { adminAuth, requirePermission } = require('../middlewares');

// 登录接口无需认证
router.post('/login', adminManageController.adminLogin);

// 统一使用 middlewares 中的 adminAuth（与 /api/admin 路由同一套鉴权口径）
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
