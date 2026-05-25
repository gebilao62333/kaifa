const PREFIX = 'pinia-'

export function createPersistedState(options = {}) {
  const {
    key = 'persisted',
    storage = localStorage,
    paths = null
  } = options

  return ({ store }) => {
    const storedState = storage.getItem(`${PREFIX}${key}`)

    if (storedState) {
      try {
        store.$patch(JSON.parse(storedState))
      } catch (e) {
        console.warn(`Failed to restore persisted state for "${key}":`, e)
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
        storage.setItem(`${PREFIX}${key}`, JSON.stringify(stateToPersist))
      } catch (e) {
        console.warn(`Failed to persist state for "${key}":`, e)
      }
    }, { detached: true })
  }
}

export default createPersistedState
