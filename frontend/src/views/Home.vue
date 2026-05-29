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

const getMockCompanions = () => {
  return [
    {
      userId: 1001,
      nickName: '王者大神小明',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player1',
      location: '北京',
      level: 8,
      fansCount: 2580,
      gameId: 1,
      price: 88,
      tags: ['技术流', '幽默', '上分快'],
      voiceIntro: '',
      voiceDuration: 0,
      totalOrders: 1256,
      rating: 4.9,
      ratingCount: 328,
      online: true,
      serviceType: 'online',
      vip: true,
      vipLevel: 3
    },
    {
      userId: 1002,
      nickName: '萌妹陪玩小雪',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player2',
      location: '上海',
      level: 6,
      fansCount: 1890,
      gameId: 2,
      price: 66,
      tags: ['声音甜美', '可爱', '娱乐'],
      voiceIntro: '',
      voiceDuration: 0,
      totalOrders: 892,
      rating: 4.8,
      ratingCount: 256,
      online: true,
      serviceType: 'both',
      vip: true,
      vipLevel: 2
    },
    {
      userId: 1003,
      nickName: '战神阿杰',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player3',
      location: '广州',
      level: 9,
      fansCount: 5620,
      gameId: 1,
      price: 128,
      tags: ['职业选手', '带飞', '高效'],
      voiceIntro: '',
      voiceDuration: 0,
      totalOrders: 3421,
      rating: 4.95,
      ratingCount: 892,
      online: true,
      serviceType: 'online',
      vip: true,
      vipLevel: 5
    },
    {
      userId: 1004,
      nickName: '电竞少女柚子',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player4',
      location: '成都',
      level: 7,
      fansCount: 3200,
      gameId: 3,
      price: 78,
      tags: ['全能', '颜值高', '互动好'],
      voiceIntro: '',
      voiceDuration: 0,
      totalOrders: 1856,
      rating: 4.85,
      ratingCount: 445,
      online: true,
      serviceType: 'both',
      vip: true,
      vipLevel: 3
    },
    {
      userId: 1005,
      nickName: '打野小王子',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player5',
      location: '深圳',
      level: 8,
      fansCount: 4100,
      gameId: 1,
      price: 99,
      tags: ['野王', '节奏大师', '意识流'],
      voiceIntro: '',
      voiceDuration: 0,
      totalOrders: 2134,
      rating: 4.9,
      ratingCount: 567,
      online: true,
      serviceType: 'online',
      vip: true,
      vipLevel: 4
    },
    {
      userId: 1006,
      nickName: '软萌小甜心',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player6',
      location: '杭州',
      level: 5,
      fansCount: 1560,
      gameId: 4,
      price: 58,
      tags: ['温柔', '聊天', '陪伴'],
      voiceIntro: '',
      voiceDuration: 0,
      totalOrders: 678,
      rating: 4.7,
      ratingCount: 189,
      online: true,
      serviceType: 'offline',
      vip: false,
      vipLevel: 0
    }
  ]
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
    console.log('使用mock数据展示推荐陪玩师')
    const adminUsers = reset ? getAdminRecommendUsers() : []
    const mockData = getMockCompanions()
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
/* --- 页面容器 --- */
.home-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  padding-top: 70px;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

/* --- 内容区 --- */
.content-container {
  width: 100%;
  max-width: 100%;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* --- 导航栏 --- */
.nav-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0 20px;
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
  color: rgba(255, 255, 255, 0.8);
  height: 40px;
  flex: 1;
  cursor: pointer;
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

.friend-btn:active {
  background-color: rgba(255, 255, 255, 0.4);
  transform: scale(0.95);
}

/* --- PC 端适配 --- */
@media (min-width: 768px) {
  .home-page {
    max-width: 650px;
    margin: 0 auto;
  }

  .nav-bar {
    left: 50%;
    transform: translateX(-50%);
    max-width: 650px;
  }

  .content-container {
    max-width: 100%;
  }

  .search-box {
    max-width: 420px;
  }
}

@media (min-width: 1024px) {
  .home-page {
    max-width: 720px;
  }

  .nav-bar {
    max-width: 720px;
  }
}
</style>