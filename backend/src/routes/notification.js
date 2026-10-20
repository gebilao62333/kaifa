const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification');
const { authMiddleware } = require('../middlewares');

router.get('/list', authMiddleware, notificationController.getList);
router.get('/unread-count', authMiddleware, notificationController.getUnreadCount);
router.post('/read', authMiddleware, notificationController.markRead);
router.post('/read-all', authMiddleware, notificationController.markAllRead);

module.exports = router;
