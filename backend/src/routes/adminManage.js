const express = require('express');
const router = express.Router();
const adminManageController = require('../controllers/adminManage.js');
const { adminAuth, requirePermission, adminLoginLimiter } = require('../middlewares');

// 登录接口无需认证，但要限流（审计 H-3：与 /api/admin/login 是同一个后台口令入口）
router.post('/login', adminLoginLimiter, adminManageController.adminLogin);

// 统一使用 middlewares 中的 adminAuth（与 /api/admin 路由同一套鉴权口径）
router.use(adminAuth);

router.get('/current', adminManageController.getCurrentAdmin);

// 审计 H-5：后台登出（把本次会话的令牌写进吊销名单）
router.post('/logout', adminManageController.adminLogout);

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
