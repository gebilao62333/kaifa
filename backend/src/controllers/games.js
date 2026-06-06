const { gamesService } = require('../services');
const logger = require('../utils/logger');
const response = require('../utils/response');
const { Recommend } = require('../models');
const { Op } = require('sequelize');

const getCategories = async (req, res) => {
  try {
    const result = await gamesService.getCategories();
    response.success(res, result);
  } catch (error) {
    logger.error('获取游戏分类错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
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
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const getCompanionDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await gamesService.getCompanionDetail(parseInt(id));
    response.success(res, result);
  } catch (error) {
    logger.error('获取陪玩师详情错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
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
    logger.error('创建订单错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
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
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
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
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
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
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
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
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
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
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
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
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const getApplyStatus = async (req, res) => {
  try {
    const result = await gamesService.getApplyStatus(req.userId);
    response.success(res, result);
  } catch (error) {
    logger.error('获取申请状态错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

// 公共：获取首页推荐（仅返回进行中且未过期的用户）
const getPublicRecommendHome = async (req, res) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const records = await Recommend.findAll({
      where: {
        recommend_type: 'home',
        status: 1
      }
    });

    const list = records
      .filter(r => r.end_time === 0 || r.end_time > now)
      .sort((a, b) => {
        if (a.is_top && !b.is_top) return -1;
        if (!a.is_top && b.is_top) return 1;
        return a.sort_order - b.sort_order;
      })
      .map(r => ({
        userId: r.user_id,
        nickName: r.nickname,
        avatar: r.avatar,
        isTop: !!r.is_top,
        sortOrder: r.sort_order,
        isAdminRecommend: true
      }));

    response.success(res, { list, total: list.length });
  } catch (error) {
    logger.error('获取首页推荐错误:', error);
    response.error(res, '操作失败');
  }
};

// 公共：获取广场推荐
const getPublicRecommendSquare = async (req, res) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const records = await Recommend.findAll({
      where: {
        recommend_type: 'square',
        status: 1
      }
    });

    const list = records
      .filter(r => r.end_time === 0 || r.end_time > now)
      .sort((a, b) => {
        if (a.is_top && !b.is_top) return -1;
        if (!a.is_top && b.is_top) return 1;
        return a.sort_order - b.sort_order;
      })
      .map(r => ({
        userId: r.user_id,
        nickName: r.nickname,
        avatar: r.avatar,
        isTop: !!r.is_top,
        sortOrder: r.sort_order,
        isAdminRecommend: true
      }));

    response.success(res, { list, total: list.length });
  } catch (error) {
    logger.error('获取广场推荐错误:', error);
    response.error(res, '操作失败');
  }
};

module.exports = {
  getCategories,
  getCompanions,
  getCompanionDetail,
  createOrder,
  grabOrder,
  startOrder,
  completeOrder,
  cancelOrder,
  getOrders,
  applyAsCompanion,
  getApplyStatus,
  getPublicRecommendHome,
  getPublicRecommendSquare
};
