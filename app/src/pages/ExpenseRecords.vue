<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">支出明细</text>
      <text class="total expense">今日 -{{ formatAmount(todayExpense) }} 金币</text>
    </template>

  <view class="summary-card">
    <view class="summary-item">
      <text class="summary-label">支出总额</text>
      <text class="summary-value expense">-{{ formatAmount(totalExpense) }} 金币</text>
    </view>
      <view class="summary-divider"></view>
      <view class="summary-item">
        <text class="summary-label">支出笔数</text>
        <text class="summary-value">{{ records.length }} 笔</text>
      </view>
    </view>

    <view class="records-list">
      <view class="record-card" v-for="item in records" :key="item.id">
        <view class="record-icon-wrap" :style="{ background: item.bgColor }">
          <text class="record-icon">{{ item.icon }}</text>
        </view>
        <view class="record-info">
          <text class="record-title">{{ item.title }}</text>
          <text class="record-desc">{{ item.desc }}</text>
          <text class="record-time">{{ item.time }}</text>
        </view>
        <text class="record-amount expense">-{{ formatAmount(item.amount) }} 金币</text>
      </view>
    </view>

    <EmptyState v-if="records.length === 0" icon="💸" text="暂无支出记录" />
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import EmptyState from '../components/EmptyState.vue'
import walletService from '../services/walletService'
import { isLoggedIn } from '@/common/common'
import { toast } from '../composables/useToast'

const router = useRouter()

const records = ref([])
const totalExpense = ref(0)
const todayExpense = ref(0)

const formatAmount = (val) => {
  return Number(val || 0).toFixed(2)
}

const fetchRecords = async () => {
  try {
    const res = await walletService.getExpenseRecords()
    const data = res.data || res || {}
    records.value = Array.isArray(data.list) ? data.list : []
    totalExpense.value = data.totalExpense || 0
    todayExpense.value = data.todayExpense || 0
  } catch (err) {
    console.error('获取支出记录失败:', err)
  }
}

onMounted(async () => {
  if (!isLoggedIn()) {
    toast.error('请先登录')
    router.replace('/login')
    return
  }
  await fetchRecords()
})

// 返回支出明细页时静默刷新；未登录时保持原跳转逻辑
const refreshOnShow = () => {
  if (isLoggedIn()) fetchRecords()
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

const goBack = () => {
  router.back()
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
  color: white;
}

.total.expense {
  color: #ef4444;
  font-weight: 600;
  font-size: 15px;
}

.summary-card {
  display: flex;
  align-items: center;
  background: #fff;
  margin: 12px 0 0;
  padding: 20px;
  border-radius: 0px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
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

.summary-value.expense {
  color: #ef4444;
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
  border-radius: 0px;
  padding: 16px 20px;
  margin: 12px 20px 0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
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

.record-amount.expense {
  color: #ef4444;
}
</style>
