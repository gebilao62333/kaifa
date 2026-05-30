<template>
  <div class="online-companion-page">
    <div class="header">
      <div class="header-back" @click="goBack">‹</div>
      <div class="title">线上陪玩</div>
    </div>

    <div class="content-container">
      <!-- 游戏选择区域 -->
      <div class="game-section">
        <div class="section-title">选择游戏</div>
        <div class="game-grid">
          <div 
            class="game-card" 
            v-for="game in onlineGames" 
            :key="game.id" 
            :class="{ 'game-card-active': selectedIds.includes(game.id) }"
            @click="handleSelect(game)"
          >
            <div class="game-icon-wrap" :style="{ background: game.bgColor }">
              <span class="game-icon">{{ game.icon }}</span>
            </div>
            <div class="game-info">
              <span class="game-name">{{ game.name }}</span>
            </div>
            <div v-if="selectedIds.includes(game.id)" class="selected-check">✓</div>
          </div>
        </div>
        <div class="selection-hint" v-if="selectedIds.length > 0">
          已选择 {{ selectedIds.length }} 项游戏
        </div>
      </div>

      <!-- 陪玩师列表区域 -->
      <div class="companion-section">
        <div class="section-title">
          陪玩师列表
          <span class="count-hint" v-if="filteredCompanions.length > 0">
            ({{ filteredCompanions.length }}人)
          </span>
        </div>
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <div class="loading-text">加载中...</div>
        </div>
        <div v-else-if="filteredCompanions.length === 0" class="empty-state">
          <div class="empty-icon">👥</div>
          <div class="empty-text">暂无符合条件的陪玩师</div>
        </div>
        <div v-else class="companion-list">
          <div
            v-for="(item, index) in filteredCompanions"
            :key="index"
            class="companion-card"
            @click="goToUserProfile(item.userId)"
          >
            <div class="name-and-status">
              <div class="companion-name">{{ item.nickName }}</div>
              <span class="vip-badge-mini" v-if="item.vip">VIP{{ item.vipLevel }}</span>
            </div>
            <div class="avatar-wrapper">
              <div class="avatar-frame-inline" :class="{ vip: item.vip }">
                <img class="companion-avatar" :src="item.avatar" alt="" />
                <div class="online-status" :class="{ online: item.online, offline: !item.online }">
                  <span class="status-dot"></span>
                  <span class="status-text">{{ item.online ? '在线' : '离线' }}</span>
                </div>
              </div>
            </div>
            <div class="companion-tags">
              <span class="tag" v-for="(tag, idx) in item.tags" :key="idx">{{ tag }}</span>
            </div>
            <div class="service-tags">
              <span class="service-tag" v-for="(game, idx) in item.games" :key="idx">
                {{ game }}
              </span>
            </div>
            <div class="companion-bottom">
              <div class="companion-location">
                <span class="location-icon">📍</span>
                <span class="location-text">{{ item.location }}</span>
              </div>
              <div class="companion-price">
                <span class="price">{{ item.price }} 金币/时</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const selectedIds = ref([])
const loading = ref(true)
const companions = ref([])

const onlineGames = [
  { id: 1, name: '王者荣耀', icon: '🎮', price: 50, rating: 4.9, tags: ['打野', 'Carry'], bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 2, name: '和平精英', icon: '🔫', price: 45, rating: 4.8, tags: ['钢枪', '战术'], bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 3, name: '英雄联盟', icon: '⚔️', price: 55, rating: 4.9, tags: ['中单', '上分'], bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 4, name: '永劫无间', icon: '🗡️', price: 48, rating: 4.7, tags: ['太刀', '振刀'], bgColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 5, name: '原神', icon: '✨', price: 40, rating: 4.8, tags: ['代肝', '深渊'], bgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 6, name: 'CS2', icon: '🎯', price: 60, rating: 4.9, tags: ['突破', 'AWP'], bgColor: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' }
]

const filteredCompanions = computed(() => {
  if (selectedIds.value.length === 0) {
    return companions.value
  }
  return companions.value.filter(companion => {
    return selectedIds.value.some(selectedId => {
      const selectedGame = onlineGames.find(g => g.id === selectedId)
      return selectedGame && companion.games.includes(selectedGame.name)
    })
  })
})

const handleSelect = (game) => {
  const index = selectedIds.value.findIndex(id => id === game.id)
  if (index === -1) {
    selectedIds.value = [game.id]
  } else {
    selectedIds.value.splice(index, 1)
  }
}

const goBack = () => {
  window.history.back()
}

const goToUserProfile = (userId) => {
  router.push({ name: 'UserProfile', params: { id: userId } })
}

const loadCompanions = () => {
  loading.value = true
  setTimeout(() => {
    companions.value = [
      {
        userId: 1001,
        nickName: '王者大神小明',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=online1',
        location: '北京',
        level: 28,
        fansCount: 5200,
        price: 88,
        tags: ['技术流', '幽默', '上分快'],
        totalOrders: 1256,
        rating: 4.9,
        ratingCount: 328,
        online: true,
        serviceType: 'online',
        vip: true,
        vipLevel: 3,
        games: ['王者荣耀', '英雄联盟']
      },
      {
        userId: 1002,
        nickName: '萌妹陪玩小雪',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=online2',
        location: '上海',
        level: 16,
        fansCount: 3800,
        price: 66,
        tags: ['声音甜', '可爱', '娱乐'],
        totalOrders: 892,
        rating: 4.8,
        ratingCount: 256,
        online: true,
        serviceType: 'both',
        vip: true,
        vipLevel: 2,
        games: ['和平精英', '原神']
      },
      {
        userId: 1003,
        nickName: '战神阿杰',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=online3',
        location: '广州',
        level: 35,
        fansCount: 8600,
        price: 128,
        tags: ['职业选手', '带飞', '高效'],
        totalOrders: 3421,
        rating: 4.95,
        ratingCount: 892,
        online: true,
        serviceType: 'online',
        vip: true,
        vipLevel: 5,
        games: ['CS2', '永劫无间', '王者荣耀']
      },
      {
        userId: 1004,
        nickName: '电竞少女柚子',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=online4',
        location: '成都',
        level: 22,
        fansCount: 4500,
        price: 78,
        tags: ['全能', '颜值高', '互动好'],
        totalOrders: 1856,
        rating: 4.85,
        ratingCount: 445,
        online: true,
        serviceType: 'both',
        vip: true,
        vipLevel: 3,
        games: ['王者荣耀', '原神', '和平精英']
      },
      {
        userId: 1005,
        nickName: '打野小王子',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=online5',
        location: '深圳',
        level: 30,
        fansCount: 6200,
        price: 99,
        tags: ['野王', '节奏大师', '意识流'],
        totalOrders: 2134,
        rating: 4.9,
        ratingCount: 567,
        online: false,
        serviceType: 'online',
        vip: true,
        vipLevel: 4,
        games: ['英雄联盟', '王者荣耀']
      },
      {
        userId: 1006,
        nickName: '吃鸡小甜心',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=online6',
        location: '杭州',
        level: 18,
        fansCount: 2800,
        price: 58,
        tags: ['温柔', '聊天', '陪伴'],
        totalOrders: 678,
        rating: 4.7,
        ratingCount: 189,
        online: true,
        serviceType: 'online',
        vip: false,
        vipLevel: 0,
        games: ['和平精英', '原神']
      }
    ]
    loading.value = false
  }, 500)
}

onMounted(() => {
  loadCompanions()
})
</script>

<style scoped>
.online-companion-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  padding-top: 70px;
  padding-bottom: 80px;
  padding-bottom: calc(80px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: -webkit-linear-gradient(315deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  height: 70px;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 650px;
  z-index: 100;
}

.header-back {
  position: absolute;
  left: 20px;
  font-size: 28px;
  color: white;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  width: 40px;
  height: 40px;
  padding-left: 14px;
  padding-right: 14px;
  padding-bottom: 8px;
  margin-top: -9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: white;
}

.content-container {
  background: transparent;
  margin: 0 auto;
  max-width: 650px;
  padding: 12px;
}

.game-section {
  background: #fff;
  border-radius: 10px;
  padding: 15px 16px;
  padding-top: 15px;
  padding-bottom: 15px;
  margin-top: 26px;
  margin-bottom: 26px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.companion-section {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-hint {
  font-size: 13px;
  color: #667eea;
  font-weight: normal;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.game-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  -webkit-transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: relative;
  border: 2px solid transparent;
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

@media (max-width: 768px) {
  .game-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .game-card {
    padding: 12px 8px;
    border-radius: 12px;
  }
}

@media (max-width: 375px) {
  .game-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.game-card-active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.game-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px auto;
  flex-shrink: 0;
}

.game-icon {
  font-size: 28px;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .game-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }

  .game-icon {
    font-size: 24px;
    height: 32px;
    width: 32px;
  }

  .game-name {
    font-size: 13px;
  }
}

.game-info {
  margin-bottom: 8px;
}

.game-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: block;
  text-align: center;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
}

.selected-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.selection-hint {
  text-align: center;
  font-size: 13px;
  color: #667eea;
  padding: 12px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  margin-bottom: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  width: 100%;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  -webkit-animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@-webkit-keyframes spin {
  to {
    -webkit-transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 14px;
  color: #999;
  margin-top: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  width: 100%;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 10px;
  opacity: 0.6;
}

.empty-text {
  font-size: 14px;
  color: #999;
}

.companion-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}

.companion-card {
  width: 100%;
  background-color: #fff;
  border-radius: 10px;
  padding: 12px;
  position: relative;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
}

.companion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.name-and-status {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  width: 100%;
}

.vip-badge-mini {
  font-size: 9px;
  font-weight: 600;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: white;
  padding: 1px 6px;
  border-radius: 8px;
  line-height: 1.5;
  flex-shrink: 0;
  margin-left: auto;
}

.avatar-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.avatar-frame-inline {
  width: 100%;
  max-width: 160px;
  aspect-ratio: 1;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.avatar-frame-inline.vip {
  border: 2px solid #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.avatar-frame-inline .companion-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.online-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 10px;
  margin-bottom: 0;
  padding: 2px 8px;
  border-radius: 10px;
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 10;
}

.online-status.online {
  background-color: rgba(230, 247, 230, 0.9);
  color: #52c41a;
}

.online-status.offline {
  background-color: rgba(245, 245, 245, 0.9);
  color: #999;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  display: inline-block;
}

.online-status.online .status-dot {
  background-color: #52c41a;
}

.online-status.offline .status-dot {
  background-color: #999;
}

.companion-name {
  font-size: 14px;
  color: #333;
  font-weight: 600;
  text-align: left;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%;
}

.companion-tags {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.companion-tags .tag {
  font-size: 10px;
  color: #666;
  background-color: #f5f5f5;
  padding: 2px 8px;
  border-radius: 20px;
}

.service-tags {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.service-tags .service-tag {
  font-size: 10px;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2px 8px;
  border-radius: 20px;
}

.companion-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #f5f5f5;
}

.companion-location {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: #999;
  margin-bottom: 0;
}

.location-icon {
  font-size: 11px;
}

.companion-price .price {
  color: #ff6b6b;
  font-size: 13px;
  font-weight: bold;
}

/* PC端适配 */
@media (min-width: 768px) {
  .online-companion-page {
    padding-top: 60px;
    padding-bottom: 20px;
    padding-left: 16px;
    padding-right: 16px;
    padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
    max-width: 650px;
    margin: 0 auto;
  }

  .content-container {
    margin: 0;
    max-width: 650px;
    padding: 0;
  }

  .header {
    max-width: 650px;
    border-radius: 0 0 16px 16px;
    padding: 12px 24px;
    height: 70px;
  }

  .companion-list {
    gap: 14px;
  }

  .companion-card {
    padding: 14px;
  }
}

@media (min-width: 1024px) {
  .online-companion-page {
    max-width: 720px;
  }

  .header {
    max-width: 720px;
  }

  .content-container {
    max-width: 720px;
  }
}
</style>
