<template>
  <div class="activity-wrapper">
    <div class="activity-page">
      <div class="header">
        <div class="title">广场</div>
      </div>

      <div class="content-container">
        <div class="tags-section">
          <div class="tags-scroll">
            <div 
              class="tag-item" 
              :class="{ active: activeTag === 0 }" 
              @click="onTagClick(0)">
              <span>推荐</span>
            </div>
            <div 
              class="tag-item" 
              :class="{ active: activeTag === tag.id }" 
              v-for="tag in tagList" 
              :key="tag.id"
              @click="onTagClick(tag.id)">
              <span>{{ tag.name }}</span>
            </div>
          </div>
        </div>

        <div class="feed-list">

          <!-- 广场推荐用户横滑区 -->
          <div v-if="activeTag === 0 && recommendUsers.length > 0" class="recommend-section">
            <div class="recommend-title">
              <span class="recommend-title-icon">⭐</span>
              <span>广场推荐</span>
            </div>
            <div class="recommend-scroll">
              <div
                v-for="user in recommendUsers"
                :key="user.userId"
                class="recommend-card"
                @click="$router.push({ name: 'UserProfile', params: { id: user.userId } })">
                <div class="recommend-avatar-wrap">
                  <img :src="user.avatar" class="recommend-avatar" />
                  <span v-if="user.isTop" class="recommend-top-badge">置顶</span>
                </div>
                <div class="recommend-nickname">{{ user.nickName }}</div>
                <span class="recommend-tag">推荐</span>
              </div>
            </div>
          </div>

          <div 
            class="feed-item" 
            v-for="item in feedList" 
            :key="item.postId"
            @click="goDetail(item)">
            <div class="feed-header">
              <div class="avatar-wrapper" @click.stop="goUserProfile(item)">
                <img :src="item.avatar" class="avatar" />
                <span v-if="item.vip" class="vip-badge">VIP</span>
              </div>
              <div class="user-info" @click.stop="goUserProfile(item)">
                <div class="user-name">{{ item.nickName }}</div>
                <div class="user-level">Lv.{{ item.level }}</div>
              </div>
              <button class="reserve-btn" @click.stop="goOrder(item)">预约</button>
            </div>
            
            <div class="feed-content" @click.stop>{{ item.content }}</div>
            
            <div class="feed-images" v-if="item.images && item.images.length > 0">
              <img 
                v-for="(img, idx) in item.images" 
                :key="idx" 
                :src="img" 
                class="feed-image"
                :class="{ 'single': item.images.length === 1 }"
                @click.stop="previewImage(item.images, idx)" />
            </div>

            <div class="feed-tags" v-if="item.tagName">
              <span class="tag">{{ item.tagName }}</span>
            </div>

            <div class="feed-actions">
              <div class="action-item" @click.stop="toggleLike(item)">
                <span class="action-icon">{{ item.isLike ? '❤️' : '🤍' }}</span>
                <span class="action-count">{{ item.likes }}</span>
              </div>
              <div class="action-item" @click.stop="toggleComments(item)">
                <span class="action-icon">💬</span>
                <span class="action-count">{{ item.comments }}</span>
              </div>
              <div class="action-item" @click.stop="toggleFollow(item)">
                <span class="action-icon">{{ item.isFollow ? '❤️' : '🤍' }}</span>
                <span class="action-count">{{ item.isFollow ? '已关注' : '关注' }}</span>
              </div>
            </div>

            <div class="comments-section" v-if="expandedPostId === item.postId" @click.stop>
              <div class="comments-list" v-if="commentsMap[item.postId]">
                <div 
                  class="comment-item" 
                  v-for="comment in commentsMap[item.postId]" 
                  :key="comment.id">
                  <img :src="comment.avatar" class="comment-avatar" />
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-name">{{ comment.nickName }}</span>
                      <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
                    </div>
                    <div class="comment-text">{{ comment.content }}</div>
                  </div>
                </div>
                <div class="no-comments" v-if="commentsMap[item.postId].length === 0">
                  <span>暂无评论</span>
                </div>
              </div>
              <div class="comments-loading" v-else>
                <span>加载中...</span>
              </div>
              <div class="comment-input-wrapper">
                <input 
                  class="comment-input" 
                  v-model="commentText"
                  placeholder="说点什么..."
                  @keyup.enter="submitComment(item.postId)" />
                <button class="comment-submit" @click="submitComment(item.postId)">发送</button>
              </div>
            </div>

            <div class="feed-footer">
              <span class="time">{{ formatTime(item.createTime) }}</span>
            </div>
          </div>

          <div class="loading-more" v-if="loading">
            <span>加载中...</span>
          </div>
          <div class="no-more" v-else-if="!hasMore && feedList.length > 0">
            <span>已加载全部</span>
          </div>
          <div class="empty-state" v-else-if="!loading && feedList.length === 0 && initialLoadComplete">
            <div class="empty-icon">📭</div>
            <div class="empty-text">暂无动态</div>
          </div>
          <!-- 滚动加载哨兵 -->
          <div ref="loadSentinel" class="load-sentinel" />
        </div>
      </div>

      <div class="fab-button" @click="goEdit">
        <span>+</span>
      </div>

      <ReserveModal 
        v-if="showReserveModal" 
        :visible="showReserveModal"
        :companion="currentCompanion" 
        @close="showReserveModal = false"
        @update:visible="showReserveModal = $event" />

      <div class="image-preview-overlay" v-if="previewList.length" @click.self="closePreview"
        @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
        <span class="image-preview-close" @click.stop="closePreview">✕</span>
        <span class="image-preview-arrow left" v-if="previewList.length > 1" @click.stop="prevImage">‹</span>
        <span class="image-preview-arrow right" v-if="previewList.length > 1" @click.stop="nextImage">›</span>
        <img class="image-preview-img" :src="previewList[previewIndex]" alt="" />
        <div class="image-preview-dots" v-if="previewList.length > 1">
          <span 
            v-for="(_, i) in previewList" 
            :key="i" 
            class="dot" 
            :class="{ active: i === previewIndex }"
            @click.stop="previewIndex = i" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import ReserveModal from '@/components/ReserveModal.vue'
import circleService from '../services/circleService'
import homeService from '../services/homeService'
import { useToast } from '../composables/useToast'
import { useUserStore } from '../store/user-info'
import { generateMockPosts } from '../common/mockData'

const router = useRouter()
const { showToast } = useToast()
const userStore = useUserStore()

const activeTag = ref(0)
const tagList = ref([])
const feedList = ref([])
const page = ref(1)
const loading = ref(false)
const hasMore = ref(true)
const initialLoadComplete = ref(false)

// 广场推荐用户（后台管理配置）
const recommendUsers = ref([])
const loadingRecommend = ref(false)

const loadRecommendSquare = async () => {
  loadingRecommend.value = true
  try {
    const res = await homeService.getRecommendSquare()
    if (res.code === 200 && res.data) {
      recommendUsers.value = (res.data.list || []).map(u => ({
        userId: u.userId,
        nickName: u.nickName || '用户' + u.userId,
        avatar: u.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=square' + u.userId,
        isTop: u.isTop,
        isAdminRecommend: true
      }))
    }
  } catch (e) {
    console.error('加载广场推荐用户失败:', e)
  } finally {
    loadingRecommend.value = false
  }
}

const expandedPostId = ref(null)
const commentsMap = ref({})
const commentText = ref('')
const previewList = ref([])
const previewIndex = ref(0)
const touchStartX = ref(0)
const touchEndX = ref(0)

// 滚动加载哨兵
const loadSentinel = ref(null)
let observer = null

// 预约弹窗
const showReserveModal = ref(false)
const currentCompanion = ref({
  id: '',
  name: '',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=b6e3f4',
  game: ''
})

/**
 * 安全解析 images 字段（兼容 JSON 字符串、逗号分隔串、数组）
 * 并清洗每个 URL 中可能的引号/方括号等异常字符
 */
const safeImages = (images) => {
  if (!images) return []
  
  let arr = []
  if (Array.isArray(images)) {
    arr = images
  } else if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      arr = Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      // 逗号分隔回退
      arr = images.split(',').filter(Boolean)
    }
  }
  
  return arr
    .map(url => String(url).replace(/^["'[\]\s]+|["'[\]\s]+$/g, '').trim())
    .filter(Boolean)
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return `${date.getMonth() + 1}-${date.getDate()}`
}

const loadTags = async () => {
  try {
    const res = await circleService.getTags()
    if (res && res.code === 200 && res.data) {
      tagList.value = [
        { id: -1, name: '最新', sortBy: 'latest' },
        ...res.data.slice(0, 2).map((tag, index) => {
          if (index === 0) {
            return { ...tag, name: '最热', sortBy: 'hot' }
          } else if (index === 1) {
            return { ...tag, name: '新手报到', sortBy: 'newbie' }
          }
          return tag
        })
      ]
    }
  } catch (e) {
    console.error('加载标签失败:', e)
    // Mock 降级
    tagList.value = [
      { id: -1, name: '最新', sortBy: 'latest' },
      { id: 1, name: '最热', sortBy: 'hot' },
      { id: 2, name: '新手报到', sortBy: 'newbie' }
    ]
  }
}

const loadFeedList = async (reset = false) => {
  if (loading.value) return
  if (!hasMore.value && !reset) return

  loading.value = true
  if (reset) {
    page.value = 1
    hasMore.value = true
  }

  try {
    const params = {
      page: page.value,
      pageSize: 10
    }
    
    // 处理标签筛选和排序
    const tag = tagList.value.find(t => t.id === activeTag.value)
    if (tag) {
      params.sortBy = tag.sortBy || 'latest'
    } else {
      params.sortBy = 'latest'
    }
    
    const res = await circleService.getPosts(params)
    
    if (res && res.code === 200 && res.data) {
      let newPosts = res.data.list || res.data
      // 确保 images 是数组 + avatar 兜底
      if (Array.isArray(newPosts)) {
        newPosts = newPosts.map(post => ({
          ...post,
          avatar: post.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (post.userId || 'user'),
          images: safeImages(post.images)
        }))
      }
      
      if (reset) {
        feedList.value = newPosts
      } else {
        feedList.value = [...feedList.value, ...newPosts]
      }
      
      hasMore.value = newPosts.length >= 10
      page.value++
    } else {
      console.warn('获取动态数据为空，使用Mock数据')
      await loadMockFeeds(reset)
    }
  } catch (error) {
    console.error('加载动态失败，使用Mock数据:', error)
    await loadMockFeeds(reset)
  } finally {
    loading.value = false
    initialLoadComplete.value = true
  }
}

const loadMockFeeds = async (reset = false) => {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  let mockData = generateMockPosts(10)
  
  if (activeTag.value === -1) {
    mockData.sort((a, b) => b.createTime - a.createTime)
  } else if (activeTag.value > 0) {
    const selectedTag = tagList.value.find(t => t.id === activeTag.value)
    if (selectedTag) {
      mockData = mockData.filter(p => p.tagName === selectedTag.name)
    }
  }
  
  if (reset) {
    feedList.value = mockData
  } else {
    feedList.value = [...feedList.value, ...mockData]
  }
  hasMore.value = feedList.value.length < 50
  page.value++
}

const onTagClick = (tagId) => {
  activeTag.value = tagId
  loadFeedList(true)
}

const goDetail = (item) => {
  router.push({ 
    name: 'PostDetail', 
    params: { id: item.postId },
    query: { data: encodeURIComponent(JSON.stringify(item)) }
  })
}

const goUserProfile = (item) => {
  router.push({ name: 'UserProfile', params: { id: item.userId } })
}

const goEdit = () => {
  router.push('/publish-post')
}

const goOrder = (item) => {
  currentCompanion.value = {
    id: item.userId,
    name: item.nickName,
    avatar: item.avatar,
    game: item.gameName || ''
  }
  showReserveModal.value = true
}

const toggleLike = (item) => {
  item.isLike = !item.isLike
  item.likes += item.isLike ? 1 : -1
}

const toggleFollow = (item) => {
  item.isFollow = !item.isFollow
  showToast(item.isFollow ? '关注成功' : '取消关注')
}

const toggleComments = async (item) => {
  if (expandedPostId.value === item.postId) {
    expandedPostId.value = null
  } else {
    expandedPostId.value = item.postId
    if (!commentsMap.value[item.postId]) {
      await loadComments(item.postId)
    }
  }
}

const loadComments = async (postId) => {
  try {
    const res = await circleService.getComments(postId)
    if (res && res.code === 200 && res.data) {
      const list = res.data.list || res.data
      commentsMap.value[postId] = Array.isArray(list)
        ? list.map(c => ({
            ...c,
            avatar: c.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=comment' + (c.id || Math.random())
          }))
        : list
    } else {
      commentsMap.value[postId] = generateMockComments()
    }
  } catch (error) {
    console.error('加载评论失败:', error)
    commentsMap.value[postId] = generateMockComments()
    showToast('服务器繁忙，显示模拟数据', 'warning')
  }
}

const generateMockComments = () => {
  const mockComments = [
    {
      id: 1,
      nickName: '玩家小明',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=comment1&backgroundColor=b6e3f4',
      content: '这个游戏真的很好玩！',
      createTime: Date.now() - 300000
    },
    {
      id: 2,
      nickName: '游戏达人',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=comment2&backgroundColor=c0aede',
      content: '同意楼上的观点',
      createTime: Date.now() - 600000
    },
    {
      id: 3,
      nickName: '新手玩家',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=comment3&backgroundColor=d1d4f9',
      content: '请问怎么升级比较快？',
      createTime: Date.now() - 900000
    }
  ]
  return mockComments
}

const submitComment = async (postId) => {
  const text = commentText.value.trim()
  if (!text) {
    showToast('请输入评论内容', 'warning')
    return
  }
  if (text.length > 200) {
    showToast('评论内容不能超过200字', 'warning')
    return
  }

  try {
    const res = await circleService.commentPost(postId, text)
    if (res && res.code === 200) {
      const newComment = {
        id: Date.now(),
        nickName: userStore.nickName || '我',
        avatar: userStore.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
        content: text,
        createTime: Date.now()
      }
      if (!commentsMap.value[postId]) {
        commentsMap.value[postId] = []
      }
      commentsMap.value[postId].unshift(newComment)
      const post = feedList.value.find(p => p.postId === postId)
      if (post) {
        post.comments = (post.comments || 0) + 1
      }
      commentText.value = ''
      showToast('评论成功', 'success')
    } else {
      submitMockComment(postId, text)
    }
  } catch (error) {
    console.error('评论失败:', error)
    submitMockComment(postId, text)
  }
}

const submitMockComment = (postId, text) => {
  const newComment = {
    id: Date.now(),
    nickName: userStore.nickName || '我',
    avatar: userStore.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    content: text,
    createTime: Date.now()
  }
  if (!commentsMap.value[postId]) {
    commentsMap.value[postId] = []
  }
  commentsMap.value[postId].unshift(newComment)
  const post = feedList.value.find(p => p.postId === postId)
  if (post) {
    post.comments = (post.comments || 0) + 1
  }
  commentText.value = ''
  showToast('评论成功', 'success')
}

const previewImage = (images, index) => {
  previewList.value = images
  previewIndex.value = index
}

const closePreview = () => {
  previewList.value = []
  previewIndex.value = 0
}

const prevImage = () => {
  if (previewIndex.value > 0) {
    previewIndex.value--
  }
}

const nextImage = () => {
  if (previewIndex.value < previewList.value.length - 1) {
    previewIndex.value++
  }
}

const onTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
}

const onTouchMove = (e) => {
  touchEndX.value = e.touches[0].clientX
}

const onTouchEnd = () => {
  const diff = touchStartX.value - touchEndX.value
  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      nextImage()
    } else {
      prevImage()
    }
  }
  touchStartX.value = 0
  touchEndX.value = 0
}

const loadMore = () => {
  if (hasMore.value && !loading.value) {
    loadFeedList()
  }
}

onMounted(() => {
  loadTags()
  loadFeedList()
  // 初始加载时也加载推荐用户（默认"推荐"tab）
  loadRecommendSquare()
  
  // 无限滚动：哨兵可见时自动加载更多
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore.value && !loading.value) {
      loadFeedList()
    }
  }, { threshold: 0.1 })
  if (loadSentinel.value) {
    observer.observe(loadSentinel.value)
  }
})

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<style scoped>
/* --- 外层包裹 --- */
.activity-wrapper {
  width: 100%;
  min-height: 100vh;
  min-height: -webkit-fill-available;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

/* --- 页面容器 --- */
.activity-page {
  min-height: calc(100vh - 50px);
  min-height: -webkit-fill-available;
  background: var(--bg-secondary);
  padding-top: 50px;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
}

/* --- 头部 --- */
.header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  padding: 8px 16px;
  height: 50px;
  box-sizing: border-box;
}

.title {
  font-size: 17px;
  font-weight: bold;
  color: white;
  flex: 1;
  text-align: center;
}

/* --- 内容容器 --- */
.content-container {
  padding: 0 16px;
}

/* --- 标签区域 --- */
.tags-section {
  padding: 16px 0;
}

.tags-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  -webkit-overflow-scrolling: touch;
}

.tags-scroll::-webkit-scrollbar {
  display: none;
}

.tag-item {
  flex-shrink: 0;
  padding: 8px 16px;
  background: var(--bg-primary);
  border-radius: 20px;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.3s;
  white-space: nowrap;
}

.tag-item.active {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: #fff;
}

/* --- 动态列表 --- */
.feed-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* --- 广场推荐用户 --- */
.recommend-section {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 16px;
  overflow: hidden;
}
.recommend-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}
.recommend-title-icon {
  font-size: 16px;
}
.recommend-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}
.recommend-scroll::-webkit-scrollbar {
  display: none;
}
.recommend-card {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.2s;
}
.recommend-card:active {
  transform: scale(0.95);
}
.recommend-avatar-wrap {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid #f0f0f0;
}
.recommend-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.recommend-top-badge {
  position: absolute;
  top: -4px;
  right: -8px;
  background: #faad14;
  color: #fff;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 8px;
  white-space: nowrap;
}
.recommend-nickname {
  font-size: 12px;
  color: var(--text-primary);
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}
.recommend-tag {
  font-size: 10px;
  color: #1677ff;
  background: #f0f5ff;
  padding: 1px 8px;
  border-radius: 10px;
}

.feed-item {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 16px;
}

/* --- 动态头部 --- */
.feed-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  position: relative;
}

.reserve-btn {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 12px;
  color: #fff;
  background: linear-gradient(135deg, #FF6B81, #E64C65);
  padding: 6px 12px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}

.avatar-wrapper {
  position: relative;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.vip-badge {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.user-level {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.game-tag {
  font-size: 12px;
  color: var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.1);
  padding: 4px 10px;
  border-radius: 12px;
}

/* --- 动态内容 --- */
.feed-content {
  font-size: 15px;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 12px;
}

/* --- 图片区域 --- */
.feed-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.feed-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 12px;
}

.feed-image.single {
  grid-column: span 3;
  aspect-ratio: 16/9;
}

/* --- 标签 --- */
.feed-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.feed-tags .tag {
  font-size: 12px;
  color: var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.1);
  padding: 4px 10px;
  border-radius: 8px;
}

/* --- 操作栏 --- */
.feed-actions {
  display: flex;
  gap: 24px;
  padding: 12px 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.action-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.action-icon {
  font-size: 18px;
}

.action-count {
  font-size: 13px;
  color: var(--text-secondary);
}

/* --- 评论区域 --- */
.comments-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  display: flex;
  gap: 10px;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 10px 12px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.comment-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.comment-time {
  font-size: 11px;
  color: var(--text-tertiary);
}

.comment-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.no-comments {
  text-align: center;
  padding: 16px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.comments-loading {
  text-align: center;
  padding: 16px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.comment-input-wrapper {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.comment-input {
  flex: 1;
  border: none;
  border-radius: 20px;
  background: var(--bg-secondary);
  padding: 8px 16px;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
}

.comment-input::placeholder {
  color: var(--text-tertiary);
}

.comment-submit {
  flex-shrink: 0;
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, #FF6B81, #E64C65);
  color: #fff;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.comment-submit:active {
  transform: scale(0.95);
}

/* --- 图片预览 --- */
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  user-select: none;
}

.image-preview-close {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
  cursor: pointer;
  z-index: 1001;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
}

.image-preview-arrow {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #fff;
  cursor: pointer;
  z-index: 1001;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  transition: background 0.2s;
}

.image-preview-arrow:active {
  background: rgba(255, 255, 255, 0.3);
}

.image-preview-arrow.left {
  left: 16px;
  padding-bottom: 10px;
}

.image-preview-arrow.right {
  right: 16px;
  padding-bottom: 10px;
}

.image-preview-img {
  max-width: 90%;
  max-height: 85%;
  object-fit: contain;
  border-radius: 4px;
}

.image-preview-dots {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 1001;
}

.image-preview-dots .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.2s;
}

.image-preview-dots .dot.active {
  width: 24px;
  border-radius: 4px;
  background: #fff;
}

/* --- 底部信息 --- */
.feed-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
}

.time {
  font-size: 12px;
  color: var(--text-tertiary);
}

.services {
  display: flex;
  gap: 8px;
}

.service-tag {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 8px;
}

.service-tag.online {
  background: rgba(67, 233, 123, 0.1);
  color: #43e97b;
}

.service-tag.offline {
  background: rgba(255, 107, 129, 0.1);
  color: #ff6b81;
}

/* --- 加载状态 --- */
.loading-more,
.no-more,
.empty-state {
  text-align: center;
  padding: 20px;
  color: var(--text-tertiary);
  font-size: 14px;
}

.load-sentinel {
  height: 1px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 15px;
}

/* --- 发布按钮 --- */
.fab-button {
  position: fixed;
  right: 24px;
  bottom: calc(100px + env(safe-area-inset-bottom, 0px));
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(var(--primary-color-rgb), 0.3);
  color: #fff;
  font-size: 28px;
  font-weight: 300;
  cursor: pointer;
  z-index: 100;
  transition: transform 0.2s ease;
}

.fab-button:active {
  transform: scale(0.92);
}

.fab-button span {
  width: 30px;
  height: 30px;
  font-size: 28px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  margin-top: -5px;
}

/* PC 端适配 */
@media (min-width: 768px) {
  .activity-page {
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
  
  .fab-button {
    right: calc(50% - 650px / 2 + 24px);
  }
}

@media (min-width: 1024px) {
  .activity-page {
    max-width: 720px;
  }
  
  .header {
    max-width: 720px;
  }
  
  .fab-button {
    right: calc(50% - 720px / 2 + 24px);
  }
}
</style>