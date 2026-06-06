const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares');
const { getUserNotifications, markNotificationRead, markAllNotificationsRead } = require('../controllers/admin');

// 获取用户通知列表（需要登录）
router.get('/', authMiddleware, getUserNotifications);

// 标记单个通知已读
router.put('/:id/read', authMiddleware, markNotificationRead);

// 标记所有通知已读
router.put('/read-all', authMiddleware, markAllNotificationsRead);

module.exports = router;
