// 后端 C 端 DTO 的时间戳单位并不统一：
// - 事务型接口（订单/预约/报表/钱包/记录中心）部分返回秒级（10 位）
// - 少数接口返回毫秒级（13 位）或 ISO 字符串
// 页面各自 new Date(x) 会把秒当毫秒解析成 1970 年。这里统一收口：
// 输入秒/毫秒/ISO/Date，输出毫秒；再提供相对时间与常用格式。

export const toMs = (value) => {
  if (value === null || value === undefined || value === '') return 0
  if (value instanceof Date) {
    const t = value.getTime()
    return Number.isFinite(t) && t > 0 ? t : 0
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return 0
    return value < 1e12 ? value * 1000 : value
  }
  const text = String(value).trim()
  if (!text) return 0
  if (/^\d+$/.test(text)) {
    const n = Number(text)
    if (!Number.isFinite(n) || n <= 0) return 0
    return n < 1e12 ? n * 1000 : n
  }
  const parsed = Date.parse(text)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const RELATIVE_DAY = 24 * 60 * 60 * 1000
const pad2 = (n) => String(n).padStart(2, '0')

// 相对时间：刚刚 / N分钟前 / N小时前 / N天前，超出阈值走 fallback。
// fallback: 'locale'（2026/10/21）| 'slash'（10-21）| 'cn'（10月21日）| 'days'（N天前）
export const formatTimeAgo = (value, options = {}) => {
  const ms = toMs(value)
  if (!ms) return ''
  const now = Number.isFinite(options.now) && options.now > 0 ? options.now : Date.now()
  const diff = Math.max(0, now - ms)
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return Math.floor(diff / (60 * 1000)) + '分钟前'
  if (diff < RELATIVE_DAY) return Math.floor(diff / (60 * 60 * 1000)) + '小时前'
  const days = Math.floor(diff / RELATIVE_DAY)
  const fallback = options.fallback || 'locale'
  if (fallback === 'days') return days + '天前'
  const relativeDays = Number.isFinite(options.relativeDays) ? options.relativeDays : 7
  if (days < relativeDays) return days + '天前'
  const date = new Date(ms)
  if (fallback === 'slash') return (date.getMonth() + 1) + '-' + date.getDate()
  if (fallback === 'cn') return (date.getMonth() + 1) + '月' + date.getDate() + '日'
  return date.toLocaleDateString()
}

export const formatDateTime = (value) => {
  const ms = toMs(value)
  if (!ms) return ''
  const date = new Date(ms)
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate()) +
    ' ' + pad2(date.getHours()) + ':' + pad2(date.getMinutes())
}

export const formatClock = (value) => {
  const ms = toMs(value)
  if (!ms) return ''
  const date = new Date(ms)
  return pad2(date.getHours()) + ':' + pad2(date.getMinutes())
}
