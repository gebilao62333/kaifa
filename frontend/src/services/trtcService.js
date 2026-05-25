import { request } from '../common/common'

export const trtcService = {
  async getAuth() {
    return request('/api/trtc/auth', 'GET')
  },

  async startCall(calleeId, callType = 1, isCompanionCall = false, orderId = 0) {
    return request('/api/trtc/start-call', 'POST', {
      calleeId,
      callType,
      isCompanionCall,
      orderId
    })
  },

  async cancelCall(callId) {
    return request('/api/trtc/cancel-call', 'POST', { callId })
  },

  async rejectCall(callId) {
    return request('/api/trtc/reject-call', 'POST', { callId })
  },

  async acceptCall(callId) {
    return request('/api/trtc/accept-call', 'POST', { callId })
  },

  async endCall(callId) {
    return request('/api/trtc/end-call', 'POST', { callId })
  },

  async getCallHistory(page = 1, pageSize = 20) {
    return request('/api/trtc/call-history', 'GET', { page, pageSize })
  }
}

export default trtcService