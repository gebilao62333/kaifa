<template>
  <div class="order-list">
    <div class="page-header">
      <h2>订单管理</h2>
    </div>
    <div class="search-bar">
      <input v-model="searchKeyword" type="text" placeholder="搜索订单号" class="search-input" />
      <button @click="loadOrders" class="search-btn">搜索</button>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>订单号</th>
          <th>订单内容</th>
          <th>服务类型</th>
          <th>买家</th>
          <th>陪玩师</th>
          <th>金币</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orderList" :key="order.id || order.orderId">
          <td class="order-no-cell">{{ order.orderNo }}</td>
          <td>{{ order.gameName }}</td>
          <td><span :class="['service-type-tag', 'service-type-' + (order.type || 0)]">{{ order.typeText || '线上服务' }}</span></td>
          <td>{{ order.buyerName || '用户' + order.userId }}</td>
          <td>{{ order.sellerName || '用户' + order.targetId }}</td>
          <td>{{ order.totalPrice }} 金币</td>
          <td>
            <span :class="['order-status-badge', orderStatusClass(order.status)]">{{ orderStatusText(order.status) }}</span>
          </td>
          <td>{{ formatUnixTime(order.createTime) }}</td>
          <td>
            <button @click="viewOrderDetail(order)" class="action-btn">详情</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
    </div>

    <!-- 订单详情模态框 -->
    <div v-if="showOrderDetail" class="modal-overlay" @click.self="showOrderDetail = false">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h3>订单详情</h3>
          <button @click="showOrderDetail = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">订单号:</span>
            <span>{{ currentOrder?.orderNo || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">游戏名称:</span>
            <span>{{ currentOrder?.gameName || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">服务类型:</span>
            <span>{{ currentOrder?.typeText || '线上服务' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">买家:</span>
            <span>{{ currentOrder?.buyerName || '用户' + currentOrder?.userId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">陪玩师:</span>
            <span>{{ currentOrder?.sellerName || '用户' + currentOrder?.targetId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">金币:</span>
            <span>{{ currentOrder?.totalPrice || 0 }} 金币</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">状态:</span>
            <span :class="['order-status-badge', orderStatusClass(currentOrder?.status)]">{{ orderStatusText(currentOrder?.status) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">创建时间:</span>
            <span>{{ formatUnixTime(currentOrder?.createTime) }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showOrderDetail = false" class="cancel-btn">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()

const orderList = ref([])
const searchKeyword = ref('')
const currentOrder = ref(null)
const showOrderDetail = ref(false)

const formatUnixTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

const orderStatusText = (status) => {
  const map = {
    0: '待接单',
    1: '进行中',
    2: '已完成',
    3: '已取消',
    4: '已退款'
  }
  return map[status] || '未知'
}

const orderStatusClass = (status) => {
  const map = {
    0: 'pending',
    1: 'active',
    2: 'completed',
    3: 'cancelled',
    4: 'refunded'
  }
  return map[status] || ''
}

const loadOrders = async () => {
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    const res = await apiGet('/api/admin/orders', params)
    if (res.code === 200) {
      orderList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载订单列表失败:', err)
  }
}

const viewOrderDetail = (order) => {
  currentOrder.value = { ...order }
  showOrderDetail.value = true
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadOrders()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadOrders()
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.order-list {
  padding: 20px;
  background: white;
  border-radius: 8px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.search-btn {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}

.data-table th {
  background: #fafafa;
  font-weight: 600;
}

.order-no-cell {
  font-family: monospace;
}

.service-type-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.order-status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.order-status-badge.pending {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.order-status-badge.active {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.order-status-badge.completed {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.order-status-badge.cancelled {
  background: #f5f5f5;
  color: #999;
  border: 1px solid #d9d9d9;
}

.order-status-badge.refunded {
  background: #fff1f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

.action-btn {
  padding: 4px 8px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

.page-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
}

.modal-large {
  width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.detail-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  width: 100px;
  color: #666;
  flex-shrink: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e8e8e8;
}

.cancel-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
