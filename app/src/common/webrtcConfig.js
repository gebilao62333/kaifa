import { request } from './common'

// WebRTC ICE 服务器统一配置
//
// 通道策略：自建 WebRTC 为主（Socket.IO 信令 + STUN/TURN），腾讯云 TRTC 为备选。
//
// ICE 服务器优先由后端下发（GET /api/config/call）：
//   - STUN：后端 STUN_URLS 配置
//   - TURN：coturn REST API 临时凭据，按用户签发、带有效期
// 这样前端包体里不出现长期 TURN 共享密钥，改 TURN 地址也无需重新构建前端。
//
// 下面保留的静态 STUN 仅作为「后端不可达」时的兜底；切勿再往这里硬编码 TURN 账号。
// 历史遗留的 VITE_TURN_* 构建期变量仍兼容（若配置了会并入静态列表），但不推荐使用。

const staticTurnUrl = import.meta.env.VITE_TURN_URL || ''
const staticTurnUsername = import.meta.env.VITE_TURN_USERNAME || ''
const staticTurnCredential = import.meta.env.VITE_TURN_CREDENTIAL || ''

const staticIceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
]

if (staticTurnUrl) {
  const turn = { urls: staticTurnUrl }
  if (staticTurnUsername) turn.username = staticTurnUsername
  if (staticTurnCredential) turn.credential = staticTurnCredential
  staticIceServers.push(turn)
}

export const ICE_SERVERS = staticIceServers
export const RTC_CONFIGURATION = { iceServers: staticIceServers }

// 后端下发的配置缓存（TURN 凭据有有效期，按 TTL 的一半刷新）
let cachedConfig = null
let cachedUntil = 0
let inflight = null

const FALLBACK_CACHE_MS = 5 * 60 * 1000

/**
 * 获取 RTCPeerConnection 配置。
 * 优先使用后端下发的 ICE 服务器（含临时 TURN 凭据）；
 * 后端不可用或未返回时回落到静态 STUN，保证通话尽可能可用。
 */
export async function getRtcConfiguration() {
  const now = Date.now()
  if (cachedConfig && cachedUntil > now) return cachedConfig
  if (inflight) return inflight

  inflight = (async () => {
    try {
      const res = await request('/api/config/call', 'GET')
      const data = (res && res.data) || res
      const servers = data && Array.isArray(data.iceServers) ? data.iceServers : null

      if (servers && servers.length) {
        const ttlSeconds = Math.max(60, Number(data.ttl) || 3600)
        const config = { iceServers: servers }
        cachedConfig = config
        // 提前一半时间刷新，避免凭据过期后仍在用
        cachedUntil = Date.now() + Math.floor((ttlSeconds * 1000) / 2)
        return config
      }
    } catch (e) {
      // 未登录 / 网络异常 / 接口不存在 → 回落静态 STUN
    }

    cachedConfig = RTC_CONFIGURATION
    cachedUntil = Date.now() + FALLBACK_CACHE_MS
    return RTC_CONFIGURATION
  })()

  try {
    return await inflight
  } finally {
    inflight = null
  }
}

/** 清空缓存（登出、切换账号、排查问题时使用） */
export function resetRtcConfiguration() {
  cachedConfig = null
  cachedUntil = 0
  inflight = null
}

export default RTC_CONFIGURATION
