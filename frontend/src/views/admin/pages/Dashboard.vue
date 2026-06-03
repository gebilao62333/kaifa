<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalUsers.toLocaleString() }}</div>
          <div class="stat-label">注册用户</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.todayOrders.toLocaleString() }}</div>
          <div class="stat-label">今日订单</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.todayRevenue.toLocaleString() }} 金币</div>
          <div class="stat-label">今日收入</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💬</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.todayMessages.toLocaleString() }}</div>
          <div class="stat-label">今日消息</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚠️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pendingReports.toLocaleString() }}</div>
          <div class="stat-label">待处理举报</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()

const stats = ref({
  totalUsers: 0,
  todayOrders: 0,
  todayRevenue: 0,
  todayMessages: 0,
  pendingReports: 0
})

const loadDashboard = async () => {
  try {
    const res = await apiGet('/api/admin/dashboard')
    if (res.code === 200 && res.data) {
      stats.value = {
        totalUsers: res.data.totalUsers || 0,
        todayOrders: res.data.todayOrders || 0,
        todayRevenue: res.data.todayRevenue || 0,
        todayMessages: res.data.todayMessages || 0,
        pendingReports: res.data.pendingReports || 0
      }
    }
  } catch (err) {
    console.error('加载仪表板数据失败:', err)
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 48px;
  line-height: 1;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}
</style>
