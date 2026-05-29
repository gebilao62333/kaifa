<template>
  <div class="priority-matching-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">优先匹配</span>
      <span class="placeholder"></span>
    </div>

    <div class="content">
      <div class="intro-card">
        <div class="intro-icon">⚡</div>
        <div class="intro-text">
          <div class="intro-title">优先匹配特权</div>
          <div class="intro-desc">VIP用户享有优先匹配权，订单将被优先推送，匹配速度更快</div>
        </div>
      </div>

      <div class="status-card">
        <div class="status-header">
          <span class="status-label">当前状态</span>
          <span class="status-badge" :class="{ active: priorityEnabled }">{{ priorityEnabled ? '已开启' : '未开启' }}</span>
        </div>
        <div class="status-body">
          <div class="status-row">
            <span class="row-label">优先队列</span>
            <span class="row-value">{{ priorityEnabled ? `第 ${queuePosition} 位` : '—' }}</span>
          </div>
          <div class="status-row">
            <span class="row-label">预计匹配时间</span>
            <span class="row-value highlight">{{ priorityEnabled ? avgMatchTime : '—' }}</span>
          </div>
          <div class="status-row">
            <span class="row-label">本月优先匹配</span>
            <span class="row-value">{{ priorityEnabled ? `${monthMatchCount} 次` : '—' }}</span>
          </div>
        </div>
      </div>

      <div class="setting-section">
        <div class="section-title">匹配设置</div>
        <div class="setting-card">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">优先推送</div>
              <div class="setting-desc">下单后优先推送给优质陪玩</div>
            </div>
            <div class="switch" :class="{ active: settings.priorityPush }" @click="toggleSetting('priorityPush')"></div>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">智能推荐</div>
              <div class="setting-desc">根据偏好智能匹配最佳陪玩</div>
            </div>
            <div class="switch" :class="{ active: settings.smartRecommend }" @click="toggleSetting('smartRecommend')"></div>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">自动接单</div>
              <div class="setting-desc">优先匹配的订单自动确认</div>
            </div>
            <div class="switch" :class="{ active: settings.autoAccept }" @click="toggleSetting('autoAccept')"></div>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">同城优先</div>
              <div class="setting-desc">优先匹配同城陪玩</div>
            </div>
            <div class="switch" :class="{ active: settings.sameCity }" @click="toggleSetting('sameCity')"></div>
          </div>
        </div>
      </div>

      <div class="stats-section">
        <div class="section-title">数据统计</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">⚡</div>
            <div class="stat-value">{{ totalPriorityOrders }}</div>
            <div class="stat-label">优先订单</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-value">{{ avgResponseTime }}s</div>
            <div class="stat-label">平均响应</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-value">{{ matchSuccessRate }}%</div>
            <div class="stat-label">匹配成功率</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-value">{{ totalMatched }}</div>
            <div class="stat-label">累计匹配</div>
          </div>
        </div>
      </div>

      <div class="vip-compare-section">
        <div class="section-title">VIP等级对比</div>
        <div class="compare-card">
          <div class="compare-item" :class="{ active: currentVipLevel >= 1 }">
            <div class="compare-left">
              <span class="compare-level">VIP1</span>
              <span class="compare-desc">优先推送，加快匹配</span>
            </div>
            <span class="compare-check">{{ currentVipLevel >= 1 ? '✓' : '' }}</span>
          </div>
          <div class="compare-item" :class="{ active: currentVipLevel >= 2 }">
            <div class="compare-left">
              <span class="compare-level">VIP2</span>
              <span class="compare-desc">智能推荐，精准匹配</span>
            </div>
            <span class="compare-check">{{ currentVipLevel >= 2 ? '✓' : '' }}</span>
          </div>
          <div class="compare-item" :class="{ active: currentVipLevel >= 3 }">
            <div class="compare-left">
              <span class="compare-level">VIP3</span>
              <span class="compare-desc">自动接单，无需等待</span>
            </div>
            <span class="compare-check">{{ currentVipLevel >= 3 ? '✓' : '' }}</span>
          </div>
          <div class="compare-item" :class="{ active: currentVipLevel >= 4 }">
            <div class="compare-left">
              <span class="compare-level">VIP4</span>
              <span class="compare-desc">同城优先 + 专属客服</span>
            </div>
            <span class="compare-check">{{ currentVipLevel >= 4 ? '✓' : '' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const currentVipLevel = ref(2)
const priorityEnabled = ref(true)
const queuePosition = ref(3)
const avgMatchTime = ref('约 30秒')
const monthMatchCount = ref(28)
const totalPriorityOrders = ref(156)
const avgResponseTime = ref(12)
const matchSuccessRate = ref(94)
const totalMatched = ref(89)

const settings = reactive({
  priorityPush: true,
  smartRecommend: true,
  autoAccept: false,
  sameCity: true
})

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('priorityMatchingSettings')
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.assign(settings, parsed)
    }
  } catch {}
}

const saveSettings = () => {
  localStorage.setItem('priorityMatchingSettings', JSON.stringify(settings))
}

const toggleSetting = (key) => {
  settings[key] = !settings[key]
  saveSettings()
}

const goBack = () => {
  router.back()
}

loadSettings()

watch(settings, saveSettings, { deep: true })
</script>

<style scoped>
.priority-matching-page {
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 70px;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 650px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 100;
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
  padding: 12px;
  max-width: 650px;
  margin: 0 auto;
}

.intro-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
}

.intro-icon {
  font-size: 40px;
  flex-shrink: 0;
}

.intro-text {
  flex: 1;
}

.intro-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.intro-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.status-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.status-label {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.status-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 10px;
  background: #f0f0f0;
  color: #999;
}

.status-badge.active {
  background: rgba(52, 199, 89, 0.1);
  color: #34c759;
}

.status-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row-label {
  font-size: 14px;
  color: #666;
}

.row-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.row-value.highlight {
  color: #34c759;
  font-weight: 600;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.setting-section {
  margin-bottom: 16px;
}

.setting-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #f5f5f5;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.setting-desc {
  font-size: 13px;
  color: #999;
}

.switch {
  width: 48px;
  height: 28px;
  background: #e5e5e5;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
  margin-left: 16px;
}

.switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.switch.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.switch.active::after {
  transform: translateX(20px);
}

.stats-section {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
}

.stat-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #999;
}

.vip-compare-section {
  margin-bottom: 16px;
}

.compare-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
}

.compare-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
  transition: all 0.2s;
}

.compare-item:last-child {
  border-bottom: none;
}

.compare-item.active {
  background: rgba(102, 126, 234, 0.04);
}

.compare-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.compare-level {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.compare-desc {
  font-size: 13px;
  color: #999;
}

.compare-check {
  font-size: 20px;
  font-weight: bold;
  color: #e5e5e5;
  width: 28px;
  text-align: center;
}

.compare-item.active .compare-check {
  color: #34c759;
}

@media (min-width: 768px) {
  .priority-matching-page {
    max-width: 650px;
    margin: 0 auto;
  }
  .header {
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
  }
}
@media (min-width: 1024px) {
  .priority-matching-page {
    max-width: 720px;
  }
  .header {
    max-width: 720px;
  }
}
</style>
