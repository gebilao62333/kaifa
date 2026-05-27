<template>
  <div class="stealth-visit-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">隐身访问</span>
      <span class="placeholder"></span>
    </div>

    <div class="content">
      <div class="intro-card">
        <div class="intro-icon">👻</div>
        <div class="intro-text">
          <div class="intro-title">隐身模式</div>
          <div class="intro-desc">开启后，您可以悄悄浏览其他用户的主页和动态，对方不会收到访客通知</div>
        </div>
      </div>

      <div class="setting-section">
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-name">隐身访问</div>
            <div class="setting-desc">开启后浏览他人主页不留下访客记录</div>
          </div>
          <div class="switch" :class="{ active: settings.stealth }" @click="toggleSetting('stealth')"></div>
        </div>
        <div class="setting-item" :class="{ disabled: !settings.stealth }">
          <div class="setting-info">
            <div class="setting-name">隐藏在线状态</div>
            <div class="setting-desc">在线时对其他用户显示为离线</div>
          </div>
          <div class="switch" :class="{ active: settings.hideOnline }" @click="toggleSetting('hideOnline')"></div>
        </div>
        <div class="setting-item" :class="{ disabled: !settings.stealth }">
          <div class="setting-info">
            <div class="setting-name">隐身浏览动态</div>
            <div class="setting-desc">浏览动态时不会出现在访客列表</div>
          </div>
          <div class="switch" :class="{ active: settings.stealthBrowse }" @click="toggleSetting('stealthBrowse')"></div>
        </div>
        <div class="setting-item" :class="{ disabled: !settings.stealth }">
          <div class="setting-info">
            <div class="setting-name">屏蔽通知提醒</div>
            <div class="setting-desc">隐身期间屏蔽所有访客相关通知</div>
          </div>
          <div class="switch" :class="{ active: settings.muteNotify }" @click="toggleSetting('muteNotify')"></div>
        </div>
      </div>

      <div class="info-card">
        <div class="info-title">隐身说明</div>
        <div class="info-list">
          <div class="info-item">
            <span class="info-icon">✅</span>
            <span class="info-text">访客列表不会出现您的记录</span>
          </div>
          <div class="info-item">
            <span class="info-icon">✅</span>
            <span class="info-text">动态浏览量仍会计入</span>
          </div>
          <div class="info-item">
            <span class="info-icon">❌</span>
            <span class="info-text">私信和评论仍然可见</span>
          </div>
          <div class="info-item">
            <span class="info-icon">❌</span>
            <span class="info-text">对方主动搜索仍可找到您</span>
          </div>
        </div>
      </div>

      <div class="vip-level-card">
        <div class="vip-level-title">VIP等级要求</div>
        <div class="vip-level-list">
          <div class="vip-level-item" :class="{ achieved: currentVipLevel >= 1 }">
            <div class="vip-level-left">
              <span class="vip-level-icon">👻</span>
              <span class="vip-level-name">隐身访问</span>
            </div>
            <span class="vip-level-tag">VIP1</span>
          </div>
          <div class="vip-level-item" :class="{ achieved: currentVipLevel >= 2 }">
            <div class="vip-level-left">
              <span class="vip-level-icon">🌙</span>
              <span class="vip-level-name">隐藏在线状态</span>
            </div>
            <span class="vip-level-tag">VIP2</span>
          </div>
          <div class="vip-level-item" :class="{ achieved: currentVipLevel >= 3 }">
            <div class="vip-level-left">
              <span class="vip-level-icon">🕶️</span>
              <span class="vip-level-name">隐身浏览动态</span>
            </div>
            <span class="vip-level-tag">VIP3</span>
          </div>
          <div class="vip-level-item" :class="{ achieved: currentVipLevel >= 4 }">
            <div class="vip-level-left">
              <span class="vip-level-icon">🔇</span>
              <span class="vip-level-name">屏蔽通知提醒</span>
            </div>
            <span class="vip-level-tag">VIP4</span>
          </div>
        </div>
        <div class="vip-level-hint" v-if="currentVipLevel < 4">
          当前 VIP{{ currentVipLevel }}，升级至 VIP{{ currentVipLevel + 1 }} 解锁更多隐身功能
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

const settings = reactive({
  stealth: false,
  hideOnline: false,
  stealthBrowse: false,
  muteNotify: false
})

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('stealthSettings')
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.assign(settings, parsed)
    }
  } catch {}
}

const saveSettings = () => {
  localStorage.setItem('stealthSettings', JSON.stringify(settings))
}

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
  saveSettings()
}

const goBack = () => {
  router.back()
}

loadSettings()

watch(settings, saveSettings, { deep: true })
</script>

<style scoped>
.stealth-visit-page {
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

.setting-section {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 16px;
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

.info-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
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
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
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
  background: linear-gradient(135deg, #667eea, #764ba2);
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
