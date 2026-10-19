const { authMiddleware, optionalAuth, adminAuth } = require('./auth');
const { requirePermission } = require('./permission');
const { apiLimiter, loginLimiter, adminLoginLimiter, smsLimiter, cardLimiter, uploadLimiter } = require('./rateLimit');
const { validate, validateQuery, LIMITS } = require('./validation');
const { xssProtection, csrfProtection, sanitizeInput, generateCsrfToken } = require('./security');

module.exports = {
  authMiddleware,
  optionalAuth,
  adminAuth,
  requirePermission,
  apiLimiter,
  loginLimiter,
  adminLoginLimiter,
  smsLimiter,
  cardLimiter,
  uploadLimiter,
  validate,
  validateQuery,
  LIMITS,
  xssProtection,
  csrfProtection,
  sanitizeInput,
  generateCsrfToken
};
