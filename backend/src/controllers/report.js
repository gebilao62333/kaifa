const { reportService } = require('../services');
const response = require('../utils/response');
const logger = require('../utils/logger');

const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, images } = req.body;
    
    if (!targetType || !targetId || !reason) {
      return response.badRequest(res, '举报类型、目标和原因不能为空');
    }
    
    const result = await reportService.createReport(
      req.userId,
      parseInt(targetType),
      parseInt(targetId),
      reason,
      images || []
    );
    response.created(res, result, '举报已提交');
  } catch (error) {
    logger.error('提交举报错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const getReportList = async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const result = await reportService.getReportList(
      req.userId,
      status !== undefined && status !== '' ? parseInt(status) : undefined,
      parseInt(page),
      parseInt(pageSize)
    );
    response.success(res, result);
  } catch (error) {
    logger.error('获取举报列表错误:', error);
    response.error(res, error.message);
  }
};

const handleReport = async (req, res) => {
  try {
    const { reportId, action, result: handleResult } = req.body;
    
    if (!reportId) {
      return response.badRequest(res, '举报ID不能为空');
    }
    
    await reportService.handleReport(req.userId, parseInt(reportId), action, handleResult);
    response.success(res, {}, '处理成功');
  } catch (error) {
    logger.error('处理举报错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const getReportDetail = async (req, res) => {
  try {
    const { reportId } = req.query;
    if (!reportId) {
      return response.badRequest(res, '举报ID不能为空');
    }

    const report = await reportService.getReportDetail(req.userId, parseInt(reportId));
    response.success(res, report);
  } catch (error) {
    logger.error('获取举报详情错误:', error);
    if (error.message === '举报不存在') {
      response.notFound(res, error.message);
    } else if (error.message === '无权查看该举报') {
      response.forbidden(res, error.message);
    } else {
      response.error(res, error.message);
    }
  }
};

module.exports = {
  createReport,
  getReportList,
  getReportDetail,
  handleReport
};
