<template>
  <div class="publish-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">发布动态</span>
      <span class="publish-btn" @click="publish">发布</span>
    </div>
    
    <div class="content">
      <textarea 
        class="text-input" 
        placeholder="分享这一刻的想法..." 
        v-model="content"
        maxlength="500"
      ></textarea>
      
      <div class="image-upload">
        <div class="upload-item" v-for="(item, index) in mediaItems" :key="index">
          <video 
            v-if="item.type === 'video'" 
            class="preview" 
            :src="item.url"
          ></video>
          <img 
            v-else 
            class="preview" 
            :src="item.url" 
            alt=""
          />
          <span class="video-indicator" v-if="item.type === 'video'">▶</span>
          <span class="remove-btn" v-if="!item.uploading" @click="removeMedia(index)">×</span>
          
          <!-- 上传进度 -->
          <div v-if="item.uploading" class="upload-progress-container">
            <div class="upload-progress-bar" :style="{ width: item.progress + '%' }"></div>
          </div>
          <div v-if="item.uploading" class="upload-progress-text">{{ item.progress }}%</div>
        </div>
        <div class="upload-btn" v-if="mediaItems.length < 9 && !uploading" @click="triggerFileInput">
          <span class="icon">+</span>
          <span class="text">图片/视频</span>
        </div>
        <input 
          ref="fileInputRef"
          type="file" 
          accept="image/*,video/*"
          capture="environment"
          multiple
          style="display: none"
          @change="handleFileChange"
        />
      </div>
      
      <div class="location-tag" @click="openLocationModal">
        <span class="icon">📍</span>
        <span class="text">{{ location || '添加位置' }}</span>
        <span class="clear-btn" v-if="location" @click.stop="location = ''">×</span>
      </div>
      
      <div class="location-modal" v-if="showLocationModal" @click.self="showLocationModal = false">
        <div class="location-modal-content">
          <div class="location-modal-header">
            <span class="location-modal-title">选择位置</span>
            <span class="location-modal-close" @click="showLocationModal = false">×</span>
          </div>
          <div class="location-current" @click="getCurrentLocation">
            <span class="location-current-icon">📍</span>
            <span class="location-current-text">{{ locationLoading ? '定位中...' : '使用当前位置' }}</span>
            <span class="location-current-loading" v-if="locationLoading">⏳</span>
          </div>
          <div class="location-picker-header">
            <span class="location-picker-hint">{{ tempLocation.province ? tempLocation.province + (tempLocation.city ? ' · ' + tempLocation.city + (tempLocation.district ? ' · ' + tempLocation.district + (customLocationStreet ? ' · ' + customLocationStreet : '') : '') : '') : '请选择省/市/区' }}</span>
            <span class="location-picker-confirm" @click="confirmLocation">确定</span>
          </div>
          <div class="location-picker-body">
            <div class="location-picker-column">
              <div 
                class="location-picker-item" 
                :class="{ active: locationStep === 'province' && tempLocation.province === p.name }"
                v-for="p in regionData" 
                :key="p.code" 
                @click="selectLocationProvince(p)"
              >{{ p.name }}</div>
            </div>
            <div class="location-picker-column" v-if="locationStep === 'city' || locationStep === 'district' || locationStep === 'street'">
              <div 
                class="location-picker-item" 
                :class="{ active: tempLocation.city === c.name }"
                v-for="c in currentLocationProvince?.cities" 
                :key="c.code" 
                @click="selectLocationCity(c)"
              >{{ c.name }}</div>
            </div>
            <div class="location-picker-column" v-if="locationStep === 'district' || locationStep === 'street'">
              <div 
                class="location-picker-item" 
                :class="{ active: tempLocation.district === d.name }"
                v-for="d in currentLocationCity?.districts" 
                :key="d.code" 
                @click="selectLocationDistrict(d)"
              >{{ d.name }}</div>
            </div>
            <div class="location-picker-column location-picker-column-custom" v-if="locationStep === 'street'">
              <input
                class="location-picker-input"
                v-model="customLocationStreet"
                placeholder="请输入街道/乡镇（可选）"
                @click.stop
              />
              <div class="location-picker-custom-hint">支持自定义输入，也可留空</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="topic-tag" @click="showTopicModal = true">
        <span class="icon">#</span>
        <span class="text">{{ topics.length > 0 ? topics.join(', ') : '添加话题' }}</span>
      </div>
      
      <div class="topic-modal" v-if="showTopicModal" @click.self="showTopicModal = false">
        <div class="topic-modal-content">
          <div class="topic-modal-header">
            <span class="topic-modal-title">选择话题</span>
            <span class="topic-modal-count">{{ topics.length }}/3</span>
          </div>
          <div class="topic-modal-body">
            <div 
              v-for="t in availableTopics" 
              :key="t"
              class="topic-item"
              :class="{ selected: topics.includes(t) }"
              @click="toggleTopic(t)"
            >
              {{ t }}
            </div>
          </div>
          <div class="topic-modal-footer">
            <div class="topic-selected" v-if="topics.length > 0">
              <span class="topic-selected-label">已选：</span>
              <span 
                v-for="t in topics" 
                :key="t"
                class="topic-selected-item"
                @click="toggleTopic(t)"
              >
                #{{ t }} ×
              </span>
            </div>
            <button class="topic-confirm-btn" @click="showTopicModal = false">确定</button>
          </div>
        </div>
      </div>
      
      <div class="visibility-setting">
        <span class="label">谁可以看</span>
        <div class="options">
          <div 
            class="option" 
            :class="{ active: visibility === 'public' }" 
            @click="visibility = 'public'"
          >公开</div>
          <div 
            class="option" 
            :class="{ active: visibility === 'friends' }" 
            @click="visibility = 'friends'"
          >仅关注</div>
          <div 
            class="option" 
            :class="{ active: visibility === 'private' }" 
            @click="visibility = 'private'"
          >私密</div>
          <div 
            class="option" 
            :class="{ active: visibility === 'password' }" 
            @click="visibility = 'password'"
          >密码查看</div>
          <div 
            class="option" 
            :class="{ active: visibility === 'pay' }" 
            @click="visibility = 'pay'"
          >付费查看</div>
        </div>
        <div class="visibility-input" v-if="visibility === 'password'">
          <input 
            type="text" 
            v-model="viewPassword" 
            placeholder="请输入查看密码"
            maxlength="20"
          />
        </div>
        <div class="visibility-input" v-if="visibility === 'pay'">
          <input 
            type="number" 
            v-model="viewPrice" 
            placeholder="请输入查看价格(金币)"
            min="0"
            max="999"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user-info'
import { useToast } from '../composables/useToast'
import circleService from '../services/circleService'
import uploadService from '../services/uploadService'
import { regionData } from '../common/regionData'
import { useLoginManager } from '../composables/useLoginManager'

const router = useRouter()
const userStore = useUserStore()
const { showToast } = useToast()
const { requireLogin } = useLoginManager()

const content = ref('')
const mediaItems = ref([])
const location = ref('')
const topics = ref([])
const visibility = ref('public')
const viewPassword = ref('')
const viewPrice = ref('')
const fileInputRef = ref(null)
const showTopicModal = ref(false)
const showLocationModal = ref(false)
const locationLoading = ref(false)
const uploading = ref(false)

// 位置选择器 - 四级联动（第四级为自定义输入）
const locationStep = ref('province')
const tempLocation = reactive({ province: '', city: '', district: '', street: '' })
const currentLocationProvince = ref(null)
const currentLocationCity = ref(null)
const currentLocationDistrict = ref(null)
const customLocationStreet = ref('')

const availableTopics = ref([
  '游戏', '音乐', '美食', '旅行', '摄影', '运动', '阅读', '电影',
  '美妆', '穿搭', '萌宠', '科技', '电竞', '社交', '情感', '职场'
])

const goBack = () => {
  router.back()
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return
  
  const remainingSlots = 9 - mediaItems.value.length
  const filesToAdd = Array.from(files).slice(0, remainingSlots)
  
  filesToAdd.forEach((file) => {
    const url = URL.createObjectURL(file)
    const isVideo = file.type.startsWith('video/')
    mediaItems.value.push({ url, type: isVideo ? 'video' : 'image', file, uploading: false, progress: 0 })
  })
  
  event.target.value = ''
}

const removeMedia = (index) => {
  URL.revokeObjectURL(mediaItems.value[index].url)
  mediaItems.value.splice(index, 1)
}

const openLocationModal = () => {
  locationStep.value = 'province'
  tempLocation.province = ''
  tempLocation.city = ''
  tempLocation.district = ''
  tempLocation.street = ''
  customLocationStreet.value = ''
  currentLocationProvince.value = null
  currentLocationCity.value = null
  currentLocationDistrict.value = null
  showLocationModal.value = true
}

const selectLocationProvince = (province) => {
  tempLocation.province = province.name
  tempLocation.city = ''
  tempLocation.district = ''
  tempLocation.street = ''
  customLocationStreet.value = ''
  currentLocationProvince.value = province
  currentLocationCity.value = null
  currentLocationDistrict.value = null
  locationStep.value = 'city'
}

const selectLocationCity = (city) => {
  tempLocation.city = city.name
  tempLocation.district = ''
  tempLocation.street = ''
  customLocationStreet.value = ''
  currentLocationCity.value = city
  currentLocationDistrict.value = null
  locationStep.value = 'district'
}

const selectLocationDistrict = (district) => {
  tempLocation.district = district.name
  tempLocation.street = ''
  customLocationStreet.value = ''
  currentLocationDistrict.value = district
  locationStep.value = 'street'
}

const confirmLocation = () => {
  if (tempLocation.province) {
    tempLocation.street = customLocationStreet.value.trim()
    location.value = tempLocation.province
      + (tempLocation.city ? '·' + tempLocation.city : '')
      + (tempLocation.district ? '·' + tempLocation.district : '')
      + (tempLocation.street ? '·' + tempLocation.street : '')
  }
  showLocationModal.value = false
}

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    showToast('您的浏览器不支持定位功能', 'warning')
    return
  }
  
  locationLoading.value = true
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh`
        )
        const data = await response.json()
        
        const city = data.address.city || data.address.town || data.address.village || ''
        const district = data.address.suburb || data.address.district || ''
        
        if (city) {
          location.value = district ? `${city}·${district}` : city
        } else {
          location.value = `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`
        }
        
        showLocationModal.value = false
      } catch (error) {
        location.value = `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`
        showLocationModal.value = false
      }
      
      locationLoading.value = false
    },
    (error) => {
      locationLoading.value = false
      switch (error.code) {
        case error.PERMISSION_DENIED:
          showToast('定位权限被拒绝，请在浏览器设置中开启定位权限', 'warning')
          break
        case error.POSITION_UNAVAILABLE:
          showToast('无法获取您的位置信息', 'warning')
          break
        case error.TIMEOUT:
          showToast('定位请求超时', 'warning')
          break
        default:
          showToast('定位失败', 'warning')
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  )
}

const toggleTopic = (t) => {
  const index = topics.value.indexOf(t)
  if (index > -1) {
    topics.value.splice(index, 1)
  } else if (topics.value.length < 3) {
    topics.value.push(t)
  }
}

const uploadMedia = async () => {
  const uploadedUrls = []
  
  for (let i = 0; i < mediaItems.value.length; i++) {
    const item = mediaItems.value[i]
    if (item.file) {
      item.uploading = true
      try {
        const result = await uploadService.upload(item.file, (progress) => {
          item.progress = progress
        })
        const url = result.data?.url || result.url || ''
        uploadedUrls.push({ type: item.type, url })
      } catch (error) {
        console.error('上传失败:', error)
        showToast(`第 ${i + 1} 个文件上传失败: ${error.message}`, 'error')
        return null
      } finally {
        item.uploading = false
      }
    } else {
      uploadedUrls.push({ type: item.type, url: item.url })
    }
  }
  
  return uploadedUrls
}

const publish = async () => {
  if (!content.value.trim() && mediaItems.value.length === 0) {
    showToast('请输入内容或添加图片', 'warning')
    return
  }

  if (!userStore.isLogin) { try { await requireLogin() } catch { return } }

  if (visibility.value === 'password' && !viewPassword.value.trim()) {
    showToast('请输入查看密码', 'warning')
    return
  }
  
  if (visibility.value === 'pay' && (!viewPrice.value || viewPrice.value <= 0)) {
    showToast('请输入有效的查看金币数', 'warning')
    return
  }
  
  uploading.value = true
  
  try {
    const visibilityMap = {
      'public': 0,
      'friends': 1,
      'private': 2,
      'password': 3,
      'pay': 4
    }
    
    const uploadedMedia = await uploadMedia()
    if (!uploadedMedia) {
      uploading.value = false
      return
    }
    
    const images = uploadedMedia
      .filter(item => item.type === 'image')
      .map(item => item.url)
    
    const videos = uploadedMedia
      .filter(item => item.type === 'video')
      .map(item => item.url)
    
    const postData = { 
      content: content.value, 
      images, 
      videos,
      location: location.value, 
      tagIds: topics.value.map(t => t), 
      visibility: visibilityMap[visibility.value] || 0
    }
    
    if (visibility.value === 'password') {
      postData.password = viewPassword.value
    }
    
    if (visibility.value === 'pay') {
      postData.price = parseFloat(viewPrice.value)
    }
    
    await circleService.createPost(postData)
    showToast('发布成功', 'success')
    router.back()
  } catch (error) {
    console.error('发布失败:', error)
    showToast('发布失败，请重试', 'error')
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.publish-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: var(--bg-secondary);
  padding-bottom: 80px;
  padding-bottom: calc(80px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  background: var(--gradient-primary);
  background: -webkit-linear-gradient(315deg, #FF6B81 0%, #E64C65 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: calc(12px + constant(safe-area-inset-top, 0px));
  padding-top: calc(12px + env(safe-area-inset-top, 0px));
  height: 50px;
  height: calc(50px + constant(safe-area-inset-top, 0px));
  height: calc(50px + env(safe-area-inset-top, 0px));
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  box-sizing: border-box;
  max-width: 650px;
  z-index: 100;
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
}

.title {
  font-size: 17px;
  font-weight: bold;
  color: white;
}

.publish-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.publish-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.content {
  padding: 12px;
  padding-top: 62px;
  max-width: 650px;
  margin: 0 auto;
}

.text-input {
  width: 100%;
  min-height: 150px;
  border: none;
  background: var(--bg-primary);
  border-radius: 10px;
  padding: 16px;
  box-shadow: var(--shadow-light);
  font-size: 16px;
  outline: none;
  resize: none;
  box-sizing: border-box;
  color: var(--text-primary);
}

.text-input::placeholder {
  color: var(--text-muted);
}

.image-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 12px 0;
  background: var(--bg-primary);
  border-radius: 10px;
  padding: 16px;
  box-shadow: var(--shadow-light);
}

.upload-item {
  position: relative;
}

.preview {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: rgba(0,0,0,0.6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  z-index: 10;
}

.upload-progress-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

.upload-progress-bar {
  height: 100%;
  background: var(--gradient-primary);
  transition: width 0.1s ease-out;
  border-radius: 0 0 8px 8px;
}

.upload-progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.video-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 36px;
  height: 36px;
  background: rgba(0,0,0,0.5);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  pointer-events: none;
}

.upload-btn {
  width: 100px;
  height: 100px;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-btn:hover {
  border-color: var(--primary-color);
  background: rgba(255, 107, 129, 0.05);
}

.upload-btn .icon {
  font-size: 32px;
  color: var(--text-muted);
}

.upload-btn .text {
  font-size: 12px;
  color: var(--text-muted);
}

.location-tag, .topic-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: var(--bg-primary);
  border-radius: 16px;
  box-shadow: var(--shadow-light);
  cursor: pointer;
  margin-bottom: 12px;
  transition: all 0.2s;
}

.location-tag:hover, .topic-tag:hover {
  box-shadow: var(--shadow-medium);
}

.location-tag .icon, .topic-tag .icon {
  font-size: 20px;
}

.location-tag .text, .topic-tag .text {
  font-size: 15px;
  color: var(--text-primary);
  flex: 1;
}

.visibility-setting {
  margin-top: 12px;
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--shadow-light);
}

.visibility-setting .label {
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;
  display: block;
  margin-bottom: 12px;
}

.visibility-setting .options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.visibility-setting .option {
  flex: 1;
  min-width: 60px;
  text-align: center;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.visibility-setting .option:hover {
  border-color: var(--primary-light);
}

.visibility-setting .option.active {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(255, 107, 129, 0.05);
}

.visibility-setting .visibility-input {
  margin-top: 12px;
}

.visibility-setting .visibility-input input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  color: var(--text-primary);
}

.visibility-setting .visibility-input input::placeholder {
  color: var(--text-muted);
}

.visibility-setting .visibility-input input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.topic-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.topic-modal-content {
  width: 100%;
  max-width: 650px;
  margin: 0 auto;
  background: var(--bg-primary);
  border-radius: 10px 10px 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

@media (min-width: 1024px) {
  .topic-modal-content {
    max-width: 720px;
  }
}

.topic-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.topic-modal-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
}

.topic-modal-count {
  font-size: 14px;
  color: var(--text-muted);
}

.topic-modal-body {
  padding: 16px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  overflow-y: auto;
  flex: 1;
}

.topic-item {
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-radius: 20px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.topic-item:hover {
  background: var(--bg-tertiary);
}

.topic-item.selected {
  background: rgba(255, 107, 129, 0.1);
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.topic-modal-footer {
  padding: 12px 20px 20px;
  border-top: 1px solid var(--border-light);
}

.topic-selected {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.topic-selected-label {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 28px;
}

.topic-selected-item {
  background: rgba(255, 107, 129, 0.1);
  color: var(--primary-color);
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 13px;
  cursor: pointer;
}

.topic-confirm-btn {
  width: 100%;
  padding: 12px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.topic-confirm-btn:hover {
  opacity: 0.9;
}

.location-tag .clear-btn {
  margin-left: auto;
  font-size: 16px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}

.location-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.location-modal-content {
  width: 100%;
  max-width: 650px;
  margin: 0 auto;
  background: var(--bg-primary);
  border-radius: 10px 10px 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

@media (min-width: 1024px) {
  .location-modal-content {
    max-width: 720px;
  }
}

.location-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.location-modal-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
}

.location-modal-close {
  font-size: 24px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}

.location-current {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: rgba(255, 107, 129, 0.1);
  cursor: pointer;
  transition: background 0.2s;
}

.location-current:hover {
  background: rgba(255, 107, 129, 0.15);
}

.location-current-icon {
  font-size: 18px;
  margin-right: 10px;
}

.location-current-text {
  flex: 1;
  font-size: 15px;
  color: var(--primary-color);
  font-weight: 500;
}

.location-current-loading {
  font-size: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 位置选择器 - 三级联动（与编辑资料共享 regionData） */
.location-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
}

.location-picker-hint {
  font-size: 14px;
  color: var(--text-muted);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-picker-confirm {
  font-size: 15px;
  color: var(--primary-color);
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.location-picker-body {
  display: flex;
  max-height: 300px;
  overflow: hidden;
}

.location-picker-column {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  border-right: 1px solid var(--border-light);
}

.location-picker-column:last-child {
  border-right: none;
}

.location-picker-item {
  padding: 14px 16px;
  font-size: 15px;
  color: var(--text-secondary);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.15s;
}

.location-picker-item:hover {
  background: var(--bg-secondary);
}

.location-picker-item.active {
  color: var(--primary-color);
  font-weight: 500;
  background: rgba(255, 107, 129, 0.05);
}

.location-picker-column-custom {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.location-picker-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-color, #e5e5e5);
  border-radius: 8px;
  font-size: 15px;
  color: var(--text-primary);
  background: var(--bg-primary, #fff);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.location-picker-input:focus {
  border-color: var(--primary-color);
}

.location-picker-input::placeholder {
  color: var(--text-muted, #bbb);
}

.location-picker-custom-hint {
  font-size: 12px;
  color: var(--text-muted, #bbb);
  text-align: center;
}

@media (min-width: 768px) {
  .publish-page {
    max-width: 650px;
    margin: 0 auto;
    position: relative;
  }

  .header {
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 0 0 16px 16px;
    padding: 14px 20px;
  }
}

@media (min-width: 1024px) {
  .publish-page {
    max-width: 720px;
  }

  .header {
    max-width: 720px;
  }
}
</style>
