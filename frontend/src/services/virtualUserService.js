import { request } from '../common/common'

export const virtualUserService = {
  async getVirtualUsers(params = {}) {
    return request('/api/virtual-user', 'GET', params)
  },

  async getVirtualUser(id) {
    return request(`/api/virtual-user/${id}`, 'GET')
  },

  async createVirtualUser(data) {
    return request('/api/virtual-user', 'POST', data)
  },

  async updateVirtualUser(id, data) {
    return request(`/api/virtual-user/${id}`, 'PUT', data)
  },

  async deleteVirtualUser(id) {
    return request(`/api/virtual-user/${id}`, 'DELETE')
  },

  async toggleStatus(id) {
    return request(`/api/virtual-user/${id}/status`, 'POST')
  },

  async chat(virtualUserId, message) {
    return request(`/api/virtual-user/${virtualUserId}/chat`, 'POST', { message })
  },

  async getChatHistory(virtualUserId, page = 1, pageSize = 20) {
    return request(`/api/virtual-user/${virtualUserId}/history`, 'GET', { page, pageSize })
  },

  async clearContext(virtualUserId) {
    return request(`/api/virtual-user/${virtualUserId}/context`, 'DELETE')
  }
}

export default virtualUserService
