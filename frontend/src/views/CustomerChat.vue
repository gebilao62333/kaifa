<template>
  <div class="customer-chat-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <div class="chat-info">
        <span class="chat-name">{{ chatName }}</span>
        <span class="chat-status" :class="{ online: isOnline }">
          {{ isOnline ? '在线' : '离线' }}
        </span>
      </div>
      <span class="more-btn">•••</span>
    </div>
    
    <div class="messages" ref="messagesRef" @scroll="handleScroll">
      <div class="loading-tip" v-if="loading">加载中...</div>
      <div class="loading-tip" v-else-if="messages.length === 0">暂无消息记录</div>
      
      <div v-for="(msg, index) in messages" :key="msg.id" :class="['message', msg.isOwn ? 'own' : 'other']">
        <div class="avatar">
          <img :src="msg.sender_avatar || defaultAvatar" alt="" />
        </div>
        <div class="content">
          <div class="bubble">
            <template v-if="msg.message_type === 'text'">
              {{ msg.message }}
            </template>
            <template v-else>
              {{ msg.message }}
            </template>
          </div>
          <div class="time">{{ formatTime(msg.create_time) }}</div>
        </div>
      </div>
    </div>
    
    <div class="input-area">
      <input 
        type="text" 
        v-model="inputMessage" 
        placeholder="输入消息..."
        @keyup.enter="sendMessage"
      />
      <button @click="sendMessage" :disabled="!inputMessage.trim()">发送</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { customerServiceApi } from '../services/customerService'
import { useUserStore } from '../store/user-info'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const chatName = ref('客服')
const isOnline = ref(true)
const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
const messagesRef = ref(null)
let pollingTimer = null

const customerServiceId = ref(null)

const loadMessages = async () => {
  if (!customerServiceId.value) return
  
  loading.value = true
  try {
    const res = await customerServiceApi.getChatHistory(customerServiceId.value, {
      userId: userStore.userInfo?.userId || 1,
      limit: 50
    })
    
    if (res.code === 200 && res.data) {
      messages.value = res.data.map(msg => ({
        ...msg,
        isOwn: msg.sender_type === 'user'
      }))
      nextTick(() => scrollToBottom())
    }
  } catch (error) {
    console.error('加载消息失败:', error)
  } finally {
    loading.value = false
  }
}

const loadCustomerInfo = async () => {
  if (!customerServiceId.value) return
  
  try {
    const res = await customerServiceApi.getById(customerServiceId.value)
    if (res.code === 200 && res.data) {
      chatName.value = res.data.name
      isOnline.value = res.data.online
    }
  } catch (error) {
    console.error('加载客服信息失败:', error)
  }
}

const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || !customerServiceId.value) return
  
  try {
    const res = await customerServiceApi.sendMessage({
      userId: userStore.userInfo?.userId || 1,
      customerServiceId: customerServiceId.value,
      message: message,
      messageType: 'text'
    })
    
    if (res.code === 200) {
      inputMessage.value = ''
      // 添加用户消息到列表
      messages.value.push({
        ...res.data,
        isOwn: true
      })
      nextTick(() => scrollToBottom())
      
      // 开始轮询获取客服回复
      startPolling()
    }
  } catch (error) {
    console.error('发送消息失败:', error)
  }
}

const startPolling = () => {
  if (pollingTimer) clearInterval(pollingTimer)
  
  pollingTimer = setInterval(async () => {
    try {
      const oldCount = messages.value.length
      await loadMessages()
      
      // 如果有新消息，停止轮询
      if (messages.value.length > oldCount) {
        const hasNewCustomerMsg = messages.value.slice(oldCount).some(msg => !msg.isOwn)
        if (hasNewCustomerMsg) {
          clearInterval(pollingTimer)
          pollingTimer = null
        }
      }
    } catch (error) {
      console.error('轮询消息失败:', error)
    }
  }, 3000)
}

const scrollToBottom = () => {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const handleScroll = () => {
  // 可以添加加载更多逻辑
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  // 从路由参数获取客服ID
  const id = route.params.id
  if (id && id.startsWith('9')) {
    customerServiceId.value = parseInt(id)
    loadCustomerInfo()
    loadMessages()
  }
})

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
})
</script>

<style scoped>
.customer-chat-page {
  height: 100vh;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
  height: 60px;
  flex-shrink: 0;
}

.back-btn {
  font-size: 24px;
  color: #333;
  margin-right: 16px;
  cursor: pointer;
}

.chat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.chat-status {
  font-size: 12px;
  color: #999;
}

.chat-status.online {
  color: #34c759;
}

.more-btn {
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 8px;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}

.loading-tip {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 14px;
}

.message {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-start;
}

.message.own {
  flex-direction: row-reverse;
}

.message.own .avatar {
  margin-left: 10px;
}

.message.other .avatar {
  margin-right: 10px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message.own .content {
  align-items: flex-end;
}

.bubble {
  padding: 10px 14px;
  border-radius: 12px;
  background: white;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
}

.message.own .bubble {
  background: #007AFF;
  color: white;
}

.time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.input-area {
  display: flex;
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #eee;
  gap: 10px;
  flex-shrink: 0;
}

.input-area input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 22px;
  font-size: 15px;
  outline: none;
}

.input-area input:focus {
  border-color: #007AFF;
}

.input-area button {
  padding: 10px 20px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 22px;
  font-size: 15px;
  cursor: pointer;
}

.input-area button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.input-area button:active:not(:disabled) {
  background: #0056b3;
}
</style>
