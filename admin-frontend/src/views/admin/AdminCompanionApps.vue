<template>
  <div>
    <div class="page-actions">
      <select v-model="filterStatus" class="status-select" @change="loadList">
        <option value="">全部状态</option>
        <option value="0">未申请</option>
        <option value="1">审核中</option>
        <option value="2">已通过</option>
      </select>
    </div>

    <div v-if="loading" class="loading-wrap"><div class="spinner"></div><span>加载中...</span></div>

    <table class="data-table" v-else>
      <thead><tr><th>ID</th><th>用户ID</th><th>游戏</th><th>价格</th><th>接单数</th><th>评分</th><th>状态</th><th>申请时间</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="a in list" :key="a.id">
          <td>{{ a.id }}</td>
          <td>{{ a.userId }}</td>
          <td>{{ a.gameName || '-' }}</td>
          <td>¥{{ a.servicePrice || a.price || 0 }}</td>
          <td>{{ a.totalOrders || 0 }}</td>
          <td>⭐{{ a.rating || 0 }}</td>
          <td><span :class="['status-tag', appStatusClass(a.status)]">{{ appStatusText(a.status) }}</span></td>
          <td>{{ formatTime(a.createTime) }}</td>
          <td>
            <button class="btn-sm" @click="viewApp(a)">查看</button>
            <button class="btn-sm success" v-if="a.status === 1" @click="approve(a)">通过</button>
            <button class="btn-sm warn" v-if="a.status === 1" @click="reject(a)">拒绝</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination" v-if="!loading">
      <button :disabled="page <= 1" @click="page--; loadList()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页 (共 {{ total }} 条)</span>
      <button :disabled="page >= totalPages" @click="page++; loadList()">下一页</button>
    </div>

    <!-- 详情弹窗 -->
    <div class="modal-overlay" v-if="showDetail" @click.self="showDetail = false">
      <div class="detail-modal">
        <div class="detail-header">
          <h3>陪玩申请详情</h3>
          <button class="close-btn" @click="showDetail = false">&times;</button>
        </div>
        <div class="detail-body">
          <div class="detail-row"><span class="detail-label">申请ID</span><span>{{ detailItem.id }}</span></div>
          <div class="detail-row"><span class="detail-label">用户ID</span><span>{{ detailItem.userId }}</span></div>
          <div class="detail-row"><span class="detail-label">游戏</span><span>{{ detailItem.gameName || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">价格</span><span class="price">¥{{ detailItem.servicePrice || detailItem.price || 0 }}</span></div>
          <div class="detail-row"><span class="detail-label">接单数</span><span>{{ detailItem.totalOrders || 0 }}</span></div>
          <div class="detail-row"><span class="detail-label">评分</span><span>⭐{{ detailItem.rating || 0 }}</span></div>
          <div class="detail-row"><span class="detail-label">简介</span><span>{{ detailItem.description || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">状态</span><span :class="['status-tag', appStatusClass(detailItem.status)]">{{ appStatusText(detailItem.status) }}</span></div>
          <div class="detail-row"><span class="detail-label">申请时间</span><span>{{ formatTime(detailItem.createTime) }}</span></div>
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
const appStatusText = (s) => ({ 0: '未申请', 1: '审核中', 2: '已通过' }[s] || '未知')
const appStatusClass = (s) => ({ 0: 'disabled', 1: 'pending', 2: 'success' }[s] || 'disabled')
const loadList = async () => {
  loading.value = true
  try {
    const res = await adminService.getCompanionApplications({ page: page.value, pageSize: pageSize.value, status: filterStatus.value || undefined })
    if (res.code === 200 || res.code === 0) { list.value = res.data.list || res.data || []; total.value = res.data.pagination?.total || list.value.length }
  } catch (e) { toast.error('加载失败: ' + (e.message || '网络错误')) }
  finally { loading.value = false }
}
const viewApp = (a) => { detailItem.value = a; showDetail.value = true }
const approve = async (a) => {
  try {
    await adminService.approveCompanionApplication(a.id)
    toast.success('已通过该申请')
    loadList()
  } catch (e) { toast.error('操作失败: ' + (e.message || '网络错误')) }
}
const reject = async (a) => {
  if (!confirm('确定拒绝该申请？')) return
  try {
    await adminService.rejectCompanionApplication(a.id)
    toast.success('已拒绝该申请')
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
.status-tag.success { background: #f6ffed; color: #52c41a; }
.status-tag.pending { background: #fff7e6; color: #fa8c16; }
.status-tag.disabled { background: #fff1f0; color: #ff4d4f; }
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
.detail-row { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.detail-row:last-child { border-bottom: none; }
.detail-label { width: 100px; font-size: 13px; color: #999; flex-shrink: 0; }
.detail-row > span:last-child { font-size: 14px; color: #333; }
.detail-row .price { color: #ff4d4f; font-weight: 600; font-size: 16px; }
.detail-footer { padding: 16px 24px; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; }
.detail-footer .btn-primary { padding: 8px 28px; background: #1890ff; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.close-btn { background: none; border: none; font-size: 24px; color: #999; cursor: pointer; padding: 0; line-height: 1; }
.close-btn:hover { color: #333; }
</style>
