<template>
  <view class="chat-users-page">
    <view class="header">
      <text class="back-btn" @click="goBack">←</text>
      <text class="title">交友</text>
      <text style="width: 40px;"></text>
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
      <view class="empty-state" v-if="loading">
        <view class="empty-icon">⏳</view>
        <view class="empty-text">加载中...</view>
      </view>

      <view class="empty-state" v-else-if="loadError">
        <view class="empty-icon">⚠️</view>
        <view class="empty-text">{{ loadError }}</view>
        <button class="retry-btn" @click="loadUsers">重新加载</button>
      </view>

      <view
        v-for="(user, index) in (loading || loadError ? [] : filteredUsers)"
        :key="user.userId"
        :class="['user-item', { 'no-border': index === filteredUsers.length - 1 }]"
        @click="goUserProfile(user)"
      >
        <view class="avatar-wrap">
          <image mode="aspectFill" class="avatar" :src="user.avatar" alt="" />
          <view class="online-dot" v-if="user.online"></view>
        </view>
        <view class="user-info">
          <view class="name-row">
            <text class="nickname">{{ user.nickName }}</text>
            <text v-if="user.gender === 'male' || user.gender === 'female'" class="gender-tag" :class="user.gender">{{ user.gender === 'male' ? '♂' : '♀' }}</text>
            <text class="level-tag">Lv.{{ user.level }}</text>
            <text class="vip-tag" v-if="user.isVip">VIP</text>
          </view>
          <view class="tags-row">
            <text v-for="tag in user.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</text>
          </view>
          <view class="meta-row">
            <text v-if="user.online !== null" class="status-text" :class="{ online: user.online }">
              {{ user.online ? '在线' : '离线' }}
            </text>
            <text v-else class="status-text">陪玩师</text>
            <text class="region-text" v-if="user.region">{{ user.region }}</text>
          </view>
        </view>
        <button class="chat-btn" @click.stop="startChat(user)">聊天</button>
      </view>

      <view class="empty-state" v-if="!loading && !loadError && filteredUsers.length === 0">
        <view class="empty-icon">👥</view>
        <view class="empty-text">暂无用户</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import { useUserStore } from '../store/user-info'
import homeService from '../services/homeService'
import { STORAGE_KEYS, DEFAULT_AVATAR } from '../common/constants'

const router = useRouter()
// 默认必须是「全部」：此前默认「在线用户」，而列表 DTO 实际没有 online 字段，
// 过滤后恒为空，首页「交友」入口点进来永远显示「暂无用户」。
const activeTab = ref('all')
const loading = ref(false)

// 只保留有真实数据来源的分类：性别取 User.sex（1 男 / 2 女 / 0 保密），萌新按等级。
// 「在线/活跃」依赖后端批量字段，当前 DTO 未提供，先不下发假分类。
const categoryTabs = [
  { key: 'all', label: '全部', icon: '👥' },
  { key: 'male', label: '男用户', icon: '👨' },
  { key: 'female', label: '女用户', icon: '👩' },
  { key: 'newbie', label: '萌新', icon: '🌱' }
]

const allUsers = ref([])

const filteredUsers = computed(() => {
  const tab = activeTab.value
  switch (tab) {
    case 'male':
      return allUsers.value.filter(u => u.gender === 'male')
    case 'female':
      return allUsers.value.filter(u => u.gender === 'female')
    case 'newbie':
      return allUsers.value.filter(u => u.isNewbie)
    case 'all':
    default:
      return allUsers.value
  }
})

const loadError = ref('')

const loadUsers = async (silent = false) => {
  // 模板 @click="loadUsers" 会把点击事件当首参传入，这里只认显式 true
  silent = silent === true
  if (!silent) loading.value = true
  if (!silent) loadError.value = ''

  const userStore = useUserStore()
  const rawToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
  const storeToken = userStore.token
  const validToken = rawToken && rawToken !== 'undefined' && rawToken !== 'null' ? rawToken : storeToken

  if (!validToken) {
    loading.value = false
    router.replace('/login')
    return
  }

  try {
    const result = await homeService.getRecommendCompanions({ page: 1, pageSize: 50 })

    if (result && result.code === 200 && result.data) {
      loadError.value = ''
      const list = result.data.list || result.data || []
      allUsers.value = (Array.isArray(list) ? list : []).map(user => {
        const level = Number(user.level) || 1
        return {
          userId: user.userId || user.id,
          nickName: user.nickName || user.nickname || '用户',
          avatar: user.avatar || DEFAULT_AVATAR,
          // 后端 CompanionProfile 列表 DTO 返回 sex（0 保密/1 男/2 女）；online 字段缺失时保持 null，
          // 卡片不再对所有人显示「离线」。
          gender: Number(user.sex) === 1 ? 'male' : (Number(user.sex) === 2 ? 'female' : (user.gender || 'unknown')),
          level,
          online: user.online === 1 || user.online === true ? true : ((user.online === 0 || user.online === false) ? false : null),
          isVip: user.vip === 1 || user.vip === true,
          isNewbie: level < 10,
          tags: Array.isArray(user.tags) ? user.tags : [],
          region: user.region || user.city || ''
        }
      })
    } else if (!silent || allUsers.value.length === 0) {
      allUsers.value = []
      loadError.value = (result && result.message) || '加载用户列表失败'
    }
  } catch (error) {
    // 静默刷新（返回本页）失败时保留旧列表；列表本就为空则仍展示错误态
    if (!silent || allUsers.value.length === 0) {
      allUsers.value = []
      loadError.value = error?.message || '网络异常，请稍后重试'
    }
    console.warn('加载用户列表失败:', error?.message)
  } finally {
    if (!silent) loading.value = false
  }
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

// 返回用户列表页时静默刷新，不闪 loading、不重复首载
const refreshOnShow = () => {
  loadUsers(true)
}

onMounted(() => {
  loadUsers()
})
// 首次 onShow 由 onMounted 首载，后续 onShow（返回本页）才静默刷新
let __firstShow = true
onShow(() => {
  if (__firstShow) {
    __firstShow = false
    return
  }
  refreshOnShow()
})
</script>

<style scoped>
.chat-users-page {
  min-height: 100dvh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.header {
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  height: 50px;
  position: sticky;
  top: 0;
  z-index: 100;
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
  background: white;
  padding: 8px 12px 0;
  overflow-x: auto;
  overflow-y: hidden;
  gap: 8px;
  height: 70px;
}

.tab-item {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px 12px;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.tab-item.active {
  border-bottom-color: var(--color-primary);
}

.tab-item.active .tab-label {
  color: var(--color-primary);
  font-weight: 600;
}

.tab-icon {
  font-size: 20px;
}

.tab-label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.user-list {
  padding: 12px 16px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-radius: 0px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s;
}

.user-item:active {
  transform: scale(0.98);
  background: #f9f9f9;
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
  color: #333;
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
  background: rgba(102, 126, 234, 0.15);
  color: var(--color-primary);
}

.gender-tag.female {
  background: rgba(245, 87, 108, 0.15);
  color: #f5576c;
}

.level-tag {
  font-size: 11px;
  color: #999;
  background: #f5f5f5;
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
  color: var(--color-primary);
  background: rgba(102, 126, 234, 0.1);
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
  color: #999;
}

.status-text.online {
  color: #4cd964;
}

.region-text {
  font-size: 12px;
  color: #ccc;
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
  color: #999;
}

.retry-btn {
  margin-top: 12px;
  padding: 8px 24px;
  font-size: 14px;
  color: #fff;
  background: #ff6b81;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.retry-btn:active {
  opacity: 0.8;
}

@media (min-width: 768px) {
  .chat-users-page {
    max-width: 650px;
    margin: 0 auto;
    position: relative;
  }

  .header {
    max-width: 650px;
    width: 100%;
    padding: 14px 20px;
  }
}

@media (min-width: 1024px) {
  .chat-users-page {
    max-width: 720px;
  }

  .header {
    max-width: 720px;
    width: 100%;
    padding: 14px 20px;
  }
}
</style>
