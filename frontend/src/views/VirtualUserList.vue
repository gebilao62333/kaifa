<template>
  <div class="virtual-user-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">AI 陪聊</span>
      <span style="width: 40px;"></span>
    </div>

    <div class="search-bar">
      <input
        v-model="searchKeyword"
        class="search-input"
        placeholder="搜索AI助手..."
        @input="handleSearch"
      />
    </div>

    <div class="category-tabs">
      <div
        v-for="tab in categoryTabs"
        :key="tab.key"
        :class="['tab-item', { active: activeTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </div>
    </div>

    <div class="user-list">
      <div
        v-for="(user, index) in filteredUsers"
        :key="user.id"
        :class="['user-item', { 'no-border': index === filteredUsers.length - 1 }]"
        @click="startChat(user)"
      >
        <div class="avatar-wrap">
          <img class="avatar" :src="user.avatar || defaultAvatar" alt="" />
          <div class="online-dot" :class="{ online: user.isOnline }"></div>
        </div>
        <div class="user-info">
          <div class="name-row">
            <span class="nickname">{{ user.nickname }}</span>
            <span class="role-tag" :class="user.role">{{ getRoleName(user.role) }}</span>
          </div>
          <div class="style-row" v-if="user.dialogueStyle">
            <span class="style-tag">{{ getStyleName(user.dialogueStyle) }}</span>
          </div>
          <div class="desc-row" v-if="user.description">
            <span class="desc-text">{{ user.description }}</span>
          </div>
        </div>
        <div class="action-btn">
          <span class="chat-icon">💬</span>
        </div>
      </div>

      <div class="loading-state" v-if="loading">
        <div class="loading-text">加载中...</div>
      </div>

      <div class="empty-state" v-if="!loading && filteredUsers.length === 0">
        <div class="empty-icon">🤖</div>
        <div class="empty-text">暂无AI助手</div>
        <div class="empty-hint">稍后再来看看吧</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { virtualUserService } from '../services/virtualUserService'

const router = useRouter()
const activeTab = ref('all')
const searchKeyword = ref('')
const loading = ref(false)
const allUsers = ref([])
const defaultAvatar = 'https://picsum.photos/200/200'

const categoryTabs = [
  { key: 'all', label: '全部', icon: '🤖' },
  { key: 'online', label: '在线', icon: '🟢' },
  { key: 'companion', label: '陪玩', icon: '🎮' },
  { key: 'assistant', label: '助手', icon: '💼' },
  { key: 'guide', label: '向导', icon: '🧭' }
]

const getRoleName = (role) => {
  const roleMap = {
    'default': '默认',
    'companion': '陪玩师',
    'guide': '向导',
    'assistant': '助手'
  }
  return roleMap[role] || '默认'
}

const getStyleName = (style) => {
  const styleMap = {
    'friendly': '友好亲切',
    'professional': '专业严谨',
    'humorous': '幽默风趣',
    'cute': '可爱俏皮'
  }
  return styleMap[style] || '友好亲切'
}

const filteredUsers = computed(() => {
  let users = allUsers.value

  if (activeTab.value === 'online') {
    users = users.filter(u => u.isOnline)
  } else if (activeTab.value !== 'all') {
    users = users.filter(u => u.role === activeTab.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    users = users.filter(u =>
      u.nickname.toLowerCase().includes(keyword) ||
      (u.description && u.description.toLowerCase().includes(keyword))
    )
  }

  return users
})

const loadUsers = async () => {
  loading.value = true
  try {
    const res = await virtualUserService.getVirtualUsers()
    if (res.data && res.data.list) {
      allUsers.value = res.data.list
    } else if (Array.isArray(res.data)) {
      allUsers.value = res.data
    }
  } catch (error) {
    console.error('加载虚拟用户失败:', error)
  } finally {
    loading.value = false
  }
}

const switchTab = (key) => {
  activeTab.value = key
}

const handleSearch = () => {
  // Search is handled by computed property
}

const goBack = () => {
  router.back()
}

const startChat = (user) => {
  router.push(`/ai-chat/${user.id}`)
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.virtual-user-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: #f5f5f5;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
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
}

.title {
  font-size: 17px;
  font-weight: 500;
}

.search-bar {
  padding: 12px 16px;
  background: #fff;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 18px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #007aff;
}

.category-tabs {
  display: flex;
  padding: 8px 12px;
  background: #fff;
  gap: 8px;
  overflow-x: auto;
}

.tab-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 16px;
  background: #f0f0f0;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-item.active {
  background: #007aff;
  color: #fff;
}

.tab-icon {
  margin-right: 4px;
}

.user-list {
  background: #fff;
  margin-top: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.user-item.no-border {
  border-bottom: none;
}

.avatar-wrap {
  position: relative;
  margin-right: 12px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ccc;
  border: 2px solid #fff;
}

.online-dot.online {
  background: #4cd964;
}

.user-info {
  flex: 1;
  overflow: hidden;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.nickname {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.role-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #e8f5e9;
  color: #4caf50;
}

.role-tag.companion {
  background: #e3f2fd;
  color: #2196f3;
}

.role-tag.guide {
  background: #fff3e0;
  color: #ff9800;
}

.role-tag.assistant {
  background: #f3e5f5;
  color: #9c27b0;
}

.style-row {
  margin-bottom: 4px;
}

.style-tag {
  font-size: 12px;
  color: #666;
}

.desc-row {
  overflow: hidden;
}

.desc-text {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-btn {
  margin-left: 12px;
}

.chat-icon {
  font-size: 24px;
}

.loading-state,
.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.loading-text,
.empty-text {
  font-size: 14px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-hint {
  font-size: 12px;
  color: #bbb;
  margin-top: 8px;
}
</style>