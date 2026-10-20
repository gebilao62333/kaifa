<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">我的动态</text>
      <text class="add-btn" @click="goPublish">发动态</text>
    </template>

    <view class="posts-tabs">
      <text
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-item', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
        <text class="tab-count">{{ tab.count }}</text>
      </text>
    </view>

    <view class="posts-list" v-if="filteredPosts.length > 0">
      <view class="post-card" v-for="post in filteredPosts" :key="post.id" @click="goDetail(post.id)">
        <view class="post-header">
          <image mode="aspectFill" :src="userInfo.avatar" class="post-avatar" />
          <view class="post-user">
            <text class="post-nickname">{{ userInfo.nickName }}</text>
            <text class="post-time">{{ post.createTime }}</text>
          </view>
          <text class="post-status" :class="'status-' + post.status">{{ getStatusText(post.status) }}</text>
        </view>
        <view class="post-body">
          <view class="post-content">{{ post.content }}</view>
          <view class="post-images" v-if="post.images.length > 0">
            <image
              mode="aspectFill"
              v-for="(img, idx) in post.images.slice(0, 3)"
              :key="idx"
              :src="img"
              class="post-img"
              :class="{ single: post.images.length === 1 }"
            />
          </view>
        </view>
        <view class="post-footer">
          <text class="footer-item">❤️ {{ post.likeCount }}</text>
          <text class="footer-item">💬 {{ post.commentCount }}</text>
          <text class="footer-item">🔄 {{ post.shareCount }}</text>
          <text class="post-actions">
            <text class="action-btn" @click.stop="deletePost(post)">🗑️ 删除</text>
          </text>
        </view>
      </view>
    </view>

    <EmptyState v-else :text="emptyText" actionText="发第一条动态" @action="goPublish" />
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import EmptyState from '../components/EmptyState.vue'
import circleService from '../services/circleService'
import { toast } from '../composables/useToast'
import { useUserStore } from '../store/user-info'
import { DEFAULT_AVATAR } from '@/common/constants'
import { isApp } from '../common/platform'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('all')

const userInfo = computed(() => ({
  nickName: userStore.profile?.nickName || userStore.profile?.nickname || '我',
  avatar: userStore.profile?.avatar || DEFAULT_AVATAR
}))

const tabs = ref([
  { id: 'all', name: '全部', count: 0 },
  { id: 'published', name: '已发布', count: 0 },
  { id: 'review', name: '审核中', count: 0 },
  { id: 'rejected', name: '未通过', count: 0 }
])

const allPosts = ref([])

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

// App 原生端没有可靠的 window.confirm：统一用 uni.showModal 二次确认；H5 保持 confirm 原逻辑
const confirmAction = (message) => new Promise((resolve) => {
  if (isApp) {
    if (typeof uni !== 'undefined' && typeof uni.showModal === 'function') {
      uni.showModal({
        title: '提示',
        content: message,
        success: (res) => resolve(!!res.confirm),
        fail: () => resolve(false)
      })
    } else {
      // 原生端拿不到 uni.showModal 时按「取消」处理，避免无法确认就执行破坏性操作
      resolve(false)
    }
    return
  }
  resolve(confirm(message))
})

const deletePost = async (post) => {
  if (!(await confirmAction('确定要删除这条动态吗？相关图片/视频也会一并删除'))) return
  try {
    await circleService.deletePost(post.id)
    const idx = allPosts.value.findIndex(p => p.id === post.id)
    if (idx > -1) {
      allPosts.value.splice(idx, 1)
      updateTabCounts()
    }
    toast.success('删除成功')
  } catch (error) {
    toast.error(error.message || '删除失败')
  }
}

const updateTabCounts = () => {
  tabs.value[0].count = allPosts.value.length
  tabs.value[1].count = allPosts.value.filter(p => p.status === 'published').length
  tabs.value[2].count = allPosts.value.filter(p => p.status === 'review').length
  tabs.value[3].count = allPosts.value.filter(p => p.status === 'rejected').length
}

const mapPost = (p) => ({
  id: p.postId || p.id,
  content: p.content || '',
  images: Array.isArray(p.images) ? p.images : (p.images ? String(p.images).split(',').filter(Boolean) : []),
  createTime: p.createTime || p.create_time || '',
  likeCount: p.likeCount ?? p.likes ?? 0,
  commentCount: p.commentCount ?? p.comments ?? 0,
  shareCount: p.shareCount ?? p.share_num ?? 0,
  status: typeof p.status === 'string' ? p.status : (Number(p.status) === 2 ? 'rejected' : (Number(p.status) === 0 ? 'review' : 'published'))
})

const loadPosts = async (silent = false) => {
  try {
    const res = await circleService.getMyPosts({ page: 1, pageSize: 50 })
    const rows = res?.data?.list || []
    allPosts.value = rows.map(mapPost)
  } catch (e) {
    // 接口失败展示空态，不再回退内置示例数据；静默刷新失败则保留旧列表且不弹 toast
    if (!silent) {
      allPosts.value = []
      toast.error('加载动态失败，请稍后重试')
    }
  } finally {
    updateTabCounts()
  }
}

// 返回我的动态时静默刷新（发布/删除后状态可能变化）
const refreshOnShow = () => {
  loadPosts(true)
}

onMounted(loadPosts)
updateTabCounts()
// 首次 onShow 由 onMounted 首载，后续 onShow（返回本页）才静默刷新
let __firstShow = true
onShow(() => {
  if (__firstShow) {
    __firstShow = false
    return
  }
  refreshOnShow()
})
</script>

<style scoped>
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

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
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
  background: var(--gradient-primary);
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
  border-radius: 0px;
  margin: 12px 20px 0;
  padding: 16px 20px;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
</style>
