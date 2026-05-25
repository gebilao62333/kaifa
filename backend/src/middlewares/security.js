const crypto = require('crypto');

const xssPatterns = [
  /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gi,
  /<img\b[^>]*src\s*=\s*["']javascript:/gi,
  /<svg\b[^>]*>/gi,
  /eval\s*\(/gi,
  /expression\s*\(/gi
];

const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  let sanitized = input;
  
  xssPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
};

const xssProtection = (req, res, next) => {
  if (req.body) {
    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeInput(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };
    sanitizeObject(req.body);
  }
  
  if (req.query) {
    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeInput(obj[key]);
        }
      }
    };
    sanitizeObject(req.query);
  }
  
  next();
};

const csrfTokens = new Map();
const CSRF_TOKEN_EXPIRE = 3600000;

const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    let token = req.cookies?.['XSRF-TOKEN'];
    
    if (!token || !csrfTokens.has(token)) {
      token = generateCsrfToken();
      csrfTokens.set(token, Date.now());
      
      res.cookie('XSRF-TOKEN', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: CSRF_TOKEN_EXPIRE
      });
    }
    
    res.locals.csrfToken = token;
    return next();
  }
  
  const tokenFromHeader = req.headers['x-xsrf-token'];
  const tokenFromBody = req.body?._csrf;
  const tokenFromQuery = req.query?._csrf;
  
  const token = tokenFromHeader || tokenFromBody || tokenFromQuery;
  
  if (!token || !csrfTokens.has(token)) {
    return res.status(403).json({
      code: 403,
      message: 'CSRF token无效或缺失'
    });
  }
  
  const tokenTime = csrfTokens.get(token);
  if (Date.now() - tokenTime > CSRF_TOKEN_EXPIRE) {
    csrfTokens.delete(token);
    return res.status(403).json({
      code: 403,
      message: 'CSRF token已过期'
    });
  }
  
  csrfTokens.delete(token);
  const newToken = generateCsrfToken();
  csrfTokens.set(newToken, Date.now());
  res.cookie('XSRF-TOKEN', newToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_EXPIRE
  });
  
  next();
};

const cleanupExpiredTokens = () => {
  const now = Date.now();
  for (const [token, time] of csrfTokens.entries()) {
    if (now - time > CSRF_TOKEN_EXPIRE) {
      csrfTokens.delete(token);
    }
  }
};

setInterval(cleanupExpiredTokens, 3600000);

module.exports = {
  xssProtection,
  csrfProtection,
  sanitizeInput,
  generateCsrfToken
};
