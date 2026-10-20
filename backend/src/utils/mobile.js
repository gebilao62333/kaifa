const crypto = require('crypto');
const config = require('../config');
const pii = require('./pii');
const logger = require('./logger');

// 《未完成事项清单》B-7：手机号（unique 查号键）静态加密 + 盲索引。
//
// 为什么需要盲索引：手机号要用来「按号查人」（登录/注册查重/找回密码），
// 直接加密后随机 salt 让密文不可等值查询。做法是再加一列确定性摘要 mobile_hash
// （HMAC-SHA256(PII 密钥, 规范化手机号)），查询一律走 hash，明文只用于展示时解密。
//
// 规范化：去空格与连字符；不做 +86 前缀猜测，避免把 +8613xxx 与 13xxx 当同一号
// （历史数据没有统一格式，猜测会引入串号风险）。
// 密钥：与 PII 加密同一把钥匙（PII_ENCRYPTION_KEY）。生产缺钥会被启动闸门拒绝；
// 非生产缺钥时退回加盐域分隔的 SHA-256，保证本地联调与测试可预测。
const normalize = (value) => String(value === null || value === undefined ? '' : value).trim().replace(/[\s-]/g, '');

const hashKey = () => (config.pii && config.pii.encryptionKey) || '';

const hashMobile = (value) => {
  const phone = normalize(value);
  if (!phone) return null;
  const key = hashKey();
  if (key) {
    return crypto.createHmac('sha256', key).update(phone).digest('hex');
  }
  if (config.nodeEnv === 'production') {
    throw new Error('手机号盲索引需要 PII_ENCRYPTION_KEY（生产环境拒绝无密钥运行）');
  }
  if (!warnedMissingKey) {
    warnedMissingKey = true;
    logger.warn('[Mobile] PII_ENCRYPTION_KEY 未配置，手机号盲索引使用非生产回退哈希（切勿用于生产）');
  }
  return crypto.createHash('sha256').update('dev:' + phone).digest('hex');
};

let warnedMissingKey = false;

const encryptMobile = (value) => {
  const phone = normalize(value);
  if (!phone) return null;
  return pii.encryptField(phone);
};

const decryptMobile = (value) => pii.decryptField(value);

// 写入用：返回 { mobile, mobile_hash }，空号一律写 null（避免 ''.length 与唯一索引冲突）
const mobileFields = (value) => {
  const phone = normalize(value);
  if (!phone) return { mobile: null, mobile_hash: null };
  return { mobile: encryptMobile(phone), mobile_hash: hashMobile(phone) };
};

// 查询用：按手机号查人一律走盲索引。
// 空号返回不可能命中的哨兵值（不是 null）——`WHERE mobile_hash IS NULL` 会匹配到所有未绑定手机号的用户，
// 用在「按手机号找回密码」这类入口会直接变成账号接管漏洞。
const buildMobileWhere = (value) => {
  const hash = hashMobile(value);
  return { mobile_hash: hash || '__invalid_mobile__' };
};

module.exports = {
  normalize,
  hashMobile,
  encryptMobile,
  decryptMobile,
  mobileFields,
  buildMobileWhere
};
