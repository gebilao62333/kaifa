jest.mock('express-rate-limit', () => jest.fn((options) => {
  const mw = (req, res, next) => next();
  mw.options = options;
  return mw;
}));

// 审计 H-8：这里刻意用可变对象模拟 src/config，以便逐个切换 nodeEnv 验证
// 「环境不再决定限流是否生效」这一条 —— 旧实现 skip 的判据是 nodeEnv==='development'。
jest.mock('../../../src/config', () => {
  const path = require('path');
  const os = require('os');
  return {
    nodeEnv: 'development',
    rateLimit: {
      windowMs: 60000,
      maxRequests: 100,
      disabled: false,
      smsMax: 1
    },
    paths: { logs: path.join(os.tmpdir(), 'dsh-ratelimit-logs') }
  };
});

const rateLimit = require('express-rate-limit');
const config = require('../../../src/config');
const limiters = require('../../../src/middlewares/rateLimit');

const NAMES = ['apiLimiter', 'loginLimiter', 'adminLoginLimiter', 'smsLimiter', 'cardLimiter', 'uploadLimiter'];

describe('Middleware - RateLimit', () => {
  beforeEach(() => {
    config.nodeEnv = 'development';
    config.rateLimit.disabled = false;
  });

  it('exports six configured limiters', () => {
    NAMES.forEach((name) => expect(typeof limiters[name]).toBe('function'));
    expect(rateLimit).toHaveBeenCalledTimes(6);
  });

  // 本条是 H-8 的回归防线：以前只要 NODE_ENV 缺省（兜底就是 development），
  // 五道限流在生产机器上全部放行。现在只有 RATE_LIMIT_DISABLED=true 一个开关能关掉。
  it('never skips based on NODE_ENV', () => {
    ['development', 'production', 'test', undefined].forEach((env) => {
      config.nodeEnv = env;
      NAMES.forEach((name) => {
        expect(limiters[name].options.skip({}, {})).toBe(false);
      });
    });
  });

  it('skips all limiters only when RATE_LIMIT_DISABLED=true', () => {
    config.rateLimit.disabled = true;
    NAMES.forEach((name) => {
      expect(limiters[name].options.skip({}, {})).toBe(true);
    });
    config.rateLimit.disabled = false;
    expect(limiters.apiLimiter.options.skip({}, {})).toBe(false);
  });

  // 旧实现只有 apiLimiter 与 adminLoginLimiter 带 standardHeaders，其余四个漏配；
  // 429 的 Retry-After 仅在开启标准头（或旧头）时才写入，六个限流器口径必须一致
  it('emits standard RateLimit headers on all six limiters', () => {
    NAMES.forEach((name) => {
      expect(limiters[name].options.standardHeaders).toBe(true);
      expect(limiters[name].options.legacyHeaders).toBe(false);
    });
  });

  it('configures windowMs and 429 message', () => {
    expect(limiters.apiLimiter.options.windowMs).toBe(60000);
    expect(limiters.apiLimiter.options.max).toBe(100);
    expect(limiters.apiLimiter.options.message.code).toBe(429);
    expect(limiters.smsLimiter.options.max).toBe(1);
    expect(limiters.uploadLimiter.options.max).toBe(20);
  });

  it('登录/后台登录/卡密限流保持收紧后的阈值', () => {
    // 审计 M11：原 100 次/15 分钟过宽
    expect(limiters.loginLimiter.options.max).toBeLessThanOrEqual(20);
    expect(limiters.loginLimiter.options.windowMs).toBe(15 * 60 * 1000);
    // 审计 H-3：后台登录单 IP 15 分钟只给 5 次
    expect(limiters.adminLoginLimiter.options.max).toBeLessThanOrEqual(5);
    expect(limiters.adminLoginLimiter.options.windowMs).toBe(15 * 60 * 1000);
    // 审计 M1：卡密校验防暴力猜解
    expect(limiters.cardLimiter.options.max).toBeLessThanOrEqual(10);
    expect(limiters.cardLimiter.options.windowMs).toBe(60000);
  });
});
