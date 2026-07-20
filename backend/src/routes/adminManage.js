const express = require('express');
const router = express.Router();
const adminManageController = require('../controllers/adminManage');
const { verifyToken } = require('../config/jwt');

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

    // 严格校验管理员角色：禁止普通用户令牌越权访问管理后台
    if (decoded.role !== 'admin' && decoded.role_id !== 1) {
      return res.status(403).json({ code: 403, message: '无管理员权限' });
    }

    if (decoded.status !== undefined && decoded.status !== 1) {
      return res.status(403).json({ code: 403, message: '账号已被禁用' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

router.post('/login', adminManageController.adminLogin);
router.get('/init', adminAuth, adminManageController.initAdmin);

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
