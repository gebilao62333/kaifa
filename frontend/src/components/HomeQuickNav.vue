<template>
  <div class="quick-nav">
    <div class="nav-grid">
      <div class="nav-item" @click="$emit('navigate', 'companion-list?type=offline')">
        <div class="nav-icon" style="background: var(--gradient-primary);">🏃</div>
        <div class="nav-text">线下陪玩</div>
      </div>
      <div class="nav-item" @click="$emit('navigate', 'companion-list?type=online')">
        <div class="nav-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">💻</div>
        <div class="nav-text">线上陪玩</div>
      </div>
      <div class="nav-item" @click="$emit('navigate', 'paidan')">
        <div class="nav-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">📋</div>
        <div class="nav-text">派单大厅</div>
      </div>
      <div class="nav-item" @click="$emit('navigate', 'publish-demand')">
        <div class="nav-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">📝</div>
        <div class="nav-text">需求发布</div>
      </div>
    </div>
  </div>
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