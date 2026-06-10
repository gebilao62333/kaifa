<template>
  <div class="admin-card">
    <div class="toolbar">
      <div class="search-bar">
        <input v-model="searchKeyword" type="text" placeholder="搜索用户或礼物" class="search-input" />
        <button @click="loadGiftLogs" class="search-btn">搜索</button>
      </div>
      <button @click="exportData" class="export-btn">📥 导出CSV</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <table v-else-if="giftLogList.length > 0" class="data-table">
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
        <tr v-for="log in giftLogList" :key="log.id" :class="{ 'flagged-row': log.flagged }">
          <td>{{ log.id }}</td>
          <td>{{ log.fromNickname || '用户' + log.fromUserId }}</td>
          <td>{{ log.toNickname || '用户' + log.toUserId }}</td>
          <td>{{ log.giftName }}</td>
          <td>{{ log.count }}</td>
          <td>{{ log.amount }} 金币</td>
          <td>{{ formatTime(log.createTime) }}</td>
          <td>
            <button @click="viewGiftLog(log)" class="action-btn">查看</button>
            <button @click="toggleFlagged(log)" class="action-btn warn-btn">
              {{ log.flagged ? '取消标记' : '标记异常' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && giftLogList.length === 0" class="empty-state">
      <div class="empty-icon">🎁</div>
      <div class="empty-text">暂无礼物记录</div>
    </div>

    <div class="pagination">
      <div class="pagination-left">
        <span class="page-size-label">每页</span>
        <select v-model.number="pageSize" @change="page = 1; loadGiftLogs()" class="page-size-select">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span class="page-size-label">条，共 {{ total }} 条</span>
      </div>
      <div class="pagination-right">
        <button @click="page = 1; loadGiftLogs()" class="page-btn" :disabled="page <= 1">首页</button>
        <button @click="page--; loadGiftLogs()" class="page-btn" :disabled="page <= 1">上一页</button>
        <template v-for="p in pageNumbers" :key="p">
          <span v-if="p === '...'" class="page-ellipsis">...</span>
          <button v-else @click="page = p; loadGiftLogs()" :class="['page-btn', { 'page-active': page === p }]">{{ p }}</button>
        </template>
        <button @click="page++; loadGiftLogs()" class="page-btn" :disabled="page >= totalPages">下一页</button>
        <button @click="page = totalPages; loadGiftLogs()" class="page-btn" :disabled="page >= totalPages">末页</button>
      </div>
    </div>

    <!-- 礼物记录详情模态框 -->
    <div v-if="showGiftLogDetail" class="modal-overlay" @click.self="showGiftLogDetail = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>礼物记录详情 #{{ currentGiftLog.id }}</h3>
          <button @click="showGiftLogDetail = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">状态:</span>
            <span :class="currentGiftLog.flagged ? 'flagged-tag' : 'normal-tag'">
              {{ currentGiftLog.flagged ? '⚠ 已标记异常' : '正常' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">赠送用户:</span>
            <span>{{ currentGiftLog.fromNickname || '用户' + currentGiftLog.fromUserId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">接收用户:</span>
            <span>{{ currentGiftLog.toNickname || '用户' + currentGiftLog.toUserId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">礼物名称:</span>
            <span>{{ currentGiftLog.giftName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">数量:</span>
            <span>{{ currentGiftLog.count }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">总金额:</span>
            <span>{{ currentGiftLog.amount }} 金币</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">赠送时间:</span>
            <span>{{ formatTime(currentGiftLog.createTime) }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showGiftLogDetail = false" class="cancel-btn">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { page, pageSize, total, totalPages, pageNumbers, formatTime, apiGet, apiPut, exportCSV, toast } = useAdmin()

const giftLogList = ref([])
const searchKeyword = ref('')
const currentGiftLog = ref(null)
const showGiftLogDetail = ref(false)
const loading = ref(false)

const loadGiftLogs = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) { params.keyword = searchKeyword.value }
    const res = await apiGet('/api/admin/gift-logs', params)
    if (res.code === 200) {
      giftLogList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载礼物记录失败:', err)
    toast('加载礼物记录失败', 'error')
  } finally {
    loading.value = false
  }
}

const viewGiftLog = (log) => {
  currentGiftLog.value = { ...log }
  showGiftLogDetail.value = true
}

const toggleFlagged = async (log) => {
  try {
    const res = await apiPut('/api/admin/gift-logs/' + log.id, { flagged: !log.flagged })
    if (res.code === 200) {
      log.flagged = !log.flagged
    }
  } catch (err) {
    console.error('标记异常失败:', err)
  }
}

const exportData = () => {
  exportCSV(giftLogList.value, [
    { label: 'ID', key: 'id' },
    { label: '赠送用户', key: row => row.fromNickname || '用户' + row.fromUserId },
    { label: '接收用户', key: row => row.toNickname || '用户' + row.toUserId },
    { label: '礼物', key: 'giftName' },
    { label: '数量', key: 'count' },
    { label: '总金额', key: 'amount' },
    { label: '时间', key: row => formatTime(row.createTime) },
    { label: '标记', key: row => row.flagged ? '异常' : '正常' }
  ], 'gift_records')
}

onMounted(() => {
  loadGiftLogs()
})
</script>

<style scoped>
.warn-btn {
  background: #fa8c16;
}

.flagged-row {
  background: #fff7e6;
}

.flagged-tag {
  color: #fa8c16;
  font-weight: 600;
}

.normal-tag {
  color: #52c41a;
}
</style>
