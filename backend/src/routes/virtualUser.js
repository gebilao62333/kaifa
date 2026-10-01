const express = require('express');
const router = express.Router();
const virtualUserController = require('../controllers/virtualUser');
const { authMiddleware, adminAuth } = require('../middlewares');

// 虚拟用户属于运营配置，增删改与状态切换仅限管理员；查询与聊天对登录用户开放
router.post('/', adminAuth, virtualUserController.createVirtualUser);

router.get('/', authMiddleware, virtualUserController.getAllVirtualUsers);

router.get('/:id', authMiddleware, virtualUserController.getVirtualUser);

router.put('/:id', adminAuth, virtualUserController.updateVirtualUser);

router.delete('/:id', adminAuth, virtualUserController.deleteVirtualUser);

router.post('/:id/status', adminAuth, virtualUserController.toggleOnlineStatus);

router.post('/:virtualUserId/chat', authMiddleware, virtualUserController.chatWithVirtualUser);

router.get('/:virtualUserId/history', authMiddleware, virtualUserController.getChatHistory);

router.delete('/:virtualUserId/context', authMiddleware, virtualUserController.clearContext);

module.exports = router;
