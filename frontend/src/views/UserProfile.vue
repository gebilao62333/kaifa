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
        </div>
        <div class="user-info">
          <div class="user-name">{{ user.nickName }}</div>
          <div class="user-level" v-if="user.level">Lv.{{ user.level }}</div>
        </div>
        <div class="vip-badge" v-if="user.vip">VIP{{ user.vipLevel }}</div>
      </div>
      
      <div class="status-section">
        <div class="status-item">
          <span class="status-value">{{ user.fansCount || 0 }}</span>
          <span class="status-label">粉丝</span>
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
      
      <div class="tags-section">
        <div class="section-title">标签</div>
        <div class="tags-list">
          <span class="tag" v-for="(tag, idx) in user.tags" :key="idx">{{ tag }}</span>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import gamesService from '../services/gamesService'

const route = useRoute()
const router = useRouter()

const user = ref(null)

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
      tags: ['技术好', '幽默', '带飞'],
      games: ['王者荣耀', '和平精英'],
      location: '北京',
      price: Math.floor(Math.random() * 170) + 30,
      online: Math.random() > 0.3
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

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.user-level {
  font-size: 12px;
  color: #ff6b6b;
  background-color: #fff0f0;
  padding: 2px 8px;
  border-radius: 10px;
  width: fit-content;
}

.vip-badge {
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: white;
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
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
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