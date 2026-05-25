<template>
  <div class="redpacket-overlay" v-if="visible" @click.self="close">
    <div class="redpacket-panel">
      <div class="panel-header">
        <div class="header-decoration">
          <span>🎇</span>
          <span>🎆</span>
        </div>
        <span class="panel-title">🧧 发红包</span>
        <span class="panel-close" @click="close">✕</span>
      </div>

      <div class="redpacket-decoration">
        <span>✦</span>
        <span>⭐</span>
        <span>✦</span>
      </div>

      <div class="input-section">
        <div class="amount-card">
          <div class="amount-input-wrap">
            <span class="amount-label">💰</span>
            <input 
              class="amount-input" 
              type="number" 
              v-model="amount" 
              placeholder="0.00"
              @keyup.enter="sendRedPacket"
              step="0.01"
              min="0.01"
            />
          </div>
          <span class="amount-hint">余额: {{ userBalance.toFixed(2) }} 金币</span>
        </div>
      </div>

      <div class="message-section">
        <span class="section-label">祝福语</span>
        <input 
          class="message-input" 
          type="text" 
          v-model="message" 
          placeholder="恭喜发财，大吉大利"
          maxlength="20"
        />
        <div class="quick-phrases">
          <span 
            v-for="(phrase, index) in quickPhrases" 
            :key="index" 
            class="quick-phrase"
            @click="selectPhrase(phrase)"
          >
            {{ phrase }}
          </span>
        </div>
      </div>

      <div class="send-section">
        <div 
          class="send-btn" 
          :class="{ disabled: !canSend, loading: isLoading }" 
          @click="sendRedPacket"
        >
          <span v-if="isLoading" class="loading-icon">⏳</span>
          <span v-else class="btn-icon">🧧</span>
          <span class="btn-text">{{ isLoading ? '发送中...' : '发红包' }}</span>
        </div>
      </div>

      <div class="success-overlay" v-if="showSuccess">
        <div class="success-content">
          <span class="success-icon">🎉</span>
          <span class="success-text">发送成功</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { giftService } from '@/services/giftService'

export default {
  name: 'RedPacketPanel',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    userBalance: {
      type: Number,
      default: 0
    },
    receiverId: {
      type: String,
      default: ''
    }
  },
  emits: ['close', 'send'],
  setup(props, { emit }) {
    const amount = ref('')
    const message = ref('恭喜发财，大吉大利')
    const isLoading = ref(false)
    const showSuccess = ref(false)

    const quickPhrases = [
      '恭喜发财',
      '大吉大利',
      '万事如意',
      '财源广进',
      '新年快乐',
      '生日快乐'
    ]

    const canSend = computed(() => {
      const num = parseFloat(amount.value) || 0
      return props.receiverId && num > 0 && num <= props.userBalance && !isLoading.value
    })

    const selectPhrase = (phrase) => {
      message.value = phrase
    }

    const sendRedPacket = async () => {
      if (!canSend.value) return

      if (!props.receiverId) {
        alert('请选择接收者')
        return
      }

      const num = parseFloat(amount.value) || 0
      
      if (!amount.value || num <= 0) {
        alert('红包金额不能为空')
        return
      }

      if (num > props.userBalance) {
        alert('余额不足')
        return
      }

      const amountFixed = parseFloat(num.toFixed(2))

      isLoading.value = true

      const res = await giftService.sendRedPacket(
        props.receiverId,
        amountFixed,
        1,
        'normal'
      )

      isLoading.value = false

      if (res.code === 200) {
        showSuccess.value = true
        setTimeout(() => {
          emit('send', {
            type: 'normal',
            amount: amountFixed,
            count: 1,
            message: message.value
          })
          close()
        }, 1500)
      } else {
        alert(res.message || '发送红包失败')
      }
    }

    const close = () => {
      amount.value = ''
      message.value = '恭喜发财，大吉大利'
      showSuccess.value = false
      emit('close')
    }

    watch(() => props.visible, (newVal) => {
      if (!newVal) {
        amount.value = ''
        message.value = '恭喜发财，大吉大利'
        isLoading.value = false
        showSuccess.value = false
      }
    })

    return {
      amount,
      message,
      quickPhrases,
      canSend,
      isLoading,
      showSuccess,
      selectPhrase,
      sendRedPacket,
      close
    }
  }
}
</script>

<style scoped>
.redpacket-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.redpacket-panel {
  width: 90%;
  max-width: 360px;
  background: #fff;
  border-radius: 24px;
  animation: scaleIn 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  position: relative;
  max-height: 85vh;
  overflow-y: auto;
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 12px;
  background: linear-gradient(135deg, #d62929 0%, #c9184a 50%, #ff6b6b 100%);
  position: relative;
  border-radius: 24px 24px 0 0;
}

.header-decoration {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
}

.header-decoration span {
  font-size: 18px;
  animation: sparkle 1s ease-in-out infinite;
}

.header-decoration span:nth-child(2) {
  animation-delay: 0.5s;
}

@keyframes sparkle {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.panel-title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.panel-close {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  padding: 6px;
}

.redpacket-decoration {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 6px 20px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.redpacket-decoration span {
  font-size: 14px;
  color: #f87171;
  animation: bounce 1.5s ease-in-out infinite;
}

.redpacket-decoration span:nth-child(2) {
  animation-delay: 0.3s;
}

.redpacket-decoration span:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.input-section {
  padding: 20px 16px;
}

.amount-card {
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border: 2px dashed #fed7aa;
  border-radius: 12px;
  padding: 24px 16px;
  text-align: center;
  margin-bottom: 16px;
}

.amount-input-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.amount-label {
  font-size: 32px;
  font-weight: bold;
  color: #dc2626;
  text-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
}

.amount-input {
  font-size: 48px;
  font-weight: bold;
  color: #dc2626;
  text-align: left;
  border: none;
  outline: none;
  background: transparent;
  width: 180px;
  height: 60px;
  line-height: 60px;
  font-family: 'DIN Alternate', 'Helvetica Neue', sans-serif;
}

.amount-input::placeholder {
  color: #fed7aa;
}

.amount-hint {
  display: block;
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
  margin-top: 12px;
}

.message-section {
  padding: 0 16px 16px;
}

.section-label {
  display: block;
  font-size: 14px;
  color: #374151;
  margin-bottom: 12px;
  font-weight: 500;
}

.message-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  background: #fafafa;
  box-sizing: border-box;
}

.message-input:focus {
  border-color: #f87171;
  background: #fff;
}

.quick-phrases {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.quick-phrase {
  padding: 6px 14px;
  background: #fef3c7;
  border-radius: 20px;
  font-size: 13px;
  color: #d97706;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-phrase:hover {
  background: #fde68a;
}

.send-section {
  padding: 16px;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #d62929 0%, #c9184a 50%, #ff6b6b 100%);
  border-radius: 30px;
  color: #fff;
  font-size: 17px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(214, 41, 41, 0.4);
  box-sizing: border-box;
}

.send-btn:hover:not(.disabled):not(.loading) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(214, 41, 41, 0.5);
}

.send-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn.loading {
  opacity: 0.8;
}

.btn-icon,
.loading-icon {
  font-size: 18px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.btn-text {
  letter-spacing: 2px;
}

.success-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  animation: fadeIn 0.3s ease;
  z-index: 10;
}

.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.success-icon {
  font-size: 64px;
  animation: bounce 0.6s ease;
}

.success-text {
  font-size: 20px;
  font-weight: bold;
  color: #1f2937;
}
</style>
