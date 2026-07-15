<template>
  <div>
    <div class="page-actions">
      <input v-model="searchKeyword" placeholder="搜索用户ID..." class="search-input" @keyup.enter="loadList" />
    </div>
    <table class="data-table">
      <thead><tr><th>ID</th><th>赠送人</th><th>接收人</th><th>礼物</th><th>数量</th><th>金额</th><th>时间</th></tr></thead>
      <tbody>
        <tr v-for="l in list" :key="l.id">
          <td>{{ l.id }}</td>
          <td>{{ l.fromNickname || l.fromUserId || '-' }}</td>
          <td>{{ l.toNickname || l.toUserId || '-' }}</td>
          <td>{{ l.giftName || '-' }}</td>
          <td>{{ l.count || 1 }}</td>
          <td>¥{{ l.amount || 0 }}</td>
          <td>{{ formatTime(l.createTime) }}</td>
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
const { page, pageSize, total, totalPages, searchKeyword, formatTime } = useAdminApi()
const list = ref([])
const loadList = async () => {
  try {
    const res = await adminService.getGiftLogs({ page: page.value, pageSize: pageSize.value, userId: searchKeyword.value || undefined })
    if (res.code === 200 || res.code === 0) { list.value = res.data.list || res.data || []; total.value = res.data.pagination?.total || list.value.length }
  } catch (e) { console.error(e) }
}
onMounted(loadList)
</script>

<style scoped>
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; }
.search-input { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; width: 200px; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.data-table th { text-align: left; padding: 12px; background: #fafafa; color: #666; font-size: 13px; font-weight: 600; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.pagination { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 16px; font-size: 13px; color: #666; }
.pagination button { padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
