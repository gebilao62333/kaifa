<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>管理后台</h2>
      </div>
      <nav class="menu">
        <router-link to="/admin/dashboard" :class="['menu-item', { active: $route.path === '/admin/dashboard' }]">
          <span class="menu-icon">📊</span> 控制台
        </router-link>
        <router-link to="/admin/users" :class="['menu-item', { active: $route.path === '/admin/users' }]">
          <span class="menu-icon">👥</span> 用户管理
        </router-link>
        <router-link to="/admin/recommend" :class="['menu-item', { active: $route.path === '/admin/recommend' }]">
          <span class="menu-icon">🌟</span> 热门推荐
        </router-link>
        <router-link to="/admin/orders" :class="['menu-item', { active: $route.path === '/admin/orders' }]">
          <span class="menu-icon">📦</span> 订单管理
        </router-link>
        <router-link to="/admin/withdraws" :class="['menu-item', { active: $route.path === '/admin/withdraws' }]">
          <span class="menu-icon">💰</span> 提现管理
        </router-link>
        <router-link to="/admin/posts" :class="['menu-item', { active: $route.path === '/admin/posts' }]">
          <span class="menu-icon">📝</span> 帖子管理
        </router-link>
        <router-link to="/admin/reports" :class="['menu-item', { active: $route.path === '/admin/reports' }]">
          <span class="menu-icon">⚠️</span> 举报管理
        </router-link>
        <router-link to="/admin/banners" :class="['menu-item', { active: $route.path === '/admin/banners' }]">
          <span class="menu-icon">🎪</span> Banner管理
        </router-link>
        <router-link to="/admin/vip-packages" :class="['menu-item', { active: $route.path === '/admin/vip-packages' }]">
          <span class="menu-icon">⭐</span> VIP套餐管理
        </router-link>
        <router-link to="/admin/gift-management" :class="['menu-item', { active: $route.path === '/admin/gift-management' }]">
          <span class="menu-icon">🎁</span> 礼物管理
        </router-link>
        <router-link to="/admin/gifts" :class="['menu-item', { active: $route.path === '/admin/gifts' }]">
          <span class="menu-icon">📜</span> 礼物记录
        </router-link>
        <router-link to="/admin/recharges" :class="['menu-item', { active: $route.path === '/admin/recharges' }]">
          <span class="menu-icon">💳</span> 充值记录
        </router-link>
        <router-link to="/admin/games" :class="['menu-item', { active: $route.path === '/admin/games' }]">
          <span class="menu-icon">🎮</span> 服务分类
        </router-link>
        <router-link to="/admin/companion-applications" :class="['menu-item', { active: $route.path === '/admin/companion-applications' }]">
          <span class="menu-icon">📋</span> 服务申请管理
        </router-link>
        <router-link to="/admin/virtual-users" :class="['menu-item', { active: $route.path === '/admin/virtual-users' }]">
          <span class="menu-icon">🤖</span> 虚拟机器人管理
        </router-link>
        <router-link to="/admin/admins" :class="['menu-item', { active: $route.path === '/admin/admins' }]">
          <span class="menu-icon">👨‍💼</span> 管理员管理
        </router-link>
        <router-link to="/admin/roles" :class="['menu-item', { active: $route.path === '/admin/roles' }]">
          <span class="menu-icon">🔑</span> 角色管理
        </router-link>
        <router-link to="/admin/api" :class="['menu-item', { active: $route.path === '/admin/api' }]">
          <span class="menu-icon">🔌</span> 接口管理
        </router-link>
        <router-link to="/admin/settings" :class="['menu-item', { active: $route.path === '/admin/settings' }]">
          <span class="menu-icon">⚙️</span> 系统设置
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
import { useRoute } from 'vue-router'
import { useAdmin } from './composables/useAdmin'

const route = useRoute()
const { handleLogout } = useAdmin()

const pageTitle = computed(() => {
  const titles = {
    dashboard: '控制台',
    users: '用户管理',
    recommend: '热门推荐',
    orders: '订单管理',
    withdraws: '提现管理',
    posts: '帖子管理',
    reports: '举报管理',
    banners: 'Banner管理',
    'vip-packages': 'VIP套餐管理',
    'gift-management': '礼物管理',
    gifts: '礼物记录',
    recharges: '充值记录',
    games: '服务分类',
    'companion-applications': '服务申请管理',
    'virtual-users': '虚拟机器人管理',
    admins: '管理员管理',
    roles: '角色管理',
    api: '接口管理',
    settings: '系统设置'
  }
  const page = route.path.split('/').pop()
  return titles[page] || '管理后台'
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-secondary);
}

.sidebar {
  width: 220px;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  overflow-y: auto;
  z-index: 100;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-light);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
}

.menu {
  flex: 1;
  padding: 10px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s;
  font-size: 14px;
}

.menu-item:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.menu-item.active {
  background: var(--primary-color);
  color: #fff;
}

.menu-icon {
  margin-right: 10px;
  font-size: 16px;
}

.main-content {
  flex: 1;
  margin-left: 220px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.top-bar {
  background: var(--bg-primary);
  padding: 0 30px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-light);
  position: sticky;
  top: 0;
  z-index: 50;
}

.top-bar h1 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
}

.logout-btn {
  padding: 6px 16px;
  background: var(--danger-color);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.content {
  padding: 20px 30px;
  flex: 1;
}
</style>
