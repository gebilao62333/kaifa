import { nextTick } from 'vue'
import { STORAGE_KEYS } from '../common/constants'

const PREFIX = 'pinia-'

// 登出/清空期间抑制订阅回写，避免刚清空的 key 又被状态订阅重新写入
let persistSuppressed = false

const getByPath = (state, path) => {
  return path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), state)
}

const setByPath = (target, path, value) => {
  const keys = path.split('.')
  let node = target
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (node[key] == null || typeof node[key] !== 'object') {
      node[key] = {}
    }
    node = node[key]
  }
  node[keys[keys.length - 1]] = value
}

// paths 兼容三种写法：
// - null：不过滤（向后兼容旧调用）
// - string[]：所有 store 共用同一白名单
// - { [storeId]: string[] } / (storeId) => string[]：按 store 指定白名单
const resolvePaths = (paths, storeId) => {
  if (!paths) return null
  if (Array.isArray(paths)) return paths
  if (typeof paths === 'function') return paths(storeId)
  if (typeof paths === 'object') return paths[storeId] || []
  return null
}

// 按字段白名单抽取需要持久化的状态，并还原为嵌套结构，供 $patch 深合并恢复
const buildPersistedState = (state, paths) => {
  if (!paths) return state
  return paths.reduce((acc, path) => {
    const value = getByPath(state, path)
    if (value !== undefined) {
      setByPath(acc, path, value)
    }
    return acc
  }, {})
}

// 清空持久化插件写入的所有 key（含 legacy 基准 key 与各 store 的独立 key）
export function clearPersistedState(storage = localStorage) {
  persistSuppressed = true
  try {
    const keys = []
    for (let i = 0; i < storage.length; i++) {
      keys.push(storage.key(i))
    }
    keys.forEach((key) => {
      if (key && (key === STORAGE_KEYS.PINIA_STATE || key.startsWith(STORAGE_KEYS.PINIA_STORE_PREFIX))) {
        storage.removeItem(key)
      }
    })
  } catch (e) {
    // storage 不可用（隐私模式等）时忽略，避免登出流程被中断
  }
  // 等本轮状态订阅（watcher）回调执行完再恢复写入
  nextTick(() => {
    persistSuppressed = false
  })
}

export function createPersistedState(options = {}) {
  const {
    key = 'persisted',
    storage = localStorage,
    paths = null
  } = options

  return ({ store }) => {
    // 每个 store 使用独立 key，避免多个 store 共享同一 key 互相覆盖、产生脏数据
    const storeKey = `${PREFIX}${key}-${store.$id}`
    const legacyKey = `${PREFIX}${key}`
    const storePaths = resolvePaths(paths, store.$id)

    // 清理旧版共享 key 的脏数据（数据已不再读取，只做一次清除）
    try {
      if (storage.getItem(legacyKey) !== null) {
        storage.removeItem(legacyKey)
      }
    } catch (e) {
      // ignore
    }

    const storedState = storage.getItem(storeKey)

    if (storedState) {
      try {
        store.$patch(JSON.parse(storedState))
      } catch (e) {
        console.warn(`Failed to restore persisted state for "${storeKey}":`, e)
        // 恢复失败说明数据损坏，清除以免每次启动都报错
        try { storage.removeItem(storeKey) } catch (e2) { /* ignore */ }
      }
    }

    store.$subscribe((mutation, state) => {
      if (persistSuppressed) return
      try {
        const stateToPersist = buildPersistedState(state, storePaths)
        storage.setItem(storeKey, JSON.stringify(stateToPersist))
      } catch (e) {
        console.warn(`Failed to persist state for "${storeKey}":`, e)
      }
    }, { detached: true })
  }
}

export default createPersistedState
