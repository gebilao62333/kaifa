jest.mock('../../../src/config/redis', () => ({ getRedisClient: jest.fn() }));
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const { getRedisClient } = require('../../../src/config/redis');
const guard = require('../../../src/services/adminLoginGuard');

const readyRedis = () => {
  const redis = {
    get: jest.fn(),
    ttl: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn()
  };
  getRedisClient.mockReturnValue(redis);
  return redis;
};

describe('services/adminLoginGuard (审计 H-3)', () => {
  it('归一化账号：大小写与首尾空格合并为同一个计数器', () => {
    expect(guard.normalizeLoginName('  Admin ')).toBe('admin');
    expect(guard.normalizeLoginName('')).toBe('');
    expect(guard.normalizeLoginName(null)).toBe('');
  });

  it('未连接 Redis 时报「无法确认」，不抛异常', async () => {
    getRedisClient.mockReturnValue(null);
    await expect(guard.getLoginLockState('admin')).resolves.toEqual({
      verifiable: false, locked: false, fails: 0, retryAfterSec: 0
    });
  });

  it('Redis 命令报错时也报「无法确认」（口令校验不因抖动变成 500）', async () => {
    const redis = readyRedis();
    redis.get.mockRejectedValue(new Error('connection reset'));
    await expect(guard.getLoginLockState('admin')).resolves.toMatchObject({ verifiable: false });
  });

  it('Redis 命令挂起时 2 秒内返回「无法确认」', async () => {
    jest.useFakeTimers();
    try {
      const redis = readyRedis();
      redis.get.mockReturnValue(new Promise(() => {}));

      const pending = guard.getLoginLockState('admin');
      await jest.advanceTimersByTimeAsync(2000);

      await expect(pending).resolves.toMatchObject({ verifiable: false });
    } finally {
      jest.useRealTimers();
    }
  });

  it('空用户名不查 Redis，直接按「无法确认」处理', async () => {
    const redis = readyRedis();
    const state = await guard.getLoginLockState('   ');

    expect(state.verifiable).toBe(false);
    expect(redis.get).not.toHaveBeenCalled();
  });

  it('没有失败记录时可登录且 fails 为 0', async () => {
    const redis = readyRedis();
    redis.get.mockResolvedValue(null);

    await expect(guard.getLoginLockState('admin')).resolves.toEqual({
      verifiable: true, locked: false, fails: 0, retryAfterSec: 0
    });
    expect(redis.get).toHaveBeenCalledWith('admin:login:fail:admin');
  });

  it('失败 4 次未达上限：不锁定，并带回剩余秒数', async () => {
    const redis = readyRedis();
    redis.get.mockResolvedValue('4');
    redis.ttl.mockResolvedValue(330);

    await expect(guard.getLoginLockState('Admin')).resolves.toEqual({
      verifiable: true, locked: false, fails: 4, retryAfterSec: 330
    });
  });

  it('失败达上限（默认 5 次）：锁定', async () => {
    const redis = readyRedis();
    redis.get.mockResolvedValue('5');
    redis.ttl.mockResolvedValue(600);

    const state = await guard.getLoginLockState('admin');
    expect(state.locked).toBe(true);
    expect(state.retryAfterSec).toBe(600);
  });

  it('计数键已丢 TTL 时，剩余时间回落到完整锁定时长', async () => {
    const redis = readyRedis();
    redis.get.mockResolvedValue('9');
    redis.ttl.mockResolvedValue(-2);

    const state = await guard.getLoginLockState('admin');
    expect(state.locked).toBe(true);
    expect(state.retryAfterSec).toBe(guard.ADMIN_LOGIN_FAIL_WINDOW);
  });

  it('记录失败：首次 INCR 后补 EXPIRE，之后不再重复设置', async () => {
    const redis = readyRedis();
    redis.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    await expect(guard.recordLoginFailure('admin')).resolves.toBe(1);
    expect(redis.expire).toHaveBeenCalledWith('admin:login:fail:admin', guard.ADMIN_LOGIN_FAIL_WINDOW);

    await expect(guard.recordLoginFailure('admin')).resolves.toBe(2);
    expect(redis.expire).toHaveBeenCalledTimes(1);
  });

  it('达到上限时留下告警日志', async () => {
    const logger = require('../../../src/utils/logger');
    const redis = readyRedis();
    redis.incr.mockResolvedValue(guard.ADMIN_LOGIN_MAX_FAILS);

    await guard.recordLoginFailure('admin');
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('锁定'));
  });

  it('INCR 失败只返回 null，不向上抛', async () => {
    const redis = readyRedis();
    redis.incr.mockRejectedValue(new Error('boom'));

    await expect(guard.recordLoginFailure('admin')).resolves.toBeNull();
    expect(redis.expire).not.toHaveBeenCalled();
  });

  it('登录成功清空计数（按归一化后的键）', async () => {
    const redis = readyRedis();
    redis.del.mockResolvedValue(1);

    await guard.clearLoginFailures(' ADMIN ');
    expect(redis.del).toHaveBeenCalledWith('admin:login:fail:admin');
  });

  it('Redis 不可用时 clearLoginFailures 静默返回', async () => {
    getRedisClient.mockReturnValue(null);
    await expect(guard.clearLoginFailures('admin')).resolves.toBeUndefined();
  });
});
