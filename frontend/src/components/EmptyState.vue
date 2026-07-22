<template>
  <div class="empty-state">
    <div class="empty-icon">{{ icon }}</div>
    <p class="empty-text">{{ text }}</p>
    <p v-if="hint" class="empty-hint">{{ hint }}</p>
    <button v-if="actionText" class="empty-action" @click="$emit('action')">{{ actionText }}</button>
  </div>
</template>

<script setup>
// 统一空状态组件：消除各页面重复手写的「暂无数据」占位
defineProps({
  text: { type: String, default: '暂无数据' },
  hint: { type: String, default: '' },
  actionText: { type: String, default: '' },
  icon: { type: String, default: '📭' }
})
defineEmits(['action'])
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-muted, #999);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-hint, #ccc);
  margin-bottom: 16px;
}

.empty-action {
  background: var(--gradient-primary, var(--gradient-primary));
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

.empty-action:active {
  transform: scale(0.96);
}
</style>
