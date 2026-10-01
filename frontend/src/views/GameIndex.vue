<template>
  <PageLayout>
    <template #nav>
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <span class="search-text">搜索游戏或陪玩师</span>
      </div>
    </template>

    <div class="category-section">
      <div class="category-list">
        <div 
          class="category-item" 
          v-for="(cat, idx) in categories" 
          :key="idx"
          :class="{ active: activeCategory === idx }"
          @click="selectCategory(idx)">
          <div class="category-icon">{{ cat.icon }}</div>
          <span class="category-name">{{ cat.name }}</span>
        </div>
      </div>
    </div>

    <div class="filter-section">
      <div class="filter-tabs">
        <div 
          class="filter-tab" 
          :class="{ active: activeFilter === 'all' }"
          @click="activeFilter = 'all'">
          全部
        </div>
        <div 
          class="filter-tab" 
          :class="{ active: activeFilter === 'hot' }"
          @click="activeFilter = 'hot'">
          热门
        </div>
        <div 
          class="filter-tab" 
          :class="{ active: activeFilter === 'new' }"
          @click="activeFilter = 'new'">
          新人
        </div>
      </div>
    </div>

    <div class="companion-list">
      <div 
        class="companion-card" 
        v-for="(item, idx) in companionList" 
        :key="idx"
        @click="goCompanionDetail(item)">
        <img class="companion-avatar" :src="item.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'" alt="" />
        <div class="online-dot" v-if="item.isOnline"></div>
        <div class="companion-info">
          <div class="name-row">
            <span class="nickname">{{ item.nickname }}</span>
            <span class="level" v-if="item.level">Lv.{{ item.level }}</span>
            <span class="vip-tag" v-if="item.vip">VIP</span>
          </div>
          <div class="tags">
            <span class="tag" v-for="(tag, tIdx) in item.tags.slice(0, 3)" :key="tIdx">{{ tag }}</span>
          </div>
          <div class="stats-row">
            <span class="stat">❤️ {{ item.likes }}</span>
            <span class="stat">🎮 {{ item.orders }}</span>
            <span class="price">{{ item.price }} 金币/小时</span>
          </div>
        </div>
        <div class="follow-btn" v-if="!item.isFollowed" @click.stop="followCompanion(item)">+ 关注</div>
      </div>

      <div class="loading-more" v-if="loading">
        <span>加载中...</span>
      </div>
      <div class="no-more" v-if="!hasMore && companionList.length">
        <span>没有更多了</span>
      </div>
    </div>

    <div class="bottom-placeholder"></div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from '../composables/useToast'
import PageLayout from '../components/PageLayout.vue'
import gamesService from '../services/gamesService'

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
          id: item.id,
          name: item.name,
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

const loadCompanionList = async (append = false) => {
  if (loading.value) return
  
  loading.value = true
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
    const list = res.data || res || []

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
    loading.value = false
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

const goCompanionDetail = (item) => {
  if (item.id) {
    router.push({ name: 'UserProfile', params: { id: item.id } })
  } else {
    toast.info('陪玩师详情功能开发中...')
  }
}

const followCompanion = async (item) => {
  try {
    item.isFollowed = true
    toast.success('关注成功')
  } catch (err) {
    toast.error('关注失败')
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

watch(activeFilter, () => {
  currentPage.value = 1
  loadCompanionList()
})

onMounted(() => {
  loadCategories()
  loadCompanionList()
  window.addEventListener('scroll', handleScroll)
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
