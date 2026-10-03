const crypto = require('crypto');
const zlib = require('zlib');
const config = require('../config');
const logger = require('../utils/logger');

// ============================================================================
// TRTC / IM 鉴权票据（UserSig / PrivateMapKey）—— 腾讯官方 TLSSigAPIv2 算法
// 参考实现：https://github.com/Tencent-RTC/tls-sig-api-v2-golang
//
// 算法三要素必须完全一致，否则 TRTC SDK 会判 UserSig 非法而拒绝进房：
//   1) 待签串：逐行拼接 "TLS.identifier:<uid>\nTLS.sdkappid:<appid>\nTLS.time:<t>\nTLS.expire:<e>\n"
//   2) 签名  ：HMAC-SHA256(secretKey) → 标准 base64，写入文档的 TLS.sig 字段
//   3) 编码  ：文档 JSON → zlib 压缩 → 标准 base64 → 腾讯自定义 Base64URL
//              （+ → *，/ → -，= → _）
//
// 历史实现为自造格式（字段 TLS.appId / TLS.userId、直接对 base64 签名、未做 zlib），
// 与官方算法不兼容：即使配置了真实 TRTC_SECRET_KEY，进房仍会因 UserSig 校验失败而失败。
// 本次按官方算法重写，使"配置好密钥即可用"真正成立。
// ============================================================================

const DEFAULT_EXPIRE_SECONDS = 86400; // UserSig 默认有效期 1 天
const ROOM_SIG_EXPIRE_SECONDS = 3600; // 房间票据默认 1 小时
const ALL_PRIVILEGES = 255; // 进房 / 上行 / 下行 / 屏幕分享全权限

// 腾讯自定义 Base64URL 变体
const base64UrlEscape = (base64) =>
  base64.replace(/\+/g, '*').replace(/\//g, '-').replace(/=/g, '_');

const base64UrlUnescape = (str) =>
  String(str).replace(/\*/g, '+').replace(/-/g, '/').replace(/_/g, '=');

const isConfigured = () => !!(config.trtc.appId && config.trtc.secretKey);

const buildContentToBeSigned = (identifier, sdkAppId, currTime, expire, base64UserBuf) => {
  let content = 'TLS.identifier:' + identifier + '\n';
  content += 'TLS.sdkappid:' + sdkAppId + '\n';
  content += 'TLS.time:' + currTime + '\n';
  content += 'TLS.expire:' + expire + '\n';
  if (base64UserBuf != null) {
    content += 'TLS.userbuf:' + base64UserBuf + '\n';
  }
  return content;
};

const hmacSha256Base64 = (contentToBeSigned) =>
  crypto.createHmac('sha256', config.trtc.secretKey).update(contentToBeSigned).digest('base64');

const timingSafeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * 生成官方格式的鉴权票据串。
 * @param {string|number} identifier 用户 ID（仅字母数字下划线连字符，长度 ≤ 32）
 * @param {number} expire 有效期（秒）
 * @param {number} [nowSeconds] 当前时间（秒）；仅用于测试注入固定时间
 * @param {Buffer|null} userBuf 房间权限位缓冲区（PrivateMapKey 使用）
 */
const genSig = (identifier, expire, nowSeconds, userBuf = null) => {
  const appId = parseInt(config.trtc.appId, 10);
  const identifierStr = String(identifier);
  const currTime = Math.floor(nowSeconds === undefined ? Date.now() / 1000 : nowSeconds);
  const expireSeconds = Number(expire);

  const sigDoc = {
    'TLS.ver': '2.0',
    'TLS.identifier': identifierStr,
    'TLS.sdkappid': appId,
    'TLS.time': currTime,
    'TLS.expire': expireSeconds
  };

  let base64UserBuf = null;
  if (userBuf) {
    base64UserBuf = Buffer.from(userBuf).toString('base64');
    sigDoc['TLS.userbuf'] = base64UserBuf;
  }

  sigDoc['TLS.sig'] = hmacSha256Base64(
    buildContentToBeSigned(identifierStr, appId, currTime, expireSeconds, base64UserBuf)
  );

  const compressed = zlib.deflateSync(Buffer.from(JSON.stringify(sigDoc))).toString('base64');
  return base64UrlEscape(compressed);
};

// 按官方 _genUserbuf 的字节布局写入 32 位大端整数
const writeInt32 = (buf, offset, value) => {
  const v = Number(value) >>> 0;
  buf[offset] = (v >>> 24) & 0xFF;
  buf[offset + 1] = (v >>> 16) & 0xFF;
  buf[offset + 2] = (v >>> 8) & 0xFF;
  buf[offset + 3] = v & 0xFF;
};

const genUserBuf = (identifier, authId, expireSeconds, privilegeMap, accountType, roomStr) => {
  const appId = parseInt(config.trtc.appId, 10);
  const account = String(identifier);
  const room = roomStr == null ? null : String(roomStr);
  const accountLength = account.length;
  const roomLength = room ? room.length : 0;

  let length = 1 + 2 + accountLength + 20;
  if (room) length += 2 + roomLength;

  const buf = Buffer.alloc(length);
  let offset = 0;
  buf[offset++] = room ? 1 : 0;
  buf[offset++] = (accountLength & 0xFF00) >> 8;
  buf[offset++] = accountLength & 0x00FF;
  for (; offset < 3 + accountLength; ++offset) {
    buf[offset] = account.charCodeAt(offset - 3);
  }
  writeInt32(buf, offset, appId); offset += 4;
  writeInt32(buf, offset, authId); offset += 4;
  writeInt32(buf, offset, Math.floor(Date.now() / 1000 + expireSeconds)); offset += 4;
  writeInt32(buf, offset, privilegeMap); offset += 4;
  writeInt32(buf, offset, accountType); offset += 4;
  if (room) {
    buf[offset++] = (roomLength & 0xFF00) >> 8;
    buf[offset++] = roomLength & 0x00FF;
    for (; offset < length; ++offset) {
      buf[offset] = room.charCodeAt(offset - (length - roomLength));
    }
  }
  return buf;
};

/**
 * 签发 UserSig。
 * @param {string|number} userId 用户 ID
 * @param {number} [expireSeconds] 有效期（秒），默认 86400
 * @param {number} [nowSeconds] 仅测试用：注入当前时间
 * @returns {{userId:string,userSig:string,appId:number,expireTime:number}|null} 未配置时返回 null
 */
const generateUserSig = (userId, expireSeconds = DEFAULT_EXPIRE_SECONDS, nowSeconds) => {
  if (!isConfigured()) {
    return null;
  }
  const expire = Number(expireSeconds) > 0 ? Number(expireSeconds) : DEFAULT_EXPIRE_SECONDS;
  const currTime = Math.floor(nowSeconds === undefined ? Date.now() / 1000 : nowSeconds);

  return {
    userId: String(userId),
    userSig: genSig(userId, expire, currTime),
    appId: parseInt(config.trtc.appId, 10),
    expireTime: currTime + expire
  };
};

const generateRoomId = (userId1, userId2) => {
  const sorted = [userId1, userId2].sort((a, b) => a - b);
  return String(sorted[0]) + '-' + String(sorted[1]);
};

/**
 * 签发房间级权限票据 PrivateMapKey（与 UserSig 配合使用，可限制只能进入指定房间）。
 * 采用官方 genPrivateMapKeyWithStringRoomID 的字符串房间号变体。
 */
const generateRoomSig = (roomId, userId, expireSeconds = ROOM_SIG_EXPIRE_SECONDS) => {
  if (!isConfigured()) {
    return null;
  }
  const expire = Number(expireSeconds) > 0 ? Number(expireSeconds) : ROOM_SIG_EXPIRE_SECONDS;
  const userBuf = genUserBuf(userId, 0, expire, ALL_PRIVILEGES, 0, roomId);
  return genSig(userId, expire, undefined, userBuf);
};

/**
 * 校验 UserSig / PrivateMapKey（含签名与过期校验）
 * @returns {boolean}
 */
const verifyUserSig = (userSig) => {
  if (!userSig || typeof userSig !== 'string' || userSig.length < 20 || !isConfigured()) {
    return false;
  }

  try {
    const inflated = zlib.inflateSync(Buffer.from(base64UrlUnescape(userSig), 'base64')).toString('utf8');
    const data = JSON.parse(inflated);

    const identifier = data['TLS.identifier'];
    const appId = Number(data['TLS.sdkappid']);
    const currTime = Number(data['TLS.time']);
    const expire = Number(data['TLS.expire']);
    const sig = data['TLS.sig'];

    if (!identifier || !appId || !sig) return false;
    if (Number(config.trtc.appId) !== appId) return false;
    if (expire > 0 && currTime + expire < Math.floor(Date.now() / 1000)) return false;

    const expected = hmacSha256Base64(
      buildContentToBeSigned(identifier, appId, currTime, expire, data['TLS.userbuf'] || null)
    );
    return timingSafeEqual(expected, sig);
  } catch (error) {
    logger.error('[TRTC] 验证UserSig失败:', error);
    return false;
  }
};

const getMeetingInfo = (roomId) => {
  return {
    roomId,
    appId: config.trtc.appId,
    sdkAppId: config.trtc.appId,
    serverTime: Math.floor(Date.now() / 1000)
  };
};

const createRoom = async (userId, roomType = 'video') => {
  const roomId = Math.floor(Math.random() * 900000) + 100000;
  
  const roomInfo = {
    roomId,
    creatorId: userId,
    roomType,
    createTime: Math.floor(Date.now() / 1000),
    status: 'waiting',
    participants: [userId]
  };
  
  return roomInfo;
};

const enterRoom = async (userId, roomId) => {
  const roomSig = generateRoomSig(roomId, userId);
  
  return {
    roomId,
    userId,
    userSig: generateUserSig(userId),
    roomSig,
    enterTime: Math.floor(Date.now() / 1000)
  };
};

const leaveRoom = async (userId, roomId) => {
  return {
    roomId,
    userId,
    leaveTime: Math.floor(Date.now() / 1000),
    success: true
  };
};

const getRoomInfo = async (roomId) => {
  return {
    roomId,
    appId: config.trtc.appId,
    sdkAppId: config.trtc.appId,
    status: 'active',
    createTime: Math.floor(Date.now() / 1000) - 3600
  };
};

const startBilling = async (userId, roomId, callType) => {
  return {
    billingId: Math.floor(Math.random() * 1000000),
    userId,
    roomId,
    callType,
    startTime: Math.floor(Date.now() / 1000),
    status: 'active'
  };
};

const endBilling = async (billingId) => {
  const endTime = Math.floor(Date.now() / 1000);
  const duration = Math.floor(Math.random() * 600) + 60;
  
  return {
    billingId,
    endTime,
    duration,
    cost: duration * 0.01,
    status: 'completed'
  };
};

module.exports = {
  generateUserSig,
  generateRoomId,
  generateRoomSig,
  verifyUserSig,
  getMeetingInfo,
  createRoom,
  enterRoom,
  leaveRoom,
  getRoomInfo,
  startBilling,
  endBilling
};