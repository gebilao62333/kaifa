<template>
  <PageLayout>
    <template #nav>
      <span class="back-btn" @click="goBack">←</span>
      <span class="nav-title">提现明细</span>
      <span class="total">累计 {{ formatAmount(totalWithdraw) }} 金币</span>
    </template>

    <div class="summary-card">
      <div class="summary-item">
        <span class="summary-label">累计提现</span>
        <span class="summary-value">{{ formatAmount(totalWithdraw) }}</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-label">提现次数</span>
        <span class="summary-value">{{ records.length }} 次</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-label">可提现余额</span>
        <span class="summary-value withdraw">{{ formatAmount(balance) }}</span>
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
        <div class="record-status-wrap">
          <span class="record-amount">-{{ formatAmount(item.amount) }}</span>
          <span :class="['record-status', item.status]">{{ item.status === 'success' ? '已到账' : '处理中' }}</span>
        </div>
      </div>
    </div>

    <EmptyState v-if="records.length === 0" icon="🏦" text="暂无提现记录" />
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
const balance = ref(0)

// 可提现余额（来自钱包总览的总资产）
const totalWithdraw = computed(() =>
  records.value.reduce((sum, r) => sum + Number(r.amount || 0), 0)
)

// 渠道映射：1 支付宝 / 2 微信 / 3 银行卡
const CHANNEL_META = {
  1: { icon: '💰', title: '提现到支付宝', bgColor: 'linear-gradient(135deg, #1677ff, #4096ff)' },
  2: { icon: '💚', title: '提现到微信', bgColor: 'linear-gradient(135deg, #07c160, #10ad19)' },
  3: { icon: '🏦', title: '提现到银行卡', bgColor: 'linear-gradient(135deg, #43e97b, #38f9d7)' }
}

const maskAccount = (acc) => {
  if (!acc) return ''
  if (acc.includes('@')) {
    const [name, domain] = acc.split('@')
    return `${name.slice(0, 1)}***@${domain}`
  }
  return acc.length > 4 ? `尾号${acc.slice(-4)}` : acc
}

const formatTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const mapRecord = (r) => {
  const meta = CHANNEL_META[r.type] || { icon: '💸', title: '钱包提现', bgColor: 'linear-gradient(135deg, #fa709a, #fee140)' }
  return {
    id: r.id,
    icon: meta.icon,
    title: meta.title,
    desc: maskAccount(r.account) || '钱包提现',
    time: formatTime(r.createTime),
    amount: Number(r.amount || 0),
    status: r.status === 'success' || r.status === 'approved' ? 'success' : 'pending',
    bgColor: meta.bgColor
  }
}

const formatAmount = (val) => {
  return Number(val || 0).toFixed(2)
}

const fetchRecords = async () => {
  try {
    const res = await walletService.getWithdrawRecords()
    const list = res.data || res || []
    records.value = (Array.isArray(list) ? list : []).map(mapRecord)
  } catch (err) {
    console.error('获取提现记录失败:', err)
  }
  try {
    const res = await walletService.getOverview()
    const data = res.data || res
    balance.value = data.totalAssets || 0
  } catch (err) {
    console.error('获取可提现余额失败:', err)
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
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.summary-card {
  display: flex;
  align-items: center;
  background: #fff;
  margin: 12px 0 0;
  padding: 20px;
  border-radius: 0px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.summary-value.withdraw {
  color: var(--color-primary);
}

.summary-divider {
  width: 1px;
  height: 40px;
  background: #f0f0f0;
  margin: 0 12px;
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
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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

.record-status-wrap {
  text-align: right;
  margin-left: 12px;
  flex-shrink: 0;
}

.record-amount {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  display: block;
}

.record-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 8px;
  display: inline-block;
  margin-top: 4px;
}

.record-status.success {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.record-status.pending {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}
</style>
