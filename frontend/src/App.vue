<template>
  <div class="app">
    <ErrorBoundary>
      <router-view v-slot="{ Component, route }">
        <transition name="page">
          <div :key="route.path" :class="['route-shell', { 'route-shell--frame': !isFullscreen }]">
            <component :is="Component" />
          </div>
        </transition>
      </router-view>
    </ErrorBoundary>
    <BottomNav v-if="shouldShowNav"></BottomNav>
    <Toast v-bind="toast.state"></Toast>
    <IncomingCall ref="incomingCallRef"></IncomingCall>
    <NetworkStatus></NetworkStatus>
  </div>
</template>

<script setup>
import BottomNav from './components/BottomNav.vue'
import Toast from './components/Toast.vue'
import IncomingCall from './components/IncomingCall.vue'
import NetworkStatus from './components/NetworkStatus.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'
import { useToast } from './composables/useToast'
import { socketService } from './services/socketService'
import { useUserStore } from './store/user-info'
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const toast = useToast()
const userStore = useUserStore()
const incomingCallRef = ref(null)
const route = useRoute()

const shouldShowNav = computed(() => {
  return !route.meta.fullscreen && route.path !== '/login'
})

const isFullscreen = computed(() => {
  return !!route.meta.fullscreen
})

const initSocket = () => {
  if (!userStore.isLogin) {
    console.log('[App] 未登录，跳过Socket连接')
    return
  }

  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'
  console.log('[App] 初始化Socket连接:', socketUrl)
  socketService.connect(socketUrl)

  socketService.on('call_invite', (data) => {
    console.log('[App] 收到通话邀请:', data)
    if (incomingCallRef.value) {
      incomingCallRef.value.showIncomingCall(data)
    }
  })
}

onMounted(() => {
  if (userStore.isLogin) {
    initSocket()
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html, body {
  min-height: 100dvh;
  overflow-x: hidden;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f7;
}
.app {
  min-height: 100dvh;
  background: #f5f5f7;
}

/* 路由内容外壳：桌面端对非沉浸式页做 650/720 居中，统一各页面尺寸 */
.route-shell {
  min-height: 100dvh;
  background: #f5f5f7;
}
@media (min-width: 768px) {
  .route-shell--frame {
    max-width: 650px;
    margin: 0 auto;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.06);
  }
}
@media (min-width: 1024px) {
  .route-shell--frame {
    max-width: 720px;
  }
}

/* PC端优化 - 响应式宽度体验 */
@media (min-width: 768px) {
  .app {
    padding: 0;
  }
  
  /* 确保页面组件有最小高度，防止空白 */
  .app .page-enter-active,
  .app .page-leave-active {
    min-height: 100dvh;
  }
}

/* 大屏优化 */
@media (min-width: 1024px) {
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  min-height: 100dvh;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

/* PC端通用容器优化 */
@media (min-width: 768px) {
  /* 通用页面容器（.home-page 已自行管理桌面对齐，不参与全局强制 padding） */
  .login-page,
  .search-page,
  .edit-profile-page,
  .settings-page,
  .service-list-page,
  .service-detail-page,
  .chat-room-page,
  .user-profile-page {
    padding-left: 16px !important;
    padding-right: 16px !important;
    padding-bottom: 16px !important;
  }
  
  /* 通用卡片样式 */
  .card,
  .list-item,
  .menu-item {
    border-radius: 12px !important;
    margin-bottom: 12px !important;
  }
  
  /* 通用按钮优化 */
  .btn,
  button {
    border-radius: 10px !important;
  }
  
  /* 输入框优化 */
  input,
  textarea,
  .form-input {
    border-radius: 10px !important;
    font-size: 15px !important;
  }
}
</style>
