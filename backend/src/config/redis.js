const { createClient, Cluster } = require('redis');
const config = require('./index');

let redisClient = null;
let isCluster = false;

const retryConnection = async (fn, retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.warn(`Redis 连接失败 (${i + 1}/${retries}):`, error.message);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw new Error('Redis 连接重试次数已用完');
};

const connectRedis = async () => {
  if (config.useMockDb) {
    console.log('📦 Mock Redis 模式');
    const mockStorage = {};
    redisClient = {
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
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Object.keys(mockStorage).filter(k => regex.test(k));
      },
      flushAll: async () => {
        Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
      }
    };
    return redisClient;
  }
  
  try {
    const redisConfig = {
      socket: {
        host: config.db.redis.host,
        port: config.db.redis.port,
        reconnectStrategy: (retries) => Math.min(retries * 50, 5000),
        timeout: 5000
      },
      password: config.db.redis.password || undefined,
      username: config.db.redis.username || undefined,
      database: 0,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    };

    redisClient = createClient(redisConfig);

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redisClient.on('reconnecting', () => {
      console.warn('🔄 Redis reconnecting...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis is ready');
    });

    redisClient.on('end', () => {
      console.warn('🔌 Redis connection ended');
    });

    await retryConnection(() => redisClient.connect());
    
    return redisClient;
  } catch (error) {
    console.error('Redis connection error:', error);
    return null;
  }
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
