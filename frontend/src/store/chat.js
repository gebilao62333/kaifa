import { defineStore } from 'pinia'
import chatService from '../services/chatService'
import socketService from '../services/socketService'

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
      return state.totalUnread + state.noticeUnread
    },
    getChatUnread: (state) => (userId) => {
      return state.unreadMap[userId] || 0
    }
  },

  actions: {
    async fetchChatList(page = 1, pageSize = 20) {
      try {
        this.loading = true
        const result = await chatService.getChatList(page, pageSize)
        
        if (result.code === 200) {
          const list = result.data?.list || result.data || []
          if (page === 1) {
            this.chatList = list
          } else {
            this.chatList = [...this.chatList, ...list]
          }
          return { success: true, data: list }
        }
        return { success: false, message: result.message }
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
        
        if (result.code === 200) {
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
        return { success: false, message: result.message }
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
        
        if (result.code === 200) {
          const message = {
            messageId: result.data?.messageId,
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
          
          socketService.emit('message:send', {
            toUserId: targetUserId,
            content,
            type
          })
          
          return { success: true, data: message }
        }
        return { success: false, message: result.message }
      } catch (error) {
        console.error('发送消息失败:', error)
        return { success: false, message: error.message }
      }
    },

    async revokeMessage(messageId) {
      try {
        const result = await chatService.revokeMessage(messageId)
        
        if (result.code === 200) {
          const message = this.messageList.find(m => m.messageId === messageId)
          if (message) {
            message.content = '[消息已撤回]'
            message.type = 7
          }
          return { success: true }
        }
        return { success: false, message: result.message }
      } catch (error) {
        console.error('撤回消息失败:', error)
        return { success: false, message: error.message }
      }
    },

    async markAsRead(targetUserId) {
      try {
        const result = await chatService.markAsRead(targetUserId)
        
        if (result.code === 200) {
          this.updateUnread(targetUserId, 0)
          socketService.emit('message:read', { fromUserId: targetUserId })
        }
        return { success: result.code === 200, message: result.message }
      } catch (error) {
        console.error('标记已读失败:', error)
        return { success: false, message: error.message }
      }
    },

    setupSocketListeners() {
      socketService.on('new_message', (data) => {
        console.log('[Chat] 收到新消息:', data)
        
        const isCurrentChat = data.fromUserId === this.currentChatUser?.userId
        
        if (isCurrentChat) {
          this.addMessage(data)
          if (this.currentChatUser?.userId) {
            this.markAsRead(this.currentChatUser.userId)
          }
        } else {
          this.updateUnread(data.fromUserId, (this.unreadMap[data.fromUserId] || 0) + 1)
        }
        
        const chatItem = this.chatList.find(c => c.targetUserId === data.fromUserId)
        if (chatItem) {
          chatItem.lastMessage = data.content
          chatItem.lastMessageTime = data.createTime
          if (!isCurrentChat) {
            chatItem.unreadCount = (chatItem.unreadCount || 0) + 1
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

    addMessage(message) {
      const exists = this.messageList.some(m => m.messageId === message.messageId)
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
      this.unreadMap[userId] = count
      this.calculateTotalUnread()
    },

    calculateTotalUnread() {
      this.totalUnread = Object.values(this.unreadMap).reduce((sum, count) => sum + count, 0)
    },

    setChatUnread(count) {
      this.totalUnread = count
    },

    setNoticeUnread(count) {
      this.noticeUnread = count
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
      const token = localStorage.getItem('token')
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
