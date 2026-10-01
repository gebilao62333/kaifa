<template>
  <div>
    <div class="page-actions">
      <input v-model="searchKeyword" placeholder="搜索订单号/用户ID..." class="search-input" @keyup.enter="loadList" />
      <select v-model="filterStatus" class="status-select" @change="loadList">
        <option value="">全部状态</option>
        <option value="0">待接单</option>
        <option value="1">进行中</option>
        <option value="2">已完成</option>
        <option value="3">已取消</option>
      </select>
    </div>
    <div v-if="loading" class="loading-wrap"><div class="spinner"></div><span>加载中...</span></div>
    <table class="data-table" v-else>
      <thead><tr><th>订单号</th><th>用户ID</th><th>陪玩师</th><th>游戏</th><th>金额</th><th>时长</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="o in list" :key="o.id">
          <td>{{ o.orderNo || o.id }}</td>
          <td>{{ o.userId }}</td>
          <td>{{ o.targetUserId || '-' }}</td>
          <td>{{ o.gameName || '-' }}</td>
          <td>¥{{ o.amount || o.price || 0 }}</td>
          <td>{{ o.hours || '-' }}h</td>
          <td><span :class="['status-tag', orderStatusClass(o.status)]">{{ orderStatusText(o.status) }}</span></td>
          <td>{{ formatTime(o.createTime) }}</td>
          <td>
            <button class="btn-sm" @click="viewDetail(o)">详情</button>
            <button class="btn-sm warn" v-if="o.status === 2" @click="cancelOrder(o)">取消</button>
            <button class="btn-sm danger" @click="deleteOrder(o)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <button :disabled="page <= 1" @click="page--; loadList()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页 (共 {{ total }} 条)</span>
      <button :disabled="page >= totalPages" @click="page++; loadList()">下一页</button>
    </div>

    <!-- 订单详情弹窗 -->
    <div class="modal-overlay" v-if="showDetail" @click.self="showDetail = false">
      <div class="detail-modal">
        <div class="detail-header">
          <h3>订单详情</h3>
          <button class="close-btn" @click="showDetail = false">&times;</button>
        </div>
        <div class="detail-body">
          <div class="detail-row"><span class="detail-label">订单号</span><span>{{ detailItem.orderNo || detailItem.id }}</span></div>
          <div class="detail-row"><span class="detail-label">用户ID</span><span>{{ detailItem.userId }}</span></div>
          <div class="detail-row"><span class="detail-label">陪玩师ID</span><span>{{ detailItem.targetUserId || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">游戏</span><span>{{ detailItem.gameName || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">金额</span><span class="price">¥{{ detailItem.amount || detailItem.price || 0 }}</span></div>
          <div class="detail-row"><span class="detail-label">时长</span><span>{{ detailItem.hours || '-' }}h</span></div>
          <div class="detail-row"><span class="detail-label">状态</span><span :class="['status-tag', orderStatusClass(detailItem.status)]">{{ orderStatusText(detailItem.status) }}</span></div>
          <div class="detail-row"><span class="detail-label">创建时间</span><span>{{ formatTime(detailItem.createTime) }}</span></div>
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
const { page, pageSize, total, totalPages, searchKeyword, filterStatus, formatTime } = useAdminApi()
const toast = useToast()
const list = ref([])
const loading = ref(false)
const showDetail = ref(false)
const detailItem = ref({})

const orderStatusText = (s) => ({ 0: '待接单', 1: '进行中', 2: '已完成', 3: '已取消' }[s] || '未知')
const orderStatusClass = (s) => ({ 0: 'pending', 1: 'active', 2: 'success', 3: 'cancelled' }[s] || 'pending')

const loadList = async () => {
  loading.value = true
  try {
    const res = await adminService.getOrders({ page: page.value, pageSize: pageSize.value, orderNo: searchKeyword.value || undefined, status: filterStatus.value || undefined })
    if (res.code === 200 || res.code === 0) { list.value = res.data.list || res.data || []; total.value = res.data.pagination?.total || list.value.length }
  } catch (e) { toast.error('加载失败: ' + (e.message || '网络错误')) }
  finally { loading.value = false }
}
const viewDetail = (o) => { detailItem.value = o; showDetail.value = true }
const cancelOrder = async (o) => { if (!confirm('确定取消该订单?')) return; try { await adminService.updateOrderStatus(o.id, 3); toast.success('订单已取消'); loadList() } catch (e) { toast.error('操作失败: ' + (e.message || '网络错误')) } }
const deleteOrder = async (o) => { if (!confirm('确定删除该订单?')) return; try { await adminService.deleteOrder(o.id); toast.success('订单已删除'); loadList() } catch (e) { toast.error('删除失败: ' + (e.message || '网络错误')) } }

onMounted(loadList)
</script>

<style scoped>
.loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: #999; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #f0f0f0; border-top-color: #1890ff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; }
.search-input { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; width: 200px; }
.status-select { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.data-table th { text-align: left; padding: 12px; background: #fafafa; color: #666; font-size: 13px; font-weight: 600; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-tag.pending { background: #fff7e6; color: #fa8c16; }
.status-tag.active { background: #e6f7ff; color: #1890ff; }
.status-tag.success { background: #f6ffed; color: #52c41a; }
.status-tag.cancelled { background: #fff1f0; color: #ff4d4f; }
.btn-sm { padding: 4px 10px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px; margin-right: 4px; }
.btn-sm.warn { color: #fa8c16; border-color: #fa8c16; }
.btn-sm.danger { color: #ff4d4f; border-color: #ff4d4f; }
.pagination { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 16px; font-size: 13px; color: #666; }
.pagination button { padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.detail-modal { background: #fff; border-radius: 12px; width: 520px; max-height: 80vh; overflow-y: auto; box-shadow: 0 8px 40px rgba(0,0,0,0.12); }
.detail-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.detail-header h3 { font-size: 18px; font-weight: 600; color: #1a1a1a; }
.close-btn { background: none; border: none; font-size: 24px; color: #999; cursor: pointer; padding: 0; line-height: 1; }
.close-btn:hover { color: #333; }
.detail-body { padding: 20px 24px; }
.detail-row { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.detail-row:last-child { border-bottom: none; }
.detail-label { width: 100px; font-size: 13px; color: #999; flex-shrink: 0; }
.detail-row > span:last-child { font-size: 14px; color: #333; }
.detail-row .price { color: #ff4d4f; font-weight: 600; font-size: 16px; }
.detail-footer { padding: 16px 24px; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; }
.detail-footer .btn-primary { padding: 8px 28px; background: #1890ff; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
</style>
