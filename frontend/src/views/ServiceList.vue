<template>
  <div class="service-list-container">
    <div class="page-header">
      <h1 class="page-title">服务列表</h1>
      <button class="btn btn-primary" @click="goToCreate">
        <span>➕</span> 新建服务
      </button>
    </div>

    <div class="filters-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索服务名称或标识..."
          @input="handleSearch"
        />
      </div>

      <div class="filter-group">
        <select v-model="statusFilter" class="filter-select" @change="handleFilterChange">
          <option value="">全部状态</option>
          <option value="running">运行中</option>
          <option value="stopped">已停止</option>
          <option value="error">异常</option>
        </select>

        <select v-model="categoryFilter" class="filter-select" @change="handleFilterChange">
          <option value="">全部分类</option>
          <option value="user">用户服务</option>
          <option value="chat">聊天服务</option>
          <option value="game">游戏服务</option>
          <option value="payment">支付服务</option>
          <option value="system">系统服务</option>
        </select>

        <select v-model="sortBy" class="filter-select" @change="handleSortChange">
          <option value="createTime">按创建时间</option>
          <option value="name">按名称</option>
          <option value="status">按状态</option>
        </select>

        <button class="btn btn-icon" @click="toggleSortOrder">
          {{ sortOrder === 'asc' ? '⬆️' : '⬇️' }}
        </button>
      </div>
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="th-checkbox">
              <input type="checkbox" v-model="selectAll" @change="handleSelectAll" />
            </th>
            <th class="th-name" @click="handleSort('name')">
              服务名称
              <span class="sort-indicator" v-if="sortBy === 'name'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th class="th-category">分类</th>
            <th class="th-status" @click="handleSort('status')">
              状态
              <span class="sort-indicator" v-if="sortBy === 'status'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th class="th-instances">实例数</th>
            <th class="th-uptime">运行时长</th>
            <th class="th-cpu">CPU</th>
            <th class="th-memory">内存</th>
            <th class="th-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="service in paginatedServices" :key="service.id" :class="{ selected: selectedIds.includes(service.id) }">
            <td class="td-checkbox">
              <input type="checkbox" v-model="selectedIds" :value="service.id" />
            </td>
            <td class="td-name">
              <div class="service-name-cell">
                <div class="service-name">{{ service.name }}</div>
                <div class="service-id">ID: {{ service.id }}</div>
              </div>
            </td>
            <td class="td-category">
              <span class="category-tag" :class="'category-' + service.category">
                {{ getCategoryText(service.category) }}
              </span>
            </td>
            <td class="td-status">
              <span class="status-tag" :class="'status-' + service.status">
                {{ getStatusText(service.status) }}
              </span>
            </td>
            <td class="td-instances">
              <span class="instance-count">{{ service.instances }}</span>
              <span class="instance-max">/{{ service.maxInstances }}</span>
            </td>
            <td class="td-uptime">{{ service.uptime }}</td>
            <td class="td-cpu">
              <div class="resource-mini-bar">
                <div class="resource-mini-fill" :style="{ width: service.cpu + '%', background: getResourceColor(service.cpu) }"></div>
              </div>
              <span class="resource-value">{{ service.cpu }}%</span>
            </td>
            <td class="td-memory">
              <div class="resource-mini-bar">
                <div class="resource-mini-fill" :style="{ width: service.memory + '%', background: getResourceColor(service.memory) }"></div>
              </div>
              <span class="resource-value">{{ service.memory }}%</span>
            </td>
            <td class="td-actions">
              <div class="action-buttons">
                <button class="action-btn" @click="handleAction(service, 'start')" v-if="service.status !== 'running'" title="启动">▶️</button>
                <button class="action-btn" @click="handleAction(service, 'stop')" v-if="service.status === 'running'" title="停止">⏸️</button>
                <button class="action-btn" @click="handleAction(service, 'restart')" title="重启">🔄</button>
                <button class="action-btn" @click="handleAction(service, 'deploy')" title="部署">🚀</button>
                <button class="action-btn" @click="goToDetail(service.id)" title="详情">📋</button>
                <button class="action-btn" @click="goToEdit(service.id)" title="编辑">✏️</button>
                <button class="action-btn action-btn-danger" @click="handleDelete(service)" title="删除">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="table-footer">
      <div class="selection-info" v-if="selectedIds.length > 0">
        已选择 {{ selectedIds.length }} 项
        <button class="btn-link" @click="clearSelection">清空</button>
        <button class="btn btn-sm btn-danger" @click="batchDelete">批量删除</button>
      </div>
      <div class="pagination">
        <div class="page-info">
          共 {{ totalCount }} 条记录，每页 {{ pageSize }} 条
        </div>
        <div class="page-controls">
          <button class="page-btn" :disabled="currentPage === 1" @click="goToPage(1)">首页</button>
          <button class="page-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">上一页</button>
          <div class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              class="page-number"
              :class="{ active: page === currentPage }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </div>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">下一页</button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="goToPage(totalPages)">末页</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showDeleteModal" @click.self="showDeleteModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">确认删除</h3>
          <button class="modal-close" @click="showDeleteModal = false">×</button>
        </div>
        <div class="modal-body">
          <p>确定要删除服务 <strong>{{ serviceToDelete?.name }}</strong> 吗？</p>
          <p class="warning-text">此操作不可恢复！</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showDeleteModal = false">取消</button>
          <button class="btn btn-danger" @click="confirmDelete">确认删除</button>
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
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showActionModal = false">取消</button>
          <button class="btn btn-primary" @click="confirmAction">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const searchQuery = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')
const sortBy = ref('createTime')
const sortOrder = ref('desc')
const currentPage = ref(1)
const pageSize = ref(10)
const selectAll = ref(false)
const selectedIds = ref([])
const showDeleteModal = ref(false)
const showActionModal = ref(false)
const serviceToDelete = ref(null)
const currentAction = ref(null)

const allServices = ref([
  { id: 1, name: '用户认证服务', category: 'user', status: 'running', instances: 3, maxInstances: 5, uptime: '15天 6小时', cpu: 25, memory: 40 },
  { id: 2, name: '虚拟用户服务', category: 'system', status: 'running', instances: 2, maxInstances: 4, uptime: '7天 2小时', cpu: 45, memory: 62 },
  { id: 3, name: '聊天消息服务', category: 'chat', status: 'running', instances: 4, maxInstances: 8, uptime: '20天 14小时', cpu: 55, memory: 58 },
  { id: 4, name: '游戏匹配服务', category: 'game', status: 'running', instances: 2, maxInstances: 6, uptime: '5天 8小时', cpu: 30, memory: 35 },
  { id: 5, name: '支付结算服务', category: 'payment', status: 'stopped', instances: 0, maxInstances: 3, uptime: '-', cpu: 0, memory: 0 },
  { id: 6, name: '礼物系统服务', category: 'chat', status: 'running', instances: 2, maxInstances: 4, uptime: '12天 3小时', cpu: 20, memory: 28 },
  { id: 7, name: '活动管理服务', category: 'system', status: 'error', instances: 1, maxInstances: 3, uptime: '2天 5小时', cpu: 85, memory: 92 },
  { id: 8, name: '实时音视频服务', category: 'chat', status: 'running', instances: 5, maxInstances: 10, uptime: '30天 0小时', cpu: 65, memory: 72 },
  { id: 9, name: '数据分析服务', category: 'system', status: 'stopped', instances: 0, maxInstances: 2, uptime: '-', cpu: 0, memory: 0 },
  { id: 10, name: '通知推送服务', category: 'system', status: 'running', instances: 2, maxInstances: 4, uptime: '18天 9小时', cpu: 15, memory: 22 },
  { id: 11, name: '搜索推荐服务', category: 'user', status: 'running', instances: 3, maxInstances: 5, uptime: '8天 11小时', cpu: 38, memory: 45 },
  { id: 12, name: '日志收集服务', category: 'system', status: 'running', instances: 2, maxInstances: 3, uptime: '25天 7小时', cpu: 42, memory: 55 }
])

const filteredServices = computed(() => {
  let result = [...allServices.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.id.toString().includes(query)
    )
  }

  if (statusFilter.value) {
    result = result.filter(s => s.status === statusFilter.value)
  }

  if (categoryFilter.value) {
    result = result.filter(s => s.category === categoryFilter.value)
  }

  result.sort((a, b) => {
    let valA = a[sortBy.value]
    let valB = b[sortBy.value]

    if (typeof valA === 'string') {
      valA = valA.toLowerCase()
      valB = valB.toLowerCase()
    }

    if (sortOrder.value === 'asc') {
      return valA > valB ? 1 : -1
    } else {
      return valA < valB ? 1 : -1
    }
  })

  return result
})

const totalCount = computed(() => filteredServices.value.length)

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

const paginatedServices = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredServices.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

const getCategoryText = (category) => {
  const map = { user: '用户服务', chat: '聊天服务', game: '游戏服务', payment: '支付服务', system: '系统服务' }
  return map[category] || category
}

const getStatusText = (status) => {
  const map = { running: '运行中', stopped: '已停止', error: '异常' }
  return map[status] || status
}

const getResourceColor = (value) => {
  if (value >= 80) return '#ff4d4f'
  if (value >= 60) return '#faad14'
  return '#52c41a'
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilterChange = () => {
  currentPage.value = 1
}

const handleSortChange = () => {
  console.log('Sort changed:', sortBy.value)
}

const handleSort = (field) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'asc'
  }
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const handleSelectAll = () => {
  if (selectAll.value) {
    selectedIds.value = paginatedServices.value.map(s => s.id)
  } else {
    selectedIds.value = []
  }
}

const clearSelection = () => {
  selectedIds.value = []
  selectAll.value = false
}

const goToPage = (page) => {
  currentPage.value = page
}

const goToCreate = () => {
  router.push('/project/create')
}

const goToDetail = (id) => {
  router.push(`/project/${id}`)
}

const goToEdit = (id) => {
  router.push(`/project/edit/${id}`)
}

const handleDelete = (service) => {
  serviceToDelete.value = service
  showDeleteModal.value = true
}

const confirmDelete = () => {
  console.log('Deleting service:', serviceToDelete.value.id)
  showDeleteModal.value = false
  serviceToDelete.value = null
}

const actionTitle = computed(() => {
  const map = { start: '启动服务', stop: '停止服务', restart: '重启服务', deploy: '部署服务' }
  return map[currentAction.value] || '操作确认'
})

const actionMessage = computed(() => {
  return '确定要执行此操作吗？'
})

const handleAction = (service, action) => {
  currentAction.value = action
  showActionModal.value = true
}

const confirmAction = () => {
  console.log('Action confirmed:', currentAction.value)
  showActionModal.value = false
  currentAction.value = null
}

const batchDelete = () => {
  console.log('Batch delete:', selectedIds.value)
  clearSelection()
}

onMounted(() => {
  console.log('Service list mounted')
})
</script>

<style scoped>
.service-list-container {
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
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin: 0;
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

.btn-danger {
  background: #ff4d4f;
  color: #fff;
}

.btn-danger:hover {
  background: #ff7875;
}

.btn-default {
  background: #fff;
  color: #595959;
  border: 1px solid #d9d9d9;
}

.btn-default:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.btn-icon {
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #d9d9d9;
}

.btn-link {
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  margin-left: 12px;
}

.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 0 12px;
  width: 300px;
}

.search-icon {
  color: #8c8c8c;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 10px 0;
  font-size: 14px;
}

.filter-group {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  cursor: pointer;
}

.table-container {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.data-table th {
  background: #fafafa;
  font-weight: 600;
  color: #262626;
  font-size: 14px;
}

.data-table tbody tr:hover {
  background: #f5f5f5;
}

.data-table tbody tr.selected {
  background: #e6f7ff;
}

.th-checkbox,
.td-checkbox {
  width: 40px;
  text-align: center;
}

.th-name,
.td-name {
  min-width: 180px;
}

.th-category,
.th-status,
.th-instances,
.th-uptime,
.th-cpu,
.th-memory {
  width: 100px;
}

.th-actions,
.td-actions {
  width: 200px;
}

.service-name-cell {
  display: flex;
  flex-direction: column;
}

.service-name {
  font-weight: 500;
  color: #262626;
}

.service-id {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

.category-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: #f5f5f5;
  color: #595959;
}

.category-user { background: #e6f7ff; color: #1890ff; }
.category-chat { background: #f9f0ff; color: #722ed1; }
.category-game { background: #fff7e6; color: #fa8c16; }
.category-payment { background: #fff2f0; color: #ff4d4f; }
.category-system { background: #f6ffed; color: #52c41a; }

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-running { background: #f6ffed; color: #52c41a; }
.status-stopped { background: #f5f5f5; color: #8c8c8c; }
.status-error { background: #fff2f0; color: #ff4d4f; }

.instance-count {
  font-weight: 600;
  color: #262626;
}

.instance-max {
  color: #8c8c8c;
}

.resource-mini-bar {
  width: 60px;
  height: 6px;
  background: #f5f5f5;
  border-radius: 3px;
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
}

.resource-mini-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.resource-value {
  font-size: 12px;
  color: #595959;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
  transition: background 0.3s;
}

.action-btn:hover {
  background: #f5f5f5;
}

.action-btn-danger:hover {
  background: #fff2f0;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
}

.selection-info {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #595959;
}

.pagination {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.page-info {
  font-size: 14px;
  color: #8c8c8c;
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  padding: 4px 12px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.page-btn:disabled {
  color: #d9d9d9;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.page-number.active {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.sort-indicator {
  margin-left: 4px;
  color: #1890ff;
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

.warning-text {
  color: #ff4d4f;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

@media (max-width: 1200px) {
  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }

  .filter-group {
    flex-wrap: wrap;
  }

  .table-container {
    overflow-x: auto;
  }

  .data-table {
    min-width: 1000px;
  }
}
</style>
