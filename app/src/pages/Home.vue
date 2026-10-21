<template>
  <PageLayout>
    <template #nav>
      <view class="search-box" @click="goSearch">
        <text class="search-icon">🔍</text>
        <text class="search-text">搜索用户、帖子、游戏</text>
      </view>
      <button class="friend-btn" @click="goFriend">交友</button>
    </template>

    <view class="content-container">
      <HomeBanner :banners="bannerList" @banner-click="onBannerClick" />
      <HomeNotice />
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
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onHide, onPageScroll, onShow, onUnload } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import { useUserStore } from '../store/user-info'
import {
  readScrollTop,
  restoreScrollTop,
  restoreTabState,
  saveScrollTop,
  saveTabState,
  setTabStateOwner
} from '../common/tabState'
import PageLayout from '../components/PageLayout.vue'
import HomeBanner from '../components/HomeBanner.vue'
import HomeNotice from '../components/HomeNotice.vue'
import HomeQuickNav from '../components/HomeQuickNav.vue'
import HomeRecommend from '../components/HomeRecommend.vue'
import homeService from '../services/homeService'
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

const userStore = useUserStore()
const TAB_STATE_PATH = '/home'
const tabOwnerId = () => userStore.profile?.userId || ''

// 主 Tab 用 reLaunch 切页会重建本页：优先恢复上次离开时的快照，避免骨架屏 + 滚动归零。
// 快照超过 30s 视为过期，列表照常先渲染，但仍静默刷新一次（见 tabState.TAB_STATE_FRESH_MS）。
const tabRestore = restoreTabState(TAB_STATE_PATH, tabOwnerId(), (snapshot) => {
  if (Array.isArray(snapshot.bannerList)) bannerList.value = snapshot.bannerList
  if (Array.isArray(snapshot.recommendList)) recommendList.value = snapshot.recommendList
  if (typeof snapshot.currentPage === 'number') currentPage.value = snapshot.currentPage
  if (typeof snapshot.hasMore === 'boolean') hasMore.value = snapshot.hasMore
  // 有快照时列表可直接渲染，不能停留在首载骨架态
  loadingCompanions.value = false
  loadingMore.value = false
})
const restoredScrollTop = tabRestore.restored ? readScrollTop(TAB_STATE_PATH) : 0
let pageScrollTop = restoredScrollTop
onPageScroll(({ scrollTop }) => {
  pageScrollTop = Number(scrollTop) || 0
})

// onHide 在 reLaunch 销毁前触发，onUnload 兜底；两者都触发时只保存一次
let tabStateSaved = false
const saveTabSnapshot = () => {
  if (tabStateSaved) return
  tabStateSaved = true
  saveTabState(TAB_STATE_PATH, {
    bannerList: bannerList.value,
    recommendList: recommendList.value,
    currentPage: currentPage.value,
    hasMore: hasMore.value
  })
  saveScrollTop(TAB_STATE_PATH, pageScrollTop)
}
onHide(saveTabSnapshot)
onUnload(saveTabSnapshot)

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

// 后端 banner.image 可能是裸文件名（如 banner1.png）、/uploads/xxx 或完整 URL。
// 裸文件名按后端静态目录 /uploads 兜底，避免被相对解析到 /pages/ 下变成 SPA HTML。
const resolveBannerImage = (image) => {
  const src = String(image || '').trim()
  if (!src) return ''
  if (/^(https?:)?\/\//i.test(src) || /^(data|blob):/i.test(src)) return src
  if (src.startsWith('/')) return src
  return '/uploads/' + src
}

const loadBanners = async () => {
  try {
    const result = await homeService.getBanners()
    if (result.code === 200 && result.data && result.data.list) {
      bannerList.value = result.data.list.map((banner) => ({
        ...banner,
        image: resolveBannerImage(banner.image)
      }))
    }
  } catch (error) {
    console.error('加载Banner失败:', error)
  }
}

const loadRecommendCompanions = async (reset = false, silent = false) => {
  if (reset) {
    currentPage.value = 1
    hasMore.value = true
    // 静默刷新（返回首页）保留旧列表，避免整页闪骨架屏
    if (!silent) {
      loadingCompanions.value = true
      recommendList.value = []
    }
    loadError.value = false
  }

  if (!hasMore.value) return

  try {
    if (reset && !silent) {
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
      // reset 时普通刷新已清空列表；静默刷新未清空，按替换而非追加
      recommendList.value = reset ? [...list] : [...recommendList.value, ...list]
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

const refreshHomeData = async (silent = false) => {
  try {
    await Promise.all([
      loadBanners(),
      loadRecommendCompanions(true, silent === true)
    ])
  } catch (error) {
    console.error('刷新首页数据失败:', error)
  }
}

// 返回首页时静默刷新（onShow），不重复首载、不闪骨架屏
const refreshOnShow = () => {
  refreshHomeData(true)
}

onMounted(async () => {
  if (tabRestore.restored) {
    // 列表已由快照渲染，等挂载后再恢复滚动位置（restoreScrollTop 内部会补两次重试）
    restoreScrollTop(restoredScrollTop)
    // 快照列表为空（上次加载失败/无数据）时不锁死空态：仍静默拉一次
    if (tabRestore.needRefresh || recommendList.value.length === 0) refreshHomeData(true)
    return
  }
  loadError.value = false
  try {
    await refreshHomeData()
  } catch (error) {
    console.error('加载首页数据失败:', error)
    recommendList.value = []
    loadingCompanions.value = false
  }
})

// 首次 onShow 由 onMounted 首载，后续 onShow（返回本页）才静默刷新
let __firstShow = true
onShow(() => {
  // 账号（含登出）变化时清空全部 Tab 缓存，避免跨账号恢复旧列表
  setTabStateOwner(tabOwnerId())
  tabStateSaved = false
  if (__firstShow) {
    __firstShow = false
    return
  }
  refreshOnShow()
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
