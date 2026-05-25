const { reportService } = require('../services');
const response = require('../utils/response');

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
    console.error('提交举报错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

const getReportList = async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    
    const mockReports = [
      {
        id: 1,
        reporter_id: 1001,
        reporter_nickname: '张三',
        target_type: 1,
        target_id: 2001,
        target_content: '这是一个违规帖子内容',
        reason: '包含广告信息',
        images: [],
        status: 0,
        handle_result: '',
        create_time: '2024-01-01 10:00:00'
      },
      {
        id: 2,
        reporter_id: 1002,
        reporter_nickname: '李四',
        target_type: 2,
        target_id: 3001,
        target_content: '这是一个违规用户',
        reason: '恶意骚扰',
        images: [],
        status: 0,
        handle_result: '',
        create_time: '2024-01-01 11:00:00'
      },
      {
        id: 3,
        reporter_id: 1003,
        reporter_nickname: '王五',
        target_type: 1,
        target_id: 2002,
        target_content: '这是一条违规评论',
        reason: '侮辱谩骂',
        images: [],
        status: 1,
        handle_result: '已处理，删除违规内容',
        create_time: '2024-01-01 12:00:00'
      }
    ];
    
    let filtered = [...mockReports];
    
    if (status !== undefined && status !== '') {
      filtered = filtered.filter(r => r.status === parseInt(status));
    }
    
    const total = filtered.length;
    const pageNum = parseInt(page);
    const size = parseInt(pageSize);
    const start = (pageNum - 1) * size;
    const end = start + size;
    const list = filtered.slice(start, end);
    
    response.success(res, {
      list,
      pagination: {
        page: pageNum,
        pageSize: size,
        total,
        totalPages: Math.ceil(total / size)
      }
    });
  } catch (error) {
    console.error('获取举报列表错误:', error);
    response.error(res, error.message);
  }
};

const handleReport = async (req, res) => {
  try {
    const { reportId, action, result: handleResult } = req.body;
    
    if (!reportId) {
      return response.badRequest(res, '举报ID不能为空');
    }
    
    response.success(res, {}, '处理成功');
  } catch (error) {
    console.error('处理举报错误:', error);
    response.unprocessableEntity(res, error.message);
  }
};

module.exports = {
  createReport,
  getReportList,
  handleReport
};
