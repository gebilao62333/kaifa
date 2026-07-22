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
      { path: 'dashboard', name: 'AdminDashboard', component: () => import('../views/admin/AdminDashboard.vue'), meta: { title: '控制台', icon: '📊' } },
      { path: 'users', name: 'AdminUsers', component: () => import('../views/admin/AdminUsers.vue'), meta: { title: '用户管理', icon: '👥' } },
      { path: 'orders', name: 'AdminOrders', component: () => import('../views/admin/AdminOrders.vue'), meta: { title: '订单管理', icon: '📦' } },
      { path: 'withdraws', name: 'AdminWithdraws', component: () => import('../views/admin/AdminWithdraws.vue'), meta: { title: '提现记录', icon: '💰' } },
      { path: 'withdraw', name: 'AdminWithdraw', component: () => import('../views/AdminWithdraw.vue'), meta: { title: '提现审核', icon: '💸' } },
      { path: 'posts', name: 'AdminPosts', component: () => import('../views/admin/AdminPosts.vue'), meta: { title: '帖子管理', icon: '📝' } },
      { path: 'reports', name: 'AdminReports', component: () => import('../views/admin/AdminReports.vue'), meta: { title: '举报管理', icon: '⚠️' } },
      { path: 'banners', name: 'AdminBanners', component: () => import('../views/admin/AdminBanners.vue'), meta: { title: 'Banner管理', icon: '🎪' } },
      { path: 'vip-packages', name: 'AdminVipPackages', component: () => import('../views/admin/AdminVipPackages.vue'), meta: { title: 'VIP套餐管理', icon: '⭐' } },
      { path: 'gift-management', name: 'AdminGiftManagement', component: () => import('../views/admin/AdminGifts.vue'), meta: { title: '礼物管理', icon: '🎁' } },
      { path: 'gifts', name: 'AdminGifts', component: () => import('../views/admin/AdminGiftLogs.vue'), meta: { title: '礼物记录', icon: '📜' } },
      { path: 'recharges', name: 'AdminRecharges', component: () => import('../views/admin/AdminRecharges.vue'), meta: { title: '充值记录', icon: '💳' } },
      { path: 'cards', name: 'AdminCards', component: () => import('../views/admin/AdminCards.vue'), meta: { title: '卡密管理', icon: '🎫' } },
      { path: 'games', name: 'AdminGames', component: () => import('../views/admin/AdminGames.vue'), meta: { title: '服务分类', icon: '🎮' } },
      { path: 'recommend', name: 'AdminRecommend', component: () => import('../views/admin/AdminRecommend.vue'), meta: { title: '热门推荐', icon: '🌟' } },
      { path: 'companion-applications', name: 'AdminCompanionApplications', component: () => import('../views/admin/AdminCompanionApps.vue'), meta: { title: '服务申请管理', icon: '📋' } },
      { path: 'virtual-users', name: 'AdminVirtualUsers', component: () => import('../views/admin/AdminVirtualUsers.vue'), meta: { title: '虚拟机器人管理', icon: '🤖' } },
      { path: 'admins', name: 'AdminAdmins', component: () => import('../views/admin/AdminAdmins.vue'), meta: { title: '管理员管理', icon: '👨‍💼' } },
      { path: 'roles', name: 'AdminRoles', component: () => import('../views/admin/AdminRoles.vue'), meta: { title: '角色管理', icon: '🔑' } },
      { path: 'settings', name: 'AdminSettings', component: () => import('../views/admin/AdminSettings.vue'), meta: { title: '系统设置', icon: '⚙️' } },
      { path: 'api', name: 'AdminApi', component: () => import('../views/admin/AdminApi.vue'), meta: { title: '接口管理', icon: '🔌' } }
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
