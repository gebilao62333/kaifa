import { request } from '../common/common'

const orderService = {
  async getOrders(params = {}) {
    const { status, type = 'all', page = 1, pageSize = 20 } = params
    const data = { type, page, pageSize }
    if (status !== undefined) data.status = status
    return request('/api/games/orders', 'GET', data)
  },

  async getOrderDetail(orderId) {
    return request('/api/games/order-detail', 'GET', { orderId })
  },

  async cancelOrder(orderId, reason = '') {
    // 后端按 { orderId, role } 校验权限：role=user 仅允许订单所属用户取消
    return request('/api/games/cancel', 'POST', { orderId, role: 'user' })
  },

  async evaluateOrder(orderId, rating, comment = '') {
    return request('/api/games/evaluate', 'POST', { orderId, rating, comment })
  },

  async startService(orderId) {
    return request('/api/games/start', 'POST', { orderId })
  },

  async completeService(orderId) {
    return request('/api/games/complete', 'POST', { orderId })
  },

  async getStatistics() {
    return request('/api/games/statistics', 'GET')
  },

  async appealOrder(orderId, reason = '') {
    return request('/api/games/appeal', 'POST', { orderId, reason })
  }
}

export default orderService
