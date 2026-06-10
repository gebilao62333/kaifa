<template>
  <div class="noti-bell" @click.stop="toggleDropdown" v-if="isLogin">
    <span class="bell-icon">🔔</span>
    <span class="badge" v-if="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>

    <!-- 下拉列表 -->
    <Transition name="dropdown">
      <div class="dropdown" v-if="showDropdown" @click.stop>
        <div class="dropdown-header">
          <span class="title">消息通知</span>
          <button class="mark-all-btn" v-if="unreadCount > 0" @click="handleMarkAllRead">全部已读</button>
        </div>
        <div class="noti-list">
          <div v-if="loading" class="loading-row">
            <span class="spinner"></span> 加载中...
          </div>
          <div v-else-if="list.length === 0" class="empty-row">暂无通知</div>
          <div
            v-for="item in list"
            :key="item.id"
            :class="['noti-item', { unread: !item.isRead }]"
            @click="handleClick(item)"
          >
            <div class="noti-dot" v-if="!item.isRead"></div>
            <div class="noti-icon">
              {{ typeIcon(item.type) }}
            </div>
            <div class="noti-body">
              <div class="noti-title">{{ item.title }}</div>
              <div class="noti-preview">{{ item.content }}</div>
              <div class="noti-time">{{ formatTime(item.createTime) }}</div>
            </div>
          </div>
        </div>
        <div class="dropdown-footer" v-if="list.length > 0">
          <router-link to="/notification-list" @click="showDropdown = false">查看全部 →</router-link>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import notificationService from '../services/notificationService'
import { useUserStore } from '../store/user-info'

const router = useRouter()
const userStore = useUserStore()
const isLogin = computed(() => userStore.isLogin)

const showDropdown = ref(false)
const list = ref([])
const unreadCount = ref(0)
const loading = ref(false)

const typeIcon = (type) => {
  const map = { 1: '🔔', 2: '🎉', 3: '📢' }
  return map[type] || '💬'
}

const formatTime = (ts) => {
  if (!ts) return ''
  const now = Date.now()
  const diff = now - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  const d = new Date(ts)
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${month}月${day}日`
}

const fetchNotifications = async () => {
  loading.value = true
  try {
    const res = await notificationService.getNotifications({ pageSize: 5 })
    if (res.code === 200 && Array.isArray(res.data)) {
      list.value = res.data
      unreadCount.value = res.data.filter(n => !n.isRead).length
    } else if (res.code === 200 && res.data?.rows) {
      list.value = res.data.rows
      unreadCount.value = res.data.rows.filter(n => !n.isRead).length
    }
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value && list.value.length === 0) {
    fetchNotifications()
  }
}

const handleClick = async (item) => {
  if (!item.isRead) {
    await notificationService.markRead(item.id)
    item.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
}

const handleMarkAllRead = async () => {
  await notificationService.markAllRead()
  list.value.forEach(item => { item.isRead = true })
  unreadCount.value = 0
}

const closeDropdown = (e) => {
  if (!e.target.closest('.noti-bell')) {
    showDropdown.value = false
  }
}

const pollTimer = ref(null)
onMounted(() => {
  if (isLogin.value) fetchNotifications()
  pollTimer.value = setInterval(() => {
    if (isLogin.value) fetchNotifications()
  }, 30000) // 每30秒轮询
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  if (pollTimer.value) clearInterval(pollTimer.value)
  document.removeEventListener('click', closeDropdown)
})
</script>

<style scoped>
.noti-bell {
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}
.noti-bell:hover { background: rgba(255,255,255,0.1); }
.bell-icon { font-size: 20px; line-height: 1; }
.badge {
  position: absolute;
  top: -2px;
  right: 2px;
  background: #ff4757;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  border-radius: 8px;
  padding: 0 4px;
  box-shadow: 0 2px 6px rgba(255,71,87,0.4);
}

/* 下拉 */
.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 340px;
  max-height: 420px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  z-index: 1000;
  overflow: hidden;
  color: #333;
}
.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #eee;
}
.dropdown-header .title { font-size: 15px; font-weight: 700; }
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

.noti-list {
  max-height: 300px;
  overflow-y: auto;
}
.loading-row, .empty-row {
  padding: 40px 16px;
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

.noti-item {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f5f5f5;
  position: relative;
}
.noti-item:hover { background: #f8f9ff; }
.noti-item.unread { background: #f0f4ff; }
.noti-item:last-child { border-bottom: none; }

.noti-dot {
  position: absolute;
  top: 16px;
  left: 8px;
  width: 6px;
  height: 6px;
  background: #667eea;
  border-radius: 50%;
}
.noti-icon {
  font-size: 22px;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2ff;
  border-radius: 8px;
  margin-top: 2px;
}
.noti-body { flex: 1; min-width: 0; }
.noti-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.noti-preview {
  font-size: 12px;
  color: #888;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 4px;
}
.noti-time {
  font-size: 11px;
  color: #aaa;
}

.dropdown-footer {
  padding: 10px 16px;
  border-top: 1px solid #eee;
  text-align: center;
}
.dropdown-footer a {
  color: #667eea;
  font-size: 13px;
  text-decoration: none;
}
.dropdown-footer a:hover { text-decoration: underline; }

/* 动画 */
.dropdown-enter-active, .dropdown-leave-active {
  transition: all 0.2s ease;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
