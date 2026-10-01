<template>
  <PageLayout>
    <template #nav>
      <span class="back-btn" @click="goBack">← 返回</span>
      <span class="nav-title">卡密充值</span>
    </template>

    <div class="card-form">
      <div class="form-icon">🎫</div>
      <p class="form-desc">输入25位充值密钥即可充值</p>

      <div class="key-input-wrapper">
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
        <div class="key-blocks">
          <span
            v-for="(group, gi) in keyGroups"
            :key="gi"
            class="key-block"
            :class="{ filled: group.length === 5 }"
          >
            <span
              v-for="(ch, ci) in group.padEnd(5, ' ')"
              :key="ci"
              class="key-char"
              :class="{ placeholder: ch === ' ' }"
            >{{ ch }}</span>
          </span>
        </div>
      </div>

      <button
        class="submit-btn"
        :disabled="!canSubmit || loading"
        @click="submitRecharge"
      >
        <span v-if="loading" class="btn-loading"></span>
        {{ loading ? '验证中...' : '立即充值' }}
      </button>

      <div class="tips">
        <h4>使用说明</h4>
        <ul>
          <li>输入平台发放的25位充值密钥</li>
          <li>每张密钥仅可使用一次</li>
          <li>充值成功后余额将立即到账</li>
          <li>无需区分卡号密码，一键充值</li>
        </ul>
      </div>
    </div>

    <div class="result-modal" v-if="showResult" @click.self="closeResult">
      <div class="result-content">
        <div class="result-icon">{{ resultSuccess ? '✅' : '❌' }}</div>
        <h3>{{ resultSuccess ? '充值成功' : '充值失败' }}</h3>
        <p v-if="resultSuccess">已到账 <strong>{{ resultAmount }}</strong> 元余额</p>
        <p v-else>{{ resultMsg }}</p>
        <button class="result-btn" @click="closeResult">确定</button>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import payService from '../services/payService'
import PageLayout from '../components/PageLayout.vue'

const router = useRouter()
const displayKey = ref('')
const rawKey = ref('')
const loading = ref(false)
const showResult = ref(false)
const resultSuccess = ref(false)
const resultMsg = ref('')
const resultAmount = ref(0)

const keyGroups = computed(() => {
  const clean = rawKey.value.replace(/\D/g, '')
  const groups = []
  for (let i = 0; i < 5; i++) {
    groups.push(clean.substring(i * 5, (i + 1) * 5))
  }
  return groups
})

const canSubmit = computed(() => rawKey.value.replace(/\D/g, '').length === 25)

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

const submitRecharge = async () => {
  if (!canSubmit.value || loading.value) return

  loading.value = true
  try {
    const key = rawKey.value.replace(/\D/g, '')
    const amount = await payService.redeemCardByKey(key)
    resultAmount.value = amount
    showResultModal(true, '')
  } catch (err) {
    console.error('密钥充值失败:', err)
    showResultModal(false, err.message || '网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
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

.result-content p {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.result-content p strong {
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
