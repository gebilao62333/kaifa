<template>
  <div class="app">
    <ErrorBoundary>
      <router-view v-slot="{ Component, route }">
        <transition name="page">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </ErrorBoundary>
    <BottomNav v-if="shouldShowNav"></BottomNav>
    <Toast v-bind="toast.state"></Toast>
    <IncomingCall ref="incomingCallRef"></IncomingCall>
    <NetworkStatus></NetworkStatus>
    <LoginModal 
      :visible="loginModalVisible" 
      @close="hideLoginModal"
      @login-success="handleLoginSuccess"
    />
  </div>
</template>

<script setup>
import BottomNav from './components/BottomNav.vue'
import Toast from './components/Toast.vue'
import IncomingCall from './components/IncomingCall.vue'
import NetworkStatus from './components/NetworkStatus.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'
import LoginModal from './components/LoginModal.vue'
import { useToast } from './composables/useToast'
import { useLoginManager } from './composables/useLoginManager'
import { socketService } from './services/socketService'
import { useUserStore } from './store/user-info'
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const toast = useToast()
const userStore = useUserStore()
const incomingCallRef = ref(null)
const route = useRoute()

const {
  loginModalVisible,
  hideLoginModal,
  handleLoginSuccess,
  initAutoLogin
} = useLoginManager()

const isAdminRoute = computed(() => {
  return route.path.startsWith('/admin')
})

const shouldShowNav = computed(() => {
  return !isAdminRoute.value && route.path !== '/login'
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
  initAutoLogin()
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
  min-height: 100%;
  overflow-x: hidden;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f7;
}
.app {
  min-height: 100%;
  background: #f5f5f7;
}

/* PC端优化 - 响应式宽度体验 */
@media (min-width: 768px) {
  .app {
    padding: 0;
  }
  
  /* 确保页面组件有最小高度，防止空白 */
  .app .page-enter-active,
  .app .page-leave-active {
    min-height: 100vh;
  }
}

/* 大屏优化 */
@media (min-width: 1024px) {
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  min-height: 100vh;
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
  /* 通用页面容器 */
  .home-page,
  .mine-page,
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
    border-radius: 10px !important;
    margin-bottom: 12px !important;
  }
  
  /* 通用按钮优化 */
  .btn,
  button {
    border-radius: 8px !important;
  }
  
  /* 输入框优化 */
  input,
  textarea,
  .form-input {
    border-radius: 8px !important;
    font-size: 15px !important;
  }
}
</style>
