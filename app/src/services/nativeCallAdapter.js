import { isApp } from '../common/platform'

// #ifdef APP-PLUS
import * as nativeRtc from '@/uni_modules/kaifa-webrtc'
// #endif

// 开关：默认关闭，H5 与默认 App 构建继续走浏览器 WebRTC。
// 只有打「自定义基座/正式包」且配置 VITE_USE_NATIVE_CALL=1 时才启用原生通道。
export const useNativeCall = isApp && String(import.meta.env.VITE_USE_NATIVE_CALL || '') === '1'

let initialized = false
let eventsBound = false
let eventHandler = null
let permissionResolve = null
let permissionTimer = null

function getNativeRtc() {
  // #ifdef APP-PLUS
  return nativeRtc
  // #endif
  // #ifndef APP-PLUS
  return null
  // #endif
}

export function isNativeCallAvailable() {
  if (!useNativeCall) return false
  const rtc = getNativeRtc()
  if (!rtc) return false
  try {
    return !!rtc.isSupported()
  } catch (e) {
    return false
  }
}

function resolvePermission(granted) {
  if (permissionTimer) {
    clearTimeout(permissionTimer)
    permissionTimer = null
  }
  const resolve = permissionResolve
  permissionResolve = null
  if (resolve) resolve(!!granted)
}

// 原生插件是全局单例：SDP/ICE/权限结果都从这里统一分发，
// 业务层只注册一个 handler，避免多次 onEvent 覆盖 Kotlin 侧回调。
function dispatchNativeEvent(event) {
  if (!event) return
  if (event.type === 'permissions-granted' || event.type === 'permissions-denied') {
    resolvePermission(event.type === 'permissions-granted')
    return
  }
  if (typeof eventHandler === 'function') {
    try {
      eventHandler(event)
    } catch (e) {
      console.warn('[native-call] 事件处理失败:', e)
    }
  }
}

// 注册/替换业务层事件处理器（nativeCallService 使用）
export function setNativeEventListener(handler) {
  eventHandler = typeof handler === 'function' ? handler : null
}

export function initNativeCall() {
  if (!isNativeCallAvailable()) return false
  const rtc = getNativeRtc()
  if (!rtc) return false
  try {
    if (!initialized) {
      rtc.init()
      initialized = true
    }
    if (!eventsBound) {
      rtc.onEvent(dispatchNativeEvent)
      eventsBound = true
    }
    return true
  } catch (e) {
    console.warn('[native-call] 初始化失败:', e)
    return false
  }
}

// 请求相机/麦克风等运行时权限；结果由插件事件回传，10 秒未回传按失败处理
export function requestNativeCallPermissions(timeout = 10000) {
  if (!initNativeCall()) return Promise.resolve(false)
  const rtc = getNativeRtc()
  if (!rtc) return Promise.resolve(false)
  return new Promise((resolve) => {
    permissionResolve = resolve
    if (permissionTimer) clearTimeout(permissionTimer)
    permissionTimer = setTimeout(() => resolvePermission(false), timeout)
    try {
      rtc.requestCallPermissions()
    } catch (e) {
      console.warn('[native-call] 请求权限失败:', e)
      resolvePermission(false)
    }
  })
}

export function createNativePeer({ userId, audio, video, iceServers, onEvent }) {
  if (!initNativeCall()) throw new Error('原生通话不可用')
  const rtc = getNativeRtc()
  if (!rtc) throw new Error('原生通话不可用')
  if (typeof onEvent === 'function') setNativeEventListener(onEvent)
  rtc.createPeerConnection(
    { userId: String(userId), audio: audio !== false, video: !!video },
    iceServers || []
  )
}

export function nativeCreateOffer(userId) {
  const rtc = getNativeRtc()
  if (rtc) rtc.createOffer(String(userId))
}

export function nativeCreateAnswer(userId) {
  const rtc = getNativeRtc()
  if (rtc) rtc.createAnswer(String(userId))
}

export function nativeSetRemoteDescription(userId, type, sdp) {
  const rtc = getNativeRtc()
  if (rtc) rtc.setRemoteDescription(String(userId), type || 'offer', String(sdp || ''))
}

export function nativeAddIceCandidate(userId, candidate, sdpMid, sdpMLineIndex) {
  const rtc = getNativeRtc()
  if (rtc) rtc.addIceCandidate(String(userId), String(candidate || ''), sdpMid == null ? '' : String(sdpMid), Number(sdpMLineIndex) || 0)
}

// 通话接通后把音频路由切到通话模式（Kotlin 侧设置 MODE_IN_COMMUNICATION + 扬声器）
export function nativeStartAudio() {
  const rtc = getNativeRtc()
  if (rtc && typeof rtc.startLocalAudio === 'function') rtc.startLocalAudio()
}

export function nativeMute(muted) {
  const rtc = getNativeRtc()
  if (rtc) rtc.muteAudio(!!muted)
}

export function nativeMuteVideo(muted) {
  const rtc = getNativeRtc()
  if (rtc && typeof rtc.muteVideo === 'function') rtc.muteVideo(!!muted)
}

export function nativeSwitchCamera() {
  const rtc = getNativeRtc()
  if (rtc) rtc.switchCamera()
}

export function nativeSetSpeaker(on) {
  const rtc = getNativeRtc()
  if (rtc) rtc.setSpeaker(!!on)
}

export function nativeHangup() {
  const rtc = getNativeRtc()
  if (rtc) {
    try { rtc.hangup() } catch (e) { console.warn('[native-call] hangup 失败:', e) }
  }
}
