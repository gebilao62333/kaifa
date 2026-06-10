<template>
  <div class="records-page">
    <div class="header">
    <span class="back-btn" @click="goBack">←</span>
    <span class="title">支出明细</span>
    <span class="total expense">今日 -{{ formatAmount(totalExpense) }} 金币</span>
  </div>

  <div class="summary-card">
    <div class="summary-item">
      <span class="summary-label">支出总额</span>
      <span class="summary-value expense">-{{ formatAmount(totalExpense) }} 金币</span>
    </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-label">支出笔数</span>
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
        <span class="record-amount expense">-{{ formatAmount(item.amount) }} 金币</span>
      </div>
    </div>

    <div class="empty-state" v-if="records.length === 0">
      <span class="empty-icon">💸</span>
      <span class="empty-text">暂无支出记录</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { formatBalance } from '../common/common'

const router = useRouter()

const totalExpense = ref(12.00)

const records = ref([
  { icon: '🎁', title: '购买礼物', desc: '赠送"小雪"礼物', time: '13:40', amount: 6.00, bgColor: 'linear-gradient(135deg, #fa709a, #fee140)' },
  { icon: '📢', title: '置顶帖子', desc: '帖子置顶消耗', time: '10:30', amount: 3.00, bgColor: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
  { icon: '🔒', title: '解锁勋章', desc: '开通月度勋章', time: '09:00', amount: 3.00, bgColor: 'linear-gradient(135deg, #ffecd2, #fcb69f)' }
])

const formatAmount = (val) => formatBalance(val)

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.records-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: var(--bg-secondary);
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
  background: var(--gradient-primary);
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 650px;
  z-index: 100;
  box-sizing: border-box;
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

.total.expense {
  color: var(--danger-color);
  font-weight: 600;
  font-size: 15px;
  width: 80px;
  text-align: right;
}

.summary-card {
  display: flex;
  align-items: center;
  background: var(--bg-primary);
  margin: 12px;
  padding: 20px;
  border-radius: 10px;
  box-shadow: var(--shadow-light);
}

.summary-item {
  flex: 1;
  text-align: center;
}

.summary-label {
  font-size: 12px;
  color: var(--text-muted);
  display: block;
  margin-bottom: 6px;
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.summary-value.expense {
  color: var(--danger-color);
}

.summary-divider {
  width: 1px;
  height: 40px;
  background: var(--border-light);
  margin: 0 16px;
}

.records-list {
  padding: 0 12px;
}

.record-card {
  display: flex;
  align-items: center;
  background: var(--bg-primary);
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
  color: var(--text-primary);
  display: block;
  margin-bottom: 2px;
}

.record-desc {
  font-size: 12px;
  color: var(--text-muted);
  display: block;
  margin-bottom: 2px;
}

.record-time {
  font-size: 11px;
  color: var(--text-muted);
}

.record-amount {
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
  margin-left: 12px;
}

.record-amount.expense {
  color: var(--danger-color);
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
  color: var(--text-muted);
}

@media (min-width: 768px) {
  .records-page {
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
  .records-page {
    max-width: 720px;
  }
  .header {
    max-width: 720px;
  }
}
</style>
