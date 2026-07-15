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
    <table class="data-table">
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
    <div class="pagination">
      <button :disabled="page <= 1" @click="page--; loadList()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页 (共 {{ total }} 条)</span>
      <button :disabled="page >= totalPages" @click="page++; loadList()">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import adminService from '../../services/adminService'
import { useAdminApi } from '../../composables/useAdminApi'
const { page, pageSize, total, totalPages, filterStatus, formatTime } = useAdminApi()
const list = ref([])
const reportStatusMap = { 0: '待处理', 1: '已处理', 2: '已驳回' }
const reportStatusText = (s) => reportStatusMap[s] || '未知'
const reportStatusClass = (s) => ({ 0: 'pending', 1: 'success', 2: 'cancelled' }[s] || 'pending')
const loadList = async () => {
  try {
    const res = await adminService.getReports({ page: page.value, pageSize: pageSize.value, status: filterStatus.value || undefined })
    if (res.code === 200 || res.code === 0) { list.value = res.data.list || res.data || []; total.value = res.data.pagination?.total || list.value.length }
  } catch (e) { console.error(e) }
}
const viewReport = (r) => { alert(`举报详情:\nID: ${r.id}\n举报人: ${r.reporterId}\n类型: ${r.targetType}\n目标ID: ${r.targetId}\n原因: ${r.reason}`) }
const handle = async (r, status) => { const action = status === 1 ? 'resolved' : 'rejected'; try { await adminService.handleReport(r.id, action); loadList() } catch (e) { console.error(e) } }
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
</style>
