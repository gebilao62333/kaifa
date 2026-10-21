<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">优先匹配</text>
      <text class="placeholder"></text>
    </template>

    <view class="content">
      <view class="intro-card">
        <view class="intro-icon">⚡</view>
        <view class="intro-text">
          <view class="intro-title">优先匹配特权</view>
          <view class="intro-desc">VIP用户享有优先匹配权，订单将被优先推送，匹配速度更快</view>
        </view>
      </view>

      <view class="status-card">
        <view class="status-header">
          <text class="status-label">当前状态</text>
          <text class="status-badge" :class="{ active: priorityEnabled }">{{ priorityEnabled ? '已开启' : '未开启' }}</text>
        </view>
        <view class="status-body">
          <view class="status-row">
            <text class="row-label">优先队列</text>
            <text class="row-value">{{ priorityEnabled && queuePosition !== null ? `第 ${queuePosition} 位` : '—' }}</text>
          </view>
          <view class="status-row">
            <text class="row-label">预计匹配时间</text>
            <text class="row-value highlight">{{ priorityEnabled && avgMatchTime ? avgMatchTime : '—' }}</text>
          </view>
          <view class="status-row">
            <text class="row-label">本月优先匹配</text>
            <text class="row-value">{{ priorityEnabled && monthMatchCount !== null ? `${monthMatchCount} 次` : '—' }}</text>
          </view>
        </view>
      </view>

      <view class="setting-section">
        <view class="section-title">匹配设置</view>
        <view class="setting-card">
          <view class="setting-item">
            <view class="setting-info">
              <view class="setting-name">优先推送</view>
              <view class="setting-desc">下单后优先推送给优质陪玩</view>
            </view>
            <view class="switch" :class="{ active: settings.priorityPush }" @click="toggleSetting('priorityPush')"></view>
          </view>
          <view class="setting-item">
            <view class="setting-info">
              <view class="setting-name">智能推荐</view>
              <view class="setting-desc">根据偏好智能匹配最佳陪玩</view>
            </view>
            <view class="switch" :class="{ active: settings.smartRecommend }" @click="toggleSetting('smartRecommend')"></view>
          </view>
          <view class="setting-item">
            <view class="setting-info">
              <view class="setting-name">自动接单</view>
              <view class="setting-desc">优先匹配的订单自动确认</view>
            </view>
            <view class="switch" :class="{ active: settings.autoAccept }" @click="toggleSetting('autoAccept')"></view>
          </view>
          <view class="setting-item">
            <view class="setting-info">
              <view class="setting-name">同城优先</view>
              <view class="setting-desc">优先匹配同城陪玩</view>
            </view>
            <view class="switch" :class="{ active: settings.sameCity }" @click="toggleSetting('sameCity')"></view>
          </view>
        </view>
      </view>

      <view class="stats-section">
        <view class="section-title">数据统计</view>
        <view class="stats-hint">统计接入后展示，当前不展示推测数据</view>
        <view class="stats-grid">
          <view class="stat-card">
            <view class="stat-icon">⚡</view>
            <view class="stat-value">{{ totalPriorityOrders === null ? '—' : totalPriorityOrders }}</view>
            <view class="stat-label">优先订单</view>
          </view>
          <view class="stat-card">
            <view class="stat-icon">⏱️</view>
            <view class="stat-value">{{ avgResponseTime === null ? '—' : avgResponseTime + 's' }}</view>
            <view class="stat-label">平均响应</view>
          </view>
          <view class="stat-card">
            <view class="stat-icon">✅</view>
            <view class="stat-value">{{ matchSuccessRate === null ? '—' : matchSuccessRate + '%' }}</view>
            <view class="stat-label">匹配成功率</view>
          </view>
          <view class="stat-card">
            <view class="stat-icon">🏆</view>
            <view class="stat-value">{{ totalMatched === null ? '—' : totalMatched }}</view>
            <view class="stat-label">累计匹配</view>
          </view>
        </view>
      </view>

      <view class="vip-compare-section">
        <view class="section-title">VIP等级对比</view>
        <view class="compare-card">
          <view class="compare-item" :class="{ active: currentVipLevel >= 1 }">
            <view class="compare-left">
              <text class="compare-level">VIP1</text>
              <text class="compare-desc">优先推送，加快匹配</text>
            </view>
            <text class="compare-check">{{ currentVipLevel >= 1 ? '✓' : '' }}</text>
          </view>
          <view class="compare-item" :class="{ active: currentVipLevel >= 2 }">
            <view class="compare-left">
              <text class="compare-level">VIP2</text>
              <text class="compare-desc">智能推荐，精准匹配</text>
            </view>
            <text class="compare-check">{{ currentVipLevel >= 2 ? '✓' : '' }}</text>
          </view>
          <view class="compare-item" :class="{ active: currentVipLevel >= 3 }">
            <view class="compare-left">
              <text class="compare-level">VIP3</text>
              <text class="compare-desc">自动接单，无需等待</text>
            </view>
            <text class="compare-check">{{ currentVipLevel >= 3 ? '✓' : '' }}</text>
          </view>
          <view class="compare-item" :class="{ active: currentVipLevel >= 4 }">
            <view class="compare-left">
              <text class="compare-level">VIP4</text>
              <text class="compare-desc">同城优先 + 专属客服</text>
            </view>
            <text class="compare-check">{{ currentVipLevel >= 4 ? '✓' : '' }}</text>
          </view>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import userPrefService from '../services/userPrefService'
import { toast } from '../composables/useToast'
import storage from '../common/storage'
import { useUserStore } from '../store/user-info'

const router = useRouter()

// VIP 等级必须取自登录用户；此前写死 VIP2 导致未开通用户也显示已开启。
const userStore = useUserStore()
const currentVipLevel = ref(0)
// 真实统计接口尚未提供：全部保持 null，页面显示 “—”，不再编造第 3 位/30 秒/94%。
const queuePosition = ref(null)
const avgMatchTime = ref(null)
const monthMatchCount = ref(null)
const totalPriorityOrders = ref(null)
const avgResponseTime = ref(null)
const matchSuccessRate = ref(null)
const totalMatched = ref(null)

const settings = reactive({
  priorityPush: true,
  smartRecommend: true,
  autoAccept: false,
  sameCity: true
})

const priorityEnabled = computed(() => currentVipLevel.value >= 1 && (
  settings.priorityPush || settings.smartRecommend || settings.autoAccept || settings.sameCity
))

const syncVipLevel = () => {
  const profile = userStore.profile || {}
  currentVipLevel.value = Number(profile.vipLevel || profile.vipLv || profile.vip || 0) || 0
}

const loadSettings = () => {
  try {
    const saved = storage.getItem('priorityMatchingSettings')
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.assign(settings, parsed)
    }
  } catch {}
}

const saveSettings = () => {
  storage.setItem('priorityMatchingSettings', JSON.stringify(settings))
  // 优先匹配是 Lv.30 权益，服务端拒绝时必须让用户看到原因
  userPrefService.save({ priorityMatchingSettings: { ...settings } })
    .catch((e) => { if (e?.status === 422) toast.show(e.message) })
}

// 服务端回填期间抑制 watch，避免「拉取 → 覆盖本地值 → 立刻再 POST 一次」的重复写入
let hydrating = false

const loadPref = async () => {
  hydrating = true
  try {
    const res = await userPrefService.get()
    const prefs = res?.data?.data || {}
    if (prefs.priorityMatchingSettings) Object.assign(settings, prefs.priorityMatchingSettings)
  } catch (e) { /* 静默 */ }
  await nextTick()
  hydrating = false
}

onMounted(() => {
  syncVipLevel()
  loadPref()
})

const toggleSetting = (key) => {
  settings[key] = !settings[key]
}

const goBack = () => {
  router.back()
}

loadSettings()

watch(settings, () => {
  if (hydrating) return
  saveSettings()
}, { deep: true })
</script>

<style scoped>
.back-btn,
.placeholder {
  width: 40px;
  font-size: 20px;
  color: white;
  cursor: pointer;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.content {
  padding: 16px;
}

.intro-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--gradient-primary);
  border-radius: 16px;
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
  border-radius: 0px;
  padding: 20px;
  margin: 12px 0 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  border-radius: 12px;
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
  border-radius: 0px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  border-radius: 14px;
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
  background: var(--gradient-primary);
}

.switch.active::after {
  transform: translateX(20px);
}

.stats-section {
  margin-bottom: 16px;
}

.stats-hint {
  font-size: 12px;
  color: #999;
  margin: -6px 0 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-card {
  background: white;
  border-radius: 0px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  border-radius: 0px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
</style>
