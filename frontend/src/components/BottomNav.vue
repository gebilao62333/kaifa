<template>
  <div class="bottom-nav">
    <!-- 导航项容器 - 统一管理4个导航项 -->
    <div class="nav-container">
      <div class="nav-items-wrapper">
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
  width: 100%;
  height: 70px;
  height: calc(70px + constant(safe-area-inset-bottom, 0px));
  height: calc(70px + env(safe-area-inset-bottom, 0px));
  background-color: #fff;
  box-shadow: 0 -4px 20px rgba(102, 126, 234, 0.15);
  z-index: 100;
  padding-bottom: constant(safe-area-inset-bottom, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

/* 导航容器 - 统一管理宽度 */
.nav-container {
  max-width: 650px;
  margin: 0 auto;
  height: 100%;
}

/* 导航项包装器 - 4个导航项的父容器 */
.nav-items-wrapper {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100%;
  box-sizing: border-box;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  width: 650px;
}

/* 导航项 - 4个宽度统一 */
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 25%; /* 4个导航项，每个占25% */
  max-width: 100px; /* 最大宽度限制 */
  min-width: 60px; /* 最小宽度限制 */
  height: 100%;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.nav-item.active .nav-icon {
  transform: scale(1.05);
  -webkit-transform: scale(1.05);
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
  font-size: 22px;
  margin-bottom: 2px;
  transition: transform 0.2s;
  -webkit-transition: -webkit-transform 0.2s;
}

.badge {
  position: absolute;
  top: -6px;
  right: -10px;
  min-width: 16px;
  height: 16px;
  background-color: #ff4d4f;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  box-shadow: 0 2px 4px rgba(255, 77, 79, 0.3);
}

.nav-text {
  font-size: 10px;
  color: #999;
}

/* PC端底部导航优化 */
@media (min-width: 768px) {
  .bottom-nav {
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
    -webkit-transform: translateX(-50%);
    border-radius: 20px 20px 0 0;
    height: 64px;
    height: calc(64px + env(safe-area-inset-bottom, 0px));
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  }
  
  .nav-container {
    max-width: 650px;
    height: 64px;
  }
  
  .nav-items-wrapper {
    height: 64px;
  }
  
  .nav-item {
    max-width: 110px; /* PC端最大宽度 */
    min-width: 70px; /* PC端最小宽度 */
  }
  
  .nav-icon {
    font-size: 22px;
  }
  
  .nav-text {
    font-size: 11px;
  }
}

@media (min-width: 1024px) {
  .bottom-nav {
    max-width: 720px;
  }
  
  .nav-container {
    max-width: 720px;
  }
  
  .nav-item {
    max-width: 120px; /* 大屏幕最大宽度 */
    min-width: 80px; /* 大屏幕最小宽度 */
  }
}
</style>
