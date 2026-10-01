// 全局 XSS 中间件会把输入中的特殊字符转义（如 '/' -> '&#x2F;'），
// 这会导致下载链接失效。本模块在对外输出/跳转前把 HTML 实体还原为正常字符。
const decodeEntities = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&#x2F;/g, '/')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

module.exports = { decodeEntities };
