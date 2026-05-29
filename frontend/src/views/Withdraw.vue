<template>
  <div class="withdraw-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">提现</span>
      <span class="history-btn" @click="goRecords">明细</span>
    </div>

    <div class="balance-card">
      <div class="label">可提现余额</div>
      <div class="amount">{{ formatAmount(balance) }}</div>
      <div class="unit">金币</div>
    </div>

    <div class="fee-standard">
      <span class="fee-standard-icon">📋</span>
      <span class="fee-standard-text">手续费 {{ feeRate }}%，10金币 = ¥1.00</span>
    </div>

    <div class="section-title">提现金额</div>
    <div class="amount-input-wrap">
      <span class="amount-symbol">💰</span>
      <input type="number" class="amount-input" v-model="withdrawAmount" placeholder="0.00" />
      <span class="amount-unit">金币</span>
    </div>
    <div class="amount-tips">
      <span>最低提现 100 金币</span>
      <span class="all-btn" @click="withdrawAmount = Math.floor(balance * 100) / 100">全部提现</span>
    </div>

    <div class="quick-amounts">
      <span
        v-for="amt in quickAmounts"
        :key="amt"
        :class="['quick-item', { active: withdrawAmount === amt }]"
        @click="withdrawAmount = amt"
      >{{ amt }} 金币</span>
    </div>

    <div class="section-title">提现到</div>
    <div class="payment-methods">
      <div
        v-for="method in payMethods"
        :key="method.id"
        :class="['payment-item', { active: payMethod === method.id }]"
        @click="switchPayMethod(method.id)"
      >
        <span class="pay-icon" :style="{ background: method.bg }">{{ method.icon }}</span>
        <div class="pay-info">
          <span class="pay-name">{{ method.name }}</span>
          <span class="pay-desc">{{ method.desc }}</span>
        </div>
        <span class="radio" :class="{ checked: payMethod === method.id }"></span>
      </div>
    </div>

    <div class="section-title">收款信息</div>
    <div class="receiver-card">
      <div class="receiver-field">
        <span class="receiver-label">收款人姓名</span>
        <input type="text" class="receiver-input" v-model="receiverName" placeholder="请输入收款人姓名" />
      </div>

      <template v-if="payMethod === 'card'">
        <div class="receiver-field">
          <span class="receiver-label">密卡号</span>
          <input type="text" class="receiver-input" v-model="cardNo" placeholder="请输入密卡号" maxlength="19" />
        </div>
        <div class="receiver-field">
          <span class="receiver-label">开户银行</span>
          <div class="receiver-select" @click="showBankPicker = true">
            <span class="receiver-select-text">{{ bankName || '请选择开户银行' }}</span>
            <span class="select-arrow">›</span>
          </div>
        </div>
      </template>

      <template v-if="payMethod === 'alipay'">
        <div class="receiver-field">
          <span class="receiver-label">支付宝账号</span>
          <input type="text" class="receiver-input" v-model="alipayAccount" placeholder="请输入支付宝账号/手机号" />
        </div>
        <div class="receiver-field">
          <span class="receiver-label">收款二维码</span>
          <div class="qr-upload" @click="triggerQrUpload('alipay')">
            <img v-if="alipayQrUrl" :src="alipayQrUrl" class="qr-preview" />
            <template v-else>
              <span class="qr-upload-icon">📷</span>
              <span class="qr-upload-text">上传支付宝收款码</span>
            </template>
          </div>
        </div>
      </template>

      <template v-if="payMethod === 'wechat'">
        <div class="receiver-field">
          <span class="receiver-label">微信账号</span>
          <input type="text" class="receiver-input" v-model="wechatAccount" placeholder="请输入微信号/手机号" />
        </div>
        <div class="receiver-field">
          <span class="receiver-label">收款二维码</span>
          <div class="qr-upload" @click="triggerQrUpload('wechat')">
            <img v-if="wechatQrUrl" :src="wechatQrUrl" class="qr-preview" />
            <template v-else>
              <span class="qr-upload-icon">📷</span>
              <span class="qr-upload-text">上传微信收款码</span>
            </template>
          </div>
        </div>
      </template>
    </div>

    <input type="file" ref="qrFileInput" accept="image/*" style="display: none" @change="handleQrUpload" />

    <div class="bank-picker-overlay" v-if="showBankPicker" @click.self="showBankPicker = false">
      <div class="bank-picker-content">
        <div class="bank-picker-header">
          <span class="bank-picker-cancel" @click="showBankPicker = false">取消</span>
          <span class="bank-picker-title">选择开户银行</span>
          <span class="bank-picker-confirm" @click="showBankPicker = false">完成</span>
        </div>
        <div class="bank-picker-list">
          <div
            v-for="bank in bankOptions"
            :key="bank"
            :class="['bank-picker-item', { active: bankName === bank }]"
            @click="bankName = bank; showBankPicker = false"
          >
            {{ bank }}
          </div>
        </div>
      </div>
    </div>

    <div class="section-title">到账信息</div>
    <div class="account-card">
      <div class="account-row">
        <span class="account-label">到账方式</span>
        <span class="account-value">{{ currentPayMethod }}</span>
      </div>
      <div class="account-row">
        <span class="account-label">收款账户</span>
        <span class="account-value">{{ receiverName || '待填写' }} · {{ currentPayAccount || '待填写' }}</span>
      </div>
      <div class="account-row">
        <span class="account-label">提现金币</span>
        <span class="account-value amount">{{ formatAmount(withdrawAmount) }} 金币</span>
      </div>
      <div class="account-row">
        <span class="account-label">预计到账金额</span>
        <span class="account-value">¥ {{ formatAmount(actualArrival) }}</span>
      </div>
      <div class="account-row">
        <span class="account-label">预计到账</span>
        <span class="account-value">2小时内到账</span>
      </div>
      <div class="account-row">
        <span class="account-label">手续费</span>
        <span class="account-value">{{ feeRate }}% ({{ formatAmount(feeCoins) }} 金币 ≈ ¥{{ formatAmount(feeCoins / 10) }})</span>
      </div>
      <div class="account-row withdraw-action-row">
        <span class="account-label">提现操作</span>
        <button
          class="withdraw-btn"
          :disabled="submitting"
          @click="doWithdraw"
        >
          {{ withdrawBtnText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginManager } from '../composables/useLoginManager'
import { getWithdrawMethods } from '../common/payMethods'
import walletService from '../services/walletService'

const router = useRouter()
const { requireLogin } = useLoginManager()

const loadBalance = () => {
  try {
    const saved = localStorage.getItem('userInfo')
    if (saved) {
      const data = JSON.parse(saved)
      return data.balance || 0
    }
  } catch {}
  return 0
}

const balance = ref(loadBalance())

onMounted(() => {
  balance.value = loadBalance()
})
const withdrawAmount = ref(0)
const payMethod = ref('alipay')
const submitting = ref(false)

const receiverName = ref('')
const cardNo = ref('')
const bankName = ref('')
const alipayAccount = ref('')
const wechatAccount = ref('')
const alipayQrUrl = ref('')
const wechatQrUrl = ref('')
const showBankPicker = ref(false)
const currentQrType = ref('')
const qrFileInput = ref(null)

const bankOptions = [
  '中国工商银行', '中国农业银行', '中国银行', '中国建设银行',
  '交通银行', '招商银行', '浦发银行', '中信银行',
  '中国光大银行', '华夏银行', '中国民生银行', '广发银行',
  '兴业银行', '平安银行', '上海银行', '北京银行'
]

const quickAmounts = [100, 300, 500, 1000, 2000]

const bankDesc = computed(() => {
  if (bankName.value) return bankName.value
  return '支持各大银行'
})

const payMethods = computed(() => getWithdrawMethods(bankDesc.value))

const canWithdraw = computed(() => {
  const num = Number(withdrawAmount.value)
  if (isNaN(num) || num <= 0) return false
  if (num < 100 || num > Math.floor(balance.value * 100) / 100) return false
  if (!receiverName.value.trim()) return false
  if (payMethod.value === 'card' && (!cardNo.value.trim() || !bankName.value)) return false
  if (payMethod.value === 'alipay' && !alipayAccount.value.trim() && !alipayQrUrl.value) return false
  if (payMethod.value === 'wechat' && !wechatAccount.value.trim() && !wechatQrUrl.value) return false
  return true
})

const withdrawBtnText = computed(() => {
  if (submitting.value) return '提交中...'
  return '提交申请'
})

const currentPayMethod = computed(() => {
  const method = payMethods.value.find(m => m.id === payMethod.value)
  return method ? method.name : ''
})

const currentPayAccount = computed(() => {
  if (payMethod.value === 'card') {
    let info = cardNo.value ? `尾号${cardNo.value.slice(-4)}` : ''
    if (bankName.value) info = bankName.value + (info ? ` ${info}` : '')
    return info
  }
  if (payMethod.value === 'alipay') return alipayAccount.value
  if (payMethod.value === 'wechat') return wechatAccount.value
  return ''
})

const formatAmount = (num) => {
  return Number(num || 0).toFixed(2)
}

const feeRate = 5

const feeCoins = computed(() => {
  const num = Number(withdrawAmount.value)
  if (isNaN(num) || num <= 0) return 0
  return num * 0.05
})

const actualArrival = computed(() => {
  return (Number(withdrawAmount.value) - feeCoins.value) / 10
})

const goBack = () => {
  router.back()
}

const goRecords = () => {
  router.push('/withdraw-records')
}

const switchPayMethod = (id) => {
  payMethod.value = id
}

const triggerQrUpload = (type) => {
  currentQrType.value = type
  qrFileInput.value?.click()
}

const handleQrUpload = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    const url = event.target?.result?.toString() || ''
    if (currentQrType.value === 'alipay') {
      alipayQrUrl.value = url
    } else if (currentQrType.value === 'wechat') {
      wechatQrUrl.value = url
    }
  }
  reader.readAsDataURL(file)
}

const validateForm = () => {
  const num = Number(withdrawAmount.value)
  if (isNaN(num) || num <= 0) return '请输入提现金额'
  if (num < 100) return '最低提现 100 金币'
  if (num > Math.floor(balance.value * 100) / 100) return '超出可提现余额'
  if (!receiverName.value.trim()) return '请填写收款人姓名'
  if (payMethod.value === 'card') {
    if (!cardNo.value.trim()) return '请填写密卡号'
    if (!bankName.value) return '请选择开户银行'
  }
  if (payMethod.value === 'alipay' && !alipayAccount.value.trim() && !alipayQrUrl.value) return '请填写支付宝账号或上传收款码'
  if (payMethod.value === 'wechat' && !wechatAccount.value.trim() && !wechatQrUrl.value) return '请填写微信账号或上传收款码'
  return ''
}

const doWithdraw = async () => {
  const errMsg = validateForm()
  if (errMsg) {
    alert(errMsg)
    return
  }

  const loginResult = await requireLogin()
  if (!loginResult.loggedIn) {
    return
  }

  submitting.value = true

  try {
    const bankInfo = {
      bank: bankName.value,
      name: receiverName.value,
      mobile: payMethod.value === 'alipay' ? alipayAccount.value : (payMethod.value === 'wechat' ? wechatAccount.value : ''),
      image: payMethod.value === 'alipay' ? alipayQrUrl.value : (payMethod.value === 'wechat' ? wechatQrUrl.value : '')
    }

    const result = await walletService.withdraw({
      money: Number(withdrawAmount.value),
      type: payMethod.value === 'alipay' ? 1 : (payMethod.value === 'wechat' ? 2 : 3),
      bankInfo
    })

    if (result.code === 0 || result.code === 200) {
      balance.value -= Number(withdrawAmount.value)
      const saved = localStorage.getItem('userInfo')
      if (saved) {
        try {
          const data = JSON.parse(saved)
          data.balance = balance.value
          localStorage.setItem('userInfo', JSON.stringify(data))
        } catch {}
      }
      alert('提现申请已提交')
      setTimeout(() => {
        router.push('/withdraw-records')
      }, 1500)
    } else {
      alert(result.message || '提交失败')
    }
  } catch (error) {
    console.error('提现错误:', error)
    alert(error.message || '网络错误，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* ============================================
   Withdraw Page - 提现页面样式
   布局：固定顶部 Header + 滚动内容 + 固定底部按钮 + BottomNav
   ============================================ */

/* --- 页面容器 --- */
.withdraw-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: var(--bg-page, #f5f5f5);
  padding-top: var(--layout-header-height, 70px);
  /* 底部预留空间：BottomNav */
  padding-bottom: calc(var(--layout-bottom-nav-height, 60px) + var(--layout-safe-area-bottom, 0px));
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

/* --- 固定顶部 Header --- */
.header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--spacing-xl, 20px);
  height: var(--layout-header-height, 70px);
  background: var(--color-gradient-primary, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
  color: white;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: var(--z-dropdown, 100);
  box-sizing: border-box;
}

.header .title {
  font-size: var(--font-size-xl, 18px);
  font-weight: 700;
  color: #fff;
}

.back-btn {
  position: absolute;
  left: var(--spacing-xl, 20px);
  font-size: 22px;
  cursor: pointer;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  -webkit-tap-highlight-color: transparent;
}

.history-btn {
  position: absolute;
  right: var(--spacing-xl, 20px);
  font-size: var(--font-size-md, 14px);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  padding: 4px 12px;
  -webkit-tap-highlight-color: transparent;
}

/* --- 余额卡片 --- */
.balance-card {
  margin: 12px var(--spacing-md, 12px) 20px;
  background: var(--bg-card, #fff);
  border-radius: var(--radius-2xl, 16px);
  padding: 28px var(--spacing-xl, 20px);
  text-align: center;
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.06));
}

.balance-card .label {
  font-size: var(--font-size-md, 14px);
  color: #999;
  margin-bottom: 8px;
}

.balance-card .amount {
  font-size: 40px;
  font-weight: 800;
  color: #333;
  margin-bottom: 4px;
  line-height: 1.2;
}

.balance-card .unit {
  font-size: var(--font-size-sm, 12px);
  color: #999;
}

/* --- 手续费提示 --- */
.fee-standard {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  margin: 0 var(--spacing-md, 12px) 0;
  background: #fff7e6;
  border-radius: var(--radius-md, 8px);
  border: 1px solid #ffe7ba;
}

.fee-standard-icon {
  font-size: 15px;
  flex-shrink: 0;
}

.fee-standard-text {
  font-size: var(--font-size-sm, 12px);
  color: #d46b08;
  font-weight: 500;
}

/* --- 分区标题 --- */
.section-title {
  font-size: var(--font-size-lg, 16px);
  font-weight: 700;
  color: #333;
  padding: 24px var(--spacing-md, 12px) 10px;
  margin: 0;
}

/* --- 金额输入 --- */
.amount-input-wrap {
  display: flex;
  align-items: center;
  background: var(--bg-card, #fff);
  margin: 0 var(--spacing-md, 12px);
  padding: 14px var(--spacing-xl, 20px);
  border-radius: var(--radius-xl, 12px);
  box-shadow: var(--shadow-sm, 0 2px 12px rgba(0, 0, 0, 0.04));
}

.amount-symbol {
  font-size: 24px;
  margin-right: 10px;
  flex-shrink: 0;
}

.amount-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 28px;
  font-weight: 700;
  color: #333;
  background: transparent;
  min-width: 0;
}

.amount-input::placeholder {
  color: #ccc;
}

.amount-unit {
  font-size: var(--font-size-md, 14px);
  color: #999;
  flex-shrink: 0;
  margin-left: 8px;
}

.amount-tips {
  display: flex;
  justify-content: space-between;
  padding: 8px var(--spacing-xl, 20px) 0;
  font-size: var(--font-size-sm, 12px);
  color: #999;
}

.all-btn {
  color: var(--color-primary, #667eea);
  cursor: pointer;
  font-weight: 500;
}

/* --- 快捷金额 --- */
.quick-amounts {
  display: flex;
  gap: 10px;
  padding: 10px var(--spacing-md, 12px);
  flex-wrap: wrap;
}

.quick-item {
  background: var(--bg-card, #fff);
  border: 2px solid transparent;
  border-radius: 20px;
  padding: 8px 18px;
  font-size: var(--font-size-md, 14px);
  color: #666;
  cursor: pointer;
  transition: all var(--transition-fast, 0.15s ease);
  white-space: nowrap;
}

.quick-item.active {
  border-color: var(--color-primary, #667eea);
  color: var(--color-primary, #667eea);
  background: rgba(102, 126, 234, 0.05);
  font-weight: 600;
}

/* --- 支付方式 --- */
.payment-methods {
  padding: 0 var(--spacing-md, 12px);
}

.payment-item {
  display: flex;
  align-items: center;
  background: var(--bg-card, #fff);
  padding: 14px var(--spacing-xl, 20px);
  border-radius: var(--radius-xl, 12px);
  margin-bottom: 10px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast, 0.15s ease);
  box-shadow: var(--shadow-sm, 0 2px 12px rgba(0, 0, 0, 0.04));
}

.payment-item.active {
  border-color: var(--color-primary, #667eea);
  background: rgba(102, 126, 234, 0.03);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.1);
}

.pay-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
  margin-right: 14px;
  flex-shrink: 0;
}

.pay-info {
  flex: 1;
  min-width: 0;
}

.pay-name {
  font-size: var(--font-size-lg, 16px);
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 2px;
}

.pay-desc {
  font-size: var(--font-size-sm, 12px);
  color: #999;
  display: block;
}

/* --- 收款信息卡片 --- */
.receiver-card {
  background: var(--bg-card, #fff);
  margin: 0 var(--spacing-md, 12px) 20px;
  border-radius: var(--radius-xl, 12px);
  padding: 4px var(--spacing-lg, 16px);
  box-shadow: var(--shadow-sm, 0 2px 12px rgba(0, 0, 0, 0.04));
}

.receiver-field {
  padding: 14px 0;
  border-bottom: 1px solid #f5f5f5;
}

.receiver-field:last-child {
  border-bottom: none;
}

.receiver-label {
  font-size: var(--font-size-sm, 12px);
  color: #999;
  display: block;
  margin-bottom: 6px;
}

.receiver-input {
  width: 100%;
  padding: 8px 0;
  border: none;
  outline: none;
  font-size: var(--font-size-lg, 16px);
  color: #333;
  background: transparent;
  box-sizing: border-box;
}

.receiver-input::placeholder {
  color: #ccc;
}

.receiver-select {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
}

.receiver-select-text {
  font-size: var(--font-size-lg, 16px);
  color: #333;
}

.receiver-select-text.placeholder {
  color: #ccc;
}

.select-arrow {
  font-size: 20px;
  color: #ccc;
}

/* --- 二维码上传 --- */
.qr-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #f8f9fa;
  border-radius: var(--radius-xl, 12px);
  border: 2px dashed #ddd;
  cursor: pointer;
  margin-top: 4px;
  transition: border-color var(--transition-fast, 0.15s ease);
}

.qr-upload:hover {
  border-color: var(--color-primary, #667eea);
}

.qr-upload-icon {
  font-size: 32px;
  margin-bottom: 6px;
}

.qr-upload-text {
  font-size: var(--font-size-sm, 12px);
  color: #999;
}

.qr-preview {
  max-width: 100%;
  max-height: 160px;
  border-radius: var(--radius-md, 8px);
  object-fit: contain;
}

/* --- 银行选择器 --- */
.bank-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: var(--z-overlay, 500);
}

.bank-picker-content {
  width: 100%;
  background: white;
  border-radius: 20px 20px 0 0;
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.bank-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
}

.bank-picker-cancel,
.bank-picker-confirm {
  font-size: 15px;
  color: var(--color-primary, #667eea);
  cursor: pointer;
}

.bank-picker-title {
  font-size: var(--font-size-lg, 16px);
  font-weight: 600;
  color: #333;
}

.bank-picker-list {
  overflow-y: auto;
  padding: 8px 0;
}

.bank-picker-item {
  padding: 15px 20px;
  font-size: var(--font-size-lg, 16px);
  color: #333;
  cursor: pointer;
  transition: background var(--transition-fast, 0.15s ease);
}

.bank-picker-item:hover,
.bank-picker-item:active {
  background: #f5f5f5;
}

.bank-picker-item.active {
  color: var(--color-primary, #667eea);
  font-weight: 600;
  background: rgba(102, 126, 234, 0.08);
}

/* --- 单选圆圈 --- */
.radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #ddd;
  position: relative;
  flex-shrink: 0;
  transition: all var(--transition-fast, 0.15s ease);
}

.radio.checked {
  border-color: var(--color-primary, #667eea);
}

.radio.checked::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary, #667eea);
}

/* --- 到账信息卡片 --- */
.account-card {
  background: var(--bg-card, #fff);
  margin: 0 var(--spacing-md, 12px);
  border-radius: var(--radius-xl, 12px);
  padding: 4px var(--spacing-lg, 16px);
  box-shadow: var(--shadow-sm, 0 2px 12px rgba(0, 0, 0, 0.04));
}

.account-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 13px 0;
  border-bottom: 1px solid #f5f5f5;
}

.account-row:last-child {
  border-bottom: none;
}

.account-label {
  font-size: var(--font-size-md, 14px);
  color: #666;
  flex-shrink: 0;
}

.account-value {
  font-size: var(--font-size-md, 14px);
  color: #333;
  font-weight: 500;
  text-align: right;
}

.account-value.amount {
  font-size: var(--font-size-xl, 18px);
  font-weight: 700;
  color: #ff6b6b;
}

.account-value.free {
  color: #10b981;
}

/* --- 提现操作行（在到账信息卡片内） --- */
.withdraw-action-row {
  border-bottom: none;
  flex-wrap: wrap;
  gap: 8px;
}

.withdraw-btn {
  padding: 10px 24px;
  background: var(--color-gradient-primary, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
  color: white;
  border: none;
  border-radius: 20px;
  font-size: var(--font-size-md, 14px);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast, 0.15s ease);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
  white-space: nowrap;
}

.withdraw-btn:not(:disabled):active {
  transform: scale(0.96);
  box-shadow: 0 1px 4px rgba(102, 126, 234, 0.15);
}

.withdraw-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

/* ============================================
   PC 端响应式
   ============================================ */
@media (min-width: 768px) {
  .withdraw-page {
    max-width: var(--layout-pc-width, 650px);
    margin: 0 auto;
  }

  .header {
    max-width: var(--layout-pc-width, 650px);
    left: 50%;
    transform: translateX(-50%);
  }

  .balance-card,
  .fee-standard,
  .amount-input-wrap,
  .payment-methods,
  .receiver-card,
  .account-card {
    margin-left: 0;
    margin-right: 0;
  }
}

@media (min-width: 1024px) {
  .withdraw-page {
    max-width: var(--layout-pc-width-lg, 720px);
  }

  .header {
    max-width: var(--layout-pc-width-lg, 720px);
  }
}
</style>
