<template>
  <div class="post-detail-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">动态详情</span>
      <span class="more-btn">•••</span>
    </div>
    
    <div class="post-content">
      <div class="user-info" @click="goUserProfile">
        <img class="avatar" :src="postData.avatar" alt="" />
        <div class="info">
          <div class="nickname">{{ postData.nickName }}</div>
          <div class="time">{{ formatTime(postData.createTime) }}</div>
        </div>
        <span class="follow-btn" v-if="!postData.isFollow">已关注</span>
        <span class="follow-btn not-follow" v-else @click="follow">+ 关注</span>
      </div>
      
      <div class="content-text">{{ postData.content }}</div>
      
      <div class="images-grid" v-if="postData.images && postData.images.length">
        <img 
          class="image" 
          v-for="(img, index) in postData.images" 
          :key="index" 
          :src="img" 
          :alt="'图片' + index"
          @click="previewImage(img)"
        />
      </div>
      
      <div class="post-tag" v-if="postData.tagName">#{{ postData.tagName }}</div>
      
      <div class="action-bar">
        <div class="action-item">
          <span class="icon">{{ postData.isLike ? '❤️' : '🤍' }}</span>
          <span class="count">{{ postData.likes }}</span>
        </div>
        <div class="action-item">
          <span class="icon">💬</span>
          <span class="count">{{ postData.comments }}</span>
        </div>
        <div class="action-item">
          <span class="icon">🔗</span>
          <span class="text">分享</span>
        </div>
      </div>
    </div>
    
    <div class="comments-section">
      <div class="section-header">
        <span class="title">评论 ({{ commentList.length }})</span>
      </div>
      
      <div class="comment-list">
        <div class="comment-item" v-for="comment in commentList" :key="comment.id">
          <img class="comment-avatar" :src="comment.avatar" alt="" />
          <div class="comment-content">
            <div class="comment-user">
              <span class="comment-nickname">{{ comment.nickName }}</span>
              <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
            </div>
            <div class="comment-text">{{ comment.content }}</div>
            <div class="comment-actions">
              <span class="comment-reply" @click="replyTo(comment)">回复</span>
              <span class="comment-like">{{ comment.isLike ? '❤️' : '🤍' }} {{ comment.likes }}</span>
            </div>
            <div class="reply-list" v-if="comment.replyList && comment.replyList.length">
              <div class="reply-item" v-for="reply in comment.replyList" :key="reply.id">
                <span class="reply-nickname">{{ reply.nickName }}:</span>
                <span class="reply-text">{{ reply.content }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bottom-bar">
      <div class="input-wrapper">
        <input 
          class="input" 
          :placeholder="'评论...'" 
          v-model="commentText"
          @keyup.enter="sendComment"
        />
        <div class="tools">
          <span class="tool">😊</span>
          <span class="tool">📷</span>
          <span class="send-btn" @click="sendComment">发送</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const postData = ref({
  postId: 1,
  userId: 1,
  nickName: '小雪',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
  level: 28,
  vip: true,
  content: '今天王者连赢五局，超开心！分享一下今天的战绩～',
  images: [
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400'
  ],
  tagName: '游戏',
  likes: 128,
  comments: 32,
  isLike: false,
  isFollow: false,
  createTime: Date.now() - 3600000
})

const commentList = ref([
  {
    id: 1,
    userId: 2,
    nickName: '阿杰',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    content: '厉害啊，带我飞！',
    likes: 12,
    isLike: false,
    createTime: Date.now() - 3000000,
    replyList: [
      {
        id: 1,
        userId: 1,
        nickName: '小雪',
        content: '好呀！',
        createTime: Date.now() - 2400000
      }
    ]
  },
  {
    id: 2,
    userId: 3,
    nickName: '小美',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    content: '666，大佬带带我！',
    likes: 8,
    isLike: false,
    createTime: Date.now() - 2000000,
    replyList: []
  }
])

const commentText = ref('')

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

const goBack = () => {
  router.back()
}

const goUserProfile = () => {
  console.log('查看用户资料')
  router.push({ name: 'UserProfile', params: { id: postData.value.userId } })
}

const follow = () => {
  postData.value.isFollow = true
}

const previewImage = (img) => {
  console.log('预览图片:', img)
}

const replyTo = (comment) => {
  commentText.value = `回复 ${comment.nickName}：`
}

const sendComment = () => {
  if (!commentText.value.trim()) return
  
  commentList.value.unshift({
    id: Date.now(),
    userId: 100001,
    nickName: '我',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    content: commentText.value,
    likes: 0,
    isLike: false,
    createTime: Date.now(),
    replyList: []
  })
  
  postData.value.comments++
  commentText.value = ''
}

onMounted(() => {
  console.log('动态详情页加载完成')
})
</script>

<style scoped>
.post-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 70px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60px 20px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.back-btn, .more-btn {
  font-size: 24px;
  cursor: pointer;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.post-content {
  background: white;
  margin: 16px;
  border-radius: 12px;
  padding: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.info {
  flex: 1;
}

.nickname {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.time {
  font-size: 12px;
  color: #999;
}

.follow-btn {
  background: #667eea;
  color: white;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
}

.follow-btn.not-follow {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.content-text {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 16px;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.image {
  width: 100%;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
}

.post-tag {
  color: #667eea;
  font-size: 14px;
  margin-bottom: 16px;
}

.action-bar {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 16px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.action-item .icon {
  font-size: 20px;
}

.comments-section {
  background: white;
  margin: 0 16px;
  border-radius: 12px;
  padding: 20px;
}

.section-header {
  margin-bottom: 20px;
}

.title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-user {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.comment-nickname {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  color: #444;
  line-height: 1.5;
  margin-bottom: 8px;
}

.comment-actions {
  display: flex;
  gap: 16px;
  color: #999;
  font-size: 13px;
}

.comment-reply {
  cursor: pointer;
}

.comment-like {
  cursor: pointer;
}

.reply-list {
  background: #f7f7f7;
  padding: 10px;
  border-radius: 8px;
  margin-top: 8px;
}

.reply-item {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.reply-nickname {
  color: #667eea;
  font-weight: 500;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 10px 16px;
  border-top: 1px solid #eee;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 8px 12px;
}

.input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
  padding: 4px 0;
}

.tools {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 8px;
}

.tool {
  font-size: 20px;
  cursor: pointer;
}

.send-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
}
</style>
