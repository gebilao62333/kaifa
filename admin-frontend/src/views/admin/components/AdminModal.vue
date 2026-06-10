<template>
  <teleport to="body">
    <div v-if="visible" class="admin-modal-overlay" @click.self="handleClose">
      <div class="admin-modal-content" :style="{ maxWidth: width }">
        <div class="admin-modal-header">
          <h3>{{ title }}</h3>
          <button class="admin-modal-close" @click="handleClose">&times;</button>
        </div>
        <div class="admin-modal-body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="admin-modal-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
export default {
  name: 'AdminModal',
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: '' },
    width: { type: String, default: '560px' },
    closable: { type: Boolean, default: true }
  },
  emits: ['update:visible', 'close'],
  methods: {
    handleClose() {
      if (!this.closable) return
      this.$emit('update:visible', false)
      this.$emit('close')
    }
  }
}
</script>

<style>
.admin-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  padding-top: 40px;
  padding-left: 240px;
  z-index: 1000;
  backdrop-filter: blur(2px);
}
.admin-modal-content {
  background: #fff;
  border-radius: 10px;
  width: calc(100vw - 280px);
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}
.admin-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #f0f0f0;
}
.admin-modal-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #1a1a2e;
}
.admin-modal-close {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #999;
  padding: 4px;
  line-height: 1;
  transition: color 0.2s;
}
.admin-modal-close:hover { color: #333; }
.admin-modal-body { padding: 24px; }
.admin-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}
</style>
