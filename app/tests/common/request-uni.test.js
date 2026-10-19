import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

let common
let uniRequest

const json = (obj) => JSON.stringify(obj)

const respond = (options, statusCode, body) => {
  const data = typeof body === 'string' ? body : json(body)
  setTimeout(() => options.success({ statusCode, data }), 0)
}

describe('common/request - uni.request 适配层', () => {
  beforeEach(async () => {
    vi.resetModules()
    localStorage.clear()
    uniRequest = vi.fn()
    global.uni = Object.assign({}, global.uni, {
      request: uniRequest,
      reLaunch: vi.fn(),
      getStorageSync: vi.fn(() => ''),
      setStorageSync: vi.fn(),
      removeStorageSync: vi.fn()
    })
    common = await import('@/common/common')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('GET：带 token、传 data、解析 JSON', async () => {
    localStorage.setItem('token', 'abc')
    uniRequest.mockImplementation((opts) => {
      expect(opts.method).toBe('GET')
      expect(opts.url).toBe('/api/test')
      expect(opts.header.Authorization).toBe('Bearer abc')
      expect(opts.data).toEqual({ page: 1 })
      respond(opts, 200, { code: 200, data: { ok: true } })
    })
    const res = await common.request('/api/test', 'GET', { page: 1 })
    expect(res.data.ok).toBe(true)
  })

  it('POST：body 是 JSON 字符串', async () => {
    uniRequest.mockImplementation((opts) => {
      expect(opts.method).toBe('POST')
      expect(opts.data).toBe(json({ a: 1 }))
      respond(opts, 200, { code: 200, data: null })
    })
    await common.request('/api/test', 'POST', { a: 1 })
  })

  it('401：requireLogin 时清 token 并抛 401', async () => {
    localStorage.setItem('token', 'abc')
    uniRequest.mockImplementation((opts) => respond(opts, 401, { message: 'unauthorized' }))
    await expect(common.request('/api/me', 'GET', {}, {}, 1000, { requireLogin: true })).rejects.toMatchObject({ status: 401 })
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('500：带后端 message', async () => {
    uniRequest.mockImplementation((opts) => respond(opts, 500, { message: '数据库繁忙' }))
    await expect(common.request('/api/test')).rejects.toMatchObject({ message: '数据库繁忙', status: 500 })
  })

  it('422：带 fieldErrors', async () => {
    uniRequest.mockImplementation((opts) => respond(opts, 422, { message: '参数错误', errors: { phone: '格式不对' } }))
    await expect(common.request('/api/test')).rejects.toMatchObject({ fieldErrors: { phone: '格式不对' } })
  })

  it('业务 code 非 200：抛 RequestError', async () => {
    uniRequest.mockImplementation((opts) => respond(opts, 200, { code: 403, message: '无权限' }))
    await expect(common.request('/api/test')).rejects.toMatchObject({ code: 403, message: '无权限' })
  })

  it('网络失败：抛网络错误', async () => {
    uniRequest.mockImplementation((opts) => setTimeout(() => opts.fail({ errMsg: 'request:fail' }), 0))
    await expect(common.request('/api/test')).rejects.toMatchObject({ status: 0 })
  })

  it('超时且 silentAbort：返回 null', async () => {
    uniRequest.mockImplementation((opts) => setTimeout(() => opts.fail({ errMsg: 'request:fail timeout' }), 0))
    const res = await common.request('/api/test', 'GET', {}, {}, 1000, { silentAbort: true })
    expect(res).toBeNull()
  })

  it('并发写请求去重', async () => {
    uniRequest.mockImplementation((opts) => setTimeout(() => respond(opts, 200, { code: 200, data: null }), 20))
    const [a, b] = await Promise.all([
      common.request('/api/save', 'POST', { x: 1 }),
      common.request('/api/save', 'POST', { x: 1 })
    ])
    expect(a).toBe(b)
    expect(uniRequest).toHaveBeenCalledTimes(1)
  })
})
