import { reactive, computed } from 'vue'
import { ROUTES, ROUTE_BY_NAME, ROUTE_BY_PAGE } from './routes'
import { STORAGE_KEYS, PUBLIC_ROUTE_NAMES, isPublicPath } from './constants'

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
      apply(pageRoute, params, query, pageRoute.path)
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
        apply(pageRoute, params, query, pageRoute.path)
      }
    }
  } catch (e) {}
  return state
}

function resolve(to) {
  if (typeof to === 'string') {
    const [rawPath, rawQuery] = to.split('?')
    const query = parseQuery(rawQuery ? '?' + rawQuery : '')
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
    if (to.path) {
      const found = matchLegacy(to.path)
      if (found) {
        return { route: found.route, params: Object.assign({}, found.params, to.params || {}), query: Object.assign({}, to.query || {}) }
      }
    }
  }
  return null
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
    let token = ''
    try { token = uni.getStorageSync(STORAGE_KEYS.TOKEN) } catch (e) {}
    if (!token && typeof localStorage !== 'undefined') token = localStorage.getItem(STORAGE_KEYS.TOKEN)
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
