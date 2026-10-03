<template>
  <div class="admin-dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info"><div class="stat-value">{{ stats.userCount || '--' }}</div><div class="stat-label">注册用户</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info"><div class="stat-value">{{ stats.orderCount || '--' }}</div><div class="stat-label">今日订单</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info"><div class="stat-value">¥{{ stats.todayIncome || '--' }}</div><div class="stat-label">今日收入</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-info"><div class="stat-value">¥{{ stats.totalIncome || '--' }}</div><div class="stat-label">总收入</div></div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <h3>用户增长趋势</h3>
        <div class="chart-placeholder">📊 用户增长曲线图</div>
      </div>
      <div class="chart-card">
        <h3>收入趋势</h3>
        <div class="chart-placeholder">📈 收入增长曲线图</div>
      </div>
    </div>

    <div class="recent-section">
      <h3>最新订单</h3>
      <table class="data-table" v-if="recentOrders.length">
        <thead><tr><th>订单号</th><th>用户</th><th>金额</th><th>状态</th><th>时间</th></tr></thead>
        <tbody>
          <tr v-for="order in recentOrders.slice(0, 10)" :key="order.id">
            <td>{{ order.orderNo || order.id }}</td>
            <td>{{ order.userId }}</td>
            <td>¥{{ order.amount }}</td>
            <td><span :class="['status-badge', getStatusClass(order.status)]">{{ getStatusText(order.status) }}</span></td>
            <td>{{ formatTime(order.createTime) }}</td>
          </tr>
        </tbody>
      </table>
      <div class="empty-hint" v-else>暂无数据</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import adminService from '../../services/adminService'
import { useToast } from '../../composables/useToast'
const toast = useToast()
const router = useRouter()

const stats = ref({})
const recentOrders = ref([])

const token = () => localStorage.getItem('admin_token')

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString()
}

const getStatusText = (status) => {
  const map = { 0: '待付款', 1: '进行中', 2: '已完成', 3: '已取消' }
  return map[status] || '未知'
}

const getStatusClass = (status) => {
  const map = { 0: 'pending', 1: 'active', 2: 'success', 3: 'cancelled' }
  return map[status] || 'pending'
}

const handleAuth = () => {
  localStorage.removeItem('admin_token')
  // 使用 window.location 跳转更可靠（不依赖 vue-router 上下文）
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/admin/'
  setTimeout(() => {
    window.location.href = base + 'login'
  }, 300)
}

const loadStats = async () => {
  try {
    const t = token()
    if (!t) { handleAuth(); return }
    const result = await adminService.getDashboardStats()
    const d = result.data || {}
    // 映射后端字段到前端模板期望的字段名
    stats.value = {
      userCount: d.totalUsers,
      orderCount: d.todayOrders,
      todayIncome: d.todayIncome || 0,
      totalIncome: d.totalIncome || 0
    }
  } catch (err) {
    // request() 在 401/403 时已自动跳转登录页，这里保持原有兜底
    if (err && (err.status === 401 || err.status === 403)) { handleAuth(); return }
    toast.error('加载统计数据失败')
  }
}

const loadRecentOrders = async () => {
  try {
    const t = token()
    if (!t) { handleAuth(); return }
    const result = await adminService.getOrders({ page: 1, pageSize: 10 })
    recentOrders.value = result.data.list || result.data || []
  } catch (err) {
    // request() 在 401/403 时已自动跳转登录页，这里保持原有兜底
    if (err && (err.status === 401 || err.status === 403)) { handleAuth(); return }
    toast.error('加载订单失败')
  }
}

onMounted(async () => {
  await Promise.all([loadStats(), loadRecentOrders()])
})
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
.stat-card { background: #fff; border-radius: 8px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.stat-icon { font-size: 36px; }
.stat-value { font-size: 24px; font-weight: 700; color: #333; }
.stat-label { font-size: 13px; color: #999; margin-top: 4px; }
.charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin-bottom: 20px; }
.chart-card { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.chart-card h3 { font-size: 15px; color: #333; margin-bottom: 12px; }
.chart-placeholder { height: 200px; display: flex; align-items: center; justify-content: center; color: #999; background: #fafafa; border-radius: 6px; font-size: 14px; }
.recent-section { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.recent-section h3 { font-size: 15px; color: #333; margin-bottom: 12px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { text-align: left; padding: 10px 8px; border-bottom: 2px solid #f0f0f0; color: #666; font-weight: 600; }
.data-table td { padding: 10px 8px; border-bottom: 1px solid #f0f0f0; color: #333; }
.status-badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-badge.pending { background: #fff7e6; color: #fa8c16; }
.status-badge.active { background: #e6f7ff; color: #1890ff; }
.status-badge.success { background: #f6ffed; color: #52c41a; }
.status-badge.cancelled { background: #fff1f0; color: #ff4d4f; }
.empty-hint { text-align: center; color: #999; padding: 20px; }
</style>
