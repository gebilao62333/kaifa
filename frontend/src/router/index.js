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
    path: '/online-companions',
    name: 'OnlineCompanion',
    component: lazyLoad('OnlineCompanion'),
    meta: { title: '线上陪玩' }
  },
  {
    path: '/user/:id',
    name: 'UserProfile',
    component: lazyLoad('UserProfile'),
    meta: { title: '用户资料' }
  },
  {
    path: '/offline-companions',
    name: 'OfflineCompanion',
    component: lazyLoad('OfflineCompanion'),
    meta: { title: '线下陪玩' }
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
    path: '/customer-chat/:id',
    name: 'CustomerChat',
    component: lazyLoad('CustomerChat')
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
    path: '/notification-list',
    name: 'NotificationList',
    component: lazyLoad('NotificationList')
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
    component: lazyLoad('EditProfile')
  },
  {
    path: '/follows',
    name: 'Follows',
    component: lazyLoad('Follows')
  },
  {
    path: '/fans',
    name: 'Fans',
    component: lazyLoad('Fans')
  },
  {
    path: '/my-album',
    name: 'MyAlbum',
    component: lazyLoad('MyAlbum')
  },
  {
    path: '/my-reserve',
    name: 'MyReserve',
    component: lazyLoad('MyReserve')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: lazyLoad('Settings')
  },
  {
    path: '/customer-service',
    name: 'CustomerService',
    component: lazyLoad('CustomerService')
  },
  {
    path: '/about-us',
    name: 'AboutUs',
    component: lazyLoad('AboutUs')
  },
  {
    path: '/real-name',
    name: 'RealName',
    component: lazyLoad('RealName')
  },
  {
    path: '/feedback',
    name: 'Feedback',
    component: lazyLoad('Feedback')
  },
  {
    path: '/ai-chat/:id',
    name: 'AIChat',
    component: lazyLoad('AIChat')
  },
  {
    path: '/avatar-frame',
    name: 'AvatarFrame',
    component: lazyLoad('AvatarFrame')
  },
  {
    path: '/identity-badge',
    name: 'IdentityBadge',
    component: lazyLoad('IdentityBadge')
  },
  {
    path: '/stealth-visit',
    name: 'StealthVisit',
    component: lazyLoad('StealthVisit')
  },
  {
    path: '/level-acceleration',
    name: 'LevelAcceleration',
    component: lazyLoad('LevelAcceleration')
  },
  {
    path: '/priority-matching',
    name: 'PriorityMatching',
    component: lazyLoad('PriorityMatching')
  },
  {
    path: '/skin-shop',
    name: 'SkinShop',
    component: lazyLoad('SkinShop')
  },
  {
    path: '/virtual-users',
    name: 'VirtualUsers',
    component: lazyLoad('VirtualUserList')
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

router.beforeEach((to, from, next) => {
  // 登录页始终可访问
  if (to.path === '/login') {
    next()
    return
  }

  // 公开路径白名单（无需登录即可访问）
  const publicExactPaths = [
    '/', '/home', '/search', '/activity', '/preferred',
    '/friend', '/about-us', '/game-index', '/paidan', '/team-index'
  ]
  const publicPrefixes = ['/user/', '/post-detail/', '/project/']

  if (publicExactPaths.includes(to.path) || publicPrefixes.some(p => to.path.startsWith(p))) {
    next()
    return
  }

  // 其余所有页面需要登录
  const token = localStorage.getItem('token')
  if (!token) {
    console.warn('[Router] 未登录，重定向到登录页:', to.path)
    next('/login')
    return
  }

  next()
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
