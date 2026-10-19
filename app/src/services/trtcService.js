import { request } from '../common/common'

export const trtcService = {
  // ========== 通话管理 ==========
  // 审计 C-4：后端现在只在「带 roomId 且确认你是这通电话的双方之一」时才签发 userSig；
  // 不传 roomId 只返回可用性（configured/appId/userId），userSig 为 null。
  async getAuth(roomId) {
    return request('/api/trtc/auth', 'GET', roomId ? { roomId } : {})
  },

  async startCall(calleeId, callType = 1, isCompanionCall = false, orderId = 0) {
    return request('/api/trtc/start', 'POST', {
      calleeId,
      callType,
      isCompanionCall,
      orderId
    })
  },

  async cancelCall(callId) {
    return request('/api/trtc/cancel', 'POST', { callId })
  },

  async rejectCall(callId) {
    return request('/api/trtc/reject', 'POST', { callId })
  },

  async acceptCall(callId) {
    return request('/api/trtc/accept', 'POST', { callId })
  },

  async endCall(callId) {
    return request('/api/trtc/end', 'POST', { callId })
  },

  async getCallHistory(page = 1, pageSize = 20) {
    return request(`/api/trtc/history?page=${page}&pageSize=${pageSize}`, 'GET')
  },

  // ========== TRTC 房间管理 ==========
  async createRoom(roomId, roomName, maxMembers = 10) {
    return request('/api/trtc/room/create', 'POST', { roomId, roomName, maxMembers })
  },

  async enterRoom(roomId, userId) {
    return request('/api/trtc/room/enter', 'POST', { roomId, userId })
  },

  async leaveRoom(roomId) {
    return request('/api/trtc/room/leave', 'POST', { roomId })
  },

  async getRoomInfo(roomId) {
    return request(`/api/trtc/room/${roomId}`, 'GET')
  },

  // ========== 通话计费 ==========
  async startBilling(roomId, callType) {
    return request('/api/trtc/billing/start', 'POST', { roomId, callType })
  },

  async endBilling(billingId) {
    return request('/api/trtc/billing/end', 'POST', { billingId })
  }
}

export default trtcService
