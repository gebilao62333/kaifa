const { chatService } = require('../services');
const response = require('../utils/response');
const logger = require('../utils/logger');

const getChatList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await chatService.getChatList(req.userId, parseInt(page), parseInt(pageSize));
    response.success(res, result);
  } catch (error) {
    logger.error('获取聊天列表错误:', error);
    response.error(res, error.message);
  }
};

const getMessages = async (req, res) => {
  try {
    const { targetUserId, page = 1, pageSize = 20 } = req.query;
    
    if (!targetUserId) {
      return response.badRequest(res, '目标用户ID不能为空');
    }
    
    const result = await chatService.getChatMessages(
      req.userId,
      parseInt(targetUserId),
      parseInt(page),
      parseInt(pageSize)
    );
    response.success(res, result);
  } catch (error) {
    logger.error('获取聊天消息错误:', error);
    response.error(res, error.message);
  }
};

const sendMessage = async (req, res) => {
  try {
    const { targetUserId, content, type = 0, mediaUrl, duration } = req.body;
    
    if (!targetUserId || !content) {
      return response.badRequest(res, '接收者ID和内容不能为空');
    }
    
    const result = await chatService.sendMessage(
      req.userId,
      parseInt(targetUserId),
      content,
      parseInt(type),
      mediaUrl,
      duration ? parseInt(duration) : undefined
    );
    response.success(res, result, '发送成功');
  } catch (error) {
    logger.error('发送消息错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const revokeMessage = async (req, res) => {
  try {
    const { messageId } = req.body;
    
    if (!messageId) {
      return response.badRequest(res, '消息ID不能为空');
    }
    
    await chatService.revokeMessage(req.userId, parseInt(messageId));
    response.success(res, {}, '撤回成功');
  } catch (error) {
    logger.error('撤回消息错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const markAsRead = async (req, res) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return response.badRequest(res, '目标用户ID不能为空');
    }

    await chatService.markAsRead(req.userId, parseInt(targetUserId));
    response.success(res, {}, '已读');
  } catch (error) {
    logger.error('标记已读错误:', error);
    response.error(res, error.message);
  }
};

module.exports = {
  getChatList,
  getMessages,
  sendMessage,
  revokeMessage,
  markAsRead
};
