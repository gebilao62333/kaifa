import { request } from '../common/common'

const orderService = {
  // role 是后端契约字段（不是 type）：user=我买到的（按 user_id 过滤），
  // companion=我接的单（按 target_user_id 过滤）。此前误传 type，后端读不到 role，
  // 永远退化成 role=user，导致陪玩师侧订单列表恒为空、订单停在「已接单」无法开始服务。
  async getOrders(params = {}) {
    const { role = 'user', status, page = 1, pageSize = 20 } = params
    const data = { role, page, pageSize }
    if (status !== undefined && status !== null && status !== '') data.status = status
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
