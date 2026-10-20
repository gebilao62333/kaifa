<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">获赞记录</text>
      <text class="total">总计 {{ totalLikes }}</text>
    </template>

    <view class="likes-list" v-if="likesList.length > 0">
      <view class="like-item" v-for="(item, idx) in likesList" :key="idx" @click="viewProfile(item)">
        <image mode="aspectFill" :src="item.avatar" class="item-avatar" />
        <view class="item-info">
          <text class="item-name">{{ item.nickName }}</text>
          <text class="item-time">{{ item.time }}</text>
        </view>
        <text class="item-content">{{ item.content }}</text>
      </view>
    </view>

    <EmptyState v-else icon="❤️" text="还没有人赞过你" />
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import EmptyState from '../components/EmptyState.vue'
import authService from '../services/authService'
import { DEFAULT_AVATAR } from '../common/constants'

const router = useRouter()

const totalLikes = ref(0)

const likesList = ref([])

const formatTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const loadLikes = async () => {
  try {
    const res = await authService.getLikes()
    const rows = res?.data?.list || []
    likesList.value = rows.map(r => ({
      id: r.userId,
      nickName: r.nickname || '用户',
      avatar: r.avatar || DEFAULT_AVATAR,
      time: formatTime(r.time),
      content: '赞了你的动态'
    }))
    totalLikes.value = res?.data?.total ?? likesList.value.length
  } catch (e) {
    console.error('加载点赞记录失败:', e)
  }
}

// 返回点赞记录页时静默刷新，不重复首载
const refreshOnShow = () => {
  loadLikes()
}

onMounted(loadLikes)
// 首次 onShow 由 onMounted 首载，后续 onShow（返回本页）才静默刷新
let __firstShow = true
onShow(() => {
  if (__firstShow) {
    __firstShow = false
    return
  }
  refreshOnShow()
})

const goBack = () => {
  router.back()
}

const viewProfile = (user) => {
  if (!user?.id) return
  router.push({ name: 'UserProfile', params: { id: user.id } })
}
</script>

<style scoped>
.back-btn {
  font-size: 24px;
  color: #fff;
  cursor: pointer;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.total {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
}

.likes-list {
  padding: 12px;
}

.like-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-radius: 0px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.item-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 2px;
}

.item-time {
  font-size: 12px;
  color: #999;
}

.item-content {
  font-size: 13px;
  color: #666;
  text-align: right;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
