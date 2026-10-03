jest.mock('express-rate-limit', () => jest.fn((options) => {
  const mw = (req, res, next) => next();
  mw.options = options;
  return mw;
}));
jest.mock('../../../src/config', () => {
  const os = require('os');
  const path = require('path');
  return {
    nodeEnv: 'test',
    rateLimit: { windowMs: 60000, maxRequests: 100 },
    paths: { logs: path.join(os.tmpdir(), 'dsh-ratelimit-logs') }
  };
});

const rateLimit = require('express-rate-limit');
const config = require('../../../src/config');
const limiters = require('../../../src/middlewares/rateLimit');

describe('Middleware - RateLimit', () => {
  it('exports five configured limiters', () => {
    expect(typeof limiters.apiLimiter).toBe('function');
    expect(typeof limiters.loginLimiter).toBe('function');
    expect(typeof limiters.smsLimiter).toBe('function');
    expect(typeof limiters.cardLimiter).toBe('function');
    expect(typeof limiters.uploadLimiter).toBe('function');
    expect(rateLimit).toHaveBeenCalledTimes(5);
  });

  it('configures windowMs and 429 message', () => {
    expect(limiters.apiLimiter.options.windowMs).toBe(60000);
    expect(limiters.apiLimiter.options.max).toBe(100);
    expect(limiters.apiLimiter.options.message.code).toBe(429);
    expect(limiters.smsLimiter.options.max).toBe(1);
    expect(limiters.uploadLimiter.options.max).toBe(20);
  });

  it('登录限流已收紧，卡密校验有独立限流', () => {
    // 审计 M11：原 100 次/15 分钟过宽
    expect(limiters.loginLimiter.options.max).toBeLessThanOrEqual(20);
    expect(limiters.loginLimiter.options.windowMs).toBe(15 * 60 * 1000);
    // 审计 M1：卡密校验防暴力猜解
    expect(limiters.cardLimiter.options.max).toBeLessThanOrEqual(10);
    expect(limiters.cardLimiter.options.windowMs).toBe(60000);
  });

  it('skips limiting only in development', () => {
    config.nodeEnv = 'development';
    expect(limiters.apiLimiter.options.skip({}, {})).toBe(true);
    config.nodeEnv = 'test';
    expect(limiters.apiLimiter.options.skip({}, {})).toBe(false);
  });
});
