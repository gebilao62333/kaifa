<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">虚拟人</text>
      <text class="placeholder"></text>
    </template>

    <view class="search-bar">
      <input
        v-model="searchKeyword"
        class="search-input"
        placeholder="搜索虚拟人..."
        @input="handleSearch"
      />
    </view>

    <view class="category-tabs">
      <view
        v-for="tab in categoryTabs"
        :key="tab.key"
        :class="['tab-item', { active: activeTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        <text class="tab-icon">{{ tab.icon }}</text>
        <text class="tab-label">{{ tab.label }}</text>
      </view>
    </view>

    <view class="user-list">
      <view
        v-for="(user, index) in filteredUsers"
        :key="user.id"
        :class="['user-item', { 'no-border': index === filteredUsers.length - 1 }]"
        @click="startChat(user)"
      >
        <view class="avatar-wrap">
          <image mode="aspectFill" class="avatar" :src="user.avatar || defaultAvatar" alt="" />
          <view class="online-dot" :class="{ online: user.online_status === 1 }"></view>
        </view>
        <view class="user-info">
          <view class="name-row">
            <text class="nickname">{{ user.name }}</text>
            <text class="gender-tag" v-if="user.gender">{{ genderText(user.gender) }}</text>
            <text class="age-tag" v-if="user.age">{{ user.age }}岁</text>
            <text class="recommend-tag" v-if="user.is_recommend === 1">推荐</text>
          </view>
          <view class="region-row" v-if="user.region">
            <text class="region-text">📍 {{ user.region }}</text>
            <text class="price-text" v-if="user.price_per_hour">¥{{ user.price_per_hour }}/小时</text>
          </view>
          <view class="desc-row" v-if="user.intro">
            <text class="desc-text">{{ user.intro }}</text>
          </view>
        </view>
        <view class="action-btn">
          <text class="chat-icon">💬</text>
        </view>
      </view>

      <view class="loading-state" v-if="loading">
        <view class="loading-text">加载中...</view>
      </view>

      <view class="empty-state" v-if="!loading && filteredUsers.length === 0">
        <view class="empty-icon">🤖</view>
        <view class="empty-text">暂无虚拟人</view>
        <view class="empty-hint">稍后再来看看吧</view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import { virtualUserService } from '../services/virtualUserService'
import { genAvatar } from '../utils/placeholder'
import PageLayout from '../components/PageLayout.vue'

const router = useRouter()
const activeTab = ref('all')
const searchKeyword = ref('')
const loading = ref(false)
const allUsers = ref([])
const defaultAvatar = genAvatar('default')

const categoryTabs = [
  { key: 'all', label: '全部', icon: '🤖' },
  { key: 'online', label: '在线', icon: '🟢' },
  { key: 'recommend', label: '推荐', icon: '⭐' }
]

const genderText = (gender) => {
  const genderMap = { 0: '保密', 1: '男', 2: '女' }
  return genderMap[gender] || '保密'
}

const filteredUsers = computed(() => {
  let users = allUsers.value

  if (activeTab.value === 'online') {
    users = users.filter(u => u.online_status === 1)
  } else if (activeTab.value === 'recommend') {
    users = users.filter(u => u.is_recommend === 1)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    users = users.filter(u =>
      (u.name && u.name.toLowerCase().includes(keyword)) ||
      (u.intro && u.intro.toLowerCase().includes(keyword)) ||
      (u.region && u.region.toLowerCase().includes(keyword))
    )
  }

  return users
})

// silent：返回本页刷新时不切整页 loading，避免列表被「加载中」覆盖闪烁
const loadUsers = async (silent = false) => {
  if (!silent) loading.value = true
  try {
    const res = await virtualUserService.getVirtualUsers({ pageSize: 100, status: 1 })
    if (res.data && res.data.list) {
      allUsers.value = res.data.list
    } else if (Array.isArray(res.data)) {
      allUsers.value = res.data
    }
  } catch (error) {
    console.error('加载虚拟用户失败:', error)
  } finally {
    if (!silent) loading.value = false
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

// 虚拟用户的在线/推荐状态由服务端定时更新，返回本页时静默同步
const refreshOnShow = () => {
  loadUsers(true)
}

// 首次 onShow 由 onMounted 首载，后续 onShow（返回本页）才静默刷新
let __firstShow = true
onShow(() => {
  if (__firstShow) {
    __firstShow = false
    return
  }
  refreshOnShow()
})

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.back-btn {
  font-size: 20px;
  cursor: pointer;
  color: white;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 500;
  color: white;
}

.placeholder {
  width: 40px;
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

.gender-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #e3f2fd;
  color: #2196f3;
}

.age-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f0f0f0;
  color: #666;
}

.recommend-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #fff3e0;
  color: #ff9800;
}

.region-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.region-text {
  font-size: 12px;
  color: #666;
}

.price-text {
  font-size: 12px;
  color: #e91e63;
  font-weight: 500;
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
