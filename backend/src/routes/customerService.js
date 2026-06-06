const express = require('express');
const router = express.Router();
const { CustomerService, ChatMessage } = require('../models');
const response = require('../utils/response');
const logger = require('../utils/logger');

// 获取客服列表
router.get('/list', async (req, res) => {
  try {
    const { status, online } = req.query;
    const where = {};
    
    if (status !== undefined) {
      where.status = parseInt(status);
    }
    if (online !== undefined) {
      where.online = online === 'true';
    }
    
    const services = await CustomerService.findAll({ where });
    
    res.json({
      code: 200,
      message: '获取成功',
      data: services
    });
  } catch (error) {
    logger.error('获取客服列表失败:', error);
    response.error(res, '获取客服列表失败');
  }
});

// 获取单个客服信息
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const service = await CustomerService.findOne({
      where: { userId: parseInt(id) }
    });
    
    if (!service) {
      return response.notFound(res, '客服不存在');
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: service
    });
  } catch (error) {
    logger.error('获取客服信息失败:', error);
    response.error(res, '获取客服信息失败');
  }
});

// 获取与客服的聊天记录
router.get('/chat/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const userId = req.query.userId || 1; // 默认用户ID
    const { limit = 50, offset = 0 } = req.query;
    
    // 获取用户和该客服之间的所有消息
    const messages = await ChatMessage.findAll({
      where: {
        user_id: parseInt(userId),
        customer_service_id: parseInt(customerId)
      },
      order: [['create_time', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      code: 200,
      message: '获取成功',
      data: messages.reverse() // 按时间正序返回
    });
  } catch (error) {
    logger.error('获取聊天记录失败:', error);
    response.error(res, '获取聊天记录失败');
  }
});

// 发送消息给客服
router.post('/message', async (req, res) => {
  try {
    const { userId, customerServiceId, message, messageType = 'text' } = req.body;
    
    if (!userId || !customerServiceId || !message) {
      return response.badRequest(res, '缺少必要参数');
    }
    
    // 获取客服信息
    const customerService = await CustomerService.findOne({
      where: { userId: parseInt(customerServiceId) }
    });
    
    // 创建消息
    const newMessage = await ChatMessage.create({
      user_id: parseInt(userId),
      customer_service_id: parseInt(customerServiceId),
      customer_service_name: customerService ? customerService.name : '客服',
      sender_type: 'user',
      sender_id: parseInt(userId),
      sender_name: '用户',
      sender_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${userId}`,
      message: message,
      message_type: messageType,
      status: 'sent'
    });
    
    // 模拟客服自动回复（延迟3秒）
    setTimeout(async () => {
      const replies = [
        '您好，感谢您的咨询，我会尽快为您解答。',
        '好的，我明白了，请稍等。',
        '这个问题我这边正在处理中，请耐心等待。',
        '请问还有其他问题吗？',
        '好的，祝您生活愉快！'
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      
      await ChatMessage.create({
        user_id: parseInt(userId),
        customer_service_id: parseInt(customerServiceId),
        customer_service_name: customerService ? customerService.name : '客服',
        sender_type: 'customer_service',
        sender_id: parseInt(customerServiceId),
        sender_name: customerService ? customerService.name : '客服',
        sender_avatar: customerService ? customerService.avatar : '',
        message: randomReply,
        message_type: 'text',
        status: 'sent'
      });
    }, 3000);
    
    res.json({
      code: 200,
      message: '发送成功',
      data: newMessage
    });
  } catch (error) {
    logger.error('发送消息失败:', error);
    response.error(res, '发送消息失败');
  }
});

// 获取未读消息数
router.get('/unread/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const messages = await ChatMessage.findAll({
      where: {
        user_id: parseInt(userId),
        sender_type: 'customer_service',
        status: 'sent'
      }
    });
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        unreadCount: messages.length
      }
    });
  } catch (error) {
    logger.error('获取未读消息数失败:', error);
    response.error(res, '获取未读消息数失败');
  }
});

// 更新客服在线状态（仅管理员）
router.put('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { online, status } = req.body;
    
    const updateData = {};
    if (online !== undefined) updateData.online = online;
    if (status !== undefined) updateData.status = parseInt(status);
    
    const result = await CustomerService.update(updateData, {
      where: { userId: parseInt(id) }
    });
    
    if (result[0] === 0) {
      return response.notFound(res, '客服不存在');
    }
    
    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    logger.error('更新客服状态失败:', error);
    response.error(res, '更新客服状态失败');
  }
});

// 创建新客服
router.post('/', async (req, res) => {
  try {
    const { name, avatar, role, description } = req.body;
    
    if (!name) {
      return response.badRequest(res, '客服名称不能为空');
    }
    
    const newService = await CustomerService.create({
      name,
      avatar: avatar || '',
      role: role || 'normal',
      description: description || '',
      online: false,
      status: 1
    });
    
    res.json({
      code: 200,
      message: '创建成功',
      data: newService
    });
  } catch (error) {
    logger.error('创建客服失败:', error);
    response.error(res, '创建客服失败');
  }
});

module.exports = router;
