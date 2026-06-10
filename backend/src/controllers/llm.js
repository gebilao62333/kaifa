const llmService = require('../services/llmService');
const response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * 机器人聊天接口
 * POST /api/llm/chat
 * Body: { messages: [{ role, content }], userId }
 */
const robotChat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return response.badRequest(res, '请提供消息内容');
    }

    // 限制消息长度防止滥用
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.content && lastMsg.content.length > 2000) {
      return response.badRequest(res, '消息内容过长，请精简后重试');
    }

    // 只保留最近 20 条历史
    const recentMessages = messages.slice(-20);

    const result = await llmService.chat(recentMessages);

    if (result.success) {
      response.success(res, { reply: result.content });
    } else {
      response.error(res, result.error);
    }
  } catch (error) {
    logger.error('LLM robot chat error:', error);
    response.error(res, '机器人服务异常');
  }
};

/**
 * 获取 LLM 公开配置（前端用于判断是否可用）
 * GET /api/llm/config
 */
const getLlmConfig = (req, res) => {
  try {
    const config = llmService.getPublicConfig();
    response.success(res, config);
  } catch (error) {
    logger.error('LLM getConfig error:', error);
    response.error(res, '获取配置失败');
  }
};

module.exports = {
  robotChat,
  getLlmConfig
};
