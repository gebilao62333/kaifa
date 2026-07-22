<template>
  <PageLayout>
    <template #nav>
      <span class="back-btn" @click="goBack">←</span>
      <span class="nav-title">我的钱包</span>
    </template>

    <div class="balance-section">
      <div class="balance-card" @click="showBreakdown = true">
        <div class="balance-header">
          <span class="balance-label">总资产 <span v-if="userInfo.vip" class="vip-badge">VIP{{ userInfo.vipLevel }}</span></span>
          <span class="asset-detail">查看构成 ›</span>
        </div>
        <div class="balance-main">
          <span class="coin-icon">💰</span>
          <div class="balance-info">
            <div class="balance-row">
              <span class="balance-num">{{ formatBalance(totalAssets) }}</span>
              <span class="balance-unit">金币</span>
            </div>
            <span class="balance-hint">≈ ¥{{ formatBalance(totalAssets / 10) }}</span>
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
          <span class="stat-value expense">-{{ formatBalance(todayExpense) }}</span>
        </div>
      </div>
      <div class="stats-row">
        <div class="stat-card" @click="goWithdrawRecords">
          <div class="stat-header">
            <span class="stat-icon">💳</span>
            <span class="stat-label">累计提现</span>
          </div>
          <span class="stat-value">{{ formatBalance(totalWithdraw) }}</span>
        </div>
        <div class="stat-card" @click="goIncomeRecords">
          <div class="stat-header">
            <span class="stat-icon">💵</span>
            <span class="stat-label">累计收入</span>
          </div>
          <span class="stat-value income">+{{ formatBalance(grossIncome) }}</span>
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

    <div class="breakdown-mask" v-if="showBreakdown" @click="showBreakdown = false">
      <div class="breakdown-sheet" @click.stop>
        <div class="breakdown-header">
          <span class="breakdown-title">收入来源构成</span>
          <span class="breakdown-close" @click="showBreakdown = false">×</span>
        </div>
        <div class="breakdown-total">
          <span class="label">收入合计</span>
          <span class="num">{{ formatBalance(grossIncome) }} 金币</span>
        </div>
        <div class="breakdown-list">
          <div class="breakdown-item" v-for="item in assetSources" :key="item.name">
            <span class="item-icon" :style="{ background: item.bgColor }">{{ item.icon }}</span>
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-bar"><i :style="{ width: item.percent + '%' }"></i></span>
            </div>
            <div class="item-right">
              <span class="item-amount">{{ formatBalance(item.amount) }}</span>
              <span class="item-percent">{{ item.percent }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '../components/PageLayout.vue'
import walletService from '../services/walletService'
import { isLoggedIn, devAutoLogin } from '@/common/common'
import { toast } from '../composables/useToast'

const router = useRouter()

const totalAssets = ref(0)
const grossIncome = ref(0)
const todayIncome = ref(0)
const todayExpense = ref(0)
const totalWithdraw = ref(0)
const assetSources = ref([])
const userInfo = ref({ vip: false, vipLevel: 0 })

const showBreakdown = ref(false)

const fetchWallet = async () => {
  try {
    const res = await walletService.getOverview()
    const data = res.data || res
    totalAssets.value = data.totalAssets || 0
    grossIncome.value = data.grossIncome || 0
    todayIncome.value = data.todayIncome || 0
    todayExpense.value = data.todayExpense || 0
    totalWithdraw.value = data.totalWithdraw || 0
  } catch (err) {
    console.error('获取钱包总览失败:', err)
  }
  try {
    const res = await walletService.getIncomeBreakdown()
    const data = res.data || res
    assetSources.value = data.list || []
  } catch (err) {
    console.error('获取收入构成失败:', err)
  }
}

onMounted(async () => {
  if (!isLoggedIn()) {
    // 开发/预览模式：无登录态时自动用演示账号登录，便于直接预览钱包页面
    if (import.meta.env.DEV) {
      const ok = await devAutoLogin()
      if (!ok) {
        toast.error('请先登录')
        router.replace('/login')
        return
      }
    } else {
      toast.error('请先登录')
      router.replace('/login')
      return
    }
  }
  await fetchWallet()
})

const formatBalance = (balance) => {
  return Number(balance || 0).toFixed(2)
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
.back-btn {
  font-size: 24px;
  color: #fff;
  cursor: pointer;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.balance-section {
  padding: 20px;
}

.balance-card {
  background: var(--gradient-primary);
  border-radius: 10px;
  padding: 10px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  height: 140px;
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
  padding: 10px 20px 10px;
  margin-top: 10px;
  margin-bottom: 10px;
  height: 70px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: #fff;
  border-radius: 0px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  padding: 0 20px 20px;
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

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #fff;
  border-radius: 0px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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

.asset-detail {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.18);
  padding: 4px 10px;
  border-radius: 12px;
  cursor: pointer;
}

.vip-badge {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: bold;
  margin-left: 6px;
  vertical-align: middle;
}

.balance-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.menu-section {
  padding: 20px;
}

.menu-group {
  background: #fff;
  border-radius: 0px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.menu-title {
  padding: 16px 20px 12px;
  font-size: 15px;
  color: #333;
  font-weight: bold;
  border-bottom: 1px solid #f5f5f5;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background-color: #fafafa;
}

.menu-icon {
  font-size: 22px;
  margin-right: 12px;
}

.menu-text {
  flex: 1;
  font-size: 15px;
  color: #333;
}

.menu-arrow {
  font-size: 20px;
  color: #ccc;
}

.breakdown-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 200;
}

.breakdown-sheet {
  width: 100%;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 20px 20px 28px;
  animation: sheet-up 0.25s ease;
}

@keyframes sheet-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.breakdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.breakdown-title {
  font-size: 17px;
  font-weight: bold;
  color: #333;
}

.breakdown-close {
  font-size: 26px;
  line-height: 1;
  color: #999;
  cursor: pointer;
}

.breakdown-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.05));
  border-radius: 12px;
  margin-bottom: 16px;
}

.breakdown-total .label {
  font-size: 14px;
  color: #666;
}

.breakdown-total .num {
  font-size: 20px;
  font-weight: bold;
  color: var(--color-primary);
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f6ff;
  border-radius: 10px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.item-bar {
  display: block;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.item-bar i {
  display: block;
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 3px;
}

.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.item-amount {
  font-size: 15px;
  font-weight: bold;
  color: #333;
}

.item-percent {
  font-size: 12px;
  color: #999;
}


</style>
