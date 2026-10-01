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
          :class="['gift-item', { selected: selectedGift?.id === gift.id, luxury: gift.giftType === 1 }]"
          @click="selectGift(gift)"
        >
          <div class="gift-icon">
            <img v-if="gift.icon" :src="gift.icon" class="gift-img" alt="">
            <span v-else>🎁</span>
            <span class="gift-badge" v-if="gift.giftType === 1">豪华</span>
            <span class="gift-badge vip-badge" v-else-if="gift.isVip">VIP</span>
          </div>
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
          <img
            v-if="animatingGift?.icon && /^https?:/.test(animatingGift.icon)"
            class="animation-icon-img"
            :src="animatingGift.icon"
            alt=""
          />
          <span v-else class="animation-icon">{{ animatingGift?.icon }}</span>
          <span class="animation-name">{{ animatingGift?.name }}</span>
          <span class="animation-count">x{{ animatingCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import giftService from '../../services/giftService'

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
    type: [String, Number],
    default: ''
  }
})

const emit = defineEmits(['close', 'send'])

const activeTab = ref('all')
const selectedGift = ref(null)
const giftCount = ref(1)
const showAnimation = ref(false)
const animatingGift = ref(null)
const animatingCount = ref(0)

const tabs = [
  { id: 'all', name: '全部' },
  { id: 'popular', name: '热门' },
  { id: 'luxury', name: '豪华' }
]

const gifts = ref([])

// 接口失败时的兜底数据
const fallbackGifts = [
  { id: 1, icon: '🌹', name: '玫瑰', price: 10, giftType: 0, isVip: 0 },
  { id: 2, icon: '🍫', name: '巧克力', price: 20, giftType: 0, isVip: 0 },
  { id: 3, icon: '🎀', name: '蝴蝶结', price: 30, giftType: 0, isVip: 0 },
  { id: 4, icon: '💎', name: '钻石', price: 50, giftType: 0, isVip: 1 },
  { id: 5, icon: '👑', name: '皇冠', price: 100, giftType: 0, isVip: 1 },
  { id: 6, icon: '🚀', name: '火箭', price: 200, giftType: 0, isVip: 0 },
  { id: 7, icon: '🏎️', name: '豪华跑车', price: 500, giftType: 1, isVip: 1 },
  { id: 8, icon: '✈️', name: '豪华飞机', price: 800, giftType: 1, isVip: 1 },
  { id: 9, icon: '🚀', name: '飞船', price: 1000, giftType: 1, isVip: 1 }
]

const loadGifts = async () => {
  try {
    const res = await giftService.getGiftList()
    const list = res?.data || []
    if (list.length > 0) {
      gifts.value = list.map(item => ({
        id: item.giftId,
        icon: item.image || '',
        name: item.name,
        price: Number(item.goldCoins),
        giftType: Number(item.giftType) || 0,
        isVip: Number(item.isVip) || 0,
        animation: item.animation || ''
      }))
    } else {
      gifts.value = fallbackGifts
    }
  } catch (e) {
    gifts.value = fallbackGifts
  }
}

const currentGifts = computed(() => {
  if (activeTab.value === 'all') return gifts.value
  const type = activeTab.value === 'luxury' ? 1 : 0
  return gifts.value.filter(g => g.giftType === type)
})

onMounted(loadGifts)

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
    receiverId: props.receiverId,
    giftType: selectedGift.value.giftType || 0,
    isVip: selectedGift.value.isVip || 0,
    animation: selectedGift.value.animation || ''
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
  justify-content: center;
  z-index: 100;
}

.gift-list-panel {
  width: 100%;
  max-width: var(--layout-max-width-pc, 650px);
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
  background: var(--gradient-primary);
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
  border-color: var(--color-primary);
  background: rgba(102, 126, 234, 0.2);
}

.gift-item.luxury {
  border-color: rgba(255, 215, 0, 0.4);
  background: linear-gradient(180deg, rgba(255, 215, 0, 0.12) 0%, rgba(255, 180, 0, 0.05) 100%);
}

.gift-item.luxury.selected {
  border-color: #ffd700;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.5);
}

.gift-icon {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  margin-bottom: 8px;
}

.gift-img {
  width: 44px;
  height: 44px;
  object-fit: contain;
  border-radius: 8px;
}

.gift-badge {
  position: absolute;
  top: -8px;
  right: -14px;
  font-size: 9px;
  color: #fff;
  background: linear-gradient(135deg, #ffd700, #ff9d00);
  padding: 1px 5px;
  border-radius: 8px;
  font-weight: bold;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.gift-badge.vip-badge {
  background: linear-gradient(135deg, #a855f7, #6366f1);
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
  background: var(--gradient-primary);
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

.animation-icon-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
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
