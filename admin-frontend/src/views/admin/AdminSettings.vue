<template>
  <div class="settings-page">
    <div class="settings-card">
      <h3>基本设置</h3>
      <div class="form-grid">
        <label>站点名称: <input v-model="settings.siteName" /></label>
        <label>站点描述: <input v-model="settings.siteDescription" /></label>
        <label>联系电话: <input v-model="settings.contactPhone" /></label>
        <label>联系邮箱: <input v-model="settings.contactEmail" /></label>
      </div>
    </div>
    <div class="settings-card">
      <h3>充值设置</h3>
      <div class="form-grid">
        <label>新用户初始余额: <input v-model.number="settings.userInitBalance" type="number" /></label>
        <label>最低提现金额: <input v-model.number="settings.withdrawMinAmount" type="number" /></label>
        <label>提现手续费率(%): <input v-model.number="settings.withdrawFeeRate" type="number" step="0.01" /></label>
      </div>
    </div>
    <div class="settings-card">
      <h3>功能开关</h3>
      <div class="switch-grid">
        <label class="switch-item">
          <span>注册功能</span>
          <div class="switch-toggle" :class="{ active: settings.registerEnabled }" @click="settings.registerEnabled = !settings.registerEnabled"></div>
        </label>
        <label class="switch-item">
          <span>礼物功能</span>
          <div class="switch-toggle" :class="{ active: settings.giftEnabled }" @click="settings.giftEnabled = !settings.giftEnabled"></div>
        </label>
        <label class="switch-item">
          <span>语音通话</span>
          <div class="switch-toggle" :class="{ active: settings.voiceChatEnabled }" @click="settings.voiceChatEnabled = !settings.voiceChatEnabled"></div>
        </label>
        <label class="switch-item">
          <span>视频通话</span>
          <div class="switch-toggle" :class="{ active: settings.videoChatEnabled }" @click="settings.videoChatEnabled = !settings.videoChatEnabled"></div>
        </label>
      </div>
    </div>
    <button class="btn-primary save-btn" @click="saveSettings">保存设置</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import adminService from '../../services/adminService'

const settings = ref({
  siteName: '多客陪玩', siteDescription: '专业游戏陪玩平台',
  contactPhone: '400-888-8888', contactEmail: 'admin@duoke.com',
  userInitBalance: 0, withdrawMinAmount: 50, withdrawFeeRate: 0.02,
  registerEnabled: true, giftEnabled: true,
  voiceChatEnabled: true, videoChatEnabled: true
})

const loadSettings = async () => {
  try {
    const res = await adminService.getSystemSettings()
    if (res.code === 200 || res.code === 0) {
      settings.value = { ...settings.value, ...res.data }
    }
  } catch (e) { console.error('加载设置失败:', e) }
}

const saveSettings = async () => {
  try {
    const res = await adminService.updateSystemSettings(settings.value)
    if (res.code === 200 || res.code === 0) {
      alert('设置保存成功')
    } else {
      alert(res.message || '保存失败')
    }
  } catch (e) { console.error('保存设置失败:', e); alert('保存失败') }
}

onMounted(loadSettings)
</script>

<style scoped>
.settings-page { max-width: 600px; }
.settings-card { background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.settings-card h3 { font-size: 15px; color: #333; margin-bottom: 12px; }
.form-grid { display: grid; gap: 12px; }
.form-grid label { display: flex; flex-direction: column; font-size: 13px; color: #666; gap: 4px; }
.form-grid input { padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; }
.switch-grid { display: grid; gap: 12px; }
.switch-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 14px; cursor: pointer; }
.switch-toggle { width: 44px; height: 22px; background: #ccc; border-radius: 11px; position: relative; transition: background 0.2s; }
.switch-toggle::after { content: ''; position: absolute; width: 18px; height: 18px; background: #fff; border-radius: 50%; top: 2px; left: 2px; transition: left 0.2s; }
.switch-toggle.active { background: #1890ff; }
.switch-toggle.active::after { left: 24px; }
.btn-primary { padding: 10px 24px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
.save-btn { margin-top: 8px; }
</style>
