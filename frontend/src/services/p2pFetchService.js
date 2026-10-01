import socketService from './socketService'
import { toast } from '../composables/useToast'

// P2P 热内容取回流：请求方通过 WebRTC DataChannel 让"资源拥有方"回传小文件
// （头像/缩略图等），从而省去请求方直接跨域/跨服务器拉取，减轻带宽压力。
// 任何一步失败都会回退到常规签名 URL，保证可用性优先。

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' }
]

// 拥有方：监听取数请求，从 url 拉取字节经 DataChannel 回传（或回退签名URL）
let responderStarted = false
export function setupP2PFetchResponder() {
  if (responderStarted) return
  responderStarted = true

  socketService.on('p2p_fetch_request', async (data) => {
    const { fromId, requestId, url, type } = data
    try {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
      const channel = pc.createDataChannel('p2p-fetch')

      channel.onopen = async () => {
        try {
          const resp = await fetch(url, { mode: 'cors' })
          const blob = await resp.blob()
          const buf = await blob.arrayBuffer()
          channel.send(buf)
        } catch (e) {
          // 拉取失败，回退：直接把签名URL转发给请求方
          channel.send(JSON.stringify({ fallbackUrl: url }))
        }
      }

      // 收到请求方 offer 后由响应方回 answer（后端按user room转发），一次性监听避免堆积
      const onOffer = async (offerData) => {
        if (offerData?.requestId !== requestId) return
        socketService.off('p2p_offer', onOffer)
        try {
          await pc.setRemoteDescription(offerData.offer)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          socketService.emit('p2p_answer', { toId: fromId, requestId, answer })
        } catch (e) {
          socketService.emit('p2p_fetch_response', { toId: fromId, requestId, fallbackUrl: url })
        }
      }
      socketService.on('p2p_offer', onOffer)
    } catch (e) {
      socketService.emit('p2p_fetch_response', { toId: fromId, requestId, fallbackUrl: url })
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
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
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
      try {
        const data = JSON.parse(event.data)
        if (data.fallbackUrl) {
          finish({ ok: false, fallbackUrl: data.fallbackUrl })
          return
        }
      } catch (e) {
        // 二进制字节
        const blob = event.data instanceof ArrayBuffer
          ? new Blob([event.data])
          : new Blob([event.data])
        finish({ ok: true, blob })
      }
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
    })

    // 同时走信令让拥有方知道有人要取数
    socketService.emit('p2p_fetch_request', { toId: peerId, requestId, url, type })
  })
}

async function checkPeerOnline(peerId) {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    const res = await fetch(`/api/p2p/peer-online?peerId=${peerId}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    const data = await res.json()
    return data?.code === 200 && data?.data?.online
  } catch (e) {
    return false
  }
}

export default { setupP2PFetchResponder, p2pFetch }
