const path = require('path');

// 允许落盘的安全扩展名（与 services/uploadService.js 各类型白名单并集一致）
const SAFE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.mp3', '.wav', '.amr',
  '.mp4'
]);

// mimetype → 规范扩展名（客户端文件名后缀不可信时的兜底）
const MIME_EXTENSION = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/amr': '.amr',
  'video/mp4': '.mp4'
};

// 安全审计 M-12：直接采用客户端文件名后缀落盘会引入存储型 XSS
// （/uploads 为静态目录，MIME 可伪造绕过 fileFilter）。仅返回安全后缀；
// 原始后缀不在白名单时回退到 mimetype 映射；两者都不可用则返回空串
// （无后缀文件静态访问为 octet-stream，不可执行）。
const safeExtension = (originalname, mimetype) => {
  const raw = path.extname(String(originalname == null ? '' : originalname)).toLowerCase();
  if (SAFE_EXTENSIONS.has(raw)) return raw;
  return MIME_EXTENSION[mimetype] || '';
};

module.exports = { SAFE_EXTENSIONS, MIME_EXTENSION, safeExtension };
