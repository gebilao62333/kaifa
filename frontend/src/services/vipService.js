import { request } from '../common/common'

const vipService = {
  async getVipPackages() {
    return request('/api/vip/packages', 'GET')
  },

  async getUserVipInfo() {
    return request('/api/vip/my-info', 'GET')
  },

  async createVipOrder(packageId) {
    return request('/api/vip/buy', 'POST', { packageId })
  },

  async completeVipOrder(orderId) {
    return request('/api/vip/complete', 'POST', { orderId })
  },

  async getVipBenefits() {
    return request('/api/vip/benefits', 'GET')
  },

  async getVipRecords(params = {}) {
    const { page = 1, pageSize = 20 } = params
    return request('/api/vip/records', 'GET', { page, pageSize })
  },

  getPackages: async function() {
    return request('/api/vip/packages', 'GET')
  },

  getMyVipInfo: async function() {
    return request('/api/vip/my-info', 'GET')
  },

  buyVip: async function(packageId) {
    return request('/api/vip/buy', 'POST', { packageId })
  }
}

export default vipService

export const { getVipPackages, getUserVipInfo, createVipOrder, completeVipOrder, getVipBenefits, getVipRecords } = vipService