<template>
  <div class="recommend-section">
    <div class="section-header">
      <div class="section-title">推荐陪玩师</div>
      <div class="section-more" @click="$emit('load-more')">
        {{ loadingMore ? '加载中...' : '更多' }}
      </div>
    </div>
    <div class="recommend-list">
      <div v-if="loadingCompanions" class="loading-state">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载中...</div>
      </div>
      <div
        v-for="(item, index) in companions"
        :key="index"
        class="companion-card"
        @click="$emit('user-click', item.userId)"
      >
        <div class="name-and-status">
          <div class="companion-name">{{ item.nickName }}</div>
          <span class="admin-recommend-badge" v-if="item.isAdminRecommend">推荐</span>
          <span class="vip-badge-mini" v-if="item.vip">VIP{{ item.vipLevel }}</span>
        </div>
        <div class="avatar-wrapper">
          <div class="avatar-frame-inline" :class="{ vip: item.vip }">
            <img class="companion-avatar" v-lazy="item.avatar" alt="" />
            <div class="online-status" :class="{ online: item.online, offline: !item.online }">
              <span class="status-dot"></span>
              <span class="status-text">{{ item.online ? '在线' : '离线' }}</span>
            </div>
          </div>
        </div>
        <div class="companion-tags">
          <span class="tag" v-for="(tag, idx) in item.tags" :key="idx">{{ tag }}</span>
        </div>
        <div class="service-and-level">
          <div class="companion-service">
            <span class="service-label">服务：</span>
            <span class="service-tag" v-if="item.serviceType === 'both'">线上/线下</span>
            <span class="service-tag" v-else-if="item.serviceType === 'online'">线上陪玩</span>
            <span class="service-tag" v-else-if="item.serviceType === 'offline'">线下陪玩</span>
          </div>
          <div class="companion-level" v-if="item.level">Lv.{{ item.level }}</div>
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
      <div v-if="!loadingCompanions && companions.length === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <div class="empty-text">暂无推荐陪玩师</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  companions: {
    type: Array,
    default: () => []
  },
  loadingMore: {
    type: Boolean,
    default: false
  },
  loadingCompanions: {
    type: Boolean,
    default: true
  }
})

defineEmits(['load-more', 'user-click'])
</script>

<style scoped>
.recommend-section {
  padding: 16px;
  margin-top: 10px;
  margin-bottom: 10px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  height: 30px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.section-more {
  display: flex;
  align-items: center;
  color: #999;
  font-size: 13px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  width: 100%;
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  -webkit-animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
@-webkit-keyframes spin {
  to { -webkit-transform: rotate(360deg); }
}

.loading-text {
  font-size: 13px;
  color: #999;
  margin-top: 10px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  width: 100%;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 10px;
  opacity: 0.6;
}

.empty-text {
  font-size: 14px;
  color: #999;
}

.recommend-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 0;
  width: 100%;
}

.companion-card {
  width: 100%;
  background-color: #fff;
  border-radius: 10px;
  padding: 10px;
  position: relative;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  box-sizing: border-box;
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

.admin-recommend-badge {
  font-size: 9px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 1px 6px;
  border-radius: 8px;
  line-height: 1.5;
  flex-shrink: 0;
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

.companion-level {
  background-color: #ff6b6b;
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
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
  margin-bottom: 10px;
}

.companion-tags .tag {
  font-size: 10px;
  color: #666;
  background-color: #f5f5f5;
  padding: 2px 8px;
  border-radius: 20px;
}

.service-and-level {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 4px;
}

.companion-service {
  display: flex;
  align-items: center;
  font-size: 10px;
  min-width: 0;
  overflow: hidden;
}

.companion-service .service-label {
  color: #666;
  flex-shrink: 0;
}

.companion-service .service-tag {
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.companion-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

/* PC端推荐卡片优化 */
@media (min-width: 768px) {
  .recommend-section {
    padding: 16px;
  }
  
  .section-header {
    margin-bottom: 14px;
  }
  
  .section-title {
    font-size: 16px;
  }
  
  .recommend-list {
    gap: 14px;
  }
  
  .companion-card {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }
  
  .name-and-status {
    width: 100%;
    margin-bottom: 10px;
  }
  
  .companion-name {
    font-size: 14px;
  }
  
  .avatar-frame-inline {
    width: 100%;
    height: auto;
    aspect-ratio: 1;
    max-width: 160px;
  }
  
  .avatar-frame-inline .companion-avatar {
    width: 100%;
    height: auto;
    aspect-ratio: 1;
    border-radius: 8px;
  }
  
  .companion-tags {
    margin-bottom: 10px;
    gap: 5px;
  }
  
  .companion-tags .tag {
    font-size: 11px;
    padding: 2px 8px;
  }
  
  .service-and-level {
    margin-bottom: 6px;
  }
  
  .companion-bottom {
    padding-top: 6px;
    border-top: 1px solid #f5f5f5;
  }
}
</style>