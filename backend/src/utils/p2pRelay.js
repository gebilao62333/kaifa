const config = require('../config');

// 安全审计 M-10：P2P 热内容取回信令此前把客户端可控的 `url` / `fallbackUrl` 原样转发给
// 「资源拥有方」（`socket.on('p2p_fetch_request'|'p2p_offer'|'p2p_fetch_response')`），而拥有方
// 客户端会直接 `fetch(url)`。服务端零校验意味着任何登录用户都能指定「任意目标用户 + 任意 URL」，
// 把对方的浏览器变成对内网/回环/云元数据地址的 SSRF 探针（如 `http://169.254.169.254/latest/`），
// 或借 `fallbackUrl` 做外链钓鱼/追踪；`toId`/`requestId` 亦无约束，可向任意 `user:` 房间投递。
//
// 这里把「可转发的媒体来源」收敛为平台自有存储的主机白名单，并给目标/请求 ID 与结构化信令字段
// 加上类型与长度上限；不合法一律丢弃——P2P 本就是可回退的尽力而为链路，丢弃后客户端会走常规直连。

const MAX_URL_LEN = 2048;
const MAX_REQUEST_ID_LEN = 64;
// 单个 offer/answer/candidate/payload 序列化后的上限，避免信令洪泛/超大对象中转
const MAX_SIGNAL_FIELD_LEN = 64 * 1024;
const MAX_TYPE_LEN = 16;
const ALLOWED_TYPES = ['image', 'video', 'audio', 'file'];

// 从 URL 或裸域名取出小写主机名；解析失败返回 null
const hostOf = (value) => {
  if (!value || typeof value !== 'string') return null;
  try {
    const u = new URL(value.includes('://') ? value : `https://${value}`);
    return u.hostname.toLowerCase();
  } catch (e) {
    return null;
  }
};

// 平台自有媒体主机白名单：自身站点域名 + 配置的 COS / 七牛 / OSS 域名；
// 端口白名单：默认 80/443 + 平台站点自身端口（本地开发 http://localhost:3000 亦可用）。
const collectAllowlist = (cfg = config) => {
  const hosts = new Set();
  const add = (v) => { const h = hostOf(v); if (h) hosts.add(h); };
  add(cfg && cfg.baseUrl);
  const cos = cfg && cfg.storage && cfg.storage.cos;
  if (cos && cos.bucket && cos.region) add(`${cos.bucket}.cos.${cos.region}.myqcloud.com`);
  add(cfg && cfg.storage && cfg.storage.qiniu && cfg.storage.qiniu.domain);
  add(cfg && cfg.storage && cfg.storage.oss && cfg.storage.oss.domain);
  const ports = new Set(['80', '443']);
  if (cfg && typeof cfg.baseUrl === 'string') {
    try { const p = new URL(cfg.baseUrl).port; if (p) ports.add(p); } catch (e) { /* 忽略非法 baseUrl */ }
  }
  return { hosts, ports };
};

// 仅放行指向平台自有主机的 http(s) 媒体地址；相对路径（/uploads/x.png）按平台域名补全。
// 显式拒绝非 http(s) 协议（javascript:/data:/file:/blob:）、带 userinfo 的混淆写法、
// 白名单之外的端口，以及一切不在白名单内的主机（内网、回环、169.254、任意外域）。
const isSafeMediaUrl = (raw, allowlist) => {
  if (typeof raw !== 'string') return false;
  const value = raw.trim();
  if (!value || value.length > MAX_URL_LEN) return false;
  let u;
  try {
    u = new URL(value, config.baseUrl);
  } catch (e) {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  if (u.username || u.password) return false;
  const { hosts, ports } = allowlist || collectAllowlist();
  if (u.port && !ports.has(u.port)) return false;
  return hosts.has(u.hostname.toLowerCase());
};

// 目标用户 ID：正整数、非自身；非法返回 null（信令只用于端到端转发，不给自身投递）
const normalizeRelayTarget = (toId, selfId) => {
  const raw = typeof toId === 'number' ? String(toId) : (typeof toId === 'string' ? toId : '');
  if (!/^\d{1,15}$/.test(raw)) return null;
  const id = Number(raw);
  if (id <= 0 || !Number.isSafeInteger(id)) return null;
  if (selfId != null && id === Number(selfId)) return null;
  return id;
};

// 请求 ID：非空字符串、限于可打印安全字符集、长度受限
const normalizeRequestId = (raw) => {
  if (typeof raw !== 'string') return null;
  if (!raw || raw.length > MAX_REQUEST_ID_LEN) return null;
  return /^[A-Za-z0-9._:-]+$/.test(raw) ? raw : null;
};

// 媒体类型：白名单内才透传，否则丢弃（拥有方不依赖该字段，仅作提示）
const normalizeType = (raw) => (
  typeof raw === 'string' && raw.length <= MAX_TYPE_LEN && ALLOWED_TYPES.includes(raw) ? raw : undefined
);

// 结构化信令字段（offer/answer/candidate/payload）：可 JSON 序列化且不超过上限；缺省视为合法
const isBoundedSignal = (raw) => {
  if (raw == null) return true;
  if (typeof raw !== 'object') return false;
  try {
    return JSON.stringify(raw).length <= MAX_SIGNAL_FIELD_LEN;
  } catch (e) {
    return false;
  }
};

module.exports = {
  MAX_URL_LEN,
  MAX_REQUEST_ID_LEN,
  MAX_SIGNAL_FIELD_LEN,
  collectAllowlist,
  isSafeMediaUrl,
  normalizeRelayTarget,
  normalizeRequestId,
  normalizeType,
  isBoundedSignal
};
