// 用户端通知服务
import { request } from '../common/common'

const BASE = '/api/notification'

export const notificationService = {
  // 获取通知列表
  getNotifications(params = {}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', params.page)
    if (params.pageSize) query.set('pageSize', params.pageSize)
    const qs = query.toString()
    return request(BASE + (qs ? `?${qs}` : ''))
  },

  // 标记单条已读
  markRead(id) {
    return request(`${BASE}/${id}/read`, { method: 'PUT' })
  },

  // 标记全部已读
  markAllRead() {
    return request(`${BASE}/read-all`, { method: 'PUT' })
  },

  // 获取未读数
  async getUnreadCount() {
    try {
      const res = await request(BASE)
      if (res.code === 200 && Array.isArray(res.data)) {
        return res.data.filter(n => !n.isRead).length
      }
      return 0
    } catch {
      return 0
    }
  },

  // 订阅通知更新（轮询模式，每 30 秒拉取一次）
  _subscribers: [],
  _timer: null,
  _POLL_INTERVAL: 30000,

  subscribe(callback) {
    if (typeof callback !== 'function') return () => {}
    this._subscribers.push(callback)

    // 首次立即推送
    this._poll()

    // 无定时器时启动
    if (!this._timer) {
      this._timer = setInterval(() => this._poll(), this._POLL_INTERVAL)
    }

    // 返回取消订阅函数
    const idx = this._subscribers.length - 1
    return () => {
      this._subscribers.splice(idx, 1)
      if (this._subscribers.length === 0 && this._timer) {
        clearInterval(this._timer)
        this._timer = null
      }
    }
  },

  // 初始化（触发一次拉取）
  init() {
    this._poll()
  },

  async _poll() {
    try {
      const res = await request(BASE)
      if (res.code === 200) {
        const list = Array.isArray(res.data) ? res.data : []
        const unreadCount = list.filter(n => !n.isRead).length
        const payload = { list, unreadCount }
        this._subscribers.forEach(fn => fn(payload))
      }
    } catch { /* 静默忽略轮询失败 */ }
  }
}

export default notificationService
