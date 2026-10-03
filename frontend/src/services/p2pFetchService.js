import socketService from './socketService'
import { RTC_CONFIGURATION } from '../common/webrtcConfig'
import { STORAGE_KEYS } from '../common/constants'

// P2P 热内容取回流：请求方通过 WebRTC DataChannel 让"资源拥有方"回传小文件
// （头像/缩略图等），从而省去请求方直接跨域/跨服务器拉取，减轻带宽压力。
// 任何一步失败都会回退到常规签名 URL，保证可用性优先。

// 响应方（拥有方）整体超时：等待 offer / 传输数据的兜底时间，超时后强制关闭连接
const RESPONDER_TIMEOUT = 15000
// DataChannel 发送完成后再延迟关闭，给尾包留出刷新时间
const RESPONDER_CLOSE_DELAY = 1000
// 请求方探测对端是否在线的超时（F-08）
const PEER_ONLINE_TIMEOUT = 5000
// 请求方接收 Blob 的最大字节数，超限直接回退签名 URL，避免被超大内容打爆内存（F-18）
const MAX_P2P_BLOB_SIZE = 100 * 1024 * 1024

// 拥有方：监听取数请求，从 url 拉取字节经 DataChannel 回传（或回退签名URL）
let responderStarted = false
export function setupP2PFetchResponder() {
  if (responderStarted) return
  responderStarted = true

  socketService.on('p2p_fetch_request', async (data) => {
    const { fromId, requestId, url } = data

    let pc = null
    let channel = null
    let onOffer = null
    let settled = false
    let timer = null
    let closeTimer = null

    // 统一资源释放：移除临时监听器并关闭 RTCPeerConnection，保证只执行一次
    const cleanup = () => {
      if (settled) return
      settled = true
      if (timer) { clearTimeout(timer); timer = null }
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
      if (onOffer) {
        socketService.off('p2p_offer', onOffer)
        onOffer = null
      }
      if (channel) {
        try {
          channel.onopen = null
          channel.onmessage = null
          channel.onclose = null
        } catch (e) { /* 忽略清理异常 */ }
        channel = null
      }
      if (pc) {
        try { pc.close() } catch (e) { console.warn('P2P 连接关闭失败:', e) }
        pc = null
      }
    }

    // 传输结束后延迟关闭，避免刚 send 完就 close 导致尾包丢失
    const finishAfterTransfer = () => {
      if (settled) return
      if (timer) { clearTimeout(timer); timer = null }
      closeTimer = setTimeout(cleanup, RESPONDER_CLOSE_DELAY)
    }

    try {
      pc = new RTCPeerConnection(RTC_CONFIGURATION)
      channel = pc.createDataChannel('p2p-fetch')

      channel.onopen = async () => {
        // 拉取源文件同样加超时，避免 fetch 悬挂占用连接（F-08）
        const fetchController = new AbortController()
        const fetchTimer = setTimeout(() => fetchController.abort(), RESPONDER_TIMEOUT)
        try {
          const resp = await fetch(url, { mode: 'cors', signal: fetchController.signal })
          const blob = await resp.blob()
          const buf = await blob.arrayBuffer()
          channel.send(buf)
          finishAfterTransfer()
        } catch (e) {
          // 拉取失败，回退：直接把签名URL转发给请求方
          try {
            channel.send(JSON.stringify({ fallbackUrl: url }))
          } catch (err) { /* 连接可能已关闭 */ }
          finishAfterTransfer()
        } finally {
          clearTimeout(fetchTimer)
        }
      }

      // 收到请求方 offer 后由响应方回 answer（后端按 user room 转发），一次性监听避免堆积
      onOffer = async (offerData) => {
        if (offerData?.requestId !== requestId) return
        socketService.off('p2p_offer', onOffer)
        onOffer = null
        try {
          await pc.setRemoteDescription(offerData.offer)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          socketService.emit('p2p_answer', { toId: fromId, requestId, answer })
        } catch (e) {
          socketService.emit('p2p_fetch_response', { toId: fromId, requestId, fallbackUrl: url })
          cleanup()
        }
      }
      socketService.on('p2p_offer', onOffer)

      // 超时兜底：即使对方始终未回传数据，也会关闭连接，避免 RTCPeerConnection 泄漏
      timer = setTimeout(cleanup, RESPONDER_TIMEOUT)
    } catch (e) {
      socketService.emit('p2p_fetch_response', { toId: fromId, requestId, fallbackUrl: url })
      cleanup()
    }
  })
}

// 请求方：向拥有方请求小文件，返回 Blob 或回退 URL
export async function p2pFetch({ peerId, url, type = 'image', timeout = 8000 }) {
  const online = await checkPeerOnline(peerId)
  if (!online) {
    return { ok: false, fallbackUrl: url } // 对方不在线，走常规签名URL
  }

  return new Promise((resolve) => {
    const requestId = `p2p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    const pc = new RTCPeerConnection(RTC_CONFIGURATION)
    let settled = false

    const onAnswer = async (answerData) => {
      if (answerData?.requestId !== requestId) return
      try { await pc.setRemoteDescription(answerData.answer) } catch (e) { console.warn('P2P setRemoteDescription 失败:', e) }
    }
    const onIce = async (iceData) => {
      if (iceData?.requestId !== requestId) return
      try { await pc.addIceCandidate(iceData.candidate) } catch (e) { console.warn('P2P addIceCandidate 失败:', e) }
    }

    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      socketService.off('p2p_answer', onAnswer)
      socketService.off('p2p_ice_candidate', onIce)
      try { pc.close() } catch (e) { console.warn('P2P 连接关闭失败:', e) }
      resolve(result)
    }

    const timer = setTimeout(() => {
      finish({ ok: false, fallbackUrl: url }) // 超时回退
    }, timeout)

    const channel = pc.createDataChannel('p2p-fetch')
    channel.onmessage = (event) => {
      const raw = event.data

      // 文本控制消息：仅接受合法的 { fallbackUrl }
      if (typeof raw === 'string') {
        try {
          const data = JSON.parse(raw)
          if (data?.fallbackUrl) {
            finish({ ok: false, fallbackUrl: data.fallbackUrl })
            return
          }
        } catch (e) { /* 非合法 JSON，按异常处理 */ }
        finish({ ok: false, fallbackUrl: url })
        return
      }

      // 类型校验：只接受二进制 ArrayBuffer/Blob（F-18）
      const isBinary = raw instanceof ArrayBuffer || (typeof Blob !== 'undefined' && raw instanceof Blob)
      if (!isBinary) {
        finish({ ok: false, fallbackUrl: url })
        return
      }

      // 大小校验：超过上限直接回退并结束，避免内存被超大内容打爆（F-18）
      const size = raw instanceof ArrayBuffer ? raw.byteLength : raw.size
      if (size > MAX_P2P_BLOB_SIZE) {
        console.warn('P2P 接收内容超过大小上限，已回退:', size)
        finish({ ok: false, fallbackUrl: url })
        return
      }

      const blob = raw instanceof ArrayBuffer ? new Blob([raw]) : raw
      finish({ ok: true, blob })
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketService.emit('p2p_ice_candidate', { toId: peerId, requestId, candidate: e.candidate })
      }
    }

    socketService.on('p2p_answer', onAnswer)
    socketService.on('p2p_ice_candidate', onIce)

    pc.createOffer().then(async (offer) => {
      await pc.setLocalDescription(offer)
      socketService.emit('p2p_offer', { toId: peerId, requestId, offer, url, type })
    }).catch((e) => {
      console.warn('P2P createOffer 失败:', e)
      finish({ ok: false, fallbackUrl: url })
    })

    // 同时走信令让拥有方知道有人要取数
    socketService.emit('p2p_fetch_request', { toId: peerId, requestId, url, type })
  })
}

/**
 * 渐进式增强：先用常规 URL 把内容渲染出来，再在后台尝试通过 P2P 取回同一份资源，
 * 成功则替换为本地 Blob URL（省一次跨域/跨境拉取）。任何失败都保持原样，绝不阻塞首屏。
 */
export async function upgradeViaP2P({ peerId, url, timeout = 1500, onBlob }) {
  if (!peerId || !url) return false
  try {
    const result = await p2pFetch({ peerId, url, timeout })
    if (result && result.ok && result.blob && typeof onBlob === 'function') {
      onBlob(URL.createObjectURL(result.blob))
      return true
    }
  } catch (e) {
    // 静默回退：保持常规 URL
  }
  return false
}

async function checkPeerOnline(peerId) {
  // fetch 无超时可能长期挂起并耗尽连接池，这里用 AbortController 兜底（F-08）
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PEER_ONLINE_TIMEOUT)
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    const res = await fetch(`/api/p2p/peer-online?peerId=${encodeURIComponent(peerId)}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      signal: controller.signal
    })
    const data = await res.json()
    return data?.code === 200 && data?.data?.online
  } catch (e) {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export default { setupP2PFetchResponder, p2pFetch, upgradeViaP2P }
