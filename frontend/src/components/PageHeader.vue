<template>
  <!--
    通用页面头部组件
    用法：
      <PageHeader title="页面标题" />
      <PageHeader title="标题" @back="goBack" show-back />
      <PageHeader title="标题">
        <template #right>
          <button>操作</button>
        </template>
      </PageHeader>
  -->
  <header class="ph-header" :class="{ 'ph-header--tall': tall }">
    <div v-if="showBack || $slots.left" class="ph-back" @click="$emit('back')">
      <slot name="left">
        <span>‹</span>
      </slot>
    </div>
    <div class="ph-title">
      <slot name="title">{{ title }}</slot>
    </div>
    <div v-if="$slots.right" class="ph-action">
      <slot name="right"></slot>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: false },
  tall: { type: Boolean, default: false }
})

defineEmits(['back'])
</script>

<style scoped>
.ph-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  z-index: 100;
  box-sizing: border-box;
}

.ph-header--tall {
  height: 82px;
}

.ph-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.ph-back {
  position: absolute;
  left: 16px;
  font-size: 28px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  user-select: none;
}

.ph-action {
  position: absolute;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* PC端居中 */
@media (min-width: 768px) {
  .ph-header {
    left: 50%;
    transform: translateX(-50%);
    max-width: 650px;
  }
}

@media (min-width: 1024px) {
  .ph-header {
    max-width: 720px;
  }
}
</style>
