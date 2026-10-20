const response = require('../utils/response');
const logger = require('../utils/logger');
const notificationService = require('../services/notificationCenterService');

const getList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await notificationService.list(req.userId, parseInt(page), parseInt(pageSize));
    response.success(res, result);
  } catch (error) {
    logger.error('获取通知列表错误:', error);
    response.error(res, error.message);
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.unreadCount(req.userId);
    response.success(res, { unread: count });
  } catch (error) {
    logger.error('获取未读通知错误:', error);
    response.error(res, error.message);
  }
};

const markRead = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return response.badRequest(res, '通知ID不能为空');
    await notificationService.markRead(req.userId, id);
    response.success(res, {}, '已读');
  } catch (error) {
    logger.error('标记通知已读错误:', error);
    response.error(res, error.message);
  }
};

const markAllRead = async (req, res) => {
  try {
    await notificationService.markAllRead(req.userId);
    response.success(res, {}, '全部已读');
  } catch (error) {
    logger.error('全部已读错误:', error);
    response.error(res, error.message);
  }
};

module.exports = { getList, getUnreadCount, markRead, markAllRead };
