<template>
  <div class="my-services-page">
    <div class="header">
      <div class="back-btn" @click="goBack">‹</div>
      <div class="title">我的服务</div>
      <div style="width: 40px;"></div>
    </div>

    <div class="tabs">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'online' }"
        @click="activeTab = 'online'">
        <span class="tab-icon">💻</span>
        <span>线上陪玩</span>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'offline' }"
        @click="activeTab = 'offline'">
        <span class="tab-icon">🏃</span>
        <span>线下陪伴</span>
      </div>
    </div>

    <div class="service-list">
      <div 
        class="service-card" 
        v-for="(service, idx) in currentServices" 
        :key="service.id">
        <div class="service-header">
          <div class="service-info">
            <img class="service-icon" :src="service.icon" alt="" />
            <div class="info">
              <div class="name">{{ service.name }}</div>
              <div class="game-name">{{ service.gameName }}</div>
            </div>
          </div>
          <div class="status-badge" :class="service.status">
            {{ getStatusText(service.status) }}
          </div>
        </div>

        <div class="service-desc">{{ service.description }}</div>

        <div class="service-tags">
          <span class="tag" v-for="(tag, tIdx) in service.tags" :key="tIdx">{{ tag }}</span>
        </div>

        <div class="service-footer">
          <div class="price">
            <span class="price-value">{{ service.price }} 金币</span>
            <span class="price-unit">/{{ activeTab === 'online' ? '小时' : '次' }}</span>
          </div>
          <div class="stats">
            <span>📊 {{ service.orderCount }} 单</span>
            <span>⭐ {{ service.rating }}</span>
          </div>
        </div>

        <div class="service-actions">
          <button class="action-btn" @click="editService(service)">编辑</button>
          <button 
            class="action-btn" 
            :class="service.status === 'active' ? 'pause' : 'resume'"
            @click="toggleService(service)">
            {{ service.status === 'active' ? '暂停' : '开启' }}
          </button>
        </div>
      </div>

      <div v-if="currentServices.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-text">暂无服务</div>
        <div class="empty-hint">去申请服务开启你的陪玩之旅吧</div>
        <button class="empty-btn" @click="goApply">去申请</button>
      </div>
    </div>

    <div class="edit-modal" v-if="showEditModal" @click.self="closeEditModal">
      <div class="modal-content apply-modal">
        <div class="modal-header">
          <span class="modal-close" @click="closeEditModal">✕</span>
          <span class="modal-title">编辑服务</span>
          <span style="width: 30px;"></span>
        </div>

        <div class="modal-body apply-body">
          <div class="form-item">
            <label class="form-label">所在城市</label>
            <div class="form-select" @click="openPicker('city')">
              {{ getCityLabel(editForm.city) || '请选择' }}
              <span class="select-arrow">›</span>
            </div>
          </div>

          <div class="form-item" v-if="activeTab === 'online'">
            <label class="form-label">技能等级</label>
            <div class="form-select" @click="openPicker('level')">
              {{ getLevelLabel(editForm.level) || '请选择' }}
              <span class="select-arrow">›</span>
            </div>
          </div>

          <div class="form-item">
            <label class="form-label">上传图片（禁止盗用他人图片，发现将封号）</label>
            <input type="file" ref="cameraInput" accept="image/*" capture="environment" style="display: none" @change="onImageChange" />
            <input type="file" ref="galleryInput" accept="image/*" style="display: none" @change="onImageChange" />
            <div class="upload-area" @click="showSourceMenu = true">
              <img v-if="editForm.icon" :src="editForm.icon" class="upload-preview" />
              <template v-else>
                <div class="upload-icon">📷</div>
                <div class="upload-text">请上传与你技能等级相符的截图</div>
              </template>
            </div>
            <div class="image-source-menu" v-if="showSourceMenu">
              <div class="menu-mask" @click="showSourceMenu = false"></div>
              <div class="menu-content">
                <div class="menu-item" @click="selectCamera">
                  <span class="menu-icon">📷</span>
                  <span>拍照</span>
                </div>
                <div class="menu-item" @click="selectGallery">
                  <span class="menu-icon">🖼️</span>
                  <span>从相册选择</span>
                </div>
                <div class="menu-item cancel" @click="showSourceMenu = false">
                  <span>取消</span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-item">
            <div class="form-label-row">
              <label class="form-label required">技能介绍</label>
              <span class="label-hint">（一句话介绍自己有助于展示）</span>
              <span class="select-btn" @click="openPicker('skill')">选择常用 ›</span>
            </div>
            <textarea class="form-textarea" v-model="editForm.description" placeholder="声音特点/擅长位置/KD,技术特点/娱乐/技术陪/聊天/唱歌等"></textarea>
          </div>

          <div class="form-item" v-if="activeTab === 'online'">
            <label class="form-label">擅长位置</label>
            <div class="form-select" @click="openPicker('position')">
              {{ getPositionLabel(editForm.position) || '请选择' }}
              <span class="select-arrow">›</span>
            </div>
          </div>

          <div class="form-item" v-if="activeTab === 'online'">
            <label class="form-label">陪玩类型</label>
            <div class="form-select" @click="openPicker('playType')">
              {{ getPlayTypeLabel(editForm.playType) || '请选择' }}
              <span class="select-arrow">›</span>
            </div>
          </div>

          <div class="form-item">
            <label class="form-label">设置价格(币/{{ activeTab === 'online' ? '小时' : '次' }})</label>
            <div class="form-input-wrap">
              <input type="number" class="form-input" v-model.number="editForm.price" placeholder="输入你的价格" />
            </div>
          </div>

          <div class="form-item">
            <label class="form-label">语音介绍</label>
            <div class="audio-container">
              <div v-show="!editForm.audioUrl" :class="['record-area', { recording: isRecording }]" @click="toggleRecording">
                <div class="record-icon">🎤</div>
                <div class="record-text">{{ isRecording ? '录音中...' : '点击录音' }}</div>
                <div class="record-hint">{{ isRecording ? recordDuration + '秒' : '录制一段自我介绍' }}</div>
                <div class="record-wave" v-show="isRecording">
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
              </div>
              <div v-show="editForm.audioUrl" class="audio-preview">
                <audio :src="editForm.audioUrl" controls class="audio-player"></audio>
                <button class="delete-audio-btn" @click="deleteAudio">删除重录</button>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button class="cancel-btn" @click="closeEditModal">取消</button>
            <button class="submit-btn" @click="saveService">保存修改</button>
          </div>
        </div>
      </div>
    </div>

    <div class="picker-modal" v-if="showPicker" @click.self="closePicker">
      <div class="modal-content picker-modal-content" @click.stop>
        <div class="modal-header">
          <span class="modal-close" @click="closePicker">✕</span>
          <span class="modal-title">{{ pickerTitle }}</span>
          <span style="width: 30px;"></span>
        </div>
        <div class="modal-body picker-body">
          <div class="picker-list">
            <div 
              v-for="item in pickerOptions" 
              :key="item.value" 
              :class="['picker-item', { active: getPickerValue() === item.value }]"
              @click="selectPickerItem(item)">
              {{ item.label }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="permission-guide-container">
      <div class="permission-guide-overlay" v-if="showPermissionGuide">
        <div class="permission-guide-modal">
          <div class="guide-header">
            <span class="guide-icon">{{ permissionError.type === 'camera' ? '📷' : '🎤' }}</span>
            <h3 class="guide-title">{{ permissionError.type === 'camera' ? '相机权限' : '麦克风权限' }}</h3>
          </div>
          
          <div class="guide-content">
            <p class="guide-message">{{ permissionError.message }}</p>
            
            <div class="guide-steps" v-if="permissionError.errorType === 'denied'">
              <div class="steps-title">如何开启权限：</div>
              <div 
                v-for="(step, index) in getPermissionGuideSteps(permissionError.type)" 
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissions } from '../composables/usePermissions'

const router = useRouter()

const { 
  requestCameraPermission, 
  requestMicrophonePermission,
  getPermissionGuideSteps 
} = usePermissions()

const activeTab = ref('online')
const showEditModal = ref(false)
const showPicker = ref(false)
const currentPicker = ref('')
const cameraInput = ref(null)
const galleryInput = ref(null)
const showSourceMenu = ref(false)
const showPermissionGuide = ref(false)
const permissionError = ref({ type: 'camera', errorType: 'denied', message: '' })

const isRecording = ref(false)
const recordDuration = ref(0)
const mediaRecorder = ref(null)
const audioChunks = ref([])
let recordTimer = null

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

const STORAGE_KEY = 'myServices'

const defaultServices = {
  online: [
    {
      id: 1,
      name: '王者荣耀排位',
      gameName: '王者荣耀',
      icon: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=200',
      description: '专业打野，快速上分，钻石到星耀',
      tags: ['打野', '排位', '上分'],
      price: 35,
      status: 'active',
      orderCount: 48,
      rating: 4.9,
      level: 'semi-pro',
      position: 'jungle',
      playType: 'carry',
      audioUrl: '',
      city: 'beijing'
    },
    {
      id: 2,
      name: '和平精英娱乐',
      gameName: '和平精英',
      icon: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200',
      description: '搞笑陪聊，带你躺赢，开心最重要',
      tags: ['娱乐', '聊天', '躺赢'],
      price: 25,
      status: 'active',
      orderCount: 32,
      rating: 4.8,
      level: 'amateur',
      position: 'all',
      playType: 'entertainment',
      audioUrl: '',
      city: 'shanghai'
    }
  ],
  offline: [
    {
      id: 101,
      name: '王者荣耀开黑',
      gameName: '王者荣耀',
      icon: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200',
      description: '线下开黑，一起到网咖面基打游戏',
      tags: ['开黑', '面基', '网咖'],
      price: 100,
      status: 'paused',
      orderCount: 12,
      rating: 4.7,
      level: 'professional',
      position: 'mid',
      playType: 'carry',
      audioUrl: '',
      city: 'shenzhen'
    }
  ]
}

const servicesData = ref({
  online: [],
  offline: []
})

const currentServices = computed(() => {
  return servicesData.value[activeTab.value]
})

const loadServices = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      servicesData.value = JSON.parse(saved)
    } catch (e) {
      servicesData.value = { ...defaultServices }
    }
  } else {
    servicesData.value = { ...defaultServices }
  }
}

const saveServices = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(servicesData.value))
}

const getStatusText = (status) => {
  const statusMap = {
    active: '已开启',
    paused: '已暂停'
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
    gameName: service.gameName || '',
    city: service.city || ''
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  if (isRecording.value) {
    stopRecording()
  }
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
    gameName: '',
    city: ''
  }
}

const onImageChange = (e) => {
  showSourceMenu.value = false
  const file = e.target.files?.[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      editForm.value.icon = event.target?.result
    }
    reader.readAsDataURL(file)
  }
}

const selectCamera = async () => {
  showSourceMenu.value = false
  
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
  const audioUrl = editForm.value.audioUrl
  editForm.value.audioUrl = ''
  if (audioUrl && audioUrl.startsWith('blob:')) {
    setTimeout(() => {
      URL.revokeObjectURL(audioUrl)
    }, 100)
  }
}

const saveService = () => {
  if (!editForm.value.description) {
    alert('请填写技能介绍')
    return
  }
  if (!editForm.value.price || editForm.value.price <= 0) {
    alert('请输入有效的价格')
    return
  }

  const services = servicesData.value[activeTab.value]
  const idx = services.findIndex(s => s.id === editForm.value.id)
  if (idx !== -1) {
    services[idx] = {
      ...services[idx],
      name: editForm.value.name,
      description: editForm.value.description,
      level: editForm.value.level,
      position: editForm.value.position,
      playType: editForm.value.playType,
      price: editForm.value.price,
      icon: editForm.value.icon,
      audioUrl: editForm.value.audioUrl,
      city: editForm.value.city
    }
    saveServices()
    closeEditModal()
    alert('保存成功！')
  }
}

const toggleService = (service) => {
  const services = servicesData.value[activeTab.value]
  const idx = services.findIndex(s => s.id === service.id)
  if (idx !== -1) {
    services[idx].status = services[idx].status === 'active' ? 'paused' : 'active'
    saveServices()
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
    stopRecording()
  }
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
.my-services-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 80px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 35px 20px 35px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
  text-align: center;
  font-size: 20px;
}

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

.title {
  font-size: 20px;
  font-weight: bold;
  color: white;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  color: #667eea;
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
  border: 1px solid #667eea;
  background: white;
  color: #667eea;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  color: #667eea;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.record-wave span {
  width: 4px;
  height: 24px;
  background: white;
  border-radius: 2px;
  animation: wave 0.5s ease-in-out infinite;
  transform-origin: center bottom;
}

.record-wave span:nth-child(2) { animation-delay: 0.1s; }
.record-wave span:nth-child(3) { animation-delay: 0.2s; }
.record-wave span:nth-child(4) { animation-delay: 0.3s; }
.record-wave span:nth-child(5) { animation-delay: 0.4s; }

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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.alternative-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
