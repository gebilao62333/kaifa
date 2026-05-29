<template>
  <div class="records-page">
    <div class="header">
    <span class="back-btn" @click="goBack">←</span>
    <span class="title">收入明细</span>
    <span class="total">今日 +{{ formatAmount(totalIncome) }} 金币</span>
  </div>

  <div class="summary-card">
    <div class="summary-item">
      <span class="summary-label">收入总额</span>
      <span class="summary-value income">+{{ formatAmount(totalIncome) }} 金币</span>
    </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-label">收入笔数</span>
        <span class="summary-value">{{ records.length }} 笔</span>
      </div>
    </div>

    <div class="records-list">
      <div class="record-card" v-for="(item, idx) in records" :key="idx">
        <div class="record-icon-wrap" :style="{ background: item.bgColor }">
          <span class="record-icon">{{ item.icon }}</span>
        </div>
        <div class="record-info">
          <span class="record-title">{{ item.title }}</span>
          <span class="record-desc">{{ item.desc }}</span>
          <span class="record-time">{{ item.time }}</span>
        </div>
        <span class="record-amount income">+{{ formatAmount(item.amount) }} 金币</span>
      </div>
    </div>

    <div class="empty-state" v-if="records.length === 0">
      <span class="empty-icon">💰</span>
      <span class="empty-text">暂无收入记录</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const totalIncome = ref(68.50)

const records = ref([
  { icon: '🎮', title: '陪玩订单', desc: '王者荣耀 · 2小时', time: '14:30', amount: 50.00, bgColor: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { icon: '💬', title: '语音陪聊', desc: '语音聊天 · 30分钟', time: '11:20', amount: 18.50, bgColor: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { icon: '⭐', title: '打赏收入', desc: '用户"小可爱"打赏', time: '09:15', amount: 8.00, bgColor: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { icon: '🎯', title: '活动奖励', desc: '每日接单任务奖励', time: '08:00', amount: 2.00, bgColor: 'linear-gradient(135deg, #43e97b, #38f9d7)' }
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
  padding-top: 70px;
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
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 650px;
  z-index: 100;
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
  color: #10b981;
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
  font-size: 22px;
  font-weight: 700;
  color: #333;
}

.summary-value.income {
  color: #10b981;
}

.summary-divider {
  width: 1px;
  height: 40px;
  background: #f0f0f0;
  margin: 0 16px;
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
  border-radius: 12px;
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

.record-amount {
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
  margin-left: 12px;
}

.record-amount.income {
  color: #10b981;
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

@media (min-width: 768px) {
  .income-records-page {
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
  .income-records-page {
    max-width: 720px;
  }
  .header {
    max-width: 720px;
  }
}
</style>
