import { describe, it, expect, beforeEach, vi } from 'vitest'

let route

const makeUni = () => ({
  reLaunch: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  navigateBack: vi.fn(),
  switchTab: vi.fn(),
  addInterceptor: vi.fn(),
  getStorageSync: vi.fn(() => ''),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn()
})

describe('common/route - uni-app 路由兼容层', () => {
  beforeEach(async () => {
    vi.resetModules()
    global.uni = makeUni()
    global.getCurrentPages = vi.fn(() => [{ route: 'pages/Home', options: {} }])
    localStorage.clear()
    route = await import('@/common/route')
  })

  it('buildUrl：动态参数 + query', () => {
    const r = { page: '/pages/PostDetail', path: '/post-detail/:id' }
    expect(route.buildUrl(r, { id: 5 }, { from: 'share' })).toBe('/pages/PostDetail?from=share&id=5')
  })

  it('push 主 Tab 使用 reLaunch', () => {
    route.router.push('/home')
    expect(global.uni.reLaunch).toHaveBeenCalledWith({ url: '/pages/Home' })
  })

  it('push 动态路由：params 写进 query，并同步 route 状态', () => {
    route.router.push({ name: 'PostDetail', params: { id: 5 }, query: { from: 'share' } })
    expect(global.uni.navigateTo).toHaveBeenCalledWith({ url: '/pages/PostDetail?from=share&id=5' })
    expect(route.useRoute().params.id).toBe(5)
    expect(route.useRoute().query.from).toBe('share')
    expect(route.useRoute().path).toBe('/post-detail/:id')
  })

  it('replace 非主 Tab 使用 redirectTo', () => {
    localStorage.setItem('token', 'abc')
    route.router.replace('/settings')
    expect(global.uni.redirectTo).toHaveBeenCalledWith({ url: '/pages/Settings' })
  })

  it('canAccess：受保护页面未登录为 false，有 token 为 true', () => {
    const settings = { path: '/settings', name: 'Settings', requiresAuth: true }
    expect(route.canAccess(settings)).toBe(false)
    localStorage.setItem('token', 'abc')
    expect(route.canAccess(settings)).toBe(true)
  })

  it('未登录访问受保护页面会跳登录', () => {
    vi.useFakeTimers()
    route.router.push('/wallet')
    vi.advanceTimersByTime(200)
    expect(global.uni.reLaunch).toHaveBeenCalledWith(expect.objectContaining({ url: '/pages/Login' }))
    vi.useRealTimers()
  })

  it('installRouteGuard 注册 4 个拦截器', () => {
    route.installRouteGuard()
    expect(global.uni.addInterceptor).toHaveBeenCalledTimes(4)
  })

  it('旧路径能解析到新页面', () => {
    expect(route.router.resolve('/post-detail/9')).toMatchObject({ route: { name: 'PostDetail' }, params: { id: '9' } })
    expect(route.router.resolve('/chat-room/3')).toMatchObject({ route: { name: 'ChatRoom' }, params: { id: '3' } })
  })
})
