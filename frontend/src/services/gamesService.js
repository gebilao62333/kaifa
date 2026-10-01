import { request } from '../common/common'
import { validateParams } from '../common/common'

const gamesService = {
  async getCategories() {
    return request('/api/games/categories', 'GET')
  },

  async getCompanions(params = {}) {
    const { gameId, serviceType, page = 1, pageSize = 20, sort = 'default' } = params
    const data = { page, pageSize }
    if (gameId) data.gameId = gameId
    if (serviceType) data.serviceType = serviceType
    if (sort) data.sort = sort
    return request('/api/games/companions', 'GET', data)
  },

  // 后端契约：{ targetUserId?, gameId, num, price? }
  // 传 targetUserId → 指定陪玩师下单；不传 → 派单大厅悬赏单（必须给 price）
  async pushOrder(params) {
    const { targetUserId, gameId, num = 1, price } = params
    validateParams({ gameId }, {
      gameId: { required: true, label: '游戏', type: 'number' }
    })
    const data = { gameId, num }
    if (targetUserId) data.targetUserId = targetUserId
    if (price !== undefined && price !== null && price !== '') data.price = price
    if (!targetUserId && !data.price) {
      throw new Error('请选择陪玩师或填写悬赏单价')
    }
    return request('/api/games/push', 'POST', data)
  },

  async getPool(params = {}) {
    const { gameId, page = 1, pageSize = 20 } = params
    const data = { page, pageSize }
    if (gameId) data.gameId = gameId
    return request('/api/games/pool', 'GET', data)
  },

  async getMyServices() {
    return request('/api/games/my-services', 'GET')
  },

  async toggleServiceStatus(serviceId) {
    validateParams({ serviceId }, {
      serviceId: { required: true, label: '服务ID', type: 'number' }
    })
    return request('/api/games/toggle-service', 'POST', { serviceId })
  },

  async grabOrder(orderId) {
    validateParams({ orderId }, {
      orderId: { required: true, label: '订单ID', type: 'number' }
    })
    return request('/api/games/grab', 'POST', { orderId })
  },

  async startService(orderId) {
    validateParams({ orderId }, {
      orderId: { required: true, label: '订单ID', type: 'number' }
    })
    return request('/api/games/start', 'POST', { orderId })
  },

  async completeService(orderId) {
    validateParams({ orderId }, {
      orderId: { required: true, label: '订单ID', type: 'number' }
    })
    return request('/api/games/complete', 'POST', { orderId })
  },

  async cancelOrder(orderId, reason = '') {
    validateParams({ orderId }, {
      orderId: { required: true, label: '订单ID', type: 'number' }
    })
    return request('/api/games/cancel', 'POST', { orderId, reason })
  },

  async getOrders(params = {}) {
    const { status, page = 1, pageSize = 20, type = 'all' } = params
    const data = { page, pageSize, type }
    if (status !== undefined) data.status = status
    return request('/api/games/orders', 'GET', data)
  },

  async applyCompanion(params) {
    validateParams(params, {
      gameId: { required: true, label: '游戏ID', type: 'number' },
      serviceType: { required: true, label: '服务类型', type: 'string' },
      price: { required: true, label: '价格', type: 'number' },
      tags: { required: false, label: '标签', type: 'string' },
      description: { required: false, label: '简介', type: 'string' }
    })
    return request('/api/games/apply', 'POST', params)
  },

  async getApplyStatus() {
    return request('/api/games/apply/status', 'GET')
  },

  async getCompanionDetail(companionId) {
    validateParams({ companionId }, {
      companionId: { required: true, label: '陪玩师ID', type: 'number' }
    })
    return request(`/api/games/companions/${companionId}`, 'GET')
  },

  async evaluateOrder(orderId, rating, comment = '') {
    validateParams({ orderId, rating }, {
      orderId: { required: true, label: '订单ID', type: 'number' },
      rating: { required: true, label: '评分', type: 'number' }
    })
    return request('/api/games/evaluate', 'POST', { orderId, rating, comment })
  }
}

export default gamesService
