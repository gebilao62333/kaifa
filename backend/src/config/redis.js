const { createClient } = require('redis');
const config = require('./index');

let redisClient = null;

const connectRedis = async () => {
  if (config.useMockDb) {
    console.log('📦 Mock Redis 模式');
    // 创建一个简单的内存 mock
    redisClient = {
      get: async () => null,
      set: async () => 'OK',
      del: async () => 0,
      exists: async () => 0,
      expire: async () => true,
      disconnect: async () => {}
    };
    return redisClient;
  }
  
  try {
    redisClient = createClient({
      socket: {
        host: config.db.redis.host,
        port: config.db.redis.port
      },
      password: config.db.redis.password || undefined
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Redis connection error:', error);
    return null;
  }
};

const getRedisClient = () => redisClient;

module.exports = {
  connectRedis,
  getRedisClient
};
