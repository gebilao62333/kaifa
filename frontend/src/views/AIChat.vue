<template>
  <div class="ai-chat-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <div class="header-info">
        <span class="title">{{ chatUser.nickname }}</span>
        <span class="status" :class="{ online: chatUser.isOnline }">
          {{ chatUser.isOnline ? '在线' : '离线' }}
        </span>
      </div>
      <span class="more-btn" @click="showMore">⋮</span>
    </div>

    <div class="messages-area" ref="messagesArea">
      <div class="message-list">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['message-item', msg.isSelf ? 'self' : 'other']"
        >
          <img v-if="!msg.isSelf" class="avatar" :src="chatUser.avatar || defaultAvatar" alt="" />
          <div class="message-content">
            <div class="message-bubble">
              <span v-if="msg.isLoading" class="loading-dots">...</span>
              <span v-else>{{ msg.content }}</span>
            </div>
            <div class="message-time" v-if="msg.time">{{ formatTime(msg.time) }}</div>
          </div>
          <img v-if="msg.isSelf" class="avatar" :src="myAvatar" alt="" />
        </div>
      </div>
    </div>

    <div class="input-area">
      <div class="quick-replies" v-if="quickReplies.length > 0 && messages.length === 0">
        <span
          v-for="reply in quickReplies"
          :key="reply"
          class="quick-reply"
          @click="sendQuickReply(reply)"
        >
          {{ reply }}
        </span>
      </div>
      <div class="input-row">
        <input
          v-model="inputText"
          class="text-input"
          placeholder="输入消息..."
          @keyup.enter="sendMessage"
          :disabled="sending"
        />
        <button class="send-btn" @click="sendMessage" :disabled="!inputText.trim() || sending">
          发送
        </button>
      </div>
    </div>

    <div class="more-menu" v-if="showMenu" @click="showMenu = false">
      <div class="menu-content" @click.stop>
        <div class="menu-item" @click="clearContext">
          <span class="menu-icon">🗑️</span>
          <span>清除上下文</span>
        </div>
        <div class="menu-item" @click="refreshChat">
          <span class="menu-icon">🔄</span>
          <span>重新开始</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { virtualUserService } from '../services/virtualUserService'

const router = useRouter()
const route = useRoute()

const chatUser = ref({
  id: route.params.id,
  nickname: 'AI助手',
  avatar: '',
  isOnline: true,
  role: 'default',
  dialogueStyle: 'friendly'
})
const messages = ref([])
const inputText = ref('')
const sending = ref(false)
const showMenu = ref(false)
const messagesArea = ref(null)
const myAvatar = ref('')
const defaultAvatar = 'https://picsum.photos/200/200'

const quickReplies = [
  '你好',
  '你能做什么？',
  '讲个笑话',
  '推荐一首歌'
]

const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const loadChatHistory = async () => {
  try {
    const res = await virtualUserService.getChatHistory(chatUser.value.id)
    if (res.data && res.data.list) {
      messages.value = res.data.list.map(msg => ({
        content: msg.content || msg.message,
        isSelf: msg.isSelf || msg.role === 'user',
        time: msg.createTime || msg.sendTime,
        isLoading: false
      }))
      scrollToBottom()
    }
  } catch (error) {
    console.error('加载聊天记录失败:', error)
  }
}

const loadUserInfo = async () => {
  try {
    const res = await virtualUserService.getVirtualUser(chatUser.value.id)
    if (res.data) {
      chatUser.value = { ...chatUser.value, ...res.data }
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }

  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    const user = JSON.parse(userInfo)
    myAvatar.value = user.avatar || defaultAvatar
  }
}

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || sending.value) return

  inputText.value = ''
  messages.value.push({
    content: text,
    isSelf: true,
    time: Math.floor(Date.now() / 1000),
    isLoading: false
  })
  scrollToBottom()

  messages.value.push({
    content: '',
    isSelf: false,
    time: null,
    isLoading: true
  })
  scrollToBottom()

  sending.value = true
  try {
    const res = await virtualUserService.chat(chatUser.value.id, text)
    const lastMsg = messages.value[messages.value.length - 1]
    if (lastMsg.isLoading) {
      lastMsg.content = res.data?.message || res.data?.content || '好的'
      lastMsg.time = Math.floor(Date.now() / 1000)
      lastMsg.isLoading = false
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    const lastMsg = messages.value[messages.value.length - 1]
    if (lastMsg.isLoading) {
      lastMsg.content = '抱歉，我遇到了一些问题，请稍后再试。'
      lastMsg.time = Math.floor(Date.now() / 1000)
      lastMsg.isLoading = false
    }
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

const sendQuickReply = (text) => {
  inputText.value = text
  sendMessage()
}

const clearContext = async () => {
  showMenu.value = false
  try {
    await virtualUserService.clearContext(chatUser.value.id)
    messages.value = []
  } catch (error) {
    console.error('清除上下文失败:', error)
  }
}

const refreshChat = () => {
  showMenu.value = false
  messages.value = []
}

const showMore = () => {
  showMenu.value = !showMenu.value
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesArea.value) {
      messagesArea.value.scrollTop = messagesArea.value.scrollHeight
    }
  })
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadUserInfo()
  loadChatHistory()
})
</script>

<style scoped>
.ai-chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.back-btn {
  font-size: 20px;
  cursor: pointer;
  width: 40px;
}

.header-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-size: 16px;
  font-weight: 500;
}

.status {
  font-size: 11px;
  color: #999;
}

.status.online {
  color: #4cd964;
}

.more-btn {
  font-size: 20px;
  cursor: pointer;
  width: 40px;
  text-align: right;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  align-items: flex-start;
}

.message-item.self {
  flex-direction: row-reverse;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  margin: 0 8px;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.4;
  word-break: break-word;
}

.message-item.self .message-bubble {
  background: #007aff;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message-item.other .message-bubble {
  background: #fff;
  color: #333;
  border-bottom-left-radius: 4px;
}

.loading-dots {
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.message-time {
  font-size: 10px;
  color: #bbb;
  margin-top: 4px;
  text-align: center;
}

.message-item.self .message-time {
  text-align: right;
}

.input-area {
  background: #fff;
  border-top: 1px solid #eee;
  padding: 8px 12px;
}

.quick-replies {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.quick-reply {
  padding: 6px 12px;
  background: #f0f0f0;
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
}

.quick-reply:hover {
  background: #e0e0e0;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 18px;
  font-size: 14px;
  outline: none;
}

.text-input:focus {
  border-color: #007aff;
}

.send-btn {
  padding: 8px 16px;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 18px;
  font-size: 14px;
  cursor: pointer;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.more-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.menu-content {
  position: absolute;
  top: 60px;
  right: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 8px;
  cursor: pointer;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-icon {
  font-size: 16px;
}
</style>