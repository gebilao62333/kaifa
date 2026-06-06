import adminRoutes from './admin'
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
    path: '/likes-records',
    name: 'LikesRecords',
    component: lazyLoad('LikesRecords')
  },
  {
    path: '/visitors-records',
    name: 'VisitedRecords',
    component: lazyLoad('VisitedRecords')
  },
  ...adminRoutes
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

const publicRoutes = ['Login', 'Home', 'Search', 'Activity', 'PostDetail', 'Preferred', 'Mine', 'Friend']
const publicPaths = ['/', '/login', '/home', '/search', '/activity', '/friend']

router.beforeEach((to, from, next) => {
  if (to.path.startsWith('/admin')) {
    // 管理员登录页不需要token
    if (to.path === '/admin/login') {
      next()
      return
    }
    const adminToken = localStorage.getItem('admin_token')
    if (!adminToken) {
      console.warn('[Router] 管理员未登录，跳转到登录页')
      next('/admin/login')
      return
    }
    next()
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
