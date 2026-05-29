<template>
  <div class="search-page">
    <div class="search-header">
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
    </div>

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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

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

onMounted(() => {
  const history = localStorage.getItem('searchHistory')
  if (history) {
    searchHistory.value = JSON.parse(history)
  }
  inputRef.value?.focus()
})

const onSearch = () => {
  if (searchKeyword.value.trim()) {
    doSearch()
  }
}

const doSearch = () => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) return

  loading.value = true
  saveToHistory(keyword)

  setTimeout(() => {
    searchResults.users = mockSearchUsers(keyword)
    searchResults.posts = mockSearchPosts(keyword)
    searchResults.games = mockSearchGames(keyword)
    loading.value = false
  }, 300)
}

const mockSearchUsers = (keyword) => {
  const users = [
    { userId: 1, nickName: '小雪', avatar: 'https://picsum.photos/100/100', level: 28, isFollow: false },
    { userId: 2, nickName: '游戏大神', avatar: 'https://picsum.photos/100/100', level: 45, isFollow: false },
    { userId: 3, nickName: '陪玩师小美', avatar: 'https://picsum.photos/100/100', level: 32, isFollow: false }
  ]
  return users.filter(u => u.nickName.includes(keyword))
}

const mockSearchPosts = (keyword) => {
  const posts = [
    {
      postId: 1,
      content: keyword + '今天连胜五把，太开心了！有没有大神带我上分~',
      images: ['https://picsum.photos/200/200', 'https://picsum.photos/200/200'],
      nickName: '小雪',
      createTime: Date.now() - 3600000
    },
    {
      postId: 2,
      content: '求' + keyword + '陪玩，有兴趣的私聊我~',
      images: [],
      nickName: '玩家甲',
      createTime: Date.now() - 7200000
    }
  ]
  return posts.filter(p => p.content.includes(keyword))
}

const mockSearchGames = (keyword) => {
  const games = [
    { gameId: 1, name: '王者荣耀', icon: 'https://picsum.photos/100/100', playerCount: 1000 },
    { gameId: 2, name: '和平精英', icon: 'https://picsum.photos/100/100', playerCount: 800 },
    { gameId: 3, name: '英雄联盟', icon: 'https://picsum.photos/100/100', playerCount: 600 }
  ]
  return games.filter(g => g.name.includes(keyword))
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
  console.log('查看分类:', type)
}

const goUserProfile = (userId) => {
  router.push({ name: 'UserProfile', params: { id: userId } })
}

const goPostDetail = (postId) => {
  router.push('/post-detail/' + postId)
}

const goGameDetail = (gameId) => {
  console.log('查看游戏详情:', gameId)
}

const toggleFollow = (user) => {
  user.isFollow = !user.isFollow
}

const viewMore = (type) => {
  console.log('查看更多:', type)
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
.search-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: #f5f5f5;
  padding-top: 70px;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.search-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  height: 70px;
  box-sizing: border-box;
}

.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f5f5;
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
  color: #666;
  font-size: 14px;
  cursor: pointer;
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
  border-radius: 12px;
  overflow: hidden;
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
  border-radius: 12px;
  cursor: pointer;
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
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
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
  background: linear-gradient(135deg, #667eea, #764ba2);
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

@media (min-width: 768px) {
  .search-page {
    max-width: 650px;
    margin: 0 auto;
  }
  .search-header {
    max-width: 650px;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
  }
}
@media (min-width: 1024px) {
  .search-page {
    max-width: 720px;
  }
  .search-header {
    max-width: 720px;
  }
}
</style>