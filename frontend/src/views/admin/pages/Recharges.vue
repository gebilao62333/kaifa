<template>
  <div>
<div class="recharge-list">
          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索用户ID" class="search-input" />
            <select v-model="filterStatus" class="search-select">
              <option value="">全部状态</option>
              <option value="completed">已完成</option>
              <option value="pending">处理中</option>
              <option value="failed">失败</option>
            </select>
            <button @click="loadRecharges" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>订单号</th>
                <th>用户</th>
                <th>金额</th>
                <th>支付方式</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in rechargeList" :key="record.id">
                <td>{{ record.id }}</td>
                <td>{{ record.orderNo }}</td>
                <td>{{ record.userId }}</td>
                <td>{{ record.amount }} 金币</td>
                <td>{{ record.paymentMethod === 'wechat' ? '微信' : record.paymentMethod === 'alipay' ? '支付宝' : '银行卡' }}</td>
                <td>
                  <span :class="['status-badge', 
                    record.status === 'completed' ? 'approved' : 
                    record.status === 'pending' ? 'pending' : 'rejected']">
                    {{ record.status === 'completed' ? '已完成' : 
                       record.status === 'pending' ? '处理中' : '失败' }}
                  </span>
                </td>
                <td>{{ formatTime(record.createTime) }}</td>
                <td>
                  <button @click="viewRecharge(record)" class="action-btn">查看</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
          </div>
        </div>

        <!-- 服务分类 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()

const rechargeList = ref([])
const searchKeyword = ref('')
const filterStatus = ref('')
const currentRecharge = ref(null)
const showRechargeDetail = ref(false)

const loadRecharges = async () => {
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    if (filterStatus.value !== '') {
      params.status = filterStatus.value
    }
    const res = await apiGet('/api/admin/recharges', params)
    if (res.code === 200) {
      rechargeList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载充值记录失败:', err)
  }
}

const viewRecharge = (record) => {
  currentRecharge.value = { ...record }
  showRechargeDetail.value = true
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadRecharges()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadRecharges()
  }
}

onMounted(() => {
  loadRecharges()
})
</script>

<style scoped>
.recharge-list {
  padding: 20px;
  background: white;
  border-radius: 8px;
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

.search-select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  min-width: 120px;
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

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge.pending {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.status-badge.approved {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status-badge.rejected {
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
</style>
