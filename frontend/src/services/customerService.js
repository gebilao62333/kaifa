import { request } from '../common/common'

export const customerServiceApi = {
  // 获取客服列表
  getList: (params = {}) => {
    return request('/api/customer-service/list', 'GET', params)
  },
  
  // 获取单个客服信息
  getById: (id) => {
    return request(`/api/customer-service/${id}`, 'GET')
  },
  
  // 获取与客服的聊天记录
  getChatHistory: (customerId, params = {}) => {
    return request(`/api/customer-service/chat/${customerId}`, 'GET', params)
  },
  
  // 发送消息给客服
  sendMessage: (data) => {
    return request('/api/customer-service/message', 'POST', data)
  },
  
  // 获取未读消息数
  getUnreadCount: (userId) => {
    return request(`/api/customer-service/unread/${userId}`, 'GET')
  },
  
  // 更新客服状态（管理员）
  updateStatus: (id, data) => {
    return request(`/api/customer-service/status/${id}`, 'PUT', data)
  },
  
  // 创建新客服（管理员）
  create: (data) => {
    return request('/api/customer-service', 'POST', data)
  }
}

export default customerServiceApi
