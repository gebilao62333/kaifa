<template>
  <div class="mydynamic-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">我的动态</span>
      <span class="add-btn" @click="goPublish">发动态</span>
    </div>

    <div class="posts-tabs">
      <span
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-item', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
        <span class="tab-count">{{ tab.count }}</span>
      </span>
    </div>

    <div class="posts-list" v-if="filteredPosts.length > 0">
      <div class="post-card" v-for="post in filteredPosts" :key="post.id" @click="goDetail(post.id)">
        <div class="post-header">
          <img :src="userInfo.avatar" class="post-avatar" />
          <div class="post-user">
            <span class="post-nickname">{{ userInfo.nickName }}</span>
            <span class="post-time">{{ post.createTime }}</span>
          </div>
          <span class="post-status" :class="'status-' + post.status">{{ getStatusText(post.status) }}</span>
        </div>
        <div class="post-body">
          <p class="post-content">{{ post.content }}</p>
          <div class="post-images" v-if="post.images.length > 0">
            <img
              v-for="(img, idx) in post.images.slice(0, 3)"
              :key="idx"
              :src="img"
              class="post-img"
              :class="{ single: post.images.length === 1 }"
            />
          </div>
        </div>
        <div class="post-footer">
          <span class="footer-item">❤️ {{ post.likeCount }}</span>
          <span class="footer-item">💬 {{ post.commentCount }}</span>
          <span class="footer-item">🔄 {{ post.shareCount }}</span>
          <span class="post-actions">
            <span class="action-btn" @click.stop="deletePost(post)">🗑️ 删除</span>
          </span>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else>
      <span class="empty-icon">📝</span>
      <span class="empty-text">{{ emptyText }}</span>
      <button class="empty-btn" @click="goPublish">发第一条动态</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const activeTab = ref('all')

const userInfo = ref({
  nickName: '多客用户',
  avatar: 'https://picsum.photos/200/200'
})

const tabs = ref([
  { id: 'all', name: '全部', count: 6 },
  { id: 'published', name: '已发布', count: 4 },
  { id: 'review', name: '审核中', count: 1 },
  { id: 'rejected', name: '未通过', count: 1 }
])

const allPosts = ref([
  {
    id: 1,
    content: '今天和朋友一起打王者荣耀，连胜5局，太开心了！有没有一起开黑的？',
    images: [
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400',
      'https://images.unsplash.com/photo-1529543544282-ea9007613f3a?w=400'
    ],
    createTime: '2026-05-18',
    likeCount: 24,
    commentCount: 8,
    shareCount: 3,
    status: 'published'
  },
  {
    id: 2,
    content: '分享一个和平精英的跳伞技巧，学会轻松上分！',
    images: [
      'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400'
    ],
    createTime: '2026-05-15',
    likeCount: 56,
    commentCount: 12,
    shareCount: 7,
    status: 'published'
  },
  {
    id: 3,
    content: '周末线下聚会，有一起玩桌游的吗？',
    images: [
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400'
    ],
    createTime: '2026-05-12',
    likeCount: 18,
    commentCount: 5,
    shareCount: 2,
    status: 'published'
  },
  {
    id: 4,
    content: '新赛季开始了，求组队上分，本人主玩打野位，擅长李白韩信！',
    images: [],
    createTime: '2026-05-10',
    likeCount: 10,
    commentCount: 15,
    shareCount: 1,
    status: 'review'
  },
  {
    id: 5,
    content: '测试一下发帖功能，这条正在审核中。',
    images: [],
    createTime: '2026-05-08',
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    status: 'rejected'
  }
])

const filteredPosts = computed(() => {
  if (activeTab.value === 'all') return allPosts.value
  return allPosts.value.filter(p => p.status === activeTab.value)
})

const emptyText = computed(() => {
  const map = { all: '还没有发过动态', published: '还没有已发布的动态', review: '没有审核中的动态', rejected: '没有未通过的动态' }
  return map[activeTab.value] || ''
})

const getStatusText = (status) => {
  const map = { published: '已发布', review: '审核中', rejected: '未通过' }
  return map[status] || ''
}

const goBack = () => {
  router.back()
}

const goPublish = () => {
  router.push('/publish-post')
}

const goDetail = (id) => {
  router.push(`/post-detail/${id}`)
}

const deletePost = (post) => {
  const idx = allPosts.value.findIndex(p => p.id === post.id)
  if (idx > -1) {
    allPosts.value.splice(idx, 1)
    updateTabCounts()
  }
}

const updateTabCounts = () => {
  tabs.value[0].count = allPosts.value.length
  tabs.value[1].count = allPosts.value.filter(p => p.status === 'published').length
  tabs.value[2].count = allPosts.value.filter(p => p.status === 'review').length
  tabs.value[3].count = allPosts.value.filter(p => p.status === 'rejected').length
}
</script>

<style scoped>
.mydynamic-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 80px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  height: 50px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
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

.add-btn {
  font-size: 15px;
  color: white;
  cursor: pointer;
}

.posts-tabs {
  display: flex;
  background-color: #fff;
  gap: 12px;
  padding: 62px 16px 12px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  border-radius: 24px;
  transition: all 0.2s;
}

.tab-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.tab-count {
  font-size: 12px;
  margin-left: 4px;
}

.tab-item.active .tab-count {
  color: rgba(255, 255, 255, 0.8);
}

.posts-list {
  padding: 12px;
}

.post-card {
  background: white;
  border-radius: 16px;
  margin-bottom: 12px;
  padding: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}

.post-card:hover {
  transform: translateY(-1px);
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.post-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.post-user {
  flex: 1;
}

.post-nickname {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 2px;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.post-status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 10px;
}

.post-status.status-published {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.post-status.status-review {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.post-status.status-rejected {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.post-body {
  margin-bottom: 12px;
}

.post-content {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
  word-break: break-all;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  border-radius: 8px;
  overflow: hidden;
}

.post-img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.post-img.single {
  aspect-ratio: 16 / 9;
  max-height: 200px;
}

.post-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.footer-item {
  font-size: 13px;
  color: #999;
}

.post-actions {
  margin-left: auto;
}

.action-btn {
  font-size: 13px;
  color: #ef4444;
  cursor: pointer;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 15px;
  color: #999;
  margin-bottom: 24px;
}

.empty-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 24px;
  font-size: 15px;
  cursor: pointer;
}
</style>
