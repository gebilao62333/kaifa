jest.mock('../../../src/config/redis', () => ({ getRedisClient: jest.fn() }));
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));
jest.mock('../../../src/config/jwt', () => ({
  TOKEN_TYPES: {
    ACCESS: 'access',
    REFRESH: 'refresh',
    ADMIN: 'admin',
    ADMIN_REFRESH: 'admin_refresh'
  },
  verifyToken: jest.fn()
}));

const crypto = require('crypto');
const { getRedisClient } = require('../../../src/config/redis');
const { verifyToken } = require('../../../src/config/jwt');
const revocation = require('../../../src/services/tokenRevocation');

const readyRedis = () => {
  const redis = { get: jest.fn(), setEx: jest.fn(), del: jest.fn() };
  getRedisClient.mockReturnValue(redis);
  return redis;
};

const nowSec = () => Math.floor(Date.now() / 1000);

describe('services/tokenRevocation (审计 H-5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verifyToken.mockReturnValue({ userId: 7, iat: nowSec(), exp: nowSec() + 3600, type: 'access' });
  });

  it('有效期字符串按真实单位解析（水位线键要活过它作废的最长寿令牌）', () => {
    expect(revocation.parseExpiresSeconds('7d', 1)).toBe(7 * 86400);
    expect(revocation.parseExpiresSeconds('30d', 1)).toBe(30 * 86400);
    expect(revocation.parseExpiresSeconds('2h', 1)).toBe(7200);
    expect(revocation.parseExpiresSeconds('45m', 1)).toBe(2700);
    expect(revocation.parseExpiresSeconds('90', 1)).toBe(90);
    expect(revocation.parseExpiresSeconds(120, 1)).toBe(120);
  });

  it('解析不出来的有效期回落到兜底值，不产出 NaN 键 TTL', () => {
    expect(revocation.parseExpiresSeconds(undefined, 999)).toBe(999);
    expect(revocation.parseExpiresSeconds('abc', 999)).toBe(999);
    expect(revocation.parseExpiresSeconds('7w', 999)).toBe(999);
    expect(revocation.parseExpiresSeconds('0', 999)).toBe(999);
    expect(revocation.parseExpiresSeconds(-5, 999)).toBe(999);
  });

  it('吊销键放的是令牌摘要：原始 JWT 不落进 Redis 键名', () => {
    const token = 'header.payload.signature';
    const expected = crypto.createHash('sha256').update(token).digest('hex');

    expect(revocation.tokenFingerprint(token)).toBe(expected);
    expect(revocation.blacklistKey(token)).toBe(`auth:blacklist:${expected}`);
    expect(revocation.blacklistKey(token)).not.toContain('payload');
  });

  describe('revokeToken', () => {
    it('空令牌 / 没有 Redis 都报「无法确认」，不抛异常', async () => {
      getRedisClient.mockReturnValue(null);
      await expect(revocation.revokeToken('')).resolves.toMatchObject({
        ok: false, verifiable: false, reason: 'no-token'
      });
      await expect(revocation.revokeToken('some-token')).resolves.toMatchObject({
        ok: false, verifiable: false, reason: 'redis-unavailable'
      });
    });

    it('验签不通过的令牌不写吊销名单（否则伪造串能凭超大 exp 撑爆 Redis）', async () => {
      const redis = readyRedis();
      verifyToken.mockReturnValue(null);

      await expect(revocation.revokeToken('forged')).resolves.toMatchObject({
        ok: false, verifiable: true, reason: 'invalid-or-expired'
      });
      expect(redis.setEx).not.toHaveBeenCalled();
    });

    it('剩余寿命已为负的令牌无需登记', async () => {
      const redis = readyRedis();
      verifyToken.mockReturnValue({ userId: 7, exp: nowSec() - 10, type: 'access' });

      await expect(revocation.revokeToken('stale')).resolves.toMatchObject({
        ok: false, verifiable: true, reason: 'already-expired'
      });
      expect(redis.setEx).not.toHaveBeenCalled();
    });

    it('按剩余寿命登记，并夹到 refresh 寿命上限', async () => {
      const redis = readyRedis();
      redis.setEx.mockResolvedValue('OK');
      const exp = nowSec() + 3600;
      verifyToken.mockReturnValue({ userId: 7, exp, type: 'access' });

      const result = await revocation.revokeToken('good-token');

      expect(result.ok).toBe(true);
      expect(result.ttl).toBeGreaterThan(3500);
      expect(result.ttl).toBeLessThanOrEqual(3600);
      expect(redis.setEx).toHaveBeenCalledWith(
        revocation.blacklistKey('good-token'),
        result.ttl,
        '1'
      );

      redis.setEx.mockClear();
      verifyToken.mockReturnValue({ userId: 7, exp: nowSec() + 40 * 86400, type: 'access' });
      await revocation.revokeToken('long-lived');
      expect(redis.setEx.mock.calls[0][1]).toBe(revocation.REFRESH_MAX_AGE);
    });

    it('缺少 exp 声明时按 access 最长寿命登记', async () => {
      const redis = readyRedis();
      redis.setEx.mockResolvedValue('OK');
      verifyToken.mockReturnValue({ userId: 7, type: 'access' });

      await revocation.revokeToken('no-exp');
      expect(redis.setEx.mock.calls[0][1]).toBe(revocation.ACCESS_MAX_AGE);
    });

    it('写入失败或挂起时报「无法确认」，调用方据此拒绝把登出当成成功', async () => {
      const redis = readyRedis();
      redis.setEx.mockRejectedValue(new Error('READONLY'));

      await expect(revocation.revokeToken('t')).resolves.toMatchObject({
        ok: false, verifiable: false, reason: 'redis-write-failed'
      });

      jest.useFakeTimers();
      try {
        redis.setEx.mockReturnValue(new Promise(() => {}));
        const pending = revocation.revokeToken('t');
        await jest.advanceTimersByTimeAsync(2000);
        await expect(pending).resolves.toMatchObject({ verifiable: false });
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('revokeAllUserTokens / revokeAllAdminTokens', () => {
    it('主体标识非法时不查 Redis，也不算「无法确认」', async () => {
      const redis = readyRedis();

      await expect(revocation.revokeAllUserTokens(0)).resolves.toMatchObject({
        ok: false, verifiable: true, reason: 'invalid-principal'
      });
      await expect(revocation.revokeAllUserTokens('abc')).resolves.toMatchObject({ reason: 'invalid-principal' });
      await expect(revocation.revokeAllPrincipalTokens('robot', 1)).resolves.toMatchObject({ reason: 'unknown-kind' });
      expect(redis.setEx).not.toHaveBeenCalled();
    });

    it('水位线取 now+1 秒：同一秒内刚签发的令牌也要被作废', async () => {
      const redis = readyRedis();
      redis.setEx.mockResolvedValue('OK');

      const result = await revocation.revokeAllUserTokens(7);

      expect(result.issuedBefore).toBeGreaterThanOrEqual(nowSec() + 1);
      expect(redis.setEx).toHaveBeenCalledWith('auth:revoke-user:7', revocation.REFRESH_MAX_AGE, String(result.issuedBefore));
    });

    it('管理员水位线用独立键位，避免与用户 id 撞号', async () => {
      const redis = readyRedis();
      redis.setEx.mockResolvedValue('OK');

      await revocation.revokeAllAdminTokens(3);
      expect(redis.setEx.mock.calls[0][0]).toBe('auth:revoke-admin:3');

      redis.setEx.mockClear();
      await revocation.revokeAllUserTokens(3);
      expect(redis.setEx.mock.calls[0][0]).toBe('auth:revoke-user:3');
    });

    it('没有 Redis 时报「无法确认」，改密/删号调用方据此 fail-closed', async () => {
      getRedisClient.mockReturnValue(null);
      await expect(revocation.revokeAllUserTokens(7)).resolves.toMatchObject({
        ok: false, verifiable: false, reason: 'redis-unavailable'
      });
    });
  });

  describe('checkRevocation', () => {
    it('令牌或载荷缺失 / 没有 Redis 都算「无法确认」', async () => {
      getRedisClient.mockReturnValue(null);
      await expect(revocation.checkRevocation('', null)).resolves.toMatchObject({ verifiable: false });
      await expect(revocation.checkRevocation('t', { userId: 7, type: 'access' })).resolves.toMatchObject({
        verifiable: false, revoked: false, reason: 'redis-unavailable'
      });
    });

    it('两个键都不存在 → 可确认且未吊销', async () => {
      const redis = readyRedis();
      redis.get.mockResolvedValue(null);

      await expect(revocation.checkRevocation('t', { userId: 7, iat: nowSec(), type: 'access' })).resolves.toEqual({
        verifiable: true, revoked: false, reason: null
      });
      expect(redis.get).toHaveBeenCalledTimes(2);
      expect(redis.get).toHaveBeenCalledWith(revocation.blacklistKey('t'));
      expect(redis.get).toHaveBeenCalledWith('auth:revoke-user:7');
    });

    it('命中吊销名单即为已失效，不必再判水位线', async () => {
      const redis = readyRedis();
      redis.get.mockImplementation(async (key) => (key.startsWith('auth:blacklist:') ? '1' : null));

      await expect(revocation.checkRevocation('t', { userId: 7, iat: 1, type: 'access' })).resolves.toMatchObject({
        verifiable: true, revoked: true, reason: 'token-logged-out'
      });
    });

    it('签发时刻早于水位线 → 全端下线；等于水位线 → 仍然有效', async () => {
      const redis = readyRedis();
      const issuedBefore = 1000;
      redis.get.mockImplementation(async (key) => (key.startsWith('auth:blacklist:') ? null : String(issuedBefore)));

      await expect(revocation.checkRevocation('t', { userId: 7, iat: 999, type: 'access' })).resolves.toMatchObject({
        revoked: true, reason: 'logged-out-everywhere'
      });
      await expect(revocation.checkRevocation('t', { userId: 7, iat: issuedBefore, type: 'access' })).resolves.toMatchObject({
        revoked: false
      });
    });

    it('管理员令牌查 admin 键位并取 id', async () => {
      const redis = readyRedis();
      redis.get.mockResolvedValue('2000');

      await expect(revocation.checkRevocation('t', { id: 3, iat: 100, type: 'admin' })).resolves.toMatchObject({
        revoked: true, reason: 'logged-out-everywhere'
      });
      expect(redis.get).toHaveBeenCalledWith('auth:revoke-admin:3');
    });

    it('用途不明的载荷只查吊销名单，不猜主体键位', async () => {
      const redis = readyRedis();
      redis.get.mockResolvedValue(null);

      await expect(revocation.checkRevocation('t', { userId: 7, type: 'whatever' })).resolves.toMatchObject({
        verifiable: true, revoked: false
      });
      expect(redis.get).toHaveBeenCalledTimes(1);
    });

    it('任一查询报错或挂起 → 无法确认（绝不能等价于「未吊销」）', async () => {
      const redis = readyRedis();
      redis.get.mockImplementation(async (key) => {
        if (key.startsWith('auth:blacklist:')) return null;
        throw new Error('connection reset');
      });

      await expect(revocation.checkRevocation('t', { userId: 7, type: 'access' })).resolves.toMatchObject({
        verifiable: false, revoked: false, reason: 'redis-unavailable'
      });
    });

    it('查询超时同样报「无法确认」', async () => {
      jest.useFakeTimers();
      try {
        const redis = readyRedis();
        redis.get.mockReturnValue(new Promise(() => {}));

        const pending = revocation.checkRevocation('t', { userId: 7, type: 'access' });
        await jest.advanceTimersByTimeAsync(2000);

        await expect(pending).resolves.toMatchObject({ verifiable: false });
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('revocationFailMode', () => {
    const original = process.env.AUTH_BLACKLIST_FAIL_MODE;

    afterEach(() => {
      if (original === undefined) {
        delete process.env.AUTH_BLACKLIST_FAIL_MODE;
      } else {
        process.env.AUTH_BLACKLIST_FAIL_MODE = original;
      }
    });

    it('环境变量优先于 NODE_ENV', () => {
      process.env.AUTH_BLACKLIST_FAIL_MODE = 'open';
      expect(revocation.revocationFailMode()).toBe('open');
    });

    it('未显式配置时按运行环境取向：生产 closed、其余 open', () => {
      delete process.env.AUTH_BLACKLIST_FAIL_MODE;
      const config = require('../../../src/config');
      const expected = config.nodeEnv === 'production' ? 'closed' : 'open';
      expect(revocation.revocationFailMode()).toBe(expected);
    });
  });
});
