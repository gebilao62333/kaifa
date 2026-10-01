const axios = require('axios');
const llmService = require('../../../src/services/llmService');

jest.mock('axios');
jest.mock('../../../src/config', () => {
  const actual = jest.requireActual('../../../src/config');
  return {
    ...actual,
    llm: {
      enabled: true,
      apiKey: 'test-api-key',
      baseUrl: 'https://api.example.com/v1',
      model: 'test-model',
      timeoutMs: 5000,
      maxRetries: 1,
      maxContextMessages: 20
    }
  };
});

describe('Service - LLM Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null and skip request when LLM not enabled', async () => {
    const config = require('../../../src/config');
    config.llm.enabled = false;

    const result = await llmService.generateReply({
      systemPrompt: 'system',
      messages: [{ role: 'user', content: 'hi' }]
    });

    expect(result).toBeNull();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('should return null when api key is empty', async () => {
    const config = require('../../../src/config');
    config.llm.enabled = true;
    config.llm.apiKey = '';

    const result = await llmService.generateReply({ systemPrompt: 'system' });

    expect(result).toBeNull();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('should return content on success', async () => {
    const config = require('../../../src/config');
    config.llm.enabled = true;
    config.llm.apiKey = 'test-api-key';

    axios.post.mockResolvedValue({
      data: {
        choices: [{ message: { content: '  你好，我是虚拟助手！  ' } }]
      }
    });

    const result = await llmService.generateReply({
      systemPrompt: '你是虚拟助手',
      messages: [{ role: 'user', content: '你好' }]
    });

    expect(result).toBe('你好，我是虚拟助手！');
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.example.com/v1/chat/completions',
      expect.objectContaining({
        model: 'test-model',
        messages: [
          { role: 'system', content: '你是虚拟助手' },
          { role: 'user', content: '你好' }
        ]
      }),
      expect.objectContaining({
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json'
        },
        timeout: 5000
      })
    );
  });

  it('should return null when response lacks content', async () => {
    const config = require('../../../src/config');
    config.llm.enabled = true;
    config.llm.apiKey = 'test-api-key';

    axios.post.mockResolvedValue({ data: { choices: [{ message: {} }] } });

    const result = await llmService.generateReply({ systemPrompt: 'system' });

    expect(result).toBeNull();
  });

  it('should return null on network error', async () => {
    const config = require('../../../src/config');
    config.llm.enabled = true;
    config.llm.apiKey = 'test-api-key';

    axios.post.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await llmService.generateReply({ systemPrompt: 'system' });

    expect(result).toBeNull();
  });

  it('should return null on empty response body', async () => {
    const config = require('../../../src/config');
    config.llm.enabled = true;
    config.llm.apiKey = 'test-api-key';

    axios.post.mockResolvedValue({ data: {} });

    const result = await llmService.generateReply({ systemPrompt: 'system' });

    expect(result).toBeNull();
  });
});
