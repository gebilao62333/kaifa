<template>
  <view class="quick-nav">
    <view class="nav-grid">
      <view class="nav-item" @click="$emit('navigate', 'companion-list?type=offline')">
        <view class="nav-icon" style="background: var(--gradient-primary);">🏃</view>
        <view class="nav-text">线下陪玩</view>
      </view>
      <view class="nav-item" @click="$emit('navigate', 'companion-list?type=online')">
        <view class="nav-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">💻</view>
        <view class="nav-text">线上陪玩</view>
      </view>
      <view class="nav-item" @click="$emit('navigate', 'paidan')">
        <view class="nav-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">📋</view>
        <view class="nav-text">派单大厅</view>
      </view>
      <view class="nav-item" @click="$emit('navigate', 'publish-demand')">
        <view class="nav-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">📝</view>
        <view class="nav-text">需求发布</view>
      </view>
    </view>
  </view>
</template>

<script setup>
defineEmits(['navigate'])
</script>

<style scoped>
.quick-nav {
  padding: 16px 0px;
  background-color: #fafafa;
  margin: 16px 0px;
  border-radius: 14px;
  height: 120px;
}

.nav-grid {
  display: flex;
  flex-wrap: wrap;
}

.nav-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  cursor: pointer;
}

.nav-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.nav-text {
  font-size: 12px;
  color: #333;
}

/* PC端快捷导航优化 */
@media (min-width: 768px) {
  .quick-nav {
    padding: 16px 0;
    margin: 16px 0;
    border-radius: 14px;
    height: auto;
  }
  
  .nav-item {
    padding: 6px 0;
  }
  
  .nav-icon {
    width: 50px;
    height: 50px;
    font-size: 24px;
  }
  
  .nav-text {
    font-size: 12px;
  }
}
</style>