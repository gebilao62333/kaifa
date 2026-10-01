const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report');
const { authMiddleware, adminAuth } = require('../middlewares');

router.post('/', authMiddleware, reportController.createReport);
// 举报列表/详情仅返回当前用户自己的数据
router.get('/list', authMiddleware, reportController.getReportList);
router.get('/detail', authMiddleware, reportController.getReportDetail);
// 处理举报属管理端操作，用户端不暴露（管理端走 /api/admin/reports/:id/handle）
router.post('/handle', adminAuth, reportController.handleReport);

module.exports = router;
