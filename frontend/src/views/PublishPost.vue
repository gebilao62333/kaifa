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
          <span class="remove-btn" @click="removeMedia(index)">×</span>
        </div>
        <div class="upload-btn" v-if="mediaItems.length < 9" @click="triggerFileInput">
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
      
      <div class="location-tag" @click="showLocationModal = true">
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
          <div class="location-search">
            <input 
              type="text" 
              v-model="locationSearch" 
              placeholder="搜索城市或地区"
            />
          </div>
          <div class="location-list">
            <div 
              v-for="loc in filteredLocations" 
              :key="loc"
              class="location-item"
              :class="{ selected: location === loc }"
              @click="selectLocation(loc)"
            >
              <span class="location-icon">📍</span>
              <span class="location-text">{{ loc }}</span>
              <span class="location-check" v-if="location === loc">✓</span>
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
            placeholder="请输入查看价格(元)"
            min="0"
            max="999"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

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
const locationSearch = ref('')
const locationLoading = ref(false)

const availableTopics = ref([
  '游戏', '音乐', '美食', '旅行', '摄影', '运动', '阅读', '电影',
  '美妆', '穿搭', '萌宠', '科技', '电竞', '社交', '情感', '职场'
])

const popularLocations = ref([
  '北京市·朝阳区', '北京市·海淀区', '北京市·东城区', '北京市·西城区',
  '上海市·浦东新区', '上海市·黄浦区', '上海市·静安区', '上海市·徐汇区',
  '广州市·天河区', '广州市·越秀区', '广州市·海珠区',
  '深圳市·南山区', '深圳市·福田区', '深圳市·龙岗区',
  '杭州市·西湖区', '杭州市·滨江区', '杭州市·余杭区',
  '成都市·锦江区', '成都市·武侯区', '成都市·高新区',
  '重庆市·渝北区', '重庆市·江北区', '重庆市·渝中区',
  '武汉市·洪山区', '武汉市·武昌区', '武汉市·江汉区',
  '西安市·雁塔区', '西安市·碑林区', '西安市·新城区',
  '南京市·鼓楼区', '南京市·玄武区', '南京市·秦淮区',
  '长沙市·岳麓区', '长沙市·芙蓉区', '长沙市·天心区'
])

const filteredLocations = computed(() => {
  if (!locationSearch.value) return popularLocations.value
  const search = locationSearch.value.toLowerCase()
  return popularLocations.value.filter(loc => loc.toLowerCase().includes(search))
})

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
    mediaItems.value.push({ url, type: isVideo ? 'video' : 'image', file })
  })
  
  event.target.value = ''
}

const removeMedia = (index) => {
  URL.revokeObjectURL(mediaItems.value[index].url)
  mediaItems.value.splice(index, 1)
}

const selectLocation = (loc) => {
  location.value = loc
  showLocationModal.value = false
  locationSearch.value = ''
}

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert('您的浏览器不支持定位功能')
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
          alert('定位权限被拒绝，请在浏览器设置中开启定位权限')
          break
        case error.POSITION_UNAVAILABLE:
          alert('无法获取您的位置信息')
          break
        case error.TIMEOUT:
          alert('定位请求超时')
          break
        default:
          alert('定位失败')
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

const publish = () => {
  if (!content.value.trim() && mediaItems.value.length === 0) {
    alert('请输入内容或添加图片')
    return
  }
  if (visibility.value === 'password' && !viewPassword.value.trim()) {
    alert('请输入查看密码')
    return
  }
  if (visibility.value === 'pay' && (!viewPrice.value || viewPrice.value <= 0)) {
    alert('请输入有效的查看价格')
    return
  }
  
  const visibilityMap = {
    'public': 0,
    'friends': 1,
    'private': 2,
    'password': 3,
    'pay': 4
  }
  
  const images = mediaItems.value
    .filter(item => item.type === 'image')
    .map(item => item.url)
  
  const videos = mediaItems.value
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
  console.log('发布动态:', postData)
  alert('发布成功')
  router.back()
}
</script>

<style scoped>
.publish-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60px 20px 20px;
  background: white;
  border-bottom: 1px solid #eee;
}

.back-btn {
  font-size: 24px;
  cursor: pointer;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.publish-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

.content {
  padding: 20px;
}

.text-input {
  width: 100%;
  min-height: 150px;
  border: none;
  background: transparent;
  font-size: 16px;
  outline: none;
  resize: none;
}

.image-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 20px 0;
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
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.upload-btn .icon {
  font-size: 32px;
  color: #999;
}

.upload-btn .text {
  font-size: 12px;
  color: #999;
}

.location-tag, .topic-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 0;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.location-tag .icon, .topic-tag .icon {
  font-size: 20px;
}

.location-tag .text, .topic-tag .text {
  font-size: 15px;
  color: #333;
}

.visibility-setting {
  margin-top: 20px;
}

.visibility-setting .label {
  font-size: 15px;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 12px;
}

.visibility-setting .options {
  display: flex;
  gap: 12px;
}

.visibility-setting .option {
  flex: 1;
  text-align: center;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.visibility-setting .option.active {
  border-color: #667eea;
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.visibility-setting .visibility-input {
  margin-top: 12px;
}

.visibility-setting .visibility-input input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.visibility-setting .visibility-input input:focus {
  outline: none;
  border-color: #667eea;
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
  background: white;
  border-radius: 16px 16px 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.topic-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.topic-modal-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.topic-modal-count {
  font-size: 14px;
  color: #999;
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
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.topic-item:hover {
  background: #eee;
}

.topic-item.selected {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border-color: #667eea;
}

.topic-modal-footer {
  padding: 12px 20px 20px;
  border-top: 1px solid #eee;
}

.topic-selected {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.topic-selected-label {
  font-size: 14px;
  color: #999;
  line-height: 28px;
}

.topic-selected-item {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 13px;
  cursor: pointer;
}

.topic-confirm-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  cursor: pointer;
}

.location-tag .clear-btn {
  margin-left: auto;
  font-size: 16px;
  color: #999;
  cursor: pointer;
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
  background: white;
  border-radius: 16px 16px 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.location-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.location-modal-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.location-modal-close {
  font-size: 24px;
  color: #999;
  cursor: pointer;
}

.location-current {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  cursor: pointer;
  transition: background 0.2s;
}

.location-current:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
}

.location-current-icon {
  font-size: 18px;
  margin-right: 10px;
}

.location-current-text {
  flex: 1;
  font-size: 15px;
  color: #667eea;
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

.location-search {
  padding: 12px 20px;
  border-bottom: 1px solid #eee;
}

.location-search input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 14px;
  box-sizing: border-box;
}

.location-search input:focus {
  outline: none;
  border-color: #667eea;
}

.location-list {
  padding: 8px 20px;
  overflow-y: auto;
  flex: 1;
}

.location-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.location-item:last-child {
  border-bottom: none;
}

.location-item.selected .location-text {
  color: #667eea;
}

.location-icon {
  margin-right: 10px;
  font-size: 14px;
}

.location-text {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.location-check {
  color: #667eea;
  font-size: 16px;
  font-weight: bold;
}
</style>
