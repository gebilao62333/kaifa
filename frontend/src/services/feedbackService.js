import { request } from '../common/common'

const feedbackService = {
  // 提交反馈
  async submitFeedback(data = {}) {
    const { type, content, images = [], contact = '' } = data
    return request('/api/feedback/submit', 'POST', { type, content, images, contact })
  },

  // 我的反馈列表
  async getMyFeedbacks(params = {}) {
    const { page = 1, pageSize = 20 } = params
    return request('/api/feedback/my', 'GET', { page, pageSize })
  }
}

export default feedbackService
