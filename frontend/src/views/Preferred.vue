<template>
  <PageLayout>
    <template #nav>
      <div class="title">消息</div>
    </template>

    <div class="content-container">
      <div class="category-tabs">
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'chat' }" 
          @click="switchTab('chat')">
          <span>聊天</span>
          <div class="badge" v-if="chatUnread > 0">{{ chatUnread > 99 ? '99+' : chatUnread }}</div>
        </div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'notice' }" 
          @click="switchTab('notice')">
          <span>通知</span>
          <div class="badge" v-if="noticeUnread > 0">{{ noticeUnread > 99 ? '99+' : noticeUnread }}</div>
        </div>
      </div>

      <div class="content">
        <div v-if="activeTab === 'chat'" class="chat-list">
          <div class="chat-item" @click="goKefu">
            <div class="avatar-wrap kefu">
              <span>💬</span>
            </div>
            <div class="chat-info">
              <div class="chat-name-row">
                <span class="chat-name">在线客服</span>
              </div>
              <div class="chat-preview-row">
                <span class="chat-preview">有什么可以帮您？</span>
                <span class="chat-time">{{ kefuTime }}</span>
              </div>
            </div>
          </div>

          <div 
            class="chat-item" 
            v-for="(item, index) in chatList" 
            :key="index" 
            @click="goChat(item)">
            <div class="avatar-wrap">
              <img 
                v-if="item.avatar" 
                class="avatar" 
                :src="item.avatar" 
                :alt="item.nickName"
                @error="handleAvatarError($event, item)"
              />
              <div v-else class="avatar-placeholder">
                {{ (item.nickName || '?').charAt(0) }}
              </div>
              <div class="online-dot" v-if="item.isOnline"></div>
            </div>
            <div class="chat-info">
              <div class="chat-name-row">
                <span class="chat-name">{{ item.nickName }}</span>
              </div>
              <div class="chat-preview-row">
                <span class="chat-preview">{{ item.content }}</span>
                <span class="chat-time">{{ formatTime(item.sendTime) }}</span>
              </div>
            </div>
            <div class="unread-badge" v-if="item.unreadCount > 0">
              {{ item.unreadCount > 99 ? '99+' : item.unreadCount }}
            </div>
          </div>

          <div v-if="loadingChat" class="loading-state">
            <div class="loading-spinner"></div>
            <div class="loading-text">加载中...</div>
          </div>
          <div class="empty-state" v-if="!loadingChat && chatList.length === 0">
            <div class="empty-icon">💬</div>
            <div class="empty-text">暂无聊天记录</div>
          </div>
        </div>

        <div v-if="activeTab === 'notice'" class="notice-list">
          <div v-if="loadingNotice" class="loading-state">
            <div class="loading-spinner"></div>
            <div class="loading-text">加载中...</div>
          </div>
          <div class="notice-header-row" v-if="!loadingNotice && noticeList.length > 0">
            <span class="notice-count">共 {{ noticeList.length }} 条通知</span>
            <span class="mark-all-read" @click="markAllRead">全部已读</span>
          </div>
          <div 
            class="notice-item" 
            :class="{ unread: !item.isRead }"
            v-for="(item, index) in noticeList" 
            :key="index"
            @click="readNotice(item)">
            <div class="notice-icon" :class="item.type">
              <span>{{ getNoticeIcon(item.type) }}</span>
            </div>
            <div class="notice-info">
              <span class="notice-title">{{ item.title }}</span>
              <span class="notice-content">{{ item.content }}</span>
              <span class="notice-time">{{ formatTime(item.createTime) }}</span>
            </div>
            <div class="notice-unread-badge" v-if="!item.isRead">1</div>
          </div>

          <div class="empty-state" v-if="!loadingNotice && noticeList.length === 0">
            <div class="empty-icon">🔔</div>
            <div class="empty-text">暂无通知</div>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '../components/PageLayout.vue'
import { useChatStore } from '../store/chat'
import { notificationService } from '../services/notificationService'
import chatService from '../services/chatService'
import { DEFAULT_AVATAR } from '../common/constants'

const router = useRouter()
const chatStore = useChatStore()

const activeTab = ref('chat')
const chatUnread = ref(0)
const noticeUnread = ref(0)
const chatList = ref([])
const noticeList = ref([])
const kefuTime = ref('')
const loadingChat = ref(true)
const loadingNotice = ref(true)
let noticeUnsubscribe = null

// ============ 消息已读状态的本地持久化 ============
// 消息页使用 mock 数据，refresh 时会重新初始化未读状态，导致刷新前用户已做的
// "已读"操作被抹掉。这里把"已读会话/已读通知"的 id 集合持久化到 localStorage，
// 刷新后据此把对应条目的未读归零，从而保证刷新前后状态、角标完全一致。
const MSG_STATE_KEY = 'preferred_message_state'

const loadMsgState = () => {
  try {
    const raw = localStorage.getItem(MSG_STATE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        readChatIds: Array.isArray(parsed.readChatIds) ? parsed.readChatIds : [],
        readNoticeIds: Array.isArray(parsed.readNoticeIds) ? parsed.readNoticeIds : []
      }
    }
  } catch (e) {
    console.warn('读取消息已读状态失败:', e)
  }
  return { readChatIds: [], readNoticeIds: [] }
}

const saveMsgState = (state) => {
  try {
    localStorage.setItem(MSG_STATE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('保存消息已读状态失败:', e)
  }
}

const msgState = loadMsgState()

const markChatRead = (id) => {
  if (!msgState.readChatIds.includes(id)) {
    msgState.readChatIds.push(id)
    saveMsgState(msgState)
  }
}

const markNoticeRead = (id) => {
  if (!msgState.readNoticeIds.includes(id)) {
    msgState.readNoticeIds.push(id)
    saveMsgState(msgState)
  }
}

const formatTime = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const loadChatList = async () => {
  loadingChat.value = true
  try {
    const res = await chatService.getChatList(1, 50)
    const rows = res?.data?.list || res?.data || []
    chatList.value = (Array.isArray(rows) ? rows : []).map(c => {
      const rawTime = c.sendTime || c.lastMessageTime || 0
      return {
        id: c.id ?? (c.fromId ?? c.toId),
        toId: c.fromId ?? c.toId,
        nickName: c.nickname || c.nickName || '用户',
        avatar: c.avatar || DEFAULT_AVATAR,
        content: c.content || c.lastMessage || '',
        sendTime: rawTime ? (rawTime < 1e12 ? rawTime * 1000 : rawTime) : Date.now(),
        unreadCount: Number(c.unreadCount) || 0,
        isOnline: !!c.online
      }
    })

    // 应用本地持久化的已读状态，使刷新后未读会话数与刷新前完全一致
    chatList.value.forEach(item => {
      if (msgState.readChatIds.includes(item.id)) {
        item.unreadCount = 0
      }
    })

    // 合并 Socket unreadMap 未读数：取 mock 数据与 socket 中的较大值
    const unreadMap = chatStore.unreadMap || {}
    // 防御：持久化恢复的 unreadMap 可能含脏数据（对象/字符串），只保留有效数字计数
    const safeUnread = {}
    for (const [userId, count] of Object.entries(unreadMap)) {
      const n = Number(count)
      if (Number.isFinite(n) && n > 0) {
        safeUnread[userId] = n
      }
    }
    chatList.value.forEach(item => {
      const socketUnread = safeUnread[item.toId] || 0
      if (socketUnread > (Number(item.unreadCount) || 0)) {
        item.unreadCount = socketUnread
      }
    })

    // 角标：mock 列表中未读消息总数 + Socket 中有未读但不在 mock 列表中的额外消息数
    const inListCount = chatList.value.reduce((sum, item) => sum + (Number(item.unreadCount) || 0), 0)
    const extraFromSocket = Object.entries(safeUnread)
      .filter(([userId, count]) => !chatList.value.some(c => c.toId === parseInt(userId)))
      .reduce((sum, [userId, count]) => sum + count, 0)
    chatUnread.value = inListCount + extraFromSocket
    chatStore.setChatUnread(chatUnread.value)
  } catch (error) {
    console.error('加载聊天列表失败:', error)
  } finally {
    loadingChat.value = false
  }
}

const loadNoticeList = async () => {
  loadingNotice.value = true
  try {
    noticeList.value = notificationService.getList().map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      content: n.content,
      createTime: n.createTime || Date.now(),
      isRead: !!n.isRead
    }))

    // 关键：应用本地持久化的已读状态，使刷新后通知未读数与刷新前完全一致
    noticeList.value.forEach(item => {
      if (msgState.readNoticeIds.includes(item.id)) {
        item.isRead = true
      }
    })

    noticeUnread.value = noticeList.value.filter(item => !item.isRead).length
    chatStore.setNoticeUnread(noticeUnread.value)
  } catch (error) {
    console.error('加载通知列表失败:', error)
  } finally {
    loadingNotice.value = false
  }
}

const updateKefuTime = () => {
  kefuTime.value = '1小时前'
}

const switchTab = (tab) => {
  activeTab.value = tab
}

const goKefu = () => {
  router.push(`/chat-room/kefu`)
}

const goChat = (item) => {
  item.unreadCount = 0
  // 持久化"已读会话"，刷新后仍记为已读
  markChatRead(item.id)
  // 清除 Socket 中的未读计数
  chatStore.updateUnread(item.toId, 0)
  // 角标：mock 列表中未读消息总数 + Socket 中有未读但不在 mock 列表中的额外消息数
  const unreadMap = chatStore.unreadMap || {}
  const inListCount = chatList.value.reduce((sum, c) => sum + (Number(c.unreadCount) || 0), 0)
  const extraFromSocket = Object.entries(unreadMap)
    .filter(([userId, count]) => Number(count) > 0 && !chatList.value.some(c => c.toId === parseInt(userId)))
    .reduce((sum, [userId, count]) => sum + (Number(count) || 0), 0)
  chatUnread.value = inListCount + extraFromSocket
  chatStore.setChatUnread(chatUnread.value)
  router.push(`/chat-room/${item.toId}`)
}

const readNotice = (item) => {
  if (item.isRead) return
  item.isRead = true
  // 持久化"已读通知"，刷新后仍记为已读
  markNoticeRead(item.id)
  noticeUnread.value = noticeList.value.filter(item => !item.isRead).length
  chatStore.setNoticeUnread(noticeUnread.value)
}

const markAllRead = () => {
  noticeList.value.forEach(item => {
    item.isRead = true
    // 持久化所有通知为已读，刷新后保持一致
    if (!msgState.readNoticeIds.includes(item.id)) {
      msgState.readNoticeIds.push(item.id)
    }
  })
  saveMsgState(msgState)
  noticeUnread.value = 0
  chatStore.setNoticeUnread(0)
}

const getNoticeIcon = (type) => {
  const iconMap = {
    like: '❤️',
    follow: '👤',
    system: '📢',
    reserve: '📅',
    gift: '🎁'
  }
  return iconMap[type] || '🔔'
}

const handleAvatarError = (event, item) => {
  // 图片加载失败时，回退到默认头像
  console.warn('头像加载失败:', item.nickName)
  item.avatar = DEFAULT_AVATAR
}

onMounted(() => {
  updateKefuTime()
  loadChatList()
  loadNoticeList()
  // 订阅本地通知总线，新增通知实时刷新列表与角标
  noticeUnsubscribe = notificationService.subscribe(({ list }) => {
    noticeList.value = (list || []).map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      content: n.content,
      createTime: n.createTime || Date.now(),
      isRead: !!n.isRead
    }))
    noticeList.value.forEach(item => {
      if (msgState.readNoticeIds.includes(item.id)) item.isRead = true
    })
    noticeUnread.value = noticeList.value.filter(item => !item.isRead).length
    chatStore.setNoticeUnread(noticeUnread.value)
  })
})

onUnmounted(() => {
  if (noticeUnsubscribe) {
    noticeUnsubscribe()
  }
})
</script>

<style scoped>
.content-container {
  background: #fff;
  margin: 12px 0 0;
  padding: 20px;
  border-radius: 0px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.title {
  flex: 1;
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  text-align: center;
}

.category-tabs {
  display: flex;
  background-color: #fff;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
  position: static;
  z-index: 10;
  height: 70px;
  box-sizing: border-box;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-item span {
  font-size: 16px;
  color: #666;
  /* 内容整体上移 10px */
  transform: translateY(-10px);
}

.tab-item.active span {
  color: var(--color-primary);
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: var(--gradient-primary);
  border-radius: 2px;
}

.badge {
  background-color: #ff4757;
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  flex-shrink: 0;
}

.content {
  padding-top: 20px;
  width: calc(100% + 40px) !important;
  height: auto !important;
  box-sizing: border-box;
  margin-left: -20px;
  margin-right: -20px;
}

.chat-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background-color: #fff;
  border-radius: 0px;
  cursor: pointer;
  transition: background-color 0.2s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.chat-item:active {
  background-color: #f5f5f5;
}

.avatar-wrap {
  position: relative;
  margin-right: 12px;
}

.avatar-wrap.kefu {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  object-fit: cover;
}

.avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background-color: #2ed573;
  border-radius: 50%;
  border: 2px solid #fff;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-name-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.chat-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.chat-preview-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-preview {
  font-size: 13px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 12px;
}

.chat-time {
  font-size: 12px;
  color: #bbb;
  white-space: nowrap;
}

.unread-badge {
  background-color: #ff4757;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notice-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8px;
  margin-bottom: 8px;
}

.notice-count {
  font-size: 14px;
  color: #666;
}

.mark-all-read {
  font-size: 14px;
  color: var(--color-primary);
  cursor: pointer;
}

.notice-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #fff;
  border-radius: 0px;
  cursor: pointer;
  transition: background-color 0.2s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.notice-item.unread {
  background-color: #fff5f5;
}

.notice-item:active {
  background-color: #f5f5f5;
}

.notice-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 14px;
}

.notice-icon.like {
  background-color: #fff0f0;
}

.notice-icon.follow {
  background-color: #f0f5ff;
}

.notice-icon.system {
  background-color: #fffaf0;
}

.notice-icon.reserve {
  background-color: #f0fff0;
}

.notice-icon.gift {
  background-color: #fff0ff;
}

.notice-info {
  flex: 1;
  min-width: 0;
}

.notice-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.notice-content {
  display: block;
  font-size: 13px;
  color: #999;
  margin-bottom: 4px;
}

.notice-time {
  font-size: 12px;
  color: #bbb;
}

.notice-unread-badge {
  background-color: #ff4757;
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  color: #999;
}

/* PC 端消息页优化（居中由 PageLayout 统一处理，与首页一致） */
@media (min-width: 768px) {
  .content-container {
    padding: 20px 24px;
  }

  .title {
    font-size: 18px;
  }

  .content {
    width: calc(100% + 48px) !important;
    margin-left: -24px;
    margin-right: -24px;
  }
}

@media (min-width: 1024px) {
}
</style>
