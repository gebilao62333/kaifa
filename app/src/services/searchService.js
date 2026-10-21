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

  // 搜索普通用户（P2-8：昵称模糊匹配，服务端按 status=1 + 隐私开关过滤）
  async searchUsers(params = {}) {
    const { keyword, page = 1, pageSize = 20 } = params
    return request('/api/search/users', 'GET', { keyword, page, pageSize })
  },

  // 搜索游戏
  async searchGames(params = {}) {
    const { keyword } = params
    return request('/api/search/games', 'GET', { keyword })
  }
}

export default searchService
