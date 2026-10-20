<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">申请服务</text>
      <text class="placeholder"></text>
    </template>

    <view class="service-tabs">
      <button 
        :class="['tab-btn', { active: activeTab === 'online' }]" 
        @click="activeTab = 'online'"
      >
        <text class="tab-icon">💻</text>
        <text class="tab-text">线上陪玩</text>
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'offline' }]" 
        @click="activeTab = 'offline'"
      >
        <text class="tab-icon">🏃</text>
        <text class="tab-text">线下陪伴</text>
      </button>
    </view>

    <view class="selection-tip">
      <view class="selection-text">请阅读协议后再选择服务</view>
      <view class="agreement-container">
        <view class="agreement-item">
          <input type="checkbox" class="agreement-checkbox" v-model="currentAgreement.agreeRegister" :id="activeTab + '-register-agreement'" />
          <label :for="activeTab + '-register-agreement'" class="agreement-label">
            同意
            <text class="agreement-link">用户注册协议</text>
          </label>
        </view>
        <view class="agreement-item">
          <input type="checkbox" class="agreement-checkbox" v-model="currentAgreement.agreePrivacy" :id="activeTab + '-privacy-agreement'" />
          <label :for="activeTab + '-privacy-agreement'" class="agreement-label">
            <text class="agreement-link">隐私保护政策</text>
          </label>
        </view>
        <view class="agreement-item">
          <input type="checkbox" class="agreement-checkbox" v-model="currentAgreement.agreeMinor" :id="activeTab + '-minor-agreement'" />
          <label :for="activeTab + '-minor-agreement'" class="agreement-label">
            <text class="agreement-link">未成年人保护</text>
          </label>
        </view>
      </view>
    </view>

    <view class="service-content" v-show="activeTab === 'online'">
      <OnlineCompanion v-model="selectedOnlineIds" @change="onOnlineServicesChange" :class="{ 'disabled-content': !isAgreementAccepted }" />
      <view class="agreement-overlay" v-if="!isAgreementAccepted"></view>
      <view class="offline-actions" v-if="selectedOnlineIds.length > 0 && isAgreementAccepted">
        <button class="confirm-btn" @click="openOnlineApplyModal">
          申请认证 (已选 {{ selectedOnlineIds.length }} 项)
        </button>
      </view>
    </view>

    <view class="service-content" v-show="activeTab === 'offline'">
      <OfflineCompanion v-model="selectedOfflineIds" @change="onOfflineServicesChange" :class="{ 'disabled-content': !isAgreementAccepted }" />
      <view class="agreement-overlay" v-if="!isAgreementAccepted"></view>
      <view class="offline-actions" v-if="selectedOfflineIds.length > 0 && isAgreementAccepted">
        <button class="confirm-btn" @click="openOfflineApplyModal">
          申请认证 (已选 {{ selectedOfflineIds.length }} 项)
        </button>
      </view>
    </view>

    <view class="modal-overlay" v-if="showCompanionModal" @click="closeCompanionModal">
      <view class="modal-content apply-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-close" @click="closeCompanionModal">✕</text>
          <text class="modal-title">申请认证</text>
          <text style="width: 30px;"></text>
        </view>
        <view class="modal-body apply-body">
          <OnlineApplyForm
            v-if="selectedService?.category === 'online'"
            v-model="formData"
            :is-recording="isRecording"
            :record-duration="recordDuration"
            :audio-playing="audioPlaying"
            @open-picker="openPicker"
            @image-upload="handleImageUpload"
            @toggle-recording="toggleRecording"
            @delete-audio="deleteAudio"
            @toggle-audio-play="toggleAudioPreview"
            @submit="submitForm"
          />
          <OfflineApplyForm
            v-else
            v-model="formData"
            :is-recording="isRecording"
            :record-duration="recordDuration"
            :audio-playing="audioPlaying"
            @open-picker="openPicker"
            @image-upload="handleImageUpload"
            @toggle-recording="toggleRecording"
            @delete-audio="deleteAudio"
            @toggle-audio-play="toggleAudioPreview"
            @submit="submitForm"
          />
        </view>
      </view>
    </view>

    <view class="modal-overlay" v-if="showCityPicker || showLevelPicker || showSkillPicker || showZonePicker || showPositionPicker || showTypePicker" @click="closeAllPickers">
      <view class="modal-content picker-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-close" @click="closeAllPickers">✕</text>
          <text class="modal-title">{{ pickerTitle }}</text>
          <text style="width: 30px;"></text>
        </view>
        <view class="modal-body picker-body">
          <view class="picker-list">
            <view 
              v-for="item in pickerOptions" 
              :key="item.value" 
              :class="['picker-item', { active: getPickerValue() === item.value }]"
              @click="selectPickerItem(item)"
            >
              {{ item.label }}
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="modal-overlay" v-if="showDetailModal" @click="closeDetailModal">
      <view class="modal-content detail-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-close" @click="closeDetailModal">✕</text>
          <text class="modal-title">陪玩师详情</text>
          <text style="width: 30px;"></text>
        </view>
        <view class="modal-body detail-body" v-if="selectedCompanion">
          <view class="detail-header">
            <view class="detail-avatar-wrap">
              <image mode="aspectFill" :src="selectedCompanion.avatar" class="detail-avatar" />
              <text v-if="selectedCompanion.isOnline" class="online-dot"></text>
            </view>
            <view class="detail-info">
              <view class="detail-name">
                {{ selectedCompanion.nickName }}
                <text v-if="selectedCompanion.vip" class="vip-badge">VIP</text>
              </view>
              <view class="detail-meta">
                <text>Lv.{{ selectedCompanion.level }}</text>
                <text>{{ selectedCompanion.gameName }}</text>
              </view>
            </view>
          </view>
          <view class="stats-row">
            <view class="stat">
              <view class="stat-value">{{ selectedCompanion.rating }}</view>
              <view class="stat-label">评分</view>
            </view>
            <view class="stat">
              <view class="stat-value">{{ selectedCompanion.orders }}</view>
              <view class="stat-label">接单数</view>
            </view>
            <view class="stat">
              <view class="stat-value">{{ selectedCompanion.isOnline ? '在线' : '离线' }}</view>
              <view class="stat-label">状态</view>
            </view>
          </view>
          <view class="detail-section">
            <view class="section-title">服务标签</view>
            <view class="tags-wrap">
              <text v-for="tag in selectedCompanion.tags" :key="tag" class="tag">{{ tag }}</text>
            </view>
          </view>
          <view class="detail-section">
            <view class="section-title">价格</view>
            <view class="price-wrap">
              <text class="price-symbol">¥</text>
              <text class="price-value">{{ selectedCompanion.price }}</text>
              <text class="price-unit">/{{ selectedService?.category === 'online' ? '小时' : '次' }}</text>
            </view>
          </view>
          <view class="action-buttons">
            <button class="action-btn" @click="sendMessage(selectedCompanion)">💬 聊天</button>
            <button class="action-btn primary" @click="confirmBook(selectedCompanion)">立即预约</button>
          </view>
        </view>
      </view>
    </view>

    <view class="toast-overlay" v-if="showToast">{{ toastMessage }}</view>
    
    <view class="permission-guide-container">
      <view class="permission-guide-overlay" v-if="showPermissionGuide">
        <view class="permission-guide-modal">
          <view class="guide-header">
            <text class="guide-icon">🎤</text>
            <h3 class="guide-title">麦克风权限</h3>
          </view>
          
          <view class="guide-content">
            <view class="guide-message">{{ permissionError.message }}</view>
            
            <view class="guide-steps" v-if="permissionError.errorType === 'denied'">
              <view class="steps-title">如何开启权限：</view>
              <view 
                v-for="(step, index) in getPermissionGuideSteps('microphone')" 
                :key="index" 
                class="step-item"
              >
                <text class="step-number">{{ step.step }}</text>
                <text class="step-icon">{{ step.icon }}</text>
                <text class="step-text">{{ step.text }}</text>
              </view>
            </view>
            
            <view class="guide-alternative">
              <view class="alternative-title">或者您也可以：</view>
              <view class="alternative-actions">
                <button 
                  class="continue-btn"
                  @click="showPermissionGuide = false"
                >
                  不使用麦克风继续
                </button>
              </view>
            </view>
          </view>
          
          <view class="guide-footer">
            <button class="close-btn" @click="showPermissionGuide = false">关闭</button>
          </view>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import OnlineCompanion from './OnlineCompanion.vue'
import OfflineCompanion from './OfflineCompanion.vue'
import OnlineApplyForm from './OnlineApplyForm.vue'
import OfflineApplyForm from './OfflineApplyForm.vue'
import { usePermissions } from '../composables/usePermissions'
import PageLayout from '../components/PageLayout.vue'
import regionService from '../services/regionService'
import gamesService from '../services/gamesService'
import { uploadFile } from '../services/uploadService'
import { isApp } from '../common/platform'
import audioRecorder from '../services/audioRecorder'

const { 
  requestMicrophonePermission,
  getPermissionGuideSteps 
} = usePermissions()

const activeTab = ref('online')
const showCompanionModal = ref(false)
const showDetailModal = ref(false)
const selectedService = ref(null)
const submitting = ref(false)
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

// App 端原生录音的本地临时文件：试听与上传都直接用它；H5 仍是 blob -> File 转换
const appVoiceFile = ref(null)
const audioPlaying = ref(false)
let appAudioPlayer = null

const showCityPicker = ref(false)
const showLevelPicker = ref(false)
const showSkillPicker = ref(false)
const showZonePicker = ref(false)
const showPositionPicker = ref(false)
const showTypePicker = ref(false)

const currentPicker = ref('')

const cityOptions = ref([])

// 从 API 加载省份列表作为城市选项
const loadCities = async () => {
  try {
    const res = await regionService.getProvinces()
    if (res.code === 0 || res.code === 200) {
      const cities = res.data || res.list || []
      cityOptions.value = cities.map(c => ({
        value: c.code || c.id,
        label: c.name
      }))
    }
  } catch (e) {
    console.error('加载城市失败:', e)
  }
}

onMounted(() => {
  loadCities()
})

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

// 把 dataURL / blob URL 还原为 File，便于直传
const urlToFile = async (url, name) => {
  if (url.startsWith('data:')) {
    const [meta, b64] = url.split(',')
    const mime = (meta.match(/:(.*?);/) || [])[1] || 'application/octet-stream'
    const bin = atob(b64)
    const arr = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
    return new File([arr], name, { type: mime })
  }
  const blob = await (await fetch(url)).blob()
  return new File([blob], name, { type: blob.type || 'application/octet-stream' })
}

const submitForm = async () => {
  // 检查当前标签的协议状态
  if (!currentAgreement.value.agreeRegister || !currentAgreement.value.agreePrivacy || !currentAgreement.value.agreeMinor) {
    showToastMsg('请先同意所有协议')
    return
  }
  
  if (!formData.value.skillIntro) {
    showToastMsg('请填写技能介绍')
    return
  }

  const gameId = selectedService.value?.gameId || selectedService.value?.id
  if (!gameId) {
    showToastMsg('请选择要申请的游戏')
    return
  }

  if (!formData.value.price || Number(formData.value.price) <= 0) {
    showToastMsg('请输入有效的价格')
    return
  }

  if (submitting.value) return
  submitting.value = true

  try {
    // 图片/语音先直传 COS 换取真实 URL，再提交（此前只存本地 base64/blob）
    let imageUrl = formData.value.imageUrl || ''
    if (imageUrl && (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:'))) {
      const f = await urlToFile(imageUrl, `apply_${Date.now()}.jpg`)
      const r = await uploadFile(f, 'image')
      imageUrl = r.data.url
    }
    let voiceIntro = formData.value.audioUrl || ''
    if (isApp) {
      // App 端 audioUrl 是 uni 录音产出的本地临时路径，直接交给 uploadFile 的
      // App 分支（取 file.path）；缺少对应临时文件时不要把本地路径提交给后端
      if (appVoiceFile.value && voiceIntro) {
        const r = await uploadFile(appVoiceFile.value, 'audio')
        voiceIntro = r.data.url
        // 回写真实 URL：此后重试提交不会再把本地临时路径当音频，也不会重复上传
        formData.value.audioUrl = voiceIntro
        appVoiceFile.value = null
      } else if (voiceIntro && !/^https?:/i.test(voiceIntro)) {
        voiceIntro = ''
      }
    } else if (voiceIntro && voiceIntro.startsWith('blob:')) {
      const f = await urlToFile(voiceIntro, `voice_${Date.now()}.webm`)
      const r = await uploadFile(f, 'audio')
      voiceIntro = r.data.url
    }

    await gamesService.applyCompanion({
      gameId: Number(gameId),
      serviceType: selectedService.value?.category || 'online',
      price: Number(formData.value.price),
      tags: (selectedService.value?.tags || []).join(','),
      description: formData.value.skillIntro,
      icon: imageUrl,
      voiceIntro,
      voiceTime: voiceIntro ? recordDuration.value : 0
    })

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
  } catch (err) {
    showToastMsg(err.message || '提交失败，请稍后重试')
  } finally {
    submitting.value = false
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
  if (isApp) {
    // App 端没有 getUserMedia/MediaRecorder，且 usePermissions 的权限探测是浏览器实现，
    // 直接交给 audioRecorder，由原生录音器负责权限弹窗与失败回调
    const res = await audioRecorder.startRecord()
    if (!res.supported) {
      showToastMsg('当前环境不支持录音')
      return
    }
    if (!res.started) {
      showToastMsg(res.denied ? '麦克风权限被拒绝，请在系统设置中开启录音权限' : (res.message || '录音启动失败'))
      return
    }
    isRecording.value = true
    recordDuration.value = 0
    recordTimer = setInterval(() => {
      recordDuration.value++
      if (recordDuration.value >= 60) {
        stopRecording()
      }
    }, 1000)
    return
  }
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
  if (isApp) {
    if (recordTimer) {
      clearInterval(recordTimer)
      recordTimer = null
    }
    if (!isRecording.value) return
    isRecording.value = false
    // 原生 stop 是异步回调：拿到临时文件后写回 audioUrl 供试听，提交时再上传
    audioRecorder.stopRecord().then((file) => {
      if (!file) return
      appVoiceFile.value = file
      formData.value.audioUrl = file.path
      recordDuration.value = file.duration
    }).catch(() => { /* stopRecord 内部已兜底 resolve null */ })
    return
  }
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

// App 端试听：uni.createInnerAudioContext 播放本地临时文件；H5 由子组件 <audio controls> 负责
const stopAudioPreview = () => {
  if (appAudioPlayer) {
    try {
      if (typeof appAudioPlayer.stop === 'function') appAudioPlayer.stop()
    } catch (e) { /* 忽略 */ }
    try {
      if (typeof appAudioPlayer.destroy === 'function') appAudioPlayer.destroy()
    } catch (e) { /* 忽略 */ }
    appAudioPlayer = null
  }
  audioPlaying.value = false
}
const toggleAudioPreview = () => {
  if (!isApp) return
  const url = formData.value.audioUrl
  if (!url) return
  if (audioPlaying.value) {
    stopAudioPreview()
    return
  }
  if (typeof uni === 'undefined' || typeof uni.createInnerAudioContext !== 'function') {
    showToastMsg('语音播放失败')
    return
  }
  stopAudioPreview()
  const player = uni.createInnerAudioContext()
  appAudioPlayer = player
  player.src = url
  player.onEnded(() => {
    if (appAudioPlayer !== player) return
    appAudioPlayer = null
    audioPlaying.value = false
  })
  player.onError(() => {
    if (appAudioPlayer !== player) return
    stopAudioPreview()
    showToastMsg('语音播放失败')
  })
  audioPlaying.value = true
  try {
    player.play()
  } catch (e) {
    stopAudioPreview()
    showToastMsg('语音播放失败')
  }
}

const deleteAudio = () => {
  stopAudioPreview()
  appVoiceFile.value = null
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
    if (isApp) {
      // 关闭弹窗即丢弃本次录音，避免残留原生录音器占麦
      isRecording.value = false
      if (recordTimer) { clearInterval(recordTimer); recordTimer = null }
      audioRecorder.cancelRecord()
    } else {
      stopRecording()
    }
  }
  stopAudioPreview()
  appVoiceFile.value = null
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
    if (isApp) {
      // 切页时丢弃未提交的录音，原生录音器必须显式取消
      audioRecorder.cancelRecord()
    } else {
      stopRecording()
    }
  }
  stopAudioPreview()
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
.back-btn {
  font-size: 24px;
  color: white;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.placeholder {
  width: 40px;
}

.service-tabs {
  display: flex;
  gap: 12px;
  padding: 74px 16px 12px;
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
  border-radius: 0px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.tab-btn.active {
  background: var(--gradient-primary);
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
  margin: 10px 16px 10px;
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
  accent-color: var(--color-primary);
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
  padding: 24px 16px;
  height: 700px;
  position: relative;
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
  padding: 16px;
  background: white;
  border-radius: 0px;
  margin: 12px 0 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.confirm-btn {
  width: 100%;
  padding: 16px;
  background: var(--gradient-primary);
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
  color: var(--color-primary);
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
  color: var(--color-primary);
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
  border-radius: 0px;
  background: white;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.action-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.action-btn.primary {
  background: var(--gradient-primary);
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
  background: var(--gradient-primary);
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
  background: var(--color-primary);
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
</style>
