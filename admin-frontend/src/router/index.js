import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'AdminLogin',
    component: () => import('../views/AdminLogin.vue')
  },
  {
    path: '/403',
    name: 'NoPermission',
    component: () => import('../views/NoPermission.vue')
  },
  {
    path: '/',
    component: () => import('../components/AdminLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'AdminDashboard', component: () => import('../views/admin/AdminDashboard.vue'), meta: { title: '控制台', icon: '📊', perm: 'dashboard:read' } },
      { path: 'users', name: 'AdminUsers', component: () => import('../views/admin/AdminUsers.vue'), meta: { title: '用户管理', icon: '👥', perm: 'user:read' } },
      { path: 'orders', name: 'AdminOrders', component: () => import('../views/admin/AdminOrders.vue'), meta: { title: '订单管理', icon: '📦', perm: 'order:read' } },
      { path: 'finance', name: 'AdminFinance', component: () => import('../views/admin/AdminFinance.vue'), meta: { title: '财务管理', icon: '💵', perm: 'finance:read' } },
      { path: 'posts', name: 'AdminPosts', component: () => import('../views/admin/AdminPosts.vue'), meta: { title: '帖子管理', icon: '📝', perm: 'post:read' } },
      { path: 'reports', name: 'AdminReports', component: () => import('../views/admin/AdminReports.vue'), meta: { title: '举报管理', icon: '⚠️', perm: 'report:read' } },
      { path: 'splash-carousel', name: 'AdminSplashCarousel', component: () => import('../views/admin/AdminSplashCarousel.vue'), meta: { title: '开屏&轮播管理', icon: '📱', perm: 'splash:read' } },
      { path: 'gift-management', name: 'AdminGiftManagement', component: () => import('../views/admin/AdminGifts.vue'), meta: { title: '礼物管理', icon: '🎁', perm: 'gift:read' } },
      { path: 'cards', name: 'AdminCards', component: () => import('../views/admin/AdminCards.vue'), meta: { title: '卡密管理', icon: '🎫', perm: 'card:read' } },
      { path: 'games', name: 'AdminGames', component: () => import('../views/admin/AdminGames.vue'), meta: { title: '服务分类', icon: '🎮', perm: 'game:read' } },
      { path: 'recommend', name: 'AdminRecommend', component: () => import('../views/admin/AdminRecommend.vue'), meta: { title: '热门推荐', icon: '🌟', perm: 'recommend:read' } },
      { path: 'companion-applications', name: 'AdminCompanionApplications', component: () => import('../views/admin/AdminCompanionApps.vue'), meta: { title: '服务申请管理', icon: '📋', perm: 'companion:read' } },
      { path: 'virtual-users', name: 'AdminVirtualUsers', component: () => import('../views/admin/AdminVirtualUsers.vue'), meta: { title: '虚拟机器人管理', icon: '🤖', perm: 'virtual:read' } },
      { path: 'admins', name: 'AdminAdmins', component: () => import('../views/admin/AdminAdmins.vue'), meta: { title: '管理员管理', icon: '👨‍💼', hidden: true, perm: 'admin:write' } },
      { path: 'roles', name: 'AdminRoles', component: () => import('../views/admin/AdminRoles.vue'), meta: { title: '角色管理', icon: '🔑', hidden: true, perm: 'admin:write' } },
      { path: 'settings', name: 'AdminSettings', component: () => import('../views/admin/AdminSettings.vue'), meta: { title: '系统设置', icon: '⚙️', perm: 'settings:read' } },
      { path: 'api', name: 'AdminApi', component: () => import('../views/admin/AdminApi.vue'), meta: { title: '接口管理', icon: '🔌', perm: 'api:read' } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

const isAdminToken = (token) => {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(window.atob(b64))
    return !!(payload && (payload.role === 'admin' || payload.role_id === 1))
  } catch (e) {
    return false
  }
}

// 读取本地存储的当前管理员权限（登录成功后写入 admin_user）
const getUserPerms = () => {
  try {
    const user = JSON.parse(localStorage.getItem('admin_user') || '{}')
    const perms = user.permissions || []
    return Array.isArray(perms) ? perms : []
  } catch (e) {
    return []
  }
}

const hasPerm = (perm) => {
  const perms = getUserPerms()
  if (perms.includes('all')) return true
  return perms.includes(perm)
}

router.beforeEach((to, from, next) => {
  if (to.path === '/login') {
    next()
    return
  }
  const adminToken = localStorage.getItem('admin_token')
  if (!adminToken || !isAdminToken(adminToken)) {
    next('/login')
    return
  }
  // 路由级权限校验：meta.perm 存在时必须拥有对应权限
  if (to.meta && to.meta.perm && !hasPerm(to.meta.perm)) {
    next('/403')
    return
  }
  next()
})

// 返回当前账号可访问的第一个页面（登录后跳转 / 403 页返回均用它，避免无权限时卡死在 /dashboard）
export const getFirstAccessiblePath = () => {
  const layout = routes.find(r => r.children)
  if (!layout) return '/403'
  const child = layout.children.find(c =>
    c.meta && c.meta.title && !c.meta.hidden && (!c.meta.perm || hasPerm(c.meta.perm))
  )
  return child ? `/${child.path}` : '/403'
}

export default router
