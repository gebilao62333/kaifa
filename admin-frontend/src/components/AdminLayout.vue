<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>管理后台</h2>
      </div>
      <nav class="menu">
        <router-link v-for="item in menuItems" :key="item.page" :to="item.path"
          :class="['menu-item', { active: isActive(item.page) }]">
          <span class="menu-icon">{{ item.icon }}</span> {{ item.label }}
        </router-link>
      </nav>
    </aside>

    <main class="main-content">
      <div class="top-bar">
        <div class="title">
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="user-info">
          <button @click="handleLogout" class="logout-btn">退出登录</button>
        </div>
      </div>
      <div class="content">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const menuItems = [
  { page: 'dashboard', path: '/dashboard', icon: '📊', label: '控制台' },
  { page: 'users', path: '/users', icon: '👥', label: '用户管理' },
  { page: 'recommend', path: '/recommend', icon: '🌟', label: '热门推荐' },
  { page: 'orders', path: '/orders', icon: '📦', label: '订单管理' },
  { page: 'withdraw', path: '/withdraw', icon: '💸', label: '提现审核' },
  { page: 'withdraws', path: '/withdraws', icon: '💰', label: '提现记录' },
  { page: 'posts', path: '/posts', icon: '📝', label: '帖子管理' },
  { page: 'reports', path: '/reports', icon: '⚠️', label: '举报管理' },
  { page: 'banners', path: '/banners', icon: '🎪', label: 'Banner管理' },
  { page: 'vip-packages', path: '/vip-packages', icon: '⭐', label: 'VIP套餐管理' },
  { page: 'gift-management', path: '/gift-management', icon: '🎁', label: '礼物管理' },
  { page: 'gifts', path: '/gifts', icon: '📜', label: '礼物记录' },
  { page: 'recharges', path: '/recharges', icon: '💳', label: '充值记录' },
  { page: 'cards', path: '/cards', icon: '🎫', label: '卡密管理' },
  { page: 'games', path: '/games', icon: '🎮', label: '服务分类' },
  { page: 'companion-applications', path: '/companion-applications', icon: '📋', label: '服务申请管理' },
  { page: 'virtual-users', path: '/virtual-users', icon: '🤖', label: '虚拟机器人管理' },
  { page: 'admins', path: '/admins', icon: '👨‍💼', label: '管理员管理' },
  { page: 'roles', path: '/roles', icon: '🔑', label: '角色管理' },
  { page: 'api', path: '/api', icon: '🔌', label: '接口管理' },
  { page: 'settings', path: '/settings', icon: '⚙️', label: '系统设置' },
]

const pageTitleMap = {
  'dashboard': '控制台',
  'users': '用户管理',
  'recommend': '热门推荐',
  'orders': '订单管理',
  'withdraw': '提现审核',
  'withdraws': '提现记录',
  'posts': '帖子管理',
  'reports': '举报管理',
  'banners': 'Banner管理',
  'vip-packages': 'VIP套餐管理',
  'gift-management': '礼物管理',
  'gifts': '礼物记录',
  'recharges': '充值记录',
  'cards': '卡密管理',
  'games': '服务分类',
  'companion-applications': '服务申请管理',
  'virtual-users': '虚拟机器人管理',
  'admins': '管理员管理',
  'roles': '角色管理',
  'api': '接口管理',
  'settings': '系统设置',
}

const isActive = (page) => {
  const item = menuItems.find(m => m.page === page)
  if (!item) return false
  return route.path === item.path || route.path.startsWith(item.path + '/')
}

const pageTitle = computed(() => {
  for (const item of menuItems) {
    if (route.path.startsWith(item.path)) return item.label
  }
  return '管理后台'
})

const handleLogout = () => {
  localStorage.removeItem('admin_token')
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100dvh;
  background: #f0f2f5;
}

.sidebar {
  width: 240px;
  background: #001529;
  color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  overflow-y: auto;
  z-index: 100;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.menu {
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  cursor: pointer;
}

.menu-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.menu-item.active {
  color: #fff;
  background: #1890ff;
}

.menu-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.main-content {
  flex: 1;
  margin-left: 240px;
  min-height: 100dvh;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 50;
}

.top-bar h1 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logout-btn {
  padding: 6px 16px;
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.logout-btn:hover {
  background: #ff7875;
}

.content {
  padding: 24px;
}

@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }

  .sidebar-header {
    display: none;
  }

  .menu-item {
    justify-content: center;
    padding: 14px 0;
  }

  .menu-item span:last-child {
    display: none;
  }

  .menu-icon {
    font-size: 18px;
  }

  .main-content {
    margin-left: 60px;
  }
}
</style>
