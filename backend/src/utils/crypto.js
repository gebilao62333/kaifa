const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const ITERATIONS = 10000;

const getKey = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
};

const encrypt = (text, password) => {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey(password, salt);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return salt.toString('hex') + iv.toString('hex') + tag.toString('hex') + encrypted;
};

const decrypt = (encryptedData, password) => {
  const salt = Buffer.from(encryptedData.substr(0, SALT_LENGTH * 2), 'hex');
  const iv = Buffer.from(encryptedData.substr(SALT_LENGTH * 2, IV_LENGTH * 2), 'hex');
  const tag = Buffer.from(encryptedData.substr(SALT_LENGTH * 2 + IV_LENGTH * 2, TAG_LENGTH * 2), 'hex');
  const encrypted = encryptedData.substr(SALT_LENGTH * 2 + IV_LENGTH * 2 + TAG_LENGTH * 2);
  
  const key = getKey(password, salt);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

/**
 * @deprecated 使用 bcrypt 或 PBKDF2 代替。此函数仅用于向后兼容。
 */
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

/**
 * 验证由 hashPassword 生成的密码
 */
const verifyPassword = (password, storedHash) => {
  if (!storedHash) return false;
  // 兼容旧版无盐SHA256
  if (!storedHash.includes(':')) {
    const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
    return legacyHash === storedHash;
  }
  const [salt, hash] = storedHash.split(':');
  const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return computedHash === hash;
};

/**
 * @deprecated MD5 不应用于安全场景。仅用于生成非安全哈希（如缓存键）。
 */
const md5 = (text) => {
  return crypto.createHash('md5').update(text).digest('hex');
};

/**
 * @deprecated SHA1 不应用于安全场景。仅用于生成非安全哈希。
 */
const sha1 = (text) => {
  return crypto.createHash('sha1').update(text).digest('hex');
};

const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  md5,
  sha1,
  generateRandomString
};
