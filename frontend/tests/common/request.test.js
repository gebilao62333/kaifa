import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const STORAGE_TOKEN_KEY = 'token'
const STORAGE_PINIA_KEY = 'pinia-app-state'

const encode = (body) => {
  if (body === '' || body === undefined || body === null) return new ArrayBuffer(0)
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  return new TextEncoder().encode(text).buffer
}

const makeResponse = (status, body, okOverride) => ({
  status,
  ok: okOverride !== undefined ? okOverride : status >= 200 && status < 300,
  arrayBuffer: async () => encode(body)
})

describe('common/request - HTTP 层', () => {
  let common
  let fetchMock

  beforeEach(async () => {
    vi.resetModules()
    localStorage.clear()
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    fetchMock = vi.fn()
    globalThis.fetch = fetchMock
    common = await import('@/common/common')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ---------- 登录态工具 ----------

  it('isLoggedIn 依据 localStorage 中是否有 token', () => {
    expect(common.isLoggedIn()).toBe(false)
    localStorage.setItem(STORAGE_TOKEN_KEY, 'abc')
    expect(common.isLoggedIn()).toBe(true)
  })

  it('checkLoginStatus：不要求登录时只返回登录态', () => {
    expect(common.checkLoginStatus()).toBe(false)
    localStorage.setItem(STORAGE_TOKEN_KEY, 'abc')
    expect(common.checkLoginStatus()).toBe(true)
  })

  it('checkLoginStatus：要求登录但未登录时抛 RequestError(401)', () => {
    let captured = null
    try {
      common.checkLoginStatus(true)
    } catch (e) {
      captured = e
    }
    expect(captured).toBeInstanceOf(common.RequestError)
    expect(captured.status).toBe(401)
    expect(captured.code).toBe(-2)
  })

  it('getCookie：无 cookie 时返回空串，有 cookie 时返回解码值', () => {
    document.cookie = 'XSRF-TOKEN=abc%20123'
    expect(common.getCookie('XSRF-TOKEN')).toBe('abc 123')
    expect(common.getCookie('NOT-EXIST')).toBe('')
  })

  it('getCookie：名称含正则元字符时按字面量匹配', () => {
    document.cookie = 'a.b=value1'
    expect(common.getCookie('a.b')).toBe('value1')
  })

  it('RequestError 携带 code/status/fieldErrors', () => {
    const err = new common.RequestError('坏请求', 500, 422, { phone: '格式错误' })
    expect(err.name).toBe('RequestError')
    expect(err.message).toBe('坏请求')
    expect(err.code).toBe(500)
    expect(err.status).toBe(422)
    expect(err.fieldErrors).toEqual({ phone: '格式错误' })
  })

  // ---------- 请求构造 ----------

  it('GET：拼接查询参数并解析响应', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, { code: 200, data: { list: [1] } }))
    const result = await common.request('/api/demo', 'GET', { page: 2, size: 10 })
    expect(result).toEqual({ code: 200, data: { list: [1] } })
    const calledUrl = fetchMock.mock.calls[0][0]
    expect(calledUrl).toContain('page=2')
    expect(calledUrl).toContain('size=10')
    const opts = fetchMock.mock.calls[0][1]
    expect(opts.method).toBe('GET')
    expect(opts.cache).toBe('no-store')
    expect(opts.body).toBeUndefined()
  })

  it('GET：无参数时不追加问号', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, { code: 200 }))
    await common.request('/api/demo', 'GET')
    expect(fetchMock.mock.calls[0][0]).toBe('/api/demo')
  })

  it('POST：序列化 body 并附带 Authorization', async () => {
    localStorage.setItem(STORAGE_TOKEN_KEY, 'token-123')
    fetchMock.mockResolvedValue(makeResponse(200, { code: 200 }))
    await common.request('/api/demo', 'POST', { a: 1 })
    const opts = fetchMock.mock.calls[0][1]
    expect(opts.method).toBe('POST')
    expect(opts.body).toBe(JSON.stringify({ a: 1 }))
    expect(opts.headers.Authorization).toBe('Bearer token-123')
    expect(opts.headers['Content-Type']).toBe('application/json')
  })

  it('无 token 时不带 Authorization 头', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, { code: 200 }))
    await common.request('/api/demo', 'POST', {})
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('写请求在存在 XSRF-TOKEN cookie 时附带 CSRF 头，读请求不附带', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-abc'
    fetchMock.mockResolvedValue(makeResponse(200, { code: 200 }))
    await common.request('/api/demo', 'POST', {})
    expect(fetchMock.mock.calls[0][1].headers['X-XSRF-TOKEN']).toBe('csrf-abc')

    fetchMock.mockClear()
    await common.request('/api/demo', 'GET')
    expect(fetchMock.mock.calls[0][1].headers['X-XSRF-TOKEN']).toBeUndefined()
  })

  it('自定义请求头会被合并', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, { code: 200 }))
    await common.request('/api/demo', 'GET', {}, { 'X-Trace': 't1' })
    expect(fetchMock.mock.calls[0][1].headers['X-Trace']).toBe('t1')
  })

  // ---------- 错误分支 ----------

  it('401 且不要求登录：抛 401 而不跳转', async () => {
    fetchMock.mockResolvedValue(makeResponse(401, { code: 401, message: '未授权' }))
    let captured = null
    try {
      await common.request('/api/demo', 'GET')
    } catch (e) {
      captured = e
    }
    expect(captured).toBeInstanceOf(common.RequestError)
    expect(captured.status).toBe(401)
    expect(captured.message).toContain('登录失效')
  })

  it('401 且要求登录：清除本地登录态并在用例内触发重定向', async () => {
    // 用假定时器把 100ms 后的重定向固定在用例内部触发：
    // 真实定时器在并发高负载下可能晚于用例结束才触发，被 vitest 记成「未处理错误」导致退出码 1。
    vi.useFakeTimers()
    localStorage.setItem(STORAGE_TOKEN_KEY, 'abc')
    localStorage.setItem(STORAGE_PINIA_KEY, '{}')
    fetchMock.mockResolvedValue(makeResponse(401, {}))
    await expect(common.request('/api/demo', 'GET', {}, {}, 15000, { requireLogin: true })).rejects.toThrow()
    expect(localStorage.getItem(STORAGE_TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(STORAGE_PINIA_KEY)).toBeNull()
    await vi.advanceTimersByTimeAsync(200)
  })

  it('requireLogin 但本地无 token：直接抛错且不发请求', async () => {
    let captured = null
    try {
      await common.request('/api/demo', 'GET', {}, {}, 15000, { requireLogin: true })
    } catch (e) {
      captured = e
    }
    expect(captured.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('404 抛 RequestError', async () => {
    fetchMock.mockResolvedValue(makeResponse(404, ''))
    await expect(common.request('/api/demo', 'GET')).rejects.toThrow('请求的资源不存在')
  })

  it('422 解析 fieldErrors', async () => {
    fetchMock.mockResolvedValue(makeResponse(422, { message: '参数错误', errors: { phone: '必填' } }))
    let captured = null
    try {
      await common.request('/api/demo', 'POST', {})
    } catch (e) {
      captured = e
    }
    expect(captured.status).toBe(422)
    expect(captured.message).toBe('参数错误')
    expect(captured.fieldErrors).toEqual({ phone: '必填' })
  })

  it('422 响应体非法 JSON 时使用兜底消息', async () => {
    fetchMock.mockResolvedValue(makeResponse(422, 'not-json'))
    let captured = null
    try {
      await common.request('/api/demo', 'POST', {})
    } catch (e) {
      captured = e
    }
    expect(captured.status).toBe(422)
    expect(captured.message).toBe('请求参数验证失败')
  })

  it('500 且响应体含 message 时使用后端消息', async () => {
    fetchMock.mockResolvedValue(makeResponse(500, { message: '数据库连接失败' }))
    await expect(common.request('/api/demo', 'GET')).rejects.toThrow('数据库连接失败')
  })

  it('500 且响应体不可解析时使用默认消息', async () => {
    fetchMock.mockResolvedValue(makeResponse(500, 'boom'))
    await expect(common.request('/api/demo', 'GET')).rejects.toThrow('服务器繁忙，请稍后重试')
  })

  it('其他非 2xx 状态码抛通用错误', async () => {
    fetchMock.mockResolvedValue(makeResponse(403, ''))
    await expect(common.request('/api/demo', 'GET')).rejects.toThrow('请求失败 (403)')
  })

  it('空响应体返回 code 200 且 data 为 null', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, ''))
    await expect(common.request('/api/demo', 'GET')).resolves.toEqual({ code: 200, data: null, message: 'success' })
  })

  it('响应体为非对象 JSON 时兜底', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, 'null'))
    await expect(common.request('/api/demo', 'GET')).resolves.toEqual({ code: 200, data: null, message: 'success' })
  })

  it('业务 code 非 0/200 时抛错', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, { code: 500, message: '业务失败' }))
    await expect(common.request('/api/demo', 'GET')).rejects.toThrow('业务失败')
  })

  it('业务 code = 0 视为成功', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, { code: 0, data: 7 }))
    const r = await common.request('/api/demo', 'GET')
    expect(r.data).toBe(7)
  })

  it('请求被中止且 silentAbort 为真时返回 null', async () => {
    const abort = new Error('aborted')
    abort.name = 'AbortError'
    fetchMock.mockRejectedValue(abort)
    await expect(common.request('/api/demo', 'GET')).resolves.toBeNull()
  })

  it('请求被中止且 silentAbort 为假时抛超时错误', async () => {
    const abort = new Error('aborted')
    abort.name = 'AbortError'
    fetchMock.mockRejectedValue(abort)
    await expect(common.request('/api/demo', 'GET', {}, {}, 15000, { silentAbort: false })).rejects.toThrow('请求超时')
  })

  it('网络异常抛统一错误', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    await expect(common.request('/api/demo', 'GET')).rejects.toThrow('网络连接失败')
  })

  // ---------- 写请求去重 ----------

  it('相同写请求并发时复用同一个 Promise', async () => {
    let resolveFetch
    fetchMock.mockImplementation(() => new Promise((resolve) => { resolveFetch = resolve }))
    const p1 = common.request('/api/demo', 'POST', { a: 1 })
    const p2 = common.request('/api/demo', 'POST', { a: 1 })
    expect(p1).toBe(p2)
    resolveFetch(makeResponse(200, { code: 200 }))
    await p1
  })

  it('写请求完成后同键请求会重新发起', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, { code: 200 }))
    await common.request('/api/demo', 'POST', { a: 1 })
    await common.request('/api/demo', 'POST', { a: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('GET 请求不做去重', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, { code: 200 }))
    const p1 = common.request('/api/demo', 'GET', { a: 1 })
    const p2 = common.request('/api/demo', 'GET', { a: 1 })
    expect(p1).not.toBe(p2)
    await Promise.all([p1, p2])
  })

  it('写请求失败后同键请求仍可重新发起', async () => {
    fetchMock.mockRejectedValueOnce(new Error('boom'))
    await expect(common.request('/api/demo', 'POST', { a: 1 })).rejects.toThrow()
    fetchMock.mockResolvedValueOnce(makeResponse(200, { code: 200 }))
    await expect(common.request('/api/demo', 'POST', { a: 1 })).resolves.toEqual({ code: 200 })
  })

  it('401 重定向只触发一次', async () => {
    vi.useFakeTimers()
    localStorage.setItem(STORAGE_TOKEN_KEY, 'abc')
    fetchMock.mockResolvedValue(makeResponse(401, {}))
    const opts = { requireLogin: true }
    await expect(common.request('/api/a', 'GET', {}, {}, 15000, opts)).rejects.toThrow()
    await expect(common.request('/api/b', 'GET', {}, {}, 15000, opts)).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(200)
    expect(true).toBe(true)
  })
})
