<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">{{ pageTitle }}</text>
    </template>

    <view class="gateway-body">
      <view class="method-banner" :style="{ background: methodBg }">
        <text class="method-icon">{{ methodIcon }}</text>
        <view class="method-info">
          <text class="method-name">{{ methodName }}</text>
          <text class="method-desc">{{ payDesc }}</text>
        </view>
      </view>

      <view class="amount-card" v-if="!isProcessing && !isDone && !waitingPay">
        <text class="label">{{ amountLabel }}</text>
        <text class="amount-value">{{ isRechargeWithFiat ? '¥' + formatPrice(amount) : formatPrice(amount) + ' 金币' }}</text>
      </view>

      <view class="pay-qr-section" v-if="waitingPay && !isDone">
        <view class="qr-box">
          <view class="qr-placeholder">
            <image mode="aspectFit" :src="qrImage" class="qr-img" />
          </view>
          <text class="qr-tip">请使用微信扫码支付</text>
          <button class="qr-check-btn" @click="checkPaidNow">我已完成支付</button>
        </view>
      </view>

      <view class="card-form" v-if="methodId === 'card' && !isProcessing && !isDone">
        <view class="card-input-group">
          <text class="card-input-label">卡号</text>
          <input type="text" class="card-input" v-model="cardNo" placeholder="请输入卡号" maxlength="32" />
        </view>
        <view class="card-input-group">
          <text class="card-input-label">密码</text>
          <input type="text" class="card-input" v-model="cardPwd" placeholder="请输入密码" maxlength="32" />
        </view>
      </view>



      <view class="processing-state" v-if="isProcessing && !isDone">
        <view class="processing-animation">
          <view class="spinner"></view>
        </view>
        <text class="processing-text">支付处理中...</text>
        <text class="processing-hint">请勿关闭页面</text>
      </view>

      <view class="done-state" v-if="isDone">
        <view class="done-icon">✅</view>
        <view class="done-title">支付成功</view>
        <view class="done-amount">{{ isRechargeWithFiat ? '¥' + formatPrice(amount) : formatPrice(amount) + ' 金币' }}</view>
        <view class="done-method">通过 {{ methodName }} 支付</view>
        <view class="done-balance">剩余金币：{{ formatPrice(newBalance) }}</view>
        <button class="done-btn" @click="finish">完成</button>
      </view>

      <view class="gateway-actions" v-if="!isProcessing && !isDone && !waitingPay">
        <button class="pay-now-btn" :disabled="!canPay" @click="startPay">
          {{ payBtnText }}
        </button>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import payService from '../services/payService'
import paymentSdk from '../services/paymentSdk'
import { useUserStore } from '../store/user-info'
import { toast } from '../composables/useToast'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const type = ref(route.query.type || 'recharge')
const methodId = ref(route.query.method || 'wechat')
const amount = ref(Number(route.query.amount) || 0)
const balance = ref(Number(route.query.balance) || 0)
const isProcessing = ref(false)
const isDone = ref(false)
const newBalance = ref(0)
const cardNo = ref('')
const cardPwd = ref('')
const wxCodeUrl = ref('')
const wxOrderNo = ref('')
const waitingPay = ref(false)
let pollTimer = null

const methodConfig = {
  coin: { name: '金币支付', icon: '💰', bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', desc: '暂未开通' },
  alipay: { name: '支付宝', icon: 'Z', bg: 'linear-gradient(135deg, #1677ff, #4096ff)', desc: '暂未开通' },
  wechat: { name: '微信支付', icon: 'W', bg: 'linear-gradient(135deg, #07c160, #39d97e)', desc: '微信扫码支付，服务端回调入账' },
  card: { name: '卡密兑换', icon: '💳', bg: 'linear-gradient(135deg, #fa8c16, #ffc53d)', desc: '输入卡号密码兑换金币' },
  balance: { name: '余额支付', icon: '💰', bg: 'var(--gradient-primary)', desc: '暂未开通' }
}

const config = computed(() => methodConfig[methodId.value] || methodConfig.wechat)
const methodName = computed(() => config.value.name)
const methodIcon = computed(() => config.value.icon)
const methodBg = computed(() => config.value.bg)
const payDesc = computed(() => config.value.desc)

const pageTitle = computed(() => (type.value === 'recharge' ? '充值' : type.value === 'order' ? '订单支付' : '提现'))
const amountLabel = computed(() => (type.value === 'recharge' ? '充值金额' : type.value === 'order' ? '支付金额' : '提现金额'))
const isRechargeWithFiat = computed(() => type.value === 'recharge' && methodId.value === 'wechat')

// 真实微信支付二维码：codeUrl 由服务端统一下单（trade_type=NATIVE）返回，
// 不再使用 `pay:wechat:金额` 这类无支付语义的伪造文本。
const qrImage = computed(() => {
  if (!wxCodeUrl.value) return ''
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(wxCodeUrl.value)}`
})

const canPay = computed(() => {
  if (methodId.value === 'card') return cardNo.value.trim().length > 0 && cardPwd.value.trim().length > 0
  if (methodId.value === 'wechat') return !!Number(route.query.packageId)
  return false
})

const payBtnText = computed(() => {
  if (methodId.value === 'card') return '确认兑换'
  if (methodId.value === 'wechat') return '生成支付二维码'
  return '暂未开通'
})

const formatPrice = (num) => Number(num || 0).toFixed(2)

const goBack = () => {
  if (isProcessing.value) return
  router.back()
}

const refreshBalance = async () => {
  try {
    const res = await payService.getWalletBalance()
    const data = res?.data || res || {}
    balance.value = Number(data.balance) || 0
    if (isDone.value) newBalance.value = balance.value
  } catch (err) {
    console.error('获取余额失败:', err)
  }
}

onMounted(refreshBalance)
onUnmounted(() => stopPolling())

const stopPolling = () => {
  if (pollTimer) { clearTimeout(pollTimer); pollTimer = null }
}

// 轮询服务端支付单状态（最大 3 分钟），入账事实只认服务端回调/反查结果
const pollOrderPaid = (orderNo, timeoutMs = 180000) => new Promise((resolve) => {
  const start = Date.now()
  const tick = async () => {
    try {
      const res = await payService.getOrderStatus(orderNo)
      const d = res?.data || res || {}
      const st = d.status ?? d.state
      if (st === 1 || st === 'paid' || st === 'success' || d.isPaid === true) { resolve(true); return }
    } catch (e) { /* 单次查询失败不终止轮询 */ }
    if (!waitingPay.value) { resolve(false); return }
    if (Date.now() - start >= timeoutMs) { resolve(false); return }
    pollTimer = setTimeout(tick, 2000)
  }
  tick()
})

const markPaid = async () => {
  stopPolling()
  await refreshBalance()
  newBalance.value = balance.value
  waitingPay.value = false
  isDone.value = true
  try { await userStore.fetchUserInfo() } catch (e) { /* 资料刷新失败不影响支付结果 */ }
}

const checkPaidNow = async () => {
  if (!wxOrderNo.value) return
  try {
    const res = await payService.getOrderStatus(wxOrderNo.value)
    const d = res?.data || res || {}
    const st = d.status ?? d.state
    if (st === 1 || st === 'paid' || st === 'success' || d.isPaid === true) {
      await markPaid()
    } else {
      toast.info('尚未检测到支付完成，请扫码支付后再试')
    }
  } catch (error) {
    toast.error(error.message || '查询支付状态失败')
  }
}

const generateWxQr = async () => {
  const packageId = Number(route.query.packageId)
  if (!packageId) { toast.error('缺少充值套餐，请返回重试'); return }
  isProcessing.value = true
  try {
    const res = await payService.createWxOrder(packageId, { tradeType: 'NATIVE' })
    const data = res?.data || res || {}
    // 微信内 JSAPI：服务端返回 jsApiParams 时直接调起微信支付 SDK
    if (data.jsApiParams) {
      const sdk = await paymentSdk.invokeWechatJsapi(data.jsApiParams)
      if (sdk.supported) {
        if (sdk.ok) { await markPaid() } else { toast.info('支付未完成或已取消') }
        return
      }
      if (sdk.reason === 'not-in-wechat') toast.info('请在微信内打开，或使用扫码支付')
    }
    if (!data.codeUrl) throw new Error('未获取到支付二维码，请检查微信支付配置')
    wxCodeUrl.value = data.codeUrl
    wxOrderNo.value = data.orderNo
    waitingPay.value = true
    pollOrderPaid(data.orderNo).then(async (paid) => {
      if (paid) { await markPaid() }
      else if (waitingPay.value) { toast.info('暂未检测到支付完成，请完成扫码后点击「我已完成支付」') }
    })
  } catch (error) {
    console.error('创建微信支付单失败:', error)
    if (error.status === 503) toast.error('微信支付未配置，请使用卡密充值')
    else toast.error(error.message || '生成支付二维码失败')
  } finally {
    isProcessing.value = false
  }
}

const startPay = async () => {
  if (methodId.value === 'card') {
    if (!cardNo.value.trim() || !cardPwd.value.trim()) { toast.error('请输入卡号和密码'); return }
    isProcessing.value = true
    try {
      await payService.redeemCard(cardNo.value.trim(), cardPwd.value.trim())
      const res = await payService.getWalletBalance()
      const data = res?.data || res || {}
      newBalance.value = Number(data.balance) || 0
      isDone.value = true
      try { await userStore.fetchUserInfo() } catch (e) { /* ignore */ }
    } catch (error) {
      console.error('卡密兑换错误:', error)
      toast.error(error.message || '网络错误，请重试')
    } finally {
      isProcessing.value = false
    }
    return
  }

  if (methodId.value === 'wechat') {
    await generateWxQr()
    return
  }

  if (methodId.value === 'alipay') {
    // 支付宝 SDK 预留入口：先请求服务端预留接口；未配置时明确提示
    try {
      const packageId = Number(route.query.packageId)
      const res = await payService.createAlipayOrder(packageId)
      const data = res?.data || res || {}
      if (!data.orderStr) throw new Error('支付宝下单参数为空')
      const sdk = await paymentSdk.invokeAlipay(data.orderStr)
      if (!sdk.supported) {
        toast.info('请在支付宝客户端内打开，或等待支付宝渠道开放')
      } else if (sdk.ok) {
        await markPaid()
      } else {
        toast.info('支付宝支付未完成或已取消')
      }
    } catch (error) {
      toast.info(error.status === 503 ? '支付宝 SDK 已预留，待配置商户参数后开放' : (error.message || '支付宝暂未开放'))
    }
    return
  }

  // coin/balance 等历史入口：后端没有对应入账接口，明确提示而不是伪造成功
  toast.info('该支付方式暂未开通，请使用微信扫码或卡密充值')
}

const finish = () => {
  if (type.value === 'order' && route.query.orderId) {
    router.push({ path: '/my-order', query: { paidOrderId: route.query.orderId } })
  } else {
    router.back()
  }
}
</script>

<style scoped>
.back-btn {
  font-size: 24px;
  cursor: pointer;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.gateway-body {
  padding: 16px;
}

.method-banner {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 14px;
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
  border-radius: 0px;
  padding: 20px;
  margin: 12px 0 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  border-color: var(--color-primary);
}

.coin-section {
  background: white;
  border-radius: 0px;
  padding: 20px;
  margin: 12px 0 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  border-top-color: var(--color-primary);
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
  background: var(--gradient-primary);
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
  background: var(--gradient-primary);
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

.qr-check-btn {
  margin-top: 10px;
  padding: 8px 18px;
  border: 1px solid #07c160;
  background: #fff;
  color: #07c160;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

</style>
