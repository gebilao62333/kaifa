const crypto = require('crypto');

// 审计 M-3：口令/令牌这类密文比较一律走这里，不再用 `===`/`!==`。
// 直接比明文有两个问题：长度不同时提前返回、逐字符比较也在首个不同的字节处早退，
// 攻击者可据响应时间逐位试探。先做定长 sha256 摘要再 timingSafeEqual，
// 既让不同长度的输入也走同一条路径，又不把原文长度暴露给比较函数。
const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a ?? '')).digest();
  const hb = crypto.createHash('sha256').update(String(b ?? '')).digest();
  return crypto.timingSafeEqual(ha, hb);
};

module.exports = { safeEqual };
