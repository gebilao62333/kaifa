<template>
  <div class="unlock-overlay" v-if="visible" @click.self="close">
    <div class="unlock-dialog">
      <div class="dialog-header">
        <span class="lock-icon">🔒</span>
        <span class="dialog-title">私密帖子</span>
      </div>

      <div class="dialog-body">
        <div class="author-info">
          <img :src="post.author.avatar" class="author-avatar" />
          <div class="author-detail">
            <span class="author-name">{{ post.author.name }}</span>
            <span class="author-desc">发布了私密内容</span>
          </div>
        </div>

        <div class="unlock-options">
          <div class="option-title">选择解锁方式</div>

          <div
            :class="['option-item', { active: unlockMethod === 'gift' }]"
            @click="unlockMethod = 'gift'"
          >
            <div class="option-icon">🎁</div>
            <div class="option-info">
              <span class="option-name">送礼物解锁</span>
              <span class="option-desc">送价值{{ unlockPrice }}金币的礼物即可查看</span>
            </div>
            <span :class="['check-icon', { checked: unlockMethod === 'gift' }]">✓</span>
          </div>

          <div
            :class="['option-item', { active: unlockMethod === 'subscribe' }]"
            @click="unlockMethod = 'subscribe'"
          >
            <div class="option-icon">⭐</div>
            <div class="option-info">
              <span class="option-name">关注作者</span>
              <span class="option-desc">关注后可免费查看此内容</span>
            </div>
            <span :class="['check-icon', { checked: unlockMethod === 'subscribe' }]">✓</span>
          </div>

          <div
            :class="['option-item', { active: unlockMethod === 'vip' }]"
            @click="unlockMethod = 'vip'"
          >
            <div class="option-icon">👑</div>
            <div class="option-info">
              <span class="option-name">VIP会员</span>
              <span class="option-desc">开通VIP会员可查看所有私密内容</span>
            </div>
            <span :class="['check-icon', { checked: unlockMethod === 'vip' }]">✓</span>
          </div>
        </div>

        <div class="gift-preview" v-if="unlockMethod === 'gift'">
          <div class="preview-label">请选择礼物</div>
          <div class="preview-gifts">
            <div
              v-for="gift in miniGifts"
              :key="gift.id"
              :class="['mini-gift', { active: selectedGift?.id === gift.id }]"
              @click="selectedGift = gift"
            >
              <span class="mini-icon">{{ gift.icon }}</span>
              <span class="mini-price">{{ gift.price }}</span>
            </div>
          </div>
          <div class="preview-tip" v-if="selectedGift">
            需赠送 <span class="highlight">{{ selectedGift.price }}</span> 金币的礼物
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="cancel-btn" @click="close">取消</button>
        <button class="confirm-btn" @click="handleUnlock" :disabled="isLoading">
          {{ confirmText }}
        </button>
      </div>

      <div class="success-animation" v-if="showSuccess">
        <div class="success-content">
          <span class="success-icon">🔓</span>
          <span class="success-text">解锁成功</span>
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
  post: {
    type: Object,
    default: () => ({
      id: '',
      author: {
        id: '',
        name: '未知用户',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
      }
    })
  },
  unlockPrice: {
    type: Number,
    default: 10
  },
  userBalance: {
    type: Number,
    default: 128.50
  },
  isVip: {
    type: Boolean,
    default: false
  },
  isFollowing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'unlock', 'subscribe', 'openVip'])

const unlockMethod = ref('gift')
const selectedGift = ref(null)
const isLoading = ref(false)
const showSuccess = ref(false)

const miniGifts = [
  { id: 1, icon: '🌹', name: '玫瑰', price: 10 },
  { id: 2, icon: '🍫', name: '巧克力', price: 20 },
  { id: 3, icon: '💎', name: '钻石', price: 50 }
]

const confirmText = computed(() => {
  if (isLoading.value) return '处理中...'
  switch (unlockMethod.value) {
    case 'gift':
      return selectedGift.value ? `赠送 ${selectedGift.value.price} 金币` : '请选择礼物'
    case 'subscribe':
      return props.isFollowing ? '已关注' : '立即关注'
    case 'vip':
      return '开通VIP'
    default:
      return '确认'
  }
})

watch(() => props.visible, (newVal) => {
  if (!newVal) {
    unlockMethod.value = 'gift'
    selectedGift.value = null
    isLoading.value = false
    showSuccess.value = false
  }
})

watch(unlockMethod, (newVal) => {
  if (newVal === 'subscribe' && props.isFollowing) {
    selectedGift.value = null
  }
})

const close = () => {
  emit('close')
}

const handleUnlock = () => {
  if (isLoading.value) return

  switch (unlockMethod.value) {
    case 'gift':
      if (!selectedGift.value) return
      if (selectedGift.value.price > props.userBalance) {
        alert('金币不足，请先充值')
        return
      }
      isLoading.value = true
      setTimeout(() => {
        isLoading.value = false
        showSuccess.value = true
        emit('unlock', {
          method: 'gift',
          gift: selectedGift.value,
          postId: props.post.id
        })
        setTimeout(() => {
          showSuccess.value = false
          close()
        }, 1500)
      }, 1000)
      break

    case 'subscribe':
      if (props.isFollowing) return
      isLoading.value = true
      setTimeout(() => {
        isLoading.value = false
        showSuccess.value = true
        emit('subscribe', {
          authorId: props.post.author.id,
          postId: props.post.id
        })
        setTimeout(() => {
          showSuccess.value = false
          close()
        }, 1500)
      }, 1000)
      break

    case 'vip':
      emit('openVip')
      close()
      break
  }
}
</script>

<style scoped>
.unlock-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 40px 20px;
}

.unlock-dialog {
  width: 100%;
  max-width: 360px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
}

.dialog-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.lock-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.dialog-title {
  font-size: 18px;
  font-weight: bold;
}

.dialog-body {
  padding: 20px;
}

.author-info {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 12px;
  margin-bottom: 20px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.author-detail {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.author-desc {
  font-size: 12px;
  color: #999;
}

.unlock-options {
  margin-bottom: 16px;
}

.option-title {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 14px;
  background: #f9f9f9;
  border-radius: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.option-item:hover {
  background: #f0f0f0;
}

.option-item.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.option-icon {
  font-size: 28px;
  margin-right: 12px;
}

.option-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.option-name {
  font-size: 15px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.option-desc {
  font-size: 12px;
  color: #999;
}

.check-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: transparent;
  transition: all 0.2s;
}

.check-icon.checked {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.gift-preview {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 14px;
}

.preview-label {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}

.preview-gifts {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.mini-gift {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.mini-gift:hover {
  border-color: #ddd;
}

.mini-gift.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.mini-icon {
  font-size: 28px;
  margin-bottom: 4px;
}

.mini-price {
  font-size: 12px;
  color: #ffd700;
  font-weight: bold;
}

.preview-tip {
  text-align: center;
  font-size: 13px;
  color: #666;
}

.preview-tip .highlight {
  color: #ff6b6b;
  font-weight: bold;
}

.dialog-footer {
  display: flex;
  padding: 16px 20px;
  gap: 12px;
  border-top: 1px solid #f5f5f5;
}

.cancel-btn {
  flex: 1;
  padding: 14px;
  border: 1px solid #ddd;
  border-radius: 24px;
  background: white;
  font-size: 15px;
  color: #666;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #f5f5f5;
}

.confirm-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-size: 15px;
  color: white;
  cursor: pointer;
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-btn:not(:disabled):hover {
  transform: scale(1.02);
}

.success-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.success-content {
  text-align: center;
}

.success-icon {
  font-size: 80px;
  display: block;
  animation: unlockBounce 0.6s ease-out;
}

.success-text {
  font-size: 20px;
  font-weight: bold;
  color: #667eea;
  display: block;
  margin-top: 16px;
}

@keyframes unlockBounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
