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
  return !!localStorage.getItem('admin_token')
}

export const request = async (url, method = 'GET', data = {}, headers = {}, timeout = DEFAULT_TIMEOUT, options = {}) => {
  const { silentAbort = true } = options

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
      if (!isRedirecting) {
        isRedirecting = true
        localStorage.removeItem('admin_token')
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
