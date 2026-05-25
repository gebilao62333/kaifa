<template>
  <div class="recharge-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">充值中心</span>
    </div>

    <div class="balance-card">
      <div class="label">我的余额</div>
      <div class="amount">{{ formatAmount(balance) }}</div>
      <div class="unit">金币</div>
    </div>

    <div class="section-title">充值金额</div>
    <div class="amount-grid">
      <div
        v-for="item in options"
        :key="item.id"
        :class="['amount-item', { active: selectedId === item.id }]"
        @click="selectedId = item.id"
      >
        <div class="amount">{{ item.coins }} 金币</div>
        <div class="price">¥{{ item.price }}</div>
        <div v-if="item.tag" class="tag">{{ item.tag }}</div>
        <div v-if="item.bonus" class="bonus">赠 {{ item.bonus }} 金币</div>
      </div>
    </div>

    <div class="section-title">支付方式</div>
    <div class="payment-methods">
      <div
        v-for="method in payMethodsList"
        :key="method.id"
        :class="['payment-item', { active: payMethod === method.id }]"
        @click="payMethod = method.id"
      >
        <span class="pay-icon" :style="{ background: method.bg }">{{ method.icon }}</span>
        <div class="pay-info">
          <span class="pay-name">{{ method.name }}</span>
          <span class="pay-desc">{{ method.desc }}</span>
        </div>
        <span class="radio" :class="{ checked: payMethod === method.id }"></span>
      </div>
    </div>

    <div class="card-input-section" v-if="payMethod === 'card'">
      <div class="section-title">密卡信息</div>
      <div class="card-inputs">
        <div class="card-input-group">
          <input type="text" v-model="cardCode" placeholder="请输入密卡" maxlength="32" />
        </div>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="total">
        <span class="label">支付金额</span>
        <span class="price">¥{{ selectedPrice }}</span>
        <span class="note" v-if="selectedBonus">（含赠币 {{ selectedBonus }}）</span>
      </div>
      <button class="recharge-btn" :disabled="submitting" @click="doRecharge">
        {{ submitting ? '处理中...' : '立即支付' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRechargeMethods } from '../common/payMethods'

const router = useRouter()

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

const saveBalance = () => {
  try {
    const saved = localStorage.getItem('userInfo')
    const data = saved ? JSON.parse(saved) : {}
    data.balance = balance.value
    localStorage.setItem('userInfo', JSON.stringify(data))
  } catch {}
}

onMounted(() => {
  balance.value = loadBalance()
})
const selectedId = ref(3)
const payMethod = ref('alipay')
const cardCode = ref('')
const submitting = ref(false)

const options = ref([
  { id: 1, coins: '60', price: '6', tag: '', bonus: '' },
  { id: 2, coins: '180', price: '18', tag: '', bonus: '10' },
  { id: 3, coins: '300', price: '30', tag: '', bonus: '30' },
  { id: 4, coins: '680', price: '68', tag: '', bonus: '80' },
  { id: 5, coins: '1280', price: '128', tag: '', bonus: '200' },
  { id: 6, coins: '3280', price: '328', tag: '', bonus: '500' },
])

const formatAmount = (num) => {
  return num.toFixed(2)
}

const payMethodsList = computed(() => {
  return getRechargeMethods().filter(m => m.id !== 'balance').map(m => {
    if (m.id === 'card') {
      return { ...m, name: '密卡支付' }
    }
    return m
  })
})

const selectedPrice = computed(() => {
  const selected = options.value.find(o => o.id === selectedId.value)
  return selected ? selected.price : 0
})

const selectedBonus = computed(() => {
  const selected = options.value.find(o => o.id === selectedId.value)
  return selected?.bonus || ''
})

const goBack = () => {
  router.back()
}

const doRecharge = async () => {
  if (submitting.value) return

  if (payMethod.value === 'card') {
    if (!cardCode.value.trim()) {
      alert('请输入密卡')
      return
    }

    submitting.value = true

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      const validCards = [
        { code: 'VIP123456', coins: 100 },
        { code: 'GIFT654321', coins: 200 },
        { code: 'TEST999999', coins: 500 },
        { code: 'FREE100000', coins: 100 }
      ]

      const card = validCards.find(c => c.code === cardCode.value.trim().toUpperCase())

      if (card) {
        balance.value = Number(balance.value) + card.coins
        saveBalance()
        alert(`充值成功！获得 ${card.coins} 金币`)
        cardCode.value = ''
      } else {
        alert('密卡无效，充值失败')
      }
    } catch (error) {
      console.error('密卡充值错误:', error)
      alert('网络错误，请重试')
    } finally {
      submitting.value = false
    }
  } else if (payMethod.value === 'balance') {
    const selected = options.value.find(o => o.id === selectedId.value)
    const costCoins = parseInt(selected.amount)

    if (balance.value < costCoins) {
      alert('余额不足')
      return
    }

    submitting.value = true

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      balance.value = Number(balance.value) - costCoins + (parseInt(selected.bonus) || 0)
      saveBalance()
      alert(`充值成功！花费 ${costCoins} 币，获得 ${selected.amount} 币`)
    } catch (error) {
      console.error('余额支付错误:', error)
      alert('网络错误，请重试')
    } finally {
      submitting.value = false
    }
  } else {
    const params = new URLSearchParams({
      type: 'recharge',
      method: payMethod.value,
      amount: selectedPrice.value,
      balance: balance.value
    })
    router.push(`/payment-gateway?${params.toString()}`)
  }
}
</script>

<style scoped>
.recharge-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 140px;
}

.header {
  display: flex;
  align-items: center;
  padding: 60px 20px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.back-btn {
  font-size: 24px;
  cursor: pointer;
  margin-right: 20px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.balance-card {
  margin: 10px 20px 20px;
  background: white;
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.balance-card .label {
  font-size: 14px;
  color: #999;
  margin-bottom: 8px;
}

.balance-card .amount {
  font-size: 36px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.balance-card .unit {
  font-size: 13px;
  color: #999;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  padding: 20px 20px 12px;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 0 20px;
}

.amount-item {
  background: white;
  border-radius: 12px;
  padding: 20px 0;
  text-align: center;
  border: 2px solid transparent;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.amount-item.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.amount-item .amount {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 6px;
}

.amount-item .price {
  font-size: 14px;
  color: #999;
}

.amount-item .tag {
  position: absolute;
  top: -10px;
  right: 8px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: white;
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 10px;
}

.amount-item .bonus {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #43e97b, #38f9d7);
  color: white;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 8px;
  white-space: nowrap;
}

.payment-methods {
  padding: 0 20px;
}

.payment-item {
  display: flex;
  align-items: center;
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-item.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.03);
}

.pay-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
  margin-right: 14px;
  flex-shrink: 0;
}

.pay-info {
  flex: 1;
}

.pay-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 2px;
}

.pay-desc {
  font-size: 12px;
  color: #999;
  display: block;
}

.radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #ddd;
  position: relative;
  flex-shrink: 0;
  transition: all 0.2s;
}

.radio.checked {
  border-color: #667eea;
}

.radio.checked::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #667eea;
}

.card-input-section {
  padding: 0 20px;
}

.card-inputs {
  background: white;
  border-radius: 12px;
  padding: 4px 16px;
  margin-bottom: 140px;
}

.card-input-group {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.card-input-group:last-child {
  border-bottom: none;
}

.card-input-group input {
  width: 100%;
  padding: 8px 0;
  border: none;
  outline: none;
  font-size: 15px;
  color: #333;
  background: transparent;
  box-sizing: border-box;
}

.card-input-group input::placeholder {
  color: #ccc;
}

.bottom-bar {
  background: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  margin: 20px;
}

.total .label {
  font-size: 13px;
  color: #666;
  display: block;
  margin-bottom: 4px;
}

.total .price {
  font-size: 24px;
  font-weight: bold;
  color: #ff6b6b;
}

.total .note {
  font-size: 11px;
  color: #10b981;
  margin-left: 6px;
}

.recharge-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.recharge-btn:disabled {
  opacity: 0.6;
}
</style>
