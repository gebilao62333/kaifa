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
  return password && password.length >= 6 && password.length <= 32
}

export const validateNickname = (nickname) => {
  return nickname && nickname.length >= 2 && nickname.length <= 20
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
  constructor(message, code = -1, status = 0, fieldErrors = {}) {
    super(message)
    this.name = 'RequestError'
    this.code = code
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export const isLoggedIn = () => {
  return !!localStorage.getItem('token') || !!localStorage.getItem('admin_token')
}

export const checkLoginStatus = (requireLogin = false) => {
  if (requireLogin && !isLoggedIn()) {
    throw new RequestError('请先登录', -2, 401)
  }
  return isLoggedIn()
}

export const request = async (url, method = 'GET', data = {}, headers = {}, timeout = DEFAULT_TIMEOUT, options = {}) => {
  const { requireLogin = false, silentAbort = true } = options
  
  if (requireLogin && !isLoggedIn()) {
    window.location.href = '/login'
    throw new RequestError('请先登录', -2, 401)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const requestOptions = {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    signal: controller.signal
  }

  const token = localStorage.getItem('admin_token') || localStorage.getItem('token')
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
      if (!isRedirecting) {
        isRedirecting = true
        localStorage.removeItem('token')
        localStorage.removeItem('pinia-app-state')
        setTimeout(() => {
          window.location.href = '/login'
        }, 100)
      }
      throw new RequestError('登录失效，请重新登录', -1, 401)
    }

    if (response.status === 500) {
      throw new RequestError('服务器繁忙，请稍后重试', -1, 500)
    }

    if (response.status === 404) {
      throw new RequestError('请求的资源不存在', -1, 404)
    }

    if (response.status === 422) {
      const text = await response.text()
      let fieldErrors = {}
      try {
        const result = JSON.parse(text)
        fieldErrors = result.errors || {}
      } catch (e) {
      }
      throw new RequestError('请求参数验证失败', -1, 422, fieldErrors)
    }

    if (!response.ok) {
      throw new RequestError(`请求失败 (${response.status})`, -1, response.status)
    }

    const text = await response.text()
    if (!text) {
      return { code: 200, data: null, message: 'success' }
    }

    const result = JSON.parse(text)

    if (result.code !== 0 && result.code !== 200) {
      throw new RequestError(result.message || '请求失败', result.code, response.status)
    }

    return result
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
