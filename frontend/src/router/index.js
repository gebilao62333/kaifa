import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user-info'
import { PUBLIC_ROUTE_NAMES, isPublicPath, STORAGE_KEYS } from '../common/constants'

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
    component: lazyLoad('CompanionApply'),
    meta: { requiresAuth: true }
  },
  {
    path: '/companion-list',
    name: 'CompanionList',
    component: lazyLoad('CompanionList'),
    meta: {
      requiresAuth: true,
      title: '陪玩列表'
    }
  },
  {
    path: '/post-detail/:id',
    name: 'PostDetail',
    component: lazyLoad('PostDetail')
  },
  {
    path: '/publish-post',
    name: 'PublishPost',
    component: lazyLoad('PublishPost'),
    meta: { requiresAuth: true }
  },
  {
    path: '/publish-demand',
    name: 'PublishDemand',
    component: lazyLoad('PublishDemand'),
    meta: {
      requiresAuth: true,
      title: '发布需求'
    }
  },
  {
    path: '/chat-room/:id',
    name: 'ChatRoom',
    component: lazyLoad('ChatRoom'),
    meta: {
      requiresAuth: true,
      fullscreen: true
    }
  },
  {
    path: '/recharge',
    name: 'Recharge',
    component: lazyLoad('Recharge'),
    meta: { requiresAuth: true }
  },
  {
    path: '/vip-center',
    name: 'VipCenter',
    component: lazyLoad('VipCenter'),
    meta: { requiresAuth: true }
  },
  {
    path: '/game-index',
    name: 'GameIndex',
    component: lazyLoad('GameIndex'),
    meta: { requiresAuth: true }
  },
  {
    path: '/paidan',
    name: 'Paidan',
    component: lazyLoad('Paidan'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-services',
    name: 'MyServices',
    component: lazyLoad('MyServices'),
    meta: { requiresAuth: true }
  },
  {
    path: '/wallet',
    name: 'Wallet',
    component: lazyLoad('Wallet'),
    meta: { requiresAuth: true }
  },
  {
    path: '/card-recharge',
    name: 'CardRecharge',
    component: lazyLoad('CardRecharge'),
    meta: {
      requiresAuth: true,
      title: '卡密充值'
    }
  },
  {
    path: '/my-order',
    name: 'MyOrder',
    component: lazyLoad('MyOrder'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-dynamic',
    name: 'MyDynamic',
    component: lazyLoad('MyDynamic'),
    meta: { requiresAuth: true }
  },
  {
    path: '/income-records',
    name: 'IncomeRecords',
    component: lazyLoad('IncomeRecords'),
    meta: { requiresAuth: true }
  },
  {
    path: '/expense-records',
    name: 'ExpenseRecords',
    component: lazyLoad('ExpenseRecords'),
    meta: { requiresAuth: true }
  },
  {
    path: '/withdraw-records',
    name: 'WithdrawRecords',
    component: lazyLoad('WithdrawRecords'),
    meta: { requiresAuth: true }
  },
  {
    path: '/withdraw',
    name: 'Withdraw',
    component: lazyLoad('Withdraw'),
    meta: { requiresAuth: true }
  },
  {
    path: '/payment-gateway',
    name: 'PaymentGateway',
    component: lazyLoad('PaymentGateway'),
    meta: { requiresAuth: true }
  },
  {
    path: '/likes-records',
    name: 'LikesRecords',
    component: lazyLoad('LikesRecords'),
    meta: { requiresAuth: true }
  },
  {
    path: '/visitors-records',
    name: 'VisitedRecords',
    component: lazyLoad('VisitedRecords'),
    meta: { requiresAuth: true }
  },
  {
    path: '/edit-profile',
    name: 'EditProfile',
    component: lazyLoad('EditProfile'),
    meta: {
      requiresAuth: true,
      title: '编辑资料'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: lazyLoad('Settings'),
    meta: {
      requiresAuth: true,
      title: '设置'
    }
  },
  {
    path: '/my-album',
    name: 'MyAlbum',
    component: lazyLoad('MyAlbum'),
    meta: {
      requiresAuth: true,
      title: '我的相册'
    }
  },
  {
    path: '/my-reserve',
    name: 'MyReserve',
    component: lazyLoad('MyReserve'),
    meta: {
      requiresAuth: true,
      title: '我的预约'
    }
  },
  {
    path: '/my-reports',
    name: 'MyReports',
    component: lazyLoad('MyReports'),
    meta: {
      requiresAuth: true,
      title: '我的举报'
    }
  },
  {
    path: '/real-name',
    name: 'RealName',
    component: lazyLoad('RealName'),
    meta: {
      requiresAuth: true,
      title: '实名认证'
    }
  },
  {
    path: '/feedback',
    name: 'Feedback',
    component: lazyLoad('Feedback'),
    meta: {
      requiresAuth: true,
      title: '意见反馈'
    }
  },
  {
    path: '/about-us',
    name: 'AboutUs',
    component: lazyLoad('AboutUs'),
    meta: {
      requiresAuth: true,
      title: '关于我们'
    }
  },
  {
    path: '/follows',
    name: 'Follows',
    component: lazyLoad('Follows'),
    meta: {
      requiresAuth: true,
      title: '我的关注'
    }
  },
  {
    path: '/fans',
    name: 'Fans',
    component: lazyLoad('Fans'),
    meta: {
      requiresAuth: true,
      title: '我的粉丝'
    }
  },
  {
    path: '/user/:id',
    name: 'UserProfile',
    component: lazyLoad('UserProfile'),
    meta: {
      requiresAuth: true,
      title: '用户资料'
    }
  },
  {
    path: '/call/:id/video',
    name: 'VideoCall',
    component: lazyLoad('VideoCall'),
    meta: {
      requiresAuth: true,
      title: '视频通话', fullscreen: true
    }
  },
  {
    path: '/call/:id/audio',
    name: 'AudioCall',
    component: lazyLoad('AudioCall'),
    meta: {
      requiresAuth: true,
      title: '语音通话', fullscreen: true
    }
  },
  {
    path: '/customer-service',
    name: 'CustomerService',
    component: lazyLoad('CustomerService'),
    meta: {
      requiresAuth: true,
      title: '在线客服', fullscreen: true
    }
  },
  {
    path: '/level-acceleration',
    name: 'LevelAcceleration',
    component: lazyLoad('LevelAcceleration'),
    meta: {
      requiresAuth: true,
      title: '等级加速'
    }
  },
  {
    path: '/identity-badge',
    name: 'IdentityBadge',
    component: lazyLoad('IdentityBadge'),
    meta: {
      requiresAuth: true,
      title: '身份标识'
    }
  },
  {
    path: '/avatar-frame',
    name: 'AvatarFrame',
    component: lazyLoad('AvatarFrame'),
    meta: {
      requiresAuth: true,
      title: '专属头像框'
    }
  },
  {
    path: '/stealth-visit',
    name: 'StealthVisit',
    component: lazyLoad('StealthVisit'),
    meta: {
      requiresAuth: true,
      title: '隐身访问'
    }
  },
  {
    path: '/priority-matching',
    name: 'PriorityMatching',
    component: lazyLoad('PriorityMatching'),
    meta: {
      requiresAuth: true,
      title: '优先匹配'
    }
  },
  {
    path: '/skin-shop',
    name: 'SkinShop',
    component: lazyLoad('SkinShop'),
    meta: {
      requiresAuth: true,
      title: '装扮商城'
    }
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
  },
  {
    // 404 兜底：已登录/未登录都渲染 404 页，避免白屏（F-04）
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: lazyLoad('NotFound'),
    meta: { title: '页面不存在' }
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
  const userStore = useUserStore()

  // 显式声明需要登录的路由：meta.requiresAuth === true（F-09）
  const requiresAuth = to.meta?.requiresAuth === true

  // 公开白名单仅作防御性兜底；匹配使用边界精确规则，避免 '/loginXXX' 被误判为公开路径（F-20）
  const isPublicRoute = PUBLIC_ROUTE_NAMES.includes(to.name) || isPublicPath(to.path)

  if (import.meta.env.DEV && requiresAuth && isPublicRoute) {
    console.warn(`[router] 路由 "${String(to.name)}" 同时命中公开白名单，请确认 requiresAuth 是否正确`)
  }

  const needsAuth = requiresAuth || !isPublicRoute

  // 获取有效 token
  const rawToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
  const storeToken = userStore.token
  const validToken = rawToken && rawToken !== 'undefined' && rawToken !== 'null' ? rawToken : storeToken
  const isLoggedIn = !!validToken

  // 需要鉴权：显式 requiresAuth 或未被公开白名单覆盖
  if (needsAuth && !isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} - eu搭子`
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
