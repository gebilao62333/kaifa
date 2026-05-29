<template>
  <div class="pay-gateway-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">{{ pageTitle }}</span>
    </div>

    <div class="gateway-body">
      <div class="method-banner" :style="{ background: methodBg }">
        <span class="method-icon">{{ methodIcon }}</span>
        <div class="method-info">
          <span class="method-name">{{ methodName }}</span>
          <span class="method-desc">{{ payDesc }}</span>
        </div>
      </div>

      <div class="amount-card" v-if="!isProcessing && !isDone">
        <span class="label">{{ amountLabel }}</span>
        <span class="amount-value">{{ isRechargeWithFiat ? '¥' + formatPrice(amount) : formatPrice(amount) + ' 金币' }}</span>
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
        <div class="done-amount">{{ isRechargeWithFiat ? '¥' + formatPrice(amount) : formatPrice(amount) + ' 金币' }}</div>
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
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLoginManager } from '../composables/useLoginManager'

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
  balance: { name: '余额支付', icon: '💰', bg: 'linear-gradient(135deg, #667eea, #764ba2)', desc: '直接使用余额支付' }
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

const startPay = async () => {
  const loginResult = await requireLogin()
  if (!loginResult.loggedIn) {
    return
  }

  if (methodId.value === 'coin') {
    isProcessing.value = true
    setTimeout(() => {
      newBalance.value = Math.max(0, balance.value - amount.value)
      isProcessing.value = false
      isDone.value = true
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
  }, 2000)
}

const fallbackPay = (name) => {
  isProcessing.value = true
  setTimeout(() => {
    isProcessing.value = false
    isDone.value = true
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
  background: #f5f5f5;
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
  padding: 0 20px;
  height: 70px;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 650px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: -webkit-linear-gradient(315deg, #667eea 0%, #764ba2 100%);
  color: white;
  z-index: 100;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.back-btn {
  font-size: 24px;
  cursor: pointer;
  margin-right: 20px;
  -webkit-tap-highlight-color: transparent;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.gateway-body {
  padding: 12px;
  max-width: 650px;
  margin: 0 auto;
}

.method-banner {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 10px;
  color: white;
  margin-bottom: 16px;
}

.method-icon {
  width: 44px;
  height: 44px;
  background: rgba(255,255,255,0.25);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: bold;
  margin-right: 14px;
}

.method-info {
  flex: 1;
}

.method-name {
  font-size: 17px;
  font-weight: 600;
  display: block;
  margin-bottom: 2px;
}

.method-desc {
  font-size: 12px;
  opacity: 0.85;
}

.amount-card {
  background: white;
  border-radius: 14px;
  padding: 24px;
  text-align: center;
  margin-bottom: 16px;
}

.amount-card .label {
  font-size: 13px;
  color: #999;
  display: block;
  margin-bottom: 8px;
}

.amount-value {
  font-size: 36px;
  font-weight: bold;
  color: #333;
}

.pay-qr-section {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.qr-box {
  background: white;
  border-radius: 14px;
  padding: 24px;
  text-align: center;
}

.qr-placeholder {
  width: 200px;
  height: 200px;
  border: 2px dashed #ddd;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  overflow: hidden;
}

.qr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-tip {
  font-size: 13px;
  color: #999;
}

.card-form {
  background: white;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 16px;
}

.card-input-group {
  margin-bottom: 16px;
}

.card-input-group.half {
  flex: 1;
}

.card-row {
  display: flex;
  gap: 16px;
}

.card-input-label {
  font-size: 13px;
  color: #666;
  display: block;
  margin-bottom: 8px;
}

.card-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  font-size: 16px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.card-input:focus {
  border-color: #667eea;
}

.coin-section {
  background: white;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 16px;
}

.coin-check {
  display: flex;
  align-items: center;
  gap: 12px;
}

.coin-check-icon {
  font-size: 36px;
}

.coin-check-info {
  flex: 1;
}

.coin-check-label {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 4px;
}

.coin-check-desc {
  font-size: 12px;
  color: #999;
  display: block;
}

.balance-section {
  background: white;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 16px;
}

.balance-check {
  display: flex;
  align-items: center;
  gap: 12px;
}

.balance-check-icon {
  font-size: 36px;
}

.balance-check-info {
  flex: 1;
}

.balance-check-label {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 4px;
}

.balance-check-desc {
  font-size: 12px;
  color: #999;
  display: block;
}

.processing-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e8e8e8;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.processing-text {
  font-size: 17px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.processing-hint {
  font-size: 13px;
  color: #999;
}

.done-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
}

.done-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.done-title {
  font-size: 22px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.done-amount {
  font-size: 36px;
  font-weight: bold;
  color: #10b981;
  margin-bottom: 8px;
}

.done-method {
  font-size: 13px;
  color: #999;
  margin-bottom: 4px;
}

.done-balance {
  font-size: 14px;
  color: #666;
  margin-bottom: 32px;
}

.done-btn {
  width: 280px;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.gateway-actions {
  margin-top: 16px;
}

.pay-now-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.pay-now-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (min-width: 768px) {
  .payment-gateway-page {
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
  .payment-gateway-page {
    max-width: 720px;
  }
  .header {
    max-width: 720px;
  }
}
</style>
