const { v4: uuidv4 } = require('uuid');

const generateOrderNo = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `DK${timestamp}${random}`.toUpperCase();
};

const generatePacketNo = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `PK${timestamp}${random}`.toUpperCase();
};

const generateCallNo = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `CL${timestamp}${random}`.toUpperCase();
};

const generateUUID = () => {
  return uuidv4();
};

const generateShortId = () => {
  return Math.random().toString(36).substring(2, 10);
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

const parseQuery = (query) => {
  const page = parseInt(query.page) || 1;
  const pageSize = parseInt(query.pageSize) || 20;
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
