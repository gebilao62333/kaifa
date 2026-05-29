<template>
  <nav class="bn-nav">
    <div class="bn-inner">
      <div
        v-for="item in navItems"
        :key="item.path"
        class="bn-item"
        :class="{ 'bn-item--active': currentRoute === item.path }"
        @click="goTo(item.path)"
      >
        <div class="bn-icon-wrapper">
          <span class="bn-icon">{{ currentRoute === item.path ? item.activeIcon : item.icon }}</span>
          <span v-if="item.badge && item.badge > 0" class="bn-badge">
            {{ item.badge > 99 ? '99+' : item.badge }}
          </span>
        </div>
        <span class="bn-label">{{ item.label }}</span>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useChatStore } from '../store/chat'

const router = useRouter()
const route = useRoute()
const chatStore = useChatStore()

const currentRoute = computed(() => route.path)

const unreadCount = computed(() => chatStore.getTotalUnread)

const navItems = computed(() => [
  { path: '/home', label: '首页', icon: '🏡', activeIcon: '🏠', badge: 0 },
  { path: '/activity', label: '广场', icon: '🎪', activeIcon: '🎭', badge: 0 },
  { path: '/preferred', label: '消息', icon: '🗨️', activeIcon: '💬', badge: unreadCount.value },
  { path: '/mine', label: '我的', icon: '👥', activeIcon: '👤', badge: 0 }
])

const goTo = (path) => {
  router.push(path)
}
</script>

<style scoped>
/* --- 导航栏容器 --- */
.bn-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 70px;
  height: calc(70px + env(safe-area-inset-bottom, 0px));
  background: #fff;
  box-shadow: 0 -4px 20px rgba(102, 126, 234, 0.15);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom, 0);
  transform: translateZ(0);
}

/* --- 导航项内层 --- */
.bn-inner {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 70px;
  max-width: 720px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* --- 单个导航项 --- */
.bn-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 0;
  height: 100%;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.bn-item--active .bn-icon {
  transform: scale(1.05);
}

.bn-item--active .bn-label {
  color: #667eea;
  font-weight: 600;
}

/* --- 图标 --- */
.bn-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bn-icon {
  font-size: 22px;
  margin-bottom: 2px;
  transition: transform 0.2s ease;
}

/* --- 未读角标 --- */
.bn-badge {
  position: absolute;
  top: -6px;
  right: -12px;
  min-width: 16px;
  height: 16px;
  background: #ff4d4f;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  box-shadow: 0 2px 4px rgba(255, 77, 79, 0.3);
  pointer-events: none;
}

/* --- 文字标签 --- */
.bn-label {
  font-size: 10px;
  color: #999;
  transition: color 0.2s ease;
}

/* --- PC 端适配 --- */
@media (min-width: 768px) {
  .bn-nav {
    left: 50%;
    transform: translateX(-50%);
    max-width: 650px;
    border-radius: 20px 20px 0 0;
    height: calc(64px + env(safe-area-inset-bottom, 0px));
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  }

  .bn-inner {
    height: 64px;
    max-width: 650px;
  }

  .bn-label {
    font-size: 11px;
  }
}

@media (min-width: 1024px) {
  .bn-nav {
    max-width: 720px;
  }

  .bn-inner {
    max-width: 720px;
  }
}
</style>
