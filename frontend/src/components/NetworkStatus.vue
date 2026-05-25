<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showBanner" :class="['network-banner', bannerClass]">
        <span class="banner-icon">{{ icon }}</span>
        <span class="banner-text">{{ message }}</span>
        <button class="retry-btn" v-if="!isOnline" @click="handleRetry">重试</button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import networkStatus from '../utils/networkStatus'

const showBanner = ref(false)
let hideTimer = null

const isOnline = computed(() => networkStatus.isOnline.value)

const bannerClass = computed(() => {
  if (!isOnline.value) return 'offline'
  if (networkStatus.isSlowNetwork()) return 'slow'
  return 'good'
})

const icon = computed(() => {
  if (!isOnline.value) return '📵'
  if (networkStatus.isSlowNetwork()) return '⚠️'
  return '📶'
})

const message = computed(() => {
  if (!isOnline.value) return '网络连接已断开'
  if (networkStatus.isSlowNetwork()) return `网络较慢 (${networkStatus.effectiveType.value})`
  return ''
})

watch(isOnline, (online) => {
  if (!online) {
    showBanner.value = true
    if (hideTimer) clearTimeout(hideTimer)
  } else {
    hideTimer = setTimeout(() => {
      showBanner.value = false
    }, 3000)
  }
})

const handleRetry = () => {
  if (navigator.onLine) {
    showBanner.value = false
  }
}

onMounted(() => {
  networkStatus.init()
  networkStatus.addListener((event, data) => {
    if (event === 'offline') {
      showBanner.value = true
    } else if (event === 'online') {
      hideTimer = setTimeout(() => {
        showBanner.value = false
      }, 2000)
    }
  })
})

onUnmounted(() => {
  if (hideTimer) clearTimeout(hideTimer)
  networkStatus.destroy()
})
</script>

<style scoped>
.network-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 10000;
  font-size: 13px;
}

.network-banner.offline {
  background: #ff3b30;
  color: #fff;
}

.network-banner.slow {
  background: #ff9500;
  color: #fff;
}

.network-banner.good {
  background: #4cd964;
  color: #fff;
}

.banner-icon {
  font-size: 14px;
}

.banner-text {
  flex: 1;
  text-align: center;
}

.retry-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>