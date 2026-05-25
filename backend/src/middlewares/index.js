const { authMiddleware, optionalAuth, adminAuth } = require('./auth');
const { apiLimiter, loginLimiter, smsLimiter, uploadLimiter } = require('./rateLimit');
const { validate, validateQuery } = require('./validation');
const { xssProtection, csrfProtection, sanitizeInput, generateCsrfToken } = require('./security');

module.exports = {
  authMiddleware,
  optionalAuth,
  adminAuth,
  apiLimiter,
  loginLimiter,
  smsLimiter,
  uploadLimiter,
  validate,
  validateQuery,
  xssProtection,
  csrfProtection,
  sanitizeInput,
  generateCsrfToken
};
