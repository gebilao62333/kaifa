// 管理后台通用工具与请求封装

export const formatTime = (timestamp, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!timestamp) return ''
  const ts = typeof timestamp === 'number' && timestamp < 1e12 ? timestamp * 1000 : timestamp
  const date = new Date(ts)
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

export const formatBalance = (balance) => {
  if (balance === null || balance === undefined) return '0.00'
  return Number(balance).toFixed(2)
}

// 分账比例：后端存 0~1 的小数，管理端以百分比(%)展示与编辑
export const rateToPercent = (rate) => {
  const n = Number(rate)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 1000) / 10
}

export const percentToRate = (percent) => {
  const n = Number(percent)
  if (!Number.isFinite(n)) return 0
  const clamped = Math.min(100, Math.max(0, n))
  return Math.round(clamped * 10) / 1000
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
    // A-4：429/锁定响应派生的「还需等待秒数」，登录页据此做倒计时禁用
    this.retryAfterSec = retryAfterSec
  }
}

export const isLoggedIn = () => {
  return !!localStorage.getItem('admin_token')
}

// 强制以 UTF-8 解码响应体，防止后端 Content-Type 缺失 charset 导致中文乱码
const readResponseText = async (response) => {
  const buf = await response.arrayBuffer()
  const decoder = new TextDecoder('utf-8')
  return decoder.decode(buf)
}

// A-4：从 429/503 响应派生「还需等待多少秒」。
// 优先级：响应体 retryAfterSec（账号失败锁定）→ Retry-After 头（秒数或 HTTP 日期）
// → express-rate-limit 的 RateLimit-Reset（IP 限流，值为剩余秒数）。
const parseRetryAfterSec = (body, headers) => {
  const candidates = []
  if (body && body.data && body.data.retryAfterSec !== undefined) candidates.push(body.data.retryAfterSec)
  if (body && body.retryAfterSec !== undefined) candidates.push(body.retryAfterSec)
  if (headers && typeof headers.get === 'function') {
    const retryAfter = headers.get('Retry-After')
    if (retryAfter) {
      const seconds = Number(retryAfter)
      if (Number.isFinite(seconds)) {
        candidates.push(seconds)
      } else {
        const at = Date.parse(retryAfter)
        if (!Number.isNaN(at)) candidates.push(Math.ceil((at - Date.now()) / 1000))
      }
    }
    const reset = headers.get('RateLimit-Reset')
    if (reset !== null && reset !== undefined && reset !== '') {
      const seconds = Number(reset)
      if (Number.isFinite(seconds)) candidates.push(seconds)
    }
  }
  const sec = candidates.map(Number).find(v => Number.isFinite(v) && v > 0)
  return sec ? Math.ceil(sec) : 0
}

const ADMIN_REFRESH_TOKEN_KEY = 'admin_refresh_token'
let adminRefreshPromise = null

// B-5：管理端 401 静默续期（单飞 + 重放一次）。refresh 接口自身走裸 fetch，避免递归。
const tryRefreshAdminToken = async () => {
  const refreshToken = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY) || ''
  if (!refreshToken) return false
  if (!adminRefreshPromise) {
    adminRefreshPromise = (async () => {
      try {
        const response = await fetch('/api/admin/refresh-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ refreshToken })
        })
        if (!response.ok) return false
        const text = await readResponseText(response)
        const json = text ? JSON.parse(text) : null
        const data = (json && json.data) || {}
        const nextToken = data.token || data.accessToken || ''
        if (!nextToken) return false
        localStorage.setItem('admin_token', nextToken)
        if (data.refreshToken) localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, data.refreshToken)
        if (data.user) localStorage.setItem('admin_user', JSON.stringify(data.user))
        return true
      } catch (e) {
        return false
      } finally {
        adminRefreshPromise = null
      }
    })()
  }
  return adminRefreshPromise
}

// 清理管理端登录态并回登录页（401/403 的「会话失效」分支共用）
const clearAdminAuth = () => {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_refresh_token')
  localStorage.removeItem('admin_user')
  if (isRedirecting) return
  isRedirecting = true
  setTimeout(() => {
    // 开发模式 base='/'，生产模式 base='/admin/'
    const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/admin/'
    window.location.href = base + 'login'
  }, 100)
}

const doRequest = async (url, method = 'GET', data = {}, headers = {}, timeout = DEFAULT_TIMEOUT, options = {}) => {
  const { silentAbort = true, skipAuthRedirect = false } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const requestOptions = {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    cache: 'no-store',
    signal: controller.signal
  }

  const token = localStorage.getItem('admin_token')
  if (token) {
    requestOptions.headers['Authorization'] = `Bearer ${token}`
  }

  if (requestOptions.method === 'GET') {
    const params = new URLSearchParams(data)
    if (params.toString()) {
      url += '?' + params.toString()
    }
  } else {
    requestOptions.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(url, requestOptions)
    clearTimeout(timeoutId)

    if (response.status === 401) {
      // B-5：先静默续期并重放一次（单飞）；refresh 也失效时再清态跳登录
      if (!skipAuthRedirect && !options.authRetried) {
        const refreshed = await tryRefreshAdminToken()
        if (refreshed) {
          return doRequest(url, method, data, headers, timeout, { ...options, authRetried: true })
        }
      }

      // 登录接口等场景：只透传后端错误信息，不做强制跳转（避免刚输错密码就整页刷新）
      if (skipAuthRedirect) {
        let message = '登录失败，请检查用户名和密码'
        try {
          const text = await readResponseText(response)
          if (text) {
            const result = JSON.parse(text)
            if (result.message) message = result.message
          }
        } catch (e) { /* 使用默认消息 */ }
        throw new RequestError(message, -1, 401)
      }

      // 审计 H-5：令牌已被服务端吊销（登出/改密/禁用）时整套清干净
      clearAdminAuth()
      throw new RequestError('登录已过期，请重新登录', -1, 401)
    }

    if (response.status === 403) {
      let body = null
      try {
        const text = await readResponseText(response)
        if (text) body = JSON.parse(text)
      } catch (e) { /* 非 JSON 响应保留默认文案 */ }

      // 权限不足（permission.js 的 PERMISSION_DENIED）≠ 会话失效：保留登录态，只把错误抛给页面
      if (body && body.error === 'PERMISSION_DENIED') {
        throw new RequestError(body.message || '无权限操作', -1, 403)
      }

      if (skipAuthRedirect) {
        throw new RequestError((body && body.message) || '登录失败，请检查用户名和密码', -1, 403)
      }

      // 账号被禁用 / 令牌用途不符 / 无管理员权限 → 清态跳登录
      clearAdminAuth()
      throw new RequestError((body && body.message) || '登录已过期，请重新登录', -1, 403)
    }

    if (response.status === 500) {
      throw new RequestError('服务器繁忙，请稍后重试', -1, 500)
    }

    if (response.status === 404) {
      throw new RequestError('请求的资源不存在', -1, 404)
    }

    if (response.status === 422) {
      const text = await readResponseText(response)
      let fieldErrors = {}
      let errorMessage = '请求参数验证失败'
      try {
        const result = JSON.parse(text)
        fieldErrors = result.errors || {}
        if (result.message) {
          errorMessage = result.message
        }
      } catch (e) {
      }
      throw new RequestError(errorMessage, -1, 422, fieldErrors)
    }

    if (!response.ok) {
      // 审计 H-3：429/503 的响应体里带的是可读文案（「登录失败次数过多，请 N 分钟后再试」
      // 「登录校验服务暂不可用，请稍后重试」），此前一律吞成「请求失败 (429)」，
      // 管理员既不知道该等多久，也不知道是口令错还是被锁。
      // A-4：同时把 retryAfterSec 挂到错误对象上，供登录页做倒计时禁用按钮。
      let message = `请求失败 (${response.status})`
      let body = null
      try {
        const text = await readResponseText(response)
        if (text) {
          body = JSON.parse(text)
          if (body && body.message) message = body.message
        }
      } catch (e) { /* 响应体不是 JSON 时保留默认文案 */ }
      throw new RequestError(message, -1, response.status, {}, parseRetryAfterSec(body, response.headers))
    }

    const text = await readResponseText(response)
    if (!text) {
      return { code: 200, data: null, message: 'success' }
    }

    const result = JSON.parse(text)

    // P0（2026-10-20 用户端完整度审计）：与用户端同一契约——后端 created() 返回 HTTP 201 +
    // 业务 code 201（新增 banner/公告/礼物/虚拟用户等），2xx 视为成功并归一为 code 200。
    const isSuccessCode = result.code === 0 || result.code === 200 || result.code === 201
    if (!isSuccessCode) {
      throw new RequestError(result.message || '请求失败', result.code, response.status)
    }

    return result.code === 201
      ? { ...result, code: 200, httpStatus: response.status || 201 }
      : result
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof RequestError) {
      throw error
    }
    if (error.name === 'AbortError') {
      if (silentAbort) {
        console.debug('请求已中止（可能是页面跳转导致）:', url)
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

export const request = (url, method = 'GET', data = {}, headers = {}, timeout = DEFAULT_TIMEOUT, options = {}) => {
  const upperMethod = (method || 'GET').toUpperCase()

  // 并发 GET 是正常场景，不去重
  if (upperMethod === 'GET' || upperMethod === 'HEAD') {
    return doRequest(url, method, data, headers, timeout, options)
  }

  const key = buildRequestKey(url, upperMethod, data)
  const existing = inflightRequests.get(key)
  if (existing) return existing

  const promise = doRequest(url, method, data, headers, timeout, options).finally(() => {
    // 仅当表中仍是本次请求时移除，避免误删期间新发起的同键请求
    if (inflightRequests.get(key) === promise) {
      inflightRequests.delete(key)
    }
  })
  inflightRequests.set(key, promise)
  return promise
}
