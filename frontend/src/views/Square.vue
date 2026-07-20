<template>
  <div class="square-page">
    <div class="square-header">
      <h2 class="square-title">广场</h2>
      <button class="publish-btn" @click="goPublish">+ 发布</button>
    </div>

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
          <span class="action-item">
            <span>🔄</span>
            <span>{{ post.shares || 0 }}</span>
          </span>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else-if="!loading">
      <p>暂无动态</p>
      <button class="publish-empty-btn" @click="goPublish">发布第一条动态</button>
    </div>

    <div class="loading-more" v-if="loading">加载中...</div>
    <div class="no-more" v-if="!hasMore && postList.length > 0">没有更多了</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
</script>

<style scoped>
.square-page {
  min-height: calc(100dvh - 80px);
  background-color: #f5f5f5;
  padding-top: 12px;
  padding-bottom: 80px;
}

.square-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.square-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.publish-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.post-list {
  padding: 0;
  margin-top: 8px;
}

.post-card {
  background: #fff;
  padding: 16px 20px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background 0.2s;
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
  color: #667eea;
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

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #999;
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 16px;
}

.publish-empty-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

.loading-more,
.no-more {
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 13px;
}

@media (min-width: 768px) {
  .square-page {
    max-width: 650px;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  .square-page {
    max-width: 720px;
  }
}
</style>
