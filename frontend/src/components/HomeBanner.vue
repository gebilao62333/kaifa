<template>
  <div class="banner-section">
    <div class="banner-swiper" @touchstart="onTouchStart" @touchend="onTouchEnd">
      <div class="banner-track" :style="{ transform: `translateX(-${currentBannerIndex * 100}%)` }">
        <div v-for="(banner, index) in banners" :key="index" class="banner-slide">
          <img class="banner-image" v-lazy="banner.image" :alt="banner.title" @click="onBannerClick(banner)" />
        </div>
      </div>
      <div class="banner-dots">
        <span
          v-for="(banner, index) in banners"
          :key="index"
          class="dot"
          :class="{ active: currentBannerIndex === index }"
          @click="goToBanner(index)"
        ></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  banners: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['banner-click'])

const currentBannerIndex = ref(0)
let autoPlayTimer = null
let touchStartX = 0
let touchEndX = 0

const startAutoPlay = () => {
  stopAutoPlay()
  autoPlayTimer = setInterval(() => {
    currentBannerIndex.value = (currentBannerIndex.value + 1) % props.banners.length
  }, 3000)
}

const stopAutoPlay = () => {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
}

const goToBanner = (index) => {
  currentBannerIndex.value = index
  startAutoPlay()
}

const onBannerClick = (banner) => {
  emit('banner-click', banner)
}

const onTouchStart = (e) => {
  touchStartX = e.touches[0].clientX
  stopAutoPlay()
}

const onTouchEnd = (e) => {
  touchEndX = e.changedTouches[0].clientX
  handleSwipe()
  startAutoPlay()
}

const handleSwipe = () => {
  const diff = touchStartX - touchEndX
  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      currentBannerIndex.value = (currentBannerIndex.value + 1) % props.banners.length
    } else {
      currentBannerIndex.value = (currentBannerIndex.value - 1 + props.banners.length) % props.banners.length
    }
  }
}

onMounted(() => {
  if (props.banners.length > 0) {
    startAutoPlay()
  }
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<style scoped>
.banner-section {
  margin: 10px 20px 0;
}

.banner-swiper {
  height: 200px;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

.banner-track {
  display: flex;
  height: 100%;
  transition: transform 0.3s ease;
}

.banner-slide {
  flex: 0 0 100%;
  height: 100%;
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.banner-dots {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot.active {
  width: 16px;
  border-radius: 3px;
  background: #fff;
}

/* PC端Banner优化 */
@media (min-width: 768px) {
  .banner-section {
    margin: 12px 0 0;
  }
  
  .banner-swiper {
    height: 180px;
    border-radius: 12px;
  }
  
  .banner-dots {
    bottom: 8px;
  }
  
  .dot {
    width: 5px;
    height: 5px;
  }
  
  .dot.active {
    width: 14px;
  }
}
</style>