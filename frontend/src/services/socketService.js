import { io } from 'socket.io-client'
import { ref } from 'vue'
import { socketUrl as configSocketUrl } from '../common/config'
import { STORAGE_KEYS } from '../common/constants'

class SocketService {
  constructor() {
    this.socket = null
    this.connected = ref(false)
    this.listeners = new Map()
  }

  // 每次（重）连都从本地存储读取最新 token，避免重连时沿用旧的闭包值（F-07）
  static readToken() {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN) || ''
    } catch (e) {
      return ''
    }
  }

  connect(url = configSocketUrl || 'http://localhost:3000') {
    if (this.socket?.connected) {
      if (import.meta.env.DEV) console.log('[Socket] 已经连接')
      return this.socket
    }

    const token = SocketService.readToken()

    if (!token) {
      if (import.meta.env.DEV) console.log('[Socket] 未登录，跳过连接')
      return null
    }

    if (import.meta.env.DEV) console.log('[Socket] 正在连接:', url)

    try {
      this.socket = io(url, {
        // auth 使用函数：每次 CONNECT（含自动重连）时读取当前最新 token
        auth: (cb) => cb({ token: SocketService.readToken() }),
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        // 心跳依赖 socket.io/engine.io 内置的 ping/pong（服务端握手时下发
        // pingInterval/pingTimeout），不额外发明后端未实现的应用层事件（F-17）
        timeout: 10000
      })

      this.socket.on('reconnect_attempt', () => {
        // 再次兜底：重连前同步刷新 auth，确保不使用过期 token（F-07）
        this.socket.auth = { token: SocketService.readToken() }
        if (import.meta.env.DEV) console.log('[Socket] 尝试重连')
      })

      this.socket.on('connect', () => {
        if (import.meta.env.DEV) console.log('[Socket] 连接成功')
        this.connected.value = true
      })

      this.socket.on('disconnect', (reason) => {
        if (import.meta.env.DEV) console.log('[Socket] 断开连接:', reason)
        this.connected.value = false
      })

      this.socket.on('connect_error', (error) => {
        console.warn('[Socket] 连接错误:', error.message)
        this.connected.value = false

        // 后端鉴权拒绝：停止重连并清理失效令牌，避免无限重试
        if (error.message === 'UNAUTHORIZED') {
          this.socket?.disconnect()
          this.socket = null
          try {
            localStorage.removeItem(STORAGE_KEYS.TOKEN)
          } catch (e) { /* storage 不可用时忽略 */ }
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
        }
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
      if (import.meta.env.DEV) console.log('[Socket] 收到来电:', data)
    })

    this.on('call_accept', (data) => {
      if (import.meta.env.DEV) console.log('[Socket] 通话被接受:', data)
    })

    this.on('call_reject', (data) => {
      if (import.meta.env.DEV) console.log('[Socket] 通话被拒绝:', data)
    })

    this.on('call_end', (data) => {
      if (import.meta.env.DEV) console.log('[Socket] 通话已结束:', data)
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

  // 发送“正在输入”提示（后端按 toId 转发给对端）
  sendTyping(toId) {
    if (!toId) return
    this.emit('typing', { toId })
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
