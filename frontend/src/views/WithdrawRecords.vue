<template>
  <div class="records-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">提现明细</span>
      <span class="total">累计 {{ formatAmount(totalWithdraw) }}</span>
    </div>

    <div class="summary-card">
      <div class="summary-item">
        <span class="summary-label">累计提现</span>
        <span class="summary-value">{{ formatAmount(totalWithdraw) }}</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-label">提现次数</span>
        <span class="summary-value">{{ records.length }} 次</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-label">可提现余额</span>
        <span class="summary-value withdraw">{{ formatAmount(balance) }}</span>
      </div>
    </div>

    <div class="records-list">
      <div class="record-card" v-for="(item, idx) in records" :key="idx">
        <div class="record-icon-wrap" :style="{ background: item.bgColor }">
          <span class="record-icon">{{ item.icon }}</span>
        </div>
        <div class="record-info">
          <span class="record-title">{{ item.title }}</span>
          <span class="record-desc">{{ item.desc }} · {{ item.account }}</span>
          <span class="record-time">{{ item.time }}</span>
        </div>
        <div class="record-status-wrap">
          <span class="record-amount">{{ formatAmount(item.amount) }}</span>
          <span :class="['record-status', item.status]">{{ item.status === 'success' ? '已到账' : '处理中' }}</span>
        </div>
      </div>
    </div>

    <div class="empty-state" v-if="records.length === 0">
      <span class="empty-icon">🏦</span>
      <span class="empty-text">暂无提现记录</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const totalWithdraw = ref(520.00)
const balance = ref(128.50)

const records = ref([
  { icon: '🏦', title: '提现到银行卡', desc: '提现', account: '尾号8848', time: '2026-05-15 14:30', amount: 200.00, status: 'success', bgColor: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { icon: '🏦', title: '提现到密卡', desc: '提现', account: '尾号8848', time: '2026-05-15 14:30', amount: 200.00, status: 'success', bgColor: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { icon: '🏦', title: '提现到密卡', desc: '提现', account: '尾号8848', time: '2026-04-28 16:20', amount: 100.00, status: 'success', bgColor: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { icon: '💳', title: '提现到微信', desc: '提现', account: '多客用户', time: '2026-04-15 09:00', amount: 70.00, status: 'pending', bgColor: 'linear-gradient(135deg, #fa709a, #fee140)' }
])

const formatAmount = (val) => {
  return (val || 0).toFixed(2)
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.records-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  padding-top: 82px;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: -webkit-linear-gradient(315deg, #667eea 0%, #764ba2 100%);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.back-btn {
  font-size: 24px;
  color: #fff;
  cursor: pointer;
  width: 40px;
  -webkit-tap-highlight-color: transparent;
}

.header .title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.total {
  font-size: 15px;
  color: #fff;
  font-weight: 600;
  width: 80px;
  text-align: right;
}

.summary-card {
  display: flex;
  align-items: center;
  background: #fff;
  margin: 12px;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.summary-item {
  flex: 1;
  text-align: center;
}

.summary-label {
  font-size: 12px;
  color: #999;
  display: block;
  margin-bottom: 6px;
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.summary-value.withdraw {
  color: #667eea;
}

.summary-divider {
  width: 1px;
  height: 40px;
  background: #f0f0f0;
  margin: 0 12px;
}

.records-list {
  padding: 0 12px;
}

.record-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 10px;
}

.record-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  flex-shrink: 0;
}

.record-icon {
  font-size: 22px;
}

.record-info {
  flex: 1;
  min-width: 0;
}

.record-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 2px;
}

.record-desc {
  font-size: 12px;
  color: #999;
  display: block;
  margin-bottom: 2px;
}

.record-time {
  font-size: 11px;
  color: #ccc;
}

.record-status-wrap {
  text-align: right;
  margin-left: 12px;
  flex-shrink: 0;
}

.record-amount {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  display: block;
}

.record-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 8px;
  display: inline-block;
  margin-top: 4px;
}

.record-status.success {
  color: #10b981;
  background: rgba(16,185,129,0.1);
}

.record-status.pending {
  color: #f59e0b;
  background: rgba(245,158,11,0.1);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100px 0;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 15px;
  color: #999;
}
</style>
