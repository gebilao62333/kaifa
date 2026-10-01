const PREFIX = 'pinia-'

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
      try {
        const stateToPersist = paths
          ? paths.reduce((acc, path) => {
              const keys = path.split('.')
              let value = state
              for (const k of keys) {
                value = value?.[k]
              }
              if (value !== undefined) {
                acc[path] = value
              }
              return acc
            }, {})
          : state
        storage.setItem(storeKey, JSON.stringify(stateToPersist))
      } catch (e) {
        console.warn(`Failed to persist state for "${storeKey}":`, e)
      }
    }, { detached: true })
  }
}

export default createPersistedState
