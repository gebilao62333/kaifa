const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * LLM 大模型服务
 * 支持任何 OpenAI 兼容的 API（OpenAI / DeepSeek / Moonshot / 本地模型等）
 */

const DEFAULT_CONFIG = {
  provider: 'openai',
  apiKey: '',
  apiEndpoint: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo',
  maxTokens: 1024,
  temperature: 0.7,
  systemPrompt: '你是一个友好、专业的陪玩助手，帮助用户解答问题、提供陪伴和娱乐服务。请用热情亲切的语气回复。'
};

let cachedConfig = { ...DEFAULT_CONFIG };

const getConfig = () => {
  try {
    // 清除 require 缓存以获取最新运行时配置
    delete require.cache[require.resolve('../config')];
    const config = require('../config');
    if (config.llm) {
      cachedConfig = {
        ...DEFAULT_CONFIG,
        enabled: config.llm.enabled || false,
        provider: config.llm.provider || DEFAULT_CONFIG.provider,
        apiKey: config.llm.apiKey || DEFAULT_CONFIG.apiKey,
        apiEndpoint: config.llm.apiEndpoint || DEFAULT_CONFIG.apiEndpoint,
        model: config.llm.model || DEFAULT_CONFIG.model,
        maxTokens: config.llm.maxTokens || DEFAULT_CONFIG.maxTokens,
        temperature: config.llm.temperature || DEFAULT_CONFIG.temperature,
        systemPrompt: config.llm.systemPrompt || DEFAULT_CONFIG.systemPrompt
      };
    }
  } catch (e) {
    // fallback to cached/defaults
  }
  return cachedConfig;
};

const postJson = (urlStr, headers, body) => {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const isHttps = url.protocol === 'https:';
    const transport = isHttps ? https : http;

    const postData = JSON.stringify(body);

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      },
      timeout: 30000
    };

    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data, error: 'JSON parse error' });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')); });

    req.write(postData);
    req.end();
  });
};

/**
 * 发送聊天消息到大模型
 * @param {Array} messages - 消息历史 [{ role: 'user'|'assistant'|'system', content: '...' }]
 * @returns {Promise<{ success: boolean, content: string, error?: string }>}
 */
const chat = async (messages) => {
  const cfg = getConfig();

  if (!cfg.enabled) {
    return { success: false, error: '大模型功能未启用，请在系统设置中开启' };
  }

  if (!cfg.apiKey) {
    return { success: false, error: 'API Key 未配置，请在系统设置中填写' };
  }

  // 构建带 system prompt 的完整消息
  const fullMessages = [
    { role: 'system', content: cfg.systemPrompt },
    ...messages.filter(m => m.role !== 'system')
  ];

  try {
    const chatUrl = `${cfg.apiEndpoint.replace(/\/$/, '')}/chat/completions`;

    const result = await postJson(chatUrl, {
      'Authorization': `Bearer ${cfg.apiKey}`
    }, {
      model: cfg.model,
      messages: fullMessages,
      max_tokens: cfg.maxTokens,
      temperature: cfg.temperature
    });

    if (result.status === 200 && result.data.choices && result.data.choices.length > 0) {
      const content = result.data.choices[0].message?.content || '';
      return { success: true, content };
    }

    if (result.status === 401) {
      return { success: false, error: 'API Key 无效或已过期' };
    }

    if (result.status === 429) {
      return { success: false, error: '请求频率过高，请稍后重试' };
    }

    const errorMsg = result.data?.error?.message || result.data?.message || `API 返回错误 (${result.status})`;
    return { success: false, error: errorMsg };

  } catch (err) {
    const logger = require('../utils/logger');
    logger.error('LLM chat error:', err.message);
    return { success: false, error: `大模型调用失败: ${err.message}` };
  }
};

/**
 * 简单问答（无历史）
 */
const simpleChat = async (userMessage) => {
  return chat([{ role: 'user', content: userMessage }]);
};

/**
 * 获取当前 LLM 配置（脱敏）
 */
const getPublicConfig = () => {
  const cfg = getConfig();
  return {
    enabled: cfg.enabled,
    provider: cfg.provider,
    model: cfg.model,
    hasApiKey: !!cfg.apiKey,
    apiEndpoint: cfg.apiEndpoint,
    maxTokens: cfg.maxTokens,
    temperature: cfg.temperature
  };
};

module.exports = {
  chat,
  simpleChat,
  getConfig,
  getPublicConfig
};
