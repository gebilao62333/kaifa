<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1 class="dashboard-title">服务概览</h1>
      <div class="header-actions">
        <button class="btn btn-refresh" @click="refreshData">
          <span class="btn-icon">🔄</span> 刷新
        </button>
        <button class="btn btn-primary" @click="goToCreate">
          <span class="btn-icon">➕</span> 新建服务
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card" v-for="(stat, index) in statsData" :key="index" :class="stat.type">
        <div class="stat-icon">{{ stat.icon }}</div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
        <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'" v-if="stat.trend !== undefined">
          {{ stat.trend > 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}%
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="content-row">
        <div class="card service-status-card">
          <div class="card-header">
            <h3 class="card-title">服务状态分布</h3>
          </div>
          <div class="card-body">
            <div class="status-chart">
              <div class="status-item" v-for="(item, index) in statusDistribution" :key="index">
                <div class="status-color" :style="{ background: item.color }"></div>
                <div class="status-info">
                  <span class="status-name">{{ item.name }}</span>
                  <span class="status-count">{{ item.count }}</span>
                </div>
                <div class="status-percent">{{ item.percent }}%</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card resource-usage-card">
          <div class="card-header">
            <h3 class="card-title">资源使用情况</h3>
            <div class="card-actions">
              <select v-model="selectedResource" class="resource-select">
                <option value="cpu">CPU</option>
                <option value="memory">内存</option>
                <option value="disk">磁盘</option>
                <option value="network">网络</option>
              </select>
            </div>
          </div>
          <div class="card-body">
            <div class="resource-chart">
              <div class="resource-bar-container">
                <div class="resource-label">使用率</div>
                <div class="resource-bar-wrapper">
                  <div class="resource-bar" :style="{ width: resourceUsage + '%', background: resourceColor }"></div>
                </div>
                <div class="resource-value">{{ resourceUsage }}%</div>
              </div>
            </div>
            <div class="resource-details">
              <div class="resource-detail-item">
                <span class="detail-label">已使用</span>
                <span class="detail-value">{{ resourceUsed }}</span>
              </div>
              <div class="resource-detail-item">
                <span class="detail-label">总计</span>
                <span class="detail-value">{{ resourceTotal }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="content-row">
        <div class="card recent-alerts-card">
          <div class="card-header">
            <h3 class="card-title">最近告警</h3>
            <span class="badge badge-warning" v-if="alerts.length > 0">{{ alerts.length }}</span>
          </div>
          <div class="card-body">
            <div class="alert-list" v-if="alerts.length > 0">
              <div class="alert-item" v-for="(alert, index) in alerts" :key="index" :class="'alert-' + alert.level">
                <div class="alert-icon">{{ alert.level === 'critical' ? '🔴' : alert.level === 'warning' ? '🟡' : '🔵' }}</div>
                <div class="alert-content">
                  <div class="alert-message">{{ alert.message }}</div>
                  <div class="alert-time">{{ alert.time }}</div>
                </div>
                <button class="alert-action" @click="handleAlert(alert)">处理</button>
              </div>
            </div>
            <div class="empty-state" v-else>
              <div class="empty-icon">✅</div>
              <div class="empty-text">暂无告警信息</div>
            </div>
          </div>
        </div>

        <div class="card recent-deployments-card">
          <div class="card-header">
            <h3 class="card-title">最近部署</h3>
            <button class="btn-link" @click="goToDeployments">查看全部 →</button>
          </div>
          <div class="card-body">
            <div class="deployment-list" v-if="recentDeployments.length > 0">
              <div class="deployment-item" v-for="(deploy, index) in recentDeployments" :key="index">
                <div class="deployment-info">
                  <div class="deployment-name">{{ deploy.serviceName }}</div>
                  <div class="deployment-version">v{{ deploy.version }}</div>
                </div>
                <div class="deployment-status" :class="'status-' + deploy.status">
                  {{ deploy.statusText }}
                </div>
                <div class="deployment-time">{{ deploy.time }}</div>
              </div>
            </div>
            <div class="empty-state" v-else>
              <div class="empty-icon">📦</div>
              <div class="empty-text">暂无部署记录</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card quick-actions-card">
        <div class="card-header">
          <h3 class="card-title">快捷操作</h3>
        </div>
        <div class="card-body">
          <div class="quick-actions-grid">
            <button class="quick-action-btn" @click="goToServiceList">
              <div class="action-icon">📋</div>
              <div class="action-text">服务列表</div>
            </button>
            <button class="quick-action-btn" @click="goToMonitor">
              <div class="action-icon">📊</div>
              <div class="action-text">监控面板</div>
            </button>
            <button class="quick-action-btn" @click="goToLogs">
              <div class="action-icon">📝</div>
              <div class="action-text">日志查询</div>
            </button>
            <button class="quick-action-btn" @click="goToSettings">
              <div class="action-icon">⚙️</div>
              <div class="action-text">系统设置</div>
            </button>
            <button class="quick-action-btn" @click="refreshAllServices">
              <div class="action-icon">🔄</div>
              <div class="action-text">刷新全部</div>
            </button>
            <button class="quick-action-btn" @click="batchRestart">
              <div class="action-icon">⏻</div>
              <div class="action-text">批量重启</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const selectedResource = ref('cpu')

const statsData = ref([
  { label: '总服务数', value: 12, icon: '🖥️', type: 'primary', trend: 5 },
  { label: '运行中', value: 9, icon: '✅', type: 'success', trend: 2 },
  { label: '已停止', value: 2, icon: '⏹️', type: 'default' },
  { label: '异常', value: 1, icon: '⚠️', type: 'danger', trend: -1 }
])

const statusDistribution = ref([
  { name: '运行中', count: 9, percent: 75, color: '#52c41a' },
  { name: '已停止', count: 2, percent: 17, color: '#d9d9d9' },
  { name: '异常', count: 1, percent: 8, color: '#ff4d4f' }
])

const resourceUsage = computed(() => {
  const usage = { cpu: 45, memory: 62, disk: 38, network: 28 }
  return usage[selectedResource.value]
})

const resourceColor = computed(() => {
  const color = { cpu: '#1890ff', memory: '#722ed1', disk: '#13c2c2', network: '#faad14' }
  return color[selectedResource.value]
})

const resourceUsed = computed(() => {
  const used = { cpu: '45%', memory: '8.2 GB', disk: '156 GB', network: '2.8 MB/s' }
  return used[selectedResource.value]
})

const resourceTotal = computed(() => {
  const total = { cpu: '100%', memory: '16 GB', disk: '500 GB', network: '100 MB/s' }
  return total[selectedResource.value]
})

const alerts = ref([
  { id: 1, level: 'critical', message: '服务响应时间超过阈值', time: '2分钟前', serviceId: 1 },
  { id: 2, level: 'warning', message: '内存使用率超过80%', time: '15分钟前', serviceId: 2 }
])

const recentDeployments = ref([
  { serviceName: '虚拟用户服务', version: '1.2.3', status: 'success', statusText: '成功', time: '10:30' },
  { serviceName: '用户认证服务', version: '2.1.0', status: 'success', statusText: '成功', time: '09:15' },
  { serviceName: '消息推送服务', version: '1.5.2', status: 'failed', statusText: '失败', time: '昨天' }
])

const refreshData = () => {
  console.log('刷新数据...')
}

const goToCreate = () => {
  router.push('/project/create')
}

const goToServiceList = () => {
  router.push('/project/list')
}

const goToDeployments = () => {
  router.push('/project/deployments')
}

const goToMonitor = () => {
  router.push('/project/monitor')
}

const goToLogs = () => {
  router.push('/project/logs')
}

const goToSettings = () => {
  router.push('/project/settings')
}

const handleAlert = (alert) => {
  router.push(`/project/${alert.serviceId}`)
}

const refreshAllServices = () => {
  console.log('刷新全部服务...')
}

const batchRestart = () => {
  console.log('批量重启...')
}

onMounted(() => {
  console.log('Dashboard mounted')
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: #f0f2f5;
  padding: 24px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.dashboard-title {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.btn-primary {
  background: #1890ff;
  color: #fff;
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-refresh {
  background: #fff;
  color: #595959;
  border: 1px solid #d9d9d9;
}

.btn-refresh:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.btn-icon {
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f5f5f5;
}

.stat-card.primary .stat-icon { background: #e6f7ff; }
.stat-card.success .stat-icon { background: #f6ffed; }
.stat-card.danger .stat-icon { background: #fff2f0; }
.stat-card.warning .stat-icon { background: #fffbe6; }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #262626;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
  margin-top: 4px;
}

.stat-trend {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.stat-trend.up {
  background: #f6ffed;
  color: #52c41a;
}

.stat-trend.down {
  background: #fff2f0;
  color: #ff4d4f;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.content-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

.card-body {
  padding: 20px;
}

.status-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.status-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
}

.status-name {
  color: #595959;
}

.status-count {
  font-weight: 600;
  color: #262626;
}

.status-percent {
  color: #8c8c8c;
  font-size: 14px;
  width: 50px;
  text-align: right;
}

.resource-select {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  color: #595959;
  cursor: pointer;
}

.resource-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.resource-label {
  font-size: 14px;
  color: #8c8c8c;
  width: 50px;
}

.resource-bar-wrapper {
  flex: 1;
  height: 24px;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
}

.resource-bar {
  height: 100%;
  border-radius: 12px;
  transition: width 0.5s ease;
}

.resource-value {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  width: 60px;
  text-align: right;
}

.resource-details {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.resource-detail-item {
  display: flex;
  gap: 8px;
}

.detail-label {
  color: #8c8c8c;
}

.detail-value {
  font-weight: 500;
  color: #262626;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  background: #fafafa;
}

.alert-critical {
  background: #fff2f0;
}

.alert-warning {
  background: #fffbe6;
}

.alert-icon {
  font-size: 18px;
}

.alert-content {
  flex: 1;
}

.alert-message {
  font-size: 14px;
  color: #262626;
}

.alert-time {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
}

.alert-action {
  padding: 4px 12px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.badge-warning {
  background: #fffbe6;
  color: #faad14;
}

.deployment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.deployment-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}

.deployment-info {
  flex: 1;
}

.deployment-name {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.deployment-version {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

.deployment-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 12px;
}

.status-success {
  background: #f6ffed;
  color: #52c41a;
}

.status-failed {
  background: #fff2f0;
  color: #ff4d4f;
}

.deployment-time {
  font-size: 12px;
  color: #8c8c8c;
}

.btn-link {
  background: none;
  border: none;
  color: #1890ff;
  font-size: 14px;
  cursor: pointer;
}

.btn-link:hover {
  color: #40a9ff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  color: #8c8c8c;
  font-size: 14px;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-action-btn:hover {
  border-color: #1890ff;
  background: #e6f7ff;
}

.action-icon {
  font-size: 28px;
}

.action-text {
  font-size: 14px;
  color: #595959;
}

.quick-action-btn:hover .action-text {
  color: #1890ff;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .content-row {
    grid-template-columns: 1fr;
  }
  .quick-actions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
