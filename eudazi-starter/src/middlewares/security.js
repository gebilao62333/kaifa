// 轻量输入安全层：转义常见 XSS 向量，并对字符串做 HTML 实体编码。
const xssPatterns = [
  /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gi,
  /<svg\b[^>]*>/gi,
  /eval\s*\(/gi,
  /expression\s*\(/gi,
];

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  let sanitized = input;
  xssPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '');
  });
  return sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  // 注意：不要转义 '/'，否则会破坏所有 URL 字段（下载链接、Banner 跳转地址等）
};

// 递归处理 body / query，对字符串字段做转义。
const xssProtection = (req, res, next) => {
  const walk = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') obj[key] = sanitizeInput(obj[key]);
      else if (obj[key] && typeof obj[key] === 'object') walk(obj[key]);
    }
  };
  if (req.body && typeof req.body === 'object') walk(req.body);
  if (req.query && typeof req.query === 'object') walk(req.query);
  next();
};

module.exports = { sanitizeInput, xssProtection };
