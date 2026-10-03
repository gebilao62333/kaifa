const crypto = require('crypto');
const config = require('../config');

/**
 * 通话通道与 ICE 服务器配置
 *
 * 设计要点：
 *  1. 自建 WebRTC 为主通道（Socket.IO 信令 + STUN/TURN），腾讯云 TRTC 为备选，
 *     由后端环境变量 CALL_CHANNEL 控制，前端不再自行猜测通道。
 *  2. TURN 凭据不在前端构建期写死，而是由后端按用户签发**临时凭据**
 *     （coturn REST API 模式，--use-auth-secret）：
 *        username   = "<过期时间戳>:<用户标识>"
 *        credential = base64(HMAC-SHA1(共享密钥, username))
 *     这样：
 *       - 前端包里没有长期共享密钥，泄漏也只影响凭据有效期内的用量；
 *       - 改 TURN 地址/密钥无需重新构建前端。
 */

const isTurnConfigured = () => !!(config.call.turn.url && config.call.turn.secret);

const buildTurnCredential = (userId, ttlSeconds) => {
  const ttl = Number(ttlSeconds) || config.call.turn.ttl || 3600;
  const expiry = Math.floor(Date.now() / 1000) + ttl;
  const username = `${expiry}:${userId}`;
  const credential = crypto
    .createHmac('sha1', config.call.turn.secret)
    .update(username)
    .digest('base64');

  return {
    urls: config.call.turn.url,
    username,
    credential
  };
};

/**
 * 返回给前端的通话配置
 * 未配置 TURN 时只返回 STUN（200，不是错误——「未部署 TURN」是正常的配置状态）
 */
const getCallConfig = (userId) => {
  const iceServers = config.call.stun.map((urls) => ({ urls }));
  const turnEnabled = isTurnConfigured();

  if (turnEnabled) {
    iceServers.push(buildTurnCredential(userId));
  }

  return {
    // 'webrtc'（自建，默认） | 'trtc'（腾讯云，显式开启）
    channel: config.call.channel,
    turnEnabled,
    // 供前端决定 ICE 配置的缓存时长（凭据有效期）
    ttl: config.call.turn.ttl,
    iceServers,
    // 便于前端提示与排查：TRTC 是否具备可用密钥
    trtcConfigured: !!(config.trtc.appId && config.trtc.secretKey)
  };
};

module.exports = {
  getCallConfig,
  buildTurnCredential,
  isTurnConfigured
};
