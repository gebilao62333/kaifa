<template>
  <div>
    <div class="page-actions">
      <input v-model="searchKeyword" placeholder="搜索用户ID..." class="search-input" @keyup.enter="loadList" />
      <select v-model="filterStatus" class="status-select" @change="loadList">
        <option value="">全部状态</option>
        <option value="success">成功</option>
        <option value="pending">待支付</option>
        <option value="failed">失败</option>
      </select>
    </div>
    <table class="data-table">
      <thead><tr><th>ID</th><th>订单号</th><th>用户ID</th><th>金额</th><th>支付方式</th><th>状态</th><th>时间</th></tr></thead>
      <tbody>
        <tr v-for="r in list" :key="r.id">
          <td>{{ r.id }}</td>
          <td>{{ r.orderNo || r.id }}</td>
          <td>{{ r.userId }}</td>
          <td>¥{{ r.amount || 0 }}</td>
          <td>{{ r.paymentMethod || r.payType || '-' }}</td>
          <td><span :class="['status-tag', rechargeStatusClass(r.status)]">{{ rechargeStatusText(r.status) }}</span></td>
          <td>{{ formatTime(r.createTime) }}</td>
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
const { page, pageSize, total, totalPages, searchKeyword, filterStatus, formatTime } = useAdminApi()
const list = ref([])
const rechargeStatusMap = { success: '成功', pending: '待支付', failed: '失败' }
const rechargeStatusText = (s) => rechargeStatusMap[s] || s || '未知'
const rechargeStatusClass = (s) => ({ success: 'success', pending: 'pending', failed: 'cancelled' }[s] || 'pending')
const loadList = async () => {
  try {
    const res = await adminService.getRechargeRecords({ page: page.value, pageSize: pageSize.value, userId: searchKeyword.value || undefined, status: filterStatus.value || undefined })
    if (res.code === 200 || res.code === 0) { list.value = res.data.list || res.data || []; total.value = res.data.pagination?.total || list.value.length }
  } catch (e) { console.error(e) }
}
onMounted(loadList)
</script>

<style scoped>
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; }
.search-input { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; width: 200px; }
.status-select { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.data-table th { text-align: left; padding: 12px; background: #fafafa; color: #666; font-size: 13px; font-weight: 600; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-tag.success { background: #f6ffed; color: #52c41a; }
.status-tag.pending { background: #fff7e6; color: #fa8c16; }
.status-tag.cancelled { background: #fff1f0; color: #ff4d4f; }
.pagination { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 16px; font-size: 13px; color: #666; }
.pagination button { padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
