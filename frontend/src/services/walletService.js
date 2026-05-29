import { request } from '../common/common'
import { validateParams } from '../common/common'

const walletService = {
  async getBalance() {
    return request('/api/pay/wallet/balance', 'GET')
  },

  async getRecords(params = {}) {
    const { type, page = 1, pageSize = 20 } = params
    const data = { page, pageSize }
    if (type) data.type = type
    return request('/api/pay/payment/history', 'GET', data)
  },

  async withdraw(params) {
    validateParams(params, {
      money: {
        required: true,
        label: '提现金额',
        type: 'number',
        min: 1
      },
      type: {
        required: true,
        label: '提现方式',
        type: 'number'
      }
    })
    return request('/api/gift/withdraw', 'POST', params)
  },

  async getWithdrawRecords(params = {}) {
    const { status, page = 1, pageSize = 20 } = params
    return request('/api/gift/admin/withdraw/list', 'GET', { status, page, pageSize })
  },

  async getWithdrawConfig() {
    return request('/api/gift/withdraw', 'GET')
  },

  async bindBankCard(data) {
    return request('/api/pay/wallet/recharge', 'POST', data)
  },

  async getBankCards() {
    return request('/api/pay/payment/history', 'GET')
  }
}

export default walletService
