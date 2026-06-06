<template>
  <div class="admin-card">
    <div class="toolbar">
      <div class="search-bar">
        <select v-model="filterStatus" class="search-select">
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
        </select>
        <button @click="loadApplications" class="search-btn">搜索</button>
      </div>
      <button @click="exportData" class="export-btn">📥 导出CSV</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <table v-else-if="applicationList.length > 0" class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>用户</th>
          <th>服务分类</th>
          <th>服务类型</th>
          <th>申请时间</th>
          <th>状态</th>
          <th>处理时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="app in applicationList" :key="app.id">
          <td>{{ app.id }}</td>
          <td>{{ app.userName || '用户' + app.userId }}</td>
          <td>{{ app.category === 'offline' ? '线下服务' : '线上服务' }}</td>
          <td>{{ app.gameName || '游戏陪玩' }}</td>
          <td>{{ formatTime(app.createTime) }}</td>
          <td>
            <span :class="['status-badge', 
              app.status === 'approved' ? 'approved' : 
              app.status === 'pending' ? 'pending' : 'rejected']">
              {{ app.status === 'approved' ? '已通过' : 
                 app.status === 'pending' ? '待审核' : '已拒绝' }}
            </span>
          </td>
          <td>{{ app.handleTime ? formatTime(app.handleTime) : '-' }}</td>
          <td>
            <button @click="viewApplication(app)" class="action-btn">查看</button>
            <button @click="approveApplication(app)" class="action-btn" :disabled="app.status !== 'pending'">通过</button>
            <button @click="rejectApplication(app)" class="action-btn delete-btn" :disabled="app.status !== 'pending'">拒绝</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && applicationList.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-text">暂无陪玩申请</div>
    </div>

    <div class="pagination">
      <div class="pagination-left">
        <span class="page-size-label">每页</span>
        <select v-model.number="pageSize" @change="page = 1; loadApplications()" class="page-size-select">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span class="page-size-label">条，共 {{ total }} 条</span>
      </div>
      <div class="pagination-right">
        <button @click="page = 1; loadApplications()" class="page-btn" :disabled="page <= 1">首页</button>
        <button @click="page--; loadApplications()" class="page-btn" :disabled="page <= 1">上一页</button>
        <template v-for="p in pageNumbers" :key="p">
          <span v-if="p === '...'" class="page-ellipsis">...</span>
          <button v-else @click="page = p; loadApplications()" :class="['page-btn', { 'page-active': page === p }]">{{ p }}</button>
        </template>
        <button @click="page++; loadApplications()" class="page-btn" :disabled="page >= totalPages">下一页</button>
        <button @click="page = totalPages; loadApplications()" class="page-btn" :disabled="page >= totalPages">末页</button>
      </div>
    </div>

    <!-- 申请详情模态框 -->
    <div v-if="showApplicationDetail" class="modal-overlay" @click.self="showApplicationDetail = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>申请详情 #{{ currentApplication.id }}</h3>
          <button @click="showApplicationDetail = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">申请人:</span>
            <span>{{ currentApplication.userName || '用户' + currentApplication.userId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">服务分类:</span>
            <span>{{ currentApplication.category === 'offline' ? '线下服务' : '线上服务' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">服务类型:</span>
            <span>{{ currentApplication.gameName || '游戏陪玩' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">申请时间:</span>
            <span>{{ formatTime(currentApplication.createTime) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">状态:</span>
            <span :class="['status-badge', 
              currentApplication.status === 'approved' ? 'approved' : 
              currentApplication.status === 'pending' ? 'pending' : 'rejected']">
              {{ currentApplication.status === 'approved' ? '已通过' : 
                 currentApplication.status === 'pending' ? '待审核' : '已拒绝' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">处理时间:</span>
            <span>{{ currentApplication.handleTime ? formatTime(currentApplication.handleTime) : '-' }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showApplicationDetail = false" class="cancel-btn">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { page, pageSize, total, totalPages, pageNumbers, formatTime, apiGet, apiPut, exportCSV, toast, confirm } = useAdmin()

const applicationList = ref([])
const filterStatus = ref('')
const currentApplication = ref(null)
const showApplicationDetail = ref(false)
const loading = ref(false)

const loadApplications = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (filterStatus.value !== '') { params.status = filterStatus.value }
    const res = await apiGet('/api/admin/companion-applications', params)
    if (res.code === 200) {
      applicationList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载申请列表失败:', err)
    toast('加载申请列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const viewApplication = (app) => {
  currentApplication.value = { ...app }
  showApplicationDetail.value = true
}

const approveApplication = async (app) => {
  if (!(await confirm('确定要通过此陪玩申请吗？'))) return
  try {
    const res = await apiPut('/api/admin/companion-applications/' + app.id, { status: 'approved' })
    if (res.code === 200) {
      toast('已通过陪玩申请')
      loadApplications()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('审核失败:', err)
    toast('操作失败', 'error')
  }
}

const rejectApplication = async (app) => {
  if (!(await confirm('确定要拒绝此陪玩申请吗？'))) return
  try {
    const res = await apiPut('/api/admin/companion-applications/' + app.id, { status: 'rejected' })
    if (res.code === 200) {
      toast('已拒绝陪玩申请')
      loadApplications()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('审核失败:', err)
    toast('操作失败', 'error')
  }
}

const exportData = () => {
  exportCSV(applicationList.value, [
    { label: 'ID', key: 'id' },
    { label: '用户', key: row => row.userName || '用户' + row.userId },
    { label: '服务分类', key: row => row.category === 'offline' ? '线下服务' : '线上服务' },
    { label: '服务类型', key: 'gameName' },
    { label: '申请时间', key: row => formatTime(row.createTime) },
    { label: '状态', key: row => row.status === 'approved' ? '已通过' : row.status === 'pending' ? '待审核' : '已拒绝' }
  ], 'companion_applications')
}

onMounted(() => {
  loadApplications()
})
</script>