<template>
  <div class="level-acceleration-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">等级加速</span>
      <span class="placeholder"></span>
    </div>

    <div class="content">
      <div class="level-card">
        <div class="level-badge">
          <div class="level-icon">🚀</div>
          <div class="level-number">Lv.{{ userInfo.level }}</div>
          <div class="level-name">{{ levelName }}</div>
        </div>
        <div class="exp-section">
          <div class="exp-header">
            <span class="exp-label">经验值</span>
            <span class="exp-value">{{ userInfo.exp }} / {{ nextLevelExp }}</span>
          </div>
          <div class="exp-bar">
            <div class="exp-progress" :style="{ width: expPercent + '%' }"></div>
          </div>
          <div class="exp-hint">距离升到 Lv.{{ userInfo.level + 1 }} 还差 {{ nextLevelExp - userInfo.exp }} 经验</div>
        </div>
      </div>

      <div class="vip-boost-card">
        <div class="boost-header">
          <span class="boost-icon">⚡</span>
          <span class="boost-title">VIP加速效果</span>
        </div>
        <div class="boost-list">
          <div class="boost-item" v-for="b in boostList" :key="b.level">
            <div class="boost-level">{{ b.label }}</div>
            <div class="boost-bar-bg">
              <div class="boost-bar" :class="b.active ? 'active' : ''" :style="{ width: b.active ? '100%' : '0%' }"></div>
            </div>
            <div class="boost-multiplier" :class="{ active: b.active }">{{ b.multiplier }}x</div>
          </div>
        </div>
        <div class="boost-desc" v-if="userInfo.vip">
          当前为 VIP{{ userInfo.vipLevel }}，获得 <strong>{{ currentBoost }}x</strong> 经验加速
        </div>
        <div class="boost-desc" v-else>
          开通VIP可享最高 <strong>2.0x</strong> 经验加速
        </div>
      </div>

      <div class="benefits-section">
        <div class="section-title">等级权益</div>
        <div class="benefits-list">
          <div class="benefit-item" v-for="b in benefitList" :key="b.level">
            <div class="benefit-left">
              <span class="benefit-level-tag" :class="{ unlocked: b.level <= userInfo.level }">Lv.{{ b.level }}</span>
              <span class="benefit-name">{{ b.name }}</span>
            </div>
            <span class="benefit-status" :class="{ unlocked: b.level <= userInfo.level }">
              {{ b.level <= userInfo.level ? '已解锁' : '未解锁' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getLevelName } from '../common/common'

const router = useRouter()

const userInfo = ref({
  level: 15,
  exp: 7200,
  vip: true,
  vipLevel: 2
})

const nextLevelExp = computed(() => userInfo.value.level * 1000 + 500)

const expPercent = computed(() => {
  return Math.min(100, Math.round((userInfo.value.exp / nextLevelExp.value) * 100))
})

const levelName = computed(() => getLevelName(userInfo.value.level))

const currentBoost = computed(() => {
  if (!userInfo.value.vip) return 1.0
  const map = { 1: 1.2, 2: 1.5, 3: 1.8, 4: 2.0 }
  return map[userInfo.value.vipLevel] || 1.0
})

const boostList = ref([
  { level: 0, label: '普通用户', multiplier: 1.0, active: false },
  { level: 1, label: 'VIP1', multiplier: 1.2, active: false },
  { level: 2, label: 'VIP2', multiplier: 1.5, active: false },
  { level: 3, label: 'VIP3', multiplier: 1.8, active: false },
  { level: 4, label: 'VIP4', multiplier: 2.0, active: false }
])

const benefitList = ref([
  { level: 5, name: '解锁个性签名' },
  { level: 10, name: '解锁在线状态隐身' },
  { level: 15, name: '解锁动态发布图片' },
  { level: 20, name: '解锁专属身份标识' },
  { level: 25, name: '解锁相册扩容至50张' },
  { level: 30, name: '解锁优先匹配' },
  { level: 35, name: '解锁超级弹窗' },
  { level: 40, name: '解锁客服优先接入' },
  { level: 45, name: '解锁装扮商城' },
  { level: 50, name: '解锁全服广播特权' }
])

const goBack = () => {
  router.back()
}

onMounted(() => {
  if (userInfo.value.vip) {
    boostList.value.forEach(b => {
      if (b.level > 0 && b.level <= userInfo.value.vipLevel) {
        b.active = true
      }
    })
  }
})
</script>

<style scoped>
.level-acceleration-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.back-btn,
.placeholder {
  width: 40px;
  font-size: 20px;
  color: white;
  cursor: pointer;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.content {
  padding: 16px;
}

.level-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  padding: 24px;
  margin-bottom: 16px;
}

.level-badge {
  text-align: center;
  margin-bottom: 20px;
}

.level-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.level-number {
  font-size: 36px;
  font-weight: bold;
  color: white;
  margin-bottom: 4px;
}

.level-name {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.exp-section {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 16px;
}

.exp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.exp-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.exp-value {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.exp-bar {
  height: 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 8px;
}

.exp-progress {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ff8c00);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.exp-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
}

.vip-boost-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
}

.boost-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.boost-icon {
  font-size: 22px;
}

.boost-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.boost-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.boost-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.boost-level {
  width: 72px;
  font-size: 14px;
  color: #666;
  flex-shrink: 0;
}

.boost-bar-bg {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.boost-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
  background: #e5e5e5;
}

.boost-bar.active {
  background: linear-gradient(90deg, #ffd700, #ff8c00);
}

.boost-multiplier {
  width: 36px;
  font-size: 14px;
  font-weight: 600;
  color: #ccc;
  text-align: right;
  flex-shrink: 0;
}

.boost-multiplier.active {
  color: #ff8c00;
}

.boost-desc {
  font-size: 13px;
  color: #999;
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.boost-desc strong {
  color: #ff8c00;
  font-size: 15px;
}

.benefits-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding: 0 4px;
}

.benefits-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.benefit-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f5f5f5;
}

.benefit-item:last-child {
  border-bottom: none;
}

.benefit-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.benefit-level-tag {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 10px;
  background: #f0f0f0;
  color: #999;
}

.benefit-level-tag.unlocked {
  background: linear-gradient(135deg, #667eea20, #764ba220);
  color: #667eea;
}

.benefit-name {
  font-size: 14px;
  color: #333;
}

.benefit-status {
  font-size: 12px;
  color: #ccc;
}

.benefit-status.unlocked {
  color: #34c759;
}
</style>
