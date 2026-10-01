<template>
  <PageLayout>
    <template #nav>
      <span class="back-btn" @click="goBack">←</span>
      <span class="nav-title">我的关注</span>
      <span class="placeholder"></span>
    </template>

    <div class="content">
      <div class="user-list" v-if="follows.length > 0">
        <div class="user-card" v-for="user in follows" :key="user.id" @click="viewProfile(user)">
          <img class="user-avatar" :src="user.avatar" alt="" v-img-fallback="user.name" />
          <div class="user-info">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-desc">Lv.{{ user.level || 1 }}</div>
          </div>
          <button class="follow-btn followed" @click.stop="unfollow(user)" :disabled="unfollowingId === user.id">
            {{ unfollowingId === user.id ? '处理中' : '已关注' }}
          </button>
        </div>

        <div class="list-footer">
          <span v-if="loading" class="footer-text">加载中...</span>
          <span v-else-if="hasMore" class="footer-text more" @click="loadFollows(true)">加载更多</span>
          <span v-else class="footer-text">没有更多了</span>
        </div>
      </div>

      <div v-else-if="loading" class="loading-box">加载中...</div>

      <EmptyState v-else icon="👥" text="暂无关注" hint="快去关注感兴趣的人吧" />
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '../components/PageLayout.vue'
import EmptyState from '../components/EmptyState.vue'
import authService from '../services/authService'
import { DEFAULT_AVATAR } from '@/common/constants'
import { toast } from '../composables/useToast'

const router = useRouter()

const PAGE_SIZE = 20

const follows = ref([])
const page = ref(1)
const total = ref(0)
const loading = ref(false)
const hasMore = ref(false)
const unfollowingId = ref(null)

const mapUser = (item) => ({
  id: item.userId,
  name: item.nickname || '用户',
  avatar: item.avatar || DEFAULT_AVATAR,
  level: item.level
})

const loadFollows = async (append = false) => {
  if (loading.value) return
  loading.value = true
  try {
    const res = await authService.getFollows({ page: page.value, pageSize: PAGE_SIZE })
    const data = res.data || {}
    const rows = (data.list || []).map(mapUser)
    follows.value = append ? follows.value.concat(rows) : rows
    total.value = data.total || 0
    hasMore.value = follows.value.length < total.value
  } catch (err) {
    toast.error(err.message || '加载关注列表失败')
  } finally {
    loading.value = false
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

onMounted(() => {
  loadFollows()
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
