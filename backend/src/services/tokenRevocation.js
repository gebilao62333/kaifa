const crypto = require('crypto');
const { getRedisClient } = require('../config/redis');
const { verifyToken, TOKEN_TYPES } = require('../config/jwt');
const config = require('../config');
const logger = require('../utils/logger');

// 审计 H-5：`blacklist:<token>` 此前只有 authMiddleware 在读，全仓库没有任何写入点，
// 也没有登出接口——「退出登录」只是前端清 localStorage，令牌在剩余有效期内依然可用。
// 这里同时补写入侧（登出 / 改密 / 封号 / 删除管理员）和统一读取侧（中间件与 Socket 都走 checkRevocation）。
//
// 两类吊销状态，都只存在 Redis：
//   1) 单令牌拉黑 auth:blacklist:<sha256(令牌)>      —— 只登出当前设备，活到令牌自身 exp 即自动清理
//   2) 主体水位线 auth:revoke-user:<id> / auth:revoke-admin:<id>
//      —— 「全端下线」：值为水位线秒数，签发时刻(iat)早于水位线的令牌一律作废

const BLACKLIST_PREFIX = 'auth:blacklist:';
const USER_CUTOFF_PREFIX = 'auth:revoke-user:';
const ADMIN_CUTOFF_PREFIX = 'auth:revoke-admin:';
const REDIS_TIMEOUT_MS = 2000;

const DURATION_UNITS = { s: 1, m: 60, h: 3600, d: 86400 };
const DEFAULT_ACCESS_AGE = 7 * 86400;
const DEFAULT_REFRESH_AGE = 30 * 86400;

// config.jwt.expiresIn / refreshExpiresIn 是 '7d' / '30d' / '2h' 这类字符串，
// 水位线键要活过「被它作废的那批令牌里最长寿的一枚」，所以必须真的解析成秒数。
const parseExpiresSeconds = (value, fallbackSeconds) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  const matched = typeof value === 'string' ? value.trim().match(/^(\d+)([smhd]?)$/) : null;
  if (!matched) {
    return fallbackSeconds;
  }
  const seconds = parseInt(matched[1], 10) * DURATION_UNITS[matched[2] || 's'];
  return seconds > 0 ? seconds : fallbackSeconds;
};

const ACCESS_MAX_AGE = parseExpiresSeconds(config.jwt.expiresIn, DEFAULT_ACCESS_AGE);
const REFRESH_MAX_AGE = parseExpiresSeconds(config.jwt.refreshExpiresIn, DEFAULT_REFRESH_AGE);

// 与 adminLoginGuard / smsService 同一口径：Redis 卡顿最多等 2 秒，绝不把鉴权挂死。
// 用 { value } 包一层是为了把「键不存在」（可确认：未吊销）和「命令报错 / 超时」（不可确认）分开——
// 两者原生都返回 null，混为一谈就等于「Redis 一挂，已登出的令牌全部复活」。
const withRedisTimeout = (promise, ms = REDIS_TIMEOUT_MS) => {
  let timer;
  return Promise.race([
    Promise.resolve(promise).then((value) => ({ value })).catch(() => null),
    new Promise((resolve) => { timer = setTimeout(() => resolve(null), ms); })
  ]).finally(() => clearTimeout(timer));
};

// 键里放摘要而不是令牌原文：原始 JWT 是可直接复用的凭据，落进 Redis 键名后会出现在
// MONITOR 输出、KEYS 结果和 RDB 备份里，等于把凭据复制进一个通常不设防的存储。
const tokenFingerprint = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');
const blacklistKey = (token) => `${BLACKLIST_PREFIX}${tokenFingerprint(token)}`;

// 读取侧失败时的取向：生产 fail-closed（503），非生产 fail-open（可用性优先）。
// 与原 authMiddleware 的实现保持一致，但覆盖面扩大了——「Redis 客户端根本没连上」
// 以前是整段跳过黑名单检查直接放行，现在同样算「无法确认」。
const revocationFailMode = () => process.env.AUTH_BLACKLIST_FAIL_MODE
  || (config.nodeEnv === 'production' ? 'closed' : 'open');

const cutoffKeyFor = (decoded) => {
  if (!decoded) {
    return null;
  }
  if (decoded.type === TOKEN_TYPES.ADMIN) {
    return decoded.id ? `${ADMIN_CUTOFF_PREFIX}${decoded.id}` : null;
  }
  if (decoded.type === TOKEN_TYPES.ACCESS || decoded.type === TOKEN_TYPES.REFRESH) {
    return decoded.userId ? `${USER_CUTOFF_PREFIX}${decoded.userId}` : null;
  }
  return null;
};

const unavailable = (reason) => ({ ok: false, verifiable: false, revoked: false, reason });

const revokeToken = async (token) => {
  if (!token) {
    return unavailable('no-token');
  }

  const redis = getRedisClient();
  if (!redis) {
    logger.warn('[tokenRevocation] Redis 不可用，令牌未能加入吊销名单');
    return unavailable('redis-unavailable');
  }

  // 只登记验签通过的令牌：否则任何人送一枚伪造串就能凭超大 exp 往 Redis 里塞一个长期键
  const decoded = verifyToken(token);
  if (!decoded) {
    return { ok: false, verifiable: true, revoked: false, reason: 'invalid-or-expired' };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const ttl = decoded.exp ? Math.min(decoded.exp - nowSec, REFRESH_MAX_AGE) : ACCESS_MAX_AGE;
  if (ttl <= 0) {
    // 本来就已过期，没有可吊销的剩余寿命
    return { ok: false, verifiable: true, revoked: false, reason: 'already-expired' };
  }

  const written = await withRedisTimeout(redis.setEx(blacklistKey(token), ttl, '1'));
  if (!written) {
    logger.warn('[tokenRevocation] 吊销名单写入失败');
    return unavailable('redis-write-failed');
  }

  return { ok: true, verifiable: true, revoked: true, reason: 'revoked', ttl };
};

// kind: 'user' | 'admin'
const revokeAllPrincipalTokens = async (kind, principalId) => {
  const id = Number(principalId);
  if (kind !== 'user' && kind !== 'admin') {
    return { ok: false, verifiable: true, revoked: false, reason: 'unknown-kind' };
  }
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, verifiable: true, revoked: false, reason: 'invalid-principal' };
  }

  const redis = getRedisClient();
  if (!redis) {
    logger.warn(`[tokenRevocation] Redis 不可用，${kind} ${id} 的全端下线未能执行`);
    return unavailable('redis-unavailable');
  }

  // 水位线取 now+1 秒：iat 只有秒级精度，取 now 会让同一秒内刚签发的令牌逃过吊销
  const issuedBefore = Math.floor(Date.now() / 1000) + 1;
  const prefix = kind === 'admin' ? ADMIN_CUTOFF_PREFIX : USER_CUTOFF_PREFIX;
  const written = await withRedisTimeout(
    redis.setEx(`${prefix}${id}`, REFRESH_MAX_AGE, String(issuedBefore))
  );
  if (!written) {
    logger.warn(`[tokenRevocation] ${kind} ${id} 水位线写入失败`);
    return unavailable('redis-write-failed');
  }

  return { ok: true, verifiable: true, revoked: true, reason: 'revoked-all', issuedBefore };
};

const revokeAllUserTokens = (userId) => revokeAllPrincipalTokens('user', userId);
const revokeAllAdminTokens = (adminId) => revokeAllPrincipalTokens('admin', adminId);

// decoded 由调用方（已验签处）传入，这里不重复验签
const checkRevocation = async (token, decoded) => {
  if (!token || !decoded) {
    return { verifiable: false, revoked: false, reason: 'no-token' };
  }

  const redis = getRedisClient();
  if (!redis) {
    return { verifiable: false, revoked: false, reason: 'redis-unavailable' };
  }

  const cutoffKey = cutoffKeyFor(decoded);
  const reads = [withRedisTimeout(redis.get(blacklistKey(token)))];
  if (cutoffKey) {
    reads.push(withRedisTimeout(redis.get(cutoffKey)));
  }

  const results = await Promise.all(reads);
  if (results.some((result) => result === null)) {
    return { verifiable: false, revoked: false, reason: 'redis-unavailable' };
  }

  if (results[0].value) {
    return { verifiable: true, revoked: true, reason: 'token-logged-out' };
  }

  if (cutoffKey) {
    const issuedBefore = Number(results[1].value) || 0;
    if (issuedBefore > 0 && (decoded.iat || 0) < issuedBefore) {
      return { verifiable: true, revoked: true, reason: 'logged-out-everywhere' };
    }
  }

  return { verifiable: true, revoked: false, reason: null };
};

module.exports = {
  BLACKLIST_PREFIX,
  USER_CUTOFF_PREFIX,
  ADMIN_CUTOFF_PREFIX,
  ACCESS_MAX_AGE,
  REFRESH_MAX_AGE,
  parseExpiresSeconds,
  tokenFingerprint,
  blacklistKey,
  revocationFailMode,
  revokeToken,
  revokeAllUserTokens,
  revokeAllAdminTokens,
  revokeAllPrincipalTokens,
  checkRevocation
};
