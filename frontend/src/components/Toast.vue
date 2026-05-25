<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" :class="['toast', type]" @click="handleClick">
        <span class="toast-icon">{{ iconMap[type] }}</span>
        <span class="toast-message">{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { TIMERS } from '../common/constants'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info',
    validator: (v) => ['success', 'error', 'warning', 'info'].includes(v)
  },
  duration: {
    type: Number,
    default: TIMERS.TOAST_DURATION
  },
  closable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'close'])

const iconMap = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ'
}

let timer = null

watch(() => props.visible, (val) => {
  if (val && props.duration > 0) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      close()
    }, props.duration)
  }
})

const close = () => {
  emit('update:visible', false)
  emit('close')
}

const handleClick = () => {
  if (props.closable) {
    close()
  }
}
</script>

<style scoped>
.toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.toast.success {
  background-color: #52c41a;
  color: #fff;
}

.toast.error {
  background-color: #ff4d4f;
  color: #fff;
}

.toast.warning {
  background-color: #faad14;
  color: #fff;
}

.toast.info {
  background-color: #1890ff;
  color: #fff;
}

.toast-icon {
  font-size: 16px;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>
