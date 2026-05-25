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

const bannerList = ref([
  { id: 1, title: 'Banner 1', image: 'https://picsum.photos/800/400', link: '' },
  { id: 2, title: 'Banner 2', image: 'https://picsum.photos/800/401', link: '' },
  { id: 3, title: 'Banner 3', image: 'https://picsum.photos/800/402', link: '' }
])

const recommendList = ref([])
const loadingMore = ref(false)
const loadingCompanions = ref(true)
const currentPage = ref(1)
const hasMore = ref(true)

const getAdminRecommendUsers = () => {
  try {
    const stored = localStorage.getItem('admin_recommend_users')
    if (!stored) return []
    const list = JSON.parse(stored)
    return list.map((u, idx) => ({
      userId: u.userId,
      nickName: u.nickname || '用户' + u.userId,
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
  } catch (e) {
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
      const list = result.data.list || result.data
      if (list.length > 0) {
        const adminUsers = reset ? getAdminRecommendUsers() : []
        recommendList.value = [...adminUsers, ...recommendList.value, ...list]
        currentPage.value++
        hasMore.value = list.length >= 10
      } else {
        hasMore.value = false
      }
    }
  } catch (error) {
    console.error('加载推荐失败:', error)
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
    
    const adminUsers = getAdminRecommendUsers()
    const fallbackUsers = adminUsers.length ? adminUsers : [
      { userId: 1, nickName: '小雪', avatar: 'https://picsum.photos/200/200', level: 28, tags: ['温柔', '甜音', '技术好'], price: 58, online: true, location: '北京', serviceType: 'both', vip: true, vipLevel: 2 },
      { userId: 2, nickName: '阿杰', avatar: 'https://picsum.photos/200/200', level: 35, tags: ['打野', '带飞', '幽默'], price: 65, online: true, location: '上海', serviceType: 'online', vip: true, vipLevel: 3 },
      { userId: 3, nickName: '小美', avatar: 'https://picsum.photos/200/200', level: 22, tags: ['娱乐', '聊天', '唱歌'], price: 45, online: false, location: '广州', serviceType: 'offline', vip: false },
      { userId: 4, nickName: '大飞', avatar: 'https://picsum.photos/200/200', level: 42, tags: ['技术陪', '上分', '教学'], price: 78, online: true, location: '深圳', serviceType: 'both', vip: true, vipLevel: 4 }
    ]
    recommendList.value = fallbackUsers
    loadingCompanions.value = false
  }
})

defineExpose({
  refreshHomeData
})
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 80px);
  background-color: #f5f5f5;
  padding-top: 62px;
  padding-bottom: 80px;
}

.content-container {
  background: #fff;
  margin: 12px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.nav-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  height: 50px;
  position: fixed;
  top: 0;
  left: 12px;
  right: 12px;
  z-index: 100;
  border-radius: 0 0 16px 16px;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.8);
  height: 40px;
  width: 350px;
  flex: none;
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
  width: 60px;
  height: 40px;
  padding-left: 10px;
  padding-right: 10px;
  margin-top: 0;
  margin-bottom: 0;
  margin-left: 60px;
  margin-right: 60px;
  background-color: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.friend-btn:active {
  background-color: rgba(255, 255, 255, 0.4);
  transform: scale(0.95);
}

/* PC端导航栏优化 */
@media (min-width: 768px) {
  .home-page {
    padding-top: 60px;
    padding-bottom: 20px;
    padding-left: 16px;
    padding-right: 16px;
    max-width: 650px;
    margin: 0 auto;
  }
  
  .content-container {
    margin: 0;
    margin-top: 12px;
  }
  
  .nav-bar {
    max-width: 620px;
    margin: 0 auto;
    border-radius: 0 0 16px 16px;
    padding: 12px 24px;
    height: 50px;
  }
  
  .search-box {
    width: auto;
    flex: 1;
    max-width: 420px;
    padding: 8px 18px;
    height: 36px;
  }
  
  .search-text {
    font-size: 13px;
  }
  
  .friend-btn {
    margin-left: 16px;
    margin-right: 0;
    width: auto;
    padding: 8px 16px;
    height: 36px;
  }
}

@media (min-width: 1024px) {
  .home-page {
    max-width: 720px;
  }
  
  .nav-bar {
    max-width: 720px;
  }
  
  .search-box {
    max-width: 480px;
  }
}
</style>