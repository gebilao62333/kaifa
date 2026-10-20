<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">等级加速</text>
      <text class="placeholder"></text>
    </template>

    <view class="content">
      <view class="level-card">
        <view class="level-badge">
          <view class="level-icon">🚀</view>
          <view class="level-number">Lv.{{ info.lv }}</view>
          <view class="level-name">{{ levelName }}</view>
        </view>
        <view class="exp-section">
          <view class="exp-header">
            <text class="exp-label">经验值</text>
            <text class="exp-value">{{ info.exp }} / {{ info.nextLevelExp }}</text>
          </view>
          <view class="exp-bar">
            <view class="exp-progress" :style="{ width: info.percent + '%' }"></view>
          </view>
          <view class="exp-hint">距离升到 Lv.{{ info.lv + 1 }} 还差 {{ info.remainExp }} 经验</view>
        </view>
        <button
          class="check-in-btn"
          :disabled="info.checkedInToday || checking"
          @click="onCheckIn"
        >{{ checkInLabel }}</button>
      </view>

      <view class="vip-boost-card">
        <view class="boost-header">
          <text class="boost-icon">⚡</text>
          <text class="boost-title">VIP加速效果</text>
        </view>
        <view class="boost-list">
          <view class="boost-item" v-for="b in boostList" :key="b.level">
            <view class="boost-level">{{ b.label }}</view>
            <view class="boost-bar-bg">
              <view class="boost-bar" :class="b.active ? 'active' : ''" :style="{ width: b.active ? '100%' : '0%' }"></view>
            </view>
            <view class="boost-multiplier" :class="{ active: b.active }">{{ b.multiplier }}x</view>
          </view>
        </view>
        <view class="boost-desc" v-if="info.vip">
          当前为 VIP{{ info.vipLevel }}，获得 <strong>{{ info.boost }}x</strong> 经验加速
        </view>
        <view class="boost-desc" v-else>
          开通VIP可享最高 <strong>{{ maxBoost }}x</strong> 经验加速
        </view>
      </view>

      <view class="source-section">
        <view class="section-title">经验怎么涨</view>
        <view class="source-list">
          <view class="source-item" v-for="s in expSourceList" :key="s.key">
            <text class="source-name">{{ s.name }}</text>
            <text class="source-value">+{{ s.points }}</text>
          </view>
        </view>
        <view class="source-hint">实际到账 = 上表点数 × 当前倍率 {{ info.boost }}x</view>
      </view>

      <view class="benefits-section">
        <view class="section-title">等级权益</view>
        <view class="benefits-list">
          <view class="benefit-item" v-for="b in info.benefits" :key="b.key">
            <view class="benefit-left">
              <text class="benefit-level-tag" :class="{ unlocked: b.unlocked }">Lv.{{ b.level }}</text>
              <text class="benefit-name">{{ b.name }}</text>
            </view>
            <text class="benefit-status" :class="{ unlocked: b.unlocked }">
              {{ b.unlocked ? '已解锁' : '未解锁' }}
            </text>
          </view>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import { getLevelName } from '../common/common'
import PageLayout from '../components/PageLayout.vue'
import levelService from '../services/levelService'
import { toast } from '../composables/useToast'

const router = useRouter()

// 经验来源/倍率的服务端口径，这里只负责翻译成中文展示名
const SOURCE_NAMES = {
  order_completed: '完成陪玩订单',
  post_created: '发布动态',
  daily_check_in: '每日签到',
  real_name_verified: '完成实名认证'
}
const BOOST_NAMES = ['普通用户', 'VIP1', 'VIP2', 'VIP3', 'VIP4']

const info = ref({
  lv: 1,
  exp: 0,
  nextLevelExp: 1500,
  remainExp: 1500,
  percent: 0,
  vip: false,
  vipLevel: 0,
  boost: 1,
  checkedInToday: false,
  expSources: {},
  boostTable: {},
  benefits: []
})
const checking = ref(false)

const levelName = computed(() => getLevelName(info.value.lv))

const maxBoost = computed(() => {
  const values = Object.values(info.value.boostTable || {})
  return values.length ? Math.max(...values) : 1
})

const boostList = computed(() => Object.entries(info.value.boostTable || {}).map(([lv, multiplier]) => ({
  level: Number(lv),
  label: BOOST_NAMES[Number(lv)] || `VIP${lv}`,
  multiplier,
  active: Number(lv) > 0 && info.value.vip && info.value.vipLevel >= Number(lv)
})))

const expSourceList = computed(() => Object.entries(info.value.expSources || {}).map(([key, points]) => ({
  key,
  name: SOURCE_NAMES[key] || key,
  points
})))

const checkInLabel = computed(() => {
  if (info.value.checkedInToday) return '今日已签到'
  const points = info.value.expSources?.daily_check_in
  if (checking.value) return '签到中…'
  return points ? `每日签到 +${points}` : '每日签到'
})

const load = async () => {
  try {
    const res = await levelService.get()
    info.value = { ...info.value, ...(res?.data || {}) }
  } catch (e) {
    toast.show(e.message || '等级信息加载失败')
  }
}

const onCheckIn = async () => {
  if (checking.value || info.value.checkedInToday) return
  checking.value = true
  try {
    const result = await levelService.checkIn()
    const gained = result?.data || {}
    toast.success(gained.leveledUp
      ? `签到成功，升到 Lv.${gained.lv}！`
      : `签到成功，经验 +${gained.added}`)
    await load()
  } catch (e) {
    toast.show(e.message || '签到失败')
    // 多设备同日签到：服务端已记录时同步一次真实状态，按钮别停在可点
    if (e.message === '今日已签到') await load()
  } finally {
    checking.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(load)

// 从订单/动态等页返回后经验值可能已增加，静默重拉等级信息
const refreshOnShow = () => {
  load()
}

// 首次 onShow 由 onMounted 首载，后续 onShow（返回本页）才静默刷新
let __firstShow = true
onShow(() => {
  if (__firstShow) {
    __firstShow = false
    return
  }
  refreshOnShow()
})
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

.level-card {
  background: var(--gradient-primary);
  border-radius: 16px;
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
  border-radius: 0px;
  padding: 20px;
  margin: 12px 0 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  border-radius: 0px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  color: var(--color-primary);
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

.check-in-btn {
  width: 100%;
  margin-top: 14px;
  padding: 11px 0;
  border: none;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-primary);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.check-in-btn:disabled {
  background: rgba(255, 255, 255, 0.35);
  color: rgba(255, 255, 255, 0.8);
  cursor: default;
}

.source-section {
  margin-bottom: 16px;
}

.source-list {
  background: white;
  border-radius: 0px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.source-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 20px;
  border-bottom: 1px solid #f5f5f5;
}

.source-name {
  font-size: 14px;
  color: #333;
}

.source-value {
  font-size: 14px;
  font-weight: 600;
  color: #ff8c00;
}

.source-hint {
  font-size: 12px;
  color: #999;
  padding: 8px 4px 0;
}
</style>
