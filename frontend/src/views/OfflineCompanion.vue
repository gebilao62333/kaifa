<template>
  <div class="offline-companion-page">
    <div class="header">
      <div class="header-back" @click="goBack">‹</div>
      <div class="title">线下陪玩</div>
    </div>

    <div class="content-container">
      <!-- 服务选择区域 -->
      <div class="service-section">
        <div class="section-title">选择服务</div>
        <div class="offline-grid">
          <div 
            class="offline-card" 
            v-for="item in offlineServices" 
            :key="item.id" 
            :class="{ 'offline-card-active': selectedIds.includes(item.id) }"
            @click="handleSelect(item)"
          >
            <div class="offline-icon-wrap" :style="{ background: item.bgColor }">
              <span class="offline-icon">{{ item.icon }}</span>
            </div>
            <div class="offline-info">
              <span class="offline-name">{{ item.name }}</span>
            </div>
            <div v-if="selectedIds.includes(item.id)" class="selected-check">✓</div>
          </div>
        </div>
        <div class="selection-hint" v-if="selectedIds.length > 0">
          已选择服务：{{ offlineServices.find(s => s.id === selectedIds[0])?.name }}
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
              <span class="service-tag" v-for="(service, idx) in item.offlineServices" :key="idx">
                {{ service }}
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

const offlineActivities = [
  { id: 201, name: '逛街购物', icon: '🛍️', price: 150, desc: '陪同逛街购物', bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 202, name: '看电影', icon: '🎬', price: 200, desc: '陪同观看电影', bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 203, name: '美食探店', icon: '🍽️', price: 180, desc: '陪同品尝美食', bgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 204, name: '密室逃脱', icon: '🔐', price: 160, desc: '组队密室挑战', bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }
]

const sportsActivities = [
  { id: 301, name: '运动健身', icon: '💪', price: 120, desc: '陪同健身指导', bgColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 302, name: '羽毛球', icon: '🏸', price: 100, desc: '双人羽毛球对打', bgColor: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { id: 303, name: '跑步陪练', icon: '🏃', price: 80, desc: '户外跑步陪伴', bgColor: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { id: 304, name: '篮球', icon: '🏀', price: 150, desc: '组队篮球比赛', bgColor: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }
]

const offlineServices = computed(() => {
  return [...offlineActivities, ...sportsActivities]
})

const filteredCompanions = computed(() => {
  if (selectedIds.value.length === 0) {
    return companions.value
  }
  return companions.value.filter(companion => {
    return selectedIds.value.some(selectedId => {
      const selectedService = offlineServices.value.find(s => s.id === selectedId)
      return selectedService && companion.offlineServices.includes(selectedService.name)
    })
  })
})

const handleSelect = (item) => {
  const index = selectedIds.value.findIndex(id => id === item.id)
  if (index === -1) {
    // 如果没有选中，则只保留当前选中的这一个
    selectedIds.value = [item.id]
  } else {
    // 如果已经选中，则取消选择
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
        nickName: '可爱小雪',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=offline1',
        location: '北京',
        level: 12,
        fansCount: 3200,
        price: 120,
        tags: ['活泼开朗', '会拍照', '穿搭达人'],
        voiceIntro: '',
        voiceDuration: 0,
        totalOrders: 156,
        rating: 4.9,
        ratingCount: 89,
        online: true,
        serviceType: 'offline',
        vip: true,
        vipLevel: 3,
        offlineServices: ['逛街购物', '看电影', '美食探店']
      },
      {
        userId: 1002,
        nickName: '运动达人阿杰',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=offline2',
        location: '上海',
        level: 15,
        fansCount: 4500,
        price: 150,
        tags: ['健身教练', '篮球健将', '阳光开朗'],
        voiceIntro: '',
        voiceDuration: 0,
        totalOrders: 234,
        rating: 4.8,
        ratingCount: 156,
        online: true,
        serviceType: 'both',
        vip: true,
        vipLevel: 2,
        offlineServices: ['运动健身', '篮球', '跑步陪练']
      },
      {
        userId: 1003,
        nickName: '密室爱好者小美',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=offline3',
        location: '广州',
        level: 10,
        fansCount: 2100,
        price: 100,
        tags: ['逻辑思维强', '幽默搞笑', '团队协作'],
        voiceIntro: '',
        voiceDuration: 0,
        totalOrders: 98,
        rating: 4.9,
        ratingCount: 67,
        online: false,
        serviceType: 'offline',
        vip: false,
        vipLevel: 0,
        offlineServices: ['密室逃脱', '看电影']
      },
      {
        userId: 1004,
        nickName: '羽毛球选手小林',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=offline4',
        location: '深圳',
        level: 14,
        fansCount: 3800,
        price: 130,
        tags: ['专业羽毛球', '耐心指导', '运动达人'],
        voiceIntro: '',
        voiceDuration: 0,
        totalOrders: 189,
        rating: 4.85,
        ratingCount: 123,
        online: true,
        serviceType: 'offline',
        vip: true,
        vipLevel: 1,
        offlineServices: ['羽毛球', '运动健身', '跑步陪练']
      },
      {
        userId: 1005,
        nickName: '美食博主小琪',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=offline5',
        location: '杭州',
        level: 11,
        fansCount: 5200,
        price: 140,
        tags: ['美食达人', '会拍照', '开朗健谈'],
        voiceIntro: '',
        voiceDuration: 0,
        totalOrders: 312,
        rating: 4.95,
        ratingCount: 201,
        online: true,
        serviceType: 'both',
        vip: true,
        vipLevel: 3,
        offlineServices: ['美食探店', '逛街购物']
      },
      {
        userId: 1006,
        nickName: '观影达人阿明',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=offline6',
        location: '成都',
        level: 9,
        fansCount: 1800,
        price: 90,
        tags: ['电影爱好者', '影评达人', '温和有礼'],
        voiceIntro: '',
        voiceDuration: 0,
        totalOrders: 76,
        rating: 4.7,
        ratingCount: 45,
        online: false,
        serviceType: 'offline',
        vip: false,
        vipLevel: 0,
        offlineServices: ['看电影', '美食探店']
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
.offline-companion-page {
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
  padding-left: 15px;
  margin-top: -13px;
  height: 40px;
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

.service-section {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  margin-top: 26px;
  margin-bottom: 12px;
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

.offline-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.offline-card {
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
  .offline-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .offline-card {
    padding: 12px 8px;
    border-radius: 12px;
  }
}

@media (max-width: 375px) {
  .offline-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}

.offline-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.offline-card-active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.offline-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px auto;
  flex-shrink: 0;
}

.offline-icon {
  font-size: 28px;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .offline-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }

  .offline-icon {
    font-size: 24px;
    height: 32px;
    width: 32px;
  }

  .offline-name {
    font-size: 13px;
  }
}

.offline-info {
  margin-bottom: 8px;
}

.offline-name {
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
  .offline-companion-page {
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
  .offline-companion-page {
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
