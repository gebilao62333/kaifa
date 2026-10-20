import { socketService } from './socketService'
import { getRtcConfiguration } from '../common/webrtcConfig'
import {
  isNativeCallAvailable,
  initNativeCall,
  requestNativeCallPermissions,
  setNativeEventListener,
  createNativePeer,
  nativeCreateOffer,
  nativeCreateAnswer,
  nativeSetRemoteDescription,
  nativeAddIceCandidate,
  nativeStartAudio,
  nativeMute,
  nativeMuteVideo,
  nativeSetSpeaker,
  nativeSwitchCamera,
  nativeHangup
} from './nativeCallAdapter'

/**
 * App 原生 WebRTC 通话服务（Android UTS 插件）。
 *
 * 与 webrtcCallService 保持同一套公开方法/回调语义，供 callService 与通话页无感切换：
 *   - 浏览器版：RTCPeerConnection + getUserMedia，页面把 MediaStream 绑到 <video>
 *   - 原生版：KaifaWebRTC.kt 建 PeerConnection 并把画面渲染进原生 SurfaceView，
 *     页面不再拿到 MediaStream，只根据 onCallStateChange 更新 UI
 *
 * 信令完全复用现有 socket.io 事件（call_invite / call_accept / webrtc_offer /
 * webrtc_answer / webrtc_ice_candidate / call_end），后端无需改动。
 */
class NativeCallService {
  constructor() {
    this.isNative = true
    this.localStream = null
    this.remoteStream = null
    this.nativeVideo = false
    this.remoteUserId = null
    this.callId = null
    this.isCaller = false
    this.callType = 1
    this.callState = 'idle'
    this.pendingCandidates = []
    this.onRemoteStream = null
    this.onLocalStream = null
    this.onCallStateChange = null
    this._signalsAttached = false
    this._peerCreated = false
    this._remoteDescriptionSet = false
    this._calleeReady = false
    this._localOffer = null
    this._localDescSent = false
    this._eventsBound = false
    // 原生 setRemoteDescription 是异步回调：收到 offer 后必须等 remote-description 事件
    // 再 createAnswer，否则会命中「createAnswer called in wrong state」
    this._pendingAnswerFor = null
  }

  setCallbacks({ onRemoteStream, onLocalStream, onCallStateChange }) {
    if (onRemoteStream) this.onRemoteStream = onRemoteStream
    if (onLocalStream) this.onLocalStream = onLocalStream
    if (onCallStateChange) this.onCallStateChange = onCallStateChange

    // 被叫「先接通、后挂载页面」：状态可能已经就绪，注册时回灌一次
    if (this.onCallStateChange && this.callState && this.callState !== 'idle') {
      this.onCallStateChange(this.callState)
    }
  }

  _setState(state) {
    this.callState = state
    if (this.onCallStateChange) this.onCallStateChange(state)
  }

  _resetSession() {
    this.pendingCandidates = []
    this._peerCreated = false
    this._remoteDescriptionSet = false
    this._calleeReady = false
    this._localOffer = null
    this._localDescSent = false
    this._pendingAnswerFor = null
    this.nativeVideo = false
    this.localStream = null
    this.remoteStream = null
  }

  _bindEvents() {
    if (this._eventsBound) return
    this._eventsBound = true
    initNativeCall()
    setNativeEventListener((event) => this._onNativeEvent(event))
  }

  async _prepareMedia() {
    if (!isNativeCallAvailable()) throw new Error('原生通话不可用')
    this._bindEvents()
    const granted = await requestNativeCallPermissions()
    if (!granted) throw new Error('未获得相机/麦克风权限，请在系统设置中开启后重试')
  }

  async _createPeer(remoteId) {
    const config = await getRtcConfiguration()
    createNativePeer({
      userId: String(remoteId),
      audio: true,
      video: this.callType === 2,
      iceServers: (config && config.iceServers) || [],
      onEvent: (event) => this._onNativeEvent(event)
    })
    this._peerCreated = true
  }

  // ===== 原生插件事件 → 信令 / 状态 =====
  _onNativeEvent(event) {
    if (!event || !event.type) return
    switch (event.type) {
      case 'local-description':
        // Kotlin 侧 emit() 会把 payload.type 覆盖成事件名，offer/answer 只能按角色区分
        this._onLocalDescription(event)
        break
      case 'ice-candidate':
        if (event.candidate) {
          socketService.emit('webrtc_ice_candidate', {
            toId: this.remoteUserId,
            candidate: {
              candidate: event.candidate,
              sdpMid: event.sdpMid,
              sdpMLineIndex: event.sdpMLineIndex
            }
          })
        }
        break
      case 'remote-description':
        this._remoteDescriptionSet = true
        this._flushPendingCandidates()
        if (this._pendingAnswerFor) {
          const peer = this._pendingAnswerFor
          this._pendingAnswerFor = null
          nativeCreateAnswer(peer)
        }
        break
      case 'ice-connection-state':
        if (event.state === 'CONNECTED') {
          // 接通后再切音频路由，避免响铃阶段就占用通话音频模式
          nativeStartAudio()
          this._setState('connected')
        }
        else if (event.state === 'FAILED') this._setState('failed')
        else if (event.state === 'DISCONNECTED') this._setState('disconnected')
        break
      case 'remote-video':
        this.nativeVideo = true
        break
      case 'hangup':
        this._setState('ended')
        break
      case 'error':
        console.warn('[native-call] 插件错误:', event.message || event)
        if (this.callState !== 'connected') this._setState('failed')
        break
      default:
        break
    }
  }

  _onLocalDescription(event) {
    const local = { type: this.isCaller ? 'offer' : 'answer', sdp: event.sdp }
    if (this.isCaller) {
      // 主叫：等被叫 call_accept 后再发 offer，避免双方同时 createOffer（glare）
      this._localOffer = local
      if (this._calleeReady) this._sendLocalOffer()
      return
    }
    // 被叫：answer 生成后立即回传
    if (this._localDescSent) return
    this._localDescSent = true
    socketService.emit('webrtc_answer', { toId: this.remoteUserId, sdp: local })
  }

  _sendLocalOffer() {
    if (!this._localOffer || this._localDescSent) return
    this._localDescSent = true
    socketService.emit('webrtc_offer', { toId: this.remoteUserId, sdp: this._localOffer })
  }

  _flushPendingCandidates() {
    if (!this._remoteDescriptionSet) return
    while (this.pendingCandidates.length) {
      const c = this.pendingCandidates.shift()
      nativeAddIceCandidate(this.remoteUserId, c.candidate, c.sdpMid, c.sdpMLineIndex)
    }
  }

  // ===== socket 信令监听：全局只挂一次 =====
  attachSignalListeners() {
    if (this._signalsAttached) return
    this._signalsAttached = true

    socketService.on('call_accept', () => {
      if (!this.isCaller) return
      this._calleeReady = true
      this._sendLocalOffer()
    })

    socketService.on('webrtc_offer', (data) => {
      if (!data) return
      this.handleOffer(data.fromId, data.sdp)
    })

    socketService.on('webrtc_answer', (data) => {
      if (!data) return
      this.handleAnswer(data.fromId, data.sdp)
    })

    socketService.on('webrtc_ice_candidate', (data) => {
      if (!data) return
      this.handleIceCandidate(data.fromId, data.candidate)
    })
  }

  // ===== 主叫：发起通话 =====
  async initiateCall(remoteId, callType = 1, callId = 0) {
    this.isCaller = true
    this.remoteUserId = String(remoteId)
    this.callType = callType
    this.callId = callId
    this._resetSession()
    this.attachSignalListeners()
    this._setState('calling')

    try {
      await this._prepareMedia()
      await this._createPeer(remoteId)
      nativeCreateOffer(this.remoteUserId)

      // 先邀请对方；offer 等 call_accept 后再发
      socketService.emit('call_invite', {
        toId: this.remoteUserId,
        callType,
        trtcRoomId: '',
        callId,
        useWebRTC: true
      })
    } catch (error) {
      console.error('[native-call] 发起通话失败:', error)
      this._setState('failed')
      throw error
    }
  }

  // 兼容浏览器版接口：对方接听后允许补发 offer
  onCalleeReady() {
    this._calleeReady = true
    this._sendLocalOffer()
  }

  // 兼容浏览器版接口（原生实现中 offer 由 _sendLocalOffer 统一发送）
  sendDelayedOffer() {
    this._sendLocalOffer()
  }

  // ===== 被叫：接听 =====
  async handleIncomingCall(fromId, callType = 1, callId = 0) {
    this.isCaller = false
    this.remoteUserId = String(fromId)
    this.callType = callType
    this.callId = callId
    this._resetSession()
    this.attachSignalListeners()
    this._setState('ringing')

    try {
      await this._prepareMedia()
      await this._createPeer(fromId)
      this._setState('connecting')
      // 被叫不主动发 offer：统一由主叫收到 call_accept 后再发，避免 glare
      socketService.emit('call_accept', { toId: this.remoteUserId, trtcRoomId: '' })
    } catch (error) {
      console.error('[native-call] 接听失败:', error)
      this._setState('failed')
      throw error
    }
  }

  // ===== 收到远端 Offer（被叫） =====
  async handleOffer(fromId, sdp) {
    if (!sdp || !sdp.sdp) return
    try {
      if (!this._peerCreated) {
        await this._prepareMedia()
        await this._createPeer(fromId)
      }
      this._remoteDescriptionSet = false
      // 等 remote-description 事件确认 SDP 已 set 后再 createAnswer
      this._pendingAnswerFor = String(fromId)
      nativeSetRemoteDescription(fromId, sdp.type || 'offer', sdp.sdp)
    } catch (error) {
      console.error('[native-call] 处理 Offer 失败:', error)
      this._setState('failed')
    }
  }

  // ===== 收到远端 Answer（主叫） =====
  async handleAnswer(fromId, sdp) {
    if (!sdp || !sdp.sdp) return
    try {
      this._remoteDescriptionSet = false
      nativeSetRemoteDescription(fromId, sdp.type || 'answer', sdp.sdp)
    } catch (error) {
      console.error('[native-call] 处理 Answer 失败:', error)
      this._setState('failed')
    }
  }

  // ===== 收到 ICE Candidate =====
  handleIceCandidate(fromId, candidate) {
    if (this.remoteUserId == null || String(fromId) !== String(this.remoteUserId)) {
      console.warn('[native-call] 丢弃来源不匹配的 ICE candidate')
      return
    }
    if (!candidate) return
    // 浏览器 RTCIceCandidate 与原生事件对象字段一致
    const payload = {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex
    }
    if (!this._remoteDescriptionSet) {
      this.pendingCandidates.push(payload)
      return
    }
    nativeAddIceCandidate(this.remoteUserId, payload.candidate, payload.sdpMid, payload.sdpMLineIndex)
  }

  // ===== 挂断 =====
  hangup(duration = 0) {
    this._setState('ended')
    try { nativeHangup() } catch (e) { /* 忽略清理异常 */ }
    this.localStream = null
    this.remoteStream = null
    this._resetSession()
    if (this.remoteUserId) {
      socketService.emit('call_end', { toId: this.remoteUserId, duration })
    }
  }

  // ===== 媒体控制 =====
  toggleAudio(enabled) {
    nativeMute(!enabled)
  }

  toggleVideo(enabled) {
    nativeMuteVideo(!enabled)
  }

  toggleSpeaker(enabled) {
    nativeSetSpeaker(!!enabled)
  }

  switchCamera() {
    nativeSwitchCamera()
  }

  cleanup() {
    try { nativeHangup() } catch (e) { /* 忽略 */ }
    this._setState('idle')
    this._resetSession()
  }
}

export const nativeCallService = new NativeCallService()
export default nativeCallService
