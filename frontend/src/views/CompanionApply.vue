<template>
  <div class="companion-apply-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">申请服务</span>
      <span style="width: 40px;"></span>
    </div>

    <div class="service-tabs">
      <button 
        :class="['tab-btn', { active: activeTab === 'online' }]" 
        @click="activeTab = 'online'"
      >
        <span class="tab-icon">💻</span>
        <span class="tab-text">线上陪玩</span>
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'offline' }]" 
        @click="activeTab = 'offline'"
      >
        <span class="tab-icon">🏃</span>
        <span class="tab-text">线下陪伴</span>
      </button>
    </div>

    <div class="selection-tip">
      <div class="selection-text">请阅读协议后再选择服务</div>
      <div class="agreement-container">
        <div class="agreement-item">
          <input type="checkbox" class="agreement-checkbox" v-model="currentAgreement.agreeRegister" :id="activeTab + '-register-agreement'" />
          <label :for="activeTab + '-register-agreement'" class="agreement-label">
            同意
            <span class="agreement-link">用户注册协议</span>
          </label>
        </div>
        <div class="agreement-item">
          <input type="checkbox" class="agreement-checkbox" v-model="currentAgreement.agreePrivacy" :id="activeTab + '-privacy-agreement'" />
          <label :for="activeTab + '-privacy-agreement'" class="agreement-label">
            <span class="agreement-link">隐私保护政策</span>
          </label>
        </div>
        <div class="agreement-item">
          <input type="checkbox" class="agreement-checkbox" v-model="currentAgreement.agreeMinor" :id="activeTab + '-minor-agreement'" />
          <label :for="activeTab + '-minor-agreement'" class="agreement-label">
            <span class="agreement-link">未成年人保护</span>
          </label>
        </div>
      </div>
    </div>

    <div class="service-content" v-show="activeTab === 'online'">
      <OnlineCompanion v-model="selectedOnlineIds" @change="onOnlineServicesChange" :class="{ 'disabled-content': !isAgreementAccepted }" />
      <div class="agreement-overlay" v-if="!isAgreementAccepted"></div>
      <div class="offline-actions" v-if="selectedOnlineIds.length > 0 && isAgreementAccepted">
        <button class="confirm-btn" @click="openOnlineApplyModal">
          申请认证 (已选 {{ selectedOnlineIds.length }} 项)
        </button>
      </div>
    </div>

    <div class="service-content" v-show="activeTab === 'offline'">
      <OfflineCompanion v-model="selectedOfflineIds" @change="onOfflineServicesChange" :class="{ 'disabled-content': !isAgreementAccepted }" />
      <div class="agreement-overlay" v-if="!isAgreementAccepted"></div>
      <div class="offline-actions" v-if="selectedOfflineIds.length > 0 && isAgreementAccepted">
        <button class="confirm-btn" @click="openOfflineApplyModal">
          申请认证 (已选 {{ selectedOfflineIds.length }} 项)
        </button>
      </div>
    </div>

    <div class="modal-overlay" v-if="showCompanionModal" @click="closeCompanionModal">
      <div class="modal-content apply-modal" @click.stop>
        <div class="modal-header">
          <span class="modal-close" @click="closeCompanionModal">✕</span>
          <span class="modal-title">申请认证</span>
          <span style="width: 30px;"></span>
        </div>
        <div class="modal-body apply-body">
          <OnlineApplyForm
            v-if="selectedService?.category === 'online'"
            v-model="formData"
            :is-recording="isRecording"
            :record-duration="recordDuration"
            @open-picker="openPicker"
            @image-upload="handleImageUpload"
            @toggle-recording="toggleRecording"
            @delete-audio="deleteAudio"
            @submit="submitForm"
          />
          <OfflineApplyForm
            v-else
            v-model="formData"
            :is-recording="isRecording"
            :record-duration="recordDuration"
            @open-picker="openPicker"
            @image-upload="handleImageUpload"
            @toggle-recording="toggleRecording"
            @delete-audio="deleteAudio"
            @submit="submitForm"
          />
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showCityPicker || showLevelPicker || showSkillPicker || showZonePicker || showPositionPicker || showTypePicker" @click="closeAllPickers">
      <div class="modal-content picker-modal" @click.stop>
        <div class="modal-header">
          <span class="modal-close" @click="closeAllPickers">✕</span>
          <span class="modal-title">{{ pickerTitle }}</span>
          <span style="width: 30px;"></span>
        </div>
        <div class="modal-body picker-body">
          <div class="picker-list">
            <div 
              v-for="item in pickerOptions" 
              :key="item.value" 
              :class="['picker-item', { active: getPickerValue() === item.value }]"
              @click="selectPickerItem(item)"
            >
              {{ item.label }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showDetailModal" @click="closeDetailModal">
      <div class="modal-content detail-modal" @click.stop>
        <div class="modal-header">
          <span class="modal-close" @click="closeDetailModal">✕</span>
          <span class="modal-title">陪玩师详情</span>
          <span style="width: 30px;"></span>
        </div>
        <div class="modal-body detail-body" v-if="selectedCompanion">
          <div class="detail-header">
            <div class="detail-avatar-wrap">
              <img :src="selectedCompanion.avatar" class="detail-avatar" />
              <span v-if="selectedCompanion.isOnline" class="online-dot"></span>
            </div>
            <div class="detail-info">
              <div class="detail-name">
                {{ selectedCompanion.nickName }}
                <span v-if="selectedCompanion.vip" class="vip-badge">VIP</span>
              </div>
              <div class="detail-meta">
                <span>Lv.{{ selectedCompanion.level }}</span>
                <span>{{ selectedCompanion.gameName }}</span>
              </div>
            </div>
          </div>
          <div class="stats-row">
            <div class="stat">
              <div class="stat-value">{{ selectedCompanion.rating }}</div>
              <div class="stat-label">评分</div>
            </div>
            <div class="stat">
              <div class="stat-value">{{ selectedCompanion.orders }}</div>
              <div class="stat-label">接单数</div>
            </div>
            <div class="stat">
              <div class="stat-value">{{ selectedCompanion.isOnline ? '在线' : '离线' }}</div>
              <div class="stat-label">状态</div>
            </div>
          </div>
          <div class="detail-section">
            <div class="section-title">服务标签</div>
            <div class="tags-wrap">
              <span v-for="tag in selectedCompanion.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
          <div class="detail-section">
            <div class="section-title">价格</div>
            <div class="price-wrap">
              <span class="price-symbol">¥</span>
              <span class="price-value">{{ selectedCompanion.price }}</span>
              <span class="price-unit">/{{ selectedService?.category === 'online' ? '小时' : '次' }}</span>
            </div>
          </div>
          <div class="action-buttons">
            <button class="action-btn" @click="sendMessage(selectedCompanion)">💬 聊天</button>
            <button class="action-btn primary" @click="confirmBook(selectedCompanion)">立即预约</button>
          </div>
        </div>
      </div>
    </div>

    <div class="toast-overlay" v-if="showToast">{{ toastMessage }}</div>
    
    <div class="permission-guide-container">
      <div class="permission-guide-overlay" v-if="showPermissionGuide">
        <div class="permission-guide-modal">
          <div class="guide-header">
            <span class="guide-icon">🎤</span>
            <h3 class="guide-title">麦克风权限</h3>
          </div>
          
          <div class="guide-content">
            <p class="guide-message">{{ permissionError.message }}</p>
            
            <div class="guide-steps" v-if="permissionError.errorType === 'denied'">
              <div class="steps-title">如何开启权限：</div>
              <div 
                v-for="(step, index) in getPermissionGuideSteps('microphone')" 
                :key="index" 
                class="step-item"
              >
                <span class="step-number">{{ step.step }}</span>
                <span class="step-icon">{{ step.icon }}</span>
                <span class="step-text">{{ step.text }}</span>
              </div>
            </div>
            
            <div class="guide-alternative">
              <div class="alternative-title">或者您也可以：</div>
              <div class="alternative-actions">
                <button 
                  class="continue-btn"
                  @click="showPermissionGuide = false"
                >
                  不使用麦克风继续
                </button>
              </div>
            </div>
          </div>
          
          <div class="guide-footer">
            <button class="close-btn" @click="showPermissionGuide = false">关闭</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import OnlineCompanion from './OnlineCompanion.vue'
import OfflineCompanion from './OfflineCompanion.vue'
import OnlineApplyForm from './OnlineApplyForm.vue'
import OfflineApplyForm from './OfflineApplyForm.vue'
import { usePermissions } from '../composables/usePermissions'
import { useLoginManager } from '../composables/useLoginManager'

const { 
  requestMicrophonePermission,
  getPermissionGuideSteps 
} = usePermissions()

const { requireLogin } = useLoginManager()

const activeTab = ref('online')
const showCompanionModal = ref(false)
const showDetailModal = ref(false)
const selectedService = ref(null)
const selectedCompanion = ref(null)
const selectedOfflineIds = ref([])
const selectedOfflineServices = ref([])
const selectedOnlineIds = ref([])
const selectedOnlineServices = ref([])
const showToast = ref(false)
const toastMessage = ref('')
const showPermissionGuide = ref(false)
const permissionError = ref({ type: 'microphone', errorType: 'denied', message: '' })

// 线上协议状态
const onlineAgreement = ref({
  agreeRegister: false,
  agreePrivacy: false,
  agreeMinor: false
})

// 线下协议状态
const offlineAgreement = ref({
  agreeRegister: false,
  agreePrivacy: false,
  agreeMinor: false
})

// 获取当前标签的协议状态
const currentAgreement = computed(() => {
  return activeTab.value === 'online' ? onlineAgreement.value : offlineAgreement.value
})

// 检查当前协议是否全部勾选
const isAgreementAccepted = computed(() => {
  const agreement = currentAgreement.value
  return agreement.agreeRegister && agreement.agreePrivacy && agreement.agreeMinor
})

const formData = ref({
  city: '',
  level: '',
  skillIntro: '',
  zone: '',
  position: '',
  playType: '',
  price: '',
  audioUrl: '',
  imageUrl: '',
  agreeRegister: false,
  agreePrivacy: false,
  agreeMinor: false
})

const isRecording = ref(false)
const recordDuration = ref(0)
const mediaRecorder = ref(null)
const audioChunks = ref([])
let recordTimer = null

const showCityPicker = ref(false)
const showLevelPicker = ref(false)
const showSkillPicker = ref(false)
const showZonePicker = ref(false)
const showPositionPicker = ref(false)
const showTypePicker = ref(false)

const currentPicker = ref('')

const cityOptions = [
  { value: 'beijing', label: '北京市' },
  { value: 'shanghai', label: '上海市' },
  { value: 'guangzhou', label: '广州市' },
  { value: 'shenzhen', label: '深圳市' },
  { value: 'chengdu', label: '成都市' },
  { value: 'hangzhou', label: '杭州市' },
  { value: 'wuhan', label: '武汉市' },
  { value: 'xian', label: '西安市' }
]

const levelOptions = [
  { value: 'beginner', label: '新手' },
  { value: 'amateur', label: '业余' },
  { value: 'semi-pro', label: '半职业' },
  { value: 'professional', label: '职业' },
  { value: 'master', label: '大师' },
  { value: 'god', label: '王者' }
]

const skillOptions = [
  { value: 'voice', label: '声音特点' },
  { value: 'position', label: '擅长位置' },
  { value: 'kd', label: 'KD' },
  { value: 'tech', label: '技术特点' },
  { value: 'entertainment', label: '娱乐' },
  { value: 'carry', label: '技术陪' },
  { value: 'chat', label: '聊天' },
  { value: 'sing', label: '唱歌' }
]

const zoneOptions = [
  { value: 'china-east', label: '华东大区' },
  { value: 'china-south', label: '华南大区' },
  { value: 'china-west', label: '西部大区' },
  { value: 'china-north', label: '华北大区' },
  { value: 'china-central', label: '华中大区' },
  { value: 'china-southwest', label: '西南大区' }
]

const positionOptions = [
  { value: 'top', label: '上路' },
  { value: 'jungle', label: '打野' },
  { value: 'mid', label: '中路' },
  { value: 'adc', label: 'ADC' },
  { value: 'support', label: '辅助' },
  { value: 'all', label: '全能' }
]

const playTypeOptions = [
  { value: 'entertainment', label: '娱乐陪玩' },
  { value: 'carry', label: '技术带飞' },
  { value: 'teaching', label: '教学指导' },
  { value: 'rank', label: '冲分陪练' },
  { value: 'chat', label: '聊天陪伴' }
]

const pickerTitle = computed(() => {
  const titles = {
    city: '选择城市',
    level: '选择技能等级',
    skill: '选择技能标签',
    zone: '选择接单大区',
    position: '选择擅长位置',
    playType: '选择陪玩类型'
  }
  return titles[currentPicker.value] || ''
})

const pickerOptions = computed(() => {
  const options = {
    city: cityOptions,
    level: levelOptions,
    skill: skillOptions,
    zone: zoneOptions,
    position: positionOptions,
    playType: playTypeOptions
  }
  return options[currentPicker.value] || []
})

const getPickerValue = () => {
  return formData.value[currentPicker.value] || ''
}

const selectPickerItem = (item) => {
  if (currentPicker.value === 'skill') {
    if (formData.value.skillIntro) {
      formData.value.skillIntro += '/' + item.label
    } else {
      formData.value.skillIntro = item.label
    }
  } else {
    formData.value[currentPicker.value] = item.value
  }
  closeAllPickers()
}

const closeAllPickers = () => {
  showCityPicker.value = false
  showLevelPicker.value = false
  showSkillPicker.value = false
  showZonePicker.value = false
  showPositionPicker.value = false
  showTypePicker.value = false
  currentPicker.value = ''
}

const submitForm = async () => {
  const loginResult = await requireLogin()
  if (!loginResult.loggedIn) {
    return
  }

  // 检查当前标签的协议状态
  if (!currentAgreement.value.agreeRegister || !currentAgreement.value.agreePrivacy || !currentAgreement.value.agreeMinor) {
    showToastMsg('请先同意所有协议')
    return
  }
  
  if (!formData.value.skillIntro) {
    showToastMsg('请填写技能介绍')
    return
  }
  showToastMsg('提交成功，等待审核')
  closeCompanionModal()
  formData.value = {
    city: '',
    level: '',
    skillIntro: '',
    zone: '',
    position: '',
    playType: '',
    price: '',
    imageUrl: '',
    audioUrl: '',
    agreeRegister: false,
    agreePrivacy: false,
    agreeMinor: false
  }
  // 清除协议勾选状态
  if (activeTab.value === 'online') {
    onlineAgreement.value = { agreeRegister: false, agreePrivacy: false, agreeMinor: false }
  } else {
    offlineAgreement.value = { agreeRegister: false, agreePrivacy: false, agreeMinor: false }
  }
}

const showToastMsg = (msg) => {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2000)
}

const openPicker = (type) => {
  currentPicker.value = type
  switch(type) {
    case 'city': showCityPicker.value = true; break
    case 'level': showLevelPicker.value = true; break
    case 'skill': showSkillPicker.value = true; break
    case 'zone': showZonePicker.value = true; break
    case 'position': showPositionPicker.value = true; break
    case 'playType': showTypePicker.value = true; break
  }
}

const handleImageUpload = (e) => {
  const file = e.target.files?.[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      showToastMsg('图片大小不能超过5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      formData.value.imageUrl = event.target?.result
    }
    reader.readAsDataURL(file)
  }
}

const toggleRecording = async () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

const startRecording = async () => {
  const result = await requestMicrophonePermission()
  
  if (!result.granted) {
    permissionError.value = {
      type: 'microphone',
      errorType: result.error,
      message: result.message
    }
    showPermissionGuide.value = true
    return
  }

  if (!window.MediaRecorder) {
    permissionError.value = {
      type: 'microphone',
      errorType: 'not_supported',
      message: '您的浏览器不支持录音功能'
    }
    showPermissionGuide.value = true
    return
  }

  try {
    if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
      mediaRecorder.value.stop()
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    })
    
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
    mediaRecorder.value = new MediaRecorder(stream, { mimeType })
    audioChunks.value = []
    
    mediaRecorder.value.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunks.value.push(e.data)
      }
    }
    
    mediaRecorder.value.onstop = () => {
      if (audioChunks.value.length > 0) {
        const audioBlob = new Blob(audioChunks.value, { type: mimeType })
        formData.value.audioUrl = URL.createObjectURL(audioBlob)
      }
      stream.getTracks().forEach(track => track.stop())
      audioChunks.value = []
    }
    
    mediaRecorder.value.onerror = (e) => {
      console.error('录音出错:', e)
      permissionError.value = {
        type: 'microphone',
        errorType: 'unknown',
        message: '录音出错，请重试'
      }
      showPermissionGuide.value = true
      stream.getTracks().forEach(track => track.stop())
      audioChunks.value = []
      isRecording.value = false
    }
    
    mediaRecorder.value.start(100)
    isRecording.value = true
    recordDuration.value = 0
    
    recordTimer = setInterval(() => {
      recordDuration.value++
      if (recordDuration.value >= 60) {
        stopRecording()
      }
    }, 1000)
  } catch (error) {
    console.error('麦克风权限错误:', error)
    
    permissionError.value = {
      type: 'microphone',
      errorType: 'unknown',
      message: error.message || '无法访问麦克风'
    }
    showPermissionGuide.value = true
    isRecording.value = false
  }
}

const stopRecording = () => {
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    try {
      mediaRecorder.value.stop()
    } catch (e) {
      console.warn('停止录音时出错:', e)
    }
  }
  if (recordTimer) {
    clearInterval(recordTimer)
    recordTimer = null
  }
  isRecording.value = false
}

const deleteAudio = () => {
  const audioUrl = formData.value.audioUrl
  formData.value.audioUrl = ''
  if (audioUrl && audioUrl.startsWith('blob:')) {
    setTimeout(() => {
      URL.revokeObjectURL(audioUrl)
    }, 100)
  }
}



const onServiceSelect = (service) => {
  selectedService.value = service
  showCompanionModal.value = true
}

const onOnlineServicesChange = (services) => {
  selectedOnlineServices.value = services
}

const openOnlineApplyModal = () => {
  if (selectedOnlineServices.value.length > 0) {
    selectedService.value = { ...selectedOnlineServices.value[0], category: 'online' }
    // 把线上协议状态同步到 formData
    formData.value.agreeRegister = onlineAgreement.value.agreeRegister
    formData.value.agreePrivacy = onlineAgreement.value.agreePrivacy
    formData.value.agreeMinor = onlineAgreement.value.agreeMinor
    showCompanionModal.value = true
  }
}

const onOfflineServicesChange = (services) => {
  selectedOfflineServices.value = services
}

const openOfflineApplyModal = () => {
  if (selectedOfflineServices.value.length > 0) {
    selectedService.value = { ...selectedOfflineServices.value[0], category: 'offline' }
    // 把线下协议状态同步到 formData
    formData.value.agreeRegister = offlineAgreement.value.agreeRegister
    formData.value.agreePrivacy = offlineAgreement.value.agreePrivacy
    formData.value.agreeMinor = offlineAgreement.value.agreeMinor
    showCompanionModal.value = true
  }
}

const goBack = () => {
  window.history.back()
}

const closeCompanionModal = () => {
  if (isRecording.value) {
    stopRecording()
  }
  const audioUrl = formData.value.audioUrl
  formData.value.audioUrl = ''
  showCompanionModal.value = false
  selectedService.value = null
  if (audioUrl && audioUrl.startsWith('blob:')) {
    setTimeout(() => {
      URL.revokeObjectURL(audioUrl)
    }, 100)
  }
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedCompanion.value = null
}

const sendMessage = (companion) => {
  showToastMessage('开始聊天：' + companion.nickName)
}

const confirmBook = (companion) => {
  showToastMessage('预约成功！即将为您安排：' + companion.nickName)
  closeDetailModal()
  closeCompanionModal()
}

const showToastMessage = (message) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2000)
}

onUnmounted(() => {
  // 清理录音相关资源
  if (isRecording.value) {
    stopRecording()
  }
  if (recordTimer) {
    clearInterval(recordTimer)
    recordTimer = null
  }
  // 延迟释放音频URL，避免页面切换时仍在使用
  const audioUrl = formData.value.audioUrl
  if (audioUrl && audioUrl.startsWith('blob:')) {
    setTimeout(() => {
      try {
        URL.revokeObjectURL(audioUrl)
      } catch (e) {
        console.warn('释放音频URL失败:', e)
      }
    }, 1000)
  }
})
</script>

<style scoped>
.companion-apply-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: #f5f5f5;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px) + 60px);
  padding-top: 82px;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: -webkit-linear-gradient(315deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 70px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 100;
  box-sizing: border-box;
}

.back-btn {
  font-size: 24px;
  color: white;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.title {
  font-size: 17px;
  font-weight: bold;
  color: white;
}

.service-tabs {
  display: flex;
  gap: 12px;
  padding: 12px;
  max-width: 100%;
  margin: 0 auto;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: white;
  border: none;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tab-icon {
  font-size: 20px;
}

.tab-text {
  font-size: 15px;
  font-weight: 600;
}

.selection-tip {
  margin: 10px auto;
  max-width: 650px;
  background: rgba(245, 108, 108, 0.1);
  border-radius: 12px;
  padding: 10px;
  height: 90px;
}

.agreement-container {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  height: 40px;
  padding-top: 10px;
  padding-bottom: 10px;
  border-top: 1px dashed rgba(245, 108, 108, 0.3);
}

.agreement-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agreement-item:last-child {
  margin-bottom: 0;
}

.agreement-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
}

.agreement-label {
  font-size: 14px;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.agreement-link {
  color: #f56c6c;
  text-decoration: underline;
  cursor: pointer;
}

.agreement-link:hover {
  color: #f093fb;
}

.selection-text {
  text-align: center;
  font-size: 14px;
  color: #f56c6c;
  font-weight: 500;
}

.service-content {
  padding: 24px 12px;
  min-height: 400px;
  position: relative;
  max-width: 650px;
  margin: 0 auto;
}

.disabled-content {
  pointer-events: none;
  opacity: 0.5;
}

.agreement-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
  border-radius: 16px;
}

.offline-actions {
  position: fixed;
  bottom: 60px;
  left: 0;
  right: 0;
  padding: 12px 20px;
  background: white;
  border-top: 1px solid #eee;
  z-index: 50;
  box-sizing: border-box;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 768px) {
  .offline-actions {
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
  }
}

@media (min-width: 1024px) {
  .offline-actions {
    max-width: 720px;
  }
}

.confirm-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 24px;
  width: 90%;
  max-width: 480px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-close {
  color: #999;
  cursor: pointer;
  font-size: 20px;
}

.modal-close:hover {
  color: #333;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.picker-modal {
  max-height: 60vh;
}

.picker-body {
  padding: 0;
}

.picker-list {
  padding: 8px 0;
}

.picker-item {
  padding: 16px 20px;
  font-size: 15px;
  color: #333;
  cursor: pointer;
  transition: background 0.2s;
}

.picker-item:hover {
  background: #f5f5f5;
}

.picker-item.active {
  background: #f0f5ff;
  color: #667eea;
}

.toast-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.detail-body {
  padding: 24px;
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-avatar-wrap {
  position: relative;
  margin-right: 16px;
}

.detail-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background: #10b981;
  border-radius: 50%;
  border: 2px solid white;
}

.detail-info {
  flex: 1;
}

.detail-name {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 6px;
}

.vip-badge {
  font-size: 12px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 8px;
}

.detail-meta {
  font-size: 13px;
  color: #666;
}

.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat {
  flex: 1;
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.detail-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  font-size: 11px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 10px;
  border-radius: 10px;
}

.price-wrap {
  display: flex;
  align-items: baseline;
}

.price-symbol {
  font-size: 18px;
  font-weight: 600;
  color: #f5576c;
}

.price-value {
  font-size: 32px;
  font-weight: 700;
  color: #f5576c;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.action-btn {
  flex: 1;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.action-btn.primary:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.toast-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 2000;
}

.permission-guide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2001;
  padding: 20px;
}

.permission-guide-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  animation: modalSlideUp 0.3s ease;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.guide-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.guide-icon {
  font-size: 32px;
}

.guide-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.guide-content {
  padding: 20px;
}

.guide-message {
  margin: 0 0 16px;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.guide-steps {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.steps-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
}

.step-item:last-child {
  margin-bottom: 0;
}

.step-number {
  width: 20px;
  height: 20px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.step-text {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.guide-alternative {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.alternative-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.alternative-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.continue-btn {
  width: 100%;
  padding: 12px;
  background: #f8f9fa;
  color: #666;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.continue-btn:active {
  background: #f0f0f0;
}

.guide-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #f0f0f0;
}

.close-btn {
  flex: 1;
  padding: 12px;
  background: white;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:active {
  background: #f5f5f5;
}

@media (min-width: 768px) {
  .companion-apply-page {
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
  .companion-apply-page {
    max-width: 720px;
  }
  .header {
    max-width: 720px;
  }
}
</style>
