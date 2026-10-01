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
        <label class="switch-item">
          <span>分享功能</span>
          <div class="switch-toggle" :class="{ active: settings.shareEnabled }" @click="settings.shareEnabled = !settings.shareEnabled"></div>
        </label>
      </div>
    </div>
    <div class="settings-card" v-if="settings.shareEnabled">
      <h3>分享奖励设置</h3>
      <div class="switch-grid">
        <label class="switch-item">
          <span>开启分享奖励</span>
          <div class="switch-toggle" :class="{ active: settings.shareRewardEnabled }" @click="settings.shareRewardEnabled = !settings.shareRewardEnabled"></div>
        </label>
      </div>
      <div class="form-grid" v-if="settings.shareRewardEnabled">
        <label>每次分享奖励金额: <input v-model.number="settings.shareRewardAmount" type="number" step="0.01" min="0" /></label>
      </div>
    </div>
    <div class="settings-card">
      <h3>分账设置</h3>
      <div class="form-grid">
        <label>陪玩订单陪玩师分成(%): <input v-model.number="orderCommissionPercent" type="number" step="1" min="0" max="100" /></label>
        <label>预约完成陪玩师分成(%): <input v-model.number="reserveCommissionPercent" type="number" step="1" min="0" max="100" /></label>
      </div>
      <p class="form-hint">陪玩师所得占订单/预约金额的百分比，其余归平台。订单默认 70%，预约默认 100%（全额给陪玩师）。</p>
    </div>
    <button class="btn-primary save-btn" @click="saveSettings">保存设置</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import adminService from '../../services/adminService'
import { useToast } from '../../composables/useToast'
import { rateToPercent, percentToRate } from '../../common/common'
const toast = useToast()

const settings = ref({
  siteName: 'eu搭子', siteDescription: '专业游戏陪玩平台',
  contactPhone: '400-888-8888', contactEmail: 'admin@eudazi.com',
  userInitBalance: 0, withdrawMinAmount: 50, withdrawFeeRate: 0.02,
  registerEnabled: true, giftEnabled: true,
  voiceChatEnabled: false, videoChatEnabled: false,
  shareEnabled: true, shareRewardEnabled: false, shareRewardAmount: 0
})

// 分账比例以百分比(%)单独维护，保存时换算为后端使用的 0~1 小数
const orderCommissionPercent = ref(70)
const reserveCommissionPercent = ref(100)

const loadSettings = async () => {
  try {
    const res = await adminService.getSystemSettings()
    if (res.code === 200 || res.code === 0) {
      const data = { ...(res.data || {}) }
      if (data.order_commission_rate !== undefined) {
        orderCommissionPercent.value = rateToPercent(data.order_commission_rate)
      }
      if (data.reserve_commission_rate !== undefined) {
        reserveCommissionPercent.value = rateToPercent(data.reserve_commission_rate)
      }
      // 分账比例不进通用设置对象，避免以百分比原值回写
      delete data.order_commission_rate
      delete data.reserve_commission_rate
      settings.value = { ...settings.value, ...data }
    }
  } catch (e) { toast.error('加载设置失败: ' + (e.message || '网络错误')) }
}

const saveSettings = async () => {
  const op = Number(orderCommissionPercent.value)
  const rp = Number(reserveCommissionPercent.value)
  if (!(op >= 0 && op <= 100) || !(rp >= 0 && rp <= 100)) {
    toast.error('分成比例需在 0~100 之间')
    return
  }
  try {
    const res = await adminService.updateSystemSettings({
      ...settings.value,
      order_commission_rate: percentToRate(op),
      reserve_commission_rate: percentToRate(rp)
    })
    if (res.code === 200 || res.code === 0) {
      toast.success('设置保存成功')
    } else {
      toast.error(res.message || '保存失败')
    }
  } catch (e) { toast.error('保存失败: ' + (e.message || '网络错误')) }
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
.form-hint { margin-top: 8px; font-size: 12px; color: #999; line-height: 1.5; }
.switch-grid { display: grid; gap: 12px; }
.switch-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 14px; cursor: pointer; }
.switch-toggle { width: 44px; height: 22px; background: #ccc; border-radius: 11px; position: relative; transition: background 0.2s; }
.switch-toggle::after { content: ''; position: absolute; width: 18px; height: 18px; background: #fff; border-radius: 50%; top: 2px; left: 2px; transition: left 0.2s; }
.switch-toggle.active { background: #1890ff; }
.switch-toggle.active::after { left: 24px; }
.btn-primary { padding: 10px 24px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
.save-btn { margin-top: 8px; }
</style>
