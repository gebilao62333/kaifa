import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'AdminLogin',
    component: () => import('../views/AdminLogin.vue')
  },
  {
    path: '/',
    component: () => import('../components/AdminLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'AdminDashboard', component: () => import('../views/admin/AdminDashboard.vue') },
      { path: 'users', name: 'AdminUsers', component: () => import('../views/admin/AdminUsers.vue') },
      { path: 'orders', name: 'AdminOrders', component: () => import('../views/admin/AdminOrders.vue') },
      { path: 'withdraws', name: 'AdminWithdraws', component: () => import('../views/admin/AdminWithdraws.vue') },
      { path: 'withdraw', name: 'AdminWithdraw', component: () => import('../views/AdminWithdraw.vue') },
      { path: 'posts', name: 'AdminPosts', component: () => import('../views/admin/AdminPosts.vue') },
      { path: 'reports', name: 'AdminReports', component: () => import('../views/admin/AdminReports.vue') },
      { path: 'banners', name: 'AdminBanners', component: () => import('../views/admin/AdminBanners.vue') },
      { path: 'vip-packages', name: 'AdminVipPackages', component: () => import('../views/admin/AdminVipPackages.vue') },
      { path: 'gift-management', name: 'AdminGiftManagement', component: () => import('../views/admin/AdminGifts.vue') },
      { path: 'gifts', name: 'AdminGifts', component: () => import('../views/admin/AdminGiftLogs.vue') },
      { path: 'recharges', name: 'AdminRecharges', component: () => import('../views/admin/AdminRecharges.vue') },
      { path: 'cards', name: 'AdminCards', component: () => import('../views/admin/AdminCards.vue') },
      { path: 'games', name: 'AdminGames', component: () => import('../views/admin/AdminGames.vue') },
      { path: 'recommend', name: 'AdminRecommend', component: () => import('../views/admin/AdminRecommend.vue') },
      { path: 'companion-applications', name: 'AdminCompanionApplications', component: () => import('../views/admin/AdminCompanionApps.vue') },
      { path: 'virtual-users', name: 'AdminVirtualUsers', component: () => import('../views/admin/AdminVirtualUsers.vue') },
      { path: 'admins', name: 'AdminAdmins', component: () => import('../views/admin/AdminAdmins.vue') },
      { path: 'roles', name: 'AdminRoles', component: () => import('../views/admin/AdminRoles.vue') },
      { path: 'settings', name: 'AdminSettings', component: () => import('../views/admin/AdminSettings.vue') },
      { path: 'api', name: 'AdminApi', component: () => import('../views/admin/AdminApi.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

const isAdminToken = (token) => {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(decodeURIComponent(escape(window.atob(b64))))
    return !!(payload && (payload.role === 'admin' || payload.role_id === 1))
  } catch (e) {
    return false
  }
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
  next()
})

export default router
