import { request } from '../common/common'
import { validateParams } from '../common/common'

const reserveService = {
  async getSlots(params = {}) {
    const { companionId, date } = params
    const data = {}
    if (companionId) data.companionId = companionId
    if (date) data.date = date
    return request('/api/reserve/slots', 'GET', data)
  },

  async batchCreateSlots(slots) {
    validateParams({ slots }, {
      slots: { required: true, label: '时间段', type: 'array' }
    })
    return request('/api/reserve/slots/batch', 'POST', { slots })
  },

  async toggleSlot(slotId, enabled) {
    validateParams({ slotId }, {
      slotId: { required: true, label: '时间段ID', type: 'number' }
    })
    return request('/api/reserve/slots/toggle', 'POST', { slotId, enabled })
  },

  // 后端契约：{ companionId, gameId, date, time }
  async createReserve(params) {
    validateParams(params, {
      companionId: { required: true, label: '陪玩师ID', type: 'number' },
      date: { required: true, label: '预约日期', type: 'string' },
      time: { required: true, label: '预约时间', type: 'string' },
      gameId: { required: false, label: '游戏ID', type: 'number' }
    })
    return request('/api/reserve/create', 'POST', params)
  },

  async confirmReserve(reserveId) {
    validateParams({ reserveId }, {
      reserveId: { required: true, label: '预约ID', type: 'number' }
    })
    return request('/api/reserve/confirm', 'POST', { reserveId })
  },

  async rejectReserve(reserveId, reason = '') {
    validateParams({ reserveId }, {
      reserveId: { required: true, label: '预约ID', type: 'number' }
    })
    return request('/api/reserve/reject', 'POST', { reserveId, reason })
  },

  async cancelReserve(reserveId) {
    validateParams({ reserveId }, {
      reserveId: { required: true, label: '预约ID', type: 'number' }
    })
    return request('/api/reserve/cancel', 'POST', { reserveId })
  },

  async completeReserve(reserveId) {
    validateParams({ reserveId }, {
      reserveId: { required: true, label: '预约ID', type: 'number' }
    })
    return request('/api/reserve/complete', 'POST', { reserveId })
  },

  async getReserveList(params = {}) {
    const { status, page = 1, pageSize = 20 } = params
    const data = { page, pageSize }
    if (status !== undefined) data.status = status
    return request('/api/reserve/list', 'GET', data)
  },

  async getReserveDetail(reserveId) {
    validateParams({ reserveId }, {
      reserveId: { required: true, label: '预约ID', type: 'number' }
    })
    return request(`/api/reserve/detail?reserveId=${reserveId}`, 'GET')
  }
}

export default reserveService
