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
    const result = await request('/api/games/companions', 'GET', data, {}, 15000)
    // 后端返回扁平结构(nickname/city/servicePrice/tags数组)，首页卡片组件期望 nickName/location/price
    if (result && result.code === 200 && result.data) {
      const list = result.data.list || []
      const mapped = list.map(c => ({
        userId: c.userId,
        nickName: c.nickname || '',
        avatar: c.avatar || '',
        level: c.level || 1,
        tags: Array.isArray(c.tags) ? c.tags : (c.tags ? String(c.tags).split(',') : []),
        price: c.servicePrice != null ? c.servicePrice : (c.price != null ? c.price : 0),
        online: c.online != null ? c.online : false,
        location: c.city || c.location || '',
        serviceType: c.serviceType || 'both',
        vip: c.vip || false,
        vipLevel: c.vipLevel || 0
      }))
      return { ...result, data: { ...result.data, list: mapped } }
    }
    return result
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

  async getNotice() {
    return request('/api/notice/list', 'GET')
  }
}

export default homeService
