const { createClient } = require('redis');
const config = require('./index');

let redisClient = null;

const connectRedis = async () => {
  if (config.useMockDb) {
    console.log('📦 Mock Redis 模式');
    // 创建一个简单的内存 mock
    const memoryStore = new Map();
    redisClient = {
      get: async (key) => memoryStore.get(key) || null,
      set: async (key, value) => { memoryStore.set(key, value); return 'OK'; },
      setEx: async (key, seconds, value) => { memoryStore.set(key, value); return 'OK'; },
      del: async (key) => { memoryStore.delete(key); return 0; },
      exists: async () => 0,
      expire: async () => true,
      disconnect: async () => {}
    };
    return redisClient;
  }

  try {
    const client = createClient({
      socket: {
        host: config.db.redis.host,
        port: config.db.redis.port,
        // 关键：禁止无限重连。否则 Redis 不可达时 connect() 永久 pending，
        // redisClient 会带着"未连接"状态被暴露出去，后续 get/set 命令全部排队挂起。
        reconnectStrategy: false
      },
      password: config.db.redis.password || undefined
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Redis connected successfully');
    });

    await client.connect();
    // 只有真正连上并 ready 后才暴露，避免把"未连接"的客户端泄漏给业务层
    redisClient = client;
    return redisClient;
  } catch (error) {
    console.error('Redis connection error:', error);
    redisClient = null;
    return null;
  }
};

const getRedisClient = () => {
  // 防呆：只有已 ready（握手完成、可执行命令）的客户端才返回，否则视为不可用
  if (redisClient && redisClient.isReady) {
    return redisClient;
  }
  return null;
};

module.exports = {
  connectRedis,
  getRedisClient
};
