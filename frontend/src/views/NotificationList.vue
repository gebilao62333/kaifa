<template>
  <div class="noti-page">
    <div class="page-header">
      <button class="back-btn" @click="goBack">←</button>
      <h3>消息通知</h3>
      <button class="mark-all-btn" v-if="unreadCount > 0" @click="handleMarkAll">全部已读</button>
    </div>
    <div class="page-body">
      <div v-if="loading" class="loading-row">
        <span class="spinner"></span> 加载中...
      </div>
      <div v-else-if="list.length === 0" class="empty-state">
        <span class="empty-icon">🔔</span>
        <span class="empty-text">暂无通知</span>
      </div>
      <div v-else class="noti-list">
        <div
          v-for="item in list"
          :key="item.id"
          :class="['noti-item', { unread: !item.isRead }]"
          @click="handleClick(item)"
        >
          <div class="noti-dot" v-if="!item.isRead"></div>
          <div class="noti-icon">{{ typeIcon(item.type) }}</div>
          <div class="noti-body">
            <div class="noti-title">{{ item.title }}</div>
            <div class="noti-content">{{ item.content }}</div>
            <div class="noti-time">{{ formatTime(item.createTime) }}</div>
          </div>
        </div>
      </div>
      <div class="pagination" v-if="total > pageSize">
        <button :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
        <span class="page-info">{{ page }} / {{ totalPages }}</span>
        <button :disabled="page >= totalPages" @click="changePage(page + 1)">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import notificationService from '../services/notificationService'

const router = useRouter()
const list = ref([])
const loading = ref(true)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const unreadCount = ref(0)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const typeIcon = (type) => {
  const map = { 1: '🔔', 2: '🎉', 3: '📢' }
  return map[type] || '💬'
}

const formatTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 172800000) return '昨天'
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${month}月${day}日`
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await notificationService.getNotifications({ page: page.value, pageSize: pageSize.value })
    if (res.code === 200 && Array.isArray(res.data)) {
      list.value = res.data
      total.value = res.data.length
      unreadCount.value = res.data.filter(n => !n.isRead).length
    } else if (res.code === 200 && res.data?.rows) {
      list.value = res.data.rows
      total.value = res.data.total || res.data.rows.length
      unreadCount.value = res.data.rows.filter(n => !n.isRead).length
    } else {
      list.value = []
    }
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

const handleClick = async (item) => {
  if (!item.isRead) {
    await notificationService.markRead(item.id)
    item.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
}

const handleMarkAll = async () => {
  await notificationService.markAllRead()
  list.value.forEach(item => { item.isRead = true })
  unreadCount.value = 0
}

const changePage = (p) => {
  page.value = p
  fetchList()
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.noti-page {
  min-height: 100vh;
  background: var(--bg-page, #f5f6fa);
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
  box-sizing: border-box;
}

.back-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0 8px 0 0;
  color: #333;
}

.page-header h3 {
  flex: 1;
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.mark-all-btn {
  background: none;
  border: none;
  color: #667eea;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.mark-all-btn:hover { background: #f0f2ff; }

.page-body {
  flex: 1;
  padding: 0;
}

.loading-row {
  padding: 60px 16px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #eee;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 6px;
  vertical-align: middle;
}

@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 16px;
  color: #bbb;
}

.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-text { font-size: 14px; }

.noti-list {
  background: #fff;
}

.noti-item {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f5f5f5;
  position: relative;
}

.noti-item:hover { background: #f8f9ff; }
.noti-item.unread { background: #f0f4ff; }

.noti-dot {
  position: absolute;
  top: 18px;
  left: 8px;
  width: 6px;
  height: 6px;
  background: #667eea;
  border-radius: 50%;
}

.noti-icon {
  font-size: 24px;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2ff;
  border-radius: 10px;
}

.noti-body { flex: 1; min-width: 0; }

.noti-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.noti-content {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.noti-time {
  font-size: 11px;
  color: #aaa;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
}

.pagination button {
  padding: 6px 16px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: all 0.2s;
}

.pagination button:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #666;
}
</style>
