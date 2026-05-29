<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <div class="error-icon">⚠️</div>
      <div class="error-title">页面加载出错</div>
      <div class="error-message">{{ errorMessage }}</div>
      <button class="retry-btn" @click="handleRetry">重新加载</button>
    </div>
  </div>
  <template v-else>
    <slot></slot>
  </template>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')
const componentStack = ref('')

const handleRetry = () => {
  hasError.value = false
  errorMessage.value = ''
  componentStack.value = ''
  window.location.reload()
}

onErrorCaptured((error, instance, info) => {
  hasError.value = true
  errorMessage.value = error ? (error.message || String(error)) : '未知错误'
  componentStack.value = String(info || '')
  
  console.error('[ErrorBoundary] 捕获到错误:', error)
  if (instance) {
    console.error('[ErrorBoundary] 组件信息:', String(instance?.$options?.name || instance?.type?.name || instance?.type || '未知组件'))
  }
  console.error('[ErrorBoundary] 错误位置:', info)
  
  return false
})
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.error-content {
  text-align: center;
  padding: 40px;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.error-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.error-message {
  font-size: 14px;
  color: #999;
  margin-bottom: 24px;
  max-width: 300px;
  word-break: break-all;
}

.retry-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  padding: 12px 32px;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:active {
  transform: scale(0.95);
}
</style>