<template>
  <PageLayout>
    <template #nav>
      <h2 class="nav-title">广场</h2>
      <button class="publish-btn" @click="goPublish">+ 发布</button>
    </template>

    <div class="tag-filter" v-if="tagList.length > 0">
      <div
        class="tag-item"
        :class="{ active: activeTag === '' }"
        @click="switchTag('')"
      >全部</div>
      <div
        v-for="tag in tagList"
        :key="tag.tagId"
        class="tag-item"
        :class="{ active: activeTag === tag.tagName }"
        @click="switchTag(tag.tagName)"
      >{{ tag.tagName }}</div>
    </div>

    <div class="post-list" v-if="postList.length > 0">
      <div
        v-for="post in postList"
        :key="post.postId || post.id"
        class="post-card"
        @click="goPostDetail(post)"
      >
        <div class="post-header">
          <img :src="post.avatar || defaultAvatar" class="post-avatar" v-img-fallback="post.nickName || '用户'" />
          <div class="post-user-info">
            <span class="post-nickname">{{ post.nickName || post.nickname || '用户' }}</span>
            <span class="post-time">{{ formatTime(post.createTime || post.createdAt) }}</span>
          </div>
          <span class="post-tag" v-if="post.tagName">{{ post.tagName }}</span>
        </div>
        <div class="post-content">{{ post.content }}</div>
        <!-- 转发展示 -->
        <div class="repost-card" v-if="post.repostId && post.repostContent" @click.stop="goPostDetail({ postId: post.repostId, id: post.repostId })">
          <div class="repost-header">
            <span class="repost-icon">🔄</span>
            <span class="repost-nickname">{{ post.repostNickname || '原作者' }}</span>
          </div>
          <div class="repost-content">{{ post.repostContent }}</div>
        </div>
        <div class="post-images" v-if="post.images && post.images.length > 0">
          <img
            v-for="(img, idx) in post.images.slice(0, 3)"
            :key="idx"
            :src="img"
            class="post-image"
            :class="post.images.length === 1 ? 'single' : ''"
          />
          <div class="image-more" v-if="post.images.length > 3">+{{ post.images.length - 3 }}</div>
        </div>
        <div class="post-actions">
          <span class="action-item" @click.stop="handleLike(post)">
            <span>{{ post.isLiked ? '❤️' : '🤍' }}</span>
            <span>{{ post.likes || 0 }}</span>
          </span>
          <span class="action-item">
            <span>💬</span>
            <span>{{ post.comments || 0 }}</span>
          </span>
          <span class="action-item" @click.stop="openSharePopup(post)">
            <span>📤</span>
            <span>{{ post.shares || 0 }}</span>
          </span>
        </div>
      </div>
    </div>

    <EmptyState v-else-if="!loading" text="暂无动态" actionText="发布第一条动态" @action="goPublish" />

    <div class="loading-more" v-if="loading">加载中...</div>
    <div class="no-more" v-if="!hasMore && postList.length > 0">没有更多了</div>

    <SharePopup
      :visible="shareVisible"
      :postId="sharePostId"
      :postNickname="sharePostNickname"
      :postContent="sharePostContent"
      :postShareUrl="sharePostUrl"
      @close="shareVisible = false"
      @shared="onShared"
      @reposted="onReposted"
    />
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '../components/PageLayout.vue'
import EmptyState from '../components/EmptyState.vue'
import SharePopup from '../components/SharePopup.vue'
import circleService from '../services/circleService'
import { genAvatar } from '../utils/placeholder'

const router = useRouter()

const defaultAvatar = genAvatar('default')
const activeTag = ref('')
const tagList = ref([])
const postList = ref([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)
const pageSize = 20

const loadTags = async () => {
  try {
    const res = await circleService.getTags()
    if (res.code === 200 && res.data) {
      tagList.value = res.data.list || res.data || []
    }
  } catch (e) {
    console.error('加载标签失败:', e)
  }
}

const loadPosts = async (reset = false) => {
  if (loading.value) return
  if (!hasMore.value && !reset) return

  loading.value = true
  if (reset) {
    page.value = 1
    hasMore.value = true
    postList.value = []
  }

  try {
    const params = { page: page.value, pageSize }
    if (activeTag.value) params.tag = activeTag.value
    const res = await circleService.getPosts(params)
    if (res.code === 200 && res.data) {
      const list = res.data.list || res.data || []
      if (reset) {
        postList.value = list
      } else {
        postList.value = [...postList.value, ...list]
      }
      hasMore.value = list.length >= pageSize
      if (list.length > 0) page.value++
    }
  } catch (e) {
    console.error('加载帖子失败:', e)
  } finally {
    loading.value = false
  }
}

const switchTag = (tag) => {
  activeTag.value = tag
  loadPosts(true)
}

const goPostDetail = (post) => {
  const id = post.postId || post.id
  router.push(`/post-detail/${id}`)
}

const goPublish = () => {
  router.push('/publish-post')
}

const handleLike = async (post) => {
  try {
    const id = post.postId || post.id
    if (post.isLiked) {
      await circleService.unlikePost(id)
      post.isLiked = false
      post.likes = Math.max(0, (post.likes || 0) - 1)
    } else {
      await circleService.likePost(id)
      post.isLiked = true
      post.likes = (post.likes || 0) + 1
    }
  } catch (e) {
    console.error('点赞操作失败:', e)
  }
}

// 分享弹窗状态
const shareVisible = ref(false)
const sharePostId = ref(null)
const sharePostNickname = ref('')
const sharePostContent = ref('')
const sharePostUrl = ref('')

const openSharePopup = (post) => {
  const id = post.postId || post.id
  sharePostId.value = id
  sharePostNickname.value = post.nickName || post.nickname || ''
  sharePostContent.value = post.content || ''
  sharePostUrl.value = `${window.location.origin}/post-detail/${id}`
  shareVisible.value = true
}

const onShared = () => {
  // 更新列表中的分享数
  const post = postList.value.find(p => (p.postId || p.id) === sharePostId.value)
  if (post) post.shares = (post.shares || 0) + 1
}

const onReposted = () => {
  const post = postList.value.find(p => (p.postId || p.id) === sharePostId.value)
  if (post) post.shares = (post.shares || 0) + 1
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  return date.toLocaleDateString()
}

const handleScroll = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  if (scrollTop + windowHeight >= documentHeight - 100) {
    loadPosts()
  }
}

onMounted(async () => {
  await Promise.all([loadTags(), loadPosts(true)])
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.nav-title {
  flex: 1;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.publish-btn {
  background-color: #fff;
  color: var(--color-primary);
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.publish-btn:active {
  transform: scale(0.95);
}

.tag-filter {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  background: #fff;
  overflow-x: auto;
  white-space: nowrap;
  -ms-overflow-style: none;
  scrollbar-width: none;
  margin-top: 12px;
}

.tag-filter::-webkit-scrollbar {
  display: none;
}

.tag-item {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  background: #f0f0f0;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.tag-item.active {
  background: var(--gradient-primary);
  color: #fff;
}

.post-list {
  padding: 0;
  margin-top: 8px;
}

.post-card {
  background: #fff;
  padding: 16px 20px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 0px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.post-card:active {
  background: #fafafa;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.post-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.post-user-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.post-nickname {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.post-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.post-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-primary);
}

.post-content {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-images {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.post-image {
  width: calc(33.33% - 4px);
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
}

.post-image.single {
  width: 50%;
  max-width: 240px;
}

.image-more {
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.post-actions {
  display: flex;
  gap: 24px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #999;
  cursor: pointer;
}

/* 转发卡片 */
.repost-card {
  margin: 8px 0 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #667eea;
  cursor: pointer;
}

.repost-card:active {
  background: #e9ecef;
}

.repost-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.repost-icon {
  font-size: 13px;
}

.repost-nickname {
  font-size: 12px;
  color: #667eea;
  font-weight: 500;
}

.repost-content {
  font-size: 13px;
  color: #666;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.loading-more,
.no-more {
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 13px;
}
</style>
