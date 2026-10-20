<template>
  <view class="recommend-section">
    <view class="section-header">
      <view class="section-title">推荐陪玩师</view>
      <view class="section-more" @click="$emit('load-more')">
        {{ loadingMore ? '加载中...' : '更多' }}
      </view>
    </view>
    <view class="recommend-list">
      <view v-if="loadingCompanions" class="loading-state">
        <view class="loading-spinner"></view>
        <view class="loading-text">加载中...</view>
      </view>
      <view
        v-for="(item, index) in companions"
        :key="index"
        class="companion-card"
        @click="$emit('user-click', item.userId)"
      >
        <view class="name-and-status">
          <view class="companion-name">{{ item.nickName }}</view>
          <text class="admin-recommend-badge" v-if="item.isAdminRecommend">推荐</text>
          <text class="vip-badge-mini" v-if="item.vip">VIP{{ item.vipLevel }}</text>
          <view class="online-status" :class="{ online: item.online, offline: !item.online }">
            <text class="status-dot"></text>
            <text class="status-text">{{ item.online ? '在线' : '离线' }}</text>
          </view>
        </view>
        <view class="avatar-wrapper">
          <view class="avatar-frame-inline" :class="{ vip: item.vip }">
            <image mode="aspectFill" class="companion-avatar" :src="item.avatar" />
          </view>
        </view>
        <view class="companion-tags">
          <text class="tag" v-for="(tag, idx) in item.tags" :key="idx">{{ tag }}</text>
        </view>
        <view class="service-and-level">
          <view class="companion-service">
            <text class="service-label">服务：</text>
            <text class="service-tag" v-if="item.serviceType === 'both'">线上/线下</text>
            <text class="service-tag" v-else-if="item.serviceType === 'online'">线上陪玩</text>
            <text class="service-tag" v-else-if="item.serviceType === 'offline'">线下陪玩</text>
          </view>
          <view class="companion-level" v-if="item.level">Lv.{{ item.level }}</view>
        </view>
        <view class="companion-bottom">
          <view class="companion-location">
            <text class="location-icon">📍</text>
            <text class="location-text">{{ item.location }}</text>
          </view>
          <view class="companion-price">
            <text class="price">{{ item.price }} 金币/时</text>
          </view>
        </view>
      </view>
      <view v-if="!loadingCompanions && companions.length === 0 && !error" class="empty-state">
        <view class="empty-icon">👥</view>
        <view class="empty-text">暂无推荐陪玩师</view>
      </view>
      <view v-if="!loadingCompanions && companions.length === 0 && error" class="error-state">
        <view class="error-icon">⚠️</view>
        <view class="error-text">加载失败，请稍后重试</view>
        <button class="retry-btn" @click="$emit('retry')">重新加载</button>
      </view>
    </view>
  </view>
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
  },
  error: {
    type: Boolean,
    default: false
  }
})

defineEmits(['load-more', 'user-click', 'retry'])
</script>

<style scoped>
.recommend-section {
  padding: 0;
  margin-top: 4px;
  border-radius: 4px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  height: 35px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.section-more {
  display: flex;
  align-items: center;
  color: #999;
  font-size: 14px;
  cursor: pointer;
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
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top-color: var(--color-primary);
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  width: 100%;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.6;
}

.empty-text {
  font-size: 14px;
  color: #999;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  width: 100%;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.6;
}

.error-text {
  font-size: 14px;
  color: #999;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 8px 24px;
  border: none;
  border-radius: 20px;
  background: var(--gradient-primary);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.recommend-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0;
}

.companion-card {
  width: calc(50% - 6px);
  background-color: #fafafa;
  border-radius: 14px;
  padding: 14px;
  position: relative;
  text-align: center;
  cursor: pointer;
  box-sizing: border-box;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.companion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.name-and-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 20px;
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
}

.admin-recommend-badge {
  font-size: 9px;
  font-weight: 600;
  background: var(--gradient-primary);
  color: white;
  padding: 1px 6px;
  border-radius: 8px;
  line-height: 1.5;
  flex-shrink: 0;
}

.name-and-status .online-status {
  margin-left: auto;
}

.avatar-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.avatar-frame-inline {
  width: 180px;
  height: 180px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.avatar-frame-inline.vip {
  border: 3px solid #ffd700;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
}

.avatar-frame-inline .companion-avatar {
  width: 168px;
  height: 168px;
  border-radius: 8px;
  object-fit: cover;
}

.companion-level {
  background-color: #ff6b6b;
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
}

.online-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  margin-bottom: 0;
  padding: 2px 10px;
  border-radius: 20px;
  height: 22px;
  white-space: nowrap;
}

.online-status.online {
  background-color: #e6f7e6;
  color: #52c41a;
}

.online-status.offline {
  background-color: #f5f5f5;
  color: #999;
}

.status-dot {
  width: 6px;
  height: 6px;
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
  font-size: 15px;
  color: #333;
  margin-bottom: -1px;
  margin-top: -1px;
  font-weight: 600;
  text-align: left;
  flex-shrink: 0;
}

.companion-tags {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.companion-tags .tag {
  font-size: 11px;
  color: #666;
  background-color: #f5f5f5;
  padding: 3px 10px;
  border-radius: 20px;
}

.service-and-level {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.companion-service {
  display: flex;
  align-items: center;
  font-size: 11px;
}

.companion-service .service-label {
  color: #666;
}

.companion-service .service-tag {
  color: #fff;
  background: var(--gradient-primary);
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
}

.companion-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.companion-location {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #999;
  margin-bottom: 0;
}

.location-icon {
  font-size: 11px;
}

.companion-price .price {
  color: #ff6b6b;
  font-size: 14px;
  font-weight: bold;
}

/* PC端推荐卡片优化 */
@media (min-width: 768px) {
  .recommend-section {
    padding: 0;
  }
  
  .section-header {
    margin-bottom: 14px;
  }
  
  .section-title {
    font-size: 16px;
  }
  
  .recommend-list {
    gap: 14px;
    padding: 0;
  }
  
  .companion-card {
    width: calc(50% - 7px);
    padding: 14px;
    border-radius: 14px;
    background: #fafafa;
    box-shadow: none;
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
    border-radius: 10px;
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