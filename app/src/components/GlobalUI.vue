<template>
  <BottomNav v-if="showNav" />
  <Toast v-bind="toast.state" />
  <IncomingCall ref="incomingRef" />
  <NetworkStatus />
  <SplashPopup :splash="splash" @close="closeSplash" @navigate="navigateSplash" />

  <!-- 全局错误兜底（旧版 ErrorBoundary 的全屏页版本） -->
  <view class="global-error-mask" v-if="globalError">
    <view class="global-error-card">
      <view class="global-error-icon">⚠️</view>
      <view class="global-error-title">页面加载出错</view>
      <view class="global-error-message">{{ globalError.message }}</view>
      <button class="global-error-retry" @click="handleGlobalReload">重新加载</button>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, router, setNavDirection } from '@/common/route'
import { socketService } from '../services/socketService'
import { useToast } from '../composables/useToast'
import { useSplash, closeSplash, navigateSplash } from '../composables/useSplash'
import { useGlobalError, clearGlobalError } from '../composables/useGlobalError'
import BottomNav from './BottomNav.vue'
import Toast from './Toast.vue'
import IncomingCall from './IncomingCall.vue'
import NetworkStatus from './NetworkStatus.vue'
import SplashPopup from './SplashPopup.vue'

const route = useRoute()
const toast = useToast()
const splash = useSplash()
const globalError = useGlobalError()
const incomingRef = ref(null)
const showNav = computed(() => route.path !== '/login' && !route.meta.fullscreen)

const handleGlobalReload = () => {
  clearGlobalError()
  try {
    if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
      window.location.reload()
      return
    }
  } catch (e) { /* 继续用 uni.reLaunch 兜底 */ }
  try { uni.reLaunch({ url: '/pages/Home' }) } catch (e) { /* 忽略 */ }
}

// ===== 主 Tab 左右滑动切换（补齐旧版 App.vue 的手势） =====
const MAIN_TABS = ['/home', '/square', '/preferred', '/mine']
// 这些区域内的横向拖动不触发切 Tab（可滚动区域/弹层/输入框等）
const IGNORE_SELECTOR = 'input, textarea, .banner-swiper, .tag-filter, [data-no-swipe], [class*="overlay"], [class*="modal"], [class*="sheet"], [class*="panel"]'
let swipeStartX = 0
let swipeStartY = 0
let swiping = false

const isHorizontallyScrollable = (el) => {
  if (typeof window === 'undefined') return false
  let node = el
  while (node && node !== document.body) {
    const ox = window.getComputedStyle ? window.getComputedStyle(node).overflowX : ''
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
  setNavDirection(dx < 0 ? 'left' : 'right')
  router.push(MAIN_TABS[nextIdx])
}

const onPointerCancel = () => { swiping = false }

let pointerBound = false
const bindSwipe = () => {
  if (pointerBound || typeof window === 'undefined') return
  pointerBound = true
  window.addEventListener('pointerdown', onPointerDown, { passive: true })
  window.addEventListener('pointerup', onPointerUp, { passive: true })
  window.addEventListener('pointercancel', onPointerCancel, { passive: true })
}
const unbindSwipe = () => {
  if (!pointerBound || typeof window === 'undefined') return
  pointerBound = false
  window.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerCancel)
}

onMounted(() => {
  socketService.on('call_invite', (data) => {
    if (incomingRef.value) incomingRef.value.showIncomingCall(data)
  })
  bindSwipe()
})

onUnmounted(() => {
  unbindSwipe()
})
</script>

<style scoped>
.global-error-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.global-error-card {
  width: 100%;
  max-width: 320px;
  background: #fff;
  border-radius: 16px;
  padding: 28px 24px 22px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.global-error-icon {
  font-size: 34px;
  margin-bottom: 10px;
}

.global-error-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.global-error-message {
  font-size: 13px;
  line-height: 1.5;
  color: #888;
  word-break: break-all;
  margin-bottom: 18px;
}

.global-error-retry {
  width: 100%;
  height: 42px;
  border: none;
  border-radius: 10px;
  background: var(--gradient-primary, #667eea);
  color: #fff;
  font-size: 15px;
  cursor: pointer;
}
</style>
