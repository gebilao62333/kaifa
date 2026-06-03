<template>
  <div>
<div class="withdraw-list">
          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索提现记录" class="search-input" />
            <button @click="loadWithdraws" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>提现ID</th>
                <th>用户</th>
                <th>金额</th>
                <th>方式</th>
                <th>状态</th>
                <th>申请时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="withdraw in withdrawList" :key="withdraw.id">
                <td>{{ withdraw.id }}</td>
                <td>{{ withdraw.userId }}</td>
                <td>{{ withdraw.amount }} 金币</td>
                <td>{{ withdraw.method }}</td>
                <td>
                  <span :class="['status-badge', withdraw.status === 0 ? 'pending' : withdraw.status === 1 ? 'approved' : 'rejected']">
                    {{ withdraw.status === 0 ? '待审核' : withdraw.status === 1 ? '已通过' : '已拒绝' }}
                  </span>
                </td>
                <td>{{ formatTime(withdraw.createTime) }}</td>
                <td>
                  <button @click="viewWithdraw(withdraw)" class="action-btn">查看</button>
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

        <!-- 虚拟机器人管理 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()

const withdrawList = ref([])
const searchKeyword = ref('')
const currentWithdraw = ref(null)
const showWithdrawDetail = ref(false)

const loadWithdraws = async () => {
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    const res = await apiGet('/api/admin/withdraws', params)
    if (res.code === 200) {
      withdrawList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载提现记录失败:', err)
  }
}

const viewWithdraw = (withdraw) => {
  currentWithdraw.value = { ...withdraw }
  showWithdrawDetail.value = true
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadWithdraws()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadWithdraws()
  }
}

onMounted(() => {
  loadWithdraws()
})
</script>
