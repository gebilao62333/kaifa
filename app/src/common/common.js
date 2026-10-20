import { STORAGE_KEYS } from './constants'
import { goLogin } from './route'
import storage from './storage'

export const getLevelName = (level) => {
  const levelMap = {
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
  return levelMap[level] || '新手'
}

export const formatTime = (timestamp, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export const formatBalance = (balance) => {
  if (balance === null || balance === undefined) return '0.00'
  return Number(balance).toFixed(2)
}

export const getVipName = (level) => {
  if (!level || level < 1 || level > 5) return ''
  return `VIP${level}`
}

export const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return String(num)
}

export const debounce = (fn, delay) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

export const throttle = (fn, delay) => {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

export const getOrderStatusText = (status) => {
  const map = {
    0: '待接单',
    1: '已接单',
    2: '进行中',
    3: '已完成',
    4: '已取消',
    5: '申诉中'
  }
  return map[status] || '未知'
}

export const getReserveStatusText = (status) => {
  const map = {
    0: '待确认',
    1: '已确认',
    2: '已拒绝',
    3: '已完成',
    4: '已取消'
  }
  return map[status] || '未知'
}

export const getCallStatusText = (status) => {
  const map = {
    0: '呼叫中',
    1: '已接通',
    2: '已拒绝',
    3: '已取消',
    4: '已结束',
    5: '无应答',
    6: '异常'
  }
  return map[status] || '未知'
}

export const getAuditStatusText = (status) => {
  const map = {
    0: '未认证',
    1: '审核中',
    2: '已认证',
    3: '已拒绝'
  }
  return map[status] || '未知'
}

export const validateMobile = (mobile) => {
  const reg = /^1[3-9]\d{9}$/
  return reg.test(mobile)
}

export const validateEmail = (email) => {
  const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return reg.test(email)
}

export const validatePassword = (password) => {
  return !!(password && password.length >= 6 && password.length <= 32)
}

export const validateNickname = (nickname) => {
  return !!(nickname && nickname.length >= 2 && nickname.length <= 20)
}

export const validateRequired = (value, fieldName) => {
  if (!value && value !== 0 && value !== false) {
    throw new Error(`${fieldName}不能为空`)
  }
  return true
}

export const validateNumber = (value, fieldName, min, max) => {
  const num = Number(value)
  if (isNaN(num)) {
    throw new Error(`${fieldName}必须是数字`)
  }
  if (min !== undefined && num < min) {
    throw new Error(`${fieldName}不能小于${min}`)
  }
  if (max !== undefined && num > max) {
    throw new Error(`${fieldName}不能大于${max}`)
  }
  return true
}

export const validateStringLength = (value, fieldName, min, max) => {
  if (!value) return true
  const len = value.length
  if (min !== undefined && len < min) {
    throw new Error(`${fieldName}长度不能小于${min}`)
  }
  if (max !== undefined && len > max) {
    throw new Error(`${fieldName}长度不能大于${max}`)
  }
  return true
}

export const validateParams = (params, rules) => {
  const errors = []
  for (const [key, rule] of Object.entries(rules)) {
    const value = params[key]
    try {
      if (rule.required) {
        validateRequired(value, rule.label || key)
      }
      if (value && rule.type === 'number') {
        validateNumber(value, rule.label || key, rule.min, rule.max)
      }
      if (value && rule.type === 'string') {
        validateStringLength(value, rule.label || key, rule.minLength, rule.maxLength)
      }
      if (value && rule.pattern) {
        if (!rule.pattern.test(value)) {
          throw new Error(`${rule.label || key}格式不正确`)
        }
      }
      if (value && rule.validator) {
        rule.validator(value, key)
      }
    } catch (error) {
      errors.push(error.message)
    }
  }
  if (errors.length > 0) {
    throw new Error(errors.join('; '))
  }
  return true
}

const DEFAULT_TIMEOUT = 15000

let isRedirecting = false

export class RequestError extends Error {
  constructor(message, code = -1, status = 0, fieldErrors = {}, retryAfterSec = 0) {
    super(message)
    this.name = 'RequestError'
    this.code = code
    this.status = status
    this.fieldErrors = fieldErrors
    // C-7：429 的剩余可重试秒数（响应体 data.retryAfterSec 或 Retry-After/RateLimit-Reset 头）
    this.retryAfterSec = Number(retryAfterSec) || 0
  }
}

// C-7：解析 429 冷却时间（uni.request 的响应用 statusCode/header/body 字符串）
export const parseRetryAfterSec = (response, body) => {
  let seconds = 0
  const fromBody = body && body.data && Number(body.data.retryAfterSec)
  if (Number.isFinite(fromBody) && fromBody > 0) seconds = fromBody

  const header = (response && response.header) || {}
  const headerValue = (name) => {
    if (!header) return ''
    const hit = Object.keys(header).find((key) => key.toLowerCase() === name.toLowerCase())
    return hit ? header[hit] : ''
  }

  if (!seconds) {
    const retryAfter = headerValue('Retry-After')
    if (retryAfter) {
      const asNumber = Number(retryAfter)
      if (Number.isFinite(asNumber)) {
        seconds = asNumber
      } else {
        const at = Date.parse(retryAfter)
        if (Number.isFinite(at)) seconds = Math.ceil((at - Date.now()) / 1000)
      }
    }
    if (!seconds) {
      const reset = Number(headerValue('RateLimit-Reset'))
      if (Number.isFinite(reset) && reset > 0) seconds = reset
    }
  }

  if (!Number.isFinite(seconds) || seconds <= 0) return 0
  return Math.min(Math.floor(seconds), 3600)
}

export const isLoggedIn = () => {
  // 统一走存储适配器：App 端 token 在 uni.storage 里，localStorage 可能是空的
  return !!storage.getItem(STORAGE_KEYS.TOKEN)
}

// 读取浏览器 Cookie（用于 CSRF 预留能力）
export const getCookie = (name) => {
  if (typeof document === 'undefined' || !document.cookie) return ''
  const safeName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + safeName + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : ''
}

// CSRF 预留（F-11）：后端 middlewares/security.js 已实现 csrfProtection，
// 通过非 httpOnly 的 XSRF-TOKEN Cookie 下发 token，并校验 X-XSRF-TOKEN 请求头或 _csrf 参数。
// 当前后端未挂载该中间件，这里只做“存在即附带”的预留，不发明新字段、不改变未启用时的行为。
const CSRF_COOKIE_NAME = 'XSRF-TOKEN'
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN'

// 强制以 UTF-8 解码响应体，防止后端 Content-Type 缺失 charset 导致中文乱码
const readResponseText = async (response) => {
  const buf = await response.arrayBuffer()
  const decoder = new TextDecoder('utf-8')
  return decoder.decode(buf)
}

export const checkLoginStatus = (requireLogin = false) => {
  if (requireLogin && !isLoggedIn()) {
    throw new RequestError('请先登录', -2, 401)
  }
  return isLoggedIn()
}

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || ''

const resolveRequestUrl = (url) => {
  if (/^https?:\/\//i.test(url)) return url
  if (API_ORIGIN) return API_ORIGIN.replace(/\/$/, '') + (url.indexOf('/') === 0 ? url : '/' + url)
  return url
}

const uniRequest = (options) => new Promise((resolve, reject) => {
  uni.request(Object.assign({}, options, { success: resolve, fail: reject }))
})

const parseBody = (body) => {
  if (body === undefined || body === null || body === '') return null
  if (typeof body === 'object') return body
  try { return JSON.parse(body) } catch (e) { return null }
}

// 审计 B-6：C 端静默续期（uni.request 版）。登录/注册/找回/发码类接口不参与续期。
const REFRESH_EXEMPT_PATHS = ['/api/user/login', '/api/user/register', '/api/user/reset-password', '/api/user/send-sms', '/api/user/login-mobile', '/api/user/login-third', '/api/user/refresh-token']
let refreshPromise = null

const shouldSkipRefresh = (url) => REFRESH_EXEMPT_PATHS.some((p) => String(url).includes(p))

const tryRefreshToken = async () => {
  const refreshToken = storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  if (!refreshToken) return false
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await uniRequest({
          url: resolveRequestUrl('/api/user/refresh-token'),
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          timeout: DEFAULT_TIMEOUT,
          dataType: 'text',
          data: JSON.stringify({ refreshToken })
        })
        if (!response || response.statusCode !== 200) return false
        const json = parseBody(typeof response.data === 'string' ? response.data : '')
        const payload = (json && json.data) || {}
        const nextToken = payload.accessToken || payload.token || ''
        if (!nextToken) return false
        // 续期结果同时写 uni.storage 与 localStorage，避免 App 端只更新一侧后仍带着旧 token
        storage.setItem(STORAGE_KEYS.TOKEN, nextToken)
        if (payload.refreshToken) storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, payload.refreshToken)
        return true
      } catch (e) {
        return false
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

const doRequest = async (url, method = 'GET', data = {}, headers = {}, timeout = DEFAULT_TIMEOUT, options = {}, attempt = 0) => {
  const { requireLogin = false, silentAbort = true } = options

  if (requireLogin && !isLoggedIn()) {
    goLogin()
    throw new RequestError('请先登录', -2, 401)
  }

  const header = Object.assign({ 'Content-Type': 'application/json' }, headers)
  const token = storage.getItem(STORAGE_KEYS.TOKEN)
  if (token) header['Authorization'] = 'Bearer ' + token

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    const csrfToken = getCookie(CSRF_COOKIE_NAME)
    if (csrfToken) header[CSRF_HEADER_NAME] = csrfToken
  }

  const requestOptions = {
    url: resolveRequestUrl(url),
    method: method.toUpperCase(),
    header,
    timeout,
    dataType: 'text'
  }

  if (requestOptions.method === 'GET' || requestOptions.method === 'HEAD') {
    requestOptions.data = data
  } else {
    requestOptions.data = typeof data === 'string' ? data : JSON.stringify(data)
  }

  try {
    const response = await uniRequest(requestOptions)
    const status = response.statusCode
    const bodyText = typeof response.data === 'string' ? response.data : ''

    if (status === 401) {
      // 审计 B-6：先静默续期并重放一次，失败再走清态跳登录
      if (!options.skipAuthRefresh && !options.authRetried && !shouldSkipRefresh(url)) {
        const refreshed = await tryRefreshToken()
        if (refreshed) {
          return doRequest(url, method, data, headers, timeout, { ...options, authRetried: true }, attempt)
        }
      }
      if (requireLogin && !isRedirecting) {
        isRedirecting = true
        storage.removeItem(STORAGE_KEYS.TOKEN)
        storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
        storage.removeItem(STORAGE_KEYS.PINIA_STATE)
        setTimeout(() => { goLogin() }, 100)
      }
      throw new RequestError('登录失效，请重新登录', -1, 401)
    }

    if (status === 500) {
      let errorMessage = '服务器繁忙，请稍后重试'
      const result = parseBody(bodyText)
      if (result && result.message) errorMessage = result.message
      throw new RequestError(errorMessage, -1, 500)
    }

    if (status === 404) throw new RequestError('请求的资源不存在', -1, 404)

    if (status === 422) {
      const result = parseBody(bodyText) || {}
      throw new RequestError(result.message || '请求参数验证失败', -1, 422, result.errors || {})
    }

    if (status < 200 || status >= 300) {
      const result = parseBody(bodyText)
      let errorMessage = (result && result.message) || ('请求失败 (' + status + ')')
      // C-7：429 透出冷却时间
      const retryAfterSec = status === 429 ? parseRetryAfterSec(response, result) : 0
      if (retryAfterSec > 0) errorMessage = errorMessage + '（' + retryAfterSec + ' 秒后可重试）'
      throw new RequestError(errorMessage, -1, status, {}, retryAfterSec)
    }

    if (!bodyText) return { code: 200, data: null, message: 'success' }

    const result = parseBody(bodyText)
    if (!result || typeof result !== 'object') return { code: 200, data: null, message: 'success' }

    // P0（2026-10-20 用户端完整度审计）：后端 created() 写接口返回 HTTP 201 + 业务 code 201
    // （注册/发动态/评论/举报/发布需求/创建预约等）。2xx 一律视为成功，并归一为业务 code 200，
    // 避免各页面按 code===200 判断成功时把 201 当失败（此前表现：数据已落库但界面弹失败）。
    // httpStatus 保留原始 HTTP 状态，便于排障与埋点。
    const isSuccessCode = result.code === 0 || result.code === 200 || result.code === 201
    if (!isSuccessCode) {
      throw new RequestError(result.message || '请求失败', result.code, status)
    }
    return result.code === 201 ? { ...result, code: 200, httpStatus: status } : result
  } catch (error) {
    if (error instanceof RequestError) throw error
    const msg = (error && (error.errMsg || error.message)) || ''
    if (/timeout|abort/i.test(msg)) {
      if (silentAbort) {
        if (import.meta.env.DEV) console.debug('请求已中止（可能是页面跳转导致）:', url)
        return null
      }
      throw new RequestError('请求超时，请检查网络连接', -1, 0)
    }
    throw new RequestError('网络连接失败，请检查网络', -1, 0)
  }
}

// 进行中的写请求表：相同 method+url+body 的请求在完成前复用同一个 Promise，
// 防止双击/重复点击导致的重复提交。GET/HEAD 属于正常并发场景，不去重。
const inflightRequests = new Map()

const buildRequestKey = (url, method, data) => `${method} ${url} ${JSON.stringify(data ?? {})}`

// 对外导出：默认从 attempt=0 发起请求，401 时由内部 doRequest 自动重试一次（dev 模式）
export const request = (url, method = 'GET', data = {}, headers = {}, timeout = DEFAULT_TIMEOUT, options = {}) => {
  const upperMethod = (method || 'GET').toUpperCase()

  // 并发 GET 是正常场景，不去重
  if (upperMethod === 'GET' || upperMethod === 'HEAD') {
    return doRequest(url, method, data, headers, timeout, options, 0)
  }

  const key = buildRequestKey(url, upperMethod, data)
  const existing = inflightRequests.get(key)
  if (existing) return existing

  const promise = doRequest(url, method, data, headers, timeout, options, 0).finally(() => {
    // 仅当表中仍是本次请求时移除，避免误删期间新发起的同键请求
    if (inflightRequests.get(key) === promise) {
      inflightRequests.delete(key)
    }
  })
  inflightRequests.set(key, promise)
  return promise
}
