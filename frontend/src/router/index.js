import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user-info'

const lazyLoad = (view) => {
  return () => import(`../views/${view}.vue`)
}

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'Login',
    component: lazyLoad('Login')
  },
  {
    path: '/home',
    name: 'Home',
    component: lazyLoad('Home'),
    meta: { preload: ['Login', 'Search', 'Activity'] }
  },
  {
    path: '/search',
    name: 'Search',
    component: lazyLoad('Search')
  },
  {
    path: '/activity',
    name: 'Activity',
    component: lazyLoad('Activity')
  },
  {
    path: '/preferred',
    name: 'Preferred',
    component: lazyLoad('Preferred')
  },
  {
    path: '/mine',
    name: 'Mine',
    component: lazyLoad('Mine')
  },
  {
    path: '/friend',
    name: 'Friend',
    component: lazyLoad('ChatUsers')
  },
  {
    path: '/companion-apply',
    name: 'CompanionApply',
    component: lazyLoad('CompanionApply')
  },
  {
    path: '/post-detail/:id',
    name: 'PostDetail',
    component: lazyLoad('PostDetail')
  },
  {
    path: '/publish-post',
    name: 'PublishPost',
    component: lazyLoad('PublishPost')
  },
  {
    path: '/publish-demand',
    name: 'PublishDemand',
    component: lazyLoad('PublishDemand'),
    meta: { title: '发布需求' }
  },
  {
    path: '/chat-room/:id',
    name: 'ChatRoom',
    component: lazyLoad('ChatRoom')
  },
  {
    path: '/recharge',
    name: 'Recharge',
    component: lazyLoad('Recharge')
  },
  {
    path: '/vip-center',
    name: 'VipCenter',
    component: lazyLoad('VipCenter')
  },
  {
    path: '/game-index',
    name: 'GameIndex',
    component: lazyLoad('GameIndex')
  },
  {
    path: '/paidan',
    name: 'Paidan',
    component: lazyLoad('Paidan')
  },
  {
    path: '/my-services',
    name: 'MyServices',
    component: lazyLoad('MyServices')
  },
  {
    path: '/wallet',
    name: 'Wallet',
    component: lazyLoad('Wallet')
  },
  {
    path: '/my-order',
    name: 'MyOrder',
    component: lazyLoad('MyOrder')
  },
  {
    path: '/team-index',
    name: 'TeamIndex',
    component: lazyLoad('TeamIndex')
  },
  {
    path: '/project/dashboard',
    name: 'ServiceDashboard',
    component: lazyLoad('ServiceDashboard')
  },
  {
    path: '/project/list',
    name: 'ServiceList',
    component: lazyLoad('ServiceList')
  },
  {
    path: '/project/create',
    name: 'ServiceCreate',
    component: lazyLoad('ServiceList')
  },
  {
    path: '/project/:id',
    name: 'ServiceDetail',
    component: lazyLoad('ServiceDetail')
  },
  {
    path: '/project/edit/:id',
    name: 'ServiceEdit',
    component: lazyLoad('ServiceDetail')
  },
  {
    path: '/my-dynamic',
    name: 'MyDynamic',
    component: lazyLoad('MyDynamic')
  },
  {
    path: '/income-records',
    name: 'IncomeRecords',
    component: lazyLoad('IncomeRecords')
  },
  {
    path: '/expense-records',
    name: 'ExpenseRecords',
    component: lazyLoad('ExpenseRecords')
  },
  {
    path: '/withdraw-records',
    name: 'WithdrawRecords',
    component: lazyLoad('WithdrawRecords')
  },
  {
    path: '/withdraw',
    name: 'Withdraw',
    component: lazyLoad('Withdraw')
  },
  {
    path: '/payment-gateway',
    name: 'PaymentGateway',
    component: lazyLoad('PaymentGateway')
  },
  {
    path: '/likes-records',
    name: 'LikesRecords',
    component: lazyLoad('LikesRecords')
  },
  {
    path: '/visitors-records',
    name: 'VisitedRecords',
    component: lazyLoad('VisitedRecords')
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: lazyLoad('AdminLogin')
  },
  {
    path: '/admin',
    redirect: '/admin/dashboard'
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/orders',
    name: 'AdminOrders',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/withdraws',
    name: 'AdminWithdraws',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/withdraw',
    name: 'AdminWithdraw',
    component: lazyLoad('AdminWithdraw')
  },
  {
    path: '/admin/posts',
    name: 'AdminPosts',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/reports',
    name: 'AdminReports',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/banners',
    name: 'AdminBanners',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/vip-packages',
    name: 'AdminVipPackages',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/gift-management',
    name: 'AdminGiftManagement',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/gifts',
    name: 'AdminGifts',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/recharges',
    name: 'AdminRecharges',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/games',
    name: 'AdminGames',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/recommend',
    name: 'AdminRecommend',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/companion-applications',
    name: 'AdminCompanionApplications',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/virtual-users',
    name: 'AdminVirtualUsers',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/admins',
    name: 'AdminAdmins',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/roles',
    name: 'AdminRoles',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/settings',
    name: 'AdminSettings',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/admin/api',
    name: 'AdminApi',
    component: lazyLoad('AdminDashboard')
  },
  {
    path: '/edit-profile',
    name: 'EditProfile',
    component: lazyLoad('EditProfile'),
    meta: { title: '编辑资料' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: lazyLoad('Settings'),
    meta: { title: '设置' }
  },
  {
    path: '/my-album',
    name: 'MyAlbum',
    component: lazyLoad('MyAlbum'),
    meta: { title: '我的相册' }
  },
  {
    path: '/my-reserve',
    name: 'MyReserve',
    component: lazyLoad('MyReserve'),
    meta: { title: '我的预约' }
  },
  {
    path: '/real-name',
    name: 'RealName',
    component: lazyLoad('RealName'),
    meta: { title: '实名认证' }
  },
  {
    path: '/feedback',
    name: 'Feedback',
    component: lazyLoad('Feedback'),
    meta: { title: '意见反馈' }
  },
  {
    path: '/about-us',
    name: 'AboutUs',
    component: lazyLoad('AboutUs'),
    meta: { title: '关于我们' }
  },
  {
    path: '/follows',
    name: 'Follows',
    component: lazyLoad('Follows'),
    meta: { title: '我的关注' }
  },
  {
    path: '/fans',
    name: 'Fans',
    component: lazyLoad('Fans'),
    meta: { title: '我的粉丝' }
  },
  {
    path: '/user/:id',
    name: 'UserProfile',
    component: lazyLoad('UserProfile'),
    meta: { title: '用户资料' }
  },
  {
    path: '/call/:id/video',
    name: 'VideoCall',
    component: lazyLoad('VideoCall'),
    meta: { title: '视频通话' }
  },
  {
    path: '/call/:id/audio',
    name: 'AudioCall',
    component: lazyLoad('AudioCall'),
    meta: { title: '语音通话' }
  },
  {
    path: '/customer-service',
    name: 'CustomerService',
    component: lazyLoad('CustomerService'),
    meta: { title: '在线客服' }
  },
  {
    path: '/level-acceleration',
    name: 'LevelAcceleration',
    component: lazyLoad('LevelAcceleration'),
    meta: { title: '等级加速' }
  },
  {
    path: '/identity-badge',
    name: 'IdentityBadge',
    component: lazyLoad('IdentityBadge'),
    meta: { title: '身份标识' }
  },
  {
    path: '/avatar-frame',
    name: 'AvatarFrame',
    component: lazyLoad('AvatarFrame'),
    meta: { title: '专属头像框' }
  },
  {
    path: '/stealth-visit',
    name: 'StealthVisit',
    component: lazyLoad('StealthVisit'),
    meta: { title: '隐身访问' }
  },
  {
    path: '/priority-matching',
    name: 'PriorityMatching',
    component: lazyLoad('PriorityMatching'),
    meta: { title: '优先匹配' }
  },
  {
    path: '/skin-shop',
    name: 'SkinShop',
    component: lazyLoad('SkinShop'),
    meta: { title: '装扮商城' }
  },
  {
    path: '/ai-chat',
    name: 'VirtualUserList',
    component: lazyLoad('VirtualUserList'),
    meta: { title: 'AI陪聊', requiresAuth: true }
  },
  {
    path: '/ai-chat/:id',
    name: 'AIChat',
    component: lazyLoad('AIChat'),
    meta: { title: 'AI聊天', requiresAuth: true }
  },
  {
    path: '/tag-manager',
    name: 'TagManager',
    component: lazyLoad('TagManager'),
    meta: { title: '标签管理', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

const publicRoutes = ['Login', 'Home', 'Search', 'Activity', 'PostDetail', 'Preferred', 'Mine', 'Friend', 'AdminLogin']
const publicPaths = ['/', '/login', '/home', '/search', '/activity', '/friend']

router.beforeEach((to, from, next) => {
  if (to.path.startsWith('/admin')) {
    if (to.path === '/admin/login') {
      next()
      return
    }
    const adminToken = localStorage.getItem('admin_token')
    if (!adminToken) {
      next('/admin/login')
      return
    }
    next()
    return
  }
  
  const userStore = useUserStore()
  const isPublicRoute = publicRoutes.includes(to.name) || publicPaths.includes(to.path)
  
  const rawToken = localStorage.getItem('token')
  const storeToken = userStore.token
  const validToken = rawToken && rawToken !== 'undefined' && rawToken !== 'null' ? rawToken : storeToken
  const isLoggedIn = !!validToken

  if (!isPublicRoute && !isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 多客陪玩`
  }

  if (to.meta?.preload) {
    to.meta.preload.forEach(viewName => {
      if (viewName !== to.name) {
        const preloadComponent = () => import(`../views/${viewName}.vue`)
        preloadComponent()
      }
    })
  }
})

export default router
