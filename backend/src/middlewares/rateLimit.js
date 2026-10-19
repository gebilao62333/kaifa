const rateLimit = require('express-rate-limit');
const config = require('../config');

// 审计 H-8：原先六个限流器里有五个挂着 `skip: (req) => config.nodeEnv === 'development'`，
// 而 `config/index.js` 对 NODE_ENV 的兜底值正是 'development'——只要部署时忘了设 NODE_ENV，
// 全局/登录/短信/卡密/上传五道限流就在生产机器上整体放行，限流形同不存在（后台登录限流是唯一例外）。
// 现在取消按环境放行，只保留一个显式开关 RATE_LIMIT_DISABLED=true，
// 且生产环境声明它会被 server.js 的 enforceProductionConfig 直接拒绝启动。
const skip = () => config.rateLimit.disabled === true;

// IP 取自 req.ip，其可信度取决于 app.set('trust proxy', config.trustProxy)（见 config/trustProxy.js）。
// 换代理/僵尸网络仍可绕过纯 IP 维度，因此账号维度的失败锁定（services/adminLoginGuard.js）
// 与验证码服务端计数（services/smsService.js）是必须的叠加项，不是可选项。
const standardHeaders = true;
const legacyHeaders = false;

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders,
  legacyHeaders,
  skip
});

// 审计 M11：登录限流原来 100 次/15 分钟，对撞库过于宽松，收紧到 20 次/15 分钟。
// 可通过 LOGIN_RATE_LIMIT_MAX 覆盖（如需配合压测）。
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 20,
  message: {
    code: 429,
    message: '登录尝试次数过多，请15分钟后再试'
  },
  standardHeaders,
  legacyHeaders,
  skip
});

// 审计 H-3：后台登录口令的爆破面。管理端流量本来就低，单 IP 15 分钟只给 5 次尝试；
// 账号维度的失败锁定见 services/adminLoginGuard.js（换代理即可绕过纯 IP 限流，两道要叠加）。
// 若确实需要放开（如压测），把 ADMIN_LOGIN_RATE_LIMIT_MAX 调大即可。
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.ADMIN_LOGIN_RATE_LIMIT_MAX) || 5,
  message: {
    code: 429,
    message: '后台登录尝试次数过多，请15分钟后再试'
  },
  standardHeaders,
  legacyHeaders,
  skip
});

// 审计 H-8：本条此前也带 skipInDev，本地连点三次发送验证码不会有任何提示，
// 上线后却会撞 429——现在开发/生产同一口径，需要放宽用 SMS_RATE_LIMIT_MAX。
const smsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.rateLimit.smsMax,
  message: {
    code: 429,
    message: '验证码发送过于频繁，请60秒后再试'
  },
  standardHeaders,
  legacyHeaders,
  skip
});

// 审计 M1：卡密校验是"猜卡号+密码"的攻击面，单 IP 限 10 次/分钟
const cardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    code: 429,
    message: '卡密校验过于频繁，请稍后再试'
  },
  standardHeaders,
  legacyHeaders,
  skip
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    code: 429,
    message: '上传过于频繁，请稍后再试'
  },
  standardHeaders,
  legacyHeaders,
  skip
});

module.exports = {
  apiLimiter,
  loginLimiter,
  adminLoginLimiter,
  smsLimiter,
  cardLimiter,
  uploadLimiter
};
