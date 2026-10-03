import { trtcService } from './trtcService'

/**
 * 腾讯 TRTC 房间服务（可选通道）
 *
 * 设计取舍：
 * - 不把 trtc-sdk-v5 作为 npm 依赖打包，而是在「后端确实配置了 TRTC 密钥」时才从官方 CDN 按需加载。
 *   这样未配置时零下载、零打包体积，WebRTC 通道完全不受影响。
 * - 所有 SDK 调用都做了能力探测与 try/catch：即使官方 API 有版本差异，也只降级为「本次通话失败」，
 *   不会把整个通话页打挂。
 */

const DEFAULT_SDK_URL = 'https://web.sdk.qcloud.com/trtc/webrtc/v5/dist/trtc.js'
const SDK_URL = import.meta.env.VITE_TRTC_SDK_URL || DEFAULT_SDK_URL

let loading = null
let trtc = null
let remoteView = null

export function isTrtcSdkLoaded() {
  return typeof window !== 'undefined' && !!window.TRTC
}

/** 按需加载官方 SDK（同一页面只加载一次） */
export function loadTrtcSdk() {
  if (isTrtcSdkLoaded()) return Promise.resolve(window.TRTC)
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SDK_URL
    script.async = true
    script.onload = () => (window.TRTC ? resolve(window.TRTC) : reject(new Error('TRTC SDK 加载完成但未找到全局 TRTC')))
    script.onerror = () => reject(new Error('TRTC SDK 加载失败：' + SDK_URL))
    document.head.appendChild(script)
  })
  return loading
}

export const trtcRoomService = {
  get isActive() {
    return !!trtc
  },

  /** 远端视频渲染容器（视频通话需要在挂载后回填） */
  setRemoteView(el) {
    remoteView = el
    if (trtc && remoteView) this._renderRemote()
  },

  _remoteUsers: new Set(),

  _renderRemote() {
    if (!trtc || !remoteView) return
    for (const userId of this._remoteUsers) {
      try {
        trtc.startRemoteVideo({ userId, streamType: 'main', view: remoteView })
      } catch (e) {
        console.warn('[TRTC] 渲染远端画面失败:', e && e.message)
      }
    }
  },

  /** 进入房间并推流；失败时抛错，由通话页决定回退策略 */
  async join({ callType = 1, roomId } = {}) {
    const TRTC = await loadTrtcSdk()
    const authRes = await trtcService.getAuth()
    // request() 返回 { code, message, data }，鉴权信息在 data 内层
    const body = authRes && typeof authRes === 'object' ? authRes : {}
    const info = body.data && typeof body.data === 'object' ? body.data : body
    const sdkAppId = info && (info.sdkAppId || info.appId)
    const userSig = info && info.userSig
    const userId = String((info && (info.userId || info.uid)) || '')

    if (!sdkAppId || !userSig || !userId) throw new Error('TRTC 鉴权信息不完整')
    if (!roomId) throw new Error('缺少 TRTC 房间号')

    trtc = TRTC.create()
    const EVENTS = TRTC.EVENT || {}

    if (EVENTS.REMOTE_VIDEO_AVAILABLE) {
      trtc.on(EVENTS.REMOTE_VIDEO_AVAILABLE, (event) => {
        if (event && event.userId) this._remoteUsers.add(event.userId)
        this._renderRemote()
      })
    }
    if (EVENTS.REMOTE_USER_LEAVE) {
      trtc.on(EVENTS.REMOTE_USER_LEAVE, (event) => {
        if (event && event.userId) this._remoteUsers.delete(event.userId)
      })
    }
    if (EVENTS.ERROR) {
      trtc.on(EVENTS.ERROR, (err) => console.error('[TRTC] SDK 错误:', err))
    }

    await trtc.enterRoom({
      roomId: Number(roomId),
      sdkAppId: Number(sdkAppId),
      userId,
      userSig,
      streamType: callType === 2 ? 'video' : 'audio'
    })

    if (callType === 2 && typeof trtc.startLocalVideo === 'function') await trtc.startLocalVideo()
    if (typeof trtc.startLocalAudio === 'function') await trtc.startLocalAudio()

    return true
  },

  async leave() {
    if (!trtc) return
    const instance = trtc
    trtc = null
    this._remoteUsers.clear()
    try {
      if (typeof instance.exitRoom === 'function') await instance.exitRoom()
    } catch (e) {
      console.warn('[TRTC] exitRoom 失败:', e && e.message)
    }
    try {
      if (typeof instance.destroy === 'function') instance.destroy()
    } catch (e) {
      console.warn('[TRTC] destroy 失败:', e && e.message)
    }
  }
}

export default trtcRoomService
