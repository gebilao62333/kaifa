const { vipService } = require('../services');
const logger = require('../utils/logger');
const response = require('../utils/response');

const getVipPackages = async (req, res) => {
  try {
    const result = await vipService.getVipPackages();
    response.success(res, result);
  } catch (error) {
    logger.error('获取VIP套餐错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const getUserVipInfo = async (req, res) => {
  try {
    const result = await vipService.getUserVipInfo(req.userId);
    response.success(res, result);
  } catch (error) {
    logger.error('获取VIP信息错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const createVipOrder = async (req, res) => {
  try {
    const { packageId } = req.body;
    
    if (!packageId) {
      return response.badRequest(res, '套餐ID不能为空');
    }
    
    const result = await vipService.createVipOrder(req.userId, parseInt(packageId));
    response.success(res, result);
  } catch (error) {
    logger.error('创建VIP订单错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const completeVipOrder = async (req, res) => {
  try {
    const { orderNo, transactionId } = req.body;
    
    if (!orderNo) {
      return response.badRequest(res, '订单号不能为空');
    }
    
    const result = await vipService.completeVipOrder(orderNo, transactionId);
    response.success(res, result, '开通成功');
  } catch (error) {
    logger.error('完成VIP订单错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const getVipOrderStatus = async (req, res) => {
  try {
    const { orderNo } = req.query;
    
    if (!orderNo) {
      return response.badRequest(res, '订单号不能为空');
    }
    
    const result = await vipService.getVipOrderStatus(orderNo);
    response.success(res, result);
  } catch (error) {
    logger.error('查询VIP订单状态错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const getUserVipOrders = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    
    const result = await vipService.getUserVipOrders(
      req.userId,
      parseInt(page),
      parseInt(pageSize)
    );
    response.success(res, result);
  } catch (error) {
    logger.error('获取VIP订单列表错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

module.exports = {
  getVipPackages,
  getUserVipInfo,
  createVipOrder,
  completeVipOrder,
  getVipOrderStatus,
  getUserVipOrders
};