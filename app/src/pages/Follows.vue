<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">我的关注</text>
      <text class="placeholder"></text>
    </template>

    <view class="content">
      <view class="user-list" v-if="follows.length > 0">
        <view class="user-card" v-for="user in follows" :key="user.id" @click="viewProfile(user)">
          <SafeImage class="user-avatar" :src="user.avatar" alt="" :fallback="user.name" mode="aspectFill" />
          <view class="user-info">
            <view class="user-name">{{ user.name }}</view>
            <view class="user-desc">Lv.{{ user.level || 1 }}</view>
          </view>
          <button class="follow-btn followed" @click.stop="unfollow(user)" :disabled="unfollowingId === user.id">
            {{ unfollowingId === user.id ? '处理中' : '已关注' }}
          </button>
        </view>

        <view class="list-footer">
          <text v-if="loading" class="footer-text">加载中...</text>
          <text v-else-if="hasMore" class="footer-text more" @click="loadFollows(true)">加载更多</text>
          <text v-else class="footer-text">没有更多了</text>
        </view>
      </view>

      <view v-else-if="loading" class="loading-box">加载中...</view>

      <EmptyState v-else icon="👥" text="暂无关注" hint="快去关注感兴趣的人吧" />
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import EmptyState from '../components/EmptyState.vue'
import authService from '../services/authService'
import { DEFAULT_AVATAR } from '@/common/constants'
import { toast } from '../composables/useToast'
import SafeImage from '../components/SafeImage.vue'

const router = useRouter()

const PAGE_SIZE = 20

const follows = ref([])
const page = ref(1)
const total = ref(0)
const loading = ref(false)
// 静默刷新单独占位，既避免与「加载更多」争用 loading 展示，也保持并发锁
const refreshing = ref(false)
const hasMore = ref(false)
const unfollowingId = ref(null)

const mapUser = (item) => ({
  id: item.userId,
  name: item.nickname || '用户',
  avatar: item.avatar || DEFAULT_AVATAR,
  level: item.level
})

const loadFollows = async (append = false, silent = false) => {
  if (loading.value || refreshing.value) return
  if (silent) refreshing.value = true
  else loading.value = true
  try {
    const res = await authService.getFollows({ page: page.value, pageSize: PAGE_SIZE })
    const data = res.data || {}
    const rows = (data.list || []).map(mapUser)
    follows.value = append ? follows.value.concat(rows) : rows
    total.value = data.total || 0
    hasMore.value = follows.value.length < total.value
    if (rows.length) page.value += 1
  } catch (err) {
    if (!silent) toast.error(err.message || '加载关注列表失败')
  } finally {
    if (silent) refreshing.value = false
    else loading.value = false
  }
}

const unfollow = async (user) => {
  if (unfollowingId.value) return
  unfollowingId.value = user.id
  try {
    const res = await authService.unfollow(user.id)
    const isFollow = res?.data?.isFollow
    if (isFollow === false) {
      const index = follows.value.findIndex(u => u.id === user.id)
      if (index > -1) follows.value.splice(index, 1)
      total.value = Math.max(0, total.value - 1)
      toast.success('已取消关注')
    }
  } catch (err) {
    toast.error(err.message || '取消关注失败')
  } finally {
    unfollowingId.value = null
  }
}

const viewProfile = (user) => {
  router.push({ name: 'UserProfile', params: { id: user.id } })
}

const goBack = () => {
  router.back()
}

// 返回本页时从第一页静默刷新，不闪 loading、不重复首载
const refreshOnShow = () => {
  page.value = 1
  loadFollows(false, true)
}

onMounted(() => {
  loadFollows()
})
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
.back-btn,
.placeholder {
  width: 40px;
  font-size: 20px;
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

.content {
  padding: 12px;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-card {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 0px;
  padding: 16px 20px;
  margin: 12px 20px 0;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.user-desc {
  font-size: 13px;
  color: #999;
}

.follow-btn {
  padding: 8px 20px;
  font-size: 13px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
}

.follow-btn.followed {
  background: #f5f5f5;
  color: #999;
}

.follow-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-box {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 40px 0;
}

.list-footer {
  text-align: center;
  padding: 14px 0;
}

.footer-text {
  font-size: 13px;
  color: #999;
}

.footer-text.more {
  color: var(--color-primary);
  cursor: pointer;
}
</style>
