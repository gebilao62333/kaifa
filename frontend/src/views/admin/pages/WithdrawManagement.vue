<template>
  <div class="admin-card">
    <div class="toolbar">
      <div class="search-bar">
        <select v-model="filterStatus" class="search-select">
          <option value="">全部状态</option>
          <option value="0">待审核</option>
          <option value="1">已通过</option>
          <option value="2">已拒绝</option>
        </select>
        <input v-model="searchKeyword" type="text" placeholder="搜索提现记录" class="search-input" />
        <button @click="loadWithdraws" class="search-btn">搜索</button>
      </div>
      <button @click="exportData" class="export-btn">📥 导出CSV</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <table v-else-if="withdrawList.length > 0" class="data-table">
      <thead>
        <tr>
          <th>提现ID</th>
          <th>用户</th>
          <th>金额</th>
          <th>方式</th>
          <th>状态</th>
          <th>申请时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="withdraw in withdrawList" :key="withdraw.id">
          <td>{{ withdraw.id }}</td>
          <td>{{ withdraw.userName || '用户' + withdraw.userId }}</td>
          <td>{{ withdraw.amount }} 金币</td>
          <td>{{ withdraw.method || '-' }}</td>
          <td>
            <span :class="['status-badge', withdraw.status === 0 ? 'pending' : withdraw.status === 1 ? 'approved' : 'rejected']">
              {{ withdraw.status === 0 ? '待审核' : withdraw.status === 1 ? '已通过' : '已拒绝' }}
            </span>
          </td>
          <td>{{ formatTime(withdraw.createTime) }}</td>
          <td>
            <button @click="viewWithdraw(withdraw)" class="action-btn">查看</button>
            <button v-if="withdraw.status === 0" @click="approveWithdraw(withdraw)" class="action-btn approve-btn">通过</button>
            <button v-if="withdraw.status === 0" @click="showRejectModal(withdraw)" class="action-btn delete-btn">拒绝</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && withdrawList.length === 0" class="empty-state">
      <div class="empty-icon">🏦</div>
      <div class="empty-text">暂无提现记录</div>
    </div>

    <div class="pagination">
      <div class="pagination-left">
        <span class="page-size-label">每页</span>
        <select v-model.number="pageSize" @change="page = 1; loadWithdraws()" class="page-size-select">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span class="page-size-label">条，共 {{ total }} 条</span>
      </div>
      <div class="pagination-right">
        <button @click="page = 1; loadWithdraws()" class="page-btn" :disabled="page <= 1">首页</button>
        <button @click="page--; loadWithdraws()" class="page-btn" :disabled="page <= 1">上一页</button>
        <template v-for="p in pageNumbers" :key="p">
          <span v-if="p === '...'" class="page-ellipsis">...</span>
          <button v-else @click="page = p; loadWithdraws()" :class="['page-btn', { 'page-active': page === p }]">{{ p }}</button>
        </template>
        <button @click="page++; loadWithdraws()" class="page-btn" :disabled="page >= totalPages">下一页</button>
        <button @click="page = totalPages; loadWithdraws()" class="page-btn" :disabled="page >= totalPages">末页</button>
      </div>
    </div>

    <!-- 提现记录详情模态框 -->
    <div v-if="showWithdrawDetail" class="modal-overlay" @click.self="showWithdrawDetail = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>提现详情 #{{ currentWithdraw.id }}</h3>
          <button @click="showWithdrawDetail = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">用户:</span>
            <span>{{ currentWithdraw.userName || '用户' + currentWithdraw.userId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">金额:</span>
            <span>{{ currentWithdraw.amount }} 金币</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">提现方式:</span>
            <span>{{ currentWithdraw.method || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">状态:</span>
            <span :class="['status-badge', currentWithdraw.status === 0 ? 'pending' : currentWithdraw.status === 1 ? 'approved' : 'rejected']">
              {{ currentWithdraw.status === 0 ? '待审核' : currentWithdraw.status === 1 ? '已通过' : '已拒绝' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">申请时间:</span>
            <span>{{ formatTime(currentWithdraw.createTime) }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showWithdrawDetail = false" class="cancel-btn">关闭</button>
        </div>
      </div>
    </div>

    <!-- 拒绝原因模态框 -->
    <div v-if="showRejectReason" class="modal-overlay" @click.self="showRejectReason = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>拒绝提现 #{{ currentWithdraw.id }}</h3>
          <button @click="showRejectReason = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>拒绝原因</label>
            <textarea v-model="rejectReason" class="form-input" rows="4" placeholder="请输入拒绝原因..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showRejectReason = false" class="cancel-btn">取消</button>
          <button @click="confirmReject" class="confirm-btn reject-confirm-btn" :disabled="!rejectReason.trim()">确认拒绝</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { page, pageSize, total, totalPages, pageNumbers, formatTime, apiGet, apiPost, exportCSV, toast, confirm } = useAdmin()

const withdrawList = ref([])
const searchKeyword = ref('')
const filterStatus = ref('')
const currentWithdraw = ref(null)
const showWithdrawDetail = ref(false)
const showRejectReason = ref(false)
const rejectReason = ref('')
const loading = ref(false)

const loadWithdraws = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) { params.keyword = searchKeyword.value }
    if (filterStatus.value !== '') { params.status = filterStatus.value }
    const res = await apiGet('/api/admin/withdraws', params)
    if (res.code === 200) {
      withdrawList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载提现记录失败:', err)
    toast('加载提现记录失败', 'error')
  } finally {
    loading.value = false
  }
}

const viewWithdraw = (withdraw) => {
  currentWithdraw.value = { ...withdraw }
  showWithdrawDetail.value = true
}

const approveWithdraw = async (withdraw) => {
  if (!(await confirm('确定要通过此提现申请吗？'))) return
  try {
    const res = await apiPost('/api/admin/withdraws/' + withdraw.id + '/approve')
    if (res.code === 200) {
      toast('已通过提现申请')
      loadWithdraws()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('审批失败:', err)
    toast('操作失败', 'error')
  }
}

const showRejectModal = (withdraw) => {
  currentWithdraw.value = { ...withdraw }
  rejectReason.value = ''
  showRejectReason.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) return
  try {
    const res = await apiPost('/api/admin/withdraws/' + currentWithdraw.value.id + '/reject', { reason: rejectReason.value })
    if (res.code === 200) {
      showRejectReason.value = false
      loadWithdraws()
    }
  } catch (err) {
    console.error('拒绝失败:', err)
  }
}

const exportData = () => {
  exportCSV(withdrawList.value, [
    { label: '提现ID', key: 'id' },
    { label: '用户', key: row => row.userName || '用户' + row.userId },
    { label: '金额', key: 'amount' },
    { label: '方式', key: 'method' },
    { label: '状态', key: row => row.status === 0 ? '待审核' : row.status === 1 ? '已通过' : '已拒绝' },
    { label: '申请时间', key: row => formatTime(row.createTime) }
  ], 'withdraws')
}

onMounted(() => {
  loadWithdraws()
})
</script>
