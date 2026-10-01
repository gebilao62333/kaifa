<template>
  <div class="app">
    <ErrorBoundary>
      <router-view v-slot="{ Component, route }">
        <transition :name="transitionName">
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
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const toast = useToast()
const userStore = useUserStore()
const incomingCallRef = ref(null)
const route = useRoute()
const router = useRouter()

// 主 Tab 顺序：全屏左右滑动按此顺序切换
const MAIN_TABS = ['/home', '/square', '/preferred', '/mine']
const transitionName = ref('page')
let lastTabIndex = MAIN_TABS.indexOf(route.path)
let swipeStartX = 0
let swipeStartY = 0
let swiping = false

// 这些区域内的横向拖动不触发切 Tab（可滚动区域/弹层/输入框等）
const IGNORE_SELECTOR = 'input, textarea, .banner-swiper, .tag-filter, [data-no-swipe], [class*="overlay"], [class*="modal"], [class*="sheet"], [class*="panel"]'

const isHorizontallyScrollable = (el) => {
  let node = el
  while (node && node !== document.body) {
    const ox = getComputedStyle(node).overflowX
    if ((ox === 'auto' || ox === 'scroll') && node.scrollWidth > node.clientWidth + 4) return true
    node = node.parentElement
  }
  return false
}

const onPointerDown = (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  const t = e.target
  if (!t || !t.closest) return
  if (t.closest(IGNORE_SELECTOR)) return
  if (isHorizontallyScrollable(t)) return
  if (MAIN_TABS.indexOf(route.path) === -1) return
  swipeStartX = e.clientX
  swipeStartY = e.clientY
  swiping = true
}

const onPointerUp = (e) => {
  if (!swiping) return
  swiping = false
  const dx = e.clientX - swipeStartX
  const dy = e.clientY - swipeStartY
  // 横向位移足够大且明显偏水平，才算切换手势
  if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return
  const idx = MAIN_TABS.indexOf(route.path)
  if (idx === -1) return
  const nextIdx = dx < 0 ? idx + 1 : idx - 1
  if (nextIdx < 0 || nextIdx >= MAIN_TABS.length) return
  router.push(MAIN_TABS[nextIdx])
}

const onPointerCancel = () => { swiping = false }

// 主 Tab 之间切换时使用滑动过渡（点击或滑动均适用），其余导航保持淡入
watch(() => route.path, (newPath) => {
  const newIdx = MAIN_TABS.indexOf(newPath)
  if (newIdx !== -1 && lastTabIndex !== -1 && newIdx !== lastTabIndex) {
    transitionName.value = newIdx > lastTabIndex ? 'tab-left' : 'tab-right'
    setTimeout(() => { transitionName.value = 'page' }, 360)
  }
  lastTabIndex = newIdx
})

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
  window.addEventListener('pointerdown', onPointerDown, { passive: true })
  window.addEventListener('pointerup', onPointerUp, { passive: true })
  window.addEventListener('pointercancel', onPointerCancel, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerCancel)
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
  position: relative;
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
    max-width: var(--layout-max-width-pc, 650px);
    margin: 0 auto;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.06);
  }
}
@media (min-width: 1024px) {
  .route-shell--frame {
    max-width: var(--layout-max-width-pc-lg, 720px);
  }
}

/* 桌面端把通用弹窗遮罩约束进 650/720 列，与页面内容对齐（仅非全屏页） */
@media (min-width: 768px) {
  .route-shell--frame .modal-overlay {
    left: 0;
    right: 0;
    margin: 0 auto;
    width: 100%;
    max-width: var(--layout-max-width-pc, 650px);
  }
}
@media (min-width: 1024px) {
  .route-shell--frame .modal-overlay {
    max-width: var(--layout-max-width-pc-lg, 720px);
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

/* 主 Tab 左右滑动切换过渡 */
.tab-left-enter-active,
.tab-left-leave-active,
.tab-right-enter-active,
.tab-right-leave-active {
  transition: transform 0.32s ease, opacity 0.32s ease;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
}

.tab-left-enter-from { transform: translateX(100%); opacity: 0.4; }
.tab-left-leave-to { transform: translateX(-100%); opacity: 0.4; }
.tab-right-enter-from { transform: translateX(-100%); opacity: 0.4; }
.tab-right-leave-to { transform: translateX(100%); opacity: 0.4; }

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
