<template>
  <Teleport to="body">
    <Transition name="splash-fade">
      <view v-if="splash" class="splash-overlay" data-no-swipe @click="close">
        <view class="splash-body">
          <view class="splash-card" :class="{ 'splash-card--link': !!splash.link }" @click.stop="activate">
            <image mode="aspectFill" class="splash-image" :src="imageSrc" :alt="splash.title || '活动弹窗'" @error="imageBroken = true" />
            <view v-if="splash.title" class="splash-title">{{ splash.title }}</view>
          </view>
          <button class="splash-close" aria-label="关闭弹窗" @click.stop="close">✕</button>
        </view>
      </view>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { genCover } from '../utils/placeholder'

const props = defineProps({
  splash: { type: Object, default: null }
})
const emit = defineEmits(['close', 'navigate'])

const imageBroken = ref(false)
const imageSrc = ref(props.splash?.image || '')

watch(
  () => props.splash,
  (splash) => {
    imageBroken.value = false
    imageSrc.value = splash?.image || ''
  }
)

// 图片加载失败时退回本地占位图，标题仍可读
watch(imageBroken, (broken) => {
  if (broken && props.splash) imageSrc.value = genCover(`splash-${props.splash.id}`)
})

const close = () => emit('close')

const activate = () => {
  if (props.splash?.link) emit('navigate', props.splash.link)
  else emit('close')
}
</script>

<style scoped>
.splash-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  padding: 24px;
}
.splash-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 320px;
}
.splash-card {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
}
.splash-card--link {
  cursor: pointer;
}
.splash-image {
  display: block;
  width: 100%;
  max-height: 60vh;
  object-fit: cover;
}
.splash-title {
  padding: 12px 16px;
  font-size: 15px;
  color: #1c1c1e;
  text-align: center;
  word-break: break-word;
}
.splash-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
.splash-fade-enter-active,
.splash-fade-leave-active {
  transition: opacity 0.25s ease;
}
.splash-fade-enter-from,
.splash-fade-leave-to {
  opacity: 0;
}
</style>
