// 主 Tab 页状态缓存：Home / Square / Preferred / Mine 之间切换由 route.js 统一走 uni.reLaunch
// （见 app/src/common/route.js 的 MAIN_TABS + navigate()），页面会被销毁重建，
// 旧站 SPA 切 Tab 时保留的滚动位置、列表数据、筛选条件会全部丢失。
// 这里用「进程内快照 + 一次性恢复」补偿：页面 onHide 存快照，重新挂载时取回；
// 30s 内视为新鲜直接渲染（不发请求、不闪骨架），超过 30s 恢复列表后仍静默刷新一次。
//
// App-vue 每个页面是独立 WebView/JS 上下文，模块级 Map 不跨页共享，只写内存时
// Tab 切换后读不到快照。因此 save 同时写内存 + uni.storage，take 时内存优先、
// 未命中再回落 storage；storage 读写全部 try/catch，异常时静默降级为内存模式。
// 落盘生命周期只覆盖「本次应用会话」：App.vue onLaunch 会 clearAllTabState()，
// 冷启动/页面刷新后回到「首次进入」的现有行为，不会恢复上次会话的陈旧页面状态。
// 快照含列表内容，超长快照（>MAX_STORAGE_CHARS）只保留在内存，不写 storage。

// 快照新鲜度窗口：超过该时长恢复后仍触发一次静默刷新，避免「恢复了又被旧数据锁住」
export const TAB_STATE_FRESH_MS = 30 * 1000

// path -> { path, snapshot, savedAt, ownerId }；scrollTops 单独存，页面滚动是高频写入
const states = new Map()
const scrollTops = new Map()
let currentOwner = null

const normalizeOwner = (ownerId) => (ownerId === undefined || ownerId === null ? '' : String(ownerId))

// ===== uni.storage 落盘层 =====
// 只在本模块自己的 key 前缀下读写，避免误碰 pinia 持久化/业务缓存；
// 所有异常都在这里吞掉并返回「未命中/未写入」，调用方继续走内存与原首载逻辑。
const SNAPSHOT_STORAGE_PREFIX = '__kaifa_tab_state__:'
const SCROLL_STORAGE_PREFIX = '__kaifa_tab_scroll__:'
// 快照是列表内容（动态/消息摘要），超过该长度不落盘，防止撑爆 H5 localStorage 配额；
// 内存仍保留，H5 同会话切 Tab 不受影响，App 跨页面则退化为无缓存（走原有首载）。
const MAX_STORAGE_CHARS = 256 * 1024

const canUseUniStorage = () => {
  try {
    return typeof uni !== 'undefined' && !!uni &&
      typeof uni.setStorageSync === 'function' &&
      typeof uni.getStorageSync === 'function'
  } catch (e) {
    return false
  }
}

const readStorage = (key) => {
  if (!canUseUniStorage()) return null
  try {
    const raw = uni.getStorageSync(key)
    if (raw === undefined || raw === null || raw === '') return null
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (e) {
    return null
  }
}

const writeStorage = (key, value) => {
  if (!canUseUniStorage()) return false
  try {
    const raw = JSON.stringify(value)
    if (typeof raw !== 'string' || raw.length > MAX_STORAGE_CHARS) return false
    uni.setStorageSync(key, raw)
    return true
  } catch (e) {
    return false
  }
}

const removeStorage = (key) => {
  if (!canUseUniStorage() || typeof uni.removeStorageSync !== 'function') return false
  try {
    uni.removeStorageSync(key)
    return true
  } catch (e) {
    return false
  }
}

const listStorageKeys = () => {
  if (!canUseUniStorage() || typeof uni.getStorageInfoSync !== 'function') return []
  try {
    const info = uni.getStorageInfoSync()
    return info && Array.isArray(info.keys) ? info.keys : []
  } catch (e) {
    return []
  }
}

const clearStorageByPrefix = () => {
  let removed = 0
  for (const key of listStorageKeys()) {
    const text = String(key)
    if (text.indexOf(SNAPSHOT_STORAGE_PREFIX) !== 0 && text.indexOf(SCROLL_STORAGE_PREFIX) !== 0) continue
    if (removeStorage(key)) removed++
  }
  return removed
}

// 登录账号切换（含登出）时清空全部 Tab 缓存，避免 A 账号的列表被 B 账号恢复出来。
// 由 4 个主 Tab 页在 onShow 时用当前 userId 调用：登出后 userId 变成空串，与旧值
// 不同即触发清空（内存 + storage 一起清）。App.vue onLaunch 也调用 clearAllTabState()
// 做冷启动隔离；没有在 store/logout 里直接挂钩，是因为 store/user-info.js 不在本次改动范围。
// 返回是否发生了清空，便于自测断言。
export function setTabStateOwner(ownerId) {
  const owner = normalizeOwner(ownerId)
  if (currentOwner === null) {
    currentOwner = owner
    return false
  }
  if (currentOwner === owner) return false
  currentOwner = owner
  // 账号切换要同时清内存与落盘，否则下一个账号会从 storage 恢复出上一个账号的列表
  clearAllTabState()
  return true
}

// 保存某个 Tab 页的快照（onHide/onUnload 调用）。快照是普通对象，列表按引用存，
// 页面销毁后由缓存持有，避免切页时深拷贝大列表。
export function saveTabState(path, snapshot) {
  if (!path) return false
  const entry = {
    path,
    snapshot: snapshot || {},
    savedAt: Date.now(),
    ownerId: currentOwner === null ? '' : currentOwner
  }
  // 内存保证 H5 同会话可用；storage 让 App 端跨 WebView（新 JS 上下文）也能读回。
  // storage 写失败（配额/序列化/平台限制）只影响 App 跨页恢复，不影响页面本身。
  states.set(path, entry)
  writeStorage(SNAPSHOT_STORAGE_PREFIX + path, entry)
  return true
}

// 一次性读取：取走即删除，避免同一份快照被恢复两次；账号不匹配时丢弃并返回 null。
export function takeTabState(path, ownerId) {
  if (!path) return null
  const memoryEntry = states.get(path)
  if (memoryEntry) states.delete(path)
  // 一次性语义：命中内存或 storage 后都删掉两侧快照，避免同一份被恢复两次
  const rawEntry = memoryEntry || readStorage(SNAPSHOT_STORAGE_PREFIX + path)
  removeStorage(SNAPSHOT_STORAGE_PREFIX + path)
  if (!rawEntry || !rawEntry.snapshot) return null
  const entry = {
    path,
    snapshot: rawEntry.snapshot,
    savedAt: Number(rawEntry.savedAt) || 0,
    ownerId: normalizeOwner(rawEntry.ownerId)
  }
  if (normalizeOwner(ownerId) !== entry.ownerId) {
    scrollTops.delete(path)
    removeStorage(SCROLL_STORAGE_PREFIX + path)
    return null
  }
  // 跨 WebView 时滚动位置只在 storage 里：搬回内存后再删 storage 侧
  if (!scrollTops.has(path)) {
    const storedTop = Number(readStorage(SCROLL_STORAGE_PREFIX + path))
    if (Number.isFinite(storedTop) && storedTop >= 0) scrollTops.set(path, storedTop)
  }
  removeStorage(SCROLL_STORAGE_PREFIX + path)
  return entry
}

// 只读查看（不消费），用于诊断与自测；内存优先，未命中回落 storage
export function getTabState(path) {
  const memory = states.get(path)
  if (memory) return memory
  const stored = readStorage(SNAPSHOT_STORAGE_PREFIX + path)
  if (!stored || !stored.snapshot) return null
  return {
    path,
    snapshot: stored.snapshot,
    savedAt: Number(stored.savedAt) || 0,
    ownerId: normalizeOwner(stored.ownerId)
  }
}

export function clearTabState(path) {
  if (!path) return false
  scrollTops.delete(path)
  const memoryDeleted = states.delete(path)
  const storageRemoved = removeStorage(SNAPSHOT_STORAGE_PREFIX + path)
  removeStorage(SCROLL_STORAGE_PREFIX + path)
  return memoryDeleted || storageRemoved
}

// 清空全部：内存 + storage（只清本模块前缀下的 key）。
// App.vue onLaunch 调用它做冷启动隔离；setTabStateOwner 在账号切换时也复用它。
export function clearAllTabState() {
  const size = states.size
  states.clear()
  scrollTops.clear()
  clearStorageByPrefix()
  return size
}

export function saveScrollTop(path, scrollTop) {
  if (!path) return false
  const top = Number(scrollTop)
  if (!Number.isFinite(top) || top < 0) return false
  scrollTops.set(path, top)
  writeStorage(SCROLL_STORAGE_PREFIX + path, top)
  return true
}

export function readScrollTop(path) {
  if (!path) return 0
  const top = scrollTops.get(path)
  if (Number.isFinite(top)) return top
  const stored = Number(readStorage(SCROLL_STORAGE_PREFIX + path))
  return Number.isFinite(stored) && stored >= 0 ? stored : 0
}

export function isTabStateFresh(savedAt, now = Date.now(), freshMs = TAB_STATE_FRESH_MS) {
  const at = Number(savedAt) || 0
  if (!at) return false
  return Math.max(0, now - at) <= freshMs
}

// 三态恢复决策（页面在 setup 顶部调用一次）：
//   无缓存        → { hit: false }                     → 走页面原有首载逻辑
//   有缓存且新鲜  → { hit: true, needRefresh: false }  → 直接渲染缓存，不发请求
//   有缓存但过期  → { hit: true, needRefresh: true }   → 先渲染缓存，再静默刷新一次
export function resolveTabState(path, ownerId, now = Date.now(), freshMs = TAB_STATE_FRESH_MS) {
  const entry = takeTabState(path, ownerId)
  if (!entry) return { hit: false, snapshot: null, savedAt: 0, needRefresh: false }
  return {
    hit: true,
    snapshot: entry.snapshot,
    savedAt: entry.savedAt,
    needRefresh: !isTabStateFresh(entry.savedAt, now, freshMs)
  }
}

// 恢复编排：命中则执行各页面传入的 apply(快照)，返回是否恢复成功、是否需要静默刷新。
// apply 抛错按未恢复处理（不阻塞页面首载），快照已消费，下次 onHide 会重新写入。
export function restoreTabState(path, ownerId, apply) {
  const result = resolveTabState(path, ownerId)
  if (!result.hit || typeof apply !== 'function') return { restored: false, needRefresh: false }
  try {
    apply(result.snapshot)
  } catch (e) {
    return { restored: false, needRefresh: false }
  }
  return { restored: true, needRefresh: result.needRefresh }
}

// 滚动位置恢复：此时列表已由 refs 同步渲染，先滚一次，再各延后 120/240ms 重试一次
// （图片/长列表撑开高度后第一次可能被 clamp，最多重试两次）。H5/App 都用 uni.pageScrollTo，
// 能力不存在时直接跳过，避免 webview 环境抛错。
export function restoreScrollTop(scrollTop, retries = 2) {
  const top = Number(scrollTop)
  if (!Number.isFinite(top) || top <= 0) return false
  if (typeof uni === 'undefined' || !uni || typeof uni.pageScrollTo !== 'function') return false
  const scroll = () => {
    try {
      uni.pageScrollTo({ scrollTop: top, duration: 0 })
    } catch (e) { /* 页面已卸载或 H5 无滚动容器时忽略 */ }
  }
  scroll()
  const times = Math.max(0, Number(retries) || 0)
  for (let i = 0; i < times; i++) setTimeout(scroll, 120 * (i + 1))
  return true
}

// 仅供自测/诊断：当前缓存的 Tab 数量
export function getTabStateSize() {
  return states.size
}
