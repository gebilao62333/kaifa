<template>
  <div class="home-page">
    <div class="nav-bar">
      <div class="search-box" @click="goSearch">
        <span class="search-icon">🔍</span>
        <span class="search-text">搜索用户、帖子、游戏</span>
      </div>
      <button class="friend-btn" @click="goFriend">交友</button>
    </div>

    <div class="content-container">
      <HomeBanner :banners="bannerList" @banner-click="onBannerClick" />
      <HomeQuickNav @navigate="handleNavigate" />
      <HomeRecommend
        :companions="recommendList"
        :loading-more="loadingMore"
        :loading-companions="loadingCompanions"
        @load-more="loadMoreCompanions"
        @user-click="goUserProfile"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HomeBanner from '../components/HomeBanner.vue'
import HomeQuickNav from '../components/HomeQuickNav.vue'
import HomeRecommend from '../components/HomeRecommend.vue'
import homeService from '../services/homeService'
import { toast } from '../composables/useToast'

const router = useRouter()

const bannerList = ref([])

const recommendList = ref([])
const loadingMore = ref(false)
const loadingCompanions = ref(true)
const currentPage = ref(1)
const hasMore = ref(true)

const getAdminRecommendUsers = async () => {
  try {
    const result = await homeService.getRecommendHome()
    if (result.code === 200 && result.data) {
      const list = result.data.list || []
      return list.map(u => ({
        userId: u.userId,
        nickName: u.nickName || '用户' + u.userId,
        avatar: u.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin' + u.userId,
        level: u.level || 1,
        tags: u.tags || ['推荐'],
        price: u.price || 50,
        online: true,
        location: u.location || '',
        serviceType: 'both',
        vip: u.vip || false,
        vipLevel: u.vipLevel || 0,
        isAdminRecommend: true
      }))
    }
    return []
  } catch (e) {
    console.error('获取首页推荐失败:', e)
    return []
  }
}

const goSearch = () => {
  router.push('/search')
}

const goFriend = () => {
  router.push({ name: 'Friend' })
}

const goUserProfile = (userId) => {
  router.push({ name: 'UserProfile', params: { id: userId } })
}

const handleNavigate = (path) => {
  router.push(`/${path}`)
}

const loadBanners = async () => {
  try {
    const result = await homeService.getBanners()
    if (result.code === 200 && result.data && result.data.list) {
      bannerList.value = result.data.list
    }
  } catch (error) {
    console.error('加载Banner失败:', error)
  }
}

const loadRecommendCompanions = async (reset = false) => {
  if (reset) {
    currentPage.value = 1
    hasMore.value = true
    loadingCompanions.value = true
    recommendList.value = []
  }

  if (!hasMore.value) return

  try {
    if (reset) {
      loadingCompanions.value = true
    }

    const result = await homeService.getRecommendCompanions({
      page: currentPage.value,
      pageSize: 10
    })

    if (result.code === 200 && result.data) {
      let list = result.data.list || result.data
      // 转换数据结构，确保有正确的服务字段
      list = list.map(item => ({
        ...item,
        onlineService: item.onlineService !== undefined ? item.onlineService : (item.serviceType === 'online' || item.serviceType === 'both'),
        offlineService: item.offlineService !== undefined ? item.offlineService : (item.serviceType === 'offline' || item.serviceType === 'both')
      }))
      if (list.length > 0) {
        const adminUsers = reset ? (await getAdminRecommendUsers()).map(u => ({
          ...u,
          onlineService: u.onlineService !== undefined ? u.onlineService : (u.serviceType === 'online' || u.serviceType === 'both'),
          offlineService: u.offlineService !== undefined ? u.offlineService : (u.serviceType === 'offline' || u.serviceType === 'both')
        })) : []
        recommendList.value = [...adminUsers, ...recommendList.value, ...list]
        currentPage.value++
        hasMore.value = list.length >= 10
      } else {
        hasMore.value = false
      }
    }
  } catch (error) {
    console.error('加载推荐失败:', error)
    console.log('使用mock数据展示推荐陪玩师')
    const adminUsers = reset ? (await getAdminRecommendUsers()).map(u => ({
      ...u,
      onlineService: u.onlineService !== undefined ? u.onlineService : (u.serviceType === 'online' || u.serviceType === 'both'),
      offlineService: u.offlineService !== undefined ? u.offlineService : (u.serviceType === 'offline' || u.serviceType === 'both')
    })) : []
    const mockData = getMockCompanions().map(u => ({
      ...u,
      onlineService: u.onlineService !== undefined ? u.onlineService : (u.serviceType === 'online' || u.serviceType === 'both'),
      offlineService: u.offlineService !== undefined ? u.offlineService : (u.serviceType === 'offline' || u.serviceType === 'both')
    }))
    recommendList.value = [...adminUsers, ...recommendList.value, ...mockData]
    hasMore.value = false
  } finally {
    loadingCompanions.value = false
    loadingMore.value = false
  }
}

const loadMoreCompanions = () => {
  if (loadingMore.value || !hasMore.value) return
  
  loadingMore.value = true
  loadRecommendCompanions(false)
}

const onBannerClick = (banner) => {
  console.log('点击Banner:', banner)
  if (banner.link) {
    router.push(banner.link)
  }
}

const refreshHomeData = async () => {
  try {
    await Promise.all([
      loadBanners(),
      loadRecommendCompanions(true)
    ])
  } catch (error) {
    console.error('刷新首页数据失败:', error)
  }
}

onMounted(async () => {
  try {
    await refreshHomeData()
  } catch (error) {
    console.error('加载首页数据失败:', error)
    loadingCompanions.value = false
  }
})

defineExpose({
  refreshHomeData
})
</script>

<style scoped>
/* --- 页面容器 --- */
.home-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: var(--bg-secondary);
  padding-top: 70px;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

/* --- 内容区 --- */
.content-container {
  width: 100%;
  max-width: 100%;
  padding: 0 12px;
  box-sizing: border-box;
  background: var(--bg-primary);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: var(--shadow-light);
}

/* --- 导航栏 --- */
.nav-bar {
  background: var(--gradient-primary);
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  height: 70px;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  box-sizing: border-box;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.9);
  height: 40px;
  flex: 1;
  cursor: pointer;
  transition: all 0.2s;
}

.search-box:hover {
  background-color: rgba(255, 255, 255, 0.25);
}

.search-icon {
  font-size: 18px;
}

.search-text {
  margin-left: 10px;
  font-size: 14px;
}

.friend-btn {
  flex: none;
  min-width: 60px;
  height: 36px;
  padding: 0 14px;
  background-color: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 18px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.friend-btn:hover {
  background-color: rgba(255, 255, 255, 0.35);
}

.friend-btn:active {
  background-color: rgba(255, 255, 255, 0.4);
  transform: scale(0.95);
}

/* --- PC 端适配 --- */
@media (min-width: 768px) {
  .home-page {
    width: 100%;
    max-width: 100%;
    margin: 0;
  }

  .nav-bar {
    left: 50%;
    transform: translateX(-50%);
    max-width: 650px;
    padding: 0 12px;
  }

  .content-container {
    max-width: 100%;
  }
}

@media (min-width: 1024px) {
  .nav-bar {
    max-width: 720px;
    padding: 0 12px;
  }
}
</style>