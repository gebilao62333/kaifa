<template>
  <div class="admin-card">
    <div class="toolbar">
      <div class="search-bar">
        <input v-model="searchKeyword" type="text" placeholder="搜索用户ID" class="search-input" />
        <select v-model="filterStatus" class="search-select">
          <option value="">全部状态</option>
          <option value="completed">已完成</option>
          <option value="pending">处理中</option>
          <option value="failed">失败</option>
        </select>
        <button @click="loadRecharges" class="search-btn">搜索</button>
      </div>
      <button @click="exportData" class="export-btn">📥 导出CSV</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <table v-else-if="rechargeList.length > 0" class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>订单号</th>
          <th>用户</th>
          <th>金额</th>
          <th>支付方式</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="record in rechargeList" :key="record.id">
          <td>{{ record.id }}</td>
          <td>{{ record.orderNo }}</td>
          <td>{{ record.userName || '用户' + record.userId }}</td>
          <td>{{ record.amount }} 金币</td>
          <td>{{ record.paymentMethod === 'wechat' ? '微信' : record.paymentMethod === 'alipay' ? '支付宝' : '银行卡' }}</td>
          <td>
            <span :class="['status-badge', 
              record.status === 'completed' ? 'approved' : 
              record.status === 'pending' ? 'pending' : 'rejected']">
              {{ record.status === 'completed' ? '已完成' : 
                 record.status === 'pending' ? '处理中' : '失败' }}
            </span>
          </td>
          <td>{{ formatTime(record.createTime) }}</td>
          <td>
            <button @click="viewRecharge(record)" class="action-btn">查看</button>
            <button v-if="record.status === 'pending'" @click="approveRecharge(record)" class="action-btn approve-btn">通过</button>
            <button v-if="record.status === 'pending'" @click="rejectRecharge(record)" class="action-btn reject-btn">拒绝</button>
            <button v-if="record.status === 'failed'" @click="deleteRecharge(record)" class="action-btn delete-btn">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && rechargeList.length === 0" class="empty-state">
      <div class="empty-icon">💳</div>
      <div class="empty-text">暂无充值记录</div>
    </div>

    <div class="pagination">
      <div class="pagination-left">
        <span class="page-size-label">每页</span>
        <select v-model.number="pageSize" @change="page = 1; loadRecharges()" class="page-size-select">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span class="page-size-label">条，共 {{ total }} 条</span>
      </div>
      <div class="pagination-right">
        <button @click="page = 1; loadRecharges()" class="page-btn" :disabled="page <= 1">首页</button>
        <button @click="page--; loadRecharges()" class="page-btn" :disabled="page <= 1">上一页</button>
        <template v-for="p in pageNumbers" :key="p">
          <span v-if="p === '...'" class="page-ellipsis">...</span>
          <button v-else @click="page = p; loadRecharges()" :class="['page-btn', { 'page-active': page === p }]">{{ p }}</button>
        </template>
        <button @click="page++; loadRecharges()" class="page-btn" :disabled="page >= totalPages">下一页</button>
        <button @click="page = totalPages; loadRecharges()" class="page-btn" :disabled="page >= totalPages">末页</button>
      </div>
    </div>

    <!-- 充值记录详情模态框 -->
    <div v-if="showRechargeDetail" class="modal-overlay" @click.self="showRechargeDetail = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>充值记录详情 #{{ currentRecharge.id }}</h3>
          <button @click="showRechargeDetail = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">订单号:</span>
            <span>{{ currentRecharge.orderNo }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">用户:</span>
            <span>{{ currentRecharge.userName || '用户' + currentRecharge.userId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">金额:</span>
            <span>{{ currentRecharge.amount }} 金币</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">支付方式:</span>
            <span>{{ currentRecharge.paymentMethod === 'wechat' ? '微信' : currentRecharge.paymentMethod === 'alipay' ? '支付宝' : '银行卡' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">状态:</span>
            <span :class="['status-badge', 
              currentRecharge.status === 'completed' ? 'approved' : 
              currentRecharge.status === 'pending' ? 'pending' : 'rejected']">
              {{ currentRecharge.status === 'completed' ? '已完成' : 
                 currentRecharge.status === 'pending' ? '处理中' : '失败' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">创建时间:</span>
            <span>{{ formatTime(currentRecharge.createTime) }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button v-if="currentRecharge?.status === 'pending'" @click="approveRecharge(currentRecharge); showRechargeDetail = false" class="confirm-btn">通过</button>
          <button v-if="currentRecharge?.status === 'pending'" @click="rejectRecharge(currentRecharge); showRechargeDetail = false" class="confirm-btn reject-btn">拒绝</button>
          <button @click="showRechargeDetail = false" class="cancel-btn">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { page, pageSize, total, totalPages, pageNumbers, formatTime, apiGet, apiPut, apiDelete, exportCSV, toast, confirm } = useAdmin()

const rechargeList = ref([])
const searchKeyword = ref('')
const filterStatus = ref('')
const currentRecharge = ref(null)
const showRechargeDetail = ref(false)
const loading = ref(false)

const loadRecharges = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) { params.keyword = searchKeyword.value }
    if (filterStatus.value !== '') { params.status = filterStatus.value }
    const res = await apiGet('/api/admin/recharges', params)
    if (res.code === 200) {
      rechargeList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载充值记录失败:', err)
    toast('加载充值记录失败', 'error')
  } finally {
    loading.value = false
  }
}

const viewRecharge = (record) => {
  currentRecharge.value = { ...record }
  showRechargeDetail.value = true
}

const deleteRecharge = async (record) => {
  if (!(await confirm('确定要删除此充值记录吗？此操作不可撤销。'))) return
  try {
    const res = await apiDelete('/api/admin/recharge-records/' + record.id)
    if (res.code === 200) {
      toast('充值记录已删除')
      loadRecharges()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('删除充值记录失败:', err)
    toast('删除充值记录失败', 'error')
  }
}

const approveRecharge = async (record) => {
  if (!(await confirm(`确认通过「${record.orderNo}」的充值（${record.amount}金币）？`))) return
  try {
    const res = await apiPut('/api/admin/recharge-records/' + record.id + '/complete')
    if (res.code === 200) {
      toast('充值已确认完成')
      loadRecharges()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('通过充值失败:', err)
    toast('操作失败', 'error')
  }
}

const rejectRecharge = async (record) => {
  if (!(await confirm(`确认拒绝「${record.orderNo}」的充值（${record.amount}金币）？`))) return
  try {
    const res = await apiPut('/api/admin/recharge-records/' + record.id + '/fail')
    if (res.code === 200) {
      toast('充值已标记为失败')
      loadRecharges()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('拒绝充值失败:', err)
    toast('操作失败', 'error')
  }
}

const exportData = () => {
  exportCSV(rechargeList.value, [
    { label: 'ID', key: 'id' },
    { label: '订单号', key: 'orderNo' },
    { label: '用户', key: row => row.userName || '用户' + row.userId },
    { label: '金额', key: 'amount' },
    { label: '支付方式', key: row => row.paymentMethod === 'wechat' ? '微信' : row.paymentMethod === 'alipay' ? '支付宝' : '银行卡' },
    { label: '状态', key: row => row.status === 'completed' ? '已完成' : row.status === 'pending' ? '处理中' : '失败' },
    { label: '创建时间', key: row => formatTime(row.createTime) }
  ], 'recharges')
}

onMounted(() => {
  loadRecharges()
})
</script>

<style scoped>
.approve-btn {
  color: #15803d;
  border-color: #86efac;
  background: #f0fdf4;
}
.approve-btn:hover {
  background: #dcfce7;
  border-color: #22c55e;
}
.reject-btn {
  color: #b91c1c;
  border-color: #fca5a5;
  background: #fef2f2;
}
.reject-btn:hover {
  background: #fee2e2;
  border-color: #ef4444;
}
</style>
