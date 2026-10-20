<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">我的钱包</text>
    </template>

    <view class="balance-section">
      <view class="balance-card" @click="showBreakdown = true">
        <view class="balance-header">
          <text class="balance-label">总资产 <text v-if="userInfo.vip" class="vip-badge">VIP{{ userInfo.vipLevel }}</text></text>
          <text class="asset-detail">查看构成 ›</text>
        </view>
        <view class="balance-main">
          <text class="coin-icon">💰</text>
          <view class="balance-info">
            <view class="balance-row">
              <text class="balance-num">{{ formatBalance(totalAssets) }}</text>
              <text class="balance-unit">金币</text>
            </view>
            <text class="balance-hint">≈ ¥{{ formatBalance(totalAssets / 10) }}</text>
          </view>
        </view>
      </view>

      <view class="quick-actions">
        <view class="action-btn recharge" @click="goRecharge">
          <text class="action-icon">💎</text>
          <text class="action-text">充值</text>
        </view>
        <view class="action-btn withdraw" @click="goWithdraw">
          <text class="action-icon">💸</text>
          <text class="action-text">提现</text>
        </view>
      </view>
    </view>

    <view class="stats-section">
      <view class="section-title">今日概览</view>
      <view class="stats-row">
        <view class="stat-card income" @click="goIncomeRecords">
          <view class="stat-header">
            <text class="stat-icon">📈</text>
            <text class="stat-label">今日收入</text>
          </view>
          <text class="stat-value income">+{{ formatBalance(todayIncome) }}</text>
        </view>
        <view class="stat-card expense" @click="goExpenseRecords">
          <view class="stat-header">
            <text class="stat-icon">📉</text>
            <text class="stat-label">今日支出</text>
          </view>
          <text class="stat-value expense">-{{ formatBalance(todayExpense) }}</text>
        </view>
      </view>
      <view class="stats-row">
        <view class="stat-card" @click="goWithdrawRecords">
          <view class="stat-header">
            <text class="stat-icon">💳</text>
            <text class="stat-label">累计提现</text>
          </view>
          <text class="stat-value">{{ formatBalance(totalWithdraw) }}</text>
        </view>
        <view class="stat-card" @click="goIncomeRecords">
          <view class="stat-header">
            <text class="stat-icon">💵</text>
            <text class="stat-label">累计收入</text>
          </view>
          <text class="stat-value income">+{{ formatBalance(grossIncome) }}</text>
        </view>
      </view>
    </view>

    <view class="menu-section">
      <view class="menu-group">
        <view class="menu-title">交易记录</view>
        <view class="menu-item" @click="goIncomeRecords">
          <text class="menu-icon">📈</text>
          <text class="menu-text">收入记录</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goExpenseRecords">
          <text class="menu-icon">📉</text>
          <text class="menu-text">支出记录</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goWithdrawRecords">
          <text class="menu-icon">💳</text>
          <text class="menu-text">提现记录</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="breakdown-mask" v-if="showBreakdown" @click="showBreakdown = false">
      <view class="breakdown-sheet" @click.stop>
        <view class="breakdown-header">
          <text class="breakdown-title">收入来源构成</text>
          <text class="breakdown-close" @click="showBreakdown = false">×</text>
        </view>
        <view class="breakdown-total">
          <text class="label">收入合计</text>
          <text class="num">{{ formatBalance(grossIncome) }} 金币</text>
        </view>
        <view class="breakdown-list">
          <view class="breakdown-item" v-for="item in assetSources" :key="item.name">
            <text class="item-icon" :style="{ background: item.bgColor }">{{ item.icon }}</text>
            <view class="item-info">
              <text class="item-name">{{ item.name }}</text>
              <text class="item-bar"><i :style="{ width: item.percent + '%' }"></i></text>
            </view>
            <view class="item-right">
              <text class="item-amount">{{ formatBalance(item.amount) }}</text>
              <text class="item-percent">{{ item.percent }}%</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import walletService from '../services/walletService'
import { isLoggedIn } from '@/common/common'
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
    toast.error('请先登录')
    router.replace('/login')
    return
  }
  await fetchWallet()
})

// 返回钱包页（充值/提现后）静默刷新余额，未登录时保持原跳转逻辑
const refreshOnShow = () => {
  if (isLoggedIn()) fetchWallet()
}
// 首次 onShow 由 onMounted 首载，后续 onShow（返回本页）才静默刷新
let __firstShow = true
onShow(() => {
  if (__firstShow) {
    __firstShow = false
    return
  }
  refreshOnShow()
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
  /* 铺满后改为直角，与页面其他全宽卡片一致 */
  border-radius: 0px;
  padding: 10px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  height: 140px;
  /* 负 margin 抵消 .balance-section 的 20px padding，水平铺满页面限制框 */
  margin: 0 -20px;
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
  padding: 10px 0;
  /* 负 margin 抵消 .balance-section 的 20px padding，与资产卡同宽铺满 */
  margin: 10px -20px 10px;
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
  /* 负 margin 抵消 .menu-section 的 20px padding，水平铺满页面限制框 */
  margin: 0 -20px;
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
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.breakdown-sheet {
  width: min(90vw, 420px);
  background: #fff;
  border-radius: 16px;
  padding: 20px 20px 28px;
  max-height: 80vh;
  overflow-y: auto;
  animation: modal-pop 0.25s ease;
  -webkit-overflow-scrolling: touch;
}

@keyframes modal-pop {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
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
