import { request } from '../common/common'

const searchService = {
  // 热门搜索词
  async getHotSearch() {
    return request('/api/search/hot', 'GET')
  },

  // 搜索动态
  async searchPosts(params = {}) {
    const { keyword, page = 1, pageSize = 20 } = params
    return request('/api/search/posts', 'GET', { keyword, page, pageSize })
  },

  // 搜索游戏
  async searchGames(params = {}) {
    const { keyword } = params
    return request('/api/search/games', 'GET', { keyword })
  }
}

export default searchService
