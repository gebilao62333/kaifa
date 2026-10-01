const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const { retry } = require('../utils/helper');

/**
 * 调用 OpenAI 兼容的 Chat Completions 接口生成回复。
 * 兼容：OpenAI / DeepSeek / 通义千问(兼容模式) / 智谱 / Kimi 等。
 * @param {Object} options
 * @param {string} options.systemPrompt 人设 system prompt
 * @param {Array<{role: string, content: string}>} options.messages 对话上下文（user/assistant 交替）
 * @returns {Promise<string|null>} 生成的回复文本；未配置或调用失败时返回 null（由调用方决定降级策略）
 */
const generateReply = async ({ systemPrompt, messages = [] }) => {
  if (!config.llm.enabled || !config.llm.apiKey) {
    logger.info('[LLM] 未启用或未配置 API Key，跳过 LLM 调用');
    return null;
  }

  const payload = {
    model: config.llm.model,
    temperature: 0.8,
    max_tokens: 500,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ]
  };

  try {
    const response = await retry(() => axios.post(
      `${config.llm.baseUrl}/chat/completions`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${config.llm.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: config.llm.timeoutMs
      }
    ), config.llm.maxRetries + 1, 500);

    const content = response.data && response.data.choices && response.data.choices[0]
      && response.data.choices[0].message && response.data.choices[0].message.content;

    if (!content || typeof content !== 'string') {
      logger.error('[LLM] 响应缺少 choices[0].message.content');
      return null;
    }

    const trimmed = content.trim();
    logger.info(`[LLM] 调用成功，模型=${config.llm.model}，回复长度=${trimmed.length}`);
    return trimmed;
  } catch (error) {
    logger.error(`[LLM] 调用失败: ${error.message}`);
    return null;
  }
};

module.exports = {
  generateReply
};
