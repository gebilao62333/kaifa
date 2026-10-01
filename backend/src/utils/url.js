const config = require('../config');

/**
 * 把相对路径（/uploads/xxx.png 或 xxx.png）补全为可访问的完整 URL
 * 已经是 http(s):// 开头的完整地址则原样返回
 */
const toFullUrl = (url) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return config.baseUrl + (url.startsWith('/') ? url : `/${url}`);
};

module.exports = { toFullUrl };
