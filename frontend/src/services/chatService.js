import { request } from '../common/common'
import { validateParams } from '../common/common'

const getChatList = async (page = 1, pageSize = 20) => {
  validateParams({ page, pageSize }, {
    page: {
      required: true,
      label: '页码',
      type: 'number',
      min: 1
    },
    pageSize: {
      required: true,
      label: '每页数量',
      type: 'number',
      min: 1,
      max: 100
    }
  })
  return request('/api/chat/list', 'GET', { page, pageSize })
}

const getMessages = async (targetUserId, page = 1, pageSize = 20) => {
  validateParams({ targetUserId, page, pageSize }, {
    targetUserId: {
      required: true,
      label: '目标用户ID',
      type: 'number',
      min: 1
    },
    page: {
      required: true,
      label: '页码',
      type: 'number',
      min: 1
    },
    pageSize: {
      required: true,
      label: '每页数量',
      type: 'number',
      min: 1,
      max: 100
    }
  })
  return request('/api/chat/messages', 'GET', { targetUserId, page, pageSize })
}

const sendMessage = async (targetUserId, content, type = 0, mediaUrl = '', duration = 0) => {
  validateParams({ targetUserId, content, type }, {
    targetUserId: {
      required: true,
      label: '目标用户ID',
      type: 'number',
      min: 1
    },
    content: {
      required: true,
      label: '消息内容',
      type: 'string',
      minLength: 1,
      maxLength: 2000
    },
    type: {
      required: true,
      label: '消息类型',
      type: 'number',
      min: 0,
      max: 10
    }
  })
  return request('/api/chat/send', 'POST', { targetUserId, content, type, mediaUrl, duration })
}

const revokeMessage = async (messageId) => {
  validateParams({ messageId }, {
    messageId: {
      required: true,
      label: '消息ID',
      type: 'number',
      min: 1
    }
  })
  return request('/api/chat/revoke', 'POST', { messageId })
}

const markAsRead = async (targetUserId) => {
  validateParams({ targetUserId }, {
    targetUserId: {
      required: true,
      label: '目标用户ID',
      type: 'number',
      min: 1
    }
  })
  return request('/api/chat/mark-read', 'POST', { targetUserId })
}

export default {
  getChatList,
  getMessages,
  sendMessage,
  revokeMessage,
  markAsRead
}