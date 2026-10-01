<template>
  <div>
    <div class="page-actions">
      <select v-model="filterStatus" class="status-select" @change="loadList">
        <option value="">全部状态</option>
        <option value="0">待处理</option>
        <option value="1">已处理</option>
        <option value="2">已驳回</option>
      </select>
    </div>

    <div v-if="loading" class="loading-wrap"><div class="spinner"></div><span>加载中...</span></div>

    <table class="data-table" v-else>
      <thead><tr><th>ID</th><th>举报人</th><th>类型</th><th>目标ID</th><th>原因</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="r in list" :key="r.id">
          <td>{{ r.id }}</td>
          <td>{{ r.reporterId }}</td>
          <td>{{ r.targetType || '-' }}</td>
          <td>{{ r.targetId || '-' }}</td>
          <td>{{ r.reason || '-' }}</td>
          <td><span :class="['status-tag', reportStatusClass(r.status)]">{{ reportStatusText(r.status) }}</span></td>
          <td>{{ formatTime(r.createTime) }}</td>
          <td>
            <button class="btn-sm" @click="viewReport(r)">查看</button>
            <button class="btn-sm success" v-if="r.status === 0" @click="handle(r, 1)">处理</button>
            <button class="btn-sm warn" v-if="r.status === 0" @click="handle(r, 2)">驳回</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination" v-if="!loading">
      <button :disabled="page <= 1" @click="page--; loadList()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页 (共 {{ total }} 条)</span>
      <button :disabled="page >= totalPages" @click="page++; loadList()">下一页</button>
    </div>

    <!-- 举报详情弹窗 -->
    <div class="modal-overlay" v-if="showDetail" @click.self="showDetail = false">
      <div class="detail-modal">
        <div class="detail-header">
          <h3>举报详情</h3>
          <button class="close-btn" @click="showDetail = false">&times;</button>
        </div>
        <div class="detail-body">
          <div class="detail-row"><span class="detail-label">举报ID</span><span>{{ detailItem.id }}</span></div>
          <div class="detail-row"><span class="detail-label">举报人</span><span>{{ detailItem.reporterId }}</span></div>
          <div class="detail-row"><span class="detail-label">类型</span><span>{{ detailItem.targetType || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">目标ID</span><span>{{ detailItem.targetId || '-' }}</span></div>
          <div class="detail-row detail-content"><span class="detail-label">原因</span><span>{{ detailItem.reason || '-' }}</span></div>
          <div class="detail-row" v-if="detailItem.description"><span class="detail-label">详细描述</span><span>{{ detailItem.description }}</span></div>
          <div class="detail-row"><span class="detail-label">状态</span><span :class="['status-tag', reportStatusClass(detailItem.status)]">{{ reportStatusText(detailItem.status) }}</span></div>
          <div class="detail-row"><span class="detail-label">举报时间</span><span>{{ formatTime(detailItem.createTime) }}</span></div>
        </div>
        <div class="detail-footer">
          <button class="btn-primary" @click="showDetail = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import adminService from '../../services/adminService'
import { useAdminApi } from '../../composables/useAdminApi'
import { useToast } from '../../composables/useToast'
const { page, pageSize, total, totalPages, filterStatus, formatTime } = useAdminApi()
const toast = useToast()
const list = ref([])
const loading = ref(false)
const showDetail = ref(false)
const detailItem = ref({})
const reportStatusMap = { 0: '待处理', 1: '已处理', 2: '已驳回' }
const reportStatusText = (s) => reportStatusMap[s] || '未知'
const reportStatusClass = (s) => ({ 0: 'pending', 1: 'success', 2: 'cancelled' }[s] || 'pending')
const loadList = async () => {
  loading.value = true
  try {
    const res = await adminService.getReports({ page: page.value, pageSize: pageSize.value, status: filterStatus.value || undefined })
    if (res.code === 200 || res.code === 0) { list.value = res.data.list || res.data || []; total.value = res.data.pagination?.total || list.value.length }
  } catch (e) { toast.error('加载失败: ' + (e.message || '网络错误')) }
  finally { loading.value = false }
}
const viewReport = (r) => { detailItem.value = r; showDetail.value = true }
const handle = async (r, status) => {
  const action = status === 1 ? 'resolved' : 'rejected'
  const actionText = status === 1 ? '处理' : '驳回'
  if (!confirm(`确定${actionText}该举报？`)) return
  try {
    await adminService.handleReport(r.id, action)
    toast.success(`已${actionText}该举报`)
    loadList()
  } catch (e) { toast.error('操作失败: ' + (e.message || '网络错误')) }
}
onMounted(loadList)
</script>

<style scoped>
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; }
.status-select { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.data-table th { text-align: left; padding: 12px; background: #fafafa; color: #666; font-size: 13px; font-weight: 600; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-tag.pending { background: #fff7e6; color: #fa8c16; }
.status-tag.success { background: #f6ffed; color: #52c41a; }
.status-tag.cancelled { background: #fff1f0; color: #ff4d4f; }
.btn-sm { padding: 4px 10px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px; margin-right: 4px; }
.btn-sm.success { color: #52c41a; border-color: #52c41a; }
.btn-sm.warn { color: #fa8c16; border-color: #fa8c16; }
.pagination { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 16px; font-size: 13px; color: #666; }
.pagination button { padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: #999; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #f0f0f0; border-top-color: #1890ff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.detail-modal { background: #fff; border-radius: 12px; width: 520px; max-height: 80vh; overflow-y: auto; box-shadow: 0 8px 40px rgba(0,0,0,0.12); }
.detail-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.detail-header h3 { font-size: 18px; font-weight: 600; color: #1a1a1a; }
.detail-body { padding: 20px 24px; }
.detail-row { display: flex; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.detail-row:last-child { border-bottom: none; }
.detail-content span:last-child { white-space: pre-wrap; line-height: 1.6; }
.detail-label { width: 80px; font-size: 13px; color: #999; flex-shrink: 0; }
.detail-row > span:last-child { font-size: 14px; color: #333; }
.detail-footer { padding: 16px 24px; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; }
.detail-footer .btn-primary { padding: 8px 28px; background: #1890ff; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.close-btn { background: none; border: none; font-size: 24px; color: #999; cursor: pointer; padding: 0; line-height: 1; }
.close-btn:hover { color: #333; }
</style>
