const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat');
const { authMiddleware, validate, LIMITS } = require('../middlewares');
const blockCheck = require('../middlewares/blockCheck');

// 《未完成事项清单》B-13：聊天写接口统一入参校验（此前只靠控制器零散判空）
const sendMessageSchema = {
  required: ['targetUserId', 'content'],
  fields: {
    targetUserId: { type: 'integer', min: 1, max: LIMITS.ID_MAX },
    content: { type: 'string', minLength: 1, maxLength: 2000 },
    type: { type: 'integer', min: 0, max: 10 },
    mediaUrl: { type: 'string', maxLength: 512 },
    duration: { type: 'integer', min: 0, max: 3600 }
  }
};
const revokeMessageSchema = {
  required: ['messageId'],
  fields: { messageId: { type: 'integer', min: 1, max: LIMITS.ID_MAX } }
};
const markReadSchema = {
  required: ['targetUserId'],
  fields: { targetUserId: { type: 'integer', min: 1, max: LIMITS.ID_MAX } }
};

router.get('/list', authMiddleware, chatController.getChatList);
router.get('/messages', authMiddleware, chatController.getMessages);
router.post('/send', authMiddleware, validate(sendMessageSchema), blockCheck, chatController.sendMessage);
router.post('/revoke', authMiddleware, validate(revokeMessageSchema), chatController.revokeMessage);
router.post('/mark-read', authMiddleware, validate(markReadSchema), chatController.markAsRead);

module.exports = router;
