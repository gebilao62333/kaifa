import { request } from '../common/common'

export const giftService = {
  async getGiftList() {
    return request('/api/gift/list', 'GET')
  },

  async sendGift(receiverId, giftId, count) {
    return request('/api/gift/send', 'POST', { receiverId, giftId, count })
  },

  async getGiftBag() {
    return request('/api/gift/bag', 'GET')
  },

  async sendRedPacket(amount, count = 1, type = 0) {
    return request('/api/gift/redpacket/send', 'POST', { totalAmount: amount, totalNum: count, type })
  },

  async receiveRedPacket(packetId) {
    return request('/api/gift/redpacket/receive', 'POST', { packetId })
  },

  async getRedPacketHistory(type = 'all') {
    return request('/api/gift/redpacket/history', 'GET', { type })
  },

  async withdraw(params) {
    return request('/api/gift/withdraw', 'POST', params)
  }
}

export default giftService
