<template>
  <div>
<div class="gift-log-list">
          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索用户或礼物" class="search-input" />
            <button @click="loadGiftLogs" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>赠送用户</th>
                <th>接收用户</th>
                <th>礼物</th>
                <th>数量</th>
                <th>总金额</th>
                <th>时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in giftLogList" :key="log.id">
                <td>{{ log.id }}</td>
                <td>{{ log.fromNickname || '用户' + log.fromUserId }}</td>
                <td>{{ log.toNickname || '用户' + log.toUserId }}</td>
                <td>{{ log.giftName }}</td>
                <td>{{ log.count }}</td>
                <td>{{ log.amount }} 金币</td>
                <td>{{ formatTime(log.createTime) }}</td>
                <td>
                  <button @click="viewGiftLog(log)" class="action-btn">查看</button>
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

        <!-- 帖子管理 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()

const giftLogList = ref([])
const searchKeyword = ref('')
const currentGiftLog = ref(null)
const showGiftLogDetail = ref(false)

const loadGiftLogs = async () => {
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    const res = await apiGet('/api/admin/gift-logs', params)
    if (res.code === 200) {
      giftLogList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载礼物记录失败:', err)
  }
}

const viewGiftLog = (log) => {
  currentGiftLog.value = { ...log }
  showGiftLogDetail.value = true
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadGiftLogs()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadGiftLogs()
  }
}

onMounted(() => {
  loadGiftLogs()
})
</script>
