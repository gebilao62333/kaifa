<template>
  <div class="user-profile">
    <div class="profile-header">
      <div class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
      </div>
      <div class="header-title">用户资料</div>
      <div class="header-placeholder"></div>
    </div>
    
    <div class="profile-content" v-if="user">
      <div class="avatar-section">
        <div class="avatar-frame" :class="{ vip: user.vip }">
          <img :src="user.avatar" class="profile-avatar" alt="" />
          <div class="online-indicator" :class="{ online: user.online, offline: !user.online }"></div>
        </div>
        <div class="user-info">
          <div class="user-name-row">
            <span class="user-name">{{ user.nickName }}</span>
            <span class="vip-badge" v-if="user.vip">VIP{{ user.vipLevel }}</span>
          </div>
          <div class="user-meta">
            <span class="user-level" v-if="user.level">Lv.{{ user.level }}</span>
            <span class="user-id" v-if="user.userId">ID: {{ user.userId }}</span>
          </div>
          <div class="user-location" v-if="user.location">
            <span class="location-icon">📍</span>
            <span>{{ user.location }}</span>
          </div>
        </div>
      </div>

      <div class="bio-section" v-if="user.bio || user.description || user.signature">
        <div class="bio-text">{{ user.bio || user.description || user.signature }}</div>
      </div>

      <!-- 扩展信息区域 -->
      <div class="info-section" v-if="user.profession || user.height">
        <div class="info-grid">
          <div class="info-item" v-if="user.profession">
            <span class="info-icon">💼</span>
            <span class="info-text">{{ user.profession }}</span>
          </div>
          <div class="info-item" v-if="user.height">
            <span class="info-icon">📏</span>
            <span class="info-text">{{ user.height }}cm</span>
          </div>
        </div>
      </div>

      <!-- 主页背景 -->
      <div class="bg-section" v-if="user.bgImage" :style="{ backgroundImage: `url(${user.bgImage})` }">
        <div class="bg-overlay">
          <span class="bg-label">主页背景</span>
        </div>
      </div>

      <div class="status-section">
        <div class="status-item">
          <span class="status-value">{{ user.followCount || 0 }}</span>
          <span class="status-label">关注</span>
        </div>
        <div class="status-divider"></div>
        <div class="status-item">
          <span class="status-value">{{ user.fansCount || 0 }}</span>
          <span class="status-label">粉丝</span>
        </div>
        <div class="status-divider"></div>
        <div class="status-item">
          <span class="status-value">{{ user.likesCount || 0 }}</span>
          <span class="status-label">获赞</span>
        </div>
        <div class="status-divider"></div>
        <div class="status-item">
          <span class="status-value">{{ user.totalOrders || 0 }}</span>
          <span class="status-label">订单</span>
        </div>
        <div class="status-divider"></div>
        <div class="status-item">
          <span class="status-value">{{ user.rating || 0 }}</span>
          <span class="status-label">评分</span>
        </div>
      </div>

      <div class="price-section" v-if="user.price">
        <div class="price-item">
          <span class="price-label">线上陪玩</span>
          <span class="price-value">¥{{ user.onlinePrice || user.price }}/小时</span>
        </div>
        <div class="price-divider"></div>
        <div class="price-item">
          <span class="price-label">线下陪玩</span>
          <span class="price-value">¥{{ user.offlinePrice || (user.price * 2) }}/小时</span>
        </div>
      </div>

      <div class="tags-section">
        <div class="section-title">个人标签</div>
        <div class="tags-list">
          <span class="tag" v-for="(tag, idx) in (user.tags || user.profileTags || [])" :key="idx">{{ tag }}</span>
          <span class="no-data" v-if="!user.tags?.length && !user.profileTags?.length">暂无标签</span>
        </div>
      </div>

      <!-- 兴趣爱好 -->
      <div class="hobbies-section" v-if="user.hobbies && user.hobbies.length">
        <div class="section-title">兴趣爱好</div>
        <div class="hobbies-list">
          <span class="hobby-tag" v-for="(hobby, idx) in user.hobbies" :key="idx">{{ hobby }}</span>
        </div>
      </div>
      
      <div class="services-section" v-if="user.games && user.games.length">
        <div class="section-title">擅长游戏</div>
        <div class="services-list">
          <span class="service-tag" v-for="(game, idx) in user.games" :key="idx">{{ game }}</span>
        </div>
      </div>
      
      <div class="services-section" v-if="user.offlineServices && user.offlineServices.length">
        <div class="section-title">线下服务</div>
        <div class="services-list">
          <span class="service-tag offline" v-for="(service, idx) in user.offlineServices" :key="idx">{{ service }}</span>
        </div>
      </div>

      <!-- 我的服务 - 线上服务 -->
      <div class="my-services-section" v-if="activeOnlineServices.length > 0">
        <div class="section-title">线上服务</div>
        <div class="services-cards">
          <div class="service-card" v-for="(service, idx) in activeOnlineServices" :key="idx">
            <div class="service-card-header">
              <span class="service-card-icon">{{ service.icon || '🎮' }}</span>
              <span class="service-card-name">{{ service.name }}</span>
              <span class="service-card-status active">已开通</span>
            </div>
            <div class="service-card-body">
              <div class="service-card-info" v-if="service.game">
                <span class="service-card-label">游戏</span>
                <span class="service-card-value">{{ service.game }}</span>
              </div>
              <div class="service-card-info">
                <span class="service-card-label">价格</span>
                <span class="service-card-value price-highlight">{{ service.price }} 金币/小时</span>
              </div>
              <div class="service-card-info" v-if="service.expiredAt">
                <span class="service-card-label">有效期</span>
                <span class="service-card-value">{{ service.expiredAt }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 我的服务 - 线下服务 -->
      <div class="my-services-section" v-if="activeOfflineServices.length > 0">
        <div class="section-title">线下服务</div>
        <div class="services-cards">
          <div class="service-card" v-for="(service, idx) in activeOfflineServices" :key="idx">
            <div class="service-card-header">
              <span class="service-card-icon">{{ service.icon || '🎮' }}</span>
              <span class="service-card-name">{{ service.name }}</span>
              <span class="service-card-status active">已开通</span>
            </div>
            <div class="service-card-body">
              <div class="service-card-info" v-if="service.game">
                <span class="service-card-label">游戏</span>
                <span class="service-card-value">{{ service.game }}</span>
              </div>
              <div class="service-card-info">
                <span class="service-card-label">价格</span>
                <span class="service-card-value price-highlight">{{ service.price }} 金币/小时</span>
              </div>
              <div class="service-card-info" v-if="service.expiredAt">
                <span class="service-card-label">有效期</span>
                <span class="service-card-value">{{ service.expiredAt }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bottom-actions">
        <div class="action-btn secondary" @click="goChat">发消息</div>
        <div class="action-btn primary" @click="goOrder">下单</div>
      </div>
    </div>
    
    <div class="loading-state" v-else>
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import gamesService from '../services/gamesService'

const route = useRoute()
const router = useRouter()

const user = ref(null)

const activeOnlineServices = computed(() => {
  return (user.value?.services || []).filter(s => s.status === 'active' && s.type === 'online')
})

const activeOfflineServices = computed(() => {
  return (user.value?.services || []).filter(s => s.status === 'active' && s.type === 'offline')
})

const goBack = () => {
  router.back()
}

const goChat = () => {
  router.push({ name: 'ChatRoom', params: { id: user.value.userId } })
}

const goOrder = () => {
  router.push({ name: 'Paidan', query: { userId: user.value.userId } })
}

const loadUserProfile = async () => {
  const userId = route.params.id
  try {
    const res = await gamesService.getCompanionDetail(userId)
    if (res.code === 200 && res.data) {
      user.value = res.data
    }
  } catch (error) {
    console.error('加载用户资料失败:', error)
    user.value = {
      userId: parseInt(userId) || 1001,
      nickName: '陪玩师' + userId,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      level: Math.floor(Math.random() * 50) + 1,
      vip: Math.random() > 0.5,
      vipLevel: Math.floor(Math.random() * 5) + 1,
      fansCount: Math.floor(Math.random() * 10000) + 500,
      totalOrders: Math.floor(Math.random() * 500) + 10,
      rating: Number((Math.random() * 10 + 40) / 10).toFixed(1),
      bio: '游戏技术流，声音好听，脾气好，带飞稳！',
      profession: '游戏主播',
      height: 170 + Math.floor(Math.random() * 20),
      location: '北京',
      price: Math.floor(Math.random() * 170) + 30,
      online: Math.random() > 0.3,
      bgImage: `https://api.dicebear.com/7.x/bottts/svg?seed=bg${userId}`,
      tags: ['技术好', '幽默', '带飞', '声音好听'],
      profileTags: ['技术流', '新手友好', '认真负责'],
      hobbies: ['游戏', '音乐', '美食', '旅行'],
      games: ['王者荣耀', '和平精英', '英雄联盟'],
      services: [
        { id: 1, name: '王者荣耀陪玩', icon: '🎮', status: 'active', type: 'online', expiredAt: '2026-12-31', game: '王者荣耀', price: 50 },
        { id: 2, name: '和平精英陪玩', icon: '🔫', status: 'active', type: 'online', expiredAt: '2026-12-31', game: '和平精英', price: 60 },
        { id: 3, name: '语音聊天服务', icon: '🎤', status: 'active', type: 'online', expiredAt: '2026-12-31', game: null, price: 30 },
        { id: 4, name: '线下陪玩', icon: '🏃', status: 'active', type: 'offline', expiredAt: '2026-12-31', game: '通用', price: 120 },
        { id: 5, name: '线下摄影服务', icon: '📸', status: 'active', type: 'offline', expiredAt: '2026-11-30', game: null, price: 200 }
      ]
    }
  }
}

onMounted(() => {
  loadUserProfile()
})
</script>

<style scoped>
.user-profile {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.back-icon {
  font-size: 20px;
  color: #333;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.header-placeholder {
  width: 36px;
}

.profile-content {
  padding: 16px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #fff;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.avatar-frame {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #eee;
}

.avatar-frame.vip {
  border-color: #ffd700;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
}

.avatar-frame {
  position: relative;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #fff;
}

.online-indicator.online {
  background-color: #00b894;
}

.online-indicator.offline {
  background-color: #dfe6e9;
}

.profile-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-level {
  font-size: 12px;
  color: #ff6b6b;
  background-color: #fff0f0;
  padding: 2px 8px;
  border-radius: 10px;
  width: fit-content;
}

.user-id {
  font-size: 12px;
  color: #999;
}

.user-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.location-icon {
  font-size: 12px;
}

.vip-badge {
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
}

.bio-section {
  background-color: #fff;
  padding: 14px 16px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.bio-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

/* 扩展信息区域 */
.info-section {
  background-color: #fff;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.info-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #f8f8f8;
  border-radius: 20px;
}

.info-icon {
  font-size: 14px;
}

.info-text {
  font-size: 13px;
  color: #666;
}

/* 主页背景 */
.bg-section {
  height: 120px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
}

.bg-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 12px;
  background: linear-gradient(transparent, rgba(0,0,0,0.5));
}

.bg-label {
  font-size: 12px;
  color: rgba(255,255,255,0.8);
}

/* 兴趣爱好 */
.hobbies-section {
  background-color: #fff;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.hobbies-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hobby-tag {
  font-size: 12px;
  color: #4a90d9;
  background-color: #e8f4fd;
  padding: 4px 12px;
  border-radius: 20px;
}

.status-section {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background-color: #fff;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 50px;
}

.status-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.status-label {
  font-size: 12px;
  color: #999;
}

.status-divider {
  width: 1px;
  height: 32px;
  background-color: #eee;
}

.price-section {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: linear-gradient(135deg, #FF6B81 0%, #E64C65 100%);
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.price-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.price-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.price-value {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.price-divider {
  width: 1px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.3);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.tags-section,
.services-section {
  background-color: #fff;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.tags-list,
.services-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  font-size: 12px;
  color: #666;
  background-color: #f5f5f5;
  padding: 4px 12px;
  border-radius: 20px;
}

.service-tag {
  font-size: 12px;
  color: #fff;
  background: linear-gradient(135deg, #FF6B81 0%, #E64C65 100%);
  padding: 4px 12px;
  border-radius: 20px;
}

.service-tag.offline {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 我的服务卡片 */
.my-services-section {
  background-color: #fff;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.services-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.service-card {
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 12px;
  background-color: #fafafa;
}

.service-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.service-card-icon {
  font-size: 20px;
}

.service-card-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.service-card-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.service-card-status.active {
  background: linear-gradient(135deg, #FF6B81 0%, #E64C65 100%);
  color: #fff;
}

.service-card-status.expired {
  background-color: #eee;
  color: #999;
}

.service-card-body {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.service-card-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.service-card-label {
  font-size: 11px;
  color: #999;
}

.service-card-value {
  font-size: 12px;
  color: #666;
}

.service-card-value.price-highlight {
  color: #ff6b6b;
  font-weight: 600;
}

.no-data {
  font-size: 12px;
  color: #999;
  padding: 4px 0;
}

.bottom-actions {
  display: flex;
  gap: 12px;
  padding: 16px;
  padding-bottom: 32px;
}

.action-btn {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.action-btn.secondary {
  background-color: #fff;
  color: #666;
  border: 1px solid #ddd;
}

.action-btn.primary {
  background: linear-gradient(135deg, #FF6B81 0%, #E64C65 100%);
  color: #fff;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #f0f0f0;
  border-top-color: #FF6B81;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: #999;
  margin-top: 12px;
}
</style>