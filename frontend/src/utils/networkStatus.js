import { ref, onMounted, onUnmounted } from 'vue'

class NetworkStatus {
  constructor() {
    this.isOnline = ref(navigator.onLine)
    this.networkType = ref('unknown')
    this.effectiveType = ref('unknown')
    this.downlink = ref(0)
    this.rtt = ref(0)
    this.listeners = new Set()
  }

  init() {
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)

    if (navigator.connection) {
      navigator.connection.addEventListener('change', this.handleConnectionChange)
      this.updateNetworkInfo()
    }
  }

  destroy() {
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

  handleConnectionChange = () => {
    this.updateNetworkInfo()
    this.notifyListeners('connectionchange', this.getNetworkInfo())
  }

  updateNetworkInfo() {
    const conn = navigator.connection
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
    return this.effectiveType.value === '2g' || this.effectiveType.value === 'slow-2g'
  }
}

export const networkStatus = new NetworkStatus()

export function useNetworkStatus() {
  onMounted(() => {
    networkStatus.init()
  })

  onUnmounted(() => {
    networkStatus.destroy()
  })

  return {
    isOnline: networkStatus.isOnline,
    networkType: networkStatus.networkType,
    effectiveType: networkStatus.effectiveType,
    downlink: networkStatus.downlink,
    rtt: networkStatus.rtt,
    getNetworkInfo: networkStatus.getNetworkInfo.bind(networkStatus),
    addListener: networkStatus.addListener.bind(networkStatus),
    removeListener: networkStatus.removeListener.bind(networkStatus),
    isSlowNetwork: networkStatus.isSlowNetwork.bind(networkStatus)
  }
}

export default networkStatus