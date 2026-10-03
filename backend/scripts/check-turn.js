#!/usr/bin/env node
/**
 * TURN / STUN 连通性自检（纯 Node，无第三方依赖）
 *
 * 用途：镜像上线后确认 coturn（或购买的 TURN 服务）真的可用，
 *      而不是等到用户反馈「对称 NAT 打不通」才发现。
 *
 * 用法：
 *   node scripts/check-turn.js                                  # 只测 STUN 可达性
 *   node scripts/check-turn.js --host turn.example.com --port 3478 --user eudazi --pass 'xxx'
 *   node scripts/check-turn.js --stun stun.l.google.com:19302   # 指定 STUN 服务器
 *
 * 输出：STUN 是否响应、观察到的公网出口（判断是否在 NAT 后）、
 *      TURN 是否分配成功（含中继地址与有效期）。
 */
const dgram = require('dgram');
const crypto = require('crypto');
const zlib = require('zlib');
const os = require('os');

const MAGIC = 0x2112a442;
const TYPE_BINDING_REQUEST = 0x0001;
const TYPE_BINDING_SUCCESS = 0x0101;
const TYPE_ALLOCATE_REQUEST = 0x0003;
const TYPE_ALLOCATE_SUCCESS = 0x0103;
const TYPE_ALLOCATE_ERROR = 0x0113;
const ATTR_MAPPED = 0x0001;
const ATTR_USERNAME = 0x0006;
const ATTR_MESSAGE_INTEGRITY = 0x0008;
const ATTR_ERROR_CODE = 0x0009;
const ATTR_LIFETIME = 0x000d;
const ATTR_XOR_PEER = 0x0012;
const ATTR_REALM = 0x0014;
const ATTR_NONCE = 0x0015;
const ATTR_XOR_RELAYED = 0x0016;
const ATTR_REQUESTED_TRANSPORT = 0x0019;
const ATTR_XOR_MAPPED = 0x0020;

const arg = (name, def) => {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
};

const splitHostPort = (s, defPort) => {
  const idx = s.lastIndexOf(':');
  if (idx < 0) return { host: s, port: defPort };
  return { host: s.slice(0, idx), port: Number(s.slice(idx + 1)) };
};

const header = (type, len, txid) => {
  const b = Buffer.alloc(20);
  b.writeUInt16BE(type, 0);
  b.writeUInt16BE(len, 2);
  b.writeUInt32BE(MAGIC, 4);
  txid.copy(b, 8);
  return b;
};

const attr = (type, value) => {
  const pad = (4 - (value.length % 4)) % 4;
  const b = Buffer.alloc(4 + value.length + pad);
  b.writeUInt16BE(type, 0);
  b.writeUInt16BE(value.length, 2);
  value.copy(b, 4);
  return b;
};

const parseAttrs = (buf) => {
  const out = {};
  let i = 20;
  while (i + 4 <= buf.length) {
    const type = buf.readUInt16BE(i);
    const len = buf.readUInt16BE(i + 2);
    out[type] = buf.slice(i + 4, i + 4 + len);
    i += 4 + len + ((4 - (len % 4)) % 4);
  }
  return out;
};

const decodeXorAddr = (v) => {
  if (!v || v.length < 8) return null;
  const family = v[1];
  const xport = v.readUInt16BE(2);
  const port = xport ^ (MAGIC >>> 16);
  if (family === 0x01) {
    const raw = v.readUInt32BE(4) ^ MAGIC;
    return ((raw >>> 24) & 255) + '.' + ((raw >>> 16) & 255) + '.' + ((raw >>> 8) & 255) + '.' + (raw & 255) + ':' + port;
  }
  return 'family=' + family + ' port=' + port;
};

const send = (host, port, packet, timeout = 4000) =>
  new Promise((resolve) => {
    const sock = dgram.createSocket('udp4');
    const timer = setTimeout(() => { try { sock.close(); } catch (e) {} resolve(null); }, timeout);
    sock.on('message', (msg) => { clearTimeout(timer); try { sock.close(); } catch (e) {} resolve(msg); });
    sock.on('error', () => { clearTimeout(timer); try { sock.close(); } catch (e) {} resolve(null); });
    sock.send(packet, port, host, (err) => { if (err) { clearTimeout(timer); try { sock.close(); } catch (e) {} resolve(null); } });
  });

// FINGERPRINT：coturn 开启 --fingerprint 时（我们的 compose 默认开启）必须携带，否则返回 400
const withFingerprint = (msg) => {
  const total = msg.length + 8;
  const head = Buffer.from(msg);
  head.writeUInt16BE(total - 20, 2);
  const crc = (zlib.crc32 ? zlib.crc32(head) : 0) ^ 0x5354554e;
  const fp = Buffer.alloc(8);
  fp.writeUInt16BE(0x8028, 0);
  fp.writeUInt16BE(4, 2);
  fp.writeUInt32BE(crc >>> 0, 4);
  return Buffer.concat([head, fp]);
};

const withIntegrity = (msgWithoutMi, key) => {
  // 按 RFC 5389：先按含 MI 属性（24 字节）的长度改写头部，再对整个消息做 HMAC-SHA1
  const total = msgWithoutMi.length + 24;
  const head = Buffer.from(msgWithoutMi);
  head.writeUInt16BE(total - 20, 2);
  const hmac = crypto.createHmac('sha1', key).update(head).digest();
  return withFingerprint(Buffer.concat([head, attr(ATTR_MESSAGE_INTEGRITY, hmac)]));
};

(async () => {
  const stun = splitHostPort(arg('stun', 'stun.l.google.com:19302'), 19302);
  const turnHost = arg('host', '');
  const turnPort = Number(arg('port', 3478));
  const user = arg('user', '');
  const pass = arg('pass', '');
  const result = { stun: null, localIps: [], turn: null };

  // ---- 1) STUN 绑定：验证 UDP 可达 + 观察公网出口 ----
  const txid = crypto.randomBytes(12);
  const resp = await send(stun.host, stun.port, header(TYPE_BINDING_REQUEST, 0, txid));
  if (!resp) {
    result.stun = { ok: false, error: '无响应（UDP 被拦截或服务器不可达）' };
  } else {
    const attrs = parseAttrs(resp);
    const mapped = decodeXorAddr(attrs[ATTR_XOR_MAPPED]) || decodeXorAddr(attrs[ATTR_MAPPED]);
    const ifaces = os.networkInterfaces();
    for (const list of Object.values(ifaces)) for (const ni of list || []) if (ni.family === 'IPv4' && !ni.internal) result.localIps.push(ni.address);
    result.stun = { ok: resp.readUInt16BE(0) === TYPE_BINDING_SUCCESS, mapped, note: 'mapped 与 localIps 不同说明在 NAT 后，需要 TURN 中继' };
  }

  // ---- 2) TURN Allocate：先拿 realm/nonce，再带鉴权重发 ----
  if (turnHost) {
    const tx1 = crypto.randomBytes(12);
    const reqTransport = Buffer.alloc(4);
    reqTransport.writeUInt8(17, 0); // UDP
    const allocate1 = withFingerprint(Buffer.concat([header(TYPE_ALLOCATE_REQUEST, 0, tx1), attr(ATTR_REQUESTED_TRANSPORT, reqTransport)]));
    const r1 = await send(turnHost, turnPort, allocate1);
    if (!r1) {
      result.turn = { ok: false, error: '无响应（检查端口/防火墙：3478/udp 是否放行）' };
    } else {
      const a1 = parseAttrs(r1);
      const realm = a1[ATTR_REALM] ? a1[ATTR_REALM].toString('utf8') : '';
      const nonce = a1[ATTR_NONCE] ? a1[ATTR_NONCE].toString('utf8') : '';
      const type1 = r1.readUInt16BE(0);
      if (type1 === TYPE_ALLOCATE_SUCCESS) {
        const a = parseAttrs(r1);
        result.turn = { ok: true, relayed: decodeXorAddr(a[ATTR_XOR_RELAYED]), note: '未要求鉴权即分配成功' };
      } else if (!realm || !user) {
        result.turn = { ok: false, stage: 'challenge', realm, hasNonce: !!nonce, error: user ? '未拿到 realm/nonce' : 'TURN 需要鉴权，请用 --user/--pass 提供' };
      } else {
        const key = crypto.createHash('md5').update(user + ':' + realm + ':' + pass).digest();
        const tx2 = crypto.randomBytes(12);
        const partial = Buffer.concat([
          header(TYPE_ALLOCATE_REQUEST, 0, tx2),
          attr(ATTR_REQUESTED_TRANSPORT, reqTransport),
          attr(ATTR_USERNAME, Buffer.from(user, 'utf8')),
          attr(ATTR_REALM, Buffer.from(realm, 'utf8')),
          attr(ATTR_NONCE, Buffer.from(nonce, 'utf8'))
        ]);
        const r2 = await send(turnHost, turnPort, withIntegrity(partial, key));
        if (!r2) {
          result.turn = { ok: false, stage: 'authenticated-allocate', error: '鉴权请求无响应' };
        } else {
          const t2 = r2.readUInt16BE(0);
          const a2 = parseAttrs(r2);
          if (t2 === TYPE_ALLOCATE_SUCCESS) {
            const lt = a2[ATTR_LIFETIME] ? a2[ATTR_LIFETIME].readUInt32BE(0) : null;
            result.turn = { ok: true, relayed: decodeXorAddr(a2[ATTR_XOR_RELAYED]), lifetimeSec: lt, realm };
          } else {
            const ec = a2[ATTR_ERROR_CODE];
            const code = ec && ec.length >= 4 ? (ec[2] * 100 + ec[3]) : '?';
            const reason = ec && ec.length > 4 ? ec.slice(4).toString('utf8') : '';
            result.turn = { ok: false, stage: 'authenticated-allocate', code, reason, realm, hint: code === 401 ? '用户名/密码错误' : '检查 coturn 的 --user 与 --external-ip 配置' };
          }
        }
      }
    }
  }

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.stun && result.stun.ok ? 0 : 1);
})();
