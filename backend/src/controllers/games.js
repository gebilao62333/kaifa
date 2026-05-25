const { gamesService } = require('../services');
const response = require('../utils/response');

const getCategories = async (req, res) => {
  try {
    const result = await gamesService.getCategories();
    response.success(res, result);
  } catch (error) {
    console.error('获取游戏分类错误:', error);
    response.error(res, error.message);
  }
};

const getCompanions = async (req, res) => {
  try {
    const { gameId, page = 1, pageSize = 20 } = req.query;
    const result = await gamesService.getCompanions(
      gameId ? parseInt(gameId) : null,
      parseInt(page),
      parseInt(pageSize)
    );
    response.success(res, result);
  } catch (error) {
    console.error('获取陪玩师列表错误:', error);
    response.error(res, error.message);
  }
};

const createOrder = async (req, res) => {
  try {
    const { targetUserId, gameId, num = 1 } = req.body;
    
    if (!targetUserId || !gameId) {
      return response.badRequest(res, '陪玩师ID和游戏ID不能为空');
    }
    
    const result = await gamesService.createOrder(
      req.userId,
      parseInt(targetUserId),
      parseInt(gameId),
      parseInt(num)
    );
    response.success(res, result, '下单成功');
  } catch (error) {
    console.error('创建订单错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const grabOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return response.badRequest(res, '订单ID不能为空');
    }
    
    const result = await gamesService.grabOrder(req.userId, parseInt(orderId));
    response.success(res, result, '抢单成功');
  } catch (error) {
    console.error('抢单错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const startOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return response.badRequest(res, '订单ID不能为空');
    }
    
    await gamesService.startOrder(req.userId, parseInt(orderId));
    response.success(res, {}, '已开始陪玩');
  } catch (error) {
    console.error('开始陪玩错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const completeOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return response.badRequest(res, '订单ID不能为空');
    }
    
    await gamesService.completeOrder(req.userId, parseInt(orderId));
    response.success(res, {}, '已完成陪玩');
  } catch (error) {
    console.error('完成订单错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId, role } = req.body;
    
    if (!orderId) {
      return response.badRequest(res, '订单ID不能为空');
    }
    
    await gamesService.cancelOrder(req.userId, parseInt(orderId), role);
    response.success(res, {}, '取消成功');
  } catch (error) {
    console.error('取消订单错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const getOrders = async (req, res) => {
  try {
    const { role, status, page = 1, pageSize = 20 } = req.query;
    
    const result = await gamesService.getOrders(
      req.userId,
      role || 'user',
      status !== undefined ? parseInt(status) : undefined,
      parseInt(page),
      parseInt(pageSize)
    );
    response.success(res, result);
  } catch (error) {
    console.error('获取订单列表错误:', error);
    response.error(res, error.message);
  }
};

const applyAsCompanion = async (req, res) => {
  try {
    const { gameId, price, tags } = req.body;
    
    if (!gameId || !price) {
      return response.badRequest(res, '游戏ID和价格不能为空');
    }
    
    await gamesService.applyAsCompanion(
      req.userId,
      parseInt(gameId),
      parseFloat(price),
      tags
    );
    response.success(res, {}, '申请已提交，等待审核');
  } catch (error) {
    console.error('申请陪玩师错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const getApplyStatus = async (req, res) => {
  try {
    const result = await gamesService.getApplyStatus(req.userId);
    response.success(res, result);
  } catch (error) {
    console.error('获取申请状态错误:', error);
    response.error(res, error.message);
  }
};

module.exports = {
  getCategories,
  getCompanions,
  createOrder,
  grabOrder,
  startOrder,
  completeOrder,
  cancelOrder,
  getOrders,
  applyAsCompanion,
  getApplyStatus
};
