const express = require('express');
const router = express.Router();
const llmController = require('../controllers/llm');
const { authMiddleware } = require('../middlewares');

// 机器人聊天（需登录）
router.post('/chat', authMiddleware, llmController.robotChat);

// 获取 LLM 公开配置（不需登录，用于前端判断功能可用性）
router.get('/config', llmController.getLlmConfig);

module.exports = router;
