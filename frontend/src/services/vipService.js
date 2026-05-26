import { request } from '../common/common'

const vipService = {
  async getVipPackages() {
    return request('/api/vip/packages', 'GET')
  },

  async getUserVipInfo() {
    return request('/api/vip/info', 'GET')
  },

  async createVipOrder(params) {
    return request('/api/vip/order', 'POST', params)
  },

  async completeVipOrder(orderNo, transactionId) {
    return request('/api/vip/order/complete', 'POST', { orderNo, transactionId })
  },

  async getVipOrderStatus(orderNo) {
    return request('/api/vip/order/status', 'GET', { orderNo })
  },

  async getVipRecords(params = {}) {
    const { page = 1, pageSize = 20 } = params
    return request('/api/vip/orders', 'GET', { page, pageSize })
  }
}

export default vipService

export const { getVipPackages, getUserVipInfo, createVipOrder, completeVipOrder, getVipOrderStatus, getVipRecords } = vipService