const cryptoUtil = require('./crypto');
const config = require('../config');
const logger = require('./logger');

// 审计 M-8：实名信息（真实姓名 / 身份证号 / 正反面照）属于敏感个人信息，
// 历史实现直接明文落库，且 utils/crypto.js 提供的 AES-256-GCM 加密能力全项目零引用。
// 这里把加密能力接到实名字段的读写链路上：写入前加密、读取后解密。
// B-10 起卡密密码也复用本模块。
//
// 密钥来源：PII_ENCRYPTION_KEY（见 config.pii.encryptionKey）。生产环境缺失即拒绝启动（见 server.js）——
// 宁可让实名功能不可用，也不允许敏感个人信息以明文进入数据库。
//
// 兼容存量：历史明文行不做强制回填（与 C-2/H-6 的既有取向一致），读取侧按「密文特征」判定，
// 命中才解密、未命中按明文原样返回，保证新旧数据都能正常展示。
//
// 审计 B-9：加入密钥轮换支持——PII_ENCRYPTION_KEY_PREVIOUS 作为「上一把钥匙」，
// 解密时依次尝试当前/上一把，encryptField 永远用当前钥；配套 scripts/rotate-pii-key.js
// 把存量密文重加密后即可摘掉旧钥（步骤如下）：
//   1) 新钥写入 PII_ENCRYPTION_KEY、旧钥写入 PII_ENCRYPTION_KEY_PREVIOUS，滚动重启（读写均可用）；
//   2) node scripts/rotate-pii-key.js  —— 把上一把钥的密文全部重加密为当前钥；
//   3) 确认脚本报告 remaining=0 后，删除 PII_ENCRYPTION_KEY_PREVIOUS。

// config.pii 在极少数测试/旧配置对象里可能缺省，这里防御式读取：缺省视为「未配置密钥」，
// 由下面的 isConfigured/生产启动闸门决定是否允许明文（生产缺失会被 server.js 拒绝启动）。
const getCurrentKey = () => (config.pii && config.pii.encryptionKey) || '';
const getPreviousKey = () => (config.pii && config.pii.encryptionKeyPrevious) || '';
const isConfigured = () => Boolean(getCurrentKey());

// 解密候选钥：当前钥优先，其次上一把（轮换窗口内两者都可用）；去重避免重复尝试
const decryptKeys = () => {
  const keys = [getCurrentKey(), getPreviousKey()].filter(Boolean);
  return keys.filter((key, idx) => keys.indexOf(key) === idx);
};

// 密文形态 = salt(64) + iv(16) + tag(16) + 密文 的十六进制拼接，最短 192 字符且全为十六进制。
// 真名/身份证/URL 明文都不满足该形态（身份证虽全为数字但长度远不足 192），据此区分存量明文与密文。
const CIPHER_PATTERN = /^[0-9a-f]+$/;
const MIN_CIPHER_LENGTH = 192;

const looksEncrypted = (value) =>
  typeof value === 'string' && value.length >= MIN_CIPHER_LENGTH && CIPHER_PATTERN.test(value);

// 用任一候选钥解密；全部失败返回 null（由调用方决定告警/空值）
const decryptWithAnyKey = (value) => {
  for (const key of decryptKeys()) {
    try {
      return cryptoUtil.decrypt(String(value), key);
    } catch (error) {
      // 换下一把钥匙；只有全失败才算解密失败
    }
  }
  return null;
};

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
  return cryptoUtil.encrypt(String(value), getCurrentKey());
};

const decryptField = (value) => {
  if (value === null || value === undefined || value === '') {
    return value;
  }
  // 存量明文：原样返回，避免把历史数据「解密」成乱码
  if (!looksEncrypted(value)) {
    return value;
  }
  if (decryptKeys().length === 0) {
    // 已是密文却无密钥：只告警并返回空，绝不返回密文或明文（宁可让前端拿不到，也不泄露）
    logger.warn('[PII] 存在已加密的实名信息，但 PII_ENCRYPTION_KEY 未配置，无法解密');
    return '';
  }
  const plain = decryptWithAnyKey(value);
  if (plain === null) {
    logger.warn('[PII] 实名信息解密失败（密钥不匹配或数据损坏），已按空值处理');
    return '';
  }
  return plain;
};

// B-9：该密文是否只能用「上一把钥匙」解（= 需要重加密才能安全摘掉旧钥）。
// 明文、无法解密的脏数据都返回 false，避免轮换脚本误写。
const needsRotation = (value) => {
  if (!looksEncrypted(value)) return false;
  const currentKey = getCurrentKey();
  const previousKey = getPreviousKey();
  if (!currentKey || !previousKey || currentKey === previousKey) return false;
  try {
    cryptoUtil.decrypt(String(value), currentKey);
    return false; // 当前钥已能解，无需轮换
  } catch (error) {
    try {
      cryptoUtil.decrypt(String(value), previousKey);
      return true; // 仅旧钥能解
    } catch (error2) {
      return false;
    }
  }
};

module.exports = {
  isConfigured,
  looksEncrypted,
  encryptField,
  decryptField,
  needsRotation
};
