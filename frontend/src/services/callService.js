import { trtcService } from './trtcService'
import { webrtcCallService } from './webrtcCallService'
import { socketService } from './socketService'
import { isTrtcSdkLoaded, loadTrtcSdk, trtcRoomService } from './trtcRoomService'
import { request } from '../common/common'

/**
 * 统一通话服务
 *
 * 通道策略：**自建 WebRTC 为主，腾讯云 TRTC 为备选**。
 *   - 通道由后端下发（GET /api/config/call → CALL_CHANNEL），默认 'webrtc'
 *   - CALL_CHANNEL=webrtc → 只走自建 WebRTC（Socket.IO 信令 + STUN/TURN），不加载 TRTC SDK
 *   - CALL_CHANNEL=trtc   → 走腾讯云 TRTC；若 TRTC 不可用则回退 WebRTC，保证电话能打通
 *   - 调试覆盖：localStorage.call_channel = 'trtc' | 'webrtc'
 */
class CallService {
  constructor() {
    this._trtcAvailable = null
    this._channel = null
    this.currentMode = null // 'trtc' | 'webrtc'
    this.currentCallId = null
    this.currentCallType = 1
    this.remoteUserId = null
    this.durationTimer = null
    this.callDuration = 0
    this.onDurationTick = null
    this.onCallEnd = null
  }

  setCallbacks({ onDurationTick, onCallEnd }) {
    if (onDurationTick) this.onDurationTick = onDurationTick
    if (onCallEnd) this.onCallEnd = onCallEnd
  }

  // 是否已加载 TRTC SDK 本体（按需从 CDN 加载，见 trtcRoomService）
  hasTRTCSdk() {
    return isTrtcSdkLoaded()
  }

  // ===== 通道策略：后端下发，默认自建 WebRTC =====
  async getChannel() {
    // 1) 本地调试覆盖优先
    try {
      const override = localStorage.getItem('call_channel')
      if (override === 'trtc' || override === 'webrtc') return override
    } catch { /* 隐私模式等场景忽略 */ }

    if (this._channel) return this._channel

    // 2) 后端下发；失败一律按 webrtc（自建通道不依赖任何第三方密钥，最稳）
    try {
      const res = await request('/api/config/call', 'GET')
      const data = (res && res.data) || res
      this._channel = data && data.channel === 'trtc' ? 'trtc' : 'webrtc'
    } catch {
      this._channel = 'webrtc'
    }
    return this._channel
  }

  // ===== 检测 TRTC 是否可用（仅在通道策略为 trtc 时才需要） =====
  // 顺序很重要：先问后端「配了密钥吗」，配了才去加载官方 SDK。
  // 这样未配置时既不会下载 SDK，也不会误走 TRTC 通道（避免「填了密钥反而打不通」）。
  async isTRTCAvailable() {
    if (this._trtcAvailable !== null) return this._trtcAvailable
    try {
      const res = await trtcService.getAuth()
      // 注意：request() 返回的是 { code, message, data }，鉴权信息在 data 里
      const body = res && typeof res === 'object' ? res : {}
      const info = body.data && typeof body.data === 'object' ? body.data : body
      const configured = !!(body.code === 200 && info && (info.appId || info.sdkAppId) && info.userSig)
      if (!configured) {
        this._trtcAvailable = false
        return false
      }
      await loadTrtcSdk()
      this._trtcAvailable = true
    } catch {
      // 后端未配置或 SDK 加载失败 → 视为不可用
      this._trtcAvailable = false
    }
    return this._trtcAvailable
  }

  // ===== 发起通话 =====
  async startCall(calleeId, callType = 1, isCompanionCall = false, orderId = 0) {
    this.currentCallType = callType
    this.remoteUserId = calleeId

    const channel = await this.getChannel()

    if (channel === 'trtc') {
      const useTRTC = await this.isTRTCAvailable()
      if (useTRTC) {
        return this._startTRTCCall(calleeId, callType, isCompanionCall, orderId)
      }
      // 策略要求 TRTC 但实际不可用（未配密钥 / SDK 加载失败）：
      // 回退自建 WebRTC，避免用户完全打不了电话
      console.warn('[call] 通道策略为 trtc，但 TRTC 不可用，已回退自建 WebRTC')
    }

    return this._startWebRTCCall(calleeId, callType)
  }

  async _startTRTCCall(calleeId, callType, isCompanionCall, orderId) {
    this.currentMode = 'trtc'
    const res = await trtcService.startCall(calleeId, callType, isCompanionCall, orderId)
    const data = res?.data || res
    const callResult = data.data || data

    this.currentCallId = callResult.callId
    const trtcRoomId = callResult.trtcRoomId || callResult.roomId

    // 通过Socket发送邀请（TRTC模式）
    socketService.emit('call_invite', {
      toId: calleeId,
      callType,
      trtcRoomId,
      callId: this.currentCallId,
      useWebRTC: false
    })

    return { ...callResult, mode: 'trtc' }
  }

  async _startWebRTCCall(calleeId, callType) {
    this.currentMode = 'webrtc'
    // 通过HTTP创建通话记录
    try {
      const res = await request('/api/trtc/start', 'POST', {
        calleeId,
        callType,
        isCompanionCall: false,
        orderId: 0
      })
      const data = res?.data || res
      const callResult = (data?.data || data)
      this.currentCallId = callResult.callId || 0
    } catch {
      // HTTP创建失败不影响WebRTC通话
      this.currentCallId = 0
    }

    // WebRTC创建PeerConnection和本地流
    await webrtcCallService.initiateCall(calleeId, callType, this.currentCallId)
    return { callId: this.currentCallId, mode: 'webrtc' }
  }

  // ===== 接听通话 =====
  async acceptCall({ callId, callerId, callType, useWebRTC }) {
    this.currentCallId = callId
    this.currentCallType = callType
    this.remoteUserId = callerId

    if (useWebRTC) {
      this.currentMode = 'webrtc'
      if (callId) {
        try { await trtcService.acceptCall(callId) } catch {}
      }
      await webrtcCallService.handleIncomingCall(callerId, callType, callId)
    } else {
      this.currentMode = 'trtc'
      await trtcService.acceptCall(callId)
      socketService.emit('call_accept', { toId: callerId, trtcRoomId: '' })
    }
  }

  // ===== 拒绝通话 =====
  async rejectCall(callId, useWebRTC) {
    if (!useWebRTC && callId) {
      try { await trtcService.rejectCall(callId) } catch {}
    }
    socketService.emit('call_reject', { toId: this.remoteUserId })
  }

  // ===== 挂断通话 =====
  async endCall(duration = 0) {
    if (this.currentMode === 'webrtc') {
      webrtcCallService.hangup(duration)
    }
    if (this.currentMode === 'trtc') {
      await trtcRoomService.leave()
    }
    if (this.currentCallId) {
      try { await trtcService.endCall(this.currentCallId) } catch {}
    }
    if (this.remoteUserId) {
      socketService.emit('call_end', {
        toId: this.remoteUserId,
        duration
      })
    }
    this._stopDurationTimer()
    this.currentMode = null
    if (this.onCallEnd) this.onCallEnd(duration)
  }

  // ===== 取消呼叫 =====
  async cancelCall(callId) {
    if (callId) {
      try { await trtcService.cancelCall(callId) } catch {}
    }
    socketService.emit('call_cancel', { toId: this.remoteUserId })
    this.currentMode = null
  }

  // ===== 计时 =====
  startDurationTimer() {
    this.callDuration = 0
    this.durationTimer = setInterval(() => {
      this.callDuration++
      if (this.onDurationTick) this.onDurationTick(this.callDuration)
    }, 1000)
  }

  _stopDurationTimer() {
    if (this.durationTimer) {
      clearInterval(this.durationTimer)
      this.durationTimer = null
    }
  }

  getDuration() {
    return this.callDuration
  }

  // ===== WebRTC 媒体控制 =====
  toggleAudio(enabled) {
    if (this.currentMode === 'webrtc') {
      webrtcCallService.toggleAudio(enabled)
    }
  }

  toggleVideo(enabled) {
    if (this.currentMode === 'webrtc') {
      webrtcCallService.toggleVideo(enabled)
    }
  }

  // ===== 清理 =====
  cleanup() {
    this._stopDurationTimer()
    if (this.currentMode === 'webrtc') {
      webrtcCallService.cleanup()
    }
    if (this.currentMode === 'trtc') {
      trtcRoomService.leave()
    }
    this.currentMode = null
    this.currentCallId = null
  }

  // ===== 获取 TRTC 配置（给 Vue 组件用） =====
  async getAuth() {
    return trtcService.getAuth()
  }

  getCallHistory(page, pageSize) {
    return trtcService.getCallHistory(page, pageSize)
  }
}

export const callService = new CallService()
export default callService
