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
              :class="{ active: activeTag === -1 }" 
              @click="onTagClick(-1)">
              <span>最新</span>
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
          <div class="feed-card" v-for="(item, index) in feedList" :key="index">
            <div class="feed-user" @click="goUserProfile(item)">
              <img class="user-avatar" :src="item.avatar" alt="" />
              <div class="user-info">
                <div class="user-name-row">
                  <span class="user-name">{{ item.nickName }}</span>
                  <span class="user-level" v-if="item.level">Lv.{{ item.level }}</span>
                  <span class="vip-tag" v-if="item.vip">VIP</span>
                  <span class="recommend-badge" v-if="item.isSystemRecommend">推荐</span>
                </div>
                <span class="feed-time">{{ formatTime(item.createTime) }}</span>
              </div>
              <div class="follow-btn reserve-btn" @click.stop="openReserveModal(item)">
                <span>预约</span>
              </div>
            </div>

            <div class="feed-content" @click="goDetail(item)">
              <p class="content-text">{{ item.content }}</p>
            </div>

            <div class="feed-images" v-if="item.images && item.images.length" @click="previewImages(item.images)">
              <img 
                class="feed-image" 
                v-for="(img, idx) in item.images.slice(0, 21)" 
                :key="idx"
                :src="img" 
                alt="" />
            </div>

          <div class="feed-tags" v-if="item.tagName">
            <span class="feed-tag">#{{ item.tagName }}</span>
          </div>

          <div class="feed-actions">
            <div class="action-item" @click="likePost(item)">
              <span class="action-icon" :class="{ liked: item.isLike }">❤️</span>
              <span class="action-text">{{ item.likes || 0 }}</span>
            </div>
            <div class="action-item" @click="goDetail(item)">
              <span class="action-icon">💬</span>
              <span class="action-text">{{ item.comments || 0 }}</span>
            </div>
            <div class="action-item follow-action" :class="{ followed: item.isFollow }" @click.stop="toggleFollow(item)">
              <span class="action-icon" v-if="!item.isFollow">+</span>
              <span class="action-text">{{ item.isFollow ? '已关注' : '关注' }}</span>
            </div>
          </div>
        </div>

        <div class="loading-more" v-if="loading">
          <span>加载中...</span>
        </div>
        <div class="no-more" v-if="!hasMore && feedList.length">
          <span>没有更多了</span>
        </div>
      </div>
      </div>

      <div class="publish-btn" @click="goEdit">
        <span>+</span>
      </div>

      <div class="bottom-placeholder"></div>

      <ReserveModal 
        :visible="showReserveModal" 
        :companion="currentCompanion"
        @close="closeReserveModal"
        @submit="handleReserveSubmit"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ReserveModal from '@/components/ReserveModal.vue'
import circleService from '../services/circleService'

const router = useRouter()

const activeTag = ref(0)
const tagList = ref([])
const feedList = ref([])
const page = ref(1)
const loading = ref(false)
const hasMore = ref(true)

const getSystemRecommendFeeds = () => {
  try {
    const stored = localStorage.getItem('admin_system_recommend')
    if (!stored) return []
    const list = JSON.parse(stored)
    return list.map((u, idx) => ({
      postId: 10000 + idx,
      userId: u.userId,
      nickName: u.nickname || '用户' + u.userId,
      avatar: u.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=sys' + u.userId,
      level: u.level || 1,
      vip: u.vip || false,
      gameName: '热门推荐',
      content: `🔥 热门推荐用户：${u.nickname || '用户' + u.userId}，快来互动吧！`,
      images: [],
      tagName: '推荐',
      likes: u.likeCount || u.likes || 0,
      comments: u.followerCount || u.followers || 0,
      isLike: false,
      isFollow: false,
      createTime: Date.now() - idx * 3600000,
      onlineService: true,
      offlineService: true,
      offlineLocation: '',
      isSystemRecommend: true
    }))
  } catch (e) {
    return []
  }
}

// 预约弹窗
const showReserveModal = ref(false)
const currentCompanion = ref({
  id: '',
  name: '',
  avatar: '',
  game: ''
})

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
    if (res && res.data) {
      tagList.value = res.data
    }
  } catch (e) {
    console.error('加载标签失败:', e)
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
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockData = [
      {
        postId: 1,
        userId: 1,
        nickName: '小雪',
        avatar: 'https://picsum.photos/100/100',
        level: 28,
        vip: true,
        gameName: '王者荣耀',
        content: '今天玩王者太开心了，连胜五把！有没有大神带我上分呀～🎮✨',
        images: [
          'https://picsum.photos/300/300',
          'https://picsum.photos/300/300'
        ],
        tagName: '游戏',
        likes: 128,
        comments: 32,
        isLike: false,
        isFollow: false,
        createTime: Date.now() - 3600000,
        onlineService: true,
        offlineService: true,
        offlineLocation: '上海市浦东新区XX电竞馆'
      },
      {
        postId: 2,
        userId: 2,
        nickName: '阿杰',
        avatar: 'https://picsum.photos/100/100',
        level: 35,
        vip: false,
        gameName: '英雄联盟',
        content: '新赛季更新了，感觉打野位又加强了！有没有一起开黑的小伙伴？',
        images: [],
        tagName: '游戏',
        likes: 89,
        comments: 45,
        isLike: true,
        isFollow: true,
        createTime: Date.now() - 7200000,
        onlineService: true,
        offlineService: false
      },
      {
        postId: 3,
        userId: 3,
        nickName: '小美',
        avatar: 'https://picsum.photos/100/100',
        level: 22,
        vip: true,
        gameName: '和平精英',
        content: '今天心情不好，有人陪我聊聊天吗？🥺',
        images: [
          'https://picsum.photos/300/300'
        ],
        tagName: '情感',
        likes: 256,
        comments: 78,
        isLike: false,
        isFollow: false,
        createTime: Date.now() - 86400000,
        onlineService: true,
        offlineService: true,
        offlineLocation: '广州市天河区XX网咖'
      },
      {
        postId: 4,
        userId: 4,
        nickName: '大飞',
        avatar: 'https://picsum.photos/100/100',
        level: 42,
        vip: true,
        gameName: '王者荣耀',
        content: '技术教学：如何在团战中打出最高伤害？学会这些技巧轻松上王者！',
        images: [
          'https://picsum.photos/300/300',
          'https://picsum.photos/300/300',
          'https://picsum.photos/300/300'
        ],
        tagName: '技术',
        likes: 512,
        comments: 124,
        isLike: false,
        isFollow: true,
        createTime: Date.now() - 172800000,
        onlineService: true,
        offlineService: false
      }
    ]
    
    if (activeTag.value === -1) {
      mockData.sort((a, b) => b.createTime - a.createTime)
    }
    
    if (reset) {
      const systemFeeds = activeTag.value === 0 ? getSystemRecommendFeeds() : []
      feedList.value = [...systemFeeds, ...mockData]
    } else {
      feedList.value = [...feedList.value, ...mockData]
    }
    hasMore.value = false
    page.value++
  } catch (error) {
    console.error('加载动态失败:', error)
  } finally {
    loading.value = false
  }
}

const onTagClick = (tagId) => {
  activeTag.value = tagId
  loadFeedList(true)
}

const goDetail = (item) => {
  console.log('查看详情:', item.postId)
  router.push(`/post-detail/${item.postId}`)
}

const goUserProfile = (item) => {
  console.log('查看用户资料:', item.userId)
  router.push({ name: 'UserProfile', params: { id: item.userId } })
}

const goEdit = () => {
  console.log('发布动态')
  router.push('/publish-post')
}

const toggleFollow = (item) => {
  item.isFollow = !item.isFollow
  console.log(item.isFollow ? '关注用户:' : '取消关注:', item.userId)
}

const openReserveModal = (item) => {
  currentCompanion.value = {
    id: item.userId,
    name: item.nickName,
    avatar: item.avatar,
    game: item.gameName || '王者荣耀',
    onlineService: item.onlineService !== false,
    offlineService: item.offlineService === true,
    offlineLocation: item.offlineLocation || '北京市朝阳区XX网咖'
  }
  showReserveModal.value = true
}

const closeReserveModal = () => {
  showReserveModal.value = false
}

const handleReserveSubmit = (reserveData) => {
  console.log('提交预约:', reserveData)
  showReserveModal.value = false
  alert(`预约成功！\n服务类型：${reserveData.serviceType === 'online' ? '线上陪玩' : '线下陪玩'}\n游戏：${reserveData.game}\n时间：${reserveData.date} ${reserveData.startTime}-${reserveData.endTime}\n时长：${reserveData.duration}小时\n金额：¥${reserveData.price}`)
}

const likePost = (item) => {
  item.isLike = !item.isLike
  item.likes = (item.likes || 0) + (item.isLike ? 1 : -1)
}

const previewImages = (images) => {
  console.log('预览图片:', images)
}

const sharePost = (item) => {
  console.log('分享动态:', item.postId)
}

const loadMore = () => {
  if (hasMore.value) {
    loadFeedList()
  }
}

onMounted(() => {
  loadTags()
  loadFeedList()
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
  min-height: calc(100vh - 70px);
  min-height: -webkit-fill-available;
  background: #f5f5f5;
  padding-top: 70px;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
}

/* --- 内容容器 --- */
.content-container {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 100%;
  padding: 0;
}

/* --- 头部 --- */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0 20px;
  text-align: center;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  box-sizing: border-box;
}

.header .title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

/* --- 标签区 --- */
.tags-section {
  background-color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid #f1f5f9;
  height: 50px;
  display: flex;
  align-items: center;
}

.tags-scroll {
  display: flex;
  overflow-x: auto;
  padding: 0 20px;
  gap: 16px;
  width: 100%;
}

.tags-scroll::-webkit-scrollbar {
  display: none;
}

.tag-item {
  flex-shrink: 0;
  padding: 10px 20px;
  font-size: 14px;
  color: #64748b;
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.25s ease;
  background-color: #f8fafc;
}

.tag-item.active {
  color: #fff;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea, #764ba2);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
}

/* --- Feed 列表 --- */
.feed-list {
  padding: 12px 16px;
}

.feed-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.feed-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.feed-user {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid #f1f5f9;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.user-name {
  font-size: 15px;
  color: #1e293b;
  font-weight: 600;
  cursor: pointer;
}

.user-level {
  background: linear-gradient(135deg, #f87171, #ef4444);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.vip-tag {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.recommend-badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 600;
}

.feed-time {
  font-size: 12px;
  color: #94a3b8;
}

.follow-btn {
  background-color: #ef4444;
  color: #fff;
  font-size: 13px;
  padding: 7px 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 500;
  white-space: nowrap;
}

.follow-btn:hover {
  background-color: #dc2626;
  transform: scale(1.05);
}

.reserve-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.feed-content {
  margin-bottom: 12px;
}

.content-text {
  font-size: 15px;
  color: #334155;
  line-height: 1.65;
  margin: 0;
  word-break: break-word;
}

.feed-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.feed-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
  transition: all 0.25s ease;
}

.feed-image:hover {
  transform: scale(1.03);
}

.feed-tags {
  margin-bottom: 8px;
}

.feed-tag {
  color: #667eea;
  font-size: 14px;
  font-weight: 500;
}

.feed-actions {
  display: flex;
  justify-content: space-around;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.25s ease;
  padding: 8px 16px;
  border-radius: 20px;
}

.action-item:hover {
  background-color: #f8fafc;
  color: #667eea;
}

.action-icon {
  font-size: 18px;
}

.action-icon.liked {
  animation: scale 0.3s ease;
}

@keyframes scale {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

.action-text {
  font-size: 13px;
  font-weight: 500;
}

.follow-action {
  color: #667eea;
  font-weight: 500;
}

.follow-action.followed {
  color: #94a3b8;
}

.loading-more,
.no-more {
  text-align: center;
  padding: 24px;
  color: #94a3b8;
  font-size: 14px;
}

/* --- 发布按钮 --- */
.publish-btn {
  position: fixed;
  right: 20px;
  bottom: 120px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  z-index: 20;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.publish-btn span {
  font-size: 32px;
  font-weight: 300;
  line-height: 1;
}

.publish-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
}

.publish-btn:active {
  transform: scale(0.95);
}

/* --- PC 端适配 --- */
@media (min-width: 768px) {
  .activity-page {
    max-width: 650px;
    margin: 0 auto;
  }

  .header {
    left: 50%;
    transform: translateX(-50%);
    max-width: 650px;
  }

  .publish-btn {
    right: calc(50% - 325px + 20px);
  }
}

@media (min-width: 1024px) {
  .activity-page {
    max-width: 720px;
  }

  .header {
    max-width: 720px;
  }

  .publish-btn {
    right: calc(50% - 360px + 20px);
  }
}
</style>
