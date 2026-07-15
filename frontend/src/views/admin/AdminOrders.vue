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
    <table class="data-table">
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import adminService from '../../services/adminService'
import { useAdminApi } from '../../composables/useAdminApi'
const { page, pageSize, total, totalPages, searchKeyword, filterStatus, formatTime } = useAdminApi()
const list = ref([])

const orderStatusText = (s) => ({ 0: '待接单', 1: '进行中', 2: '已完成', 3: '已取消' }[s] || '未知')
const orderStatusClass = (s) => ({ 0: 'pending', 1: 'active', 2: 'success', 3: 'cancelled' }[s] || 'pending')

const loadList = async () => {
  try {
    const res = await adminService.getOrders({ page: page.value, pageSize: pageSize.value, orderNo: searchKeyword.value || undefined, status: filterStatus.value || undefined })
    if (res.code === 200 || res.code === 0) { list.value = res.data.list || res.data || []; total.value = res.data.pagination?.total || list.value.length }
  } catch (e) { console.error(e) }
}
const viewDetail = (o) => { alert(`订单详情:\nID: ${o.id}\n订单号: ${o.orderNo || o.id}\n用户: ${o.userId}\n金额: ¥${o.amount}\n状态: ${orderStatusText(o.status)}`) }
const cancelOrder = async (o) => { if (!confirm('确定取消该订单?')) return; try { await adminService.updateOrderStatus(o.id, 3); loadList() } catch (e) { console.error(e) } }
const deleteOrder = async (o) => { if (!confirm('确定删除该订单?')) return; try { await adminService.deleteOrder(o.id); loadList() } catch (e) { console.error(e) } }

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
</style>
