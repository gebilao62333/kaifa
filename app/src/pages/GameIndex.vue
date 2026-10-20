<template>
  <PageLayout>
    <template #nav>
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <text class="search-text">搜索游戏或陪玩师</text>
      </view>
    </template>

    <view class="category-section">
      <view class="category-list">
        <view 
          class="category-item" 
          v-for="(cat, idx) in categories" 
          :key="idx"
          :class="{ active: activeCategory === idx }"
          @click="selectCategory(idx)">
          <view class="category-icon">{{ cat.icon }}</view>
          <text class="category-name">{{ cat.name }}</text>
        </view>
      </view>
    </view>

    <view class="filter-section">
      <view class="filter-tabs">
        <view 
          class="filter-tab" 
          :class="{ active: activeFilter === 'all' }"
          @click="activeFilter = 'all'">
          全部
        </view>
        <view 
          class="filter-tab" 
          :class="{ active: activeFilter === 'hot' }"
          @click="activeFilter = 'hot'">
          热门
        </view>
        <view 
          class="filter-tab" 
          :class="{ active: activeFilter === 'new' }"
          @click="activeFilter = 'new'">
          新人
        </view>
      </view>
    </view>

    <view class="companion-list">
      <view 
        class="companion-card" 
        v-for="(item, idx) in companionList" 
        :key="idx"
        @click="goCompanionDetail(item)">
        <image mode="aspectFill" class="companion-avatar" :src="item.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'" alt="" />
        <view class="online-dot" v-if="item.isOnline"></view>
        <view class="companion-info">
          <view class="name-row">
            <text class="nickname">{{ item.nickname }}</text>
            <text class="level" v-if="item.level">Lv.{{ item.level }}</text>
            <text class="vip-tag" v-if="item.vip">VIP</text>
          </view>
          <view class="tags">
            <text class="tag" v-for="(tag, tIdx) in (item.tags || []).slice(0, 3)" :key="tIdx">{{ tag }}</text>
          </view>
          <view class="stats-row">
            <text class="stat">❤️ {{ item.fansCount }}</text>
            <text class="stat">🎮 {{ item.totalOrders }}</text>
            <text class="price">{{ item.servicePrice }} 金币/小时</text>
          </view>
        </view>
        <view class="follow-btn" v-if="!item.isFollowed" @click.stop="followCompanion(item)">+ 关注</view>
      </view>

      <view class="loading-more" v-if="loading">
        <text>加载中...</text>
      </view>
      <view class="no-more" v-if="!hasMore && companionList.length">
        <text>没有更多了</text>
      </view>
    </view>

    <view class="bottom-placeholder"></view>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { onPageScroll, onReachBottom, onShow } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import { toast } from '../composables/useToast'
import PageLayout from '../components/PageLayout.vue'
import gamesService from '../services/gamesService'
import authService from '../services/authService'
import { isApp } from '../common/platform'

const router = useRouter()

const activeCategory = ref(0)
const activeFilter = ref('all')
const loading = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const pageSize = 20

const categories = ref([])

const categoryIcons = ['🎮', '👑', '🔫', '⚔️', '🌠', '🏆', '🥚', '🗡️']

const companionList = ref([])

const loadCategories = async () => {
  try {
    const res = await gamesService.getCategories()
    const list = res.data || res || []
    if (list.length > 0) {
      categories.value = [
        { id: 0, name: '全部', icon: '🎮' },
        ...list.map((item, idx) => ({
          id: item.gameId || item.id,
          name: item.gameName || item.name || '',
          icon: categoryIcons[(idx + 1) % categoryIcons.length]
        }))
      ]
    } else {
      categories.value = [
        { id: 0, name: '全部', icon: '🎮' },
        { id: 1, name: '王者荣耀', icon: '👑' },
        { id: 2, name: '和平精英', icon: '🔫' },
        { id: 3, name: '英雄联盟', icon: '⚔️' },
        { id: 4, name: '原神', icon: '🌠' },
        { id: 5, name: '金铲铲', icon: '🏆' },
        { id: 6, name: '蛋仔派对', icon: '🥚' },
        { id: 7, name: '永劫无间', icon: '🗡️' }
      ]
    }
  } catch (err) {
    console.error('加载分类失败:', err)
    categories.value = [
      { id: 0, name: '全部', icon: '🎮' },
      { id: 1, name: '王者荣耀', icon: '👑' },
      { id: 2, name: '和平精英', icon: '🔫' },
      { id: 3, name: '英雄联盟', icon: '⚔️' },
      { id: 4, name: '原神', icon: '🌠' },
      { id: 5, name: '金铲铲', icon: '🏆' },
      { id: 6, name: '蛋仔派对', icon: '🥚' },
      { id: 7, name: '永劫无间', icon: '🗡️' }
    ]
  }
}

const loadCompanionList = async (append = false, silent = false) => {
  if (loading.value) return

  // silent=true：onShow 静默刷新，不闪 loading（H5 首载/切换分类仍走原逻辑）
  if (!silent) loading.value = true
  try {
    const cat = categories.value[activeCategory.value]
    const params = {
      page: append ? currentPage.value : 1,
      pageSize,
      sort: activeFilter.value
    }
    if (cat && cat.id !== 0) {
      params.gameId = cat.id
    }

    const res = await gamesService.getCompanions(params)
    // P2-7：后端返回 { total, list }，列表项字段可能缺失；对齐旧站 GameIndex.vue 的映射（旧站 frontend/ 已删除，备份见 .e2e-run/legacy-frontend-backup-2026-10-21/），
    // 补齐默认值避免卡片昵称/等级/粉丝数等字段渲染成空白。
    const payload = (res && res.data !== undefined) ? res.data : res
    const rows = Array.isArray(payload) ? payload : (payload && Array.isArray(payload.list) ? payload.list : [])
    const list = rows.filter(Boolean).map(item => ({
      ...item,
      nickname: item.nickname || item.nickName || '',
      avatar: item.avatar || '',
      level: item.level || 1,
      tags: Array.isArray(item.tags) ? item.tags : [],
      fansCount: Number(item.fansCount) || 0,
      totalOrders: Number(item.totalOrders) || 0,
      servicePrice: Number(item.servicePrice) || 0,
      rating: Number(item.rating) || 0
    }))

    if (append) {
      companionList.value = [...companionList.value, ...list]
    } else {
      companionList.value = list
    }

    hasMore.value = list.length >= pageSize
    if (!append) currentPage.value = 1
  } catch (err) {
    console.error('加载陪玩师列表失败:', err)
    if (!append) companionList.value = []
    hasMore.value = false
  } finally {
    if (!silent) loading.value = false
    // 列表高度变化后重新测量页面总高度，App 端下一次滚动才能正确触发触底加载
    if (isApp) setTimeout(measurePageScrollHeight, 200)
  }
}

const selectCategory = (idx) => {
  if (activeCategory.value === idx) return
  activeCategory.value = idx
  currentPage.value = 1
  loadCompanionList()
}

const loadMore = () => {
  if (loading.value || !hasMore.value) return
  currentPage.value++
  loadCompanionList(true)
}

// 全部/热门/新人切换需要重新拉取（后端按 sort 排序），此前只改本地状态不重载
watch(activeFilter, () => {
  currentPage.value = 1
  loadCompanionList()
})

const goCompanionDetail = (item) => {
  const uid = Number(item.userId || item.id)
  if (uid) {
    router.push({ name: 'UserProfile', params: { id: uid } })
  } else {
    toast.info('陪玩师资料不完整')
  }
}

const followCompanion = async (item) => {
  const uid = Number(item.userId)
  if (!uid) return
  try {
    await authService.follow(uid)
    item.isFollowed = true
    toast.success('关注成功')
  } catch (err) {
    toast.error(err.message || '关注失败')
  }
}

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight

  if (scrollTop + windowHeight >= documentHeight - 200) {
    loadMore()
  }
}

// App 端页面由原生容器滚动、拿不到 document 高度：用 onPageScroll + 选择器查到的页面总高度
// 还原「触底加载」，onReachBottom 兜底；H5 继续走 window 监听，行为不变
let pageScrollHeight = 0
const measurePageScrollHeight = () => {
  try {
    uni.createSelectorQuery().selectViewport().scrollOffset((res) => {
      if (res && res.scrollHeight) pageScrollHeight = res.scrollHeight
    }).exec()
  } catch (e) { /* 查询失败时交给 onReachBottom 兜底 */ }
}

onPageScroll(({ scrollTop }) => {
  if (!isApp || !pageScrollHeight) return
  let windowHeight = 0
  try { windowHeight = uni.getSystemInfoSync().windowHeight || 0 } catch (e) {}
  if (scrollTop + windowHeight >= pageScrollHeight - 200) loadMore()
})

onReachBottom(() => {
  // 只在页面高度查询不可用（pageScrollHeight 为 0）时兜底；
  // 查询成功时滚动判定已覆盖触底，避免两个入口重复拉同一份数据
  if (isApp && !pageScrollHeight) loadMore()
})

onMounted(() => {
  loadCategories()
  loadCompanionList()
  if (!isApp) {
    window.addEventListener('scroll', handleScroll)
    return
  }
  measurePageScrollHeight()
})

onUnmounted(() => {
  if (!isApp) window.removeEventListener('scroll', handleScroll)
})

// 首次 onShow 跳过（onMounted 已首载）；从详情页返回时静默刷新列表
let __firstShow = true
onShow(() => {
  if (__firstShow) {
    __firstShow = false
    return
  }
  loadCompanionList(false, true)
})
</script>

<style scoped>
.search-box {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-icon {
  font-size: 18px;
}

.search-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.category-section {
  background: white;
  padding: 20px 0;
}

.category-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 0 16px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 0;
  border-radius: 8px;
}

.category-item.active {
  background: rgba(102, 126, 234, 0.1);
}

.category-icon {
  font-size: 32px;
}

.category-name {
  font-size: 12px;
  color: #666;
}

.category-item.active .category-name {
  color: var(--color-primary);
  font-weight: 500;
}

.filter-section {
  background: white;
  margin-top: 12px;
  padding: 16px 0;
}

.filter-tabs {
  display: flex;
  justify-content: space-around;
  padding: 0 40px;
}

.filter-tab {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.filter-tab.active {
  background: var(--gradient-primary);
  color: white;
}

.companion-list {
  padding: 16px;
}

.companion-card {
  background: white;
  border-radius: 0px;
  padding: 16px 20px;
  margin-bottom: 12px;
  display: flex;
  gap: 12px;
  position: relative;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.companion-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.online-dot {
  position: absolute;
  left: 72px;
  top: 60px;
  width: 16px;
  height: 16px;
  background: #4cd964;
  border: 3px solid white;
  border-radius: 50%;
}

.companion-info {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.nickname {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.level {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.vip-tag {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.tags {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.tag {
  background: #f5f5f5;
  color: #666;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat {
  font-size: 12px;
  color: #999;
}

.price {
  margin-left: auto;
  color: #ff6b6b;
  font-weight: bold;
  font-size: 15px;
}

.follow-btn {
  background: var(--gradient-primary);
  color: white;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 20px;
  align-self: center;
  cursor: pointer;
}

.loading-more,
.no-more {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 13px;
}

.bottom-placeholder {
  height: 1px;
}

/* PC 端游戏页优化（居中由 PageLayout 统一处理，与首页/我的页一致） */
@media (min-width: 768px) {
  .category-list {
    padding: 0 24px;
  }

  .companion-list {
    padding: 16px 24px;
  }
}

@media (min-width: 1024px) {
}
</style>
