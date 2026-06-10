import { createRouter, createWebHistory } from 'vue-router'
import adminRoutes from './admin'

const routes = [
  ...adminRoutes,
  {
    path: '/',
    redirect: '/admin/dashboard'
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/admin/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：admin 页面需要登录
router.beforeEach(async (to, from, next) => {
  if (to.path === '/admin/login') {
    next()
    return
  }

  if (to.path.startsWith('/admin')) {
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token')
    if (!token) {
      next('/admin/login')
      return
    }

    // 解码 JWT 检查是否过期（不验证签名，只读取 exp）
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // token 已过期，尝试用 refreshToken 刷新
        const refreshToken = localStorage.getItem('admin_refresh_token') || sessionStorage.getItem('admin_refresh_token')
        if (refreshToken) {
          try {
            const rPayload = JSON.parse(atob(refreshToken.split('.')[1]))
            if (rPayload.exp && rPayload.exp * 1000 > Date.now()) {
              // refreshToken 未过期，调用后端刷新接口获取新 access token
              const refreshed = await tryRefreshAdminToken(refreshToken)
              if (refreshed) {
                next()
                return
              }
            }
          } catch (e) { /* refreshToken 解析失败 */ }
        }
        // token 和 refreshToken 都过期，或刷新失败，清除并跳转登录
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_refresh_token')
        localStorage.removeItem('admin_user')
        sessionStorage.removeItem('admin_token')
        sessionStorage.removeItem('admin_refresh_token')
        sessionStorage.removeItem('admin_user')
        next('/admin/login')
        return
      }
    } catch (e) {
      // JWT 解析失败，视为无效 token
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_refresh_token')
      localStorage.removeItem('admin_user')
      sessionStorage.removeItem('admin_token')
      sessionStorage.removeItem('admin_refresh_token')
      sessionStorage.removeItem('admin_user')
      next('/admin/login')
      return
    }
  }

  next()
})

/**
 * 调用后端刷新 token 接口获取新 access token
 * @param {string} refreshToken
 * @returns {Promise<boolean>}
 */
async function tryRefreshAdminToken(refreshToken) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch('/api/admin-manage/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!res.ok) return false

    const data = await res.json()
    if (data.code === 200 && data.data && data.data.token) {
      const isRemember = localStorage.getItem('admin_remember') === '1'
      if (isRemember) {
        localStorage.setItem('admin_token', data.data.token)
        if (data.data.refreshToken) localStorage.setItem('admin_refresh_token', data.data.refreshToken)
      } else {
        sessionStorage.setItem('admin_token', data.data.token)
        if (data.data.refreshToken) sessionStorage.setItem('admin_refresh_token', data.data.refreshToken)
      }
      return true
    }
    return false
  } catch {
    return false
  }
}

export default router
