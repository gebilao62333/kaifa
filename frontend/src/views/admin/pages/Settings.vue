<template>
  <div class="settings-page">
    <div class="settings-section">
      <h3>基础设置</h3>
      <div class="form-group">
        <label>网站名称</label>
        <input v-model="systemSettings.siteName" type="text" class="form-input" />
      </div>
      <div class="form-group">
        <label>网站描述</label>
        <input v-model="systemSettings.siteDescription" type="text" class="form-input" />
      </div>
      <div class="form-group">
        <label>联系方式</label>
        <input v-model="systemSettings.contactPhone" type="text" class="form-input" />
      </div>
      <div class="form-group">
        <label>联系邮箱</label>
        <input v-model="systemSettings.contactEmail" type="email" class="form-input" />
      </div>
    </div>

    <div class="settings-section">
      <h3>用户设置</h3>
      <div class="form-group">
        <label>用户初始余额</label>
        <input v-model.number="systemSettings.userInitBalance" type="number" class="form-input" />
      </div>
      <div class="form-group">
        <label>最低提现金额</label>
        <input v-model.number="systemSettings.withdrawMinAmount" type="number" class="form-input" />
      </div>
      <div class="form-group">
        <label>提现手续费率</label>
        <input v-model.number="systemSettings.withdrawFeeRate" type="number" step="0.01" class="form-input" />
      </div>
    </div>

    <div class="settings-section">
      <h3>功能开关</h3>
      <div class="form-group">
        <label>
          <input type="checkbox" v-model="systemSettings.registerEnabled" />
          允许用户注册
        </label>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" v-model="systemSettings.giftEnabled" />
          启用礼物功能
        </label>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" v-model="systemSettings.voiceChatEnabled" />
          启用语音聊天
        </label>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" v-model="systemSettings.videoChatEnabled" />
          启用视频聊天
        </label>
      </div>
    </div>

    <div class="settings-actions">
      <button @click="saveSettings" class="btn-save">保存设置</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { getHost } = useAdmin()

const systemSettings = ref({
  siteName: '多客陪玩',
  siteDescription: '专业游戏陪玩平台',
  contactPhone: '400-888-8888',
  contactEmail: 'admin@duoke.com',
  userInitBalance: 0,
  withdrawMinAmount: 50,
  withdrawFeeRate: 0.02,
  registerEnabled: true,
  giftEnabled: true,
  voiceChatEnabled: true,
  videoChatEnabled: true
})

const loadSettings = async () => {
  try {
    const res = await fetch(getHost() + '/api/admin/settings', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('admin_token') }
    })
    const data = await res.json()
    if (data.code === 200 && data.data) {
      Object.assign(systemSettings.value, data.data)
    }
  } catch (e) {
    console.error(e)
  }
}

const saveSettings = async () => {
  try {
    const res = await fetch(getHost() + '/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('admin_token')
      },
      body: JSON.stringify(systemSettings.value)
    })
    const data = await res.json()
    if (data.code === 200) {
      alert('设置保存成功')
    } else {
      alert(data.message || '保存失败')
    }
  } catch (e) {
    alert('保存失败')
  }
}

onMounted(() => {
  loadSettings()
})
</script>
