<template>
  <div class="service-detail-container">
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          <span>←</span> 返回
        </button>
        <div class="service-title">
          <h1 class="page-title">{{ serviceInfo.name }}</h1>
          <span class="status-tag" :class="'status-' + serviceInfo.status">
            {{ getStatusText(serviceInfo.status) }}
          </span>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-default" @click="goToEdit">
          <span>✏️</span> 编辑
        </button>
        <button class="btn btn-default" v-if="serviceInfo.status !== 'running'" @click="handleAction('start')">
          <span>▶️</span> 启动
        </button>
        <button class="btn btn-default" v-if="serviceInfo.status === 'running'" @click="handleAction('stop')">
          <span>⏸️</span> 停止
        </button>
        <button class="btn btn-default" @click="handleAction('restart')">
          <span>🔄</span> 重启
        </button>
        <button class="btn btn-primary" @click="handleAction('deploy')">
          <span>🚀</span> 部署
        </button>
      </div>
    </div>

    <div class="detail-content">
      <div class="content-main">
        <div class="card basic-info-card">
          <div class="card-header">
            <h3 class="card-title">基本信息</h3>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <label class="info-label">服务ID</label>
                <div class="info-value">{{ serviceInfo.id }}</div>
              </div>
              <div class="info-item">
                <label class="info-label">服务名称</label>
                <div class="info-value">{{ serviceInfo.name }}</div>
              </div>
              <div class="info-item">
                <label class="info-label">服务标识</label>
                <div class="info-value code">{{ serviceInfo.code }}</div>
              </div>
              <div class="info-item">
                <label class="info-label">分类</label>
                <div class="info-value">{{ serviceInfo.category }}</div>
              </div>
              <div class="info-item">
                <label class="info-label">版本</label>
                <div class="info-value">{{ serviceInfo.version }}</div>
              </div>
              <div class="info-item">
                <label class="info-label">运行时长</label>
                <div class="info-value">{{ serviceInfo.uptime }}</div>
              </div>
              <div class="info-item">
                <label class="info-label">实例数</label>
                <div class="info-value">{{ serviceInfo.instances }} / {{ serviceInfo.maxInstances }}</div>
              </div>
              <div class="info-item">
                <label class="info-label">创建时间</label>
                <div class="info-value">{{ serviceInfo.createTime }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card config-card">
          <div class="card-header">
            <h3 class="card-title">配置参数</h3>
            <button class="btn-link" @click="showConfigEditor = true">编辑配置</button>
          </div>
          <div class="card-body">
            <div class="config-list">
              <div class="config-item" v-for="(config, key) in serviceConfig" :key="key">
                <div class="config-key">{{ key }}</div>
                <div class="config-value">{{ config }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card dependencies-card">
          <div class="card-header">
            <h3 class="card-title">依赖关系</h3>
          </div>
          <div class="card-body">
            <div class="dependencies-graph" v-if="dependencies.length > 0">
              <div class="dependency-node main-node">
                <div class="node-icon">🔵</div>
                <div class="node-name">{{ serviceInfo.name }}</div>
              </div>
              <div class="dependency-relations">
                <div class="dependency-item" v-for="(dep, index) in dependencies" :key="index">
                  <div class="relation-line">→</div>
                  <div class="dependency-node" :class="{ 'node-error': dep.status === 'error' }">
                    <div class="node-icon">{{ dep.type === 'required' ? '🔴' : '🟡' }}</div>
                    <div class="node-name">{{ dep.name }}</div>
                    <span class="node-status" :class="'status-' + dep.status">{{ dep.status }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="empty-state" v-else>
              <div class="empty-icon">📦</div>
              <div class="empty-text">暂无依赖服务</div>
            </div>
          </div>
        </div>

        <div class="card deployment-history-card">
          <div class="card-header">
            <h3 class="card-title">部署历史</h3>
            <button class="btn-link" @click="goToAllDeployments">查看全部 →</button>
          </div>
          <div class="card-body">
            <div class="deployment-timeline" v-if="deploymentHistory.length > 0">
              <div class="timeline-item" v-for="(deploy, index) in deploymentHistory" :key="index">
                <div class="timeline-marker" :class="'marker-' + deploy.status"></div>
                <div class="timeline-content">
                  <div class="deploy-header">
                    <span class="deploy-version">v{{ deploy.version }}</span>
                    <span class="deploy-status" :class="'status-' + deploy.status">
                      {{ getDeployStatusText(deploy.status) }}
                    </span>
                  </div>
                  <div class="deploy-info">
                    <span class="deploy-time">{{ deploy.time }}</span>
                    <span class="deploy-operator">操作人: {{ deploy.operator }}</span>
                  </div>
                  <div class="deploy-desc" v-if="deploy.description">{{ deploy.description }}</div>
                </div>
              </div>
            </div>
            <div class="empty-state" v-else>
              <div class="empty-icon">📦</div>
              <div class="empty-text">暂无部署记录</div>
            </div>
          </div>
        </div>
      </div>

      <div class="content-side">
        <div class="card monitor-card">
          <div class="card-header">
            <h3 class="card-title">实时监控</h3>
            <select v-model="monitorPeriod" class="period-select">
              <option value="1h">最近1小时</option>
              <option value="6h">最近6小时</option>
              <option value="24h">最近24小时</option>
              <option value="7d">最近7天</option>
            </select>
          </div>
          <div class="card-body">
            <div class="monitor-metrics">
              <div class="metric-item">
                <div class="metric-header">
                  <span class="metric-name">CPU 使用率</span>
                  <span class="metric-value" :style="{ color: getMetricColor(serviceMetrics.cpu) }">
                    {{ serviceMetrics.cpu }}%
                  </span>
                </div>
                <div class="metric-bar">
                  <div class="metric-fill" :style="{ width: serviceMetrics.cpu + '%', background: getMetricColor(serviceMetrics.cpu) }"></div>
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-header">
                  <span class="metric-name">内存使用</span>
                  <span class="metric-value" :style="{ color: getMetricColor(serviceMetrics.memory) }">
                    {{ serviceMetrics.memory }}%
                  </span>
                </div>
                <div class="metric-bar">
                  <div class="metric-fill" :style="{ width: serviceMetrics.memory + '%', background: getMetricColor(serviceMetrics.memory) }"></div>
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-header">
                  <span class="metric-name">磁盘 I/O</span>
                  <span class="metric-value">{{ serviceMetrics.diskIO }} MB/s</span>
                </div>
                <div class="metric-bar">
                  <div class="metric-fill" :style="{ width: serviceMetrics.diskIO / 100 * 100 + '%', background: '#1890ff' }"></div>
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-header">
                  <span class="metric-name">网络流量</span>
                  <span class="metric-value">{{ serviceMetrics.network }} KB/s</span>
                </div>
                <div class="metric-bar">
                  <div class="metric-fill" :style="{ width: serviceMetrics.network / 1000 * 100 + '%', background: '#722ed1' }"></div>
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-header">
                  <span class="metric-name">请求 QPS</span>
                  <span class="metric-value">{{ serviceMetrics.qps }}</span>
                </div>
                <div class="metric-bar">
                  <div class="metric-fill" :style="{ width: Math.min(serviceMetrics.qps / 1000 * 100, 100) + '%', background: '#13c2c2' }"></div>
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-header">
                  <span class="metric-name">响应时间</span>
                  <span class="metric-value">{{ serviceMetrics.responseTime }} ms</span>
                </div>
                <div class="metric-bar">
                  <div class="metric-fill" :style="{ width: Math.min(serviceMetrics.responseTime / 500 * 100, 100) + '%', background: '#faad14' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card logs-card">
          <div class="card-header">
            <h3 class="card-title">最近日志</h3>
            <button class="btn-link" @click="goToLogs">查看全部 →</button>
          </div>
          <div class="card-body">
            <div class="log-list">
              <div class="log-item" v-for="(log, index) in recentLogs" :key="index" :class="'log-' + log.level">
                <span class="log-time">{{ log.time }}</span>
                <span class="log-level">{{ log.level.toUpperCase() }}</span>
                <span class="log-message">{{ log.message }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card quick-actions-card">
          <div class="card-header">
            <h3 class="card-title">快捷操作</h3>
          </div>
          <div class="card-body">
            <div class="quick-actions">
              <button class="quick-action" @click="handleAction('restart')">
                <span>🔄</span> 重启服务
              </button>
              <button class="quick-action" @click="handleAction('deploy')">
                <span>🚀</span> 重新部署
              </button>
              <button class="quick-action" @click="goToLogs">
                <span>📝</span> 查看日志
              </button>
              <button class="quick-action" @click="exportConfig">
                <span>📤</span> 导出配置
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showActionModal" @click.self="showActionModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ actionTitle }}</h3>
          <button class="modal-close" @click="showActionModal = false">×</button>
        </div>
        <div class="modal-body">
          <p>{{ actionMessage }}</p>
          <div class="action-progress" v-if="actionInProgress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: actionProgress + '%' }"></div>
            </div>
            <div class="progress-text">{{ actionProgress }}%</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showActionModal = false" :disabled="actionInProgress">取消</button>
          <button class="btn btn-primary" @click="confirmAction" :disabled="actionInProgress">
            {{ actionInProgress ? '处理中...' : '确认' }}
          </button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showConfigEditor" @click.self="showConfigEditor = false">
      <div class="modal modal-large">
        <div class="modal-header">
          <h3 class="modal-title">编辑配置</h3>
          <button class="modal-close" @click="showConfigEditor = false">×</button>
        </div>
        <div class="modal-body">
          <div class="config-editor">
            <textarea v-model="configJson" class="config-textarea" rows="20"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showConfigEditor = false">取消</button>
          <button class="btn btn-primary" @click="saveConfig">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const serviceId = route.params.id
const monitorPeriod = ref('1h')
const showActionModal = ref(false)
const showConfigEditor = ref(false)
const currentAction = ref(null)
const actionInProgress = ref(false)
const actionProgress = ref(0)

const serviceInfo = ref({
  id: 1,
  name: '虚拟用户服务',
  code: 'virtual-user-service',
  category: '系统服务',
  version: '1.2.3',
  status: 'running',
  instances: 3,
  maxInstances: 5,
  uptime: '15天 6小时 32分钟',
  createTime: '2024-01-15 10:30:00'
})

const serviceConfig = ref({
  'maxConnections': 1000,
  'timeout': 30000,
  'retryCount': 3,
  'cacheEnabled': true,
  'logLevel': 'info',
  'aiModel': 'gpt-3.5-turbo',
  'maxContextLength': 50
})

const dependencies = ref([
  { name: '用户认证服务', type: 'required', status: 'running' },
  { name: 'Redis缓存', type: 'required', status: 'running' },
  { name: 'MySQL数据库', type: 'required', status: 'running' },
  { name: '消息队列', type: 'optional', status: 'warning' }
])

const deploymentHistory = ref([
  { version: '1.2.3', status: 'success', time: '2024-01-20 10:30:00', operator: '张三', description: '优化AI响应速度' },
  { version: '1.2.2', status: 'success', time: '2024-01-15 14:20:00', operator: '李四', description: '修复上下文丢失问题' },
  { version: '1.2.1', status: 'failed', time: '2024-01-10 09:15:00', operator: '张三', description: '版本回退' },
  { version: '1.2.0', status: 'success', time: '2024-01-08 16:45:00', operator: '王五', description: '新增DeepSeek支持' }
])

const serviceMetrics = ref({
  cpu: 35,
  memory: 58,
  diskIO: 45,
  network: 280,
  qps: 120,
  responseTime: 85
})

const recentLogs = ref([
  { time: '14:32:15', level: 'info', message: '收到用户消息: 你好' },
  { time: '14:32:16', level: 'info', message: 'AI响应生成完成，耗时 320ms' },
  { time: '14:32:18', level: 'info', message: '上下文已更新，当前长度: 45' },
  { time: '14:32:20', level: 'warn', message: '内存使用率较高: 75%' },
  { time: '14:32:25', level: 'error', message: '数据库连接超时，已重试' }
])

const configJson = computed({
  get: () => JSON.stringify(serviceConfig.value, null, 2),
  set: (val) => { try { serviceConfig.value = JSON.parse(val) } catch (e) {} }
})

const getStatusText = (status) => {
  const map = { running: '运行中', stopped: '已停止', error: '异常' }
  return map[status] || status
}

const getDeployStatusText = (status) => {
  const map = { success: '成功', failed: '失败', deploying: '部署中', rolledback: '已回退' }
  return map[status] || status
}

const getMetricColor = (value) => {
  if (value >= 80) return '#ff4d4f'
  if (value >= 60) return '#faad14'
  return '#52c41a'
}

const goBack = () => {
  router.push('/project/list')
}

const goToEdit = () => {
  router.push(`/project/edit/${serviceId}`)
}

const goToLogs = () => {
  router.push(`/project/${serviceId}/logs`)
}

const goToAllDeployments = () => {
  router.push(`/project/${serviceId}/deployments`)
}

const handleAction = (action) => {
  currentAction.value = action
  showActionModal.value = true
  actionInProgress.value = false
  actionProgress.value = 0
}

const actionTitle = computed(() => {
  const map = { start: '启动服务', stop: '停止服务', restart: '重启服务', deploy: '部署服务' }
  return map[currentAction.value] || '操作确认'
})

const actionMessage = computed(() => {
  const map = {
    start: '确定要启动该服务吗？',
    stop: '确定要停止该服务吗？停止后服务将无法访问。',
    restart: '确定要重启该服务吗？重启过程中服务将暂时不可用。',
    deploy: '确定要部署新版本吗？'
  }
  return map[currentAction.value] || '确定要执行此操作吗？'
})

const confirmAction = () => {
  actionInProgress.value = true
  let progress = 0
  const interval = setInterval(() => {
    progress += 10
    actionProgress.value = progress
    if (progress >= 100) {
      clearInterval(interval)
      setTimeout(() => {
        showActionModal.value = false
        actionInProgress.value = false
      }, 500)
    }
  }, 200)
}

const saveConfig = () => {
  console.log('Saving config:', serviceConfig.value)
  showConfigEditor.value = false
}

const exportConfig = () => {
  const blob = new Blob([JSON.stringify(serviceConfig.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${serviceInfo.value.code}-config.json`
  a.click()
}

onMounted(() => {
  console.log('Service detail mounted:', serviceId)
})
</script>

<style scoped>
.service-detail-container {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: #f0f2f5;
  padding: 24px;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #8c8c8c;
  font-size: 14px;
  cursor: pointer;
}

.btn-back:hover {
  color: #1890ff;
}

.service-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

.status-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.status-running { background: #f6ffed; color: #52c41a; }
.status-stopped { background: #f5f5f5; color: #8c8c8c; }
.status-error { background: #fff2f0; color: #ff4d4f; }

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

.btn-primary { background: #1890ff; color: #fff; }
.btn-primary:hover { background: #40a9ff; }
.btn-default { background: #fff; color: #595959; border: 1px solid #d9d9d9; }
.btn-default:hover { border-color: #1890ff; color: #1890ff; }
.btn-link { background: none; border: none; color: #1890ff; cursor: pointer; font-size: 14px; }

.detail-content {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
}

.content-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.content-side {
  display: flex;
  flex-direction: column;
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

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #8c8c8c;
}

.info-value {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
}

.info-value.code {
  font-family: monospace;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}

.config-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 4px;
}

.config-key {
  font-family: monospace;
  color: #722ed1;
}

.config-value {
  font-family: monospace;
  color: #595959;
}

.dependencies-graph {
  display: flex;
  align-items: center;
  gap: 24px;
}

.main-node {
  text-align: center;
}

.dependency-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f5f5;
  border-radius: 6px;
}

.node-icon {
  font-size: 18px;
}

.node-name {
  font-size: 14px;
  font-weight: 500;
}

.node-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.node-status.status-running { background: #f6ffed; color: #52c41a; }
.node-status.status-warning { background: #fffbe6; color: #faad14; }
.node-status.status-error { background: #fff2f0; color: #ff4d4f; }

.dependency-relations {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dependency-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.relation-line {
  color: #8c8c8c;
  font-size: 18px;
}

.deployment-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-item {
  display: flex;
  gap: 16px;
  position: relative;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 20px;
  bottom: -16px;
  width: 2px;
  background: #f0f0f0;
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-marker {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.marker-success { background: #52c41a; }
.marker-failed { background: #ff4d4f; }
.marker-deploying { background: #1890ff; }
.marker-rolledback { background: #faad14; }

.timeline-content {
  flex: 1;
}

.deploy-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.deploy-version {
  font-weight: 600;
  color: #262626;
}

.deploy-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.deploy-status.status-success { background: #f6ffed; color: #52c41a; }
.deploy-status.status-failed { background: #fff2f0; color: #ff4d4f; }

.deploy-info {
  display: flex;
  gap: 16px;
  margin-top: 4px;
  font-size: 12px;
  color: #8c8c8c;
}

.deploy-desc {
  margin-top: 4px;
  font-size: 14px;
  color: #595959;
}

.period-select {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.monitor-metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-name {
  font-size: 14px;
  color: #595959;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
}

.metric-bar {
  height: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #fafafa;
  border-radius: 4px;
  font-size: 12px;
}

.log-time {
  color: #8c8c8c;
  white-space: nowrap;
}

.log-level {
  font-weight: 600;
  width: 50px;
}

.log-info .log-level { color: #1890ff; }
.log-warn .log-level { color: #faad14; }
.log-error .log-level { color: #ff4d4f; }

.log-message {
  color: #595959;
  flex: 1;
  word-break: break-all;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-action:hover {
  border-color: #1890ff;
  background: #e6f7ff;
}

.quick-action span:first-child {
  font-size: 24px;
}

.quick-action span:last-child {
  font-size: 14px;
  color: #595959;
}

.quick-action:hover span:last-child {
  color: #1890ff;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
}

.modal-large {
  width: 600px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #8c8c8c;
}

.modal-body {
  padding: 20px;
}

.modal-body p {
  margin: 0 0 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.action-progress {
  margin-top: 16px;
}

.progress-bar {
  height: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #1890ff;
  transition: width 0.3s;
}

.progress-text {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #595959;
}

.config-editor {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
}

.config-textarea {
  width: 100%;
  border: none;
  outline: none;
  font-family: monospace;
  font-size: 14px;
  padding: 12px;
  resize: vertical;
}

@media (max-width: 1200px) {
  .detail-content {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .service-detail-page {
    max-width: 650px;
    margin: 0 auto;
  }
  .header {
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
  }
}
@media (min-width: 1024px) {
  .service-detail-page {
    max-width: 720px;
  }
  .header {
    max-width: 720px;
  }
}
</style>
