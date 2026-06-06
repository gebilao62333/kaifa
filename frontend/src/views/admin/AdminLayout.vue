<template>
  <div class="admin-layout">
    <!-- 左侧侧边栏 -->
    <aside :class="['sidebar', { collapsed }]">
      <div class="logo-area">
        <div class="logo-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M3 9h18" /><path d="M9 21V9" />
            <circle cx="15" cy="15" r="2" />
          </svg>
        </div>
        <span v-show="!collapsed" class="logo-text">管理后台</span>
      </div>

      <nav class="menu">
        <!-- 工作台 -->
        <div class="menu-group">
          <span v-show="!collapsed" class="menu-group-title">工作台</span>
          <router-link to="/admin/dashboard" :class="['menu-item', { active: isActive('dashboard') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span v-show="!collapsed">控制台</span>
          </router-link>
        </div>

        <!-- 用户管理 -->
        <div class="menu-group">
          <span v-show="!collapsed" class="menu-group-title">用户管理</span>
          <router-link to="/admin/users" :class="['menu-item', { active: isActive('users') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span v-show="!collapsed">用户管理</span>
          </router-link>
          <router-link to="/admin/admins" :class="['menu-item', { active: isActive('admins') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span v-show="!collapsed">管理员管理</span>
          </router-link>
          <router-link to="/admin/roles" :class="['menu-item', { active: isActive('roles') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span v-show="!collapsed">角色管理</span>
          </router-link>
          <router-link to="/admin/virtual-users" :class="['menu-item', { active: isActive('virtual-users') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span v-show="!collapsed">虚拟机器人</span>
          </router-link>
        </div>

        <!-- 消息通知 -->
        <div class="menu-group">
          <span v-show="!collapsed" class="menu-group-title">消息通知</span>
          <router-link to="/admin/notifications" :class="['menu-item', { active: isActive('notifications') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span v-show="!collapsed">系统通知</span>
          </router-link>
        </div>

        <!-- 内容管理 -->
        <div class="menu-group">
          <span v-show="!collapsed" class="menu-group-title">内容管理</span>
          <router-link to="/admin/posts" :class="['menu-item', { active: isActive('posts') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span v-show="!collapsed">帖子管理</span>
          </router-link>
          <router-link to="/admin/reports" :class="['menu-item', { active: isActive('reports') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span v-show="!collapsed">举报管理</span>
          </router-link>
          <router-link to="/admin/recommend" :class="['menu-item', { active: isActive('recommend') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span v-show="!collapsed">热门推荐</span>
          </router-link>
          <router-link to="/admin/banners" :class="['menu-item', { active: isActive('banners') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 20h20"/><path d="M2 16l5-4 4 4 6-6 5 5"/>
            </svg>
            <span v-show="!collapsed">Banner管理</span>
          </router-link>
        </div>

        <!-- 交易管理 -->
        <div class="menu-group">
          <span v-show="!collapsed" class="menu-group-title">交易管理</span>
          <router-link to="/admin/orders" :class="['menu-item', { active: isActive('orders') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span v-show="!collapsed">订单管理</span>
          </router-link>
          <router-link to="/admin/withdraws" :class="['menu-item', { active: isActive('withdraws') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            <span v-show="!collapsed">提现管理</span>
          </router-link>
          <router-link to="/admin/recharges" :class="['menu-item', { active: isActive('recharges') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <span v-show="!collapsed">充值记录</span>
          </router-link>
          <router-link to="/admin/cards" :class="['menu-item', { active: isActive('cards') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            <span v-show="!collapsed">密卡管理</span>
          </router-link>
          <router-link to="/admin/gifts" :class="['menu-item', { active: isActive('gifts') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
              <line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
            <span v-show="!collapsed">礼物记录</span>
          </router-link>
        </div>

        <!-- 服务管理 -->
        <div class="menu-group">
          <span v-show="!collapsed" class="menu-group-title">服务管理</span>
          <router-link to="/admin/games" :class="['menu-item', { active: isActive('games') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
            <span v-show="!collapsed">服务分类</span>
          </router-link>
          <router-link to="/admin/companion-applications" :class="['menu-item', { active: isActive('companion-applications') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1"/>
            </svg>
            <span v-show="!collapsed">服务申请</span>
          </router-link>
          <router-link to="/admin/vip-packages" :class="['menu-item', { active: isActive('vip-packages') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
            </svg>
            <span v-show="!collapsed">VIP套餐</span>
          </router-link>
          <router-link to="/admin/gift-management" :class="['menu-item', { active: isActive('gift-management') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
              <line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
            <span v-show="!collapsed">礼物管理</span>
          </router-link>
          <router-link to="/admin/customer-service" :class="['menu-item', { active: isActive('customer-service') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span v-show="!collapsed">客服管理</span>
          </router-link>
        </div>

        <!-- 系统设置 -->
        <div class="menu-group">
          <span v-show="!collapsed" class="menu-group-title">系统设置</span>
          <router-link to="/admin/api" :class="['menu-item', { active: isActive('api') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            <span v-show="!collapsed">接口管理</span>
          </router-link>
          <router-link to="/admin/settings" :class="['menu-item', { active: isActive('settings') }]">
            <svg class="menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span v-show="!collapsed">系统设置</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer" v-show="!collapsed">
        <span class="version-text">v1.0.0</span>
      </div>
    </aside>

    <!-- 右侧主体 -->
    <div class="main-container">
      <header class="header">
        <div class="header-left">
          <button class="collapse-btn" @click="collapsed = !collapsed" :title="collapsed ? '展开菜单' : '收起菜单'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div class="breadcrumb">
            <span class="breadcrumb-home" @click="$router.push('/admin/dashboard')">首页</span>
            <svg class="breadcrumb-sep" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            <span class="breadcrumb-current">{{ pageTitle }}</span>
          </div>
        </div>
        <div class="header-right">
          <div class="header-actions">
            <button class="header-btn" title="刷新" @click="$router.go(0)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>
          </div>
          <div class="user-dropdown">
            <div class="user-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span class="user-name">管理员</span>
            <button @click="handleLogout" class="logout-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              退出
            </button>
          </div>
        </div>
      </header>

      <div class="page-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAdmin } from './composables/useAdmin'

const route = useRoute()
const { handleLogout } = useAdmin()
const collapsed = ref(false)

const isActive = (name) => route.path === `/admin/${name}`

const pageTitle = computed(() => {
  const titles = {
    dashboard: '控制台',
    users: '用户管理',
    recommend: '热门推荐',
    orders: '订单管理',
    withdraws: '提现管理',
    posts: '帖子管理',
    reports: '举报管理',
    'customer-service': '客服管理',
    notifications: '系统通知',
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
/* ==========================================
   管理后台布局 - 独立于全局 .app 容器
   使用 fixed 全屏覆盖，不受前台 PC 居中限制
   ========================================== */
.admin-layout {
  position: fixed;
  inset: 0;
  display: flex;
  z-index: 200;
  background: #f0f2f5;
}

/* ====== 折叠按钮 ====== */
.collapse-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #606266;
  transition: all 0.2s;
  margin-right: 12px;
  flex-shrink: 0;
}
.collapse-btn:hover {
  background: #f0f2f5;
  color: #1890FF;
}

/* ====== 侧边栏 ====== */
.sidebar {
  width: 240px;
  background: linear-gradient(180deg, #1e2a3a 0%, #152233 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.3s ease;
  box-shadow: 2px 0 12px rgba(0,0,0,0.08);
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 64px;
}

/* Logo */
.logo-area {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.logo-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1890FF;
  flex-shrink: 0;
}
.logo-text {
  margin-left: 12px;
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  letter-spacing: 1px;
}

/* 菜单 */
.menu {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
}

.menu::-webkit-scrollbar {
  width: 3px;
}
.menu::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
}

.menu-group {
  margin-bottom: 4px;
}
.menu-group-title {
  display: block;
  padding: 16px 20px 6px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.28);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  white-space: nowrap;
}

.menu-item {
  display: flex;
  align-items: center;
  height: 42px;
  padding: 0 20px;
  margin: 2px 8px;
  color: rgba(255,255,255,0.55);
  text-decoration: none;
  transition: all 0.2s ease;
  font-size: 13.5px;
  border-radius: 8px;
  white-space: nowrap;
  position: relative;
}

.menu-item:hover {
  color: #fff;
  background: rgba(255,255,255,0.06);
}

.menu-item.active {
  color: #fff;
  background: #1890FF;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(24,144,255,0.35);
}

.menu-icon {
  margin-right: 12px;
  flex-shrink: 0;
  opacity: 0.75;
}
.menu-item.active .menu-icon {
  opacity: 1;
}

.sidebar.collapsed .menu-item {
  padding: 0;
  justify-content: center;
}
.sidebar.collapsed .menu-icon {
  margin-right: 0;
}

/* 侧边栏底部 */
.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.version-text {
  font-size: 11px;
  color: rgba(255,255,255,0.2);
}

/* ====== 右侧主体（flex 列布局，不外挂 fixed） ====== */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* ====== 顶部导航（正常流，不 fixed） ====== */
.header {
  height: 64px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  z-index: 50;
}

.header-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #909399;
  min-width: 0;
}
.breadcrumb-home {
  cursor: pointer;
  transition: color 0.2s;
  white-space: nowrap;
}
.breadcrumb-home:hover {
  color: #1890FF;
}
.breadcrumb-sep {
  margin: 0 8px;
  opacity: 0.5;
  flex-shrink: 0;
}
.breadcrumb-current {
  color: #303133;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.header-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #606266;
  transition: all 0.2s;
}
.header-btn:hover {
  background: #f0f2f5;
  color: #1890FF;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border-radius: 22px;
  background: #f7f8fa;
  cursor: default;
  transition: all 0.2s;
}
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1890FF;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.user-name {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
  color: #f56c6c;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.logout-btn:hover {
  background: #fef0f0;
  border-color: #fbc4c4;
}

/* ====== 页面内容（撑满剩余空间 + 独立滚动） ====== */
.page-content {
  flex: 1;
  padding: 24px;
  overflow: auto;
  background: #f0f2f5;
}
</style>

<!-- 管理后台页面通用样式（非 scoped，全局生效） -->
<style>
/* ====== 页面容器 ====== */
.page-container {
  padding: 0;
  background: transparent;
  border-radius: 0;
}

/* ====== 页面标题栏 ====== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
}
.page-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* ====== 添加按钮 ====== */
.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.add-btn:hover {
  background: #40a9ff;
  box-shadow: 0 2px 8px rgba(24,144,255,0.35);
}

/* ====== 工具栏（搜索栏+按钮同行） ====== */
.toolbar {
  display: flex;
  margin-bottom: 20px;
}

/* ====== 搜索栏 ====== */
.search-bar {
  display: flex;
  gap: 10px;
  flex: 1;
  align-items: center;
}
.search-input {
  flex: 1;
  min-width: 180px;
  padding: 9px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  background: #fff;
}
.search-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24,144,255,0.1);
}
.search-select {
  padding: 9px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  min-width: 120px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.search-select:focus {
  outline: none;
  border-color: #1890ff;
}
.search-btn {
  padding: 9px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.search-btn:hover {
  background: #40a9ff;
  box-shadow: 0 2px 8px rgba(24,144,255,0.35);
}

/* ====== 数据表格 ====== */
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}
.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}
.data-table th {
  background: #fafafa;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}
.data-table tbody tr:hover {
  background: #f5f7fa;
}
.data-table tbody tr:last-child td {
  border-bottom: none;
}

/* ====== 状态标签 ====== */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
.status-badge.active {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}
.status-badge.disabled {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}
.status-badge.pending {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}
.status-badge.approved {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}
.status-badge.rejected {
  background: #fff1f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

/* ====== 操作按钮 ====== */
.action-btn {
  display: inline-block;
  padding: 5px 12px;
  margin-right: 6px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}
.action-btn:hover {
  background: #40a9ff;
}
.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.action-btn.delete-btn {
  background: #ff4d4f;
}
.action-btn.delete-btn:hover {
  background: #ff7875;
}

/* ====== 分页 ====== */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding: 10px 0;
}
.pagination-left {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #999;
}
.pagination-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.page-size-label {
  font-size: 13px;
  color: #999;
}
.page-btn {
  padding: 8px 18px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: all 0.2s;
}
.page-btn:hover:not(:disabled) {
  border-color: #1890ff;
  color: #1890ff;
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-active {
  background: #1890ff;
  color: #fff !important;
  border-color: #1890ff;
}
.page-ellipsis {
  border: none;
  cursor: default;
  background: transparent;
}
.page-ellipsis:hover {
  border-color: transparent !important;
  color: #333 !important;
}
.page-size-select {
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  margin-right: 8px;
  cursor: pointer;
}
.export-btn {
  padding: 0 16px;
  background: #52c41a;
  color: white;
  border: 1px solid #52c41a;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  height: 36px;
  border-radius: 4px;
  font-size: 14px;
}
.export-btn:hover {
  background: #73d13d;
}
.page-info {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* ====== 模态框 ====== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  padding-top: 40px;
  padding-left: 240px;
  z-index: 1000;
  backdrop-filter: blur(2px);
}
.modal-content {
  background: #fff;
  border-radius: 10px;
  width: calc(100vw - 280px);
  max-width: none !important;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #f0f0f0;
}
.modal-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #1a1a2e;
}
.close-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #999;
  padding: 4px;
  line-height: 1;
  transition: color 0.2s;
}
.close-btn:hover {
  color: #333;
}
.modal-body {
  padding: 24px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

/* ====== 表单 ====== */
.form-group {
  margin-bottom: 18px;
}
.form-group label {
  display: block;
  margin-bottom: 7px;
  color: #333;
  font-size: 14px;
  font-weight: 500;
}
.form-input {
  width: 100%;
  padding: 9px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;
  background: #fff;
}
.form-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24,144,255,0.1);
}
textarea.form-input {
  resize: vertical;
  min-height: 80px;
}

/* ====== 通用按钮 ====== */
.cancel-btn {
  padding: 8px 18px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
}
.cancel-btn:hover {
  color: #1890ff;
  border-color: #1890ff;
}
.confirm-btn {
  padding: 8px 18px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}
.confirm-btn:hover {
  background: #40a9ff;
}

/* ====== 详情行 ====== */
.detail-row {
  display: flex;
  padding: 11px 0;
  border-bottom: 1px solid #f5f5f5;
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-label {
  width: 100px;
  color: #888;
  flex-shrink: 0;
  font-weight: 500;
  font-size: 14px;
}

/* ====== 头像 ====== */
.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
.avatar-placeholder {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  background: #f0f0f0;
  border-radius: 50%;
}

/* ====== 卡片包装 ====== */
.admin-card {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

/* ====== 设置页面 ====== */
.settings-page {
  background: #fff;
  border-radius: 10px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.settings-section {
  margin-bottom: 32px;
}
.settings-section h3 {
  margin: 0 0 18px;
  font-size: 17px;
  font-weight: 600;
  color: #1a1a2e;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.settings-section .form-group {
  max-width: 480px;
}
.settings-section .form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 400;
  cursor: pointer;
}
.settings-section .form-group label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #1890ff;
}
.settings-actions {
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}
.btn-save {
  padding: 10px 28px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-save:hover {
  background: #40a9ff;
  box-shadow: 0 2px 8px rgba(24,144,255,0.35);
}

/* ====== 统计卡片 ====== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
}
.stat-card {
  background: #fff;
  padding: 22px 20px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: box-shadow 0.2s;
}
.stat-card:hover {
  box-shadow: 0 3px 12px rgba(0,0,0,0.1);
}
.stat-icon {
  font-size: 42px;
  line-height: 1;
}
.stat-info {
  flex: 1;
  min-width: 0;
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 13px;
  color: #888;
}

/* ====== Toast 动画 ====== */
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 全局 Loading 状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #999;
}
.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

/* 全局空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #bbb;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.empty-text {
  font-size: 14px;
}
</style>
