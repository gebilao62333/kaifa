<template>
  <PageLayout>
    <template #nav>
      <h2 class="nav-title">广场</h2>
      <button class="publish-btn" @click="goPublish">+ 发布</button>
    </template>

    <view class="tag-filter" v-if="tagList.length > 0">
      <view
        class="tag-item"
        :class="{ active: activeTag === '' }"
        @click="switchTag('')"
      >全部</view>
      <view
        v-for="tag in tagList"
        :key="tag.tagId"
        class="tag-item"
        :class="{ active: activeTag === tag.tagName }"
        @click="switchTag(tag.tagName)"
      >{{ tag.tagName }}</view>
    </view>

    <view class="post-list" v-if="postList.length > 0">
      <view
        v-for="post in postList"
        :key="post.postId || post.id"
        class="post-card"
        @click="goPostDetail(post)"
      >
        <view class="post-header">
          <SafeImage :src="post.avatar || defaultAvatar" class="post-avatar" :fallback="post.nickName || '用户'" mode="aspectFill" />
          <view class="post-user-info">
            <text class="post-nickname">{{ post.nickName || post.nickname || '用户' }}</text>
            <text class="post-time">{{ formatTime(post.createTime || post.createdAt) }}</text>
          </view>
          <text class="post-tag" v-if="post.tagName">{{ post.tagName }}</text>
        </view>
        <view class="post-content">{{ post.content }}</view>
        <!-- 转发展示 -->
        <view class="repost-card" v-if="post.repostId && post.repostContent" @click.stop="goPostDetail({ postId: post.repostId, id: post.repostId })">
          <view class="repost-header">
            <text class="repost-icon">🔄</text>
            <text class="repost-nickname">{{ post.repostNickname || '原作者' }}</text>
          </view>
          <view class="repost-content">{{ post.repostContent }}</view>
        </view>
        <view class="post-images" v-if="post.images && post.images.length > 0">
          <image
              mode="aspectFill"
            v-for="(img, idx) in post.images.slice(0, 3)"
            :key="idx"
            :src="img"
            class="post-image"
            :class="post.images.length === 1 ? 'single' : ''"
          />
          <view class="image-more" v-if="post.images.length > 3">+{{ post.images.length - 3 }}</view>
        </view>
        <view class="post-actions">
          <text class="action-item" @click.stop="handleLike(post)">
            <text>{{ post.isLiked ? '❤️' : '🤍' }}</text>
            <text>{{ post.likes || 0 }}</text>
          </text>
          <text class="action-item">
            <text>💬</text>
            <text>{{ post.comments || 0 }}</text>
          </text>
          <text class="action-item" @click.stop="openSharePopup(post)">
            <text>📤</text>
            <text>{{ post.shares || 0 }}</text>
          </text>
        </view>
      </view>
    </view>

    <EmptyState v-else-if="!loading" text="暂无动态" actionText="发布第一条动态" @action="goPublish" />

    <view class="loading-more" v-if="loading">加载中...</view>
    <view class="no-more" v-if="!hasMore && postList.length > 0">没有更多了</view>

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
import { onHide, onPageScroll, onReachBottom, onShow, onUnload } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import { useUserStore } from '../store/user-info'
import {
  readScrollTop,
  restoreScrollTop,
  restoreTabState,
  saveScrollTop,
  saveTabState,
  setTabStateOwner
} from '../common/tabState'
import PageLayout from '../components/PageLayout.vue'
import EmptyState from '../components/EmptyState.vue'
import SharePopup from '../components/SharePopup.vue'
import circleService from '../services/circleService'
import { genAvatar } from '../utils/placeholder'
import SafeImage from '../components/SafeImage.vue'
import { isApp } from '../common/platform'

const router = useRouter()

const defaultAvatar = genAvatar('default')
const activeTag = ref('')
const tagList = ref([])
const postList = ref([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)
const pageSize = 20

const userStore = useUserStore()
const TAB_STATE_PATH = '/square'
const tabOwnerId = () => userStore.profile?.userId || ''

// 主 Tab 用 reLaunch 切页会重建本页：优先恢复上次离开时的列表/标签/分页，避免骨架屏 + 滚动归零。
// 快照超过 30s 视为过期，列表照常先渲染，但仍静默刷新一次（见 tabState.TAB_STATE_FRESH_MS）。
const tabRestore = restoreTabState(TAB_STATE_PATH, tabOwnerId(), (snapshot) => {
  if (Array.isArray(snapshot.tagList)) tagList.value = snapshot.tagList
  if (Array.isArray(snapshot.postList)) postList.value = snapshot.postList
  if (typeof snapshot.activeTag === 'string') activeTag.value = snapshot.activeTag
  if (typeof snapshot.page === 'number') page.value = snapshot.page
  if (typeof snapshot.hasMore === 'boolean') hasMore.value = snapshot.hasMore
  // 有快照时列表可直接渲染，不能停留在首载 loading 态
  loading.value = false
})
const restoredScrollTop = tabRestore.restored ? readScrollTop(TAB_STATE_PATH) : 0
let pageScrollTop = restoredScrollTop

// onHide 在 reLaunch 销毁前触发，onUnload 兜底；两者都触发时只保存一次
let tabStateSaved = false
const saveTabSnapshot = () => {
  if (tabStateSaved) return
  tabStateSaved = true
  saveTabState(TAB_STATE_PATH, {
    tagList: tagList.value,
    postList: postList.value,
    activeTag: activeTag.value,
    page: page.value,
    hasMore: hasMore.value
  })
  saveScrollTop(TAB_STATE_PATH, pageScrollTop)
}
onHide(saveTabSnapshot)
onUnload(saveTabSnapshot)

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

const loadPosts = async (reset = false, silent = false) => {
  if (loading.value) return
  if (!hasMore.value && !reset) return

  // silent=true：onShow 静默刷新，不闪 loading、不先清空列表（H5 首载/切换标签仍走原逻辑）
  if (!silent) loading.value = true
  if (reset) {
    page.value = 1
    hasMore.value = true
    if (!silent) postList.value = []
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
    if (!silent) loading.value = false
    // 列表高度变化后重新测量页面总高度，App 端下一次滚动才能正确触发触底加载
    if (isApp) setTimeout(measurePageScrollHeight, 200)
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
  // App 端没有 window.location：站点域名取构建时注入的 VITE_API_ORIGIN（见 common/config.js）
  const siteOrigin = isApp ? String(import.meta.env.VITE_API_ORIGIN || '').replace(/\/+$/, '') : window.location.origin
  sharePostUrl.value = `${siteOrigin}/post-detail/${id}`
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
  // H5 侧滚动位置以 window 监听为准，供切 Tab 后恢复（App 侧走 onPageScroll）
  pageScrollTop = Number(scrollTop) || 0
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  if (scrollTop + windowHeight >= documentHeight - 100) {
    loadPosts()
  }
}

// App 端页面由原生容器滚动、拿不到 document 高度：用 onPageScroll + 选择器查到的页面总高度
// 还原「触底加载」，onReachBottom 兜底；H5 继续走 window 监听，行为不变
let pageScrollHeight = 0
const measurePageScrollHeight = () => {
  try {
    uni.createSelectorQuery().selectViewport().scrollOffset((res) => {
      if (res && res.scrollHeight) pageScrollHeight = res.scrollHeight
    }).exec()
  } catch (e) { /* 查询失败时交给 onReachBottom 兜底 */ }
}

onPageScroll(({ scrollTop }) => {
  pageScrollTop = Number(scrollTop) || 0
  if (!isApp || !pageScrollHeight) return
  let windowHeight = 0
  try { windowHeight = uni.getSystemInfoSync().windowHeight || 0 } catch (e) {}
  if (scrollTop + windowHeight >= pageScrollHeight - 100) loadPosts()
})

onReachBottom(() => {
  // 只在页面高度查询不可用（pageScrollHeight 为 0）时兜底；
  // 查询成功时滚动判定已覆盖触底，避免两个入口重复拉同一份数据
  if (isApp && !pageScrollHeight) loadPosts()
})

onMounted(async () => {
  if (tabRestore.restored) {
    // 列表已由快照渲染，等挂载后再恢复滚动位置（restoreScrollTop 内部会补两次重试）
    restoreScrollTop(restoredScrollTop)
    if (!tagList.value.length) loadTags()
    // 快照列表为空（上次加载失败/无数据）时不锁死空态：仍静默拉一次
    if (tabRestore.needRefresh || postList.value.length === 0) loadPosts(true, true)
  } else {
    await Promise.all([loadTags(), loadPosts(true)])
  }
  if (!isApp) {
    window.addEventListener('scroll', handleScroll)
    return
  }
  measurePageScrollHeight()
})

onUnmounted(() => {
  if (!isApp) window.removeEventListener('scroll', handleScroll)
})

// 首次 onShow 跳过（onMounted 已首载）；从详情页返回时静默刷新列表
let __firstShow = true
onShow(() => {
  // 账号（含登出）变化时清空全部 Tab 缓存，避免跨账号恢复旧列表
  setTabStateOwner(tabOwnerId())
  tabStateSaved = false
  if (__firstShow) {
    __firstShow = false
    return
  }
  loadPosts(true, true)
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
