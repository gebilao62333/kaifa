<template>
  <div class="bottom-nav">
    <div class="nav-items">
      <div 
        class="nav-item" 
        :class="{ active: currentRoute === '/home' }"
        @click="goTo('/home')"
      >
        <div class="nav-icon">{{ currentRoute === '/home' ? '🏠' : '🏡' }}</div>
        <div class="nav-text">首页</div>
      </div>
      <div 
        class="nav-item" 
        :class="{ active: currentRoute === '/activity' }"
        @click="goTo('/activity')"
      >
        <div class="nav-icon">{{ currentRoute === '/activity' ? '🎭' : '🎪' }}</div>
        <div class="nav-text">广场</div>
      </div>
      <div 
        class="nav-item" 
        :class="{ active: currentRoute === '/preferred' }"
        @click="goTo('/preferred')"
      >
        <div class="nav-icon-wrapper">
          <div class="nav-icon">{{ currentRoute === '/preferred' ? '💬' : '🗨️' }}</div>
          <div class="badge" v-if="unreadCount > 0">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </div>
        </div>
        <div class="nav-text">消息</div>
      </div>
      <div 
        class="nav-item" 
        :class="{ active: currentRoute === '/mine' }"
        @click="goTo('/mine')"
      >
        <div class="nav-icon">{{ currentRoute === '/mine' ? '👤' : '👥' }}</div>
        <div class="nav-text">我的</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useChatStore } from '../store/chat'

const router = useRouter()
const route = useRoute()
const chatStore = useChatStore()

const currentRoute = computed(() => route.path)

const unreadCount = computed(() => chatStore.getTotalUnread)

const goTo = (path) => {
  router.push(path)
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  background-color: #fff;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.nav-items {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100%;
  max-width: 650px;
  margin: 0 auto;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-item:hover {
  background-color: #fafafa;
}

.nav-item.active .nav-icon {
  transform: scale(1.1);
}

.nav-item.active .nav-text {
  color: #667eea;
  font-weight: 600;
}

.nav-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-icon {
  font-size: 24px;
  margin-bottom: 4px;
  transition: transform 0.2s;
}

.badge {
  position: absolute;
  top: -6px;
  right: -10px;
  min-width: 18px;
  height: 18px;
  background-color: #ff4d4f;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  box-shadow: 0 2px 4px rgba(255, 77, 79, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.nav-text {
  font-size: 11px;
  color: #999;
}

/* PC端底部导航优化 */
@media (min-width: 768px) {
  .bottom-nav {
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 20px 20px 0 0;
    height: 64px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  }
  
  .nav-items {
    max-width: 650px;
  }
  
  .nav-icon {
    font-size: 24px;
  }
  
  .nav-text {
    font-size: 12px;
  }
}

@media (min-width: 1024px) {
  .bottom-nav {
    max-width: 720px;
  }
  
  .nav-items {
    max-width: 720px;
  }
}
</style>
