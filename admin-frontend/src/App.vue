<template>
  <div class="app-container">
    <router-view />
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', t.type]">
        {{ t.msg }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast'
const { toasts } = useToast()
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html, body {
  min-height: 100vh;
}
#app {
  min-height: 100vh;
}
.app-container {
  position: relative;
  min-height: 100vh;
}
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toast {
  padding: 12px 24px;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: toast-in 0.3s ease;
  min-width: 200px;
}
.toast.success { background: #52c41a; }
.toast.error { background: #ff4d4f; }
.toast.info { background: #1890ff; }
@keyframes toast-in {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
