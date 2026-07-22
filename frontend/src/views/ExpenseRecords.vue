<template>
  <PageLayout>
    <template #nav>
      <span class="back-btn" @click="goBack">←</span>
      <span class="nav-title">支出明细</span>
      <span class="total expense">今日 -{{ formatAmount(todayExpense) }} 金币</span>
    </template>

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
      <div class="record-card" v-for="item in records" :key="item.id">
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

    <EmptyState v-if="records.length === 0" icon="💸" text="暂无支出记录" />
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
