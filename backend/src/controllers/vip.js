const { vipService } = require('../services');
const response = require('../utils/response');

const getVipPackages = async (req, res) => {
  try {
    const result = await vipService.getVipPackages();
    response.success(res, result);
  } catch (error) {
    console.error('获取VIP套餐错误:', error);
    response.error(res, error.message);
  }
};

const getUserVipInfo = async (req, res) => {
  try {
    const result = await vipService.getUserVipInfo(req.userId);
    response.success(res, result);
  } catch (error) {
    console.error('获取VIP信息错误:', error);
    response.error(res, error.message);
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
    console.error('创建VIP订单错误:', error);
    response.unprocessableEntity(res, error.message);
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
    console.error('完成VIP订单错误:', error);
    response.unprocessableEntity(res, error.message);
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
    console.error('查询VIP订单状态错误:', error);
    response.error(res, error.message);
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
    console.error('获取VIP订单列表错误:', error);
    response.error(res, error.message);
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