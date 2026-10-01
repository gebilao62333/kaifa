<template>
  <PageLayout>
    <template #nav>
      <span class="back-btn" @click="goBack">←</span>
      <span class="nav-title">获赞记录</span>
      <span class="total">总计 {{ totalLikes }}</span>
    </template>

    <div class="likes-list" v-if="likesList.length > 0">
      <div class="like-item" v-for="(item, idx) in likesList" :key="idx" @click="viewProfile(item)">
        <img :src="item.avatar" class="item-avatar" />
        <div class="item-info">
          <span class="item-name">{{ item.nickName }}</span>
          <span class="item-time">{{ item.time }}</span>
        </div>
        <span class="item-content">{{ item.content }}</span>
      </div>
    </div>

    <EmptyState v-else icon="❤️" text="还没有人赞过你" />
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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

onMounted(loadLikes)

const goBack = () => {
  router.back()
}

const viewProfile = (user) => {
  router.push({ name: 'UserProfile', params: { id: user.id || '10001' } })
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
