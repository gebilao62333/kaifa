import { request, RequestError } from '../common/common'

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

  // 统一的卡密核销：先校验、再使用，返回发放的金币数量。
  // 密卡充值 / 充值中心密卡支付 / 支付网关密卡支付 均复用此方法，保证逻辑一致。
  async redeemCard(cardNo, cardPwd) {
    const validateRes = await request('/api/pay/validate-card', 'POST', { cardNo, cardPwd })
    if (validateRes.code !== 200 && validateRes.code !== 0) {
      throw new RequestError(validateRes.message || '卡密验证失败', validateRes.code, 400)
    }
    const useRes = await request('/api/pay/use-card', 'POST', { cardNo, cardPwd })
    if (useRes.code !== 200 && useRes.code !== 0) {
      throw new RequestError(useRes.message || '密卡使用失败', useRes.code, 400)
    }
    const data = useRes.data || {}
    return data.amount ?? data.coinAmount ?? 0
  },

  async getRechargeRecords(params = {}) {
    const { page = 1, pageSize = 20 } = params
    return request('/api/pay/records', 'GET', { page, pageSize })
  },

  async getWalletBalance() {
    return request('/api/pay/wallet/balance', 'GET')
  }
}

export default payService
