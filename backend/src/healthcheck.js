/**
 * 依赖健康探测
 * 供 /api/health 路由与容器 HEALTHCHECK 使用。
 * 每个探测独立、带超时，互不阻塞；任一依赖异常仅标记该依赖状态，不影响整体响应。
 */
const sequelize = require('./config/mysql');
const mongoose = require('mongoose');
const { getRedisClient } = require('./config/redis');
const config = require('./config');

const DEP_TIMEOUT = 2000;

const withTimeout = (p, ms, label) =>
  Promise.race([
    Promise.resolve(p),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), ms))
  ]);

async function checkMysql() {
  if (config.useMockDb) return 'mock';
  try {
    await withTimeout(sequelize.authenticate(), DEP_TIMEOUT, 'mysql');
    return 'up';
  } catch (e) {
    return 'down';
  }
}

async function checkMongo() {
  if (config.useMockDb) return 'mock';
  try {
    // readyState: 0=disconnected 1=connected 2=connecting 3=disconnecting
    return mongoose.connection.readyState === 1 ? 'up' : 'down';
  } catch (e) {
    return 'down';
  }
}

async function checkRedis() {
  if (config.useMockDb) return 'mock';
  try {
    const client = getRedisClient();
    if (!client) return 'down';
    await withTimeout(client.ping(), DEP_TIMEOUT, 'redis');
    return 'up';
  } catch (e) {
    return 'down';
  }
}

/**
 * 探测全部依赖状态。
 * @returns {Promise<{mysql:string, mongo:string, redis:string, timestamp:number}>}
 *          status 取值: 'up' | 'down' | 'mock'
 */
async function probeHealth() {
  const [mysql, mongo, redis] = await Promise.all([checkMysql(), checkMongo(), checkRedis()]);
  return { mysql, mongo, redis, timestamp: Date.now() };
}

module.exports = { probeHealth };
