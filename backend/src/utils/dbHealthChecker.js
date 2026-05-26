const sequelize = require('../config/mysql');
const { connectRedis, getRedisClient } = require('../config/redis');
const { connectMongo } = require('../config/mongo');

let redisConnected = false;
let mongoConnected = false;
let mysqlConnected = false;

const checkMysqlHealth = async () => {
  try {
    if (sequelize.authenticateWithRetry) {
      await sequelize.authenticateWithRetry();
    } else {
      await sequelize.authenticate();
    }
    mysqlConnected = true;
    return { status: 'healthy', message: 'MySQL connection OK' };
  } catch (error) {
    mysqlConnected = false;
    return { status: 'unhealthy', message: `MySQL connection failed: ${error.message}` };
  }
};

const checkRedisHealth = async () => {
  try {
    const client = getRedisClient();
    if (!client) {
      return { status: 'unknown', message: 'Redis client not initialized' };
    }
    
    const pong = await client.ping();
    if (pong === 'PONG') {
      redisConnected = true;
      return { status: 'healthy', message: 'Redis connection OK' };
    }
    redisConnected = false;
    return { status: 'unhealthy', message: 'Redis ping failed' };
  } catch (error) {
    redisConnected = false;
    return { status: 'unhealthy', message: `Redis connection failed: ${error.message}` };
  }
};

const checkMongoHealth = async () => {
  try {
    const mongoose = require('../config/mongo').mongoose;
    if (!mongoose || !mongoose.connection) {
      return { status: 'unknown', message: 'MongoDB not initialized' };
    }
    
    const state = mongoose.connection.readyState;
    if (state === 1) {
      mongoConnected = true;
      return { status: 'healthy', message: 'MongoDB connection OK' };
    } else if (state === 0) {
      return { status: 'unhealthy', message: 'MongoDB disconnected' };
    } else if (state === 2) {
      return { status: 'unhealthy', message: 'MongoDB connecting...' };
    } else {
      return { status: 'unhealthy', message: 'MongoDB connection error' };
    }
  } catch (error) {
    mongoConnected = false;
    return { status: 'unhealthy', message: `MongoDB connection failed: ${error.message}` };
  }
};

const checkAllHealth = async () => {
  const [mysql, redis, mongo] = await Promise.all([
    checkMysqlHealth(),
    checkRedisHealth(),
    checkMongoHealth()
  ]);

  const allHealthy = mysql.status === 'healthy' && redis.status === 'healthy' && mongo.status === 'healthy';

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
  console.log('🔄 正在初始化数据库连接...');
  
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
    const dbNames = ['MySQL', 'Redis', 'MongoDB'];
    if (result.status === 'fulfilled') {
      console.log(`✅ ${dbNames[index]}: ${result.value.message}`);
    } else {
      console.error(`❌ ${dbNames[index]}: ${result.reason.message}`);
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