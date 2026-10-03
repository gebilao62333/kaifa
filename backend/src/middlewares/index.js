const { authMiddleware, optionalAuth, adminAuth } = require('./auth');
const { requirePermission } = require('./permission');
const { apiLimiter, loginLimiter, smsLimiter, cardLimiter, uploadLimiter } = require('./rateLimit');
const { validate, validateQuery } = require('./validation');
const { xssProtection, csrfProtection, sanitizeInput, generateCsrfToken } = require('./security');

module.exports = {
  authMiddleware,
  optionalAuth,
  adminAuth,
  requirePermission,
  apiLimiter,
  loginLimiter,
  smsLimiter,
  cardLimiter,
  uploadLimiter,
  validate,
  validateQuery,
  xssProtection,
  csrfProtection,
  sanitizeInput,
  generateCsrfToken
};
