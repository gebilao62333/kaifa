import { socketService } from './socketService'
import { getRtcConfiguration } from '../common/webrtcConfig'

// ICE 服务器（STUN + 可选 TURN）统一由 common/webrtcConfig 提供，
// TURN 通过 VITE_TURN_URL / VITE_TURN_USERNAME / VITE_TURN_CREDENTIAL 注入。

class WebRTCCallService {
  constructor() {
    this.peerConnection = null
    this.localStream = null
    this.remoteStream = null
    this.remoteUserId = null
    this.callId = null
    this.isCaller = false
    this.callType = 1
    this.pendingCandidates = []
    this.onRemoteStream = null
    this.onLocalStream = null
    this.onCallStateChange = null
    this.callState = 'idle'
    this.cleanupDone = false
  }

  setCallbacks({ onRemoteStream, onLocalStream, onCallStateChange }) {
    if (onRemoteStream) this.onRemoteStream = onRemoteStream
    if (onLocalStream) this.onLocalStream = onLocalStream
    if (onCallStateChange) this.onCallStateChange = onCallStateChange

    // 被叫是「先接听后挂载页面」：流/状态可能已经就绪，立即回灌一次，
    // 否则远端画面与声音会因为回调注册太晚而丢失。
    if (this.onLocalStream && this.localStream) this.onLocalStream(this.localStream)
    if (this.onRemoteStream && this.remoteStream) this.onRemoteStream(this.remoteStream)
    if (this.onCallStateChange && this.callState && this.callState !== 'idle') this.onCallStateChange(this.callState)
  }

  _setState(state) {
    this.callState = state
    if (this.onCallStateChange) this.onCallStateChange(state)
  }

  _setupPeerListeners(pc, remoteId) {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.emit('webrtc_ice_candidate', {
          toId: remoteId,
          candidate: event.candidate
        })
      }
    }

    pc.ontrack = (event) => {
      this.remoteStream = event.streams[0]
      if (this.onRemoteStream) this.onRemoteStream(this.remoteStream)
    }

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        this._setState('disconnected')
      } else if (pc.iceConnectionState === 'connected') {
        this._setState('connected')
      }
    }
  }

  async _getLocalMedia(callType) {
    const constraints = callType === 2
      ? { video: { width: 640, height: 480 }, audio: true }
      : { audio: true, video: false }

    this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
    if (this.onLocalStream) this.onLocalStream(this.localStream)

    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream)
    })
  }

  // ===== 信令监听：全局只挂一次 =====
  // 放在服务层而不是页面里：接听 → 路由跳转 → 页面挂载之间存在时间窗，
  // 早到的 offer / ICE 若无监听会被直接丢弃，导致协商失败。
  attachSignalListeners() {
    if (this._signalsAttached) return
    this._signalsAttached = true

    // 主叫：被叫接听后，把 initiateCall 中已创建好的 offer 发出去
    socketService.on('call_accept', () => {
      if (this.isCaller) this.sendDelayedOffer()
    })

    socketService.on('webrtc_offer', (data) => {
      this.handleOffer(data.fromId, data.sdp)
    })

    socketService.on('webrtc_answer', (data) => {
      this.handleAnswer(data.fromId, data.sdp)
    })

    socketService.on('webrtc_ice_candidate', (data) => {
      this.handleIceCandidate(data.fromId, data.candidate)
    })
  }

  // ===== 主叫方：发起通话 =====
  async initiateCall(remoteId, callType = 1, callId = 0) {
    this.isCaller = true
    this.remoteUserId = remoteId
    this.callType = callType
    this.callId = callId
    this.cleanupDone = false
    this.attachSignalListeners()
    this._setState('calling')

    try {
      this.peerConnection = new RTCPeerConnection(await getRtcConfiguration())
      this._setupPeerListeners(this.peerConnection, remoteId)
      await this._getLocalMedia(callType)

      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)

      // 通过Socket发送invite，标记为WebRTC模式
      socketService.emit('call_invite', {
        toId: remoteId,
        callType,
        trtcRoomId: '',
        callId,
        useWebRTC: true
      })

      // 等待对方接听后再发送offer（通过webrtc_ready事件触发）
      this._onReady = () => {
        socketService.emit('webrtc_offer', {
          toId: remoteId,
          sdp: this.peerConnection.localDescription
        })
      }
    } catch (error) {
      console.error('WebRTC 发起通话失败:', error)
      this._setState('failed')
      throw error
    }
  }

  // 对方已接听，可以发送offer
  onCalleeReady() {
    if (this._onReady) {
      this._onReady()
      this._onReady = null
    }
  }

  // 获取localDescription后延迟发送的offer
  sendDelayedOffer() {
    if (this.peerConnection && this.peerConnection.localDescription) {
      socketService.emit('webrtc_offer', {
        toId: this.remoteUserId,
        sdp: this.peerConnection.localDescription
      })
    }
  }

  // ===== 被叫方：接收通话并主动创建offer =====
  async handleIncomingCall(fromId, callType = 1, callId = 0) {
    this.isCaller = false
    this.remoteUserId = fromId
    this.callType = callType
    this.callId = callId
    this.cleanupDone = false
    this.attachSignalListeners()
    this._setState('ringing')

    try {
      this.peerConnection = new RTCPeerConnection(await getRtcConfiguration())
      this._setupPeerListeners(this.peerConnection, fromId)
      await this._getLocalMedia(callType)

      this._setState('connecting')

      // 被叫不主动发 offer：统一由主叫收到 call_accept 后再发。
      // 否则双方同时 createOffer（glare），主叫 setRemoteDescription(offer) 会抛
      // InvalidStateError，通话直接判为连接失败。
      socketService.emit('call_accept', { toId: fromId, trtcRoomId: '' })
    } catch (error) {
      console.error('WebRTC 接听失败:', error)
      this._setState('failed')
      throw error
    }
  }

  // ===== 收到Offer =====
  async handleOffer(fromId, sdp) {
    try {
      // 如果还没有peerConnection（主叫方收到被叫方offer的特殊情况）
      if (!this.peerConnection) {
        this.peerConnection = new RTCPeerConnection(await getRtcConfiguration())
        this._setupPeerListeners(this.peerConnection, fromId)
        if (!this.localStream) {
          await this._getLocalMedia(this.callType)
        }
      }

      // 防御：本地若还挂着未协商的 offer（glare 场景），先回滚再接受远端 offer
      if (this.peerConnection.signalingState === 'have-local-offer') {
        try { await this.peerConnection.setLocalDescription({ type: 'rollback' }) } catch (e) { /* 忽略 */ }
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))

      // 处理等待中的ICE candidates
      while (this.pendingCandidates.length > 0) {
        const c = this.pendingCandidates.shift()
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(c))
      }

      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)

      socketService.emit('webrtc_answer', {
        toId: fromId,
        sdp: this.peerConnection.localDescription
      })
    } catch (error) {
      console.error('WebRTC 处理Offer失败:', error)
      this._setState('failed')
    }
  }

  // ===== 收到Answer =====
  async handleAnswer(fromId, sdp) {
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))

      // 处理等待中的ICE candidates
      while (this.pendingCandidates.length > 0) {
        const c = this.pendingCandidates.shift()
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(c))
      }
    } catch (error) {
      console.error('WebRTC 处理Answer失败:', error)
      this._setState('failed')
    }
  }

  // ===== 收到ICE Candidate =====
  async handleIceCandidate(fromId, candidate) {
    // 只接受当前会话对端的 candidate，来源不符直接丢弃（F-13）
    if (this.remoteUserId == null || String(fromId) !== String(this.remoteUserId)) {
      console.warn('WebRTC 丢弃来源不匹配的 ICE candidate')
      return
    }
    try {
      const iceCandidate = new RTCIceCandidate(candidate)
      if (this.peerConnection && this.peerConnection.remoteDescription) {
        await this.peerConnection.addIceCandidate(iceCandidate)
      } else {
        this.pendingCandidates.push(candidate)
      }
    } catch (error) {
      console.error('WebRTC 处理ICE失败:', error)
    }
  }

  // ===== 挂断 =====
  hangup(duration = 0) {
    this._setState('ended')
    this._cleanupMedia()

    if (this.remoteUserId) {
      socketService.emit('call_end', {
        toId: this.remoteUserId,
        duration
      })
    }
  }

  // ===== 切换音频 =====
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled
      })
    }
  }

  // ===== 切换视频 =====
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled
      })
    }
  }

  // ===== 切换扬声器 =====
  toggleSpeaker(enabled) {
    if (this.remoteStream) {
      const audioEls = document.querySelectorAll('audio')
      audioEls.forEach(el => {
        if (el.srcObject === this.remoteStream) {
          // 移动端不支持setSinkId时，静默忽略
        }
      })
    }
  }

  _cleanupMedia() {
    if (this.cleanupDone) return
    this.cleanupDone = true

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
    this.remoteStream = null
    this.pendingCandidates = []
  }

  cleanup() {
    this._cleanupMedia()
    this._setState('idle')
  }
}

// 全局单例
export const webrtcCallService = new WebRTCCallService()
export default webrtcCallService
