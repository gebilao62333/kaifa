import { request, RequestError } from '../common/common'

const payService = {
  async getPackages() {
    return request('/api/pay/packages', 'GET')
  },

  async createOrder(packageId, payMethod = 'wechat') {
    // payType 与后端 OrderChong.pay_type 对齐：1=支付宝 2=微信 3=密卡
    const payType = payMethod === 'alipay' ? 1 : payMethod === 'wechat' ? 2 : 1
    return request('/api/pay/create-order', 'POST', { packageId, payType })
  },

  // 微信统一下单：返回 { orderId, orderNo, amount, jsApiParams }
  async createWxOrder(packageId) {
    return request('/api/pay/wx-order', 'POST', { packageId })
  },

  // 第三方支付成功回调入账（生产环境由支付渠道服务端回调触发）
  async wxCallback(payNo, transactionId) {
    return request('/api/pay/wx-callback', 'POST', { payNo, transactionId })
  },

  async getOrderStatus(orderNo) {
    return request('/api/pay/order-status', 'GET', { orderNo })
  },

  async validateCard(cardNo, cardPwd) {
    return request('/api/pay/validate-card', 'POST', { cardCode: cardNo, cardPwd })
  },

  async useCard(cardNo, cardPwd) {
    return request('/api/pay/use-card', 'POST', { cardCode: cardNo, cardPwd })
  },

  // 统一的卡密核销：先校验、再使用，返回发放的金币数量。
  // 支付网关密卡支付复用此方法，保证逻辑一致。
  // 审计 C-3：后端现要求「卡号 + 密码」双项才兑现，cardPwd 必须随请求发送。
  async redeemCard(cardNo, cardPwd) {
    const validateRes = await request('/api/pay/validate-card', 'POST', { cardCode: cardNo, cardPwd })
    if (validateRes.code !== 200 && validateRes.code !== 0) {
      throw new RequestError(validateRes.message || '卡密验证失败', validateRes.code, 400)
    }
    const useRes = await request('/api/pay/use-card', 'POST', { cardCode: cardNo, cardPwd })
    if (useRes.code !== 200 && useRes.code !== 0) {
      throw new RequestError(useRes.message || '密卡使用失败', useRes.code, 400)
    }
    const data = useRes.data || {}
    return data.amount ?? data.coinAmount ?? 0
  },

  // 通过 25 位密钥一键充值（新方式）
  async redeemCardByKey(key) {
    const res = await request('/api/pay/redeem-key', 'POST', { key })
    if (res.code !== 200 && res.code !== 0) {
      throw new RequestError(res.message || '密钥充值失败', res.code, 400)
    }
    return res.data?.amount ?? 0
  },

  async getRechargeRecords(params = {}) {
    const { page = 1, pageSize = 20 } = params
    return request('/api/pay/recharge/list', 'GET', { page, pageSize })
  },

  async getWalletBalance() {
    return request('/api/pay/wallet/balance', 'GET')
  }
}

export default payService
