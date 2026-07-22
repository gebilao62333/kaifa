<template>
  <PageLayout>
    <template #nav>
      <span class="back-btn" @click="goBack">←</span>
      <span class="nav-title">收入明细</span>
      <span class="total">今日 +{{ formatAmount(totalIncome) }} 金币</span>
    </template>

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

    <EmptyState v-if="records.length === 0" icon="💰" text="暂无收入记录" />
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
