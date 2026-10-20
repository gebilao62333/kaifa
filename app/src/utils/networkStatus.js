import { ref } from 'vue'
import { isApp } from '../common/platform'

// App 端没有 window 的 online/offline 事件，网络状态改由 uni 网络 API 提供；
// uni 只给 networkType，没有 effectiveType/downlink/rtt，后三者保持 unknown 避免误判慢网。
const hasUniNetworkApi = () => typeof uni !== 'undefined' && typeof uni.getNetworkType === 'function' && typeof uni.onNetworkStatusChange === 'function'

class NetworkStatus {
  constructor() {
    this.isOnline = ref(isApp ? true : (typeof navigator !== 'undefined' ? navigator.onLine : true))
    this.networkType = ref('unknown')
    this.effectiveType = ref('unknown')
    this.downlink = ref(0)
    this.rtt = ref(0)
    this.listeners = new Set()
    // App 端 uni.onNetworkStatusChange 的回调引用，destroy 时用于退订
    this.uniNetworkHandler = null
  }

  init() {
    // App 端走 uni 网络 API；H5 保持 navigator/window 原实现（两端订阅/退订语义一致）
    if (isApp) {
      if (!hasUniNetworkApi() || this.uniNetworkHandler) return
      this.uniNetworkHandler = (res) => this.handleUniNetworkChange(res)
      try {
        uni.onNetworkStatusChange(this.uniNetworkHandler)
      } catch (e) {
        this.uniNetworkHandler = null
        return
      }
      try {
        uni.getNetworkType({ success: (res) => this.handleUniNetworkChange(res, false) })
      } catch (e) { /* 首次查询失败时保持默认在线，等后续状态变更通知 */ }
      return
    }

    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)

    if (navigator.connection) {
      navigator.connection.addEventListener('change', this.handleConnectionChange)
      this.updateNetworkInfo()
    }
  }

  destroy() {
    if (isApp) {
      if (this.uniNetworkHandler && typeof uni.offNetworkStatusChange === 'function') {
        try { uni.offNetworkStatusChange(this.uniNetworkHandler) } catch (e) { /* 退订失败不影响下次重新订阅 */ }
      }
      this.uniNetworkHandler = null
      return
    }

    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)

    if (navigator.connection) {
      navigator.connection.removeEventListener('change', this.handleConnectionChange)
    }
  }

  handleOnline = () => {
    this.isOnline.value = true
    this.notifyListeners('online')
    this.updateNetworkInfo()
  }

  handleOffline = () => {
    this.isOnline.value = false
    this.notifyListeners('offline')
  }

  // App 端网络变更：uni 每次回调都带 isConnected/networkType，只有跨在线/离线边界才广播，
  // 避免弱网抖动时反复提示「网络已断开/已恢复」
  handleUniNetworkChange = (res, notify = true) => {
    const networkType = (res && res.networkType) || 'unknown'
    this.networkType.value = networkType
    const connected = !res || res.isConnected !== false
    const online = connected && networkType !== 'none'
    const changed = online !== this.isOnline.value
    this.isOnline.value = online
    if (notify && changed) this.notifyListeners(online ? 'online' : 'offline')
    if (notify) this.notifyListeners('connectionchange', this.getNetworkInfo())
  }

  handleConnectionChange = () => {
    this.updateNetworkInfo()
    this.notifyListeners('connectionchange', this.getNetworkInfo())
  }

  updateNetworkInfo() {
    const conn = typeof navigator !== 'undefined' ? navigator.connection : null
    if (conn) {
      this.networkType.value = conn.type || 'unknown'
      this.effectiveType.value = conn.effectiveType || 'unknown'
      this.downlink.value = conn.downlink || 0
      this.rtt.value = conn.rtt || 0
    }
  }

  getNetworkInfo() {
    return {
      isOnline: this.isOnline.value,
      networkType: this.networkType.value,
      effectiveType: this.effectiveType.value,
      downlink: this.downlink.value,
      rtt: this.rtt.value
    }
  }

  addListener(callback) {
    this.listeners.add(callback)
  }

  removeListener(callback) {
    this.listeners.delete(callback)
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => callback(event, data))
  }

  isSlowNetwork() {
    // H5 用 connection.effectiveType；App 只有 uni 的 networkType（2g/3g/4g/wifi）
    const effectiveType = this.effectiveType.value !== 'unknown' ? this.effectiveType.value : this.networkType.value
    return effectiveType === '2g' || effectiveType === 'slow-2g'
  }
}

export const networkStatus = new NetworkStatus()

export default networkStatus