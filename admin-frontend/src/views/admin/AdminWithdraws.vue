<template>
  <div>
    <div class="page-actions">
      <select v-model="filterStatus" class="status-select" @change="loadList">
        <option value="">全部状态</option>
        <option value="pending">待处理</option>
        <option value="approved">已通过</option>
        <option value="rejected">已拒绝</option>
      </select>
    </div>

    <div v-if="loading" class="loading-wrap"><div class="spinner"></div><span>加载中...</span></div>

    <table class="data-table" v-else>
      <thead><tr><th>ID</th><th>用户ID</th><th>用户名</th><th>提现金额</th><th>手续费</th><th>实付</th><th>方式</th><th>状态</th><th>申请时间</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="w in list" :key="w.id">
          <td>{{ w.id }}</td>
          <td>{{ w.userId }}</td>
          <td>{{ w.username || w.nickname || '-' }}</td>
          <td>¥{{ w.amount || 0 }}</td>
          <td>¥{{ w.fee || 0 }}</td>
          <td>¥{{ w.actualPay || 0 }}</td>
          <td>{{ w.withdrawType || w.type || '-' }}</td>
          <td><span :class="['status-tag', withdrawStatusClass(w.auditStatus)]">{{ withdrawStatusText(w.auditStatus) }}</span></td>
          <td>{{ formatTime(w.createTime) }}</td>
          <td>
            <button class="btn-sm" @click="viewDetail(w)">查看</button>
            <button class="btn-sm success" v-if="w.auditStatus === 0" @click="approve(w)">通过</button>
            <button class="btn-sm warn" v-if="w.auditStatus === 0" @click="openReject(w)">拒绝</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination" v-if="!loading">
      <button :disabled="page <= 1" @click="page--; loadList()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页 (共 {{ total }} 条)</span>
      <button :disabled="page >= totalPages" @click="page++; loadList()">下一页</button>
    </div>

    <!-- 提现详情弹窗 -->
    <div class="modal-overlay" v-if="showDetail" @click.self="showDetail = false">
      <div class="detail-modal">
        <div class="detail-header">
          <h3>提现详情</h3>
          <button class="close-btn" @click="showDetail = false">&times;</button>
        </div>
        <div class="detail-body">
          <div class="loading-wrap" v-if="detailLoading" style="padding: 30px"><div class="spinner"></div><span>加载详情...</span></div>
          <template v-else>
          <div class="detail-row"><span class="detail-label">提现ID</span><span>{{ detailItem.id }}</span></div>
          <div class="detail-row"><span class="detail-label">用户ID</span><span>{{ detailItem.userId }}</span></div>
          <div class="detail-row"><span class="detail-label">用户名</span><span>{{ detailItem.username || detailItem.nickname || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">提现金额</span><span class="price">¥{{ detailItem.amount || 0 }}</span></div>
          <div class="detail-row"><span class="detail-label">手续费</span><span>¥{{ detailItem.fee || 0 }}</span></div>
          <div class="detail-row"><span class="detail-label">实付金额</span><span class="price">¥{{ detailItem.actualPay || 0 }}</span></div>
          <div class="detail-row"><span class="detail-label">提现方式</span><span>{{ detailItem.withdrawType || detailItem.type || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">收款账号</span><span>{{ detailItem.account || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">开户行</span><span>{{ detailItem.bank || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">收款姓名</span><span>{{ detailItem.name || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">联系电话</span><span>{{ detailItem.mobile || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">状态</span><span :class="['status-tag', withdrawStatusClass(detailItem.auditStatus)]">{{ withdrawStatusText(detailItem.auditStatus) }}</span></div>
          <div class="detail-row"><span class="detail-label">备注</span><span>{{ detailItem.remark || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">申请时间</span><span>{{ formatTime(detailItem.createTime) }}</span></div>
          <div class="detail-row" v-if="detailItem.handleTime"><span class="detail-label">处理时间</span><span>{{ formatTime(detailItem.handleTime) }}</span></div>
          </template>
        </div>
        <div class="detail-footer">
          <button class="btn-primary" @click="showDetail = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- 拒绝原因弹窗 -->
    <div class="modal-overlay" v-if="showReject" @click.self="showReject = false">
      <div class="detail-modal reject-modal">
        <div class="detail-header">
          <h3>拒绝提现</h3>
          <button class="close-btn" @click="showReject = false">&times;</button>
        </div>
        <div class="detail-body">
          <div class="detail-row"><span class="detail-label">提现ID</span><span>{{ rejectItem.id }}</span></div>
          <div class="detail-row"><span class="detail-label">用户ID</span><span>{{ rejectItem.userId }}</span></div>
          <div class="detail-row"><span class="detail-label">金额</span><span class="price">¥{{ rejectItem.amount || 0 }}</span></div>
          <div class="form-group">
            <label>拒绝原因</label>
            <textarea v-model="rejectReason" placeholder="请输入拒绝原因（可选）" rows="3"></textarea>
          </div>
        </div>
        <div class="detail-footer">
          <button class="btn-cancel" @click="showReject = false">取消</button>
          <button class="btn-danger" @click="doReject">确认拒绝</button>
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
const withdrawStatusMap = { 0: '待审核', 1: '已通过', 2: '已拒绝' }
const withdrawStatusText = (s) => withdrawStatusMap[s] || '未知'
const withdrawStatusClass = (s) => ({ 0: 'pending', 1: 'success', 2: 'cancelled' }[s] || 'pending')
const loadList = async () => {
  loading.value = true
  try {
    const res = await adminService.getWithdraws({ page: page.value, pageSize: pageSize.value, status: filterStatus.value || undefined })
    if (res.code === 200 || res.code === 0) { list.value = res.data.list || res.data || []; total.value = res.data.pagination?.total || list.value.length }
  } catch (e) { toast.error('加载失败: ' + (e.message || '网络错误')) }
  finally { loading.value = false }
}
const showDetail = ref(false)
const detailItem = ref({})
const detailLoading = ref(false)
const viewDetail = async (w) => {
  detailLoading.value = true
  showDetail.value = true
  try {
    const res = await adminService.getWithdrawDetail(w.id)
    if (res.code === 200 || res.code === 0) {
      detailItem.value = res.data
    } else {
      // 兜底使用列表数据
      detailItem.value = w
    }
  } catch (e) {
    detailItem.value = w
  } finally {
    detailLoading.value = false
  }
}
const approve = async (w) => {
  if (!confirm('确定通过该提现申请？')) return
  try {
    await adminService.approveWithdraw(w.id)
    toast.success('提现申请已通过')
    loadList()
  } catch (e) { toast.error('操作失败: ' + (e.message || '网络错误')) }
}
const showReject = ref(false)
const rejectItem = ref({})
const rejectReason = ref('')
const openReject = (w) => { rejectItem.value = w; rejectReason.value = ''; showReject.value = true }
const doReject = async () => {
  try {
    await adminService.rejectWithdraw(rejectItem.value.id, rejectReason.value || '')
    toast.success('提现申请已拒绝')
    showReject.value = false
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
.reject-modal { width: 460px; }
.detail-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.detail-header h3 { font-size: 18px; font-weight: 600; color: #1a1a1a; }
.detail-body { padding: 20px 24px; }
.detail-row { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.detail-row:last-child { border-bottom: none; }
.detail-label { width: 100px; font-size: 13px; color: #999; flex-shrink: 0; }
.detail-row > span:last-child { font-size: 14px; color: #333; }
.detail-row .price { color: #ff4d4f; font-weight: 600; font-size: 16px; }
.form-group { margin-top: 16px; }
.form-group label { display: block; font-size: 13px; color: #666; margin-bottom: 6px; }
.form-group textarea { width: 100%; padding: 10px; border: 1px solid #d9d9d9; border-radius: 6px; font-size: 13px; resize: vertical; }
.form-group textarea:focus { outline: none; border-color: #1890ff; }
.detail-footer { padding: 16px 24px; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; gap: 10px; }
.detail-footer .btn-primary { padding: 8px 28px; background: #1890ff; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.detail-footer .btn-cancel { padding: 8px 20px; background: #fff; color: #666; border: 1px solid #d9d9d9; border-radius: 6px; cursor: pointer; font-size: 14px; }
.detail-footer .btn-danger { padding: 8px 20px; background: #ff4d4f; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.close-btn { background: none; border: none; font-size: 24px; color: #999; cursor: pointer; padding: 0; line-height: 1; }
.close-btn:hover { color: #333; }
</style>
