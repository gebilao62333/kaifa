const rateLimit = require('express-rate-limit');
const config = require('../config');

const skipInDev = (req, res) => config.nodeEnv === 'development';

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    code: 429,
    message: '登录尝试次数过多，请15分钟后再试'
  },
  skip: skipInDev
});

const smsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  message: {
    code: 429,
    message: '验证码发送过于频繁，请60秒后再试'
  },
  skip: skipInDev
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    code: 429,
    message: '上传过于频繁，请稍后再试'
  },
  skip: skipInDev
});

module.exports = {
  apiLimiter,
  loginLimiter,
  smsLimiter,
  uploadLimiter
};
