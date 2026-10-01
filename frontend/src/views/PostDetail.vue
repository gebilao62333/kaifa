<template>
  <PageLayout>
    <template #nav>
      <span class="back-btn" @click="goBack">←</span>
      <span class="nav-title">动态详情</span>
      <span class="more-btn" @click="showReport = true">•••</span>
    </template>
    
    <div class="post-content" v-if="!loading">
      <div class="locked-view" v-if="postData.locked">
        <div class="lock-icon">🔒</div>
        <div class="lock-title">该动态为私密内容</div>
        <div class="lock-desc" v-if="postData.privateType === 2">
          解锁需 {{ postData.privatePrice }} 金币
        </div>
        <div class="lock-desc" v-else>
          输入密码即可查看
        </div>
        <input 
          class="lock-input" 
          v-if="postData.privateType !== 2" 
          v-model="unlockPassword"
          type="password" 
          placeholder="请输入解锁密码"
          @keyup.enter="handleUnlock"
        />
        <button class="unlock-btn" :disabled="unlocking" @click="handleUnlock">
          {{ unlocking ? '解锁中...' : (postData.privateType === 2 ? '支付解锁' : '立即解锁') }}
        </button>
      </div>

      <template v-else>
      <div class="user-info" @click="goUserProfile">
        <img class="avatar" :src="postData.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'" alt="" />
        <div class="info">
          <div class="nickname">{{ postData.nickName }}</div>
          <div class="time">{{ formatTime(postData.createTime) }}</div>
        </div>
        <span class="follow-btn" v-if="postData.isFollow">已关注</span>
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
        <div class="action-item" @click="toggleLike">
          <span class="icon">{{ postData.isLike ? '❤️' : '🤍' }}</span>
          <span class="count">{{ postData.likes || 0 }}</span>
        </div>
        <div class="action-item">
          <span class="icon">💬</span>
          <span class="count">{{ postData.comments || 0 }}</span>
        </div>
        <div class="action-item" @click="openSharePopup">
          <span class="icon">📤</span>
          <span class="text">分享</span>
        </div>
      </div>
      </template>
    </div>
    
    <div class="loading-state" v-else>
      <div class="loading-spinner"></div>
      <p>加载中...</p>
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

    <SharePopup
      :visible="shareVisible"
      :postId="postId"
      :postNickname="postData.nickName || ''"
      :postContent="postData.content || ''"
      :postShareUrl="shareUrl"
      @close="shareVisible = false"
      @shared="onShared"
      @reposted="onReposted"
    />

    <ReportModal
      :visible="showReport"
      :target-type="2"
      :target-id="postId"
      @close="showReport = false"
      @submitted="onReported"
    />
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PageLayout from '../components/PageLayout.vue'
import SharePopup from '../components/SharePopup.vue'
import ReportModal from '../components/report-modal/report-modal.vue'
import circleService from '../services/circleService'
import authService from '../services/authService'
import { toast } from '../composables/useToast'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const postId = ref(null)
const postData = ref({})
const commentList = ref([])
const commentText = ref('')
const replyToId = ref(null)
const unlockPassword = ref('')
const unlocking = ref(false)
const showReport = ref(false)

const onReported = () => {
  showReport.value = false
  toast.success('举报已提交，我们会尽快处理')
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

const loadPostDetail = async () => {
  try {
    loading.value = true
    const res = await circleService.getPostDetail(postId.value)
    postData.value = res.data || res
  } catch (err) {
    console.error('加载帖子详情失败:', err)
    toast.error('加载帖子详情失败')
  } finally {
    loading.value = false
  }
}

const loadComments = async () => {
  try {
    const res = await circleService.getComments(postId.value)
    commentList.value = res.data || res || []
  } catch (err) {
    console.error('加载评论失败:', err)
  }
}

const handleUnlock = async () => {
  try {
    if (postData.value.privateType !== 2 && !unlockPassword.value.trim()) {
      toast.error('请输入解锁密码')
      return
    }
    unlocking.value = true
    await circleService.unlockPost(postId.value, unlockPassword.value.trim())
    toast.success('解锁成功')
    unlockPassword.value = ''
    await loadPostDetail()
    await loadComments()
  } catch (err) {
    toast.error(err.message || '解锁失败，请重试')
  } finally {
    unlocking.value = false
  }
}

const goBack = () => {
  router.back()
}

const goUserProfile = () => {
  if (postData.value.userId) {
    router.push({ name: 'UserProfile', params: { id: postData.value.userId } })
  }
}

const follow = async () => {
  const uid = Number(postData.value.userId)
  if (!uid) return
  try {
    await authService.follow(uid)
    postData.value.isFollow = true
  } catch (e) {
    toast.error(e.message || '关注失败')
  }
}

const toggleLike = async () => {
  try {
    if (postData.value.isLike) {
      await circleService.unlikePost(postId.value)
      postData.value.isLike = false
      postData.value.likes = Math.max(0, (postData.value.likes || 0) - 1)
    } else {
      await circleService.likePost(postId.value)
      postData.value.isLike = true
      postData.value.likes = (postData.value.likes || 0) + 1
    }
  } catch (err) {
    toast.error('操作失败，请重试')
  }
}

// 分享弹窗状态
const shareVisible = ref(false)
const shareUrl = window.location.href

const openSharePopup = () => {
  shareVisible.value = true
}

const onShared = () => {
  postData.value.shares = (postData.value.shares || 0) + 1
  toast.success('分享成功')
}

const onReposted = () => {
  postData.value.shares = (postData.value.shares || 0) + 1
  toast.success('转发成功，已发布到你的动态')
}

const previewImage = (img) => {
  window.open(img, '_blank')
}

const replyTo = (comment) => {
  replyToId.value = comment.id
  commentText.value = `回复 ${comment.nickName}：`
}

const sendComment = async () => {
  if (!commentText.value.trim()) return

  const content = commentText.value.replace(/^回复\s*\S+[：:]\s*/, '')
  if (!content.trim()) return

  try {
    await circleService.commentPost(postId.value, content, replyToId.value)
    toast.success('评论成功')
    commentText.value = ''
    replyToId.value = null
    await loadComments()
    if (postData.value.comments !== undefined) {
      postData.value.comments++
    }
  } catch (err) {
    toast.error('评论失败，请重试')
  }
}

onMounted(() => {
  postId.value = Number(route.params.id)
  if (postId.value) {
    loadPostDetail()
    loadComments()
  } else {
    toast.error('帖子不存在')
    router.back()
  }
})
</script>

<style scoped>
.back-btn, .more-btn {
  font-size: 24px;
  color: white;
  cursor: pointer;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.locked-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;
}

.lock-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.lock-title {
  font-size: 17px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.lock-desc {
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
}

.lock-input {
  width: 100%;
  max-width: 260px;
  padding: 10px 14px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  margin-bottom: 20px;
  box-sizing: border-box;
}

.lock-input:focus {
  border-color: var(--color-primary);
}

.unlock-btn {
  width: 100%;
  max-width: 260px;
  padding: 11px 0;
  border: none;
  border-radius: 22px;
  background: var(--gradient-primary);
  color: white;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.unlock-btn:disabled {
  opacity: 0.6;
}

.post-content {
  background: white;
  margin: 12px 0 0;
  border-radius: 0px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  background: var(--color-primary);
  color: white;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
}

.follow-btn.not-follow {
  background: var(--gradient-primary);
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
  color: var(--color-primary);
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
  margin: 12px 0 0;
  border-radius: 0px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  color: var(--color-primary);
  font-weight: 500;
}

.bottom-bar {
  position: sticky;
  bottom: 0;
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
  background: var(--gradient-primary);
  color: white;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
  font-size: 14px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
