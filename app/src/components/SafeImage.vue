<template>
  <image v-bind="$attrs" :src="currentSrc" :mode="mode" @error="onImageError" />
</template>

<script setup>
import { ref, watch } from 'vue'
import { genAvatar } from '../utils/placeholder'

// U-23：替代旧的 img + v-img-fallback 指令。uni <image> 是组件，不能依赖 DOM img.src，
// 因此把「加载失败回退头像」下沉到组件内部，同时按 CSS 尺寸选择 mode。
const props = defineProps({
  src: { type: String, default: '' },
  fallback: { type: String, default: '' },
  mode: { type: String, default: 'aspectFill' }
})

const currentSrc = ref(props.src || genAvatar(props.fallback || 'user'))
let fallbackApplied = false

watch(() => props.src, (value) => {
  fallbackApplied = false
  currentSrc.value = value || genAvatar(props.fallback || 'user')
})

const onImageError = () => {
  if (fallbackApplied) return
  fallbackApplied = true
  currentSrc.value = genAvatar(props.fallback || 'user')
}
</script>
