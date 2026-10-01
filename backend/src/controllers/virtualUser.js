const virtualUserService = require('../services/virtualUserService');
const response = require('../utils/response');
const logger = require('../utils/logger');

const createVirtualUser = async (req, res) => {
  try {
    const {
      name,
      avatar,
      gender = 0,
      age = 0,
      region,
      tags,
      intro,
      price_per_hour = 0,
      online_status = 0,
      is_recommend = 0,
      status = 1,
      tagIds = []
    } = req.body;

    if (!name) {
      return response.badRequest(res, '姓名不能为空');
    }

    const result = await virtualUserService.createVirtualUser({
      name,
      avatar,
      gender,
      age,
      region,
      tags,
      intro,
      price_per_hour,
      online_status,
      is_recommend,
      status,
      tagIds
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
    const { message } = req.body;
    const userId = req.userId || 0;

    if (!message) {
      return response.badRequest(res, '消息内容不能为空');
    }

    const result = await virtualUserService.chatWithVirtualUser(
      parseInt(virtualUserId),
      userId,
      message
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

    response.success(res, {}, '内容已清除');
  } catch (error) {
    logger.error(`清除内容失败: ${error.message}`);
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
