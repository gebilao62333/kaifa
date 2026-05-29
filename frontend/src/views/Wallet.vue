<template>
  <div class="wallet-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">我的钱包</span>
    </div>

    <div class="content-container">
      <div class="balance-card">
        <div class="balance-header">
          <span class="balance-label">总资产</span>
          <span class="vip-badge" v-if="userInfo.vip">VIP{{ userInfo.vipLevel }}</span>
        </div>
        <div class="balance-main">
          <span class="coin-icon">💰</span>
          <div class="balance-info">
            <div class="balance-row">
              <span class="balance-num">{{ formatBalance(userInfo.balance) }}</span>
              <span class="balance-unit">金币</span>
            </div>
            <span class="balance-hint">≈ ¥{{ formatBalance(userInfo.balance / 10) }}</span>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <div class="action-btn recharge" @click="goRecharge">
          <span class="action-icon">💎</span>
          <span class="action-text">充值</span>
        </div>
        <div class="action-btn withdraw" @click="goWithdraw">
          <span class="action-icon">💸</span>
          <span class="action-text">提现</span>
        </div>
      </div>

      <div class="stats-section">
        <div class="section-title">今日概览</div>
        <div class="stats-row">
          <div class="stat-card income" @click="goIncomeRecords">
            <div class="stat-header">
              <span class="stat-icon">📈</span>
              <span class="stat-label">今日收入</span>
            </div>
            <span class="stat-value income">+{{ formatBalance(userInfo.todayIncome) }}</span>
          </div>
          <div class="stat-card expense" @click="goExpenseRecords">
            <div class="stat-header">
              <span class="stat-icon">📉</span>
              <span class="stat-label">今日支出</span>
            </div>
            <span class="stat-value expense">-{{ formatBalance(userInfo.todayExpense) }}</span>
          </div>
        </div>
        <div class="stats-row">
          <div class="stat-card" @click="goWithdrawRecords">
            <div class="stat-header">
              <span class="stat-icon">💳</span>
              <span class="stat-label">累计提现</span>
            </div>
            <span class="stat-value">{{ formatBalance(userInfo.totalWithdraw) }}</span>
          </div>
          <div class="stat-card" @click="goIncomeRecords">
            <div class="stat-header">
              <span class="stat-icon">💵</span>
              <span class="stat-label">累计收入</span>
            </div>
            <span class="stat-value income">+{{ formatBalance(userInfo.totalIncome) }}</span>
          </div>
        </div>
      </div>

      <div class="menu-section">
        <div class="menu-group">
          <div class="menu-title">交易记录</div>
          <div class="menu-item" @click="goIncomeRecords">
            <span class="menu-icon">📈</span>
            <span class="menu-text">收入记录</span>
            <span class="menu-arrow">›</span>
          </div>
          <div class="menu-item" @click="goExpenseRecords">
            <span class="menu-icon">📉</span>
            <span class="menu-text">支出记录</span>
            <span class="menu-arrow">›</span>
          </div>
          <div class="menu-item" @click="goWithdrawRecords">
            <span class="menu-icon">💳</span>
            <span class="menu-text">提现记录</span>
            <span class="menu-arrow">›</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user-info'

const router = useRouter()
const userStore = useUserStore()

const getHost = () => {
  return window.globalData?.host || ''
}

const userInfo = ref({
  balance: 0,
  todayIncome: 68.50,
  todayExpense: 12.00,
  totalWithdraw: 520.00,
  totalIncome: 1280.00,
  vip: false,
  vipLevel: 0
})

const fetchBalance = async () => {
  try {
    const token = userStore.token || localStorage.getItem('token')
    const res = await fetch(`${getHost()}/api/pay/wallet/balance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const result = await res.json()
    if (result.code === 200 && result.data) {
      userInfo.value.balance = result.data.balance || 0
    }
  } catch (err) {
    console.debug('后端服务未启动，使用默认值')
  }
}

onMounted(async () => {
  await fetchBalance()
})

const formatBalance = (balance) => {
  return balance?.toFixed(2) || '0.00'
}

const goBack = () => {
  router.back()
}

const goRecharge = () => {
  router.push('/recharge')
}

const goWithdraw = () => {
  router.push('/withdraw')
}

const goIncomeRecords = () => {
  router.push('/income-records')
}

const goExpenseRecords = () => {
  router.push('/expense-records')
}

const goWithdrawRecords = () => {
  router.push('/withdraw-records')
}
</script>

<style scoped>
.wallet-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  padding-top: 70px;
  padding-bottom: 80px;
  padding-bottom: calc(80px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
  box-sizing: border-box;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: -webkit-linear-gradient(315deg, #667eea 0%, #764ba2 100%);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  box-sizing: border-box;
}

.back-btn {
  font-size: 24px;
  color: #fff;
  cursor: pointer;
  position: absolute;
  left: 20px;
  -webkit-tap-highlight-color: transparent;
}

.header .title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  margin: 0;
  padding: 0;
}

.content-container {
  padding: 20px 16px;
  max-width: 100%;
  width: 100%;
  margin: 90px auto 0;
}

.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  margin: 0 0 16px 0;
  width: 100%;
  max-width: 100%;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  height: auto;
  min-height: 140px;
  box-sizing: border-box;
}

.balance-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.coin-icon {
  font-size: 48px;
}

.balance-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.balance-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.balance-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.balance-num {
  font-size: 36px;
  font-weight: bold;
  color: #fff;
}

.balance-unit {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.quick-actions {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  width: 100%;
  max-width: 100%;
  margin: 0 0 24px 0;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-btn:active {
  transform: scale(0.98);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
}

.action-icon {
  font-size: 24px;
}

.action-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.stats-section {
  padding: 0 0 16px;
  width: 100%;
  max-width: 100%;
  margin: 0 0 24px 0;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.stats-row:last-child {
  margin-bottom: 0;
}

.stats-row:nth-child(2) > .stat-card:first-child {
  margin-left: 0;
}

.stats-row:nth-child(3) > .stat-card:first-child {
  margin-left: 0;
}

.stats-row:nth-child(2) > .stat-card:last-child {
  margin-left: 0;
  margin-right: 0;
}

.stats-row:nth-child(3) > .stat-card:last-child {
  margin-right: 0;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.stat-card:active {
  transform: scale(0.98);
}

.stat-card.income {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02));
}

.stat-card.expense {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02));
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
}

.stat-icon {
  font-size: 18px;
}

.stat-label {
  font-size: 13px;
  color: #666;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.stat-value.income {
  color: #10b981;
}

.stat-value.expense {
  color: #ef4444;
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.balance-header .balance-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.vip-badge {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #fff;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: bold;
}

.balance-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.menu-section {
  padding: 0;
  width: 100%;
  max-width: 100%;
  margin: 0;
}

.menu-group {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  margin: 0;
  width: 100%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.menu-title {
  padding: 14px 16px;
  font-size: 14px;
  color: #333;
  font-weight: bold;
  border-bottom: 1px solid #f0f0f0;
  margin: 0;
  width: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  min-height: 48px;
  margin: 0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background-color: #fafafa;
}

.menu-icon {
  font-size: 20px;
  margin-right: 12px;
  width: 28px;
  text-align: center;
}

.menu-text {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.menu-arrow {
  font-size: 18px;
  color: #ccc;
}

/* 响应式设计 - 平板端 */
@media (min-width: 768px) {
  .wallet-page {
    max-width: 650px;
    margin: 0 auto;
  }

  .content-container {
    margin: 90px auto 0;
    padding: 24px;
    max-width: 650px;
  }

  .header {
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
  }
}

@media (min-width: 1024px) {
  .wallet-page {
    max-width: 720px;
  }
  .content-container {
    max-width: 720px;
  }
  .header {
    max-width: 720px;
  }
}

/* 响应式设计 - 移动端小屏幕 */
@media (max-width: 400px) {
  .balance-num {
    font-size: 28px;
  }

  .coin-icon {
    font-size: 36px;
  }

  .action-btn {
    padding: 12px;
  }

  .action-text {
    font-size: 14px;
  }

  .stat-card {
    padding: 12px;
  }

  .stat-value {
    font-size: 16px;
  }

  .menu-item {
    padding: 12px;
  }
}

/* 优化触摸体验 */
@media (hover: none) {
  .action-btn:active,
  .stat-card:active,
  .menu-item:active {
    transform: scale(0.98);
    background-color: #f5f5f5;
  }
}


</style>
