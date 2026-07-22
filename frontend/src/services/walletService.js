import { request, RequestError } from '../common/common'

// 钱包相关接口：收入流水、总资产、提现（与后端 /api/wallet 对应）
const walletService = {
  // 钱包总览：总资产 / 累计收入 / 已提现 / 今日收益
  async getOverview() {
    return request('/api/wallet/overview', 'GET')
  },

  // 收入明细列表
  async getIncomeRecords(params = {}) {
    const { page = 1, pageSize = 50 } = params
    return request('/api/wallet/income-records', 'GET', { page, pageSize })
  },

  // 收入来源构成（按来源聚合）
  async getIncomeBreakdown() {
    return request('/api/wallet/income-breakdown', 'GET')
  },

  // 提现记录（钱包渠道）
  async getWithdrawRecords(params = {}) {
    const { page = 1, pageSize = 20 } = params
    return request('/api/wallet/withdraw-records', 'GET', { page, pageSize })
  },

  // 支出明细列表
  async getExpenseRecords(params = {}) {
    const { page = 1, pageSize = 50 } = params
    return request('/api/wallet/expense-records', 'GET', { page, pageSize })
  },

  // 支出总览：支出总额 / 今日支出
  async getExpenseOverview() {
    return request('/api/wallet/expense-overview', 'GET')
  },

  // 从总资产提现
  async withdraw({ amount, type, account }) {
    const res = await request('/api/wallet/withdraw', 'POST', { amount, type, account })
    if (res.code !== 200 && res.code !== 0) {
      throw new RequestError(res.message || '提现申请失败', res.code, 400)
    }
    return res
  }
}

export default walletService
