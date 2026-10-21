<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">← 返回</text>
      <text class="nav-title">卡密充值</text>
    </template>

    <view class="card-form">
      <view class="form-icon">🎫</view>

      <!-- P2-10：保留原 25 位密钥流程，新增「卡号+密码」模式 -->
      <view class="mode-switch">
        <view
          class="mode-item"
          :class="{ active: mode === 'key' }"
          @click="switchMode('key')"
        >25位密钥</view>
        <view
          class="mode-item"
          :class="{ active: mode === 'card' }"
          @click="switchMode('card')"
        >卡号+密码</view>
      </view>
      <view class="form-desc">{{ mode === 'key' ? '输入25位充值密钥即可充值' : '输入卡号与卡密密码即可充值' }}</view>

      <template v-if="mode === 'key'">
        <view class="key-input-wrapper">
          <input
            v-model="displayKey"
            type="text"
            inputmode="numeric"
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
            class="key-input"
            maxlength="29"
            :disabled="loading"
            @input="onKeyInput"
          />
          <view class="key-blocks">
            <text
              v-for="(group, gi) in keyGroups"
              :key="gi"
              class="key-block"
              :class="{ filled: group.length === 5 }"
            >
              <text
                v-for="(ch, ci) in group.padEnd(5, ' ')"
                :key="ci"
                class="key-char"
                :class="{ placeholder: ch === ' ' }"
              >{{ ch }}</text>
            </text>
          </view>
        </view>
      </template>

      <view class="card-credential-form" v-else>
        <view class="credential-field">
          <text class="credential-label">卡号</text>
          <input
            v-model="cardNo"
            type="text"
            class="credential-input"
            placeholder="请输入卡号（管理端发放，如 DK 开头）"
            maxlength="50"
            :disabled="loading"
          />
        </view>
        <view class="credential-field">
          <text class="credential-label">密码</text>
          <input
            v-model="cardPassword"
            type="password"
            class="credential-input"
            placeholder="请输入卡密密码"
            maxlength="50"
            :disabled="loading"
          />
        </view>
      </view>

      <button
        class="submit-btn"
        :disabled="!canSubmit || loading || retryCooldown > 0"
        @click="submitRecharge"
      >
        <text v-if="loading" class="btn-loading"></text>
        {{ retryCooldown > 0 ? retryCooldown + 's 后可重试' : (loading ? (mode === 'key' ? '验证中...' : '充值中...') : '立即充值') }}
      </button>

      <view class="tips">
        <h4>使用说明</h4>
        <ul v-if="mode === 'key'">
          <li>输入平台发放的25位充值密钥</li>
          <li>每张密钥仅可使用一次</li>
          <li>充值成功后余额将立即到账</li>
          <li>无需区分卡号密码，一键充值</li>
        </ul>
        <ul v-else>
          <li>输入管理端发放的卡号与卡密密码</li>
          <li>卡号与密码需同时正确，任一错误无法充值</li>
          <li>每张卡密仅可使用一次</li>
          <li>充值成功后余额将立即到账</li>
        </ul>
      </view>
    </view>

    <view class="result-modal" v-if="showResult" @click.self="closeResult">
      <view class="result-content">
        <view class="result-icon">{{ resultSuccess ? '✅' : '❌' }}</view>
        <h3>{{ resultSuccess ? '充值成功' : '充值失败' }}</h3>
        <view v-if="resultSuccess">已到账 <strong>{{ resultAmount }}</strong> 金币</view>
        <view v-else>{{ resultMsg }}</view>
        <button class="result-btn" @click="closeResult">确定</button>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from '@/common/route'
import payService from '../services/payService'
import { useUserStore } from '../store/user-info'
import PageLayout from '../components/PageLayout.vue'

const router = useRouter()
const userStore = useUserStore()
// P2-10：key=25位密钥（原流程），card=卡号+密码
const mode = ref('key')
const cardNo = ref('')
const cardPassword = ref('')
const displayKey = ref('')
const rawKey = ref('')
const loading = ref(false)
const showResult = ref(false)
const resultSuccess = ref(false)
const resultMsg = ref('')
const resultAmount = ref(0)
// C-7：卡密校验接口有 cardLimiter，429 时按服务端给的冷却时间禁用按钮
const retryCooldown = ref(0)
let retryTimer = null

const startRetryCooldown = (seconds) => {
  const safe = Math.max(1, Math.min(Number(seconds) || 0, 3600))
  if (!safe) return
  retryCooldown.value = safe
  if (retryTimer) clearInterval(retryTimer)
  retryTimer = setInterval(() => {
    retryCooldown.value -= 1
    if (retryCooldown.value <= 0) {
      clearInterval(retryTimer)
      retryTimer = null
      retryCooldown.value = 0
    }
  }, 1000)
}

const keyGroups = computed(() => {
  const clean = rawKey.value.replace(/\D/g, '')
  const groups = []
  for (let i = 0; i < 5; i++) {
    groups.push(clean.substring(i * 5, (i + 1) * 5))
  }
  return groups
})

const keyValid = computed(() => rawKey.value.replace(/\D/g, '').length === 25)
const cardValid = computed(() => cardNo.value.trim().length > 0 && cardPassword.value.trim().length > 0)
const canSubmit = computed(() => mode.value === 'key' ? keyValid.value : cardValid.value)

const switchMode = (value) => {
  if (mode.value === value || loading.value) return
  mode.value = value
}

const onKeyInput = () => {
  // 只保留数字
  const digits = displayKey.value.replace(/\D/g, '').slice(0, 25)

  // 自动加分隔符
  let formatted = ''
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && i % 5 === 0) formatted += '-'
    formatted += digits[i]
  }

  rawKey.value = digits
  displayKey.value = formatted
}

const goBack = () => window.history.length > 1 ? router.back() : router.push('/wallet')

const refreshBalance = async () => {
  try {
    await userStore.fetchUserInfo()
  } catch (err) {
    // 余额刷新失败不影响已经成功的充值提示
    console.error('刷新余额失败:', err)
  }
}

const submitKeyRecharge = async () => {
  loading.value = true
  try {
    const key = rawKey.value.replace(/\D/g, '')
    const amount = await payService.redeemCardByKey(key)
    resultAmount.value = amount
    showResultModal(true, '')
    // 两种模式成功后都刷新余额，避免密钥模式与卡号模式表现不一致
    await refreshBalance()
  } catch (err) {
    console.error('密钥充值失败:', err)
    showResultModal(false, err.message || '网络错误，请稍后重试')
    if (err.retryAfterSec) startRetryCooldown(err.retryAfterSec)
  } finally {
    loading.value = false
  }
}

// 先校验再核销：校验失败/已使用都直接透出服务端 message
const submitCardRecharge = async () => {
  const cardNoValue = cardNo.value.trim()
  const cardPwdValue = cardPassword.value.trim()
  if (!cardNoValue || !cardPwdValue) return

  loading.value = true
  try {
    const validateRes = await payService.validateCard(cardNoValue, cardPwdValue)
    if (validateRes && validateRes.code !== 200 && validateRes.code !== 0) {
      throw new Error(validateRes.message || '卡密验证失败')
    }
    const validateData = (validateRes && validateRes.data) || {}
    const useRes = await payService.useCard(cardNoValue, cardPwdValue)
    if (useRes && useRes.code !== 200 && useRes.code !== 0) {
      throw new Error(useRes.message || '卡密充值失败')
    }
    const useData = (useRes && useRes.data) || {}
    resultAmount.value = useData.amount ?? useData.coinAmount ?? validateData.coinAmount ?? 0
    showResultModal(true, '')
    cardNo.value = ''
    cardPassword.value = ''
    await refreshBalance()
  } catch (err) {
    console.error('卡号密码充值失败:', err)
    showResultModal(false, err.message || '网络错误，请稍后重试')
    if (err.retryAfterSec) startRetryCooldown(err.retryAfterSec)
  } finally {
    loading.value = false
  }
}

const submitRecharge = async () => {
  if (!canSubmit.value || loading.value || retryCooldown.value > 0) return
  if (mode.value === 'key') return submitKeyRecharge()
  return submitCardRecharge()
}

const showResultModal = (success, msg) => {
  resultSuccess.value = success
  resultMsg.value = msg
  showResult.value = true
  if (success) {
    displayKey.value = ''
    rawKey.value = ''
  }
}

const closeResult = () => {
  showResult.value = false
}
</script>

<style scoped>
.back-btn {
  font-size: 15px;
  color: #fff;
  cursor: pointer;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.card-form {
  margin: 12px 0 0;
  background: #fff;
  border-radius: 0px;
  padding: 32px 20px 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.form-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 8px;
}

.form-desc {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-bottom: 28px;
}

/* P2-10：密钥 / 卡号+密码 模式切换 */
.mode-switch {
  display: flex;
  gap: 8px;
  padding: 4px;
  margin-bottom: 14px;
  background: #f5f6ff;
  border-radius: 12px;
}

.mode-item {
  flex: 1;
  padding: 8px 0;
  text-align: center;
  font-size: 14px;
  color: #666;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-item.active {
  background: var(--gradient-primary);
  color: #fff;
  font-weight: 600;
}

.card-credential-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}

.credential-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.credential-label {
  font-size: 13px;
  color: #666;
}

.credential-input {
  width: 100%;
  padding: 12px 14px;
  box-sizing: border-box;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  background: #fafafa;
}

.credential-input:focus {
  border-color: #667eea;
  background: #fff;
  outline: none;
}

.key-input-wrapper {
  position: relative;
  margin-bottom: 20px;
}

.key-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  font-size: 16px;
  z-index: 2;
  cursor: text;
}

.key-blocks {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.key-block {
  display: flex;
  gap: 2px;
  padding: 14px 8px;
  background: #f5f5f5;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  transition: border-color 0.2s, background 0.2s;
}

.key-block.filled {
  border-color: #667eea;
  background: #f0f0ff;
}

.key-char {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 28px;
  font-size: 20px;
  font-weight: 700;
  color: #333;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
}

.key-char.placeholder {
  color: #ccc;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  margin-top: 8px;
  background: var(--gradient-primary);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn:active:not(:disabled) {
  opacity: 0.9;
  transform: scale(0.98);
}

.btn-loading {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tips {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9ff;
  border-radius: 12px;
}

.tips h4 {
  font-size: 14px;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.tips ul {
  list-style: none;
  padding: 0;
}

.tips li {
  font-size: 13px;
  color: #999;
  padding: 4px 0;
  padding-left: 16px;
  position: relative;
}

.tips li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-primary);
}

.result-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.result-content {
  background: #fff;
  border-radius: 0px;
  padding: 40px 30px;
  text-align: center;
  width: 300px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.result-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.result-content h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 8px;
}

.result-content view:not(.result-icon) {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.result-content view:not(.result-icon) strong {
  color: var(--color-primary);
  font-size: 18px;
}

.result-btn {
  padding: 12px 40px;
  background: var(--gradient-primary);
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  cursor: pointer;
}
</style>
