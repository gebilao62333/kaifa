const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat');
const { authMiddleware } = require('../middlewares');

router.get('/list', authMiddleware, chatController.getChatList);
router.get('/messages', authMiddleware, chatController.getMessages);
router.post('/send', authMiddleware, chatController.sendMessage);
router.post('/revoke', authMiddleware, chatController.revokeMessage);
router.post('/mark-read', authMiddleware, chatController.markAsRead);
router.post('/room/create', authMiddleware, chatController.createRoom);
router.get('/room/info', authMiddleware, chatController.getRoomInfo);
router.get('/rooms', chatController.getRooms);

module.exports = router;
