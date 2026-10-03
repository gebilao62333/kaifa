jest.mock('redis', () => ({ createClient: jest.fn() }));
jest.mock('../../../src/config', () => {
  const os = require('os');
  const path = require('path');
  return {
    useMockDb: true,
    nodeEnv: 'test',
    paths: { logs: path.join(os.tmpdir(), 'dsh-redis-test-logs') },
    db: { redis: { host: '127.0.0.1', port: 6379, password: undefined } }
  };
});

const { createClient } = require('redis');
const config = require('../../../src/config');
const redis = require('../../../src/config/redis');

describe('Config - Redis', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses an in-memory store in mock mode', async () => {
    config.useMockDb = true;
    const client = await redis.connectRedis();

    expect(typeof client.get).toBe('function');
    await client.set('k', 'v');
    expect(await client.get('k')).toBe('v');
    await client.setEx('k2', 10, 'v2');
    expect(await client.get('k2')).toBe('v2');
    expect(await client.exists('k')).toBe(0);
    expect(await client.expire('k', 1)).toBe(true);
    await client.del('k');
    expect(await client.get('k')).toBe(null);
    await client.disconnect();
    // 内存客户端没有 isReady，getRedisClient 返回 null
    expect(redis.getRedisClient()).toBe(null);
  });

  it('connects a real client and reports it ready', async () => {
    config.useMockDb = false;
    const mockClient = { on: jest.fn(), connect: jest.fn().mockResolvedValue(), isReady: true };
    createClient.mockReturnValue(mockClient);

    const client = await redis.connectRedis();

    expect(createClient).toHaveBeenCalled();
    expect(redis.getRedisClient()).toBe(mockClient);

    // 触发 error / connect 事件回调
    const errorHandler = mockClient.on.mock.calls.find(c => c[0] === 'error')[1];
    const connectHandler = mockClient.on.mock.calls.find(c => c[0] === 'connect')[1];
    errorHandler(new Error('x'));
    connectHandler();
  });

  it('returns null when the connection fails', async () => {
    config.useMockDb = false;
    createClient.mockReturnValue({
      on: jest.fn(),
      connect: jest.fn().mockRejectedValue(new Error('boom')),
      isReady: false
    });

    const client = await redis.connectRedis();
    expect(client).toBe(null);
    expect(redis.getRedisClient()).toBe(null);
  });
});
