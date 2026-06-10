const sequelize = require('../config/mysql');
const { connectRedis, getRedisClient } = require('../config/redis');
const { connectMongo } = require('../config/mongo');

let redisConnected = false;
let mongoConnected = false;
let mysqlConnected = false;

const config = require('../config/index');

const checkMysqlHealth = async () => {
  try {
    if (sequelize.authenticateWithRetry) {
      await sequelize.authenticateWithRetry();
    } else {
      await sequelize.authenticate();
    }
    mysqlConnected = true;
    const label = config.useMockDb ? '本地数据源 (Local JSON DB)' : 'MySQL';
    return { status: 'healthy', message: `${label} 就绪` };
  } catch (error) {
    mysqlConnected = false;
    const label = config.useMockDb ? '本地数据源' : 'MySQL';
    return { status: 'unhealthy', message: `${label} 异常: ${error.message}` };
  }
};

const checkRedisHealth = async () => {
  try {
    const client = getRedisClient();
    if (!client) {
      return { status: 'unhealthy', message: 'Redis client not initialized' };
    }

    const pong = await client.ping();
    if (pong === 'PONG') {
      redisConnected = true;
      const label = config.useMockDb ? 'Mock Redis (内存模式)' : 'Redis';
      return { status: 'healthy', message: `${label} 就绪` };
    }
    redisConnected = false;
    return { status: 'unhealthy', message: 'Redis ping failed' };
  } catch (error) {
    redisConnected = false;
    return { status: 'unhealthy', message: `Redis 异常: ${error.message}` };
  }
};

const checkMongoHealth = async () => {
  try {
    const mongoose = require('../config/mongo').mongoose;
    if (!mongoose || !mongoose.connection) {
      return { status: 'healthy', message: 'MongoDB Mock 模式就绪' };
    }

    const state = mongoose.connection.readyState;
    // 1=connected, 2=connecting, 0=disconnected
    if (state === 1) {
      mongoConnected = true;
      const label = config.useMockDb ? 'MongoDB 本地模式' : 'MongoDB';
      return { status: 'healthy', message: `${label} 就绪` };
    } else if (state === 2) {
      return { status: 'healthy', message: 'MongoDB 连接中...' };
    }
    const label = config.useMockDb ? 'MongoDB Mock 模式' : 'MongoDB (未连接)';
    return { status: 'healthy', message: label };
  } catch (error) {
    mongoConnected = false;
    return { status: 'healthy', message: 'MongoDB Mock 模式就绪' };
  }
};

const checkAllHealth = async () => {
  const [mysql, redis, mongo] = await Promise.all([
    checkMysqlHealth(),
    checkRedisHealth(),
    checkMongoHealth()
  ]);

  const allHealthy = mysql.status === 'healthy';

  return {
    overall: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    databases: {
      mysql,
      redis,
      mongo
    }
  };
};

const initializeDatabases = async () => {
  console.log('🔄 正在初始化本地数据源...');

  const results = await Promise.allSettled([
    checkMysqlHealth(),
    (async () => {
      await connectRedis();
      return checkRedisHealth();
    })(),
    (async () => {
      await connectMongo();
      return checkMongoHealth();
    })()
  ]);

  results.forEach((result, index) => {
    const dbNames = ['数据源', 'Redis', 'MongoDB'];
    if (result.status === 'fulfilled') {
      console.log(`✅ ${dbNames[index]}: ${result.value.message}`);
    } else {
      console.warn(`⚠️  ${dbNames[index]}: ${result.reason?.message || '未知错误'}`);
    }
  });

  return results;
};

const getConnectionStatus = () => ({
  mysql: mysqlConnected,
  redis: redisConnected,
  mongo: mongoConnected
});

module.exports = {
  checkMysqlHealth,
  checkRedisHealth,
  checkMongoHealth,
  checkAllHealth,
  initializeDatabases,
  getConnectionStatus
};
