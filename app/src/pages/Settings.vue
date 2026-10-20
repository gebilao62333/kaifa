<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">设置</text>
      <text class="placeholder"></text>
    </template>

    <view class="content">
      <view class="section">
        <view class="section-title">账号与安全</view>
        <view class="menu-item" @click="goEditProfile">
          <text class="menu-icon">👤</text>
          <text class="menu-text">编辑资料</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goRealName">
          <text class="menu-icon">✅</text>
          <text class="menu-text">实名认证</text>
          <text class="menu-status">未认证</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="showPhone = true">
          <text class="menu-icon">📱</text>
          <text class="menu-text">绑定手机号</text>
          <text class="menu-status">138****8888</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="showChangePwd = true">
          <text class="menu-icon">🔒</text>
          <text class="menu-text">修改密码</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="section">
        <view class="section-title">通用设置</view>
        <view class="menu-item" @click="showNotification = true">
          <text class="menu-icon">🔔</text>
          <text class="menu-text">消息通知</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item">
          <text class="menu-icon">🌙</text>
          <text class="menu-text">深色模式</text>
          <view class="switch" :class="{ active: darkMode }" @click="toggleDarkMode"></view>
        </view>
        <view class="menu-item">
          <text class="menu-icon">✨</text>
          <text class="menu-text">导航动画</text>
          <view class="switch" :class="{ active: navAnimationEnabled }" @click="toggleNavAnimation"></view>
        </view>
        <view class="menu-item" @click="goVipCenter">
          <text class="menu-icon">👑</text>
          <text class="menu-text">VIP设置</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="showPrivacy = true">
          <text class="menu-icon">💬</text>
          <text class="menu-text">隐私设置</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="showCallPrice = true; callPriceType = 'voice'">
          <text class="menu-icon">🎤</text>
          <text class="menu-text">语音通话</text>
          <text class="menu-status">{{ callSettings.voicePrice }} 金币/分钟</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="showCallPrice = true; callPriceType = 'video'">
          <text class="menu-icon">📹</text>
          <text class="menu-text">视频通话</text>
          <text class="menu-status">{{ callSettings.videoPrice }} 金币/分钟</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="clearCache">
          <text class="menu-icon">🗑️</text>
          <text class="menu-text">清理缓存</text>
          <text class="menu-status">{{ cacheSize }}</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="section">
        <view class="section-title">其他</view>
        <view class="menu-item" @click="goAboutUs">
          <text class="menu-icon">ℹ️</text>
          <text class="menu-text">关于我们</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goFeedback">
          <text class="menu-icon">💭</text>
          <text class="menu-text">意见反馈</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="logout-section">
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </view>
    </view>

    <view class="modal" v-if="showPhone" @click.self="showPhone = false">
      <view class="modal-content">
        <view class="modal-title">更换手机号</view>
        <view class="modal-body">
          <input type="text" class="modal-input" v-model="phone" placeholder="请输入新手机号" maxlength="11" />
          <input type="text" class="modal-input" v-model="code" placeholder="请输入验证码" maxlength="6" />
          <view class="code-btn" @click="sendCode" :class="{ disabled: codeCount > 0 }">
            {{ codeCount > 0 ? `${codeCount}s` : '获取验证码' }}
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="showPhone = false">取消</button>
          <button class="modal-btn confirm" @click="confirmPhone">确定</button>
        </view>
      </view>
    </view>

    <view class="modal" v-if="showChangePwd" @click.self="showChangePwd = false">
      <view class="modal-content">
        <view class="modal-title">修改密码</view>
        <view class="modal-body">
          <!-- H5 用原生 password 类型；App 的 uni input 没有 password 类型，改 password 属性 -->
          <input v-if="!isApp" type="password" class="modal-input" v-model="oldPwd" placeholder="请输入旧密码" />
          <input v-else :password="true" class="modal-input" v-model="oldPwd" placeholder="请输入旧密码" />
          <input v-if="!isApp" type="password" class="modal-input" v-model="newPwd" placeholder="请输入新密码（至少6位）" />
          <input v-else :password="true" class="modal-input" v-model="newPwd" placeholder="请输入新密码（至少6位）" />
          <input v-if="!isApp" type="password" class="modal-input" v-model="confirmPwd" placeholder="请确认新密码" />
          <input v-else :password="true" class="modal-input" v-model="confirmPwd" placeholder="请确认新密码" />
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="showChangePwd = false">取消</button>
          <button class="modal-btn confirm" @click="changePassword">确定</button>
        </view>
      </view>
    </view>

    <view class="modal" v-if="showNotification" @click.self="showNotification = false">
      <view class="modal-content">
        <view class="modal-title">消息通知</view>
        <view class="modal-body">
          <view class="setting-item">
            <text class="setting-text">私信消息</text>
            <view class="switch" :class="{ active: notifications.message }" @click="notifications.message = !notifications.message"></view>
          </view>
          <view class="setting-item">
            <text class="setting-text">点赞通知</text>
            <view class="switch" :class="{ active: notifications.like }" @click="notifications.like = !notifications.like"></view>
          </view>
          <view class="setting-item">
            <text class="setting-text">评论通知</text>
            <view class="switch" :class="{ active: notifications.comment }" @click="notifications.comment = !notifications.comment"></view>
          </view>
          <view class="setting-item">
            <text class="setting-text">关注通知</text>
            <view class="switch" :class="{ active: notifications.follow }" @click="notifications.follow = !notifications.follow"></view>
          </view>
          <view class="setting-item">
            <text class="setting-text">系统通知</text>
            <view class="switch" :class="{ active: notifications.system }" @click="notifications.system = !notifications.system"></view>
          </view>
          <view class="setting-item">
            <text class="setting-text">订单通知</text>
            <view class="switch" :class="{ active: notifications.order }" @click="notifications.order = !notifications.order"></view>
          </view>
          <view class="setting-item">
            <text class="setting-text">礼物通知</text>
            <view class="switch" :class="{ active: notifications.gift }" @click="notifications.gift = !notifications.gift"></view>
          </view>
          <view class="setting-item">
            <text class="setting-text">活动通知</text>
            <view class="switch" :class="{ active: notifications.activity }" @click="notifications.activity = !notifications.activity"></view>
          </view>
          <view class="setting-item">
            <text class="setting-text">预约通知</text>
            <view class="switch" :class="{ active: notifications.reserve }" @click="notifications.reserve = !notifications.reserve"></view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="showNotification = false">取消</button>
          <button class="modal-btn confirm" @click="saveNotification">保存</button>
        </view>
      </view>
    </view>

    <view class="modal" v-if="showPrivacy" @click.self="showPrivacy = false">
      <view class="modal-content">
        <view class="modal-title">隐私设置</view>
        <view class="modal-body">
          <view class="setting-item">
            <text class="setting-text">显示在线状态</text>
            <view class="switch" :class="{ active: privacy.showOnline }" @click="privacy.showOnline = !privacy.showOnline"></view>
          </view>
          <view class="setting-item">
            <text class="setting-text">显示位置信息</text>
            <view class="switch" :class="{ active: privacy.showLocation }" @click="privacy.showLocation = !privacy.showLocation"></view>
          </view>
          <view class="setting-item">
            <text class="setting-text">允许访客记录</text>
            <view class="switch" :class="{ active: privacy.allowVisit }" @click="privacy.allowVisit = !privacy.allowVisit"></view>
          </view>
          <view class="setting-item">
            <text class="setting-text">允许被搜索</text>
            <view class="switch" :class="{ active: privacy.allowSearch }" @click="privacy.allowSearch = !privacy.allowSearch"></view>
          </view>
          <view class="setting-item">
            <text class="setting-text">时间自动撤回</text>
            <view class="select-wrap" @click="showRecallTimeSelect = true">
              <text class="select-value">{{ privacy.autoRecall === 0 ? '关闭' : recallTimeOptions.find(o => o.value === privacy.autoRecall)?.label || '关闭' }}</text>
              <text class="select-arrow">›</text>
            </view>
          </view>
          <view class="setting-item">
            <text class="setting-text">已读自动销毁</text>
            <view class="select-wrap" @click="showDestroyTimeSelect = true">
              <text class="select-value">{{ privacy.autoDestroy === 0 ? '关闭' : destroyTimeOptions.find(o => o.value === privacy.autoDestroy)?.label || '关闭' }}</text>
              <text class="select-arrow">›</text>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="showPrivacy = false">取消</button>
          <button class="modal-btn confirm" @click="savePrivacy">保存</button>
        </view>
      </view>
    </view>

    <view class="modal" v-if="showRecallTimeSelect" @click.self="showRecallTimeSelect = false">
      <view class="modal-content select-modal">
        <view class="modal-title">选择自动撤回时间</view>
        <view class="modal-body">
          <view 
            v-for="option in recallTimeOptions" 
            :key="option.value"
            class="select-option"
            :class="{ active: privacy.autoRecall === option.value }"
            @click="selectRecallTime(option.value)"
          >
            <text>{{ option.label }}</text>
            <text v-if="privacy.autoRecall === option.value" class="check-icon">✓</text>
          </view>
        </view>
      </view>
    </view>

    <view class="modal" v-if="showDestroyTimeSelect" @click.self="showDestroyTimeSelect = false">
      <view class="modal-content select-modal">
        <view class="modal-title">选择销毁时间</view>
        <view class="modal-body">
          <view 
            v-for="option in destroyTimeOptions" 
            :key="option.value"
            class="select-option"
            :class="{ active: privacy.autoDestroy === option.value }"
            @click="selectDestroyTime(option.value)"
          >
            <text>{{ option.label }}</text>
            <text v-if="privacy.autoDestroy === option.value" class="check-icon">✓</text>
          </view>
        </view>
      </view>
    </view>

    <view class="call-modal" v-if="showCallPrice" @click.self="showCallPrice = false">
      <view class="call-modal-content">
        <view class="call-modal-body">
          <view class="price-card">
            <view class="price-card-label">每分钟费用</view>
            <view class="price-card-row">
              <text class="price-card-coin">🪙</text>
              <!-- H5 保留 number input；App 用 digit 才能输入小数（通话单价可能带小数） -->
              <input v-if="!isApp" type="number" class="price-card-input" v-model.number="callPriceValue" min="0" placeholder="0" />
              <input v-else type="digit" class="price-card-input" v-model.number="callPriceValue" placeholder="0" />
              <text class="price-card-unit">金币</text>
            </view>
          </view>
          <view class="call-toggle-row">
            <view class="call-toggle-info">
              <text class="call-toggle-icon">{{ callPriceType === 'voice' ? '🎤' : '📹' }}</text>
              <text class="call-toggle-text">启用{{ callPriceType === 'voice' ? '语音' : '视频' }}通话</text>
            </view>
            <!-- H5 保留原生 checkbox + 自定义滑块；App 端原生 checkbox 在 webview 里可能不可交互，改 uni switch -->
            <label v-if="!isApp" class="call-toggle">
              <input type="checkbox" v-model="callPriceEnabled" />
              <text class="call-toggle-slider"></text>
            </label>
            <switch v-else class="call-switch" :checked="callPriceEnabled" color="#667eea" @change="onCallPriceSwitch" />
          </view>
        </view>
        <view class="call-modal-footer">
          <button class="call-btn call-btn-cancel" @click="showCallPrice = false">取消</button>
          <button class="call-btn call-btn-confirm" @click="saveCallPrice">保存设置</button>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from '@/common/route'
import { useUserStore } from '../store/user-info'
import authService from '../services/authService'
import { STORAGE_KEYS } from '../common/constants'
import userPrefService from '../services/userPrefService'
import PageLayout from '../components/PageLayout.vue'
import { toast } from '../composables/useToast'
import { useNavAnimation } from '../composables/useNavAnimation'
import { isApp, isH5 } from '../common/platform'

// 本机存储读写：App 端 localStorage 不一定可用，统一 uni 存储优先、localStorage 兜底；
// 写失败只保留内存态，读失败返回 null，避免设置页因存储异常白屏
const readStorage = (key) => {
  try {
    if (typeof uni !== 'undefined' && typeof uni.getStorageSync === 'function') {
      const value = uni.getStorageSync(key)
      if (value !== '' && value !== null && value !== undefined) return value
    }
  } catch (e) { /* uni 存储不可用时回落到 localStorage */ }
  try {
    return localStorage.getItem(key)
  } catch (e) {
    return null
  }
}

const writeStorage = (key, value) => {
  try {
    if (typeof uni !== 'undefined' && typeof uni.setStorageSync === 'function') {
      uni.setStorageSync(key, value)
      return
    }
  } catch (e) { /* uni 存储不可用时回落到 localStorage */ }
  try {
    localStorage.setItem(key, value)
  } catch (e) { /* 存储不可用时只保留内存态 */ }
}

const removeStorage = (key) => {
  try {
    if (typeof uni !== 'undefined' && typeof uni.removeStorageSync === 'function') {
      uni.removeStorageSync(key)
      return
    }
  } catch (e) { /* uni 存储不可用时回落到 localStorage */ }
  try {
    localStorage.removeItem(key)
  } catch (e) { /* 忽略 */ }
}

// 深色主题只在 H5 用 documentElement 的 class 切换；App 端没有等价 DOM 能力，
// 但开关本身仍要走存储持久化（见 toggleDarkMode）
const applyDarkClass = (enabled) => {
  if (!isH5) return
  try {
    const root = typeof document !== 'undefined' ? document.documentElement : null
    if (!root || !root.classList) return
    if (enabled) root.classList.add('dark')
    else root.classList.remove('dark')
  } catch (e) { /* 主题类失败不影响开关持久化 */ }
}

const router = useRouter()
const { navAnimationEnabled, setNavAnimation } = useNavAnimation()
const toggleNavAnimation = () => setNavAnimation(!navAnimationEnabled.value)

const darkMode = ref(false)
const callSettings = ref({
  voice: false,
  video: false,
  voicePrice: 30,
  videoPrice: 60
})
const showCallPrice = ref(false)
const callPriceType = ref('voice')
const callPriceValue = ref(30)
const callPriceEnabled = ref(true)
// uni switch 的 change 回传 e.detail.value，同步回原 ref；H5 仍由 checkbox 的 v-model 负责
const onCallPriceSwitch = (e) => {
  callPriceEnabled.value = !!e.detail.value
}
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
  { label: '20秒后', value: 20 },
  { label: '30秒后', value: 30 },
  { label: '1分钟后', value: 60 }
]

// 历史档位（5/10/300 秒）已下线：加载时归一到当前档位，避免设置页显示空值
const normalizeDestroySeconds = (value) => {
  const seconds = Number(value) || 0
  if (destroyTimeOptions.some((o) => o.value === seconds)) return seconds
  if (seconds <= 0) return 0
  if (seconds <= 20) return 20
  return 60
}

const toggleDarkMode = () => {
  darkMode.value = !darkMode.value
  writeStorage('darkMode', darkMode.value ? 'true' : 'false')
  applyDarkClass(darkMode.value)
}

const saveNotification = async () => {
  // 本地离线兜底 + 服务端偏好（跨设备生效）；通知开关后续由推送/通知中心消费
  writeStorage('notifications', JSON.stringify(notifications.value))
  try {
    await userPrefService.save({ notifications: { ...notifications.value } })
  } catch (error) {
    console.error('保存通知设置失败:', error)
    toast.error('保存到服务端失败，已先保存在本机')
    showNotification.value = false
    return
  }
  toast.success('消息通知设置已保存')
  showNotification.value = false
}

const savePrivacy = async () => {
  // 本地只作离线兜底：时间自动撤回/已读销毁需要服务端在收发时写 expire_at/destroy_at，
  // 四个隐私开关（在线/位置/访客/被搜索）也由服务端消费，必须持久化到 xn_user_pref。
  writeStorage('privacy', JSON.stringify(privacy.value))
  try {
    await userPrefService.save({
      privacy: {
        autoRecall: privacy.value.autoRecall,
        autoDestroy: privacy.value.autoDestroy,
        // C-9：4 个开关不再是本地展示态
        showOnline: !!privacy.value.showOnline,
        showLocation: !!privacy.value.showLocation,
        allowVisit: !!privacy.value.allowVisit,
        allowSearch: !!privacy.value.allowSearch
      }
    })
  } catch (e) {
    toast.error('设置已保存到本机，服务端同步失败，请稍后重试')
    return
  }
  toast.success('隐私设置已保存')
  showPrivacy.value = false
}

const changePassword = async () => {
  if (!oldPwd.value) {
    toast.error('请输入旧密码')
    return
  }
  if (!newPwd.value || newPwd.value.length < 6) {
    toast.error('新密码至少6位')
    return
  }
  if (newPwd.value !== confirmPwd.value) {
    toast.error('两次输入的密码不一致')
    return
  }

  try {
    await authService.changePassword(oldPwd.value, newPwd.value)
  } catch (e) {
    toast.error(e?.message || '密码修改失败')
    return
  }

  toast.success('密码修改成功，请重新登录')
  showChangePwd.value = false
  oldPwd.value = ''
  newPwd.value = ''
  confirmPwd.value = ''

  // 服务端已吊销该账号全部会话（含 refresh），本地清态后回登录页
  try { await userStore.logout() } catch (e) { /* 已全端下线，登出请求失败不阻塞 */ }
  router.replace('/login')
}

onMounted(() => {
  const savedDarkMode = readStorage('darkMode')
  if (savedDarkMode === 'true') {
    darkMode.value = true
    applyDarkClass(true)
  }
  
  const savedNotifications = readStorage('notifications')
  if (savedNotifications) {
    try {
      notifications.value = JSON.parse(savedNotifications)
    } catch (e) { /* 本机值损坏时沿用默认值 */ }
  }
  
  const savedPrivacy = readStorage('privacy')
  if (savedPrivacy) {
    try {
      privacy.value = JSON.parse(savedPrivacy)
      privacy.value.autoDestroy = normalizeDestroySeconds(privacy.value.autoDestroy)
    } catch (e) { /* 本机值损坏时沿用默认值 */ }
  }

  // 服务端偏好优先（跨设备）：时间自动撤回/已读销毁以服务端为准，本地值仅作离线兜底
  userPrefService.get().then((res) => {
    const prefs = (res && res.data && res.data.data) || {}
    if (prefs.privacy && typeof prefs.privacy === 'object') {
      Object.assign(privacy.value, prefs.privacy)
      privacy.value.autoDestroy = normalizeDestroySeconds(privacy.value.autoDestroy)
    }
    if (prefs.notifications && typeof prefs.notifications === 'object') {
      Object.assign(notifications.value, prefs.notifications)
    }
  }).catch(() => { /* 离线时沿用本机值 */ })
  
  const savedCallSettings = readStorage('callSettings')
  if (savedCallSettings) {
    try {
      callSettings.value = JSON.parse(savedCallSettings)
    } catch (e) { /* 本机值损坏时沿用默认值 */ }
  }
})

watch(callSettings, (val) => {
  writeStorage('callSettings', JSON.stringify(val))
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

const cacheSize = ref('128.5 MB')

const clearCache = () => {
  try {
    ;['searchHistory', 'notification_list', 'preferred_message_state'].forEach(k => removeStorage(k))
    cacheSize.value = '0 MB'
    toast.success('缓存已清理')
  } catch (e) {
    toast.error('清理失败')
  }
}

const goFeedback = () => {  router.push('/feedback')
}

const sendCode = () => {
  if (codeCount.value > 0) return
  if (!phone.value || phone.value.length !== 11) {
    toast.error('请输入正确的手机号')
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
    toast.error('请填写完整信息')
    return
  }
  toast.success('手机号更换成功！')
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
  if (callPriceType.value === 'voice') {
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
    if (callPriceType.value === 'voice') {
      callPriceValue.value = settings.voicePrice
      callPriceEnabled.value = settings.voice
    } else {
      callPriceValue.value = settings.videoPrice
      callPriceEnabled.value = settings.video
    }
  }
})

const performLogout = () => {
  userStore.logout()
  removeStorage(STORAGE_KEYS.TOKEN)
  removeStorage(STORAGE_KEYS.PINIA_STATE)
  router.push('/login')
}

const handleLogout = () => {
  // App 原生端没有 window.confirm：用 uni.showModal 二次确认；H5 保持 confirm 原逻辑
  if (isApp) {
    uni.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res && res.confirm) performLogout()
      }
    })
    return
  }
  if (confirm('确定要退出登录吗？')) performLogout()
}
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
  padding: 20px 0;
}

.section {
  background: white;
  /* 去掉左右 margin，水平铺满页面限制框 */
  margin: 12px 0 0;
  border-radius: 0px;
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
  border-radius: 14px;
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
  background: var(--gradient-primary);
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
  border-radius: 16px;
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
  border-radius: 14px;
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
  color: var(--color-primary);
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
  border-radius: 14px;
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

/* App 端 switch 与右侧自定义开关占位一致，去掉默认外边距 */
.call-switch {
  margin: 0;
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
  background: var(--gradient-primary);
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
  background: var(--gradient-primary);
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
  background: var(--gradient-primary);
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
  color: var(--color-primary);
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
  color: var(--color-primary);
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
  color: var(--color-primary);
  font-weight: bold;
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
  color: var(--color-primary);
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
  color: var(--color-primary);
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
</style>
