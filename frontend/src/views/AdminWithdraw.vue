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
        <span class="stat-value">¥{{ todayAmount }}</span>
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
            <span class="amount">¥{{ item.money.toFixed(2) }}</span>
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
      <span class="page-info">{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
      <span class="page-btn" @click="nextPage" :class="{ disabled: page >= Math.ceil(total / pageSize) }">下一页</span>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

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

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const previewImage = (url) => {
  window.open(url)
}

const fetchList = async () => {
  try {
    const host = (window.globalData?.host) || 'https://api.your-domain.com'
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || ''

    const params = new URLSearchParams()
    if (filterStatus.value !== -1) {
      params.append('isCheck', filterStatus.value)
    }
    params.append('page', page.value)
    params.append('pageSize', pageSize.value)

    const res = await fetch(`${host}/api/gift/admin/withdraw/list?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const result = await res.json()

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
    alert('获取数据失败')
  }
}

const approveItem = async (item) => {
  try {
    const host = (window.globalData?.host) || 'https://api.your-domain.com'
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || ''

    const res = await fetch(`${host}/api/gift/admin/withdraw/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        withdrawId: item.id
      })
    })

    const result = await res.json()

    if (result.code === 0) {
      alert('审核通过')
      fetchList()
    } else {
      alert(result.message || '操作失败')
    }
  } catch (error) {
    console.error('审核错误:', error)
    alert('网络错误')
  }
}

const showRejectModal = (item) => {
  currentItem.value = item
  rejectReason.value = ''
  showReject.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    alert('请输入拒绝原因')
    return
  }

  try {
    const host = (window.globalData?.host) || 'https://api.your-domain.com'
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || ''

    const res = await fetch(`${host}/api/gift/admin/withdraw/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        withdrawId: currentItem.value.id,
        reason: rejectReason.value
      })
    })

    const result = await res.json()

    if (result.code === 0) {
      alert('已拒绝')
      showReject.value = false
      fetchList()
    } else {
      alert(result.message || '操作失败')
    }
  } catch (error) {
    console.error('拒绝错误:', error)
    alert('网络错误')
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    fetchList()
  }
}

const nextPage = () => {
  if (page.value < Math.ceil(total.value / pageSize.value)) {
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
  background: #f5f5f5;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: white;
  border-bottom: 1px solid #eee;
}

.filter-item {
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
  background: #f5f5f5;
  cursor: pointer;
}

.filter-item.active {
  background: #667eea;
  color: white;
}

.stats-bar {
  display: flex;
  padding: 16px 20px;
  gap: 20px;
  background: white;
  margin-bottom: 10px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.stat-value.pending {
  color: #ff6b6b;
}

.withdraw-list {
  padding: 0 12px;
}

.withdraw-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
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
  color: #333;
}

.mobile {
  font-size: 12px;
  color: #999;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
}

.status-badge.pending {
  background: #fff7e6;
  color: #fa8c16;
}

.status-badge.approved {
  background: #e6f7ff;
  color: #1890ff;
}

.status-badge.rejected {
  background: #fff1f0;
  color: #ff4d4f;
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
  color: #666;
}

.amount-row .amount {
  font-size: 22px;
  font-weight: bold;
  color: #ff6b6b;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.info-row .label {
  font-size: 13px;
  color: #666;
}

.info-row .value {
  font-size: 13px;
  color: #333;
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
  border-top: 1px solid #f5f5f5;
  margin-top: 6px;
}

.time-row .label {
  font-size: 12px;
  color: #999;
}

.time-row .value {
  font-size: 12px;
  color: #999;
}

.card-footer {
  display: flex;
  border-top: 1px solid #f5f5f5;
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
  color: #ff4d4f;
  border-right: 1px solid #f5f5f5;
}

.approve-btn {
  color: #52c41a;
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
  color: #999;
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
  background: #667eea;
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
  color: #666;
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
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
  font-size: 15px;
  font-weight: 600;
}

.close-btn {
  font-size: 24px;
  color: #999;
  cursor: pointer;
}

.modal-body {
  padding: 16px;
}

.modal-body textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  box-sizing: border-box;
}

.modal-footer {
  display: flex;
  border-top: 1px solid #f5f5f5;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 14px;
  text-align: center;
  font-size: 14px;
  cursor: pointer;
}

.cancel-btn {
  color: #666;
  border-right: 1px solid #f5f5f5;
}

.confirm-btn {
  color: #ff4d4f;
}
</style>