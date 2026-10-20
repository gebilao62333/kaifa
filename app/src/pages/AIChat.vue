<template>
  <view class="ai-chat-page">
    <view class="header">
      <text class="back-btn" @click="goBack">←</text>
      <view class="header-info">
        <text class="title">{{ chatUser.name }}</text>
        <text class="status" :class="{ online: chatUser.online_status === 1 }">
          {{ chatUser.online_status === 1 ? '在线' : '离线' }}
        </text>
      </view>
      <text class="more-btn" @click="showMore">⋮</text>
    </view>

    <view class="offline-tip" v-if="!isOnline">
      <text>对方当前离线，暂时无法回复，请稍后再来</text>
    </view>

    <view class="messages-area" ref="messagesArea">
      <view class="message-list">
        <view
          v-for="(msg, index) in messages"
          :key="index"
          :class="['message-item', msg.isSelf ? 'self' : 'other']"
        >
          <image mode="aspectFill" v-if="!msg.isSelf" class="avatar" :src="chatUser.avatar || defaultAvatar" alt="" />
          <view class="message-content">
            <view class="message-bubble">
              <text v-if="msg.isLoading" class="loading-dots">...</text>
              <text v-else>{{ msg.content }}</text>
            </view>
            <view class="message-time" v-if="msg.time">{{ formatTime(msg.time) }}</view>
          </view>
          <image mode="aspectFill" v-if="msg.isSelf" class="avatar" :src="myAvatar" alt="" />
        </view>
      </view>
    </view>

    <view class="input-area">
      <view class="quick-replies" v-if="quickReplies.length > 0 && messages.length === 0">
        <text
          v-for="reply in quickReplies"
          :key="reply"
          class="quick-reply"
          :class="{ disabled: !isOnline }"
          @click="sendQuickReply(reply)"
        >
          {{ reply }}
        </text>
      </view>
      <view class="input-row">
        <input
          v-model="inputText"
          class="text-input"
          placeholder="输入消息..."
          @keyup.enter="sendMessage"
          :disabled="sending || !isOnline"
        />
        <button class="send-btn" @click="sendMessage" :disabled="!inputText.trim() || sending || !isOnline">
          发送
        </button>
      </view>
    </view>

    <view class="more-menu" v-if="showMenu" @click="showMenu = false">
      <view class="menu-content" @click.stop>
        <view class="menu-item" @click="clearContext">
          <text class="menu-icon">🗑️</text>
          <text>清除上下文</text>
        </view>
        <view class="menu-item" @click="refreshChat">
          <text class="menu-icon">🔄</text>
          <text>重新开始</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useRouter, useRoute } from '@/common/route'
import { virtualUserService } from '../services/virtualUserService'
import { DEFAULT_AVATAR } from '@/common/constants'
import { useUserStore } from '../store/user-info'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const defaultAvatar = DEFAULT_AVATAR

const chatUser = ref({
  id: route.params.id,
  name: '虚拟人',
  avatar: defaultAvatar,
  online_status: 1,
  gender: 0,
  age: 0,
  region: '',
  intro: ''
})
const messages = ref([])
const inputText = ref('')
const sending = ref(false)
const showMenu = ref(false)
const messagesArea = ref(null)
const myAvatar = ref(defaultAvatar)

const quickReplies = [
  '你好',
  '你能做什么？',
  '讲个笑话',
  '推荐一首歌'
]

const isOnline = computed(() => chatUser.value.online_status === 1)

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  if (Number.isNaN(date.getTime())) return ''
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const loadChatHistory = async () => {
  try {
    const res = await virtualUserService.getChatHistory(chatUser.value.id)
    const list = res.data?.list || (Array.isArray(res.data) ? res.data : [])
    if (list.length > 0) {
      messages.value = list.map(msg => ({
        content: msg.content || '',
        // sender: 0-用户，1-虚拟人；兼容历史数据（sender 缺失时回退 type===0）
        isSelf: msg.sender === 0 || (msg.sender === undefined && msg.type === 0),
        time: msg.create_time,
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
      chatUser.value = {
        id: res.data.id || chatUser.value.id,
        name: res.data.name || '虚拟人',
        avatar: res.data.avatar || defaultAvatar,
        online_status: res.data.online_status === 1 ? 1 : 0,
        gender: res.data.gender || 0,
        age: res.data.age || 0,
        region: res.data.region || '',
        intro: res.data.intro || ''
      }
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }

  // 使用 Pinia store 的当前头像，不再读取已废弃的 'userInfo' localStorage key（F-10）
  myAvatar.value = userStore.avatar || defaultAvatar
}

// 轻量轮询在线状态：随机在线调度器会动态上下线，需周期性同步
let onlineTimer = null
const refreshOnlineStatus = async () => {
  try {
    const res = await virtualUserService.getVirtualUser(chatUser.value.id)
    if (res.data) {
      chatUser.value.online_status = res.data.online_status === 1 ? 1 : 0
    }
  } catch (error) {
    console.error('刷新在线状态失败:', error)
  }
}

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || sending.value) return
  if (!isOnline.value) {
    console.warn('对方离线，无法发送消息')
    return
  }

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
      lastMsg.content = res.data?.content || '好的'
      lastMsg.time = res.data?.create_time || Math.floor(Date.now() / 1000)
      lastMsg.isLoading = false
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    const lastMsg = messages.value[messages.value.length - 1]
    if (lastMsg.isLoading) {
      const errMsg = (error && error.message) || ''
      if (errMsg.includes('离线')) {
        // 对方已下线：同步本地状态，提示消息未送达
        chatUser.value.online_status = 0
        messages.value.pop()
        messages.value.push({
          content: '对方离线，消息未送达，请稍后再试',
          isSelf: false,
          time: Math.floor(Date.now() / 1000),
          isLoading: false
        })
      } else {
        lastMsg.content = '抱歉，我遇到了一些问题，请稍后再试。'
        lastMsg.time = Math.floor(Date.now() / 1000)
        lastMsg.isLoading = false
      }
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
  onlineTimer = setInterval(refreshOnlineStatus, 30000)
})

onBeforeUnmount(() => {
  if (onlineTimer) {
    clearInterval(onlineTimer)
    onlineTimer = null
  }
})
</script>

<style scoped>
.ai-chat-page {
  display: flex;
  flex-direction: column;
  height: 100dvh;
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

.offline-tip {
  background: #fff7e6;
  color: #d46b08;
  font-size: 12px;
  padding: 8px 16px;
  text-align: center;
  border-bottom: 1px solid #ffe7ba;
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

.quick-reply.disabled {
  background: #f5f5f5;
  color: #bbb;
  cursor: not-allowed;
}

.quick-reply.disabled:hover {
  background: #f5f5f5;
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

/* PC 端与 ChatRoom 对齐：同宽居中、下拉菜单限宽 */
@media (min-width: 768px) {
  .ai-chat-page {
    max-width: var(--layout-max-width-pc, 650px);
    margin: 0 auto;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.06);
  }

  .more-menu {
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: var(--layout-max-width-pc, 650px);
  }
}

@media (min-width: 1024px) {
  .ai-chat-page {
    max-width: var(--layout-max-width-pc-lg, 720px);
  }

  .more-menu {
    max-width: var(--layout-max-width-pc-lg, 720px);
  }
}
</style>