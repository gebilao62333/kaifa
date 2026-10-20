import { request } from '../common/common'

// U-12：互动通知（点赞/评论/关注/订单等），服务端 Mongo 存储
export const notificationCenterService = {
  async getList(page = 1, pageSize = 20) {
    return request('/api/notification/list', 'GET', { page, pageSize })
  },

  async getUnreadCount() {
    return request('/api/notification/unread-count', 'GET')
  },

  async markRead(id) {
    return request('/api/notification/read', 'POST', { id })
  },

  async markAllRead() {
    return request('/api/notification/read-all', 'POST')
  }
}

export default notificationCenterService
