const cryptoUtil = require('./crypto');
const config = require('../config');
const logger = require('./logger');

// 审计 M-8：实名信息（真实姓名 / 身份证号 / 正反面照）属于敏感个人信息，
// 历史实现直接明文落库，且 utils/crypto.js 提供的 AES-256-GCM 加密能力全项目零引用。
// 这里把加密能力接到实名字段的读写链路上：写入前加密、读取后解密。
//
// 密钥来源：PII_ENCRYPTION_KEY（见 config.pii.encryptionKey）。生产环境缺失即拒绝启动（见 server.js）——
// 宁可让实名功能不可用，也不允许敏感个人信息以明文进入数据库。
//
// 兼容存量：历史明文行不做强制回填（与 C-2/H-6 的既有取向一致），读取侧按「密文特征」判定，
// 命中才解密、未命中按明文原样返回，保证新旧数据都能正常展示。

const getKey = () => config.pii.encryptionKey;
const isConfigured = () => Boolean(getKey());

// 密文形态 = salt(64) + iv(16) + tag(16) + 密文 的十六进制拼接，最短 192 字符且全为十六进制。
// 真名/身份证/URL 明文都不满足该形态（身份证虽全为数字但长度远不足 192），据此区分存量明文与密文。
const CIPHER_PATTERN = /^[0-9a-f]+$/;
const MIN_CIPHER_LENGTH = 192;

const looksEncrypted = (value) =>
  typeof value === 'string' && value.length >= MIN_CIPHER_LENGTH && CIPHER_PATTERN.test(value);

let warnedMissingKey = false;

const encryptField = (value) => {
  if (value === null || value === undefined || value === '') {
    return value;
  }
  if (!isConfigured()) {
    if (config.nodeEnv === 'production') {
      throw new Error('实名信息加密密钥未配置（PII_ENCRYPTION_KEY），拒绝以明文存储敏感个人信息');
    }
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      logger.warn('[PII] PII_ENCRYPTION_KEY 未配置，实名信息将以明文存储（仅非生产环境允许，切勿在生产使用）');
    }
    return String(value);
  }
  return cryptoUtil.encrypt(String(value), getKey());
};

const decryptField = (value) => {
  if (value === null || value === undefined || value === '') {
    return value;
  }
  // 存量明文：原样返回，避免把历史数据「解密」成乱码
  if (!looksEncrypted(value)) {
    return value;
  }
  if (!isConfigured()) {
    // 已是密文却无密钥：只告警并返回空，绝不返回密文或明文（宁可让前端拿不到，也不泄露）
    logger.warn('[PII] 存在已加密的实名信息，但 PII_ENCRYPTION_KEY 未配置，无法解密');
    return '';
  }
  try {
    return cryptoUtil.decrypt(String(value), getKey());
  } catch (error) {
    logger.warn('[PII] 实名信息解密失败（密钥不匹配或数据损坏），已按空值处理');
    return '';
  }
};

module.exports = {
  isConfigured,
  looksEncrypted,
  encryptField,
  decryptField
};
