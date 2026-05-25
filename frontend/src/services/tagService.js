import { request } from '../common/common'

export const tagService = {
  async getTags(params = {}) {
    return request('/api/tag', 'GET', params)
  },

  async getTag(id) {
    return request(`/api/tag/${id}`, 'GET')
  },

  async getDefaultTags() {
    return request('/api/tag/defaults', 'GET')
  },

  async getRecommendedTags(params = {}) {
    return request('/api/tag/recommend', 'GET', params)
  },

  async getTagsByCategory(category) {
    return request(`/api/tag/category/${category}`, 'GET')
  },

  async createTag(data) {
    return request('/api/tag', 'POST', data)
  },

  async updateTag(id, data) {
    return request(`/api/tag/${id}`, 'PUT', data)
  },

  async deleteTag(id) {
    return request(`/api/tag/${id}`, 'DELETE')
  },

  async initDefaultTags() {
    return request('/api/tag/init-defaults', 'POST')
  },

  async getTagUsers(tagId, params = {}) {
    return request(`/api/tag/${tagId}/users`, 'GET', params)
  },

  async assignTag(userId, tagId) {
    return request('/api/tag/assign', 'POST', { userId, tagId })
  },

  async removeTag(userId, tagId) {
    return request('/api/tag/remove', 'POST', { userId, tagId })
  },

  async getUserTags(virtualUserId) {
    return request(`/api/tag/user/${virtualUserId}`, 'GET')
  },

  async setPrimaryTag(userId, tagId) {
    return request('/api/tag/set-primary', 'POST', { userId, tagId })
  }
}

export default tagService
