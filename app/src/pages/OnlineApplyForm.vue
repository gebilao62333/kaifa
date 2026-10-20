<template>
  <view class="apply-body">
    <view class="form-item">
      <label class="form-label">所在城市</label>
      <view class="form-select" @click="emit('openPicker', 'city')">
        {{ getCityLabel(modelValue.city) || '请选择' }}
        <text class="select-arrow">›</text>
      </view>
    </view>

    <view class="form-item">
      <label class="form-label">技能等级</label>
      <view class="form-select" @click="emit('openPicker', 'level')">
        {{ getLevelLabel(modelValue.level) || '请选择' }}
        <text class="select-arrow">›</text>
      </view>
    </view>

    <view class="form-item">
      <label class="form-label">上传图片（禁止盗用他人图片，发现将封号）</label>
      <input type="file" ref="cameraInput" accept="image/*" capture="environment" style="display: none" @change="onImageChange" />
      <input type="file" ref="galleryInput" accept="image/*" style="display: none" @change="onImageChange" />
      <view class="upload-area" @click="showImageSourceMenu">
        <image mode="aspectFit" v-if="modelValue.imageUrl" :src="modelValue.imageUrl" class="upload-preview" />
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
        <text class="select-btn" @click="emit('openPicker', 'skill')">选择常用 ›</text>
      </view>
      <textarea class="form-textarea" v-model="modelValue.skillIntro" placeholder="声音特点/擅长位置/KD,技术特点/娱乐/技术陪/聊天/唱歌等"></textarea>
    </view>

    <view class="form-item">
      <label class="form-label">接单大区</label>
      <view class="form-select" @click="emit('openPicker', 'zone')">
        {{ getZoneLabel(modelValue.zone) || '请选择' }}
        <text class="select-arrow">›</text>
      </view>
    </view>

    <view class="form-item">
      <label class="form-label">擅长位置</label>
      <view class="form-select" @click="emit('openPicker', 'position')">
        {{ getPositionLabel(modelValue.position) || '请选择' }}
        <text class="select-arrow">›</text>
      </view>
    </view>

    <view class="form-item">
      <label class="form-label">陪玩类型</label>
      <view class="form-select" @click="emit('openPicker', 'playType')">
        {{ getPlayTypeLabel(modelValue.playType) || '请选择' }}
        <text class="select-arrow">›</text>
      </view>
    </view>

    <view class="form-item">
      <label class="form-label">设置价格(币/段)</label>
      <view class="form-input-wrap">
        <input type="number" class="form-input" v-model="modelValue.price" placeholder="输入你的价格" />
      </view>
    </view>

    <view class="form-item">
      <label class="form-label">语音介绍</label>
      <view class="audio-container">
        <view v-show="!modelValue.audioUrl" :class="['record-area', { recording: isRecording }]" @click="emit('toggleRecording')">
          <view class="record-icon">🎤</view>
          <view class="record-text">{{ isRecording ? '录音中...' : '点击录音' }}</view>
          <view class="record-hint">{{ isRecording ? recordDuration + '秒' : '录制一段自我介绍' }}</view>
          <view class="record-wave" v-show="isRecording">
            <text></text><text></text><text></text><text></text><text></text>
          </view>
        </view>
        <view v-show="modelValue.audioUrl" class="audio-preview">
          <audio v-if="!isApp" :src="modelValue.audioUrl" controls class="audio-player"></audio>
          <view v-else class="audio-player app-audio-player" @click="emit('toggleAudioPlay')">
            {{ audioPlaying ? '⏸️ 播放中' : '🔊 点击试听' }}
          </view>
          <button class="delete-audio-btn" @click="emit('deleteAudio')">删除重录</button>
        </view>
      </view>
    </view>

    <view class="form-actions">
      <button class="submit-btn" @click="emit('submit')">提交审核</button>
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
              >
                {{ permissionError.type === 'camera' ? '从相册选择图片' : '使用文字介绍' }}
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
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePermissions } from '../composables/usePermissions'
import regionService from '../services/regionService'
import { uploadFile } from '../services/uploadService'
import { chooseImages } from '../services/mediaPicker'
import { isApp } from '../common/platform'
import { toast } from '../composables/useToast'

const props = defineProps({
  modelValue: { type: Object, required: true },
  isRecording: { type: Boolean, default: false },
  recordDuration: { type: Number, default: 0 },
  // App 端 <audio> 不能稳定播放本地临时文件，由父组件用 innerAudioContext 播放
  audioPlaying: { type: Boolean, default: false }
})

const emit = defineEmits(['openPicker', 'imageUpload', 'toggleRecording', 'deleteAudio', 'toggleAudioPlay', 'submit'])

const { 
  requestCameraPermission, 
  getPermissionGuideSteps 
} = usePermissions()

const cameraInput = ref(null)
const galleryInput = ref(null)
const imageUploading = ref(false)
const showSourceMenu = ref(false)
const showPermissionGuide = ref(false)
const permissionError = ref({ type: 'camera', errorType: 'denied', message: '' })

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

const getCityLabel = (value) => {
  const item = cityOptions.value.find(opt => opt.value === value)
  return item ? item.label : ''
}

const getLevelLabel = (value) => {
  const item = levelOptions.find(opt => opt.value === value)
  return item ? item.label : ''
}

const getZoneLabel = (value) => {
  const item = zoneOptions.find(opt => opt.value === value)
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

const onImageChange = (e) => {
  showSourceMenu.value = false
  emit('imageUpload', e)
}

// 点上传区：H5 弹出自定义来源菜单；App 没有可靠的文件 input，直接走 mediaPicker（拍照/相册）
const showImageSourceMenu = () => {
  if (isApp) { pickImageFromApp(); return }
  showSourceMenu.value = true
}

const pickImageFromApp = async () => {
  try {
    const { supported, files } = await chooseImages(1)
    if (supported && files.length) await applyImageFile(files[0])
  } catch (err) {
    toast.error(err.message || '选择图片失败')
  }
}

// App 端没有可读的 File，无法沿用父组件的 FileReader 预览：
// 先用 uni 临时路径占位预览，再直传拿到真实 URL 回填表单（父组件提交时只需跳过 blob:/data:）
const applyImageFile = async (file) => {
  showSourceMenu.value = false
  if (!file || imageUploading.value) return
  if (file.size > 5 * 1024 * 1024) {
    toast.error('图片大小不能超过5MB')
    return
  }
  const prev = props.modelValue.imageUrl
  props.modelValue.imageUrl = file.path
  imageUploading.value = true
  try {
    const res = await uploadFile(file, 'image')
    if (res?.code === 200 && res.data?.url) {
      props.modelValue.imageUrl = res.data.url
    } else {
      props.modelValue.imageUrl = prev
      toast.error(res?.message || '图片上传失败')
    }
  } catch (err) {
    props.modelValue.imageUrl = prev
    toast.error(err.message || '图片上传失败')
  } finally {
    imageUploading.value = false
  }
}

const selectCamera = async () => {
  showSourceMenu.value = false

  // App 端没有可靠的相机权限弹窗和 <input capture>，统一交给 mediaPicker
  if (isApp) { pickImageFromApp(); return }
  
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
  if (isApp) { pickImageFromApp(); return }
  galleryInput.value?.click()
}

const handlePermissionRetry = () => {
  showPermissionGuide.value = false
  selectCamera()
}

const handlePermissionAlternative = () => {
  showPermissionGuide.value = false
  galleryInput.value?.click()
}

const handlePermissionContinue = () => {
  showPermissionGuide.value = false
}
</script>

<style scoped>
.apply-body {
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
  height: 130px;
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

.form-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.submit-btn {
  width: 100%;
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
