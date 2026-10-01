<template>
  <PageLayout>
    <template #nav>
      <span class="back-btn" @click="goBack">←</span>
      <span class="nav-title">我的粉丝</span>
      <span class="count">{{ total }}人</span>
    </template>

    <div class="content">
      <div class="user-list" v-if="fans.length > 0">
        <div class="user-card" v-for="user in fans" :key="user.id" @click="viewProfile(user)">
          <img class="user-avatar" :src="user.avatar" alt="" v-img-fallback="user.name" />
          <div class="user-info">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-desc">Lv.{{ user.level || 1 }}</div>
          </div>
          <button
            class="follow-btn"
            :class="{ followed: user.isFollow }"
            :disabled="busyId === user.id"
            @click.stop="toggleFollow(user)"
          >
            {{ user.isFollow ? '已关注' : '+ 关注' }}
          </button>
        </div>

        <div class="list-footer">
          <span v-if="loading" class="footer-text">加载中...</span>
          <span v-else-if="hasMore" class="footer-text more" @click="loadFans(true)">加载更多</span>
          <span v-else class="footer-text">没有更多了</span>
        </div>
      </div>

      <div v-else-if="loading" class="loading-box">加载中...</div>

      <EmptyState v-else icon="👥" text="暂无粉丝" hint="努力提升自己，粉丝会越来越多哦" />
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

const fans = ref([])
const page = ref(1)
const total = ref(0)
const loading = ref(false)
const hasMore = ref(false)
const busyId = ref(null)

const mapUser = (item) => ({
  id: item.userId,
  name: item.nickname || '用户',
  avatar: item.avatar || DEFAULT_AVATAR,
  level: item.level,
  isFollow: !!item.isFollow
})

const loadFans = async (append = false) => {
  if (loading.value) return
  loading.value = true
  try {
    const res = await authService.getFans({ page: page.value, pageSize: PAGE_SIZE })
    const data = res.data || {}
    const rows = (data.list || []).map(mapUser)
    fans.value = append ? fans.value.concat(rows) : rows
    total.value = data.total || 0
    hasMore.value = fans.value.length < total.value
    if (rows.length) page.value += 1
  } catch (err) {
    toast.error(err.message || '加载粉丝列表失败')
  } finally {
    loading.value = false
  }
}

const toggleFollow = async (user) => {
  if (busyId.value) return
  busyId.value = user.id
  try {
    const res = user.isFollow
      ? await authService.unfollow(user.id)
      : await authService.follow(user.id)
    const isFollow = res?.data?.isFollow
    if (typeof isFollow === 'boolean') {
      user.isFollow = isFollow
      toast.success(isFollow ? '已关注' : '已取消关注')
    }
  } catch (err) {
    toast.error(err.message || '操作失败')
  } finally {
    busyId.value = null
  }
}

const viewProfile = (user) => {
  router.push({ name: 'UserProfile', params: { id: user.id } })
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadFans()
})
</script>

<style scoped>
.back-btn {
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

.count {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
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
  background: var(--gradient-primary);
  color: white;
}

.follow-btn:not(.followed) {
  background: #f5f5f5;
  color: #333;
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
