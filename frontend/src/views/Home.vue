<template>
  <PageLayout>
    <template #nav>
      <div class="search-box" @click="goSearch">
        <span class="search-icon">🔍</span>
        <span class="search-text">搜索用户、帖子、游戏</span>
      </div>
      <button class="friend-btn" @click="goFriend">交友</button>
    </template>

    <div class="content-container">
      <HomeBanner :banners="bannerList" @banner-click="onBannerClick" />
      <HomeQuickNav @navigate="handleNavigate" />
      <HomeRecommend
        :companions="recommendList"
        :loading-more="loadingMore"
        :loading-companions="loadingCompanions"
        :error="loadError"
        @load-more="loadMoreCompanions"
        @user-click="goUserProfile"
        @retry="refreshHomeData"
      />
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '../components/PageLayout.vue'
import HomeBanner from '../components/HomeBanner.vue'
import HomeQuickNav from '../components/HomeQuickNav.vue'
import HomeRecommend from '../components/HomeRecommend.vue'
import homeService from '../services/homeService'
import { toast } from '../composables/useToast'
import { genCover } from '../utils/placeholder'

const router = useRouter()

const bannerList = ref([
  { id: 1, title: 'Banner 1', image: genCover('banner-1'), link: '' },
  { id: 2, title: 'Banner 2', image: genCover('banner-2'), link: '' },
  { id: 3, title: 'Banner 3', image: genCover('banner-3'), link: '' }
])

const recommendList = ref([])
const loadingMore = ref(false)
const loadingCompanions = ref(true)
const loadError = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)

// 推荐列表全部来自后端 /api/games/companions 接口，不再读取管理端 localStorage 兜底数据
const goSearch = () => {
  router.push('/search')
}

const goFriend = () => {
  router.push({ name: 'Friend' })
}

const goUserProfile = (userId) => {
  router.push({ name: 'UserProfile', params: { id: userId } })
}

const handleNavigate = (payload) => {
  if (payload && typeof payload === 'object' && payload.path) {
    router.push(payload)
    return
  }
  const str = String(payload)
  // 已带 query 字符串（如 'companion-list?type=online'）直接跳转
  if (str.includes('?')) {
    router.push(str)
  } else {
    router.push(`/${str}`)
  }
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
    loadError.value = false
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

    // 兼容后端成功码 200 / 0，避免仅判断 ===200 漏掉有效数据
    const isSuccess = result && (result.code === 200 || result.code === 0)
    if (!isSuccess) {
      throw new Error(result && result.message ? result.message : '数据加载失败')
    }

    const list = (result.data && (result.data.list || result.data)) || []

    if (list.length > 0) {
      recommendList.value = [...recommendList.value, ...list]
      currentPage.value++
      hasMore.value = list.length >= 10
    } else if (reset) {
      recommendList.value = []
      hasMore.value = false
    } else {
      hasMore.value = false
    }
  } catch (error) {
    console.error('加载推荐失败:', error)
    if (reset) {
      loadError.value = recommendList.value.length === 0
    }
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
  if (import.meta.env.DEV) console.log('点击Banner:', banner)
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
  loadError.value = false
  try {
    await refreshHomeData()
  } catch (error) {
    console.error('加载首页数据失败:', error)
    recommendList.value = []
    loadingCompanions.value = false
  }
})

defineExpose({
  refreshHomeData
})
</script>

<style scoped>
.content-container {
  background: #fff;
  margin: 12px 0 0;
  padding: 20px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.search-box {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.8);
  height: 40px;
}

.search-icon {
  font-size: 18px;
}

.search-text {
  margin-left: 10px;
  font-size: 14px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.friend-btn {
  flex: none;
  width: 60px;
  height: 40px;
  padding-left: 10px;
  padding-right: 10px;
  margin: 0;
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

/* PC 端内容卡片与导航栏内元素的微调（居中由 PageLayout 统一处理） */
@media (min-width: 768px) {
  .content-container {
    padding: 20px 24px;
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
  .search-box {
    max-width: 480px;
  }
}
</style>
