import { defineStore } from 'pinia'
import chatService from '../services/chatService'
import socketService from '../services/socketService'
import { STORAGE_KEYS } from '../common/constants'

export const useChatStore = defineStore('chat', {
  state: () => ({
    currentRoomId: null,
    currentChatUser: null,
    chatList: [],
    messageList: [],
    unreadMap: {},
    totalUnread: 0,
    noticeUnread: 0,
    loading: false,
    messageLoading: false,
    hasMoreMessages: true,
    currentPage: 1,
    socketConnected: false
  }),

  getters: {
    getTotalUnread: (state) => {
      const chat = Number(state.totalUnread) || 0
      const notice = Number(state.noticeUnread) || 0
      return chat + notice
    },
    getChatUnread: (state) => (userId) => {
      const count = Number(state.unreadMap?.[userId])
      return Number.isFinite(count) && count > 0 ? count : 0
    }
  },

  actions: {
    async fetchChatList(page = 1, pageSize = 20) {
      try {
        this.loading = true
        const result = await chatService.getChatList(page, pageSize)
        
        if (result?.code === 200) {
          const list = result.data?.list || result.data || []
          if (page === 1) {
            this.chatList = list
          } else {
            this.chatList = [...this.chatList, ...list]
          }
          return { success: true, data: list }
        }
        return { success: false, message: result?.message || '请求失败' }
      } catch (error) {
        console.error('获取聊天列表失败:', error)
        return { success: false, message: error.message }
      } finally {
        this.loading = false
      }
    },

    async fetchMessages(targetUserId, page = 1, pageSize = 20) {
      try {
        this.messageLoading = true
        const result = await chatService.getMessages(targetUserId, page, pageSize)
        
        if (result?.code === 200) {
          const list = result.data?.list || result.data || []
          this.hasMoreMessages = list.length >= pageSize
          this.currentPage = page
          
          if (page === 1) {
            this.messageList = list
          } else {
            this.messageList = [...list, ...this.messageList]
          }
          return { success: true, data: list }
        }
        return { success: false, message: result?.message || '请求失败' }
      } catch (error) {
        console.error('获取消息列表失败:', error)
        return { success: false, message: error.message }
      } finally {
        this.messageLoading = false
      }
    },

    async sendMessage(targetUserId, content, type = 0, mediaUrl = '', duration = 0) {
      try {
        const result = await chatService.sendMessage(targetUserId, content, type, mediaUrl, duration)
        
        if (result?.code === 200) {
          const message = {
            messageId: result?.data?.messageId,
            fromUserId: this.currentChatUser?.userId,
            toUserId: targetUserId,
            content,
            type,
            mediaUrl,
            duration,
            createTime: Date.now(),
            status: 'sent'
          }
          this.addMessage(message)

          return { success: true, data: message }
        }
        return { success: false, message: result?.message || '请求失败' }
      } catch (error) {
        console.error('发送消息失败:', error)
        return { success: false, message: error.message }
      }
    },

    async revokeMessage(messageId) {
      try {
        const result = await chatService.revokeMessage(messageId)
        
        if (result?.code === 200) {
          const message = this.messageList.find(m => m.messageId === messageId)
          if (message) {
            message.content = '[消息已撤回]'
            message.type = 7
          }
          return { success: true }
        }
        return { success: false, message: result?.message || '请求失败' }
      } catch (error) {
        console.error('撤回消息失败:', error)
        return { success: false, message: error.message }
      }
    },

    async markAsRead(targetUserId) {
      try {
        const result = await chatService.markAsRead(targetUserId)
        
        if (result?.code === 200) {
          this.updateUnread(targetUserId, 0)
          socketService.emit('message:read', { fromUserId: targetUserId })
        }
        return { success: result?.code === 200, message: result?.message || '请求失败' }
      } catch (error) {
        console.error('标记已读失败:', error)
        return { success: false, message: error.message }
      }
    },

    setupSocketListeners() {
      // 事件名与后端对齐：后端 socket 发送的是 private_message / fromId（见 backend/src/socket/index.js）
      socketService.on('private_message', (data) => {
        console.log('[Chat] 收到私聊消息:', data)
        const fromId = data?.fromId ?? data?.fromUserId
        if (fromId == null) return

        const isCurrentChat = fromId === this.currentChatUser?.userId

        if (isCurrentChat) {
          this.addMessage(data)
          if (this.currentChatUser?.userId) {
            this.markAsRead(this.currentChatUser.userId)
          }
        } else {
          const cur = Number(this.unreadMap[fromId]) || 0
          this.updateUnread(fromId, cur + 1)
        }

        const chatItem = this.chatList.find(c => c.targetUserId === fromId)
        if (chatItem) {
          chatItem.lastMessage = data?.content ?? ''
          chatItem.lastMessageTime = data?.sendTime ? data.sendTime * 1000 : Date.now()
          if (!isCurrentChat) {
            chatItem.unreadCount = (Number(chatItem.unreadCount) || 0) + 1
          }
        }
      })

      socketService.on('message:read', (data) => {
        console.log('[Chat] 消息已读:', data)
        this.messageList.forEach(msg => {
          if (msg.toUserId === data.fromUserId) {
            msg.status = 'read'
          }
        })
      })

      socketService.on('message:revoked', (data) => {
        console.log('[Chat] 消息已撤回:', data)
        const message = this.messageList.find(m => m.messageId === data.messageId)
        if (message) {
          message.content = '[消息已撤回]'
          message.type = 7
        }
      })
    },

    setCurrentChat(user) {
      this.currentChatUser = user
      this.currentRoomId = user?.roomId || null
      this.messageList = []
      this.currentPage = 1
      this.hasMoreMessages = true
    },

    setCurrentRoom(roomId) {
      this.currentRoomId = roomId
    },

    addMessage(message) {
      const msgId = message.messageId ?? message.id
      const exists = this.messageList.some(m => (m.messageId ?? m.id) === msgId)
      if (!exists) {
        this.messageList.push(message)
      }
    },

    addMessages(messages) {
      this.messageList = [...this.messageList, ...messages]
    },

    setMessageList(messages) {
      this.messageList = messages
    },

    updateUnread(userId, count) {
      this.unreadMap[userId] = Number(count) || 0
      this.calculateTotalUnread()
    },

    calculateTotalUnread() {
      this.totalUnread = Object.values(this.unreadMap).reduce((sum, count) => {
        const n = Number(count)
        return sum + (Number.isFinite(n) && n > 0 ? n : 0)
      }, 0)
    },

    setChatUnread(count) {
      this.totalUnread = Number(count) || 0
    },

    setNoticeUnread(count) {
      this.noticeUnread = Number(count) || 0
    },

    clearMessages() {
      this.messageList = []
    },

    clearAllUnread() {
      this.totalUnread = 0
      this.noticeUnread = 0
      this.unreadMap = {}
    },

    clearCurrentChat() {
      this.currentChatUser = null
      this.currentRoomId = null
      this.clearMessages()
    },

    initSocketConnection() {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (token) {
        socketService.connect()
        this.socketConnected = true
        this.setupSocketListeners()
      }
    },

    disconnectSocket() {
      socketService.disconnect()
      this.socketConnected = false
    }
  }
})
