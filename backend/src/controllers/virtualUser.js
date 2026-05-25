const virtualUserService = require('../services/virtualUserService');
const response = require('../utils/response');
const logger = require('../utils/logger');

const createVirtualUser = async (req, res) => {
  try {
    const {
      username,
      nickname,
      avatar,
      role = 'default',
      personality,
      dialogueStyle = 'friendly',
      description,
      modelConfig = {},
      contextExpireTime = 3600,
      maxContextLength = 50,
      permissions = []
    } = req.body;

    if (!username || !nickname) {
      return response.badRequest(res, '用户名和昵称不能为空');
    }

    const result = await virtualUserService.createVirtualUser({
      username,
      nickname,
      avatar,
      role,
      personality,
      dialogueStyle,
      description,
      modelConfig,
      contextExpireTime,
      maxContextLength,
      permissions
    });

    response.created(res, result, '虚拟用户创建成功');
  } catch (error) {
    logger.error(`创建虚拟用户失败: ${error.message}`);
    response.unprocessableEntity(res, error.message);
  }
};

const getVirtualUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await virtualUserService.getVirtualUserById(parseInt(id));
    response.success(res, result);
  } catch (error) {
    logger.error(`获取虚拟用户失败: ${error.message}`);
    response.notFound(res, error.message);
  }
};

const getAllVirtualUsers = async (req, res) => {
  try {
    const result = await virtualUserService.getAllVirtualUsers(req.query);
    response.success(res, result);
  } catch (error) {
    logger.error(`获取虚拟用户列表失败: ${error.message}`);
    response.error(res, error.message);
  }
};

const updateVirtualUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await virtualUserService.updateVirtualUser(parseInt(id), req.body);
    response.success(res, result, '虚拟用户更新成功');
  } catch (error) {
    logger.error(`更新虚拟用户失败: ${error.message}`);
    response.unprocessableEntity(res, error.message);
  }
};

const deleteVirtualUser = async (req, res) => {
  try {
    const { id } = req.params;
    await virtualUserService.deleteVirtualUser(parseInt(id));
    response.success(res, {}, '虚拟用户删除成功');
  } catch (error) {
    logger.error(`删除虚拟用户失败: ${error.message}`);
    response.notFound(res, error.message);
  }
};

const toggleOnlineStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOnline } = req.body;
    const result = await virtualUserService.toggleOnlineStatus(parseInt(id), isOnline);
    response.success(res, result, isOnline ? '虚拟用户已上线' : '虚拟用户已下线');
  } catch (error) {
    logger.error(`更新虚拟用户状态失败: ${error.message}`);
    response.notFound(res, error.message);
  }
};

const chatWithVirtualUser = async (req, res) => {
  try {
    const { virtualUserId } = req.params;
    const { message, contextId } = req.body;

    if (!message) {
      return response.badRequest(res, '消息内容不能为空');
    }

    const userId = req.userId || 0;
    const result = await virtualUserService.generateResponse(
      parseInt(virtualUserId),
      userId,
      message,
      contextId
    );

    response.success(res, result);
  } catch (error) {
    logger.error(`虚拟用户聊天失败: ${error.message}`);
    response.unprocessableEntity(res, error.message);
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { virtualUserId } = req.params;
    const { contextId } = req.query;
    const userId = req.userId || 0;

    const result = await virtualUserService.getChatHistory(
      parseInt(virtualUserId),
      userId,
      contextId
    );

    response.success(res, result);
  } catch (error) {
    logger.error(`获取聊天记录失败: ${error.message}`);
    response.error(res, error.message);
  }
};

const clearContext = async (req, res) => {
  try {
    const { virtualUserId } = req.params;
    const { contextId } = req.query;
    const userId = req.userId || 0;

    await virtualUserService.clearContext(
      parseInt(virtualUserId),
      userId,
      contextId
    );

    response.success(res, {}, '上下文已清除');
  } catch (error) {
    logger.error(`清除上下文失败: ${error.message}`);
    response.error(res, error.message);
  }
};

module.exports = {
  createVirtualUser,
  getVirtualUser,
  getAllVirtualUsers,
  updateVirtualUser,
  deleteVirtualUser,
  toggleOnlineStatus,
  chatWithVirtualUser,
  getChatHistory,
  clearContext
};
