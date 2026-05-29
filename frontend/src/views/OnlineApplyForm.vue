<template>
  <div class="apply-body">
    <div class="form-item">
      <label class="form-label">所在城市</label>
      <div class="form-select" @click="emit('openPicker', 'city')">
        {{ getCityLabel(modelValue.city) || '请选择' }}
        <span class="select-arrow">›</span>
      </div>
    </div>

    <div class="form-item">
      <label class="form-label">技能等级</label>
      <div class="form-select" @click="emit('openPicker', 'level')">
        {{ getLevelLabel(modelValue.level) || '请选择' }}
        <span class="select-arrow">›</span>
      </div>
    </div>

    <div class="form-item">
      <label class="form-label">上传图片（禁止盗用他人图片，发现将封号）</label>
      <input type="file" ref="cameraInput" accept="image/*" capture="environment" style="display: none" @change="onImageChange" />
      <input type="file" ref="galleryInput" accept="image/*" style="display: none" @change="onImageChange" />
      <div class="upload-area" @click="showImageSourceMenu">
        <img v-if="modelValue.imageUrl" :src="modelValue.imageUrl" class="upload-preview" />
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
        <span class="select-btn" @click="emit('openPicker', 'skill')">选择常用 ›</span>
      </div>
      <textarea class="form-textarea" v-model="modelValue.skillIntro" placeholder="声音特点/擅长位置/KD,技术特点/娱乐/技术陪/聊天/唱歌等"></textarea>
    </div>

    <div class="form-item">
      <label class="form-label">接单大区</label>
      <div class="form-select" @click="emit('openPicker', 'zone')">
        {{ getZoneLabel(modelValue.zone) || '请选择' }}
        <span class="select-arrow">›</span>
      </div>
    </div>

    <div class="form-item">
      <label class="form-label">擅长位置</label>
      <div class="form-select" @click="emit('openPicker', 'position')">
        {{ getPositionLabel(modelValue.position) || '请选择' }}
        <span class="select-arrow">›</span>
      </div>
    </div>

    <div class="form-item">
      <label class="form-label">陪玩类型</label>
      <div class="form-select" @click="emit('openPicker', 'playType')">
        {{ getPlayTypeLabel(modelValue.playType) || '请选择' }}
        <span class="select-arrow">›</span>
      </div>
    </div>

    <div class="form-item">
      <label class="form-label">设置价格(币/段)</label>
      <div class="form-input-wrap">
        <input type="number" class="form-input" v-model="modelValue.price" placeholder="输入你的价格" />
      </div>
    </div>

    <div class="form-item">
      <label class="form-label">语音介绍</label>
      <div class="audio-container">
        <div v-show="!modelValue.audioUrl" :class="['record-area', { recording: isRecording }]" @click="emit('toggleRecording')">
          <div class="record-icon">🎤</div>
          <div class="record-text">{{ isRecording ? '录音中...' : '点击录音' }}</div>
          <div class="record-hint">{{ isRecording ? recordDuration + '秒' : '录制一段自我介绍' }}</div>
          <div class="record-wave" v-show="isRecording">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
        <div v-show="modelValue.audioUrl" class="audio-preview">
          <audio :src="modelValue.audioUrl" controls class="audio-player"></audio>
          <button class="delete-audio-btn" @click="emit('deleteAudio')">删除重录</button>
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button class="submit-btn" @click="emit('submit')">提交审核</button>
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
              >
                {{ permissionError.type === 'camera' ? '从相册选择图片' : '使用文字介绍' }}
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
</template>

<script setup>
import { ref } from 'vue'
import { usePermissions } from '../composables/usePermissions'

defineProps({
  modelValue: { type: Object, required: true },
  isRecording: { type: Boolean, default: false },
  recordDuration: { type: Number, default: 0 }
})

const emit = defineEmits(['openPicker', 'imageUpload', 'toggleRecording', 'deleteAudio', 'submit'])

const { 
  requestCameraPermission, 
  getPermissionGuideSteps 
} = usePermissions()

const cameraInput = ref(null)
const galleryInput = ref(null)
const showSourceMenu = ref(false)
const showPermissionGuide = ref(false)
const permissionError = ref({ type: 'camera', errorType: 'denied', message: '' })

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
  const item = cityOptions.find(opt => opt.value === value)
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

const showImageSourceMenu = () => {
  showSourceMenu.value = true
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
  height: 130px;
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

.form-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.submit-btn {
  width: 100%;
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

@media (min-width: 768px) {
  .online-apply-page {
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
  .online-apply-page {
    max-width: 720px;
  }
  .header {
    max-width: 720px;
  }
}
</style>
