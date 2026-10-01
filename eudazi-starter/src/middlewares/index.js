// 中间件统一出口，便于在 app 中按名引用。
const { sanitizeInput, xssProtection } = require('./security');
const { adminAuth } = require('./auth');

module.exports = { sanitizeInput, xssProtection, adminAuth };
