import { request } from '../common/common'

const payService = {
  async getPackages() {
    return request('/api/pay/packages', 'GET')
  },

  async createOrder(packageId, payMethod = 'wechat') {
    return request('/api/pay/create-order', 'POST', { packageId, payMethod })
  },

  async getOrderStatus(orderId) {
    return request('/api/pay/order-status', 'GET', { orderId })
  },

  async validateCard(cardNo, cardPwd) {
    return request('/api/pay/validate-card', 'POST', { cardNo, cardPwd })
  },

  async useCard(cardNo, cardPwd) {
    return request('/api/pay/use-card', 'POST', { cardNo, cardPwd })
  },

  async getRechargeRecords(params = {}) {
    const { page = 1, pageSize = 20 } = params
    return request('/api/pay/recharge/list', 'GET', { page, pageSize })
  }
}

export default payService
