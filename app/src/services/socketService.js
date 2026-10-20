import { io } from 'socket.io-client'
import { goLogin } from '../common/route'
import { ref } from 'vue'
import { socketUrl as configSocketUrl } from '../common/config'
import { STORAGE_KEYS } from '../common/constants'
import { isApp } from '../common/platform'

// 401 时才判断是否已停在登录页：H5 看 window.location；App 端没有 window.location，
// 用页面栈末页路由判断，避免在登录页反复跳转
function isLoginPage() {
  try {
    if (isApp) {
      const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
      const current = Array.isArray(pages) && pages.length ? pages[pages.length - 1] : null
      const route = String((current && (current.route || current.__route__)) || '')
      return /(^|\/)login$/i.test(route)
    }
    return typeof window !== 'undefined' && !!window.location && window.location.pathname === '/login'
  } catch (e) {
    return false
  }
}
class SocketService {
  constructor() {
    this.socket = null
    this.connected = ref(false)
    this.listeners = new Map()
    // 内置 call_* 监听只注册一次；业务监听由各调用方通过 on() 进入注册表
    this.defaultListenersBound = false
  }

  // 每次（重）连都从本地存储读取最新 token，避免重连时沿用旧的闭包值（F-07）
  static readToken() {
    try {
      const fromUni = uni.getStorageSync(STORAGE_KEYS.TOKEN)
      if (fromUni) return fromUni
    } catch (e) {}
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN) || ''
    } catch (e) {
      return ''
    }
  }

  // 审计低危项：默认地址取 common/config 的 socketUrl（开发=localhost:3000，生产=空串）。
  // 空串表示同源连接，交给 socket.io 回落到当前站点（nginx 代理 /socket.io/），
  // 不再硬编码 http://localhost:3000 把生产连接指向用户本机。
  connect(url = configSocketUrl) {
    if (this.socket?.connected) {
      if (import.meta.env.DEV) console.log('[Socket] 已经连接')
      return this.socket
    }

    // 复用「握手进行中」的实例：登录动作与页面初始化可能几乎同时调用 connect，
    // 只判 connected 会在握手窗口内重复 io()，产生两条连接（事件重复、登出残留一条）。
    if (this.socket && this.socket.active) {
      return this.socket
    }

    const token = SocketService.readToken()

    if (!token) {
      if (import.meta.env.DEV) console.log('[Socket] 未登录，跳过连接')
      return null
    }

    if (import.meta.env.DEV) console.log('[Socket] 正在连接:', url)

    try {
      // 空串 → undefined：socket.io 对 undefined 会按当前站点同源连接（url() 内部回落 location）
      this.socket = io(url || undefined, {
        // auth 使用函数：每次 CONNECT（含自动重连）时读取当前最新 token
        auth: (cb) => cb({ token: SocketService.readToken() }),
        // App 端优先 WebSocket，避免 WebView file:// 下的轮询/CORS 问题；H5 保留降级
        transports: isApp ? ['websocket'] : ['websocket', 'polling'],
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
          if (!isLoginPage()) {
            goLogin()
          }
        }
      })

      this.socket.on('error', (error) => {
        console.warn('[Socket] 错误:', error)
        this.connected.value = false
      })

      // 断线重连/登出后再登录会重建 socket 实例：注册表里的监听（聊天/公告/来电等）
      // 必须重新挂到新实例上，否则登录后实时事件只存在于旧 socket 上。
      for (const [event, callbacks] of this.listeners) {
        callbacks.forEach((cb) => this.socket.on(event, cb))
      }

      if (!this.defaultListenersBound) {
        this.defaultListenersBound = true
        this.setupDefaultListeners()
      }

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
    const callbacks = this.listeners.get(event)
    // 去重：同一回调重复注册会让未读/提示重复触发；重连重挂也依赖这里保证不叠加。
    if (callbacks.includes(callback)) return
    callbacks.push(callback)
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
