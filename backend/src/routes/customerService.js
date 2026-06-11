const express = require('express');
const router = express.Router();
const csController = require('../controllers/customerService');

// 获取客服列表
router.get('/list', csController.getServiceList);

// 获取与客服的聊天记录
router.get('/chat/:customerId', csController.getChatHistory);

// 获取未读消息数
router.get('/unread/:userId', csController.getUnreadCount);

// 获取单个客服信息
router.get('/:id', csController.getServiceDetail);

// 发送消息给客服
router.post('/message', csController.sendMessage);

// 更新客服在线状态
router.put('/status/:id', csController.updateServiceStatus);

// 创建新客服
router.post('/', csController.createService);

module.exports = router;
