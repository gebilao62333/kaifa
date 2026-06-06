<template>
  <div class="chat-users-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">交友</span>
      <span style="width: 40px;"></span>
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
        :key="user.userId"
        :class="['user-item', { 'no-border': index === filteredUsers.length - 1 }]"
        @click="goUserProfile(user)"
      >
        <div class="avatar-wrap">
          <img class="avatar" :src="user.avatar" alt="" />
          <div class="online-dot" v-if="user.isOnline"></div>
        </div>
        <div class="user-info">
          <div class="name-row">
            <span class="nickname">{{ user.nickName }}</span>
            <span class="gender-tag" :class="user.gender">{{ user.gender === 'male' ? '♂' : '♀' }}</span>
            <span class="level-tag">Lv.{{ user.level }}</span>
            <span class="vip-tag" v-if="user.isVip">VIP</span>
          </div>
          <div class="tags-row">
            <span v-for="tag in user.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <div class="meta-row">
            <span class="status-text" :class="{ online: user.isOnline }">
              {{ user.isOnline ? '在线' : '离线' }}
            </span>
            <span class="region-text" v-if="user.region">{{ user.region }}</span>
          </div>
        </div>
        <button class="chat-btn" @click.stop="startChat(user)">聊天</button>
      </div>

      <div class="empty-state" v-if="filteredUsers.length === 0">
        <div class="empty-icon">👥</div>
        <div class="empty-text">暂无用户</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user-info'
import homeService from '../services/homeService'
import { toast } from '../composables/useToast'
import { generateMockChatUsers } from '../common/mockData'

const router = useRouter()
const activeTab = ref('online')
const loading = ref(false)

const categoryTabs = [
  { key: 'online', label: '在线用户', icon: '🟢' },
  { key: 'male', label: '男用户', icon: '👨' },
  { key: 'female', label: '女用户', icon: '👩' },
  { key: 'active', label: '活跃用户', icon: '🔥' },
  { key: 'newbie', label: '萌新', icon: '🌱' }
]

const allUsers = ref([])

const filteredUsers = computed(() => {
  const tab = activeTab.value
  switch (tab) {
    case 'online':
      return allUsers.value.filter(u => u.online)
    case 'male':
      return allUsers.value.filter(u => u.gender === 'male')
    case 'female':
      return allUsers.value.filter(u => u.gender === 'female')
    case 'active':
      return [...allUsers.value].sort((a, b) => b.activityScore - a.activityScore).slice(0, 20)
    case 'newbie':
      return allUsers.value.filter(u => u.isNewbie)
    default:
      return allUsers.value
  }
})

const loadUsers = async () => {
  loading.value = true
  
  const userStore = useUserStore()
  const rawToken = localStorage.getItem('token')
  const storeToken = userStore.token
  const validToken = rawToken && rawToken !== 'undefined' && rawToken !== 'null' ? rawToken : storeToken
  const properlyLoggedIn = !!validToken && !!userStore.profile

  if (properlyLoggedIn) {
    try {
      const result = await homeService.getRecommendCompanions({ page: 1, pageSize: 50 })
      
      if (result && result.code === 200 && result.data) {
        const list = result.data.list || result.data
        allUsers.value = list.map(user => ({
          userId: user.userId || user.id,
          nickName: user.nickName || user.nickname,
          avatar: user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=chatuser',
          gender: user.gender || 'unknown',
          level: user.level || 1,
          online: user.online || false,
          isVip: user.vip === 1 || user.vip === true,
          isNewbie: user.level < 10,
          activityScore: user.activityScore || 50,
          tags: user.tags || [],
          region: user.region || user.city || ''
        }))
        return
      }
    } catch (error) {
      console.warn('加载用户列表失败，使用模拟数据:', error.message)
    }
  }
  
  useMockData()
  loading.value = false
}

const useMockData = () => {
  allUsers.value = generateMockChatUsers(50).map(user => ({
    userId: user.userId,
    nickName: user.nickName,
    avatar: user.avatar,
    gender: user.gender,
    level: user.level,
    online: user.online,
    isVip: user.isVip,
    isNewbie: user.isNewbie,
    activityScore: user.activityScore,
    tags: user.tags,
    region: user.region
  }))
}

const switchTab = (tabKey) => {
  activeTab.value = tabKey
}

const goUserProfile = (user) => {
  router.push({ name: 'UserProfile', params: { id: user.userId } })
}

const startChat = (user) => {
  router.push(`/chat-room/${user.userId}`)
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.chat-users-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: var(--bg-secondary);
  padding-bottom: 80px;
  padding-bottom: calc(80px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: calc(12px + constant(safe-area-inset-top, 0px));
  padding-top: calc(12px + env(safe-area-inset-top, 0px));
  height: 50px;
  height: calc(50px + constant(safe-area-inset-top, 0px));
  height: calc(50px + env(safe-area-inset-top, 0px));
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  box-sizing: border-box;
}

.back-btn {
  font-size: 24px;
  color: white;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: 17px;
  font-weight: bold;
  color: white;
}

.category-tabs {
  display: flex;
  background: var(--bg-primary);
  padding: 10px 12px 73px;
  overflow-x: auto;
  gap: 8px;
  height: 70px;
  width: 100%;
  box-sizing: border-box;
  margin-top: 60px;
}

.tab-item {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-item.active .tab-label {
  color: var(--primary-color);
  font-weight: 600;
}

.tab-icon {
  font-size: 20px;
}

.tab-label {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.user-list {
  padding: 12px 16px;
  width: 100%;
  box-sizing: border-box;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 16px 12px;
  background: var(--bg-primary);
  border-radius: 16px;
  margin-bottom: 10px;
  box-shadow: var(--shadow-light);
  cursor: pointer;
  transition: all 0.2s;
}

.user-item:active {
  transform: scale(0.98);
  background: var(--bg-secondary);
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
  margin-right: 14px;
}

.avatar {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  object-fit: cover;
}

.online-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 12px;
  height: 12px;
  background: #4cd964;
  border-radius: 50%;
  border: 2px solid white;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.nickname {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gender-tag {
  font-size: 12px;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 600;
}

.gender-tag.male {
  background: rgba(255, 107, 129, 0.15);
  color: #FF6B81;
}

.gender-tag.female {
  background: rgba(255, 107, 129, 0.15);
  color: var(--primary-color);
}

.level-tag {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-secondary);
  padding: 1px 6px;
  border-radius: 4px;
}

.vip-tag {
  font-size: 10px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.tags-row {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.tag {
  font-size: 11px;
  color: var(--primary-color);
  background: rgba(255, 107, 129, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-text {
  font-size: 12px;
  color: var(--text-muted);
}

.status-text.online {
  color: var(--success-color);
}

.region-text {
  font-size: 12px;
  color: var(--text-muted);
}

.chat-btn {
  flex-shrink: 0;
  width: 56px;
  height: 32px;
  background: var(--gradient-primary);
  border: none;
  border-radius: 16px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 10px;
}

.chat-btn:active {
  transform: scale(0.92);
  opacity: 0.8;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  color: var(--text-muted);
}

@media (min-width: 768px) {
  .chat-users-page {
    max-width: 650px;
    margin: 0 auto;
    position: relative;
  }

  .header {
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 0 0 16px 16px;
    padding: 14px 20px;
  }

  .category-tabs,
  .user-list {
    padding-left: 20px;
    padding-right: 20px;
  }
}

@media (min-width: 1024px) {
  .chat-users-page {
    max-width: 720px;
  }

  .header {
    max-width: 720px;
  }
}
</style>
