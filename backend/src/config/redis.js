const config = require('./index');

let redisClient = null;

const createMockRedis = () => {
  console.log('📦 使用本地内存 Redis 模式');
  const mockStorage = {};
  return {
    get: async (key) => mockStorage[key] || null,
    set: async (key, value, options) => {
      mockStorage[key] = value;
      if (options?.EX) {
        setTimeout(() => delete mockStorage[key], options.EX * 1000);
      }
      return 'OK';
    },
    del: async (key) => {
      const existed = mockStorage[key] !== undefined;
      delete mockStorage[key];
      return existed ? 1 : 0;
    },
    exists: async (key) => mockStorage[key] !== undefined ? 1 : 0,
    expire: async (key, seconds) => {
      if (mockStorage[key] !== undefined) {
        setTimeout(() => delete mockStorage[key], seconds * 1000);
        return 1;
      }
      return 0;
    },
    disconnect: async () => {},
    hget: async (key, field) => {
      const hash = mockStorage[key];
      return hash && hash[field] ? hash[field] : null;
    },
    hset: async (key, field, value) => {
      if (!mockStorage[key]) mockStorage[key] = {};
      mockStorage[key][field] = value;
      return 1;
    },
    hgetall: async (key) => mockStorage[key] || {},
    incr: async (key) => {
      mockStorage[key] = (mockStorage[key] || 0) + 1;
      return mockStorage[key];
    },
    decr: async (key) => {
      mockStorage[key] = (mockStorage[key] || 0) - 1;
      return mockStorage[key];
    },
    ttl: async (key) => mockStorage[key] !== undefined ? -1 : -2,
    keys: async (pattern) => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return Object.keys(mockStorage).filter(k => regex.test(k));
    },
    flushAll: async () => {
      Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
    },
    ping: async () => 'PONG',
    on: () => {}
  };
};

const createRealRedis = () => {
  const Redis = require('redis');
  const redisConfig = config.db.redis;
  console.log(`🗄️ 连接 Redis: ${redisConfig.host}:${redisConfig.port}`);

  const client = Redis.createClient({
    socket: {
      host: redisConfig.host,
      port: redisConfig.port,
      reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
    },
    username: redisConfig.username,
    password: redisConfig.password
  });

  client.on('connect', () => console.log('✅ Redis 连接成功'));
  client.on('error', (err) => {
    console.error('❌ Redis 连接错误:', err.message);
    console.log('💡 将以本地内存模式继续运行');
  });
  client.on('end', () => console.log('🔌 Redis 连接已关闭'));

  return client;
};

const connectRedis = async () => {
  if (redisClient) return redisClient;

  if (config.useMockDb) {
    redisClient = createMockRedis();
  } else {
    try {
      const client = createRealRedis();
      await client.connect();
      redisClient = client;
    } catch (error) {
      console.warn('⚠️ Redis 真实连接失败，回退到内存模式:', error.message);
      redisClient = createMockRedis();
    }
  }
  return redisClient;
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

const safeRedisOperation = async (operation, ...args) => {
  try {
    const client = getRedisClient();
    return await client[operation](...args);
  } catch (error) {
    console.error(`Redis operation ${operation} failed:`, error.message);
    return null;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  safeRedisOperation
};
