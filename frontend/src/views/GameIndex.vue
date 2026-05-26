<template>
  <div class="game-index-page">
    <div class="header">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <span class="search-text">搜索游戏或陪玩师</span>
      </div>
    </div>

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
        <img class="companion-avatar" :src="item.avatar" alt="" />
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const activeCategory = ref(0)
const activeFilter = ref('all')
const loading = ref(false)
const hasMore = ref(true)

const categories = ref([
  { name: '全部', icon: '🎮' },
  { name: '王者荣耀', icon: '👑' },
  { name: '和平精英', icon: '🔫' },
  { name: '英雄联盟', icon: '⚔️' },
  { name: '原神', icon: '🌠' },
  { name: '金铲铲', icon: '🏆' },
  { name: '蛋仔派对', icon: '🥚' },
  { name: '永劫无间', icon: '🗡️' }
])

const companionList = ref([])

const loadCompanionList = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  
  companionList.value = [
    {
      id: 1,
      avatar: '',
      nickname: '小雪',
      level: 28,
      vip: true,
      tags: ['技术流', '带飞', '温柔'],
      likes: 1234,
      orders: 568,
      price: 30,
      isOnline: true,
      isFollowed: false
    },
    {
      id: 2,
      avatar: '',
      nickname: '阿杰',
      level: 35,
      vip: false,
      tags: ['打野', '带躺', '幽默'],
      likes: 892,
      orders: 345,
      price: 35,
      isOnline: true,
      isFollowed: true
    },
    {
      id: 3,
      avatar: '',
      nickname: '小美',
      level: 22,
      vip: true,
      tags: ['娱乐陪', '聊天', '唱歌'],
      likes: 2341,
      orders: 892,
      price: 25,
      isOnline: false,
      isFollowed: false
    },
    {
      id: 4,
      avatar: '',
      nickname: '大飞',
      level: 42,
      vip: true,
      tags: ['技术陪', '教学', '野王'],
      likes: 5689,
      orders: 1567,
      price: 50,
      isOnline: true,
      isFollowed: false
    },
    {
      id: 5,
      avatar: '',
      nickname: '小萌',
      level: 18,
      vip: false,
      tags: ['新人', '话多', '声音甜'],
      likes: 234,
      orders: 56,
      price: 20,
      isOnline: true,
      isFollowed: false
    }
  ]
  
  loading.value = false
  hasMore.value = false
}

const selectCategory = (idx) => {
  activeCategory.value = idx
}

const goCompanionDetail = (item) => {
  console.log('陪玩师详情:', item.id)
  alert('陪玩师详情功能开发中...')
}

const followCompanion = (item) => {
  item.isFollowed = true
  console.log('关注陪玩师:', item.id)
}

onMounted(() => {
  loadCompanionList()
})
</script>

<style scoped>
.game-index-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  padding-bottom: 80px;
  padding-bottom: calc(80px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: -webkit-linear-gradient(315deg, #667eea 0%, #764ba2 100%);
  padding: 50px 20px 20px;
  padding-top: calc(50px + constant(safe-area-inset-top, 0px));
  padding-top: calc(50px + env(safe-area-inset-top, 0px));
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

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
  margin-top: -20px;
  position: relative;
  z-index: 1;
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
  color: #667eea;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.companion-list {
  padding: 16px;
}

.companion-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  gap: 12px;
  position: relative;
  cursor: pointer;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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


</style>
