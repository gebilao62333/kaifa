<template>
  <PageLayout>
    <template #nav>
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input
          ref="inputRef"
          v-model="searchKeyword"
          class="search-input"
          type="text"
          placeholder="搜索用户、帖子、游戏"
          @input="onSearch"
          @keyup.enter="doSearch"
        />
        <span v-if="searchKeyword" class="clear-icon" @click="clearSearch">✕</span>
      </div>
      <span class="cancel-btn" @click="goBack">取消</span>
    </template>

    <div v-if="!searchKeyword" class="search-content">
      <div v-if="searchHistory.length > 0" class="history-section">
        <div class="section-header">
          <span class="section-title">搜索历史</span>
          <span class="clear-history" @click="clearHistory">清空</span>
        </div>
        <div class="history-list">
          <span
            v-for="(item, index) in searchHistory"
            :key="index"
            class="history-item"
            @click="searchFromHistory(item)"
          >
            {{ item }}
          </span>
        </div>
      </div>

      <div class="hot-section">
        <div class="section-header">
          <span class="section-title">热门搜索</span>
        </div>
        <div class="hot-list">
          <div
            v-for="(item, index) in hotList"
            :key="index"
            class="hot-item"
            @click="searchKeyword = item.keyword"
          >
            <span class="hot-rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
            <span class="hot-keyword">{{ item.keyword }}</span>
            <span class="hot-tag" v-if="item.tag">{{ item.tag }}</span>
          </div>
        </div>
      </div>

      <div class="category-section">
        <div class="section-title">分类浏览</div>
        <div class="category-grid">
          <div class="category-item" @click="goCategory('game')">
            <span class="category-icon">🎮</span>
            <span class="category-name">游戏</span>
          </div>
          <div class="category-item" @click="goCategory('user')">
            <span class="category-icon">👤</span>
            <span class="category-name">用户</span>
          </div>
          <div class="category-item" @click="goCategory('post')">
            <span class="category-icon">📝</span>
            <span class="category-name">帖子</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="search-result">
      <div v-if="loading" class="loading">
        <span>搜索中...</span>
      </div>

      <div v-else-if="searchResults.users.length === 0 && searchResults.posts.length === 0 && searchResults.games.length === 0" class="empty">
        <span class="empty-icon">🔍</span>
        <span class="empty-text">未找到相关结果</span>
      </div>

      <div v-else class="result-list">
        <div v-if="searchResults.users.length > 0" class="result-section">
          <div class="result-header">
            <span class="result-title">用户</span>
            <span class="result-more" @click="viewMore('user')">查看更多 ›</span>
          </div>
          <div class="user-list">
            <div v-for="user in searchResults.users" :key="user.userId" class="user-item" @click="goUserProfile(user.userId)">
              <img class="user-avatar" :src="user.avatar" alt="" />
              <div class="user-info">
                <div class="user-name">{{ user.nickName }}</div>
                <div class="user-level" v-if="user.level">Lv.{{ user.level }}</div>
              </div>
              <div class="follow-btn" :class="{ following: user.isFollow }" @click.stop="toggleFollow(user)">
                {{ user.isFollow ? '已关注' : '关注' }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="searchResults.posts.length > 0" class="result-section">
          <div class="result-header">
            <span class="result-title">帖子</span>
            <span class="result-more" @click="viewMore('post')">查看更多 ›</span>
          </div>
          <div class="post-list">
            <div v-for="post in searchResults.posts" :key="post.postId" class="post-item" @click="goPostDetail(post.postId)">
              <div class="post-content">{{ post.content }}</div>
              <div v-if="post.images && post.images.length > 0" class="post-images">
                <img v-for="(img, idx) in post.images.slice(0, 3)" :key="idx" :src="img" alt="" />
              </div>
              <div class="post-meta">
                <span class="post-author">{{ post.nickName }}</span>
                <span class="post-time">{{ formatTime(post.createTime) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="searchResults.games.length > 0" class="result-section">
          <div class="result-header">
            <span class="result-title">游戏</span>
            <span class="result-more" @click="viewMore('game')">查看更多 ›</span>
          </div>
          <div class="game-list">
            <div v-for="game in searchResults.games" :key="game.gameId" class="game-item" @click="goGameDetail(game.gameId)">
              <img class="game-icon" :src="game.icon" alt="" />
              <div class="game-info">
                <div class="game-name">{{ game.name }}</div>
                <div class="game-count">{{ game.playerCount }}人在玩</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { debounce } from '@/common/common'
import homeService from '@/services/homeService'
import searchService from '@/services/searchService'
import authService from '@/services/authService'
import { toast } from '@/composables/useToast'
import PageLayout from '../components/PageLayout.vue'

const router = useRouter()
const inputRef = ref(null)

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
  const history = localStorage.getItem('searchHistory')
  if (history) {
    searchHistory.value = JSON.parse(history)
  }
  inputRef.value?.focus()
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
  const [userRes, postRes, gameRes] = await Promise.allSettled([
    homeService.searchCompanions({ keyword, page: 1, pageSize: 20 }),
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
    isFollow: false
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
  localStorage.setItem('searchHistory', JSON.stringify(history))
}

const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('searchHistory')
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
  inputRef.value?.focus()
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
    toast.info('帖子列表开发中')
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
    toast.info('帖子列表开发中')
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return Math.floor(diff / 86400000) + '天前'
}
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

.post-images img {
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