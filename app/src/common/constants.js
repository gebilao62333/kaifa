export const TIMERS = {
  BANNER_AUTO_PLAY: 3000,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 300,
  TOAST_DURATION: 2000,
  MODAL_CLOSE_DELAY: 300,
  HEARTBEAT_INTERVAL: 30000,
  RECONNECT_DELAY: 1000,
  MAX_RECONNECT_DELAY: 5000
}

export const STORAGE_KEYS = {
  TOKEN: 'token',
  // 审计 B-6：refresh token 供 common.js 401 静默续期消费（登录响应落盘、登出/失效时清理）
  REFRESH_TOKEN: 'refreshToken',
  // 持久化插件的基准 key；插件会为每个 store 生成 `pinia-app-state-<storeId>`
  PINIA_STATE: 'pinia-app-state',
  PINIA_STORE_PREFIX: 'pinia-app-state-',
  // 历史遗留的本地用户信息 key（部分旧页面读写），登出时需要一并清理
  LEGACY_USER_INFO: 'userInfo'
}

// 默认头像 SVG Data URI，防止空 src 导致浏览器加载当前页为图片
export const DEFAULT_AVATAR = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
  '<rect fill="#e8e8e8" width="100" height="100" rx="12"/>' +
  '<circle fill="#c0c0c0" cx="50" cy="38" r="18"/>' +
  '<ellipse fill="#c0c0c0" cx="50" cy="80" rx="28" ry="22"/>' +
  '</svg>'
)

// 无需登录即可访问的路由名称列表（显式 meta.requiresAuth 的路由不受此表影响）
export const PUBLIC_ROUTE_NAMES = ['Login', 'Home', 'Search', 'Square', 'PostDetail', 'Preferred', 'Mine', 'Friend', 'NotFound']

// 无需登录即可访问的路由路径前缀（精确匹配或按 '/' 分段匹配）
export const PUBLIC_ROUTE_PATHS = ['/', '/login', '/home', '/search', '/square', '/friend']

// 公开路径匹配：精确相等或按 '/' 分段边界匹配，
// 避免 '/loginXXX' 这类路径被误判为公开路径（裸 '/' 仅精确匹配根路径）
export const isPublicPath = (path) => {
  if (!path || typeof path !== 'string') return false
  return PUBLIC_ROUTE_PATHS.some((prefix) => {
    if (prefix === '/') return path === '/'
    return path === prefix || path.startsWith(prefix + '/')
  })
}
