const crypto = require('crypto');
const { getRedisClient } = require('../config/redis');

const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  let sanitized = input;
  
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
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

const CSRF_TOKEN_EXPIRE = 3600;
const CSRF_REDIS_PREFIX = 'csrf:';

const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const csrfProtection = async (req, res, next) => {
  try {
    const redis = getRedisClient();
    
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      let token = req.cookies?.['XSRF-TOKEN'];
      
      if (!token) {
        token = generateCsrfToken();
        await redis.set(`${CSRF_REDIS_PREFIX}${token}`, Date.now().toString(), { EX: CSRF_TOKEN_EXPIRE });
        
        res.cookie('XSRF-TOKEN', token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: CSRF_TOKEN_EXPIRE * 1000
        });
      }
      
      res.locals.csrfToken = token;
      return next();
    }
    
    const tokenFromHeader = req.headers['x-xsrf-token'];
    const tokenFromBody = req.body?._csrf;
    const tokenFromQuery = req.query?._csrf;
    
    const token = tokenFromHeader || tokenFromBody || tokenFromQuery;
    
    if (!token) {
      return res.status(403).json({
        code: 403,
        message: 'CSRF token无效或缺失'
      });
    }
    
    const stored = await redis.get(`${CSRF_REDIS_PREFIX}${token}`);
    if (!stored) {
      return res.status(403).json({
        code: 403,
        message: 'CSRF token无效或已过期'
      });
    }
    
    await redis.del(`${CSRF_REDIS_PREFIX}${token}`);
    
    const newToken = generateCsrfToken();
    await redis.set(`${CSRF_REDIS_PREFIX}${newToken}`, Date.now().toString(), { EX: CSRF_TOKEN_EXPIRE });
    res.cookie('XSRF-TOKEN', newToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: CSRF_TOKEN_EXPIRE * 1000
    });
    
    next();
  } catch (error) {
    if (error.message === 'Redis client not initialized') {
      return res.status(500).json({
        code: 500,
        message: '服务器内部错误'
      });
    }
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  xssProtection,
  csrfProtection,
  sanitizeInput,
  generateCsrfToken
};
