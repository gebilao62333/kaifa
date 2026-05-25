import { request } from '../common/common'

export const demandService = {
  async createDemand(data) {
    return request('/api/demand/create', 'POST', data)
  },

  async getDemandList(page = 1, pageSize = 10) {
    return request('/api/demand/list', 'GET', { page, pageSize })
  },

  async getDemandDetail(demandId) {
    return request('/api/demand/detail', 'GET', { demandId })
  },

  async cancelDemand(demandId) {
    return request('/api/demand/cancel', 'POST', { demandId })
  }
}

export default demandService
