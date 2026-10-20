import { request } from '../common/common'
import { validateParams } from '../common/common'

const reserveService = {
  async getSlots(params = {}) {
    const { companionId, date, includeDisabled } = params
    const data = {}
    if (companionId) data.companionId = companionId
    if (date) data.date = date
    // C-2：时段管理需要看到已关闭（status=2）的时段，否则关掉后就再也无法开启
    if (includeDisabled) data.includeDisabled = 1
    return request('/api/reserve/slots', 'GET', data)
  },

  async batchCreateSlots(slots) {
    validateParams({ slots }, {
      slots: { required: true, label: '时间段', type: 'array' }
    })
    return request('/api/reserve/slots/batch', 'POST', { slots })
  },

  // C-8：后端按「当前状态取反」处理，enabled 从不读取；这里不再上送该字段，避免语义空转
  async toggleSlot(slotId) {
    validateParams({ slotId }, {
      slotId: { required: true, label: '时间段ID', type: 'number' }
    })
    return request('/api/reserve/slots/toggle', 'POST', { slotId })
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
    const { status, role, page = 1, pageSize = 20 } = params
    const data = { page, pageSize }
    if (status !== undefined) data.status = status
    // C-2：user=我发起的（默认），companion=我收到的；后端按 role 切换 where
    if (role) data.role = role
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
