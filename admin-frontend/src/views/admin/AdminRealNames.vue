<template>
  <div>
    <div class="page-actions">
      <input v-model="searchKeyword" placeholder="搜索用户ID/昵称..." class="search-input" @keyup.enter="reload" />
      <select v-model="filterStatus" class="status-select" @change="reload">
        <option value="">待处理（审核中+已拒绝）</option>
        <option value="1">审核中</option>
        <option value="2">已认证</option>
        <option value="3">已拒绝</option>
      </select>
      <button class="btn-primary" @click="reload">刷新</button>
    </div>

    <div v-if="loading" class="loading-wrap"><div class="spinner"></div><span>加载中...</span></div>
    <table class="data-table" v-else>
      <thead>
        <tr><th>用户ID</th><th>用户</th><th>真实姓名</th><th>证件号</th><th>状态</th><th>提交时间</th><th>操作</th></tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.userId">
          <td>{{ item.userId }}</td>
          <td class="user-cell">
            <img :src="item.avatar || defaultAvatar" class="user-avatar-small" />
            <span>{{ item.nickname || '-' }}</span>
          </td>
          <td>{{ item.realName || '-' }}</td>
          <td>{{ item.idCard || '-' }}</td>
          <td><span :class="['status-tag', statusClass(item.status)]">{{ statusText(item.status) }}</span></td>
          <td>{{ item.submitTime ? formatTime(item.submitTime * 1000) : '-' }}</td>
          <td class="actions-cell">
            <button class="btn-sm" @click="viewDetail(item)">查看</button>
            <template v-if="canWrite && isReviewable(item.status)">
              <button class="btn-sm success" :disabled="submitting" @click="review(item, 'approve')">通过</button>
              <button class="btn-sm danger" :disabled="submitting" @click="review(item, 'reject')">拒绝</button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button :disabled="page <= 1" @click="page--; loadList()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页 (共 {{ total }} 条)</span>
      <button :disabled="page >= totalPages" @click="page++; loadList()">下一页</button>
    </div>

    <div class="modal-overlay" v-if="showDetail" @click.self="showDetail = false">
      <div class="detail-modal">
        <div class="detail-header">
          <h3>实名认证详情</h3>
          <button class="close-btn" @click="showDetail = false">&times;</button>
        </div>
        <div class="detail-body" v-if="detail">
          <div class="detail-row"><span class="detail-label">用户ID</span><span>{{ detail.userId }}</span></div>
          <div class="detail-row"><span class="detail-label">昵称</span><span>{{ detail.nickname || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">真实姓名</span><span>{{ detail.realName || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">证件号</span><span>{{ detail.idCard || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">当前状态</span><span>{{ statusText(detail.status) }}</span></div>
          <div class="detail-row"><span class="detail-label">提交时间</span><span>{{ detail.submitTime ? formatTime(detail.submitTime * 1000) : '-' }}</span></div>
          <div class="photo-section">
            <div class="photo-title">证件正反面</div>
            <div class="photo-row">
              <a v-if="detail.front" :href="detail.front" target="_blank" rel="noopener noreferrer">
                <img :src="detail.front" class="cert-photo" alt="身份证正面" />
              </a>
              <span v-else class="photo-empty">正面未上传</span>
              <a v-if="detail.back" :href="detail.back" target="_blank" rel="noopener noreferrer">
                <img :src="detail.back" class="cert-photo" alt="身份证反面" />
              </a>
              <span v-else class="photo-empty">反面未上传</span>
            </div>
          </div>
        </div>
        <div class="detail-footer" v-if="canWrite && detail && isReviewable(detail.status)">
          <button class="btn-reject" :disabled="submitting" @click="review(detail, 'reject')">拒绝</button>
          <button class="btn-primary" :disabled="submitting" @click="review(detail, 'approve')">通过并发放实名经验</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import adminService from '../../services/adminService'
import { useAdminApi } from '../../composables/useAdminApi'
import { useToast } from '../../composables/useToast'
import { hasPermission, readStoredAdmin } from '../../common/adminPermission'

const { page, pageSize, total, totalPages, searchKeyword, filterStatus, formatTime } = useAdminApi()
const toast = useToast()

const list = ref([])
const loading = ref(false)
const submitting = ref(false)
const showDetail = ref(false)
const detail = ref(null)
const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'

// A-2：本地权限预判（UI 前置），服务端 403 仍是最终边界
const canWrite = computed(() => hasPermission((readStoredAdmin() || {}).permissions, 'user:write'))

// xn_user.real_name_status：0 未认证 / 1 审核中 / 2 已认证 / 3 已拒绝
const STATUS_TEXT = { 0: '未认证', 1: '审核中', 2: '已认证', 3: '已拒绝' }
const STATUS_CLASS = { 0: 'disabled', 1: 'pending', 2: 'active', 3: 'rejected' }
const statusText = (s) => STATUS_TEXT[s] || '未知'
const statusClass = (s) => STATUS_CLASS[s] || 'disabled'
const isReviewable = (s) => s === 1 || s === 3

const loadList = async () => {
  loading.value = true
  try {
    const res = await adminService.getRealNameList({
      page: page.value,
      pageSize: pageSize.value,
      status: filterStatus.value,
      keyword: searchKeyword.value
    })
    if (res.code === 200 || res.code === 0) {
      list.value = (res.data && res.data.list) || []
      total.value = (res.data && res.data.pagination && res.data.pagination.total) || list.value.length
    }
  } catch (e) {
    toast.error('加载失败: ' + (e.message || '网络错误'))
  } finally {
    loading.value = false
  }
}

const reload = () => {
  if (page.value !== 1) page.value = 1
  else loadList()
}

const viewDetail = async (item) => {
  try {
    const res = await adminService.getRealNameDetail(item.userId)
    detail.value = (res && res.data) || item
    showDetail.value = true
  } catch (e) {
    toast.error('加载详情失败: ' + (e.message || '网络错误'))
  }
}

const review = async (item, action) => {
  if (submitting.value) return
  const label = action === 'approve' ? '通过' : '拒绝'
  if (!confirm(`确定要${label}用户 ${item.nickname || item.userId} 的实名认证吗？`)) return
  submitting.value = true
  try {
    const res = await adminService.reviewRealName(item.userId, action)
    const data = (res && res.data) || {}
    if (action === 'approve') {
      const expText = data.expGranted
        ? `，已发放实名经验 +${data.exp && data.exp.added ? data.exp.added : 100}`
        : '（经验发放失败，请检查日志）'
      toast.success('已通过实名认证' + expText)
    } else {
      toast.success('已拒绝该实名认证')
    }
    showDetail.value = false
    loadList()
  } catch (e) {
    toast.error(label + '失败: ' + (e.message || '网络错误'))
  } finally {
    submitting.value = false
  }
}

watch([page], () => loadList())
onMounted(loadList)
</script>

<style scoped>
.loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: #999; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #f0f0f0; border-top-color: #1890ff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }
.search-input { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; width: 200px; }
.status-select { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; }
.btn-primary { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-sm { padding: 4px 10px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px; margin-right: 4px; }
.btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-sm.success { color: #52c41a; border-color: #52c41a; }
.btn-sm.danger { color: #ff4d4f; border-color: #ff4d4f; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.data-table th { text-align: left; padding: 12px; background: #fafafa; color: #666; font-size: 13px; font-weight: 600; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.user-cell { display: flex; align-items: center; gap: 8px; }
.user-avatar-small { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; background: #f5f5f5; color: #999; }
.status-tag.pending { background: #fffbe6; color: #fa8c16; }
.status-tag.active { background: #f6ffed; color: #52c41a; }
.status-tag.rejected { background: #fff1f0; color: #ff4d4f; }
.status-tag.disabled { background: #f5f5f5; color: #999; }
.actions-cell { white-space: nowrap; }
.pagination { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 16px; font-size: 13px; color: #666; }
.pagination button { padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 200; }
.detail-modal { background: #fff; border-radius: 12px; width: 560px; max-height: 85vh; overflow-y: auto; box-shadow: 0 8px 40px rgba(0,0,0,0.12); }
.detail-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.detail-header h3 { font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 0; }
.close-btn { background: none; border: none; font-size: 24px; color: #999; cursor: pointer; padding: 0; line-height: 1; }
.close-btn:hover { color: #333; }
.detail-body { padding: 20px 24px; }
.detail-row { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.detail-row:last-child { border-bottom: none; }
.detail-label { width: 100px; font-size: 13px; color: #999; flex-shrink: 0; }
.detail-row > span:last-child { font-size: 14px; color: #333; }
.photo-section { padding-top: 12px; }
.photo-title { font-size: 13px; color: #999; margin-bottom: 8px; }
.photo-row { display: flex; gap: 12px; flex-wrap: wrap; }
.cert-photo { width: 220px; max-height: 150px; object-fit: cover; border: 1px solid #eee; border-radius: 6px; }
.photo-empty { font-size: 13px; color: #bbb; }
.detail-footer { padding: 16px 24px; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; gap: 12px; }
.btn-reject { padding: 8px 20px; border: 1px solid #ff4d4f; color: #ff4d4f; background: #fff; border-radius: 6px; cursor: pointer; }
.btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }
.detail-footer .btn-primary { border-radius: 6px; }
</style>
