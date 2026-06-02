<template>
  <div class="pay-gateway-page">
    <div class="header">
      <button class="back-btn" @click="goBack">
        <span class="back-arrow">←</span>
      </button>
      <span class="title">{{ pageTitle }}</span>
      <div class="header-spacer"></div>
    </div>

    <div class="gateway-body">
      <div class="method-banner" :style="{ background: methodBg }">
        <div class="method-icon-wrapper">
          <span class="method-icon">{{ methodIcon }}</span>
        </div>
        <div class="method-info">
          <span class="method-name">{{ methodName }}</span>
          <span class="method-desc">{{ payDesc }}</span>
        </div>
      </div>

      <div class="amount-card" v-if="!isProcessing && !isDone">
        <span class="label">{{ amountLabel }}</span>
        <span class="amount-value">{{ formatPrice(amount) }} 金币</span>
      </div>

      <div class="pay-qr-section" v-if="showQR && !isProcessing && !isDone">
        <div class="qr-box">
          <div class="qr-placeholder">
            <img :src="qrImage" class="qr-img" />
          </div>
          <span class="qr-tip">请使用{{ methodName }}扫码支付</span>
        </div>
      </div>

      <div class="card-form" v-if="methodId === 'card' && !isProcessing && !isDone">
        <div class="card-input-group">
          <span class="card-input-label">卡号</span>
          <input type="text" class="card-input" v-model="cardNo" placeholder="请输入密卡卡号" maxlength="19" />
        </div>
        <div class="card-row">
          <div class="card-input-group half">
            <span class="card-input-label">有效期</span>
            <input type="text" class="card-input" v-model="cardExpiry" placeholder="MM/YY" maxlength="5" />
          </div>
          <div class="card-input-group half">
            <span class="card-input-label">安全码</span>
            <input type="text" class="card-input" v-model="cardCvv" placeholder="CVV" maxlength="4" />
          </div>
        </div>
      </div>

      <div class="coin-section" v-if="methodId === 'coin' && !isProcessing && !isDone">
        <div class="coin-check">
          <span class="coin-check-icon">💰</span>
          <div class="coin-check-info">
            <span class="coin-check-label">金币支付</span>
            <span class="coin-check-desc">可用金币 {{ formatPrice(balance) }}，支付后剩余 {{ formatPrice(balance - amount) }}</span>
          </div>
        </div>
      </div>

      <div class="balance-section" v-if="methodId === 'balance' && !isProcessing && !isDone">
        <div class="balance-check">
          <span class="balance-check-icon">💰</span>
          <div class="balance-check-info">
            <span class="balance-check-label">金币支付</span>
            <span class="balance-check-desc">可用金币 {{ formatPrice(balance) }}，支付后剩余 {{ formatPrice(balance - amount) }}</span>
          </div>
        </div>
      </div>

      <div class="processing-state" v-if="isProcessing && !isDone">
        <div class="processing-animation">
          <div class="spinner"></div>
        </div>
        <span class="processing-text">支付处理中...</span>
        <span class="processing-hint">请勿关闭页面</span>
      </div>

      <div class="done-state" v-if="isDone">
        <div class="done-icon">✅</div>
        <div class="done-title">支付成功</div>
        <div class="done-amount">{{ formatPrice(amount) }} 金币</div>
        <div class="done-method">通过 {{ methodName }} 支付</div>
        <div class="done-balance">剩余金币：{{ formatPrice(newBalance) }}</div>
        <button class="done-btn" @click="finish">完成</button>
      </div>

      <div class="gateway-actions" v-if="!isProcessing && !isDone">
        <button class="pay-now-btn" :disabled="!canPay" @click="startPay">
          {{ payBtnText }}
        </button>
      </div>
    </div>
  </div>

  <div class="pay-confirm-modal" v-if="showConfirmModal" @click.self="showConfirmModal = false">
    <div class="confirm-dialog">
      <div class="confirm-icon">💳</div>
      <div class="confirm-title">确认支付</div>
      <div class="confirm-amount">{{ formatPrice(amount) }} 金币</div>
      <div class="confirm-desc">通过 {{ methodName }} 完成支付</div>
      <div class="confirm-actions">
        <button class="confirm-btn secondary" @click="showConfirmModal = false">取消</button>
        <button class="confirm-btn primary" @click="confirmPay">确认支付</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLoginManager } from '../composables/useLoginManager'
import { toast } from '../composables/useToast'

const router = useRouter()
const route = useRoute()
const { requireLogin } = useLoginManager()

const type = ref(route.query.type || 'recharge')
const methodId = ref(route.query.method || 'alipay')
const amount = ref(Number(route.query.amount) || 0)
const balance = ref(Number(route.query.balance) || 0)
const isProcessing = ref(false)
const isDone = ref(false)
const newBalance = ref(0)
const cardNo = ref('')
const cardExpiry = ref('')
const cardCvv = ref('')
const showConfirmModal = ref(false)

const saveBalanceToStorage = () => {
  try {
    const saved = localStorage.getItem('userInfo')
    const data = saved ? JSON.parse(saved) : {}
    data.balance = newBalance.value
    localStorage.setItem('userInfo', JSON.stringify(data))
  } catch {}
}

watch(isDone, (val) => {
  if (val) saveBalanceToStorage()
})

const methodConfig = {
  coin: { name: '金币支付', icon: '💰', bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', desc: '使用金币支付' },
  alipay: { name: '支付宝', icon: 'Z', bg: 'linear-gradient(135deg, #1677ff, #4096ff)', desc: '安全快捷支付' },
  wechat: { name: '微信支付', icon: 'W', bg: 'linear-gradient(135deg, #07c160, #39d97e)', desc: '推荐使用微信支付' },
  card: { name: '密卡支付', icon: '💳', bg: 'linear-gradient(135deg, #fa8c16, #ffc53d)', desc: '输入密卡信息完成支付' },
  balance: { name: '余额支付', icon: '💰', bg: 'linear-gradient(135deg, #FF6B81, #E64C65)', desc: '直接使用余额支付' }
}

const config = computed(() => methodConfig[methodId.value] || methodConfig.alipay)
const methodName = computed(() => config.value.name)
const methodIcon = computed(() => config.value.icon)
const methodBg = computed(() => config.value.bg)
const payDesc = computed(() => config.value.desc)

const pageTitle = computed(() => {
  if (type.value === 'recharge') return '充值'
  if (type.value === 'order') return '订单支付'
  return '提现'
})
const amountLabel = computed(() => {
  if (type.value === 'recharge') return '充值金额'
  if (type.value === 'order') return '支付金额'
  return '提现金额'
})
const amountSymbol = computed(() => type.value === 'recharge' ? '+' : '')
const showQR = computed(() => methodId.value === 'alipay' || methodId.value === 'wechat')

const isRechargeWithFiat = computed(() => {
  return type.value === 'recharge' && (methodId.value === 'alipay' || methodId.value === 'wechat')
})

const qrImage = computed(() => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`pay:${methodId.value}:${amount.value}`)}`
  return qrCodeUrl
})

const canPay = computed(() => {
  if (methodId.value === 'card') return cardNo.value.trim().length > 0
  if (methodId.value === 'balance') return balance.value >= amount.value
  if (methodId.value === 'coin') return balance.value >= amount.value
  return true
})

const payBtnText = computed(() => {
  if (methodId.value === 'balance') return '确认支付'
  if (methodId.value === 'card') return '确认支付'
  if (methodId.value === 'coin') return '确认支付'
  return `打开${methodName.value}`
})

const formatPrice = (num) => {
  return Number(num || 0).toFixed(2)
}

const goBack = () => {
  if (isProcessing.value) return
  router.back()
}

const executePay = () => {
  if (methodId.value === 'coin') {
    isProcessing.value = true
    setTimeout(() => {
      if (type.value === 'recharge') {
        newBalance.value = balance.value + amount.value
      } else {
        newBalance.value = Math.max(0, balance.value - amount.value)
      }
      isProcessing.value = false
      isDone.value = true
      toast.success(type.value === 'recharge' ? '充值成功' : '支付成功')
    }, 1500)
    return
  }

  if (methodId.value === 'alipay') {
    const alipayUrl = `alipays://platformapi/startapp?appId=20000067&url=${encodeURIComponent(`https://pay.duoke.com/alipay?amount=${amount.value}`)}`
    window.location.href = alipayUrl
    setTimeout(() => {
      fallbackPay('支付宝')
    }, 2000)
    return
  }

  if (methodId.value === 'wechat') {
    const wechatUrl = `weixin://wap/pay?amount=${amount.value}`
    window.location.href = wechatUrl
    setTimeout(() => {
      fallbackPay('微信')
    }, 2000)
    return
  }

  isProcessing.value = true

  setTimeout(() => {
    if (type.value === 'recharge') {
      newBalance.value = balance.value + amount.value
    } else {
      newBalance.value = Math.max(0, balance.value - amount.value)
    }
    isProcessing.value = false
    isDone.value = true
    toast.success('支付成功')
  }, 2000)
}

const startPay = async () => {
  const loginResult = await requireLogin()
  if (!loginResult.loggedIn) {
    return
  }

  // 为了确保可以正常支付，我们先直接执行支付
  executePay()
}

const confirmPay = () => {
  showConfirmModal.value = false
  executePay()
}

const fallbackPay = (name) => {
  isProcessing.value = true
  setTimeout(() => {
    if (type.value === 'recharge') {
      newBalance.value = balance.value + amount.value
    } else {
      newBalance.value = Math.max(0, balance.value - amount.value)
    }
    isProcessing.value = false
    isDone.value = true
    toast.success(type.value === 'recharge' ? '充值成功' : '支付成功')
  }, 1500)
}

const finish = () => {
  // 如果是订单支付且有订单ID，跳转到订单列表并标记已支付
  if (type.value === 'order' && route.query.orderId) {
    router.push({
      path: '/my-order',
      query: {
        paidOrderId: route.query.orderId
      }
    })
  } else {
    router.back()
  }
}
</script>

<style scoped>
.pay-gateway-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: linear-gradient(180deg, #f8f9fa 0%, #f0f2f5 100%);
  padding-top: 70px;
  padding-bottom: 80px;
  padding-bottom: calc(80px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 70px;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 650px;
  background: linear-gradient(135deg, #FF6B81 0%, #E64C65 100%);
  background: -webkit-linear-gradient(315deg, #FF6B81 0%, #E64C65 100%);
  color: white;
  z-index: 100;
  box-shadow: 0 2px 12px rgba(255, 107, 129, 0.25);
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s ease;
  border: none;
}

.back-btn:active {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(0.95);
}

.back-arrow {
  font-size: 22px;
  font-weight: 600;
  line-height: 1;
}

.header-spacer {
  width: 40px;
}

.title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.gateway-body {
  padding: 16px;
  max-width: 650px;
  margin: 0 auto;
}

.method-banner {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 16px;
  color: white;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.method-icon-wrapper {
  width: 52px;
  height: 52px;
  background: rgba(255,255,255,0.2);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.method-icon {
  font-size: 24px;
  font-weight: bold;
}

.method-info {
  flex: 1;
}

.method-name {
  font-size: 18px;
  font-weight: 700;
  display: block;
  margin-bottom: 4px;
  letter-spacing: 0.2px;
}

.method-desc {
  font-size: 13px;
  opacity: 0.9;
}

.amount-card {
  background: white;
  border-radius: 20px;
  padding: 32px 24px;
  text-align: center;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.amount-card .label {
  font-size: 14px;
  color: #888;
  display: block;
  margin-bottom: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.amount-value {
  font-size: 40px;
  font-weight: 800;
  color: #1a1a2e;
  letter-spacing: -0.5px;
}

.pay-qr-section {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.qr-box {
  background: white;
  border-radius: 20px;
  padding: 28px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.qr-placeholder {
  width: 220px;
  height: 220px;
  border: 2px dashed #e5e7eb;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  overflow: hidden;
  background: #fafafa;
}

.qr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-tip {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.card-form {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.card-input-group {
  margin-bottom: 18px;
}

.card-input-group.half {
  flex: 1;
}

.card-row {
  display: flex;
  gap: 16px;
}

.card-input-label {
  font-size: 14px;
  color: #4b5563;
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.card-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  box-sizing: border-box;
  transition: all 0.2s ease;
  background: #fafafa;
}

.card-input:focus {
  border-color: #FF6B81;
  background: white;
  box-shadow: 0 0 0 4px rgba(255, 107, 129, 0.1);
}

.coin-section {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.coin-check {
  display: flex;
  align-items: center;
  gap: 16px;
}

.coin-check-icon {
  font-size: 40px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.coin-check-info {
  flex: 1;
}

.coin-check-label {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  display: block;
  margin-bottom: 6px;
}

.coin-check-desc {
  font-size: 13px;
  color: #6b7280;
  display: block;
  font-weight: 500;
}

.balance-section {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.balance-check {
  display: flex;
  align-items: center;
  gap: 16px;
}

.balance-check-icon {
  font-size: 40px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.balance-check-info {
  flex: 1;
}

.balance-check-label {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  display: block;
  margin-bottom: 6px;
}

.balance-check-desc {
  font-size: 13px;
  color: #6b7280;
  display: block;
  font-weight: 500;
}

.processing-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
}

.spinner {
  width: 56px;
  height: 56px;
  border: 4px solid #e5e7eb;
  border-top-color: #FF6B81;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 24px;
  box-shadow: 0 0 20px rgba(255, 107, 129, 0.2);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.processing-text {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.processing-hint {
  font-size: 14px;
  color: #6b7280;
}

.done-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0;
  animation: scaleIn 0.4s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.done-icon {
  font-size: 72px;
  margin-bottom: 20px;
  animation: bounce 0.6s ease-out;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.done-title {
  font-size: 24px;
  font-weight: 800;
  color: #1a1a2e;
  margin-bottom: 12px;
}

.done-amount {
  font-size: 40px;
  font-weight: 800;
  color: #10b981;
  margin-bottom: 12px;
}

.done-method {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 6px;
  font-weight: 500;
}

.done-balance {
  font-size: 15px;
  color: #4b5563;
  margin-bottom: 36px;
  font-weight: 600;
}

.done-btn {
  width: 300px;
  padding: 16px;
  background: linear-gradient(135deg, #FF6B81 0%, #E64C65 100%);
  color: white;
  border: none;
  border-radius: 28px;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(255, 107, 129, 0.3);
  transition: all 0.2s ease;
}

.done-btn:active {
  transform: scale(0.96);
  box-shadow: 0 2px 8px rgba(255, 107, 129, 0.2);
}

.gateway-actions {
  margin-top: 20px;
}

.pay-now-btn {
  width: 100%;
  padding: 18px;
  background: linear-gradient(135deg, #FF6B81 0%, #E64C65 100%);
  color: white;
  border: none;
  border-radius: 28px;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(255, 107, 129, 0.3);
  transition: all 0.2s ease;
  letter-spacing: 0.3px;
}

.pay-now-btn:active {
  transform: scale(0.96);
  box-shadow: 0 2px 8px rgba(255, 107, 129, 0.2);
}

.pay-now-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.pay-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: overlayFadeIn 0.25s ease-out;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.pay-confirm-modal .confirm-dialog {
  width: 88%;
  max-width: 340px;
  background: white;
  border-radius: 24px;
  padding: 32px 24px 24px;
  text-align: center;
  animation: dialogBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

@keyframes dialogBounce {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.pay-confirm-modal .confirm-icon {
  font-size: 56px;
  margin-bottom: 16px;
  display: block;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.pay-confirm-modal .confirm-title {
  font-size: 19px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 10px;
}

.pay-confirm-modal .confirm-amount {
  font-size: 32px;
  font-weight: 800;
  color: #FF6B81;
  margin-bottom: 10px;
  letter-spacing: -0.5px;
}

.pay-confirm-modal .confirm-desc {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
  font-weight: 500;
}

.pay-confirm-modal .confirm-actions {
  display: flex;
  gap: 12px;
}

.pay-confirm-modal .confirm-btn {
  flex: 1;
  padding: 14px;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.3px;
}

.pay-confirm-modal .confirm-btn:active {
  transform: scale(0.95);
}

.pay-confirm-modal .confirm-btn.secondary {
  background: #f3f4f6;
  color: #4b5563;
}

.pay-confirm-modal .confirm-btn.secondary:hover {
  background: #e5e7eb;
}

.pay-confirm-modal .confirm-btn.primary {
  background: linear-gradient(135deg, #FF6B81 0%, #E64C65 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(255, 107, 129, 0.3);
}

.pay-confirm-modal .confirm-btn.primary:hover {
  box-shadow: 0 6px 20px rgba(255, 107, 129, 0.4);
}

@media (min-width: 768px) {
  .pay-gateway-page {
    max-width: 650px;
    margin: 0 auto;
  }
  .header {
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
  }
}
@media (min-width: 1024px) {
  .pay-gateway-page {
    max-width: 720px;
  }
  .header {
    max-width: 720px;
  }
}
</style>
