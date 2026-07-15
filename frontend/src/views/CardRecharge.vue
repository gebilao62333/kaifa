<template>
  <div class="card-recharge-page">
    <div class="page-nav">
      <span class="back-btn" @click="goBack">← 返回</span>
      <h2>卡密充值</h2>
      <span></span>
    </div>

    <div class="card-form">
      <div class="form-icon">🎫</div>
      <p class="form-desc">输入卡号和密码进行充值</p>

      <div class="input-group">
        <label>卡号</label>
        <input
          v-model="cardNo"
          type="text"
          placeholder="请输入卡号"
          class="form-input"
          :disabled="loading"
        />
      </div>

      <div class="input-group">
        <label>密码</label>
        <input
          v-model="cardPwd"
          type="text"
          placeholder="请输入密码"
          class="form-input"
          :disabled="loading"
        />
      </div>

      <button
        class="submit-btn"
        :disabled="!canSubmit || loading"
        @click="submitRecharge"
      >
        {{ loading ? '验证中...' : '立即充值' }}
      </button>

      <div class="tips">
        <h4>使用说明</h4>
        <ul>
          <li>卡号和密码由平台发放，请勿泄露</li>
          <li>每张卡密仅可使用一次</li>
          <li>充值成功后金币将立即到账</li>
          <li>如有疑问请联系客服</li>
        </ul>
      </div>
    </div>

    <div class="result-modal" v-if="showResult">
      <div class="result-content">
        <div class="result-icon">{{ resultSuccess ? '✅' : '❌' }}</div>
        <h3>{{ resultSuccess ? '充值成功' : '充值失败' }}</h3>
        <p v-if="resultSuccess">已到账 <strong>{{ resultAmount }}</strong> 金币</p>
        <p v-else>{{ resultMsg }}</p>
        <button class="result-btn" @click="closeResult">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import payService from '../services/payService'

const router = useRouter()
const cardNo = ref('')
const cardPwd = ref('')
const loading = ref(false)
const showResult = ref(false)
const resultSuccess = ref(false)
const resultMsg = ref('')
const resultAmount = ref(0)

const canSubmit = computed(() => cardNo.value.trim() && cardPwd.value.trim())

const goBack = () => window.history.length > 1 ? router.back() : router.push('/wallet')

const submitRecharge = async () => {
  if (!canSubmit.value || loading.value) return

  loading.value = true
  try {
    // First validate the card
    const validateRes = await payService.validateCard(cardNo.value.trim(), cardPwd.value.trim())

    if (validateRes.code !== 200 && validateRes.code !== 0) {
      showResultModal(false, validateRes.message || '卡密验证失败')
      return
    }

    // Then use the card
    const useRes = await payService.useCard(cardNo.value.trim(), cardPwd.value.trim())

    if (useRes.code === 200 || useRes.code === 0) {
      resultAmount.value = useRes.data?.amount || useRes.data?.coinAmount || 0
      showResultModal(true, '')
    } else {
      showResultModal(false, useRes.message || '充值失败，请稍后重试')
    }
  } catch (err) {
    console.error('卡密充值失败:', err)
    showResultModal(false, '网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

const showResultModal = (success, msg) => {
  resultSuccess.value = success
  resultMsg.value = msg
  showResult.value = true
  if (success) {
    cardNo.value = ''
    cardPwd.value = ''
  }
}

const closeResult = () => {
  showResult.value = false
}
</script>

<style scoped>
.card-recharge-page {
  min-height: calc(100vh - 80px);
  background: #f5f5f5;
  padding-bottom: 80px;
}

.page-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-nav h2 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.back-btn {
  font-size: 15px;
  color: #667eea;
  cursor: pointer;
}

.card-form {
  margin: 20px 16px;
  background: #fff;
  border-radius: 16px;
  padding: 30px 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.form-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.form-desc {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-bottom: 24px;
}

.input-group {
  margin-bottom: 16px;
}

.input-group label {
  display: block;
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
  background: #fafafa;
}

.form-input:focus {
  border-color: #667eea;
  background: #fff;
}

.form-input:disabled {
  background: #f5f5f5;
  color: #999;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  margin-top: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn:active:not(:disabled) {
  opacity: 0.9;
  transform: scale(0.98);
}

.tips {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9ff;
  border-radius: 12px;
}

.tips h4 {
  font-size: 14px;
  color: #667eea;
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
  color: #667eea;
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
  border-radius: 16px;
  padding: 40px 30px;
  text-align: center;
  width: 300px;
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
  color: #667eea;
  font-size: 18px;
}

.result-btn {
  padding: 12px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  cursor: pointer;
}

@media (min-width: 768px) {
  .card-recharge-page {
    max-width: 500px;
    margin: 0 auto;
  }
}
</style>
