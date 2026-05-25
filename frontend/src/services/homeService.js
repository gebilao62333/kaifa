import { request } from '../common/common'

const homeService = {
  async getBanners() {
    return request('/api/banner/list', 'GET')
  },

  async getCategories() {
    return request('/api/games/categories', 'GET')
  },

  async getRecommendCompanions(params = {}) {
    const { page = 1, pageSize = 20, gameId, serviceType } = params
    const data = { page, pageSize }
    if (gameId) data.gameId = gameId
    if (serviceType) data.serviceType = serviceType
    return request('/api/games/companions', 'GET', data)
  },

  async searchCompanions(params = {}) {
    const { keyword, page = 1, pageSize = 20, gameId, serviceType } = params
    const data = { keyword, page, pageSize }
    if (gameId) data.gameId = gameId
    if (serviceType) data.serviceType = serviceType
    return request('/api/games/search', 'GET', data)
  },

  async getConfig() {
    return request('/api/config/home', 'GET')
  },

  async getHotSearch() {
    return request('/api/search/hot', 'GET')
  },

  async getActivities() {
    return request('/api/activity/list', 'GET')
  },

  async getNotice() {
    return request('/api/notice/list', 'GET')
  }
}

export default homeService
