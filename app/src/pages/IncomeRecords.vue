<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">收入明细</text>
      <text class="total">今日 +{{ formatAmount(todayIncome) }} 金币</text>
    </template>

  <view class="summary-card">
    <view class="summary-item">
      <text class="summary-label">收入总额</text>
      <text class="summary-value income">+{{ formatAmount(totalIncome) }} 金币</text>
    </view>
      <view class="summary-divider"></view>
      <view class="summary-item">
        <text class="summary-label">收入笔数</text>
        <text class="summary-value">{{ totalCount }} 笔</text>
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

    <EmptyState v-if="records.length === 0 && !loading" icon="💰" text="暂无收入记录" />

    <view class="load-more" v-if="loadingMore">加载中...</view>
    <view class="load-more" v-else-if="hasMore" @click="loadMore">加载更多</view>
    <view class="load-more no-more" v-else-if="records.length > 0">没有更多了</view>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onReachBottom, onShow } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import EmptyState from '../components/EmptyState.vue'
import walletService from '../services/walletService'
import { isLoggedIn } from '@/common/common'
import { toast } from '../composables/useToast'

const router = useRouter()

// P2-5：明细改为 page/pageSize 分页 + 触底加载，避免历史记录多时只看到最近 50 条
const PAGE_SIZE = 20

const records = ref([])
const totalIncome = ref(0)
const todayIncome = ref(0)
const totalCount = ref(0)
const currentPage = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const loadingMore = ref(false)

const formatAmount = (val) => {
  return Number(val || 0).toFixed(2)
}

// 汇总数字取钱包总览（累计收入/今日收入），不能用当前页记录累加，否则翻页前后会跳变
const loadOverview = async () => {
  try {
    const res = await walletService.getOverview()
    const data = res.data || res || {}
    totalIncome.value = Number(data.grossIncome) || 0
    todayIncome.value = Number(data.todayIncome) || 0
  } catch (err) {
    console.error('获取收入汇总失败:', err)
  }
}

const loadPage = async (reset = false) => {
  const targetPage = reset ? 1 : currentPage.value
  if (reset) {
    if (loading.value) return
    loading.value = true
  } else {
    if (loadingMore.value || !hasMore.value) return
    loadingMore.value = true
  }
  try {
    const res = await walletService.getIncomeRecords({ page: targetPage, pageSize: PAGE_SIZE })
    const data = res.data || res || {}
    const list = Array.isArray(data.list) ? data.list : []
    records.value = reset ? list : records.value.concat(list)
    const total = Number(data.total)
    totalCount.value = Number.isFinite(total) ? total : records.value.length
    hasMore.value = Number.isFinite(total) ? records.value.length < total : list.length >= PAGE_SIZE
    currentPage.value = targetPage + 1
  } catch (err) {
    console.error('获取收入明细失败:', err)
    if (reset) toast.error(err && err.message ? err.message : '加载收入明细失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  loadPage()
}

onMounted(async () => {
  if (!isLoggedIn()) {
    toast.error('请先登录')
    router.replace('/login')
    return
  }
  // 汇总与第一页并行；汇总失败不影响明细展示
  await Promise.all([loadOverview(), loadPage(true)])
})

// 返回收入明细页时静默刷新；未登录时保持原跳转逻辑
const refreshOnShow = () => {
  if (!isLoggedIn()) return
  loadOverview()
  loadPage(true)
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

// H5/App 触底加载；同时保留「加载更多」按钮兜底
onReachBottom(() => {
  loadMore()
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
.load-more {
  text-align: center;
  padding: 16px;
  color: var(--color-primary);
  font-size: 14px;
  cursor: pointer;
}

.load-more.no-more {
  color: #ccc;
  cursor: default;
}
</style>
