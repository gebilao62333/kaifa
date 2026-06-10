<template>
  <div class="admin-withdraw-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">提现审核</span>
      <span class="filter-btn" @click="showFilter = !showFilter">筛选</span>
    </div>

    <div class="filter-bar" v-if="showFilter">
      <div class="filter-item" :class="{ active: filterStatus === -1 }" @click="filterStatus = -1; fetchList()">全部</div>
      <div class="filter-item" :class="{ active: filterStatus === 0 }" @click="filterStatus = 0; fetchList()">待审核</div>
      <div class="filter-item" :class="{ active: filterStatus === 1 }" @click="filterStatus = 1; fetchList()">已通过</div>
      <div class="filter-item" :class="{ active: filterStatus === 2 }" @click="filterStatus = 2; fetchList()">已拒绝</div>
    </div>

    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">待审核</span>
        <span class="stat-value pending">{{ pendingCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">今日提现</span>
        <span class="stat-value">{{ todayAmount }} 金币</span>
      </div>
    </div>

    <div class="withdraw-list" v-if="list.length > 0">
      <div class="withdraw-card" v-for="item in list" :key="item.id">
        <div class="card-header">
          <div class="user-info">
            <img :src="item.userAvatar || '/default-avatar.png'" class="avatar" />
            <div class="user-detail">
              <span class="nickname">{{ item.userNickname || '用户' + item.userId }}</span>
              <span class="mobile">{{ item.userMobile || '未绑定手机' }}</span>
            </div>
          </div>
          <div class="status-badge" :class="getStatusClass(item.isCheck)">
            {{ getStatusText(item.isCheck) }}
          </div>
        </div>

        <div class="card-body">
          <div class="amount-row">
            <span class="label">提现金额</span>
            <span class="amount">{{ item.money.toFixed(2) }} 金币</span>
          </div>
          <div class="info-row">
            <span class="label">提现方式</span>
            <span class="value">{{ getTypeText(item.type) }}</span>
          </div>
          <div class="info-row" v-if="item.name">
            <span class="label">收款人</span>
            <span class="value">{{ item.name }}</span>
          </div>
          <div class="info-row" v-if="item.bank">
            <span class="label">开户银行</span>
            <span class="value">{{ item.bank }}</span>
          </div>
          <div class="info-row" v-if="item.mobile">
            <span class="label">收款账号</span>
            <span class="value">{{ item.mobile }}</span>
          </div>
          <div class="info-row" v-if="item.image">
            <span class="label">收款码</span>
            <img :src="item.image" class="qr-thumb" @click="previewImage(item.image)" />
          </div>
          <div class="time-row">
            <span class="label">申请时间</span>
            <span class="value">{{ formatTime(item.createTime) }}</span>
          </div>
        </div>

        <div class="card-footer" v-if="item.isCheck === 0">
          <div class="reject-btn" @click="showRejectModal(item)">拒绝</div>
          <div class="approve-btn" @click="approveItem(item)">通过</div>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else>
      <span class="empty-icon">📋</span>
      <span class="empty-text">暂无提现记录</span>
    </div>

    <div class="pagination" v-if="total > pageSize">
      <span class="page-btn" @click="prevPage" :class="{ disabled: page <= 1 }">上一页</span>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <span class="page-btn" @click="nextPage" :class="{ disabled: page >= totalPages }">下一页</span>
    </div>

    <div class="reject-modal" v-if="showReject">
      <div class="modal-content">
        <div class="modal-header">
          <span>拒绝原因</span>
          <span class="close-btn" @click="showReject = false">×</span>
        </div>
        <div class="modal-body">
          <textarea v-model="rejectReason" placeholder="请输入拒绝原因" rows="3"></textarea>
        </div>
        <div class="modal-footer">
          <div class="cancel-btn" @click="showReject = false">取消</div>
          <div class="confirm-btn" @click="confirmReject">确认拒绝</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAdmin } from './composables/useAdmin'

const router = useRouter()
const { apiGet, apiPost, toast, formatTime } = useAdmin()

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const pendingCount = ref(0)
const todayAmount = ref(0)
const filterStatus = ref(-1)
const showFilter = ref(false)
const showReject = ref(false)
const rejectReason = ref('')
const currentItem = ref(null)

const goBack = () => {
  router.back()
}

const getStatusClass = (status) => {
  const map = { 0: 'pending', 1: 'approved', 2: 'rejected' }
  return map[status] || 'pending'
}

const getStatusText = (status) => {
  const map = { 0: '待审核', 1: '已通过', 2: '已拒绝' }
  return map[status] || '待审核'
}

const getTypeText = (type) => {
  const map = { 1: '支付宝', 2: '微信', 3: '密卡' }
  return map[type] || '未知'
}

const previewImage = (url) => {
  window.open(url)
}

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const fetchList = async () => {
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (filterStatus.value !== -1) {
      params.isCheck = filterStatus.value
    }
    const result = await apiGet('/api/gift/admin/withdraw/list', params)
    if (result.code === 0) {
      list.value = result.data.list || []
      total.value = result.data.total || 0
      pendingCount.value = list.value.filter(item => item.isCheck === 0).length
      todayAmount.value = list.value
        .filter(item => {
          const today = new Date()
          const itemDate = new Date(item.createTime * 1000)
          return itemDate.toDateString() === today.toDateString()
        })
        .reduce((sum, item) => sum + item.money, 0)
    }
  } catch (error) {
    console.error('获取提现列表错误:', error)
    toast('获取数据失败', 'error')
  }
}

const approveItem = async (item) => {
  try {
    const result = await apiPost('/api/gift/admin/withdraw/approve', { withdrawId: item.id })
    if (result.code === 0) {
      toast('审核通过')
      fetchList()
    } else {
      toast(result.message || '操作失败', 'error')
    }
  } catch (error) {
    console.error('审核错误:', error)
    toast('网络错误', 'error')
  }
}

const showRejectModal = (item) => {
  currentItem.value = item
  rejectReason.value = ''
  showReject.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    toast('请输入拒绝原因', 'warning')
    return
  }
  try {
    const result = await apiPost('/api/gift/admin/withdraw/reject', {
      withdrawId: currentItem.value.id,
      reason: rejectReason.value
    })
    if (result.code === 0) {
      toast('已拒绝')
      showReject.value = false
      fetchList()
    } else {
      toast(result.message || '操作失败', 'error')
    }
  } catch (error) {
    console.error('拒绝错误:', error)
    toast('网络错误', 'error')
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    fetchList()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    fetchList()
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.admin-withdraw-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: var(--bg-secondary);
  padding-bottom: 20px;
  padding-bottom: calc(20px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  display: flex;
  align-items: center;
  padding: 60px 20px 20px;
  background: var(--gradient-primary);
  color: white;
}

.back-btn {
  font-size: 24px;
  cursor: pointer;
  margin-right: 20px;
}

.title {
  flex: 1;
  font-size: 18px;
  font-weight: bold;
}

.filter-btn {
  font-size: 14px;
  cursor: pointer;
}

.filter-bar {
  display: flex;
  gap: 10px;
  padding: 12px 20px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
}

.filter-item {
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  cursor: pointer;
}

.filter-item.active {
  background: var(--primary-color);
  color: white;
}

.stats-bar {
  display: flex;
  padding: 16px 20px;
  gap: 20px;
  background: var(--bg-primary);
  margin-bottom: 10px;
  box-shadow: var(--shadow-light);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-primary);
}

.stat-value.pending {
  color: var(--danger-color);
}

.withdraw-list {
  padding: 0 12px;
}

.withdraw-card {
  background: var(--bg-primary);
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-light);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-light);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-detail {
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.mobile {
  font-size: 12px;
  color: var(--text-muted);
}

.status-badge {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
}

.status-badge.pending {
  background: var(--warning-light);
  color: var(--warning-color);
}

.status-badge.approved {
  background: var(--success-light);
  color: var(--success-color);
}

.status-badge.rejected {
  background: var(--danger-light);
  color: var(--danger-color);
}

.card-body {
  padding: 12px 16px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.amount-row .label {
  font-size: 13px;
  color: var(--text-secondary);
}

.amount-row .amount {
  font-size: 22px;
  font-weight: bold;
  color: var(--danger-color);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.info-row .label {
  font-size: 13px;
  color: var(--text-secondary);
}

.info-row .value {
  font-size: 13px;
  color: var(--text-primary);
}

.qr-thumb {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}

.time-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0 0;
  border-top: 1px solid var(--border-light);
  margin-top: 6px;
}

.time-row .label {
  font-size: 12px;
  color: var(--text-muted);
}

.time-row .value {
  font-size: 12px;
  color: var(--text-muted);
}

.card-footer {
  display: flex;
  border-top: 1px solid var(--border-light);
}

.reject-btn, .approve-btn {
  flex: 1;
  padding: 14px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.reject-btn {
  color: var(--danger-color);
  border-right: 1px solid var(--border-light);
}

.approve-btn {
  color: var(--success-color);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  color: var(--text-muted);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 16px;
}

.page-btn {
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.page-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: var(--text-secondary);
}

.reject-modal {
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

.modal-content {
  width: 300px;
  background: var(--bg-primary);
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-light);
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  font-size: 24px;
  color: var(--text-muted);
  cursor: pointer;
}

.modal-body {
  padding: 16px;
}

.modal-body textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  box-sizing: border-box;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.modal-footer {
  display: flex;
  border-top: 1px solid var(--border-light);
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 14px;
  text-align: center;
  font-size: 14px;
  cursor: pointer;
}

.cancel-btn {
  color: var(--text-secondary);
  border-right: 1px solid var(--border-light);
}

.confirm-btn {
  color: var(--danger-color);
}
</style>