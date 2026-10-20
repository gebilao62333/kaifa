import { reactive, computed } from 'vue'
import { ROUTES, ROUTE_BY_NAME, ROUTE_BY_PAGE } from './routes'
import { STORAGE_KEYS, PUBLIC_ROUTE_NAMES, isPublicPath } from './constants'
import storage from './storage'

const isH5 = typeof window !== 'undefined' && typeof document !== 'undefined'

const state = reactive({
  path: '/home',
  name: 'Home',
  query: {},
  params: {},
  meta: { requiresAuth: false, fullscreen: false, title: '' },
  fullPath: '/home'
})

function makeMeta(route) {
  return { requiresAuth: !!route.requiresAuth, fullscreen: !!route.fullscreen, title: route.title || '' }
}

const dynamicRoutes = ROUTES.filter((r) => r.path.indexOf(':') >= 0).map((r) => {
  const keys = (r.path.match(/:([^/]+)/g) || []).map((s) => s.slice(1))
  const pattern = new RegExp('^' + r.path.replace(/:([^/]+)/g, '([^/]+)') + '/?$')
  return { route: r, keys, pattern }
})

function matchLegacy(path) {
  const exact = ROUTES.find((r) => r.path === path)
  if (exact) return { route: exact, params: {} }
  for (const item of dynamicRoutes) {
    const m = path.match(item.pattern)
    if (m) {
      const params = {}
      item.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]) })
      return { route: item.route, params }
    }
  }
  return null
}

function parseQuery(search) {
  const query = {}
  String(search || '').replace(/^\?/, '').split('&').forEach((part) => {
    if (!part) return
    const idx = part.indexOf('=')
    const key = decodeURIComponent(idx < 0 ? part : part.slice(0, idx))
    const value = idx < 0 ? '' : decodeURIComponent(part.slice(idx + 1))
    if (key) query[key] = value
  })
  return query
}

function apply(route, params, query, fullPath) {
  state.path = route.path
  state.name = route.name
  state.query = query || {}
  state.params = params || {}
  state.meta = makeMeta(route)
  state.fullPath = fullPath || route.path
  if (isH5 && route.title) {
    try { document.title = route.title + ' - eu搭子' } catch (e) {}
  }
}

export function syncFromLocation() {
  if (isH5) {
    const loc = window.location
    const legacy = matchLegacy(loc.pathname)
    if (legacy) {
      apply(legacy.route, legacy.params, parseQuery(loc.search), loc.pathname + loc.search)
      return state
    }
    const pageRoute = ROUTE_BY_PAGE[loc.pathname]
    if (pageRoute) {
      const query = parseQuery(loc.search)
      const params = {}
      ;(pageRoute.path.match(/:([^/]+)/g) || []).forEach((k) => {
        const key = k.slice(1)
        if (query[key] !== undefined) { params[key] = query[key]; delete query[key] }
      })
      // fullPath 用真实地址（含 query），否则深链登录回跳时只带页面、丢掉 redirect 等参数
      apply(pageRoute, params, query, loc.pathname + loc.search)
      return state
    }
    if (loc.pathname === '/' || loc.pathname === '') {
      apply(ROUTE_BY_NAME.Home, {}, {}, '/home')
      return state
    }
    return state
  }
  try {
    const pages = getCurrentPages()
    const cur = pages[pages.length - 1]
    if (cur && cur.route) {
      const pageRoute = ROUTE_BY_PAGE['/' + cur.route]
      if (pageRoute) {
        const query = Object.assign({}, cur.options || {})
        const params = {}
        ;(pageRoute.path.match(/:([^/]+)/g) || []).forEach((k) => {
          const key = k.slice(1)
          if (query[key] !== undefined) { params[key] = query[key]; delete query[key] }
        })
        // 参数已回填进 params，fullPath 用参数填充后的真实路径，否则深链登录回跳会丢 id
        apply(pageRoute, params, query, buildUrl(pageRoute, params, query))
      }
    }
  } catch (e) {}
  return state
}

function resolve(to) {
  if (typeof to === 'string') {
    const [rawPath, rawQuery] = to.split('?')
    const query = parseQuery(rawQuery ? '?' + rawQuery : '')
    // 根路径（MyReserve 等页面「回首页」会 push('/')）统一解析成 Home
    if (!rawPath || rawPath === '/') {
      return { route: ROUTE_BY_NAME.Home, params: {}, query }
    }
    if (rawPath.indexOf('/pages/') === 0) {
      const pageRoute = ROUTE_BY_PAGE[rawPath]
      if (pageRoute) return { route: pageRoute, params: {}, query }
      return null
    }
    const found = matchLegacy(rawPath)
    if (found) return { route: found.route, params: found.params, query }
    return null
  }
  if (to && typeof to === 'object') {
    if (to.name && ROUTE_BY_NAME[to.name]) {
      return { route: ROUTE_BY_NAME[to.name], params: Object.assign({}, to.params || {}), query: Object.assign({}, to.query || {}) }
    }
    if (typeof to.path === 'string') {
      const targetPath = to.path
      if (targetPath === '' || targetPath === '/') {
        return { route: ROUTE_BY_NAME.Home, params: Object.assign({}, to.params || {}), query: Object.assign({}, to.query || {}) }
      }
      const found = matchLegacy(targetPath)
      if (found) {
        return { route: found.route, params: Object.assign({}, found.params, to.params || {}), query: Object.assign({}, to.query || {}) }
      }
    }
  }
  return null
}

// 给调用方（登录回跳等）判断「这个地址能不能解析成已知路由」：
// 旧写法用 getRoutes().map(path) 严格等值，动态路由（/post-detail/:id）会被误判为非法而打回首页
export function canResolve(to) {
  return !!resolve(to)
}

export function buildUrl(route, params, query) {
  const merged = Object.assign({}, query || {})
  ;(route.path.match(/:([^/]+)/g) || []).forEach((k) => {
    const key = k.slice(1)
    if (params && params[key] !== undefined) merged[key] = params[key]
  })
  const qs = Object.keys(merged)
    .filter((k) => merged[k] !== undefined && merged[k] !== null)
    .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(merged[k]))
    .join('&')
  return route.page + (qs ? '?' + qs : '')
}

export function isLoggedIn() {
  try {
    // 存储适配器已处理「uni 优先、localStorage 回落」与两侧不可用的异常
    const token = storage.getItem(STORAGE_KEYS.TOKEN)
    return !!token && token !== 'undefined' && token !== 'null'
  } catch (e) {
    return false
  }
}

export function canAccess(route) {
  if (!route) return true
  const needsAuth = route.requiresAuth || (!PUBLIC_ROUTE_NAMES.includes(route.name) && !isPublicPath(route.path))
  return !needsAuth || isLoggedIn()
}

export const LOGIN_REDIRECT_KEY = '__kaifa_login_redirect__'

export function loginUrl() {
  return '/pages/Login'
}

let redirecting = false
export function goLogin() {
  if (redirecting || state.path === '/login') return
  redirecting = true
  const redirect = state.fullPath || '/home'
  try { uni.setStorageSync(LOGIN_REDIRECT_KEY, redirect) } catch (e) {}
  const login = ROUTE_BY_NAME.Login
  if (login) apply(login, {}, {}, login.path)
  setTimeout(() => {
    uni.reLaunch({
      url: loginUrl(),
      complete: () => {
        redirecting = false
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            try { if (window.location.pathname !== '/pages/Login') window.history.replaceState(null, '', '/pages/Login') } catch (e) {}
          }, 120)
        }
      }
    })
  }, 100)
}

const MAIN_TABS = ['/home', '/square', '/preferred', '/mine']

// ===== 页面切换动画方向（补齐旧版 App.vue 的 tab-left / tab-right 过渡） =====
// 旧版在 vue-router 的 <transition> 上根据 Tab 下标设置方向；uni-app 的页面容器是
// <uni-page>，无法直接使用 <transition>，因此用 html[data-nav-dir] + 全局 CSS 动画实现。
let navDirectionTimer = null
export function setNavDirection(direction) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (!root) return
  if (direction === 'left' || direction === 'right') {
    root.setAttribute('data-nav-dir', direction)
  } else {
    root.removeAttribute('data-nav-dir')
  }
  if (navDirectionTimer) clearTimeout(navDirectionTimer)
  navDirectionTimer = setTimeout(() => {
    try { root.removeAttribute('data-nav-dir') } catch (e) {}
    navDirectionTimer = null
  }, 420)
}

function canGoBack() {
  try {
    if (typeof getCurrentPages === 'function') {
      const pages = getCurrentPages()
      if (Array.isArray(pages) && pages.length > 1) return true
    }
  } catch (e) {}
  return isH5 && typeof window !== 'undefined' && window.history.length > 1
}

function navigate(to, mode) {
  const target = resolve(to)
  if (!target) {
    if (typeof to === 'string' && to) uni.navigateTo({ url: to })
    return
  }
  if (!canAccess(target.route)) { goLogin(); return }
  const url = buildUrl(target.route, target.params, target.query)
  apply(target.route, target.params, target.query, target.route.path)
  if (mode === 'reLaunch' || MAIN_TABS.includes(target.route.path)) {
    uni.reLaunch({ url })
  } else if (mode === 'redirectTo') {
    uni.redirectTo({ url })
  } else {
    uni.navigateTo({ url })
  }
}

export const router = {
  push(to) { navigate(to, 'navigateTo') },
  replace(to) { navigate(to, 'redirectTo') },
  back(n) {
    try {
      if (getCurrentPages().length > 1) uni.navigateBack({ delta: n || 1 })
      else uni.reLaunch({ url: '/pages/Home' })
    } catch (e) { uni.reLaunch({ url: '/pages/Home' }) }
  },
  go(n) {
    if (n < 0) this.back(-n)
    else if (isH5) window.history.forward()
  },
  currentRoute: computed(() => state),
  // 兼容 vue-router 的 router.options.history.state.back：
  // AudioCall / VideoCall 用它判断「站内是否有上一页」，没有则回首页。
  get options() {
    return { history: { state: { back: canGoBack() } } }
  },
  getRoutes: () => ROUTES.map((r) => ({ path: r.path, name: r.name })),
  resolve
}

export function useRouter() { return router }
export function useRoute() { return state }

export function checkAuthRedirect() {
  const current = ROUTES.find((r) => r.path === state.path)
  if (current && !canAccess(current)) goLogin()
}

export function installRouteGuard() {
  syncFromLocation()
  ;['navigateTo', 'redirectTo', 'reLaunch', 'switchTab'].forEach((method) => {
    try {
      uni.addInterceptor(method, {
        invoke(args) {
          if (args && args.__skipAuth) return args
          const target = resolve(args && args.url)
          if (target && !canAccess(target.route)) { goLogin(); return false }
          return args
        }
      })
    } catch (e) {}
  })
  setTimeout(checkAuthRedirect, 600)
  if (isH5) window.addEventListener('popstate', () => syncFromLocation())
  return state
}
