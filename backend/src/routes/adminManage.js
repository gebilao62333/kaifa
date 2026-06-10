const express = require('express');
const router = express.Router();
const adminManageController = require('../controllers/adminManage');
const adminAuth = require('../middlewares/adminAuth');

// 公开接口（无需认证）
router.post('/login', adminManageController.adminLogin);
router.post('/init', adminManageController.initAdmin);
router.post('/refresh-token', adminManageController.refreshAdminToken);

// 以下接口需要管理员认证
router.use(adminAuth);

router.get('/current', adminManageController.getCurrentAdmin);

router.get('/admins', adminManageController.getAdminList);
router.post('/admins', adminManageController.createAdmin);
router.put('/admins/:id', adminManageController.updateAdmin);
router.put('/admins/:id/password', adminManageController.updateAdminPassword);
router.delete('/admins/:id', adminManageController.deleteAdmin);

router.get('/roles', adminManageController.getRoleList);
router.post('/roles', adminManageController.createRole);
router.put('/roles/:id', adminManageController.updateRole);
router.delete('/roles/:id', adminManageController.deleteRole);

router.get('/permissions', adminManageController.getPermissions);

module.exports = router;
