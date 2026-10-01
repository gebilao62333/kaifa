const express = require('express');
const router = express.Router();
const response = require('../utils/response');
const logger = require('../utils/logger');
const { authMiddleware } = require('../middlewares');
const { feedbackService } = require('../services');

// 提交反馈
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { type, content, images, contact } = req.body;
    const result = await feedbackService.submitFeedback(req.userId, {
      type,
      content,
      images,
      contact
    });
    response.success(res, result, '提交成功');
  } catch (error) {
    logger.error('提交反馈错误:', error);
    response.badRequest(res, error.message);
  }
});

// 我的反馈列表
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await feedbackService.getMyFeedbacks(req.userId, page, pageSize);
    response.success(res, result);
  } catch (error) {
    logger.error('获取反馈列表错误:', error);
    response.error(res, error.message);
  }
});

module.exports = router;
