<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">收入明细</text>
      <text class="total">今日 +{{ formatAmount(totalIncome) }} 金币</text>
    </template>

  <view class="summary-card">
    <view class="summary-item">
      <text class="summary-label">收入总额</text>
      <text class="summary-value income">+{{ formatAmount(totalIncome) }} 金币</text>
    </view>
      <view class="summary-divider"></view>
      <view class="summary-item">
        <text class="summary-label">收入笔数</text>
        <text class="summary-value">{{ records.length }} 笔</text>
      </view>
    </view>

    <view class="records-list">
      <view class="record-card" v-for="(item, idx) in records" :key="idx">
        <view class="record-icon-wrap" :style="{ background: item.bgColor }">
          <text class="record-icon">{{ item.icon }}</text>
        </view>
        <view class="record-info">
          <text class="record-title">{{ item.title }}</text>
          <text class="record-desc">{{ item.desc }}</text>
          <text class="record-time">{{ item.time }}</text>
        </view>
        <text class="record-amount income">+{{ formatAmount(item.amount) }} 金币</text>
      </view>
    </view>

    <EmptyState v-if="records.length === 0" icon="💰" text="暂无收入记录" />
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import EmptyState from '../components/EmptyState.vue'
import walletService from '../services/walletService'
import { isLoggedIn } from '@/common/common'
import { toast } from '../composables/useToast'

const router = useRouter()

const records = ref([])

const totalIncome = computed(() => {
  return records.value.reduce((sum, r) => sum + Number(r.amount || 0), 0)
})

const formatAmount = (val) => {
  return (val || 0).toFixed(2)
}

const fetchRecords = async () => {
  try {
    const res = await walletService.getIncomeRecords()
    const data = res.data || res
    records.value = data.list || []
  } catch (err) {
    console.error('获取收入明细失败:', err)
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

// 返回收入明细页时静默刷新；未登录时保持原跳转逻辑
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

.total {
  font-size: 15px;
  color: #10b981;
  font-weight: 600;
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

.record-amount.income {
  color: #10b981;
}
</style>
