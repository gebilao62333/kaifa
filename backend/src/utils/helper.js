const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// 审计 L6：订单号/流水号后缀改用随机字节，避免可预测 + 降低碰撞概率
const randomSuffix = (bytes = 5) => crypto.randomBytes(bytes).toString('hex').slice(0, 8).toUpperCase();

const generateOrderNo = () => {
  const timestamp = Date.now();
  return `DK${timestamp}${randomSuffix()}`.toUpperCase();
};

const generatePacketNo = () => {
  const timestamp = Date.now();
  return `PK${timestamp}${randomSuffix(4)}`.toUpperCase();
};

const generateCallNo = () => {
  const timestamp = Date.now();
  return `CL${timestamp}${randomSuffix(4)}`.toUpperCase();
};

const generateUUID = () => {
  return uuidv4();
};

const generateShortId = () => {
  return crypto.randomBytes(6).toString('hex');
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const getTimestamp = () => {
  return Math.floor(Date.now() / 1000);
};

const getDateStr = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toISOString().slice(0, 10);
};

const MAX_PAGE_SIZE = 100;

const parseQuery = (query) => {
  // 审计 M7：不限制 pageSize 会让 pageSize=999999 拖垮数据库
  const page = Math.max(1, parseInt(query.page) || 1);
  const pageSize = Math.min(Math.max(1, parseInt(query.pageSize) || 20), MAX_PAGE_SIZE);
  const offset = (page - 1) * pageSize;
  
  return {
    page,
    pageSize,
    offset,
    limit: pageSize
  };
};

const formatPaginatedResponse = (data, total, page, pageSize) => {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    list: data
  };
};

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await sleep(delay * attempt);
    }
  }
};

module.exports = {
  generateOrderNo,
  generatePacketNo,
  generateCallNo,
  generateUUID,
  generateShortId,
  formatTime,
  getTimestamp,
  getDateStr,
  parseQuery,
  formatPaginatedResponse,
  sleep,
  retry
};
