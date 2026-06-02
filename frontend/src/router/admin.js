const AdminLayout = () => import('../views/admin/AdminLayout.vue')
const lazyLoad = (view) => () => import(`../views/admin/pages/${view}.vue`)

const adminRoutes = [
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/admin/Login.vue')
  },
  {
    path: '/admin/withdraw',
    name: 'AdminWithdraw',
    component: () => import('../views/admin/Withdraw.vue')
  },
  {
    path: '/admin',
    component: AdminLayout,
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: lazyLoad('Dashboard')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: lazyLoad('Users')
      },
      {
        path: 'recommend',
        name: 'AdminRecommend',
        component: lazyLoad('Recommend')
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: lazyLoad('Orders')
      },
      {
        path: 'withdraws',
        name: 'AdminWithdraws',
        component: lazyLoad('WithdrawManagement')
      },
      {
        path: 'posts',
        name: 'AdminPosts',
        component: lazyLoad('Posts')
      },
      {
        path: 'reports',
        name: 'AdminReports',
        component: lazyLoad('Reports')
      },
      {
        path: 'banners',
        name: 'AdminBanners',
        component: lazyLoad('Banners')
      },
      {
        path: 'vip-packages',
        name: 'AdminVipPackages',
        component: lazyLoad('VipPackages')
      },
      {
        path: 'gift-management',
        name: 'AdminGiftManagement',
        component: lazyLoad('GiftManagement')
      },
      {
        path: 'gifts',
        name: 'AdminGifts',
        component: lazyLoad('GiftRecords')
      },
      {
        path: 'recharges',
        name: 'AdminRecharges',
        component: lazyLoad('Recharges')
      },
      {
        path: 'games',
        name: 'AdminGames',
        component: lazyLoad('Games')
      },
      {
        path: 'companion-applications',
        name: 'AdminCompanionApplications',
        component: lazyLoad('CompanionApplications')
      },
      {
        path: 'virtual-users',
        name: 'AdminVirtualUsers',
        component: lazyLoad('VirtualUsers')
      },
      {
        path: 'admins',
        name: 'AdminAdmins',
        component: lazyLoad('AdminManagement')
      },
      {
        path: 'roles',
        name: 'AdminRoles',
        component: lazyLoad('Roles')
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: lazyLoad('Settings')
      },
      {
        path: 'api',
        name: 'AdminApi',
        component: lazyLoad('Api')
      }
    ]
  }
]

export default adminRoutes
