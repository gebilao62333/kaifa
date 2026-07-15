import { trtcService } from './trtcService'
import { webrtcCallService } from './webrtcCallService'
import { socketService } from './socketService'
import { request } from '../common/common'

/**
 * 统一通话服务
 * 自动检测 TRTC 是否可用：
 *   - 已配置 TRTC → 使用 TRTC（腾讯云）
 *   - 未配置 TRTC → 使用 WebRTC（浏览器原生，免费）
 */
class CallService {
  constructor() {
    this._trtcAvailable = null
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

  // ===== 检测 TRTC 是否可用 =====
  async isTRTCAvailable() {
    if (this._trtcAvailable !== null) return this._trtcAvailable
    try {
      const res = await trtcService.getAuth()
      // TRTC可用：返回code 200 且 data.sdkAppId存在
      const data = res?.data || res
      this._trtcAvailable = !!(data && data.code === 200 && data.data && data.data.appId)
    } catch {
      this._trtcAvailable = false
    }
    return this._trtcAvailable
  }

  // ===== 发起通话 =====
  async startCall(calleeId, callType = 1, isCompanionCall = false, orderId = 0) {
    this.currentCallType = callType
    this.remoteUserId = calleeId

    const useTRTC = await this.isTRTCAvailable()

    if (useTRTC) {
      return this._startTRTCCall(calleeId, callType, isCompanionCall, orderId)
    } else {
      return this._startWebRTCCall(calleeId, callType)
    }
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
