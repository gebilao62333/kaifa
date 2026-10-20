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

  it('router.options.history.state.back：按页面栈深度判断能否返回（通话页 safeBack 依赖）', () => {
    global.getCurrentPages = vi.fn(() => [{ route: 'pages/Home', options: {} }])
    expect(route.router.options.history.state.back).toBe(false)
    global.getCurrentPages = vi.fn(() => [{ route: 'pages/Home', options: {} }, { route: 'pages/Wallet', options: {} }])
    expect(route.router.options.history.state.back).toBe(true)
  })

  it('setNavDirection 写入/清除 html[data-nav-dir]（主 Tab 滑动过渡）', () => {
    route.setNavDirection('left')
    expect(document.documentElement.getAttribute('data-nav-dir')).toBe('left')
    route.setNavDirection(null)
    expect(document.documentElement.hasAttribute('data-nav-dir')).toBe(false)
  })

  // 修复：resolve 现在把 '/' 与 '' 归一为 Home（MyReserve「回首页」按钮 push('/')）
  it("resolve('/') 与 resolve('') 都解析到 Home", () => {
    expect(route.router.resolve('/')).toMatchObject({ route: { name: 'Home' }, params: {} })
    expect(route.router.resolve('')).toMatchObject({ route: { name: 'Home' } })
    expect(route.canResolve('/')).toBe(true)
  })

  it('canResolve：动态路由与带 query 的路径可解析，未知路径不可解析', () => {
    expect(route.canResolve('/post-detail/9')).toBe(true)
    expect(route.canResolve('/chat-room/3?from=push')).toBe(true)
    expect(route.canResolve({ name: 'UserProfile', params: { id: 3 } })).toBe(true)
    expect(route.canResolve('/not-exist-route')).toBe(false)
    expect(route.canResolve(null)).toBe(false)
  })

  it("push('/') 回首页（主 Tab 走 reLaunch）", () => {
    route.router.push('/')
    expect(global.uni.reLaunch).toHaveBeenCalledWith({ url: '/pages/Home' })
  })

  // 修复：syncFromLocation 的 H5 分支用真实 loc.pathname + loc.search 作 fullPath，
  // 旧实现写死 pageRoute.path，深链登录回跳会丢掉 id/query
  it('syncFromLocation：H5 用真实 pathname+search 作 fullPath', () => {
    const original = { pathname: window.location.pathname, search: window.location.search }
    try {
      window.location.pathname = '/pages/PostDetail'
      window.location.search = '?id=9&from=share'
      route.syncFromLocation()
      expect(route.useRoute().fullPath).toBe('/pages/PostDetail?id=9&from=share')
      expect(route.useRoute().params.id).toBe('9')
      expect(route.useRoute().query.from).toBe('share')
    } finally {
      window.location.pathname = original.pathname
      window.location.search = original.search
    }
  })

  it('syncFromLocation：旧链接的 fullPath 保留真实地址', () => {
    const original = { pathname: window.location.pathname, search: window.location.search }
    try {
      window.location.pathname = '/post-detail/9'
      window.location.search = '?from=share'
      route.syncFromLocation()
      expect(route.useRoute().fullPath).toBe('/post-detail/9?from=share')
      expect(route.useRoute().params.id).toBe('9')
    } finally {
      window.location.pathname = original.pathname
      window.location.search = original.search
    }
  })
})
