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

export const STATUS = {
  MESSAGE: {
    SENDING: 'sending',
    SENT: 'sent',
    FAILED: 'failed',
    READ: 'read',
    RECALLED: 'recalled'
  },
  ORDER: {
    PENDING: 0,
    ACCEPTED: 1,
    IN_PROGRESS: 2,
    COMPLETED: 3,
    CANCELLED: 4,
    APPEALING: 5
  },
  RESERVE: {
    PENDING: 0,
    CONFIRMED: 1,
    REJECTED: 2,
    COMPLETED: 3,
    CANCELLED: 4,
    APPEALING: 5
  },
  CALL: {
    CALLING: 0,
    CONNECTED: 1,
    REJECTED: 2,
    CANCELLED: 3,
    ENDED: 4,
    NO_ANSWER: 5,
    EXCEPTION: 6
  },
  AUDIT: {
    NOT_CERTIFIED: 0,
    PENDING: 1,
    APPROVED: 2,
    REJECTED: 3
  }
}

export const LEVELS = {
  1: '新手',
  2: '普通',
  3: '进阶',
  4: '资深',
  5: '精英',
  6: '大师',
  7: '专家',
  8: '宗师',
  9: '传奇',
  10: '王者'
}

export const VIP_LEVELS = {
  1: 'VIP1',
  2: 'VIP2',
  3: 'VIP3',
  4: 'VIP4',
  5: 'VIP5'
}

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
}

export const STORAGE_KEYS = {
  TOKEN: 'token',
  PINIA_STATE: 'pinia-app-state'
}

export const REGEX = {
  MOBILE: /^1[3-9]\d{9}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ID_CARD: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
}

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  LOCATION: 'location',
  GIFT: 'gift',
  REDPACKET: 'redpacket',
  SYSTEM: 'system'
}

// 默认头像 SVG Data URI，防止空 src 导致浏览器加载当前页为图片
export const DEFAULT_AVATAR = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
  '<rect fill="#e8e8e8" width="100" height="100" rx="12"/>' +
  '<circle fill="#c0c0c0" cx="50" cy="38" r="18"/>' +
  '<ellipse fill="#c0c0c0" cx="50" cy="80" rx="28" ry="22"/>' +
  '</svg>'
)

// 无需登录即可访问的路由名称列表
export const PUBLIC_ROUTE_NAMES = ['Login', 'Home', 'Search', 'Square', 'PostDetail', 'Preferred', 'Mine', 'Friend']

// 无需登录即可访问的路由路径前缀
export const PUBLIC_ROUTE_PATHS = ['/', '/login', '/home', '/search', '/square', '/friend']
