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

// 菜单与页面标题由路由 children 的 meta 自动生成，新增页面只需在 router 增加带 meta 的路由，无需改动此处
const menuItems = computed(() => {
  const layout = router.options.routes.find(r => r.children)
  if (!layout) return []
  return layout.children
    .filter(c => c.meta && c.meta.title)
    .map(c => ({
      page: c.name,
      path: c.path.startsWith('/') ? c.path : '/' + c.path,
      icon: (c.meta && c.meta.icon) || '📄',
      label: c.meta.title
    }))
})

const isActive = (page) => {
  const item = menuItems.value.find(m => m.page === page)
  if (!item) return false
  return route.path === item.path || route.path.startsWith(item.path + '/')
}

const pageTitle = computed(() => (route.meta && route.meta.title) || '管理后台')

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
