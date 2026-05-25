import { io } from 'socket.io-client'
import { ref } from 'vue'
import { api } from '../common/config'

class SocketService {
  constructor() {
    this.socket = null
    this.connected = ref(false)
    this.listeners = new Map()
  }

  connect(url = api.socketUrl || 'http://localhost:3000') {
    if (this.socket?.connected) {
      console.log('[Socket] 已经连接')
      return this.socket
    }

    const token = localStorage.getItem('token')
    
    if (!token) {
      console.log('[Socket] 未登录，跳过连接')
      return null
    }

    console.log('[Socket] 正在连接:', url)

    try {
      this.socket = io(url, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 10000
      })

      this.socket.on('connect', () => {
        console.log('[Socket] 连接成功')
        this.connected.value = true
      })

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] 断开连接:', reason)
        this.connected.value = false
      })

      this.socket.on('connect_error', (error) => {
        console.warn('[Socket] 连接错误:', error.message)
        this.connected.value = false
      })

      this.socket.on('error', (error) => {
        console.warn('[Socket] 错误:', error)
        this.connected.value = false
      })

      this.setupDefaultListeners()

      return this.socket
    } catch (error) {
      console.error('[Socket] 创建连接失败:', error)
      return null
    }
  }

  setupDefaultListeners() {
    this.on('call_invite', (data) => {
      console.log('[Socket] 收到来电:', data)
    })

    this.on('call_accept', (data) => {
      console.log('[Socket] 通话被接受:', data)
    })

    this.on('call_reject', (data) => {
      console.log('[Socket] 通话被拒绝:', data)
    })

    this.on('call_end', (data) => {
      console.log('[Socket] 通话已结束:', data)
    })

    this.on('user:online', (data) => {
      console.log('[Socket] 用户上线:', data)
    })

    this.on('user:offline', (data) => {
      console.log('[Socket] 用户离线:', data)
    })
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
    this.socket?.on(event, callback)
  }

  off(event, callback) {
    if (callback) {
      this.socket?.off(event, callback)
      const callbacks = this.listeners.get(event) || []
      const index = callbacks.indexOf(callback)
      if (index > -1) callbacks.splice(index, 1)
    } else {
      this.socket?.off(event)
      this.listeners.delete(event)
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('[Socket] 未连接，无法发送:', event)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected.value = false
    }
  }

  getConnectionState() {
    return this.connected.value
  }
}

export const socketService = new SocketService()
export default socketService