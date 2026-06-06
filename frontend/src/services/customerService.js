import request from '../common/common'

export const customerServiceApi = {
  // 获取客服列表
  getList: (params = {}) => {
    return request.get('/customer-service/list', { params })
  },
  
  // 获取单个客服信息
  getById: (id) => {
    return request.get(`/customer-service/${id}`)
  },
  
  // 获取与客服的聊天记录
  getChatHistory: (customerId, params = {}) => {
    return request.get(`/customer-service/chat/${customerId}`, { params })
  },
  
  // 发送消息给客服
  sendMessage: (data) => {
    return request.post('/customer-service/message', data)
  },
  
  // 获取未读消息数
  getUnreadCount: (userId) => {
    return request.get(`/customer-service/unread/${userId}`)
  },
  
  // 更新客服状态（管理员）
  updateStatus: (id, data) => {
    return request.put(`/customer-service/status/${id}`, data)
  },
  
  // 创建新客服（管理员）
  create: (data) => {
    return request.post('/customer-service', data)
  }
}

export default customerServiceApi
