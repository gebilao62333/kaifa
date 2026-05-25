import { request } from '../common/common'
import { validateParams } from '../common/common'

const walletService = {
  async getBalance() {
    return request('/api/wallet/balance', 'GET')
  },

  async getRecords(params = {}) {
    const { type, page = 1, pageSize = 20 } = params
    const data = { page, pageSize }
    if (type) data.type = type
    return request('/api/wallet/records', 'GET', data)
  },

  async withdraw(params) {
    validateParams(params, {
      amount: {
        required: true,
        label: '提现金额',
        type: 'number',
        min: 1
      },
      method: {
        required: true,
        label: '提现方式',
        type: 'string'
      }
    })
    return request('/api/wallet/withdraw', 'POST', params)
  },

  async getWithdrawRecords(params = {}) {
    const { status, page = 1, pageSize = 20 } = params
    return request('/api/wallet/withdraw-records', 'GET', { status, page, pageSize })
  },

  async getWithdrawConfig() {
    return request('/api/wallet/withdraw-config', 'GET')
  },

  async bindBankCard(data) {
    validateParams(data, {
      bankName: { required: true, label: '银行名称', type: 'string' },
      bankAccount: { required: true, label: '银行账号', type: 'string' },
      accountName: { required: true, label: '开户姓名', type: 'string' }
    })
    return request('/api/wallet/bind-bank', 'POST', data)
  },

  async getBankCards() {
    return request('/api/wallet/bank-cards', 'GET')
  }
}

export default walletService
