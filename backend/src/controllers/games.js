const { gamesService } = require('../services');
const response = require('../utils/response');
const logger = require('../utils/logger');

const getCategories = async (req, res) => {
  try {
    const result = await gamesService.getCategories();
    response.success(res, result);
  } catch (error) {
    logger.error('获取游戏分类错误:', error);
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
    logger.error('获取陪玩师列表错误:', error);
    response.error(res, error.message);
  }
};

const createOrder = async (req, res) => {
  try {
    const { targetUserId, gameId, num = 1, price } = req.body;
    
    if (!gameId) {
      return response.badRequest(res, '游戏ID不能为空');
    }
    // 不传 targetUserId 视为派单大厅悬赏单，此时必须提供单价
    if (!targetUserId && !price) {
      return response.badRequest(res, '请选择陪玩师或填写悬赏单价');
    }
    
    const result = await gamesService.createOrder(
      req.userId,
      targetUserId ? parseInt(targetUserId) : 0,
      parseInt(gameId),
      parseInt(num),
      price
    );
    response.success(res, result, '下单成功');
  } catch (error) {
    logger.error('创建订单错误:', error);
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
    logger.error('抢单错误:', error);
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
    logger.error('开始陪玩错误:', error);
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
    logger.error('完成订单错误:', error);
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
    logger.error('取消订单错误:', error);
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
    logger.error('获取订单列表错误:', error);
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
    logger.error('申请陪玩师错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const getApplyStatus = async (req, res) => {
  try {
    const result = await gamesService.getApplyStatus(req.userId);
    response.success(res, result);
  } catch (error) {
    logger.error('获取申请状态错误:', error);
    response.error(res, error.message);
  }
};

const searchCompanions = async (req, res) => {
  try {
    const { keyword, gameId, page = 1, pageSize = 20 } = req.query;
    const result = await gamesService.searchCompanions(
      keyword || null,
      gameId ? parseInt(gameId) : null,
      parseInt(page),
      parseInt(pageSize)
    );
    response.success(res, result);
  } catch (error) {
    logger.error('搜索陪玩师错误:', error);
    response.error(res, error.message);
  }
};

const getCompanionDetail = async (req, res) => {
  try {
    const { companionId } = req.params;
    if (!companionId) {
      return response.badRequest(res, '陪玩师ID不能为空');
    }

    const companion = await gamesService.getCompanionDetail(parseInt(companionId));
    response.success(res, companion);
  } catch (error) {
    logger.error('获取陪玩师详情错误:', error);
    if (error.message === '陪玩师不存在') {
      response.notFound(res, error.message);
    } else {
      response.error(res, error.message);
    }
  }
};

const evaluateOrder = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    if (!orderId || !rating) {
      return response.badRequest(res, '订单ID和评分不能为空');
    }

    const result = await gamesService.evaluateOrder(req.userId, parseInt(orderId), parseInt(rating), comment);
    response.success(res, result, '评价成功');
  } catch (error) {
    logger.error('评价订单错误:', error);
    if (error.message === '订单不存在') {
      response.notFound(res, error.message);
    } else if (error.message === '无权评价他人订单') {
      response.forbidden(res, error.message);
    } else {
      response.error(res, error.message);
    }
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.query;
    if (!orderId) {
      return response.badRequest(res, '订单ID不能为空');
    }

    const order = await gamesService.getOrderDetail(parseInt(orderId));
    response.success(res, order);
  } catch (error) {
    logger.error('获取订单详情错误:', error);
    if (error.message === '订单不存在') {
      response.notFound(res, error.message);
    } else {
      response.error(res, error.message);
    }
  }
};

const getStatistics = async (req, res) => {
  try {
    const statistics = await gamesService.getStatistics(req.userId);
    response.success(res, statistics);
  } catch (error) {
    logger.error('获取统计数据错误:', error);
    response.error(res, error.message);
  }
};

// 派单大厅：待抢悬赏单列表
const getPool = async (req, res) => {
  try {
    const { gameId, page = 1, pageSize = 20 } = req.query;
    const result = await gamesService.getPool(
      req.userId,
      gameId ? parseInt(gameId) : null,
      parseInt(page),
      parseInt(pageSize)
    );
    response.success(res, result);
  } catch (error) {
    logger.error('获取派单池错误:', error);
    response.error(res, error.message);
  }
};

// 我的服务（陪玩师端）
const getMyServices = async (req, res) => {
  try {
    const result = await gamesService.getMyServices(req.userId);
    response.success(res, result);
  } catch (error) {
    logger.error('获取我的服务错误:', error);
    response.error(res, error.message);
  }
};

// 服务上下线切换
const toggleServiceStatus = async (req, res) => {
  try {
    const { serviceId } = req.body;

    if (!serviceId) {
      return response.badRequest(res, '服务ID不能为空');
    }

    const result = await gamesService.toggleServiceStatus(req.userId, parseInt(serviceId));
    response.success(res, result, result.status === 2 ? '已开启接单' : '已暂停接单');
  } catch (error) {
    logger.error('切换服务状态错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

module.exports = {
  getCategories,
  getCompanions,
  searchCompanions,
  createOrder,
  getPool,
  grabOrder,
  startOrder,
  completeOrder,
  cancelOrder,
  getOrders,
  applyAsCompanion,
  getApplyStatus,
  getMyServices,
  toggleServiceStatus,
  getCompanionDetail,
  evaluateOrder,
  getOrderDetail,
  getStatistics
};
