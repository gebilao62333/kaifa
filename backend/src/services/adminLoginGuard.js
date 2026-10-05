const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

// 审计 H-3：后台登录此前只吃全局 apiLimiter（默认 100 次/分钟），相当于允许在线爆破管理员口令。
// IP 维度换代理就能绕，所以这里补的是「按账号」的失败计数与锁定，与 IP 限流叠加才成立。
const ADMIN_LOGIN_FAIL_WINDOW = 15 * 60;
const ADMIN_LOGIN_MAX_FAILS = parseInt(process.env.ADMIN_LOGIN_MAX_FAILS) || 5;

const failKey = (username) => `admin:login:fail:${username}`;

// 与 smsService 同一口径：Redis 卡顿时最多等 2 秒，绝不把登录挂死。
// 用 { value } 包一层是为了把「键不存在」和「命令超时/报错」分开——两者原生都返回 null。
// 命令报错（连接断开、超时）在这里收敛成 null，让调用方走「无法确认锁定状态」分支，
// 而不是把异常抛进登录控制器——口令校验不该因为 Redis 抖动变成 500。
const withRedisTimeout = (promise, ms = 2000) => {
  let timer;
  return Promise.race([
    Promise.resolve(promise).catch(() => null),
    new Promise((resolve) => { timer = setTimeout(() => resolve(null), ms); })
  ]).finally(() => clearTimeout(timer));
};
const readWithTimeout = (promise) =>
  withRedisTimeout(Promise.resolve(promise).then((value) => ({ value })));

// 归一化：大小写与首尾空格不应成为绕过计数的第二个计数器
const normalizeLoginName = (username) => String(username || '').trim().toLowerCase();

const getLoginLockState = async (rawUsername) => {
  const redis = getRedisClient();
  const username = normalizeLoginName(rawUsername);

  if (!redis || !username) {
    // 账号为空由控制器先行 400 拦掉；这里拿不到 Redis 时按「无法确认锁定状态」处理，
    // 由控制器保守拒绝——口令校验不可降级为「Redis 挂了就不用数失败次数」。
    return { verifiable: false, locked: false, fails: 0, retryAfterSec: 0 };
  }

  const stored = await readWithTimeout(redis.get(failKey(username)));
  if (!stored) {
    return { verifiable: false, locked: false, fails: 0, retryAfterSec: 0 };
  }

  const fails = Number(stored.value) || 0;
  if (fails <= 0) {
    return { verifiable: true, locked: false, fails: 0, retryAfterSec: 0 };
  }

  const ttl = await readWithTimeout(redis.ttl(failKey(username)));
  const retryAfterSec = ttl && ttl.value > 0 ? ttl.value : ADMIN_LOGIN_FAIL_WINDOW;

  return {
    verifiable: true,
    locked: fails >= ADMIN_LOGIN_MAX_FAILS,
    fails,
    retryAfterSec
  };
};

const recordLoginFailure = async (rawUsername) => {
  const redis = getRedisClient();
  const username = normalizeLoginName(rawUsername);

  if (!redis || !username) {
    return null;
  }

  const incremented = await readWithTimeout(redis.incr(failKey(username)));
  if (!incremented) {
    return null;
  }

  const fails = Number(incremented.value) || 0;
  // INCR 新建的键没有 TTL，只有首次失败时补，否则计数会永久累加
  if (fails === 1) {
    await withRedisTimeout(redis.expire(failKey(username), ADMIN_LOGIN_FAIL_WINDOW));
  }

  if (fails >= ADMIN_LOGIN_MAX_FAILS) {
    logger.warn(`[adminLoginGuard] 账号 ${username} 连续 ${fails} 次登录失败，锁定 ${ADMIN_LOGIN_FAIL_WINDOW / 60} 分钟`);
  }

  return fails;
};

const clearLoginFailures = async (rawUsername) => {
  const redis = getRedisClient();
  const username = normalizeLoginName(rawUsername);

  if (!redis || !username) {
    return;
  }

  await withRedisTimeout(redis.del(failKey(username)));
};

module.exports = {
  ADMIN_LOGIN_FAIL_WINDOW,
  ADMIN_LOGIN_MAX_FAILS,
  normalizeLoginName,
  getLoginLockState,
  recordLoginFailure,
  clearLoginFailures
};
