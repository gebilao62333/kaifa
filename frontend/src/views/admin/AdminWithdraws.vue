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
    <table class="data-table">
      <thead><tr><th>ID</th><th>用户ID</th><th>提现金额</th><th>手续费</th><th>实付</th><th>方式</th><th>状态</th><th>申请时间</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="w in list" :key="w.id">
          <td>{{ w.id }}</td>
          <td>{{ w.userId }}</td>
          <td>¥{{ w.amount || 0 }}</td>
          <td>¥{{ w.fee || 0 }}</td>
          <td>¥{{ w.actualPay || 0 }}</td>
          <td>{{ w.withdrawType || w.type || '-' }}</td>
          <td><span :class="['status-tag', withdrawStatusClass(w.auditStatus || w.status)]">{{ withdrawStatusText(w.auditStatus || w.status) }}</span></td>
          <td>{{ formatTime(w.createTime) }}</td>
          <td>
            <button class="btn-sm" @click="viewDetail(w)">查看</button>
            <button class="btn-sm success" v-if="(w.auditStatus || w.status) === 0" @click="approve(w)">通过</button>
            <button class="btn-sm warn" v-if="(w.auditStatus || w.status) === 0" @click="reject(w)">拒绝</button>
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
const withdrawStatusMap = { 0: '待审核', 1: '已通过', 2: '已拒绝' }
const withdrawStatusText = (s) => withdrawStatusMap[s] || '未知'
const withdrawStatusClass = (s) => ({ 0: 'pending', 1: 'success', 2: 'cancelled' }[s] || 'pending')
const loadList = async () => {
  try {
    const res = await adminService.getWithdraws({ page: page.value, pageSize: pageSize.value, status: filterStatus.value || undefined })
    if (res.code === 200 || res.code === 0) { list.value = res.data.list || res.data || []; total.value = res.data.pagination?.total || list.value.length }
  } catch (e) { console.error(e) }
}
const viewDetail = (w) => { alert(`提现详情:\nID: ${w.id}\n用户: ${w.userId}\n金额: ¥${w.amount}\n手续费: ¥${w.fee || 0}\n实付: ¥${w.actualPay || 0}`) }
const approve = async (w) => { try { await adminService.approveWithdraw(w.id); loadList() } catch (e) { console.error(e) } }
const reject = async (w) => { const r = prompt('拒绝原因(可选):'); try { await adminService.rejectWithdraw(w.id, r || ''); loadList() } catch (e) { console.error(e) } }
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
