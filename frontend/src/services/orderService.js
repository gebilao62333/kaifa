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
    return request('/api/games/cancel', 'POST', { orderId, reason })
  },

  async evaluateOrder(orderId, rating, comment = '') {
    return request('/api/games/evaluate', 'POST', { orderId, rating, comment })
  },

  async getStatistics() {
    return request('/api/games/statistics', 'GET')
  }
}

export default orderService
