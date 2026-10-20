const express = require('express');
const router = express.Router();
const response = require('../utils/response');
const logger = require('../utils/logger');
const { parseQuery } = require('../utils/helper');
const noticeService = require('../services/noticeService');

// 公告 / 通知列表（公开）
// 《未完成事项清单》B-3：数据源改为 xn_notice（status=1 且处于有效期内），
// 后台通过 /api/admin/notices 增删改查，写操作后由 admin 控制器做 socket 全服广播（B-4）。
// 降级口径：表尚未迁移（或数据库短暂不可用）时返回空列表而不是 500——公告是可选展示内容，
// 不能因为运营配置缺失把公开首页打成 5xx；具体错误只进日志。
router.get('/list', async (req, res) => {
  const { page, pageSize } = parseQuery({ page: req.query.page, pageSize: req.query.pageSize });
  try {
    const result = await noticeService.listActive({ page, pageSize });
    response.success(res, result);
  } catch (error) {
    logger.error('获取公告列表错误:', error);
    response.success(res, {
      list: [],
      pagination: { page, pageSize, total: 0, totalPages: 0 }
    });
  }
});

module.exports = router;
