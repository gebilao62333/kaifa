<template>
  <div class="gift-list-overlay" v-if="visible" @click.self="close">
    <div class="gift-list-panel">
      <div class="panel-header">
        <span class="panel-title">🎁 发送礼物</span>
        <span class="panel-close" @click="close">✕</span>
      </div>

      <div class="gift-tabs">
        <span
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-item', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </span>
      </div>

      <div class="gift-grid">
        <div
          v-for="gift in currentGifts"
          :key="gift.id"
          :class="['gift-item', { selected: selectedGift?.id === gift.id }]"
          @click="selectGift(gift)"
        >
          <div class="gift-icon">{{ gift.icon }}</div>
          <div class="gift-name">{{ gift.name }}</div>
          <div class="gift-price">
            <span class="coin-icon">🪙</span>
            <span class="price-value">{{ gift.price }}</span>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <div class="balance-info">
          <span class="balance-label">我的金币</span>
          <span class="balance-value">{{ userBalance }}</span>
        </div>
        <div class="gift-count" v-if="selectedGift">
          <span class="count-label">x</span>
          <div class="count-control">
            <span class="count-btn" @click="decreaseCount">-</span>
            <span class="count-value">{{ giftCount }}</span>
            <span class="count-btn" @click="increaseCount">+</span>
          </div>
        </div>
        <button
          class="send-btn"
          :disabled="!selectedGift"
          @click="sendGift"
        >
          发送礼物
        </button>
      </div>

      <div class="gift-animation" v-if="showAnimation">
        <div class="animation-content">
          <span class="animation-icon">{{ animatingGift?.icon }}</span>
          <span class="animation-name">{{ animatingGift?.name }}</span>
          <span class="animation-count">x{{ animatingCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  userBalance: {
    type: Number,
    default: 128.50
  },
  receiverId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'send'])

const activeTab = ref('popular')
const selectedGift = ref(null)
const giftCount = ref(1)
const showAnimation = ref(false)
const animatingGift = ref(null)
const animatingCount = ref(0)

const tabs = [
  { id: 'popular', name: '热门' },
  { id: 'luxury', name: '豪华' },
  { id: 'special', name: '特效' }
]

const gifts = {
  popular: [
    { id: 1, icon: '🌹', name: '玫瑰', price: 10 },
    { id: 2, icon: '🍫', name: '巧克力', price: 20 },
    { id: 3, icon: '🎀', name: '蝴蝶结', price: 30 },
    { id: 4, icon: '💎', name: '钻石', price: 50 },
    { id: 5, icon: '👑', name: '皇冠', price: 100 },
    { id: 6, icon: '🚀', name: '火箭', price: 200 }
  ],
  luxury: [
    { id: 7, icon: '🏎️', name: '跑车', price: 500 },
    { id: 8, icon: '✈️', name: '飞机', price: 800 },
    { id: 9, icon: '🚀', name: '飞船', price: 1000 },
    { id: 10, icon: '💯', name: '百分', price: 1500 },
    { id: 11, icon: '🎉', name: '庆典', price: 2000 },
    { id: 12, icon: '💥', name: '爆炸', price: 3000 }
  ],
  special: [
    { id: 13, icon: '💜', name: '紫心', price: 66 },
    { id: 14, icon: '🌸', name: '樱花', price: 88 },
    { id: 15, icon: '⭐', name: '星星', price: 99 },
    { id: 16, icon: '🎀', name: '丝带', price: 128 },
    { id: 17, icon: '💫', name: '流星', price: 188 },
    { id: 18, icon: '🌙', name: '月亮', price: 288 }
  ]
}

const currentGifts = computed(() => {
  return gifts[activeTab.value] || gifts.popular
})

const totalPrice = computed(() => {
  if (!selectedGift.value) return 0
  return selectedGift.value.price * giftCount.value
})

watch(() => props.visible, (newVal) => {
  if (!newVal) {
    selectedGift.value = null
    giftCount.value = 1
  }
})

const selectGift = (gift) => {
  selectedGift.value = gift
  giftCount.value = 1
}

const decreaseCount = () => {
  if (giftCount.value > 1) {
    giftCount.value--
  }
}

const increaseCount = () => {
  const maxCount = Math.floor(props.userBalance / selectedGift.value.price)
  if (giftCount.value < maxCount) {
    giftCount.value++
  }
}

const close = () => {
  emit('close')
}

const sendGift = () => {
  if (!selectedGift.value) return

  if (totalPrice.value > props.userBalance) {
    alert('金币不足，请先充值')
    return
  }

  animatingGift.value = selectedGift.value
  animatingCount.value = giftCount.value
  showAnimation.value = true

  emit('send', {
    gift: selectedGift.value,
    count: giftCount.value,
    totalPrice: totalPrice.value,
    receiverId: props.receiverId
  })

  setTimeout(() => {
    showAnimation.value = false
    selectedGift.value = null
    giftCount.value = 1
    close()
  }, 1500)
}
</script>

<style scoped>
.gift-list-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-end;
  z-index: 100;
}

.gift-list-panel {
  width: 100%;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px 20px 0 0;
  max-height: 70vh;
  overflow: hidden;
  position: relative;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-title {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.panel-close {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.panel-close:hover {
  color: white;
}

.gift-tabs {
  display: flex;
  padding: 16px 20px;
  gap: 16px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.gift-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px 20px;
  max-height: 40vh;
  overflow-y: auto;
}

.gift-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.gift-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.gift-item.selected {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.2);
}

.gift-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.gift-name {
  font-size: 13px;
  color: white;
  margin-bottom: 4px;
}

.gift-price {
  display: flex;
  align-items: center;
  gap: 2px;
}

.coin-icon {
  font-size: 12px;
}

.price-value {
  font-size: 12px;
  color: #ffd700;
  font-weight: bold;
}

.panel-footer {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.balance-info {
  display: flex;
  flex-direction: column;
}

.balance-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.balance-value {
  font-size: 16px;
  color: #ffd700;
  font-weight: bold;
}

.gift-count {
  display: flex;
  align-items: center;
  margin-left: 20px;
  gap: 8px;
}

.count-label {
  font-size: 14px;
  color: white;
}

.count-control {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
}

.count-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
  cursor: pointer;
}

.count-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.count-value {
  width: 40px;
  text-align: center;
  font-size: 14px;
  color: white;
}

.send-btn {
  flex: 1;
  margin-left: auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 24px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn:not(:disabled):hover {
  transform: scale(1.02);
}

.gift-animation {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.animation-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: giftFloat 1.5s ease-out forwards;
}

.animation-icon {
  font-size: 80px;
  animation: giftBounce 0.5s ease-in-out infinite;
}

.animation-name {
  font-size: 18px;
  color: white;
  font-weight: bold;
  margin-top: 8px;
}

.animation-count {
  font-size: 24px;
  color: #ffd700;
  font-weight: bold;
}

@keyframes giftFloat {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.5);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -80%) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -120%) scale(1);
  }
}

@keyframes giftBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
