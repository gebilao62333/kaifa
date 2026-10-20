// 统一存储适配器：uni.storage 与 localStorage 双写，读取优先 uni.storage、再回落 localStorage。
// 背景：App 端页面跑在 WebView 里，localStorage 与 uni.storage 是两套存储；历史代码只写
// localStorage，导致 App 冷启动 / 原生插件侧（socketService、uploadService）读不到 token，
// pinia 持久化状态也会在「WebView 重启」后丢失。这里统一出入口，H5 与 App 都可用。
// 所有操作都 try/catch：任一侧不可用（隐私模式、SSR、WebView 限制）都不向调用方抛错。

const hasUniStorage = () => {
  try {
    return typeof uni !== 'undefined' && !!uni && typeof uni.getStorageSync === 'function'
  } catch (e) {
    return false
  }
}

const getLocalStorage = () => {
  try {
    if (typeof localStorage !== 'undefined' && localStorage) return localStorage
  } catch (e) {}
  return null
}

// uni 在 H5 上读不到 key 时返回空字符串，与 localStorage 的 null 语义不同，统一按「未命中」处理
const isMissing = (value) => value === undefined || value === null || value === ''

// uni.storage 的 key 列表（App 端只能通过 getStorageInfoSync 枚举，H5 端底层也是 localStorage）
const uniKeys = () => {
  if (!hasUniStorage() || typeof uni.getStorageInfoSync !== 'function') return []
  try {
    const info = uni.getStorageInfoSync()
    return info && Array.isArray(info.keys) ? info.keys : []
  } catch (e) {
    return []
  }
}

const localKeys = () => {
  const local = getLocalStorage()
  if (!local) return []
  try {
    const result = []
    const total = Number(local.length) || 0
    for (let i = 0; i < total; i++) {
      const key = local.key(i)
      if (key) result.push(key)
    }
    return result
  } catch (e) {
    return []
  }
}

export const getItem = (key) => {
  if (!key) return null
  if (hasUniStorage()) {
    try {
      const value = uni.getStorageSync(key)
      if (!isMissing(value)) return value
    } catch (e) {}
  }
  const local = getLocalStorage()
  if (!local) return null
  try {
    const value = local.getItem(key)
    return value === null ? null : value
  } catch (e) {
    return null
  }
}

export const setItem = (key, value) => {
  if (!key) return false
  let written = false
  if (hasUniStorage() && typeof uni.setStorageSync === 'function') {
    try { uni.setStorageSync(key, value); written = true } catch (e) {}
  }
  const local = getLocalStorage()
  if (local) {
    try { local.setItem(key, value); written = true } catch (e) {}
  }
  return written
}

export const removeItem = (key) => {
  if (!key) return false
  let removed = false
  if (hasUniStorage() && typeof uni.removeStorageSync === 'function') {
    try { uni.removeStorageSync(key); removed = true } catch (e) {}
  }
  const local = getLocalStorage()
  if (local) {
    try { local.removeItem(key); removed = true } catch (e) {}
  }
  return removed
}

// 两侧 key 取并集并去重：uni 原生存储与 WebView localStorage 可能各自残留不同 key
export const keys = () => {
  const result = []
  const seen = {}
  const push = (key) => {
    if (!key || seen[key]) return
    seen[key] = true
    result.push(key)
  }
  uniKeys().forEach(push)
  localKeys().forEach(push)
  return result
}

export const key = (index) => {
  const all = keys()
  const i = Number(index)
  if (!Number.isInteger(i) || i < 0 || i >= all.length) return null
  return all[i]
}

// 按前缀批量删除（pinia 持久化 key 清理用），返回删除条数
export const clearByPrefix = (prefix) => {
  const safePrefix = prefix === undefined || prefix === null ? '' : String(prefix)
  const targets = keys().filter((k) => (safePrefix ? k.indexOf(safePrefix) === 0 : true))
  targets.forEach((k) => { removeItem(k) })
  return targets.length
}

export const storage = {
  getItem,
  setItem,
  removeItem,
  keys,
  key,
  // 兼容 Web Storage / persistedState storage 接口要求的数字 length 属性
  get length() {
    return keys().length
  },
  clearByPrefix
}

export default storage
