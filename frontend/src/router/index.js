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
    component: lazyLoad('Login'),
    meta: { fullscreen: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: lazyLoad('Home'),
    meta: { preload: ['Login', 'Search'] }
  },
  {
    path: '/search',
    name: 'Search',
    component: lazyLoad('Search')
  },
  {
    path: '/square',
    name: 'Square',
    component: lazyLoad('Square'),
    meta: { title: '广场' }
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
    path: '/companion-list',
    name: 'CompanionList',
    component: lazyLoad('CompanionList'),
    meta: { title: '陪玩列表' }
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
    component: lazyLoad('ChatRoom'),
    meta: { fullscreen: true }
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
    path: '/card-recharge',
    name: 'CardRecharge',
    component: lazyLoad('CardRecharge'),
    meta: { title: '卡密充值' }
  },
  {
    path: '/my-order',
    name: 'MyOrder',
    component: lazyLoad('MyOrder')
  },
  {
    path: '/project/dashboard',
    name: 'ServiceDashboard',
    component: lazyLoad('ServiceDashboard'),
    meta: { fullscreen: true }
  },
  {
    path: '/project/list',
    name: 'ServiceList',
    component: lazyLoad('ServiceList'),
    meta: { fullscreen: true }
  },
  {
    path: '/project/create',
    name: 'ServiceCreate',
    component: lazyLoad('ServiceList'),
    meta: { fullscreen: true }
  },
  {
    path: '/project/:id',
    name: 'ServiceDetail',
    component: lazyLoad('ServiceDetail'),
    meta: { fullscreen: true }
  },
  {
    path: '/project/edit/:id',
    name: 'ServiceEdit',
    component: lazyLoad('ServiceDetail'),
    meta: { fullscreen: true }
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
    meta: { title: '视频通话', fullscreen: true }
  },
  {
    path: '/call/:id/audio',
    name: 'AudioCall',
    component: lazyLoad('AudioCall'),
    meta: { title: '语音通话', fullscreen: true }
  },
  {
    path: '/customer-service',
    name: 'CustomerService',
    component: lazyLoad('CustomerService'),
    meta: { title: '在线客服', fullscreen: true }
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
    meta: { title: 'AI陪聊', requiresAuth: true, fullscreen: true }
  },
  {
    path: '/ai-chat/:id',
    name: 'AIChat',
    component: lazyLoad('AIChat'),
    meta: { title: 'AI聊天', requiresAuth: true, fullscreen: true }
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

const publicRoutes = ['Login', 'Home', 'Search', 'Square', 'PostDetail', 'Preferred', 'Mine', 'Friend']
const publicPaths = ['/', '/login', '/home', '/search', '/square', '/friend']

router.beforeEach((to, from, next) => {
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
