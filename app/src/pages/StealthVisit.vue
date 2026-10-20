<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">隐身访问</text>
      <text class="placeholder"></text>
    </template>

    <view class="content">
      <view class="intro-card">
        <view class="intro-icon">👻</view>
        <view class="intro-text">
          <view class="intro-title">隐身模式</view>
          <view class="intro-desc">开启后，您可以悄悄浏览其他用户的主页和动态，对方不会收到访客通知</view>
        </view>
      </view>

      <view class="setting-section">
        <view class="setting-item">
          <view class="setting-info">
            <view class="setting-name">隐身访问</view>
            <view class="setting-desc">开启后浏览他人主页不留下访客记录</view>
          </view>
          <view class="switch" :class="{ active: settings.stealth }" @click="toggleSetting('stealth')"></view>
        </view>
        <view class="setting-item" :class="{ disabled: !settings.stealth }">
          <view class="setting-info">
            <view class="setting-name">隐藏在线状态</view>
            <view class="setting-desc">在线时对其他用户显示为离线</view>
          </view>
          <view class="switch" :class="{ active: settings.hideOnline }" @click="toggleSetting('hideOnline')"></view>
        </view>
        <view class="setting-item" :class="{ disabled: !settings.stealth }">
          <view class="setting-info">
            <view class="setting-name">隐身浏览动态</view>
            <view class="setting-desc">浏览动态时不会出现在访客列表</view>
          </view>
          <view class="switch" :class="{ active: settings.stealthBrowse }" @click="toggleSetting('stealthBrowse')"></view>
        </view>
        <view class="setting-item" :class="{ disabled: !settings.stealth }">
          <view class="setting-info">
            <view class="setting-name">屏蔽通知提醒</view>
            <view class="setting-desc">隐身期间屏蔽所有访客相关通知</view>
          </view>
          <view class="switch" :class="{ active: settings.muteNotify }" @click="toggleSetting('muteNotify')"></view>
        </view>
      </view>

      <view class="info-card">
        <view class="info-title">隐身说明</view>
        <view class="info-list">
          <view class="info-item">
            <text class="info-icon">✅</text>
            <text class="info-text">访客列表不会出现您的记录</text>
          </view>
          <view class="info-item">
            <text class="info-icon">✅</text>
            <text class="info-text">动态浏览量仍会计入</text>
          </view>
          <view class="info-item">
            <text class="info-icon">❌</text>
            <text class="info-text">私信和评论仍然可见</text>
          </view>
          <view class="info-item">
            <text class="info-icon">❌</text>
            <text class="info-text">对方主动搜索仍可找到您</text>
          </view>
        </view>
      </view>

      <view class="vip-level-card">
        <view class="vip-level-title">VIP等级要求</view>
        <view class="vip-level-list">
          <view class="vip-level-item" :class="{ achieved: currentVipLevel >= 1 }">
            <view class="vip-level-left">
              <text class="vip-level-icon">👻</text>
              <text class="vip-level-name">隐身访问</text>
            </view>
            <text class="vip-level-tag">VIP1</text>
          </view>
          <view class="vip-level-item" :class="{ achieved: currentVipLevel >= 2 }">
            <view class="vip-level-left">
              <text class="vip-level-icon">🌙</text>
              <text class="vip-level-name">隐藏在线状态</text>
            </view>
            <text class="vip-level-tag">VIP2</text>
          </view>
          <view class="vip-level-item" :class="{ achieved: currentVipLevel >= 3 }">
            <view class="vip-level-left">
              <text class="vip-level-icon">🕶️</text>
              <text class="vip-level-name">隐身浏览动态</text>
            </view>
            <text class="vip-level-tag">VIP3</text>
          </view>
          <view class="vip-level-item" :class="{ achieved: currentVipLevel >= 4 }">
            <view class="vip-level-left">
              <text class="vip-level-icon">🔇</text>
              <text class="vip-level-name">屏蔽通知提醒</text>
            </view>
            <text class="vip-level-tag">VIP4</text>
          </view>
        </view>
        <view class="vip-level-hint" v-if="currentVipLevel < 4">
          当前 VIP{{ currentVipLevel }}，升级至 VIP{{ currentVipLevel + 1 }} 解锁更多隐身功能
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, watch, nextTick, onMounted } from 'vue'
import { useRouter } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import userPrefService from '../services/userPrefService'
import { toast } from '../composables/useToast'
import storage from '../common/storage'

const router = useRouter()

const currentVipLevel = ref(2)

const settings = reactive({
  stealth: false,
  hideOnline: false,
  stealthBrowse: false,
  muteNotify: false
})

const loadSettings = () => {
  try {
    const saved = storage.getItem('stealthSettings')
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.assign(settings, parsed)
    }
  } catch {}
}

const saveSettings = () => {
  storage.setItem('stealthSettings', JSON.stringify(settings))
  // 等级门槛等服务端拒绝原因要让用户看到，网络类错误保持静默
  userPrefService.save({ stealthSettings: { ...settings } })
    .catch((e) => { if (e?.status === 422) toast.show(e.message) })
}

// 服务端回填期间抑制 watch，避免「拉取 → 覆盖本地值 → 立刻再 POST 一次」的重复写入
let hydrating = false

const loadPref = async () => {
  hydrating = true
  try {
    const res = await userPrefService.get()
    const prefs = res?.data?.data || {}
    if (prefs.stealthSettings) Object.assign(settings, prefs.stealthSettings)
  } catch (e) { /* 静默 */ }
  await nextTick()
  hydrating = false
}

onMounted(loadPref)

const toggleSetting = (key) => {
  if (key === 'stealth') {
    settings.stealth = !settings.stealth
    if (!settings.stealth) {
      settings.hideOnline = false
      settings.stealthBrowse = false
      settings.muteNotify = false
    }
  } else {
    if (!settings.stealth) return
    settings[key] = !settings[key]
  }
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

.setting-section {
  background: white;
  border-radius: 0px;
  overflow: hidden;
  margin: 12px 0 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #f5f5f5;
  transition: opacity 0.2s;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item.disabled {
  opacity: 0.4;
  pointer-events: none;
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

.info-card {
  background: white;
  border-radius: 0px;
  padding: 20px;
  margin: 12px 0 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.info-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-icon {
  font-size: 16px;
  width: 24px;
  text-align: center;
}

.info-text {
  font-size: 14px;
  color: #666;
}

.vip-level-card {
  background: white;
  border-radius: 0px;
  padding: 20px;
  margin: 12px 0 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.vip-level-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.vip-level-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.vip-level-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f9f9f9;
  border-radius: 10px;
  transition: all 0.2s;
}

.vip-level-item.achieved {
  background: rgba(102, 126, 234, 0.06);
}

.vip-level-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.vip-level-icon {
  font-size: 20px;
}

.vip-level-name {
  font-size: 14px;
  color: #333;
}

.vip-level-tag {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 10px;
  background: #e5e5e5;
  color: #999;
}

.vip-level-item.achieved .vip-level-tag {
  background: var(--gradient-primary);
  color: white;
}

.vip-level-hint {
  font-size: 13px;
  color: #999;
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}
</style>
