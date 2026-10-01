<template>
  <PageLayout>
    <template #nav>
      <div class="list-nav">
        <div class="nav-back" @click="goBack">‹</div>
        <div class="nav-title">{{ title }}</div>
        <div class="nav-spacer"></div>
      </div>
    </template>

    <HomeRecommend
      :companions="companions"
      :loading-more="loadingMore"
      :loading-companions="loadingCompanions"
      :error="loadError"
      @load-more="loadMore"
      @user-click="goUserProfile"
      @retry="reload"
    />
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageLayout from '../components/PageLayout.vue'
import HomeRecommend from '../components/HomeRecommend.vue'
import homeService from '../services/homeService'

const route = useRoute()
const router = useRouter()

const type = computed(() => route.query.type === 'offline' ? 'offline' : 'online')

const title = computed(() => {
  if (type.value === 'offline') return '线下陪玩'
  if (type.value === 'online') return '线上陪玩'
  return '陪玩师'
})

const companions = ref([])
const currentPage = ref(1)
const hasMore = ref(true)
const loadingMore = ref(false)
const loadingCompanions = ref(true)
const loadError = ref(false)

const pageSize = 10

const genAvatar = (name) => {
  const colors = ['#667eea', '#764ba2', '#f093fb', '#43e97b', '#fa709a']
  const color = colors[name.charCodeAt(0) % colors.length]
  const ch = (name || '?').charAt(0)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='${color}'/><text x='50%' y='50%' dy='.35em' text-anchor='middle' fill='white' font-size='36' font-family='sans-serif'>${ch}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}



const load = async (reset = false) => {
  if (reset) {
    currentPage.value = 1
    hasMore.value = true
    loadError.value = false
    loadingCompanions.value = true
    companions.value = []
  }

  if (!hasMore.value) return

  try {
    const result = await homeService.getRecommendCompanions({
      serviceType: type.value,
      page: currentPage.value,
      pageSize
    })

    const isSuccess = result && (result.code === 200 || result.code === 0)
    if (!isSuccess) throw new Error(result && result.message ? result.message : '数据加载失败')

    const list = (result.data && (result.data.list || result.data)) || []

    if (list.length > 0) {
      companions.value = reset ? list : [...companions.value, ...list]
      currentPage.value++
      hasMore.value = list.length >= pageSize
    } else if (reset) {
      companions.value = []
      hasMore.value = false
    } else {
      hasMore.value = false
    }
  } catch (error) {
    console.error('加载陪玩列表失败:', error)
    if (reset) {
      companions.value = []
      loadError.value = true
    }
    hasMore.value = false
  } finally {
    loadingCompanions.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  load(false)
}

const reload = () => load(true)

const goUserProfile = (userId) => {
  if (userId) router.push(`/user/${userId}`)
}

const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push('/home')
}

onMounted(() => {
  load(true)
})
</script>

<style scoped>
.list-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.nav-back {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 22px;
  line-height: 30px;
  text-align: center;
  cursor: pointer;
  flex-shrink: 0;
}

.nav-title {
  color: #fff;
  font-size: 17px;
  font-weight: 600;
}

.nav-spacer {
  width: 32px;
  flex-shrink: 0;
}
</style>
