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
    <table class="data-table">
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
const appStatusText = (s) => ({ 0: '未申请', 1: '审核中', 2: '已通过' }[s] || '未知')
const appStatusClass = (s) => ({ 0: 'disabled', 1: 'pending', 2: 'success' }[s] || 'disabled')
const loadList = async () => {
  try {
    const res = await adminService.getCompanionApplications({ page: page.value, pageSize: pageSize.value, status: filterStatus.value || undefined })
    if (res.code === 200 || res.code === 0) { list.value = res.data.list || res.data || []; total.value = res.data.pagination?.total || list.value.length }
  } catch (e) { console.error(e) }
}
const viewApp = (a) => { alert(`申请详情:\nID: ${a.id}\n用户: ${a.userId}\n游戏: ${a.gameName}\n状态: ${appStatusText(a.status)}`) }
const approve = async (a) => { try { await adminService.approveCompanionApplication(a.id); loadList() } catch (e) { console.error(e) } }
const reject = async (a) => { try { await adminService.rejectCompanionApplication(a.id); loadList() } catch (e) { console.error(e) } }
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
</style>
