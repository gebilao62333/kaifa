<template>
  <PageLayout>
    <template #nav>
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input
          ref="inputRef"
          v-model="searchKeyword"
          class="search-input"
          type="text"
          placeholder="搜索用户、帖子、游戏"
          @input="onSearch"
          @keyup.enter="doSearch"
        />
        <text v-if="searchKeyword" class="clear-icon" @click="clearSearch">✕</text>
      </view>
      <text class="cancel-btn" @click="goBack">取消</text>
    </template>

    <view v-if="!searchKeyword" class="search-content">
      <view v-if="searchHistory.length > 0" class="history-section">
        <view class="section-header">
          <text class="section-title">搜索历史</text>
          <text class="clear-history" @click="clearHistory">清空</text>
        </view>
        <view class="history-list">
          <text
            v-for="(item, index) in searchHistory"
            :key="index"
            class="history-item"
            @click="searchFromHistory(item)"
          >
            {{ item }}
          </text>
        </view>
      </view>

      <view class="hot-section">
        <view class="section-header">
          <text class="section-title">热门搜索</text>
        </view>
        <view class="hot-list">
          <view
            v-for="(item, index) in hotList"
            :key="index"
            class="hot-item"
            @click="searchKeyword = item.keyword"
          >
            <text class="hot-rank" :class="{ top: index < 3 }">{{ index + 1 }}</text>
            <text class="hot-keyword">{{ item.keyword }}</text>
            <text class="hot-tag" v-if="item.tag">{{ item.tag }}</text>
          </view>
        </view>
      </view>

      <view class="category-section">
        <view class="section-title">分类浏览</view>
        <view class="category-grid">
          <view class="category-item" @click="goCategory('game')">
            <text class="category-icon">🎮</text>
            <text class="category-name">游戏</text>
          </view>
          <view class="category-item" @click="goCategory('user')">
            <text class="category-icon">👤</text>
            <text class="category-name">用户</text>
          </view>
          <view class="category-item" @click="goCategory('post')">
            <text class="category-icon">📝</text>
            <text class="category-name">帖子</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="search-result">
      <view v-if="loading" class="loading">
        <text>搜索中...</text>
      </view>

      <view v-else-if="searchResults.users.length === 0 && searchResults.posts.length === 0 && searchResults.games.length === 0" class="empty">
        <text class="empty-icon">🔍</text>
        <text class="empty-text">未找到相关结果</text>
      </view>

      <view v-else class="result-list">
        <view v-if="searchResults.users.length > 0" class="result-section">
          <view class="result-header">
            <text class="result-title">用户</text>
            <text class="result-more" @click="viewMore('user')">查看更多 ›</text>
          </view>
          <view class="user-list">
            <view v-for="user in searchResults.users" :key="user.userId" class="user-item" @click="goUserProfile(user.userId)">
              <image mode="scaleToFill" class="user-avatar" :src="user.avatar" alt="" />
              <view class="user-info">
                <view class="user-name">{{ user.nickName }}</view>
                <view class="user-level" v-if="user.level">Lv.{{ user.level }}</view>
              </view>
              <view class="follow-btn" :class="{ following: user.isFollow }" @click.stop="toggleFollow(user)">
                {{ user.isFollow ? '已关注' : '关注' }}
              </view>
            </view>
          </view>
        </view>

        <view v-if="searchResults.posts.length > 0" class="result-section">
          <view class="result-header">
            <text class="result-title">帖子</text>
            <text class="result-more" @click="viewMore('post')">查看更多 ›</text>
          </view>
          <view class="post-list">
            <view v-for="post in searchResults.posts" :key="post.postId" class="post-item" @click="goPostDetail(post.postId)">
              <view class="post-content">{{ post.content }}</view>
              <view v-if="post.images && post.images.length > 0" class="post-images">
                <image class="post-img-thumb" mode="aspectFill" v-for="(img, idx) in post.images.slice(0, 3)" :key="idx" :src="img" />
              </view>
              <view class="post-meta">
                <text class="post-author">{{ post.nickName }}</text>
                <text class="post-time">{{ formatTime(post.createTime) }}</text>
              </view>
            </view>
          </view>
        </view>

        <view v-if="searchResults.games.length > 0" class="result-section">
          <view class="result-header">
            <text class="result-title">游戏</text>
            <text class="result-more" @click="viewMore('game')">查看更多 ›</text>
          </view>
          <view class="game-list">
            <view v-for="game in searchResults.games" :key="game.gameId" class="game-item" @click="goGameDetail(game.gameId)">
              <image mode="scaleToFill" class="game-icon" :src="game.icon" alt="" />
              <view class="game-info">
                <view class="game-name">{{ game.name }}</view>
                <view class="game-count">{{ game.playerCount }}人在玩</view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from '@/common/route'
import { debounce } from '@/common/common'
import homeService from '@/services/homeService'
import searchService from '@/services/searchService'
import authService from '@/services/authService'
import { toast } from '@/composables/useToast'
import PageLayout from '../components/PageLayout.vue'
import storage from '../common/storage'
import { formatTimeAgo } from '../common/time'

const router = useRouter()
const inputRef = ref(null)

const focusInput = () => {
  const el = inputRef.value
  if (!el) return
  if (typeof el.focus === 'function') { el.focus(); return }
  if (el.$el && typeof el.$el.focus === 'function') el.$el.focus()
}

const searchKeyword = ref('')
const loading = ref(false)
const searchHistory = ref([])
const hotList = ref([
  { keyword: '王者荣耀', tag: '热门' },
  { keyword: '和平精英', tag: '热门' },
  { keyword: '英雄联盟', tag: '' },
  { keyword: '陪玩师小美', tag: '沸' },
  { keyword: '狼人杀', tag: '' },
  { keyword: '剧本杀', tag: '' },
  { keyword: '聊天搭子', tag: '' },
  { keyword: '上分车队', tag: '' }
])

const searchResults = reactive({
  users: [],
  posts: [],
  games: []
})

onMounted(async () => {
  const history = storage.getItem('searchHistory')
  if (history) {
    try {
      const parsed = JSON.parse(history)
      searchHistory.value = Array.isArray(parsed) ? parsed : []
    } catch (e) {
      // 本机历史损坏时按空列表处理，不阻断搜索页启动
      searchHistory.value = []
    }
  }
  focusInput()
  try {
    const res = await homeService.getHotSearch()
    if (res && res.code === 200 && res.data && res.data.list && res.data.list.length) {
      hotList.value = res.data.list
    }
  } catch (e) {
    // 保留默认热搜词
  }
})

// 输入防抖：停止输入 300ms 后再搜索，避免每个字符都触发一次接口请求
const onSearch = debounce(() => {
  if (searchKeyword.value.trim()) {
    doSearch()
  }
}, 300)

const doSearch = async () => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) return

  loading.value = true
  saveToHistory(keyword)

  // 三类结果并行请求，单类失败不影响其它类展示
  // P2-8：「用户」分类改为普通用户搜索（昵称模糊、排除自己、遵守被搜索隐私开关），
  // 不再复用陪玩师列表，避免普通用户搜不到。
  const [userRes, postRes, gameRes] = await Promise.allSettled([
    searchService.searchUsers({ keyword, page: 1, pageSize: 20 }),
    searchService.searchPosts({ keyword, page: 1, pageSize: 20 }),
    searchService.searchGames({ keyword })
  ])

  const pick = (settled) => {
    if (settled.status !== 'fulfilled') return []
    const res = settled.value
    return (res && res.code === 200 && res.data) ? (res.data.list || []) : []
  }

  searchResults.users = pick(userRes).map(c => ({
    userId: c.userId || c.id,
    nickName: c.nickname || c.nickName || '',
    avatar: c.avatar || '',
    level: c.level || 1,
    sex: c.sex || 0,
    fansCount: c.fansCount || 0,
    // 搜索接口不返回关注态，默认未关注，点击「关注」走真实接口后本地同步
    isFollow: !!c.isFollow
  }))

  searchResults.posts = pick(postRes).map(p => ({
    postId: p.postId,
    content: p.content || '',
    images: Array.isArray(p.images) ? p.images : [],
    nickName: p.nickname || '',
    createTime: p.createTime
  }))

  searchResults.games = pick(gameRes).map(g => ({
    gameId: g.gameId,
    name: g.name || '',
    icon: g.icon || '',
    playerCount: g.playerCount || 0
  }))

  loading.value = false
}

const saveToHistory = (keyword) => {
  let history = searchHistory.value
  history = history.filter(h => h !== keyword)
  history.unshift(keyword)
  history = history.slice(0, 10)
  searchHistory.value = history
  storage.setItem('searchHistory', JSON.stringify(history))
}

const clearHistory = () => {
  searchHistory.value = []
  storage.removeItem('searchHistory')
}

const searchFromHistory = (keyword) => {
  searchKeyword.value = keyword
  doSearch()
}

const clearSearch = () => {
  searchKeyword.value = ''
  searchResults.users = []
  searchResults.posts = []
  searchResults.games = []
  focusInput()
}

const goBack = () => {
  router.back()
}

const goCategory = (type) => {
  if (type === 'game') {
    router.push('/game-index')
  } else if (type === 'user') {
    router.push('/companion-list?type=all')
  } else {
    // 帖子分类浏览直接用广场信息流（服务端已按可见范围过滤）
    router.push('/square')
  }
}

const goUserProfile = (userId) => {
  router.push({ name: 'UserProfile', params: { id: userId } })
}

const goPostDetail = (postId) => {
  router.push('/post-detail/' + postId)
}

const goGameDetail = (gameId) => {
  router.push(`/companion-list?gameId=${gameId}`)
}

// 关注/取关走真实接口，成功后本地同步状态
const toggleFollow = async (user) => {
  const targetUserId = user.userId
  try {
    if (user.isFollow) {
      await authService.unfollow(targetUserId)
    } else {
      await authService.follow(targetUserId)
    }
    user.isFollow = !user.isFollow
  } catch (err) {
    toast.error(err.message || '操作失败，请重试')
  }
}

const viewMore = (type) => {
  if (type === 'game') {
    router.push('/game-index')
  } else if (type === 'user') {
    router.push('/companion-list?type=all')
  } else {
    router.push('/square')
  }
}

// 搜索帖子 DTO 的 createTime 为秒级，必须归一后再算相对时间
const formatTime = (timestamp) => formatTimeAgo(timestamp, { fallback: 'days' })
</script>

<style scoped>
.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20px;
  padding: 8px 16px;
  margin-right: 12px;
}

.search-icon {
  margin-right: 8px;
  font-size: 14px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: #999;
}

.clear-icon {
  color: #999;
  font-size: 12px;
  cursor: pointer;
}

.cancel-btn {
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.search-content {
  padding: 16px;
}

.history-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.clear-history {
  font-size: 12px;
  color: #999;
  cursor: pointer;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-item {
  background: #fff;
  padding: 6px 12px;
  border-radius: 14px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.hot-section {
  margin-bottom: 24px;
}

.hot-list {
  background: #fff;
  border-radius: 0px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.hot-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.hot-item:last-child {
  border-bottom: none;
}

.hot-rank {
  width: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #999;
}

.hot-rank.top {
  color: #ff4d4f;
}

.hot-keyword {
  flex: 1;
  font-size: 14px;
  color: #333;
  margin-left: 12px;
}

.hot-tag {
  font-size: 10px;
  color: #ff4d4f;
  background: #fff1f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.category-section {
  margin-bottom: 24px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  padding: 20px 0;
  border-radius: 0px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.category-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.category-name {
  font-size: 13px;
  color: #333;
}

.search-result {
  padding: 16px;
}

.loading, .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
}

.result-section {
  background: #fff;
  border-radius: 0px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.result-more {
  font-size: 12px;
  color: #999;
  cursor: pointer;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  margin-right: 12px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 14px;
  color: #333;
}

.user-level {
  font-size: 12px;
  color: #999;
}

.follow-btn {
  padding: 4px 12px;
  background: var(--gradient-primary);
  color: #fff;
  font-size: 12px;
  border-radius: 12px;
  cursor: pointer;
}

.follow-btn.following {
  background: #f5f5f5;
  color: #999;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-item {
  cursor: pointer;
}

.post-content {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 8px;
}

.post-images {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.post-images .post-img-thumb {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
}

.post-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.game-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.game-item {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.game-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  margin-right: 12px;
}

.game-name {
  font-size: 14px;
  color: #333;
}

.game-count {
  font-size: 12px;
  color: #999;
}
</style>