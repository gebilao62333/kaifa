const express = require('express');
const router = express.Router();
const adminManageController = require('../controllers/adminManage');
const { verifyToken } = require('../config/jwt');
const response = require('../utils/response');
const logger = require('../utils/logger');

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
    
    // 从Mock数据中查找管理员
    const admin = {
      id: decoded.id,
      username: 'admin',
      nickname: '超级管理员',
      role_id: 1,
      permissions: ['dashboard', 'users', 'orders', 'withdraws', 'posts', 'reports', 'banners', 'vip-packages', 'gift-management', 'gifts', 'recharges', 'games', 'companion-applications', 'virtual-users', 'admins', 'admin-roles', 'settings', 'api'],
      status: 1
    };
    
    if (!admin) {
      return response.unauthorized(res, '管理员不存在');
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

router.post('/login', adminManageController.adminLogin);
router.get('/init', adminManageController.initAdmin);

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
