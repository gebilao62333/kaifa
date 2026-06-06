const { demandService } = require('../services');
const logger = require('../utils/logger');
const response = require('../utils/response');

const createDemand = async (req, res) => {
  try {
    const { serviceType, game, date, startTime, endTime, duration, budget, remark, offlineLocation } = req.body;

    if (!serviceType || !game || !date || !startTime || !endTime || !duration || !budget) {
      return response.badRequest(res, '必填字段不能为空');
    }

    const result = await demandService.createDemand(
      req.userId,
      serviceType,
      game,
      date,
      startTime,
      endTime,
      duration,
      budget,
      remark,
      offlineLocation
    );
    response.created(res, result, '需求发布成功');
  } catch (error) {
    logger.error('发布需求错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

const getDemandList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    
    const result = await demandService.getDemandList(req.userId, parseInt(page), parseInt(pageSize));
    response.success(res, result);
  } catch (error) {
    logger.error('获取需求列表错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const getDemandDetail = async (req, res) => {
  try {
    const { demandId } = req.query;
    
    if (!demandId) {
      return response.badRequest(res, '需求ID不能为空');
    }

    const result = await demandService.getDemandDetail(parseInt(demandId));
    response.success(res, result);
  } catch (error) {
    logger.error('获取需求详情错误:', error);
    logger.error('操作失败:', error);
    response.error(res, '操作失败');
  }
};

const cancelDemand = async (req, res) => {
  try {
    const { demandId } = req.body;
    
    if (!demandId) {
      return response.badRequest(res, '需求ID不能为空');
    }

    await demandService.cancelDemand(req.userId, parseInt(demandId));
    response.success(res, {}, '已取消需求');
  } catch (error) {
    logger.error('取消需求错误:', error);
    logger.error('参数验证失败:', error);
    response.unprocessableEntity(res, '参数验证失败');
  }
};

module.exports = {
  createDemand,
  getDemandList,
  getDemandDetail,
  cancelDemand
};
