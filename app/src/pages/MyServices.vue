<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">‹</text>
      <text class="nav-title">我的服务</text>
      <text class="placeholder"></text>
    </template>

    <view class="service-list">
      <view 
        class="service-card" 
        v-for="(service, idx) in currentServices" 
        :key="service.id">
        <view class="service-header">
          <view class="service-info">
            <image mode="aspectFill" class="service-icon" :src="service.icon" alt="" />
            <view class="info">
              <view class="name">{{ service.name }}</view>
              <view class="game-name">{{ service.gameName }}</view>
            </view>
          </view>
          <view class="status-badge" :class="service.status">
            {{ getStatusText(service.status) }}
          </view>
        </view>

        <view class="service-desc">{{ service.description }}</view>

        <view class="service-tags">
          <text class="tag" v-for="(tag, tIdx) in service.tags" :key="tIdx">{{ tag }}</text>
        </view>

        <view class="service-footer">
          <view class="price">
            <text class="price-value">{{ service.price }} 金币</text>
            <text class="price-unit">/单</text>
          </view>
          <view class="stats">
            <text>📊 {{ service.orderCount }} 单</text>
            <text>⭐ {{ service.rating }}</text>
          </view>
        </view>

        <view class="service-actions">
          <button class="action-btn" @click="editService(service)">编辑</button>
          <button 
            class="action-btn" 
            :class="service.status === 'active' ? 'pause' : 'resume'"
            @click="toggleService(service)">
            {{ service.status === 'active' ? '暂停' : '开启' }}
          </button>
        </view>
      </view>

      <view v-if="currentServices.length === 0" class="empty-state">
        <view class="empty-icon">📭</view>
        <view class="empty-text">暂无服务</view>
        <view class="empty-hint">去申请服务开启你的陪玩之旅吧</view>
        <button class="empty-btn" @click="goApply">去申请</button>
      </view>
    </view>

    <view class="edit-modal" v-if="showEditModal" @click.self="closeEditModal">
      <view class="modal-content apply-modal">
        <view class="modal-header">
          <text class="modal-close" @click="closeEditModal">✕</text>
          <text class="modal-title">编辑服务</text>
          <text style="width: 30px;"></text>
        </view>

        <view class="modal-body apply-body">
          <view class="form-item">
            <label class="form-label">所在城市</label>
            <view class="form-select" @click="openPicker('city')">
              {{ getCityLabel(editForm.city) || '请选择' }}
              <text class="select-arrow">›</text>
            </view>
          </view>

          <view class="form-item" v-if="activeTab === 'online'">
            <label class="form-label">技能等级</label>
            <view class="form-select" @click="openPicker('level')">
              {{ getLevelLabel(editForm.level) || '请选择' }}
              <text class="select-arrow">›</text>
            </view>
          </view>

          <view class="form-item">
            <label class="form-label">上传图片（禁止盗用他人图片，发现将封号）</label>
            <input type="file" ref="cameraInput" accept="image/*" capture="environment" style="display: none" @change="onImageChange" />
            <input type="file" ref="galleryInput" accept="image/*" style="display: none" @change="onImageChange" />
            <view class="upload-area" @click="openIconPicker">
              <image mode="aspectFit" v-if="editForm.icon" :src="editForm.icon" class="upload-preview" />
              <template v-else>
                <view class="upload-icon">📷</view>
                <view class="upload-text">请上传与你技能等级相符的截图</view>
              </template>
            </view>
            <view class="image-source-menu" v-if="showSourceMenu">
              <view class="menu-mask" @click="showSourceMenu = false"></view>
              <view class="menu-content">
                <view class="menu-item" @click="selectCamera">
                  <text class="menu-icon">📷</text>
                  <text>拍照</text>
                </view>
                <view class="menu-item" @click="selectGallery">
                  <text class="menu-icon">🖼️</text>
                  <text>从相册选择</text>
                </view>
                <view class="menu-item cancel" @click="showSourceMenu = false">
                  <text>取消</text>
                </view>
              </view>
            </view>
          </view>

          <view class="form-item">
            <view class="form-label-row">
              <label class="form-label required">技能介绍</label>
              <text class="label-hint">（一句话介绍自己有助于展示）</text>
              <text class="select-btn" @click="openPicker('skill')">选择常用 ›</text>
            </view>
            <textarea class="form-textarea" v-model="editForm.description" placeholder="声音特点/擅长位置/KD,技术特点/娱乐/技术陪/聊天/唱歌等"></textarea>
          </view>

          <view class="form-item" v-if="activeTab === 'online'">
            <label class="form-label">擅长位置</label>
            <view class="form-select" @click="openPicker('position')">
              {{ getPositionLabel(editForm.position) || '请选择' }}
              <text class="select-arrow">›</text>
            </view>
          </view>

          <view class="form-item" v-if="activeTab === 'online'">
            <label class="form-label">陪玩类型</label>
            <view class="form-select" @click="openPicker('playType')">
              {{ getPlayTypeLabel(editForm.playType) || '请选择' }}
              <text class="select-arrow">›</text>
            </view>
          </view>

          <view class="form-item">
            <label class="form-label">设置价格(币/{{ activeTab === 'online' ? '小时' : '次' }})</label>
            <view class="form-input-wrap">
              <!-- H5 保留 number input；App 用 digit 才能输入小数价格 -->
              <input v-if="!isApp" type="number" class="form-input" v-model.number="editForm.price" placeholder="输入你的价格" />
              <input v-else type="digit" class="form-input" v-model.number="editForm.price" placeholder="输入你的价格" />
            </view>
          </view>

          <view class="form-item">
            <label class="form-label">语音介绍</label>
            <view class="audio-container">
              <view v-show="!editForm.audioUrl" :class="['record-area', { recording: isRecording }]" @click="toggleRecording">
                <view class="record-icon">🎤</view>
                <view class="record-text">{{ isRecording ? '录音中...' : '点击录音' }}</view>
                <view class="record-hint">{{ isRecording ? recordDuration + '秒' : '录制一段自我介绍' }}</view>
                <view class="record-wave" v-show="isRecording">
                  <text></text><text></text><text></text><text></text><text></text>
                </view>
              </view>
              <view v-show="editForm.audioUrl" class="audio-preview">
                <audio v-if="!isApp" :src="editForm.audioUrl" controls class="audio-player"></audio>
                <view v-else class="audio-player app-audio-player" @click="toggleAudioPreview">
                  {{ audioPlaying ? '⏸️ 播放中' : '🔊 点击试听' }}
                </view>
                <button class="delete-audio-btn" @click="deleteAudio">删除重录</button>
              </view>
            </view>
          </view>

          <view class="form-actions">
            <button class="cancel-btn" @click="closeEditModal">取消</button>
            <button class="submit-btn" @click="saveService">保存修改</button>
          </view>
        </view>
      </view>
    </view>

    <view class="picker-modal" v-if="showPicker" @click.self="closePicker">
      <view class="modal-content picker-modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-close" @click="closePicker">✕</text>
          <text class="modal-title">{{ pickerTitle }}</text>
          <text style="width: 30px;"></text>
        </view>
        <view class="modal-body picker-body">
          <view class="picker-list">
            <view 
              v-for="item in pickerOptions" 
              :key="item.value" 
              :class="['picker-item', { active: getPickerValue() === item.value }]"
              @click="selectPickerItem(item)">
              {{ item.label }}
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="permission-guide-container">
      <view class="permission-guide-overlay" v-if="showPermissionGuide">
        <view class="permission-guide-modal">
          <view class="guide-header">
            <text class="guide-icon">{{ permissionError.type === 'camera' ? '📷' : '🎤' }}</text>
            <h3 class="guide-title">{{ permissionError.type === 'camera' ? '相机权限' : '麦克风权限' }}</h3>
          </view>
          
          <view class="guide-content">
            <view class="guide-message">{{ permissionError.message }}</view>
            
            <view class="guide-steps" v-if="permissionError.errorType === 'denied'">
              <view class="steps-title">如何开启权限：</view>
              <view 
                v-for="(step, index) in getPermissionGuideSteps(permissionError.type)" 
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
                  class="alternative-btn"
                  @click="handlePermissionAlternative"
                  v-if="permissionError.type === 'camera'"
                >
                  从相册选择图片
                </button>
                <button 
                  class="continue-btn"
                  @click="handlePermissionContinue"
                >
                  不使用{{ permissionError.type === 'camera' ? '相机' : '麦克风' }}继续
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
import { useRouter } from '@/common/route'
import { usePermissions } from '../composables/usePermissions'
import PageLayout from '../components/PageLayout.vue'
import gamesService from '../services/gamesService'
import { uploadFile } from '../services/uploadService'
import { chooseImages } from '../services/mediaPicker'
import audioRecorder from '../services/audioRecorder'
import { isApp } from '../common/platform'
import { toast } from '../composables/useToast'

const router = useRouter()

const { 
  requestCameraPermission, 
  requestMicrophonePermission,
  getPermissionGuideSteps 
} = usePermissions()

const activeTab = ref('online')
const togglingId = ref(null)
const showEditModal = ref(false)
const showPicker = ref(false)
const currentPicker = ref('')
const cameraInput = ref(null)
const galleryInput = ref(null)
const pickedIconFile = ref(null)
const showSourceMenu = ref(false)
const showPermissionGuide = ref(false)
const permissionError = ref({ type: 'camera', errorType: 'denied', message: '' })

const isRecording = ref(false)
const recordDuration = ref(0)
const mediaRecorder = ref(null)
const audioChunks = ref([])
let recordTimer = null

// App 端原生录音的本地临时文件：试听与保存上传都直接用它；H5 仍是 blob -> File 转换
const appVoiceFile = ref(null)
const audioPlaying = ref(false)
let appAudioPlayer = null

const editForm = ref({
  id: null,
  name: '',
  description: '',
  level: '',
  position: '',
  playType: '',
  price: '',
  tags: [],
  icon: '',
  audioUrl: '',
  audioTime: 0,
  gameName: '',
  city: ''
})

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

const skillOptions = [
  { value: 'voice', label: '声音特点' },
  { value: 'position', label: '擅长位置' },
  { value: 'kd', label: 'KD战绩' },
  { value: 'tech', label: '技术特点' },
  { value: 'entertainment', label: '娱乐陪玩' },
  { value: 'tech_play', label: '技术陪玩' },
  { value: 'chat', label: '聊天陪伴' },
  { value: 'sing', label: '唱歌' }
]

const levelOptions = [
  { value: 'beginner', label: '新手' },
  { value: 'amateur', label: '业余' },
  { value: 'semi-pro', label: '半职业' },
  { value: 'professional', label: '职业' },
  { value: 'master', label: '大师' },
  { value: 'god', label: '王者' }
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
  const titleMap = {
    city: '所在城市',
    level: '技能等级',
    position: '擅长位置',
    playType: '陪玩类型',
    skill: '选择常用'
  }
  return titleMap[currentPicker.value] || ''
})

const pickerOptions = computed(() => {
  const optionMap = {
    city: cityOptions,
    level: levelOptions,
    position: positionOptions,
    playType: playTypeOptions,
    skill: skillOptions
  }
  return optionMap[currentPicker.value] || []
})

// 后端 CompanionProfile.status：1=审核中 2=接单中 3=已暂停
const mapService = (s) => ({
  id: s.serviceId,
  name: s.gameName ? `${s.gameName} 陪玩` : '陪玩服务',
  gameName: s.gameName,
  gameId: s.gameId,
  icon: s.serviceIcon || s.image,
  serviceType: s.serviceType === 'offline' ? 'offline' : 'online',
  audioUrl: s.voiceIntro || '',
  voiceTime: s.voiceTime || 0,
  description: (s.tags && s.tags.length) ? s.tags.join(' · ') : '暂无技能介绍',
  tags: s.tags || [],
  price: s.price,
  status: s.status === 2 ? 'active' : (s.status === 3 ? 'paused' : 'pending'),
  orderCount: s.orderCount,
  rating: s.rating,
  incomeTotal: s.incomeTotal
})

const services = ref([])

const currentServices = computed(() => services.value)

const loadServices = async () => {
  try {
    const res = await gamesService.getMyServices()
    services.value = (res.data?.list || []).map(mapService)
  } catch (err) {
    toast.error(err.message || '加载我的服务失败')
  }
}

const getStatusText = (status) => {
  const statusMap = {
    active: '接单中',
    paused: '已暂停',
    pending: '审核中'
  }
  return statusMap[status] || status
}

const getCityLabel = (value) => {
  const item = cityOptions.find(opt => opt.value === value)
  return item ? item.label : ''
}

const getLevelLabel = (value) => {
  const item = levelOptions.find(opt => opt.value === value)
  return item ? item.label : ''
}

const getPositionLabel = (value) => {
  const item = positionOptions.find(opt => opt.value === value)
  return item ? item.label : ''
}

const getPlayTypeLabel = (value) => {
  const item = playTypeOptions.find(opt => opt.value === value)
  return item ? item.label : ''
}

const getPickerValue = () => {
  return editForm.value[currentPicker.value]
}

const openPicker = (type) => {
  currentPicker.value = type
  showPicker.value = true
}

const closePicker = () => {
  showPicker.value = false
  currentPicker.value = ''
}

const selectPickerItem = (item) => {
  if (currentPicker.value === 'skill') {
    if (editForm.value.description) {
      editForm.value.description += '/' + item.label
    } else {
      editForm.value.description = item.label
    }
  } else {
    editForm.value[currentPicker.value] = item.value
  }
  closePicker()
}

const editService = (service) => {
  // 编辑弹窗沿用服务自身的类型（线上/线下），不再固定 online
  activeTab.value = service.serviceType || 'online'
  pickedIconFile.value = null
  stopAudioPreview()
  appVoiceFile.value = null
  editForm.value = {
    id: service.id,
    name: service.name,
    description: service.description,
    level: service.level || '',
    position: service.position || '',
    playType: service.playType || '',
    price: service.price,
    tags: [...(service.tags || [])],
    icon: service.icon,
    audioUrl: service.audioUrl || '',
    audioTime: service.voiceTime || 0,
    gameName: service.gameName || '',
    city: service.city || ''
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  pickedIconFile.value = null
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
  editForm.value = {
    id: null,
    name: '',
    description: '',
    level: '',
    position: '',
    playType: '',
    price: '',
    tags: [],
    icon: '',
    audioUrl: '',
    audioTime: 0,
    gameName: '',
    city: ''
  }
}

// 点上传区：H5 弹出自定义来源菜单；App 没有可靠的文件 input，直接走 mediaPicker（拍照/相册）
const openIconPicker = () => {
  if (isApp) { pickIconFromApp(); return }
  showSourceMenu.value = true
}

const pickIconFromApp = async () => {
  try {
    const { supported, files } = await chooseImages(1)
    if (supported && files.length) applyIconFile(files[0])
  } catch (err) {
    toast.error(err.message || '选择图片失败')
  }
}

// H5 与 App 共用：H5 传 File（保留 base64 预览），App 传 mediaPicker 的 { path, name, type, size }
const applyIconFile = (file) => {
  showSourceMenu.value = false
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    toast.error('图片大小不能超过5MB')
    return
  }
  if (isApp) {
    // App 端 FileReader 读不了 uni 临时文件：临时路径直接做预览，保存时再补传
    pickedIconFile.value = file
    editForm.value.icon = file.path
    return
  }
  const reader = new FileReader()
  reader.onload = (event) => {
    editForm.value.icon = event.target?.result
  }
  reader.readAsDataURL(file)
}

const onImageChange = (e) => {
  const file = e.target.files?.[0]
  applyIconFile(file)
}

const selectCamera = async () => {
  showSourceMenu.value = false

  // App 端没有可靠的相机权限弹窗和 <input capture>，统一交给 mediaPicker
  if (isApp) { pickIconFromApp(); return }
  
  const result = await requestCameraPermission()
  
  if (result.granted) {
    cameraInput.value?.click()
  } else {
    permissionError.value = {
      type: 'camera',
      errorType: result.error,
      message: result.message
    }
    showPermissionGuide.value = true
  }
}

const selectGallery = () => {
  showSourceMenu.value = false
  if (isApp) { pickIconFromApp(); return }
  galleryInput.value?.click()
}

const handlePermissionAlternative = () => {
  showPermissionGuide.value = false
  if (permissionError.value.type === 'camera') {
    galleryInput.value?.click()
  }
}

const handlePermissionContinue = () => {
  showPermissionGuide.value = false
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
      toast.error('当前环境不支持录音')
      return
    }
    if (!res.started) {
      toast.error(res.denied ? '麦克风权限被拒绝，请在系统设置中开启录音权限' : (res.message || '录音启动失败'))
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
        editForm.value.audioUrl = URL.createObjectURL(audioBlob)
        editForm.value.audioTime = recordDuration.value
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
    // 原生 stop 是异步回调：拿到临时文件后写回 audioUrl 供试听，保存时再上传
    audioRecorder.stopRecord().then((file) => {
      if (!file) return
      appVoiceFile.value = file
      editForm.value.audioUrl = file.path
      editForm.value.audioTime = file.duration
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

// App 端试听：uni.createInnerAudioContext 播放本地临时文件；H5 继续用子页面里的 <audio controls>
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
  const url = editForm.value.audioUrl
  if (!url) return
  if (audioPlaying.value) {
    stopAudioPreview()
    return
  }
  if (typeof uni === 'undefined' || typeof uni.createInnerAudioContext !== 'function') {
    toast.error('语音播放失败')
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
    toast.error('语音播放失败')
  })
  audioPlaying.value = true
  try {
    player.play()
  } catch (e) {
    stopAudioPreview()
    toast.error('语音播放失败')
  }
}
const deleteAudio = () => {
  stopAudioPreview()
  appVoiceFile.value = null
  const audioUrl = editForm.value.audioUrl
  editForm.value.audioUrl = ''
  editForm.value.audioTime = 0
  if (audioUrl && audioUrl.startsWith('blob:')) {
    setTimeout(() => {
      URL.revokeObjectURL(audioUrl)
    }, 100)
  }
}

// 把 dataURL / blob URL 还原为 File，便于直传（本地预览用的临时地址不能入库）
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

const saveService = async () => {
  if (!editForm.value.price || editForm.value.price <= 0) {
    toast.error('请输入有效的价格')
    return
  }

  const target = services.value.find(s => s.id === editForm.value.id)
  if (!target) return

  try {
    // 图片/语音先直传 COS 换取真实 URL，再提交（此前只存本地 base64/blob）
    let iconUrl = editForm.value.icon || ''
    if (isApp && pickedIconFile.value) {
      // App 端 icon 只是 uni 临时路径，保存时用原始临时文件补传
      const r = await uploadFile(pickedIconFile.value, 'image')
      iconUrl = r.data.url
    } else if (iconUrl && (iconUrl.startsWith('data:') || iconUrl.startsWith('blob:'))) {
      const f = await urlToFile(iconUrl, `service_${Date.now()}.jpg`)
      const r = await uploadFile(f, 'image')
      iconUrl = r.data.url
    }
    let voiceIntro = editForm.value.audioUrl || ''
    if (isApp) {
      // App 端录音是 uni 原生录音的本地临时路径，直接交给 uploadFile 的 App 分支
      // （取 file.path）；只有路径没有文件（异常中断/已被清理）时不提交本地路径
      if (appVoiceFile.value && voiceIntro) {
        const r = await uploadFile(appVoiceFile.value, 'audio')
        voiceIntro = r.data.url
        // 回写真实 URL：此后重试保存不会再把本地临时路径当音频，也不会重复上传
        editForm.value.audioUrl = voiceIntro
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
      edit: true,
      gameId: target.gameId,
      serviceType: activeTab.value,
      price: Number(editForm.value.price),
      tags: (target.tags || []).join(','),
      description: editForm.value.description || '',
      icon: iconUrl,
      voiceIntro,
      voiceTime: editForm.value.audioTime || 0
    })
    closeEditModal()
    toast.success('已提交，等待审核')
    loadServices()
  } catch (err) {
    toast.error(err.message || '保存失败')
  }
}

const toggleService = async (service) => {
  if (togglingId.value === service.id) return
  togglingId.value = service.id
  try {
    const res = await gamesService.toggleServiceStatus(service.id)
    const st = res.data?.status
    if (st === 2) service.status = 'active'
    else if (st === 3) service.status = 'paused'
    toast.success(st === 2 ? '已开启接单' : '已暂停接单')
  } catch (err) {
    toast.error(err.message || '操作失败')
  } finally {
    togglingId.value = null
  }
}

const goBack = () => {
  router.back()
}

const goApply = () => {
  router.push('/companion-apply')
}

onMounted(() => {
  loadServices()
})

onUnmounted(() => {
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
  const audioUrl = editForm.value.audioUrl
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
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
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

.placeholder {
  width: 40px;
}

.tabs {
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-top: 10px;
  margin-bottom: 10px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 32px;
  border-radius: 24px;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-item.active {
  background: var(--gradient-primary);
  color: white;
}

.tab-icon {
  font-size: 18px;
}

.service-list {
  padding: 16px;
}

.service-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.service-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.service-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: cover;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.game-name {
  font-size: 13px;
  color: #999;
}

.status-badge {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: rgba(76, 217, 100, 0.1);
  color: #4cd964;
}

.status-badge.paused {
  background: #f5f5f5;
  color: #999;
}

.service-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
}

.service-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.service-tags .tag {
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-primary);
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
}

.service-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price-value {
  font-size: 24px;
  font-weight: bold;
  color: #ff6b6b;
}

.price-unit {
  font-size: 13px;
  color: #999;
}

.stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
}

.service-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.action-btn {
  flex: 1;
  padding: 10px 0;
  border: 1px solid var(--color-primary);
  background: white;
  color: var(--color-primary);
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(102, 126, 234, 0.05);
}

.action-btn.pause {
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.action-btn.pause:hover {
  background: rgba(255, 107, 107, 0.05);
}

.action-btn.resume {
  border-color: #4cd964;
  color: #4cd964;
  background: rgba(76, 217, 100, 0.05);
}

.action-btn.resume:hover {
  background: rgba(76, 217, 100, 0.1);
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
  color: #999;
  margin-bottom: 24px;
}

.empty-btn {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 12px 40px;
  border-radius: 24px;
  font-size: 15px;
  cursor: pointer;
}

.edit-modal,
.picker-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-close {
  font-size: 24px;
  color: #999;
  cursor: pointer;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.modal-body {
  padding: 0;
}

.apply-body {
  padding: 16px;
}

.picker-body {
  padding: 16px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 10px;
  display: block;
}

.form-label.required::after {
  content: '*';
  color: #f5576c;
  margin-left: 4px;
}

.form-label-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.label-hint {
  font-size: 12px;
  color: #999;
}

.select-btn {
  margin-left: auto;
  font-size: 13px;
  color: var(--color-primary);
  cursor: pointer;
}

.form-select {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 12px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.select-arrow {
  font-size: 20px;
  color: #999;
}

.form-input-wrap {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 0 16px;
}

.form-input {
  width: 100%;
  padding: 12px 0;
  background: transparent;
  border: none;
  font-size: 14px;
  outline: none;
}

.form-textarea {
  width: 100%;
  padding: 12px 16px;
  background: #f8f9fa;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  min-height: 80px;
  resize: none;
  outline: none;
  box-sizing: border-box;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #ddd;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.upload-preview {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  object-fit: contain;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  color: #666;
}

.audio-container {
  height: 150px;
}

.audio-container .record-area,
.audio-container .audio-preview {
  height: 150px;
  box-sizing: border-box;
}

.record-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  background: var(--gradient-primary);
  border-radius: 12px;
  cursor: pointer;
  position: relative;
}

.record-area.recording {
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
}

.record-wave {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  will-change: transform;
}

.record-wave text {
  width: 4px;
  height: 24px;
  background: white;
  border-radius: 2px;
  animation: wave 0.5s ease-in-out infinite;
  transform-origin: center bottom;
}

.record-wave text:nth-child(2) { animation-delay: 0.1s; }
.record-wave text:nth-child(3) { animation-delay: 0.2s; }
.record-wave text:nth-child(4) { animation-delay: 0.3s; }
.record-wave text:nth-child(5) { animation-delay: 0.4s; }

@keyframes wave {
  0%, 100% { transform: scaleY(0.4); }
  50% { transform: scaleY(1); }
}

.audio-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.audio-player {
  width: 100%;
.audio-player {
  width: 100%;
}

/* App 端试听按钮：uni 没有可直接播放本地临时文件的 <audio>，走 innerAudioContext */
.app-audio-player {
  padding: 10px;
  text-align: center;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  color: #f5576c;
}

.delete-audio-btn {
  padding: 8px 16px;
  background: #f5576c;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

.record-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.record-text {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.record-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.picker-list {
  max-height: 300px;
  overflow-y: auto;
}

.picker-item {
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 15px;
  color: #333;
  cursor: pointer;
  margin-bottom: 4px;
  transition: all 0.2s;
}

.picker-item:hover {
  background: #f8f9fa;
}

.picker-item.active {
  background: var(--gradient-primary);
  color: white;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn {
  flex: 1;
  padding: 14px;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.submit-btn {
  flex: 1;
  padding: 14px;
  background: var(--gradient-primary);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.image-source-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.menu-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.menu-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 8px 0 24px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 24px;
  font-size: 16px;
  color: #333;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:active {
  background: #f5f5f5;
}

.menu-item.cancel {
  margin-top: 8px;
  border-top: 1px solid #f0f0f0;
  color: #999;
}

.menu-icon {
  font-size: 24px;
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
  z-index: 2000;
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

.alternative-btn {
  width: 100%;
  padding: 12px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.alternative-btn:active {
  opacity: 0.8;
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
