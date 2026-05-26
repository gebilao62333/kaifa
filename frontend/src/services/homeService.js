import { request } from '../common/common'
import { api } from '../common/config'

const homeService = {
  async getBanners() {
    return request(`${api}/banner/list`, 'GET')
  },

  async getCategories() {
    return request(`${api}/games/categories`, 'GET')
  },

  async getRecommendCompanions(params = {}) {
    const { page = 1, pageSize = 20, gameId, serviceType } = params
    const data = { page, pageSize }
    if (gameId) data.gameId = gameId
    if (serviceType) data.serviceType = serviceType
    return request(`${api}/games/companions`, 'GET', data, {}, 15000)
  },

  async searchCompanions(params = {}) {
    const { keyword, page = 1, pageSize = 20, gameId, serviceType } = params
    const data = { keyword, page, pageSize }
    if (gameId) data.gameId = gameId
    if (serviceType) data.serviceType = serviceType
    return request(`${api}/games/search`, 'GET', data)
  },

  async getConfig() {
    return request(`${api}/user/get`, 'GET')
  },

  async getHotSearch() {
    return request(`${api}/games/categories`, 'GET')
  },

  async getActivities() {
    return request(`${api}/banner/list`, 'GET')
  },

  async getNotice() {
    return request(`${api}/user/get`, 'GET')
  }
}

export default homeService
