<template>
  <div class="settings-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">设置</span>
      <span class="placeholder"></span>
    </div>

    <div class="content">
      <div class="section">
        <div class="section-title">账号与安全</div>
        <div class="menu-item" @click="goEditProfile">
          <span class="menu-icon">👤</span>
          <span class="menu-text">编辑资料</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="goRealName">
          <span class="menu-icon">✅</span>
          <span class="menu-text">实名认证</span>
          <span class="menu-status">未认证</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="showPhone = true">
          <span class="menu-icon">📱</span>
          <span class="menu-text">绑定手机号</span>
          <span class="menu-status">138****8888</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="showChangePwd = true">
          <span class="menu-icon">🔒</span>
          <span class="menu-text">修改密码</span>
          <span class="menu-arrow">›</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">通用设置</div>
        <div class="menu-item" @click="showNotification = true">
          <span class="menu-icon">🔔</span>
          <span class="menu-text">消息通知</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item">
          <span class="menu-icon">🌙</span>
          <span class="menu-text">深色模式</span>
          <div class="switch" :class="{ active: darkMode }" @click="toggleDarkMode"></div>
        </div>
        <div class="menu-item" @click="goVipCenter">
          <span class="menu-icon">👑</span>
          <span class="menu-text">VIP设置</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="showPrivacy = true">
          <span class="menu-icon">💬</span>
          <span class="menu-text">隐私设置</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="showCallPrice = true; callPriceType = 'chat'">
          <span class="menu-icon">💬</span>
          <span class="menu-text">聊天</span>
          <span class="menu-status">{{ callSettings.chatPrice }}金币/分钟</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="showCallPrice = true; callPriceType = 'voice'">
          <span class="menu-icon">🎤</span>
          <span class="menu-text">语音通话</span>
          <span class="menu-status">{{ callSettings.voicePrice }} 金币/分钟</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="showCallPrice = true; callPriceType = 'video'">
          <span class="menu-icon">📹</span>
          <span class="menu-text">视频通话</span>
          <span class="menu-status">{{ callSettings.videoPrice }} 金币/分钟</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item">
          <span class="menu-icon">🗑️</span>
          <span class="menu-text">清理缓存</span>
          <span class="menu-status">128.5 MB</span>
          <span class="menu-arrow">›</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">其他</div>
        <div class="menu-item" @click="goAboutUs">
          <span class="menu-icon">ℹ️</span>
          <span class="menu-text">关于我们</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="goFeedback">
          <span class="menu-icon">💭</span>
          <span class="menu-text">意见反馈</span>
          <span class="menu-arrow">›</span>
        </div>
      </div>

      <div class="logout-section">
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>
    </div>

    <div class="modal" v-if="showPhone" @click.self="showPhone = false">
      <div class="modal-content">
        <div class="modal-title">更换手机号</div>
        <div class="modal-body">
          <input type="text" class="modal-input" v-model="phone" placeholder="请输入新手机号" maxlength="11" />
          <input type="text" class="modal-input" v-model="code" placeholder="请输入验证码" maxlength="6" />
          <div class="code-btn" @click="sendCode" :class="{ disabled: codeCount > 0 }">
            {{ codeCount > 0 ? `${codeCount}s` : '获取验证码' }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel" @click="showPhone = false">取消</button>
          <button class="modal-btn confirm" @click="confirmPhone">确定</button>
        </div>
      </div>
    </div>

    <div class="modal" v-if="showChangePwd" @click.self="showChangePwd = false">
      <div class="modal-content">
        <div class="modal-title">修改密码</div>
        <div class="modal-body">
          <input type="password" class="modal-input" v-model="oldPwd" placeholder="请输入旧密码" />
          <input type="password" class="modal-input" v-model="newPwd" placeholder="请输入新密码（至少6位）" />
          <input type="password" class="modal-input" v-model="confirmPwd" placeholder="请确认新密码" />
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel" @click="showChangePwd = false">取消</button>
          <button class="modal-btn confirm" @click="changePassword">确定</button>
        </div>
      </div>
    </div>

    <div class="modal" v-if="showNotification" @click.self="showNotification = false">
      <div class="modal-content">
        <div class="modal-title">消息通知</div>
        <div class="modal-body">
          <div class="setting-item">
            <span class="setting-text">私信消息</span>
            <div class="switch" :class="{ active: notifications.message }" @click="notifications.message = !notifications.message"></div>
          </div>
          <div class="setting-item">
            <span class="setting-text">点赞通知</span>
            <div class="switch" :class="{ active: notifications.like }" @click="notifications.like = !notifications.like"></div>
          </div>
          <div class="setting-item">
            <span class="setting-text">评论通知</span>
            <div class="switch" :class="{ active: notifications.comment }" @click="notifications.comment = !notifications.comment"></div>
          </div>
          <div class="setting-item">
            <span class="setting-text">关注通知</span>
            <div class="switch" :class="{ active: notifications.follow }" @click="notifications.follow = !notifications.follow"></div>
          </div>
          <div class="setting-item">
            <span class="setting-text">系统通知</span>
            <div class="switch" :class="{ active: notifications.system }" @click="notifications.system = !notifications.system"></div>
          </div>
          <div class="setting-item">
            <span class="setting-text">订单通知</span>
            <div class="switch" :class="{ active: notifications.order }" @click="notifications.order = !notifications.order"></div>
          </div>
          <div class="setting-item">
            <span class="setting-text">礼物通知</span>
            <div class="switch" :class="{ active: notifications.gift }" @click="notifications.gift = !notifications.gift"></div>
          </div>
          <div class="setting-item">
            <span class="setting-text">活动通知</span>
            <div class="switch" :class="{ active: notifications.activity }" @click="notifications.activity = !notifications.activity"></div>
          </div>
          <div class="setting-item">
            <span class="setting-text">预约通知</span>
            <div class="switch" :class="{ active: notifications.reserve }" @click="notifications.reserve = !notifications.reserve"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel" @click="showNotification = false">取消</button>
          <button class="modal-btn confirm" @click="saveNotification">保存</button>
        </div>
      </div>
    </div>

    <div class="modal" v-if="showPrivacy" @click.self="showPrivacy = false">
      <div class="modal-content">
        <div class="modal-title">隐私设置</div>
        <div class="modal-body">
          <div class="setting-item">
            <span class="setting-text">显示在线状态</span>
            <div class="switch" :class="{ active: privacy.showOnline }" @click="privacy.showOnline = !privacy.showOnline"></div>
          </div>
          <div class="setting-item">
            <span class="setting-text">显示位置信息</span>
            <div class="switch" :class="{ active: privacy.showLocation }" @click="privacy.showLocation = !privacy.showLocation"></div>
          </div>
          <div class="setting-item">
            <span class="setting-text">允许访客记录</span>
            <div class="switch" :class="{ active: privacy.allowVisit }" @click="privacy.allowVisit = !privacy.allowVisit"></div>
          </div>
          <div class="setting-item">
            <span class="setting-text">允许被搜索</span>
            <div class="switch" :class="{ active: privacy.allowSearch }" @click="privacy.allowSearch = !privacy.allowSearch"></div>
          </div>
          <div class="setting-item">
            <span class="setting-text">时间自动撤回</span>
            <div class="select-wrap" @click="showRecallTimeSelect = true">
              <span class="select-value">{{ privacy.autoRecall === 0 ? '关闭' : recallTimeOptions.find(o => o.value === privacy.autoRecall)?.label || '关闭' }}</span>
              <span class="select-arrow">›</span>
            </div>
          </div>
          <div class="setting-item">
            <span class="setting-text">已读自动销毁</span>
            <div class="select-wrap" @click="showDestroyTimeSelect = true">
              <span class="select-value">{{ privacy.autoDestroy === 0 ? '关闭' : destroyTimeOptions.find(o => o.value === privacy.autoDestroy)?.label || '关闭' }}</span>
              <span class="select-arrow">›</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel" @click="showPrivacy = false">取消</button>
          <button class="modal-btn confirm" @click="savePrivacy">保存</button>
        </div>
      </div>
    </div>

    <div class="modal" v-if="showRecallTimeSelect" @click.self="showRecallTimeSelect = false">
      <div class="modal-content select-modal">
        <div class="modal-title">选择自动撤回时间</div>
        <div class="modal-body">
          <div 
            v-for="option in recallTimeOptions" 
            :key="option.value"
            class="select-option"
            :class="{ active: privacy.autoRecall === option.value }"
            @click="selectRecallTime(option.value)"
          >
            <span>{{ option.label }}</span>
            <span v-if="privacy.autoRecall === option.value" class="check-icon">✓</span>
          </div>
        </div>
      </div>
    </div>

    <div class="modal" v-if="showDestroyTimeSelect" @click.self="showDestroyTimeSelect = false">
      <div class="modal-content select-modal">
        <div class="modal-title">选择销毁时间</div>
        <div class="modal-body">
          <div 
            v-for="option in destroyTimeOptions" 
            :key="option.value"
            class="select-option"
            :class="{ active: privacy.autoDestroy === option.value }"
            @click="selectDestroyTime(option.value)"
          >
            <span>{{ option.label }}</span>
            <span v-if="privacy.autoDestroy === option.value" class="check-icon">✓</span>
          </div>
        </div>
      </div>
    </div>

    <div class="call-modal" v-if="showCallPrice" @click.self="showCallPrice = false">
      <div class="call-modal-content">
        <div class="call-modal-body">
          <div class="price-card">
            <div class="price-card-label">每分钟费用</div>
            <div class="price-card-row">
              <span class="price-card-coin">🪙</span>
              <input type="number" class="price-card-input" v-model.number="callPriceValue" min="0" placeholder="0" />
              <span class="price-card-unit">金币</span>
            </div>
          </div>
          <div class="call-toggle-row">
            <div class="call-toggle-info">
              <span class="call-toggle-icon">{{ callPriceType === 'chat' ? '💬' : (callPriceType === 'voice' ? '🎤' : '📹') }}</span>
              <span class="call-toggle-text">启用{{ callPriceType === 'chat' ? '聊天' : (callPriceType === 'voice' ? '语音' : '视频') }}功能</span>
            </div>
            <label class="call-toggle">
              <input type="checkbox" v-model="callPriceEnabled" />
              <span class="call-toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="call-modal-footer">
          <button class="call-btn call-btn-cancel" @click="showCallPrice = false">取消</button>
          <button class="call-btn call-btn-confirm" @click="saveCallPrice">保存设置</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user-info'
import { notificationService } from '../services/notificationService'

const router = useRouter()
const userStore = useUserStore()

const darkMode = ref(false)
const callSettings = ref({
  chat: true,
  voice: true,
  video: true,
  chatPrice: 30,
  voicePrice: 30,
  videoPrice: 60
})
const showCallPrice = ref(false)
const callPriceType = ref('voice')
const callPriceValue = ref(30)
const callPriceEnabled = ref(true)
const showPhone = ref(false)
const showChangePwd = ref(false)
const showNotification = ref(false)
const showPrivacy = ref(false)
const showRecallTimeSelect = ref(false)
const showDestroyTimeSelect = ref(false)

const phone = ref('')
const code = ref('')
const codeCount = ref(0)

const oldPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')

const notifications = ref({
  message: true,
  like: true,
  comment: true,
  follow: true,
  system: true,
  order: true,
  gift: true,
  activity: true,
  reserve: true
})

const privacy = ref({
  showOnline: true,
  showLocation: true,
  allowVisit: true,
  allowSearch: true,
  autoRecall: 0,
  autoDestroy: 0
})

const recallTimeOptions = [
  { label: '关闭', value: 0 },
  { label: '30秒后', value: 30 },
  { label: '1分钟后', value: 60 },
  { label: '2分钟后', value: 120 },
  { label: '3分钟后', value: 180 },
  { label: '5分钟后', value: 300 }
]

const destroyTimeOptions = [
  { label: '关闭', value: 0 },
  { label: '5秒后', value: 5 },
  { label: '10秒后', value: 10 },
  { label: '30秒后', value: 30 },
  { label: '1分钟后', value: 60 },
  { label: '5分钟后', value: 300 }
]

const toggleDarkMode = () => {
  darkMode.value = !darkMode.value
  localStorage.setItem('darkMode', darkMode.value ? 'true' : 'false')
  if (darkMode.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const saveNotification = () => {
  localStorage.setItem('notifications', JSON.stringify(notifications.value))

  notificationService.init()
  alert('消息通知设置已保存')
  showNotification.value = false
}

const savePrivacy = () => {
  localStorage.setItem('privacy', JSON.stringify(privacy.value))
  alert('隐私设置已保存')
  showPrivacy.value = false
}

const changePassword = () => {
  if (!oldPwd.value) {
    alert('请输入旧密码')
    return
  }
  if (!newPwd.value || newPwd.value.length < 6) {
    alert('新密码至少6位')
    return
  }
  if (newPwd.value !== confirmPwd.value) {
    alert('两次输入的密码不一致')
    return
  }
  alert('密码修改成功！')
  showChangePwd.value = false
  oldPwd.value = ''
  newPwd.value = ''
  confirmPwd.value = ''
}

onMounted(() => {
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode === 'true') {
    darkMode.value = true
    document.documentElement.classList.add('dark')
  }
  
  const savedNotifications = localStorage.getItem('notifications')
  if (savedNotifications) {
    notifications.value = JSON.parse(savedNotifications)
  }
  
  const savedPrivacy = localStorage.getItem('privacy')
  if (savedPrivacy) {
    privacy.value = JSON.parse(savedPrivacy)
  }
  
  const savedCallSettings = localStorage.getItem('callSettings')
  if (savedCallSettings) {
    callSettings.value = JSON.parse(savedCallSettings)
  }
})

watch(callSettings, (val) => {
  localStorage.setItem('callSettings', JSON.stringify(val))
}, { deep: true })

const goBack = () => {
  router.back()
}

const goEditProfile = () => {
  router.push('/edit-profile')
}

const goVipCenter = () => {
  router.push('/vip-center')
}

const goRealName = () => {
  router.push('/real-name')
}

const goAboutUs = () => {
  router.push('/about-us')
}

const goFeedback = () => {
  router.push('/feedback')
}

const sendCode = () => {
  if (codeCount.value > 0) return
  if (!phone.value || phone.value.length !== 11) {
    alert('请输入正确的手机号')
    return
  }
  codeCount.value = 60
  const timer = setInterval(() => {
    codeCount.value--
    if (codeCount.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const confirmPhone = () => {
  if (!phone.value || !code.value) {
    alert('请填写完整信息')
    return
  }
  alert('手机号更换成功！')
  showPhone.value = false
}

const selectRecallTime = (value) => {
  privacy.value.autoRecall = value
  showRecallTimeSelect.value = false
}

const selectDestroyTime = (value) => {
  privacy.value.autoDestroy = value
  showDestroyTimeSelect.value = false
}

const saveCallPrice = () => {
  if (callPriceType.value === 'chat') {
    callSettings.value.chatPrice = callPriceValue.value
    callSettings.value.chat = callPriceEnabled.value
  } else if (callPriceType.value === 'voice') {
    callSettings.value.voicePrice = callPriceValue.value
    callSettings.value.voice = callPriceEnabled.value
  } else {
    callSettings.value.videoPrice = callPriceValue.value
    callSettings.value.video = callPriceEnabled.value
  }
  showCallPrice.value = false
}

watch(showCallPrice, (val) => {
  if (val) {
    const settings = callSettings.value
    if (callPriceType.value === 'chat') {
      callPriceValue.value = settings.chatPrice
      callPriceEnabled.value = settings.chat
    } else if (callPriceType.value === 'voice') {
      callPriceValue.value = settings.voicePrice
      callPriceEnabled.value = settings.voice
    } else {
      callPriceValue.value = settings.videoPrice
      callPriceEnabled.value = settings.video
    }
  }
})

const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout()
    localStorage.removeItem('token')
    localStorage.removeItem('pinia-app-state')
    router.push('/login')
  }
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  padding-bottom: 90px;
  padding-bottom: calc(90px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(90px + env(safe-area-inset-bottom, 0px));
  max-width: 650px;
  margin: 0 auto;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  padding-top: calc(16px + constant(safe-area-inset-top, 0px));
  padding-top: calc(16px + env(safe-area-inset-top, 0px));
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: -webkit-linear-gradient(315deg, #667eea 0%, #764ba2 100%);
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.back-btn,
.placeholder {
  width: 40px;
  font-size: 20px;
  color: white;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.content {
  padding: 20px 0;
}

.section {
  background: white;
  margin-bottom: 12px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.section-title {
  padding: 12px 20px;
  font-size: 13px;
  color: #999;
  background-color: #f5f5f5;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: #f9f9f9;
}

.menu-icon {
  font-size: 20px;
  margin-right: 12px;
}

.menu-text {
  flex: 1;
  font-size: 15px;
  color: #333;
}

.menu-status {
  font-size: 14px;
  color: #999;
  margin-right: 8px;
}

.menu-arrow {
  font-size: 20px;
  color: #ccc;
}

.switch {
  width: 48px;
  height: 28px;
  border-radius: 10px;
  background-color: #ddd;
  position: relative;
  transition: all 0.3s;
}

.switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  transition: all 0.3s;
}

.switch.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.switch.active::after {
  left: 22px;
}

.logout-section {
  padding: 30px 20px;
}

.logout-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
  color: white;
  font-size: 16px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
}

.logout-btn:active {
  transform: scale(0.98);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 85%;
  max-width: 320px;
  background: white;
  border-radius: 10px;
  overflow: hidden;
}

.modal-title {
  padding: 16px 20px;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
}

.call-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.call-modal-content {
  width: 320px;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.call-modal-body {
  padding: 16px 24px 16px;
  height: 160px;
  margin-top: -10px;
  margin-bottom: -10px;
}

.price-card {
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
  border: 2px solid #e8eaff;
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 12px;
  text-align: center;
  height: 80px;
}

.price-card-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.price-card-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding-top: 0;
  margin-top: 10px;
  margin-bottom: 10px;
}

.price-card-coin {
  font-size: 22px;
}

.price-card-input {
  width: 80px;
  padding: 2px 0;
  font-size: 22px;
  font-weight: bold;
  border: none;
  background: transparent;
  outline: none;
  text-align: center;
  color: #333;
}

.price-card-input:focus {
  color: #667eea;
}

.price-card-unit {
  font-size: 14px;
  color: #999;
  font-weight: 500;
}

.call-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  height: 40px;
}

.call-toggle-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.call-toggle-icon {
  font-size: 20px;
}

.call-toggle-text {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.call-toggle {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 28px;
  cursor: pointer;
}

.call-toggle input {
  display: none;
}

.call-toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ddd;
  border-radius: 28px;
  transition: all 0.3s;
}

.call-toggle-slider::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  background: #fff;
  border-radius: 50%;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.call-toggle input:checked + .call-toggle-slider {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.call-toggle input:checked + .call-toggle-slider::before {
  transform: translateX(20px);
}

.call-modal-footer {
  display: flex;
  gap: 12px;
  margin-top: 5px;
  margin-bottom: 5px;
  padding: 0 24px 0;
}

.call-btn {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.call-btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.call-btn-cancel:active {
  background: #eee;
  transform: scale(0.97);
}

.call-btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.call-btn-confirm:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.modal-body {
  padding: 8px 20px;
}

.modal-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  margin-bottom: 12px;
  box-sizing: border-box;
}

.code-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 15px;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
}

.code-btn.disabled {
  background: #ccc;
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  border-top: 1px solid #f0f0f0;
}

.modal-btn {
  flex: 1;
  padding: 16px;
  font-size: 16px;
  border: none;
  background: none;
  cursor: pointer;
}

.modal-btn.cancel {
  color: #999;
  border-right: 1px solid #f0f0f0;
}

.modal-btn.confirm {
  color: #667eea;
  font-weight: 500;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
  height: 40px;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-text {
  font-size: 15px;
  color: #333;
}

.select-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.select-value {
  font-size: 14px;
  color: #667eea;
}

.select-arrow {
  font-size: 16px;
  color: #999;
}

.select-modal {
  width: 90%;
  max-width: 280px;
  border-radius: 14px;
}

.select-modal .modal-title {
  padding: 16px 20px 12px;
  font-size: 16px;
}

.select-modal .modal-body {
  padding: 0;
}

.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  font-size: 15px;
}

.select-option:last-child {
  border-bottom: none;
}

.select-option.active {
  background-color: #f0f4ff;
}

.select-option .check-icon {
  color: #667eea;
  font-weight: bold;
}

.dark .settings-page {
  background-color: #121212;
  padding-bottom: 90px;
}

.dark .section {
  background: #1e1e1e;
}

.dark .section-title {
  background-color: #181818;
  color: #888;
}

.dark .menu-item {
  border-bottom-color: #2a2a2a;
}

.dark .menu-item:active {
  background-color: #2a2a2a;
}

.dark .menu-text {
  color: #e0e0e0;
}

.dark .menu-status {
  color: #888;
}

.dark .menu-arrow {
  color: #555;
}

.dark .switch {
  background-color: #444;
}

.dark .logout-btn {
  background: linear-gradient(135deg, #ff6b6b, #c0392b);
}

.dark .modal-content {
  background-color: #1e1e1e;
}

.dark .modal-title {
  color: #e0e0e0;
  border-bottom-color: #2a2a2a;
}

.dark .modal-body {
  background-color: #1e1e1e;
}

.dark .setting-item {
  border-bottom-color: #2a2a2a;
}

.dark .setting-text {
  color: #e0e0e0;
}

.dark .select-option {
  border-bottom-color: #2a2a2a;
  color: #e0e0e0;
}

.dark .select-option.active {
  background-color: #1a1a2e;
}

.dark .modal-input {
  background-color: #2a2a2a;
  border-color: #3a3a3a;
  color: #e0e0e0;
}

.dark .modal-input::placeholder {
  color: #666;
}

.dark .modal-footer {
  border-top-color: #2a2a2a;
}

.dark .modal-btn {
  color: #e0e0e0;
}

.dark .modal-btn.cancel {
  color: #888;
  border-right-color: #2a2a2a;
}

.dark .modal-btn.confirm {
  color: #667eea;
}

.dark .code-btn {
  background: linear-gradient(135deg, #4a4a8a, #5a3a8a);
}

.dark .call-modal-content {
  background-color: #1e1e1e;
}

.dark .price-card {
  background: linear-gradient(135deg, #2a2a3e, #252535);
  border-color: #3a3a5a;
}

.dark .price-card-label {
  color: #aaa;
}

.dark .price-card-input {
  color: #e0e0e0;
}

.dark .price-card-input:focus {
  color: #667eea;
}

.dark .price-card-unit {
  color: #888;
}

.dark .call-toggle-row {
  background: #2a2a2a;
}

.dark .call-toggle-text {
  color: #e0e0e0;
}

.dark .call-btn-cancel {
  background: #333;
  color: #aaa;
}

.dark .call-btn-cancel:active {
  background: #444;
}

/* 聊天收费设置样式 */
.price-presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
  margin-bottom: 16px;
}

.preset-btn {
  padding: 8px 16px;
  border: 1px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.preset-btn:hover {
  background: #667eea;
  color: white;
}

.preset-btn.active {
  background: #667eea;
  color: white;
}

.setting-tips {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  margin-top: 12px;
}

.setting-tips p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.dark .price-presets {
  margin-top: 16px;
  margin-bottom: 16px;
}

.dark .preset-btn {
  border-color: #667eea;
  background: #2a2a3e;
  color: #667eea;
}

.dark .preset-btn:hover,
.dark .preset-btn.active {
  background: #667eea;
  color: white;
}

.dark .setting-tips {
  background: #2a2a2a;
}

.dark .setting-tips p {
  color: #aaa;
}
</style>
