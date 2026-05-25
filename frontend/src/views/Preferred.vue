<template>
  <div class="preferred-page">
    <div class="header">
      <div class="title">消息</div>
    </div>

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
              <img class="avatar" :src="item.avatar" alt="" />
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '../store/chat'
import { notificationService } from '../services/notificationService'
import socketService from '../services/socketService'

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
    chatList.value = [
      {
        id: 1,
        toId: 2,
        nickName: '小雪',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
        content: '你好呀，今晚一起开黑吗？',
        sendTime: Date.now() - 1800000,
        unreadCount: 2,
        isOnline: true
      },
      {
        id: 2,
        toId: 3,
        nickName: '阿杰',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        content: '好的，那晚上8点见！',
        sendTime: Date.now() - 7200000,
        unreadCount: 0,
        isOnline: false
      },
      {
        id: 3,
        toId: 4,
        nickName: '小美',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
        content: '谢谢你的礼物~',
        sendTime: Date.now() - 86400000,
        unreadCount: 1,
        isOnline: true
      },
      {
        id: 4,
        toId: 5,
        nickName: '大飞',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
        content: '收到，你的预约已确认',
        sendTime: Date.now() - 172800000,
        unreadCount: 0,
        isOnline: false
      }
    ]
    chatUnread.value = chatList.value.reduce((sum, item) => sum + (item.unreadCount || 0), 0)
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
    noticeList.value = [
      { id: 1, type: 'like', title: '有人点赞了你的动态', content: '小雪 点赞了你的动态', createTime: Date.now() - 3600000, isRead: false },
      { id: 2, type: 'follow', title: '有人关注了你', content: '阿杰 关注了你', createTime: Date.now() - 7200000, isRead: false },
      { id: 3, type: 'system', title: '系统通知', content: '你的服务申请已通过审核', createTime: Date.now() - 86400000, isRead: true },
      { id: 4, type: 'reserve', title: '预约提醒', content: '明天下午3点有一场预约', createTime: Date.now() - 172800000, isRead: true },
      { id: 5, type: 'gift', title: '收到礼物', content: '小美 送给你一份礼物', createTime: Date.now() - 259200000, isRead: true }
    ]
    noticeUnread.value = noticeList.value.filter(item => !item.isRead).length
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
  chatUnread.value = chatList.value.reduce((sum, item) => sum + (item.unreadCount || 0), 0)
  chatStore.setChatUnread(chatUnread.value)
  router.push(`/chat-room/${item.toId}`)
}

const readNotice = (item) => {
  if (item.isRead) return
  item.isRead = true
  noticeUnread.value = noticeList.value.filter(item => !item.isRead).length
}

const markAllRead = () => {
  noticeList.value.forEach(item => item.isRead = true)
  noticeUnread.value = 0
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

onMounted(() => {
  updateKefuTime()
  loadChatList()
  loadNoticeList()
})

onUnmounted(() => {
  if (noticeUnsubscribe) {
    noticeUnsubscribe()
  }
})
</script>

<style scoped>
.preferred-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 80px;
  padding-top: 50px;
}

.content-container {
  background: #fff;
  margin: 12px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 12px 20px;
  text-align: center;
  height: 50px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.category-tabs {
  display: flex;
  background-color: #fff;
  padding: 0 40px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 50px;
  z-index: 10;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16px 0;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-item span {
  font-size: 16px;
  color: #666;
}

.tab-item.active span {
  color: #667eea;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.badge {
  position: absolute;
  top: 8px;
  right: 50%;
  transform: translateX(25px);
  background-color: #ff4757;
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.content {
  padding: 16px;
}

.chat-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #fff;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
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
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
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
  color: #667eea;
  cursor: pointer;
}

.notice-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #fff;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
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
  border-top: 3px solid #667eea;
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

@media (min-width: 768px) {
  .preferred-page {
    padding-top: 60px;
    padding-left: 16px;
    padding-right: 16px;
    max-width: 650px;
    margin: 0 auto;
  }
  
  .content-container {
    margin: 0;
    margin-top: 12px;
  }
  
  .header {
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 0 0 16px 16px;
    padding: 12px 24px;
    height: 50px;
  }
  
  .title {
    font-size: 18px;
  }
  
  .category-tabs {
    top: 50px;
  }
}

@media (min-width: 1024px) {
  .preferred-page {
    max-width: 720px;
  }
  
  .header {
    max-width: 720px;
  }
}
</style>
