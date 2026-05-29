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
    <!-- 全局层级：Toast > 来电 > 网络状态 > 登录弹窗 -->
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

// 不显示底部导航的页面
const NO_NAV_ROUTES = ['/login']
const NO_NAV_PREFIXES = ['/admin', '/chat-room', '/call/']

const shouldShowNav = computed(() => {
  const path = route.path
  if (NO_NAV_ROUTES.includes(path)) return false
  if (NO_NAV_PREFIXES.some(prefix => path.startsWith(prefix))) return false
  return true
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
/* ============================================
   全局基础样式 - 引入设计令牌与布局系统
   ============================================ */
@import './styles/tokens.css';
@import './styles/layout.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  min-height: 100%;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-page);
}

#app {
  min-height: 100%;
}

.app {
  min-height: 100%;
  background: var(--bg-page);
}

/* --- PC端容器居中 --- */
@media (min-width: 768px) {
  .app {
    max-width: var(--layout-pc-width);
    margin: 0 auto;
    position: relative;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.08);
    min-height: 100vh;
  }
}

@media (min-width: 1024px) {
  .app {
    max-width: var(--layout-pc-width-lg);
  }
}

/* --- 页面过渡动画 --- */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
