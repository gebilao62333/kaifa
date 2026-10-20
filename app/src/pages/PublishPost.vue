<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">发布动态</text>
      <text class="publish-btn" @click="publish">发布</text>
    </template>
    
    <view class="content">
      <textarea 
        class="text-input" 
        placeholder="分享这一刻的想法..." 
        v-model="content"
        maxlength="500"
      ></textarea>
      
      <view class="image-upload">
        <view class="upload-item" v-for="(item, index) in mediaItems" :key="index">
          <video 
            v-if="item.type === 'video'" 
            class="preview" 
            :src="item.url"
          ></video>
          <image mode="aspectFill" 
            v-else 
            class="preview" 
            :src="item.url" 
            alt=""
          />
          <text class="video-indicator" v-if="item.type === 'video'">▶</text>
          <text class="remove-btn" @click="removeMedia(index)">×</text>
        </view>
        <view class="upload-btn" v-if="mediaItems.length < 9" @click="triggerFileInput">
          <text class="icon">+</text>
          <text class="text">图片/视频</text>
        </view>
        <input 
          ref="fileInputRef"
          type="file" 
          accept="image/*,video/*"
          capture="environment"
          multiple
          style="display: none"
          @change="handleFileChange"
        />
      </view>
      
      <view class="location-tag" @click="showLocationModal = true">
        <text class="icon">📍</text>
        <text class="text">{{ location || '添加位置' }}</text>
        <text class="clear-btn" v-if="location" @click.stop="location = ''">×</text>
      </view>
      
      <view class="location-modal" v-if="showLocationModal" @click.self="showLocationModal = false">
        <view class="location-modal-content">
          <view class="location-modal-header">
            <text class="location-modal-title">选择位置</text>
            <text class="location-modal-close" @click="showLocationModal = false">×</text>
          </view>
          <view class="location-current" @click="getCurrentLocation">
            <text class="location-current-icon">📍</text>
            <text class="location-current-text">{{ locationLoading ? '定位中...' : '使用当前位置' }}</text>
            <text class="location-current-loading" v-if="locationLoading">⏳</text>
          </view>
          <view class="location-search">
            <input 
              type="text" 
              v-model="locationSearch" 
              placeholder="搜索城市或地区"
            />
          </view>
          <view class="location-list">
            <view 
              v-for="loc in filteredLocations" 
              :key="loc"
              class="location-item"
              :class="{ selected: location === loc }"
              @click="selectLocation(loc)"
            >
              <text class="location-icon">📍</text>
              <text class="location-text">{{ loc }}</text>
              <text class="location-check" v-if="location === loc">✓</text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="topic-tag" @click="showTopicModal = true">
        <text class="icon">#</text>
        <text class="text">{{ topics.length > 0 ? topics.map(t => t.name).join(', ') : '添加话题' }}</text>
      </view>
      
      <view class="topic-modal" v-if="showTopicModal" @click.self="showTopicModal = false">
        <view class="topic-modal-content">
          <view class="topic-modal-header">
            <text class="topic-modal-title">选择话题</text>
            <text class="topic-modal-count">{{ topics.length }}/3</text>
          </view>
          <view class="topic-modal-body">
            <view 
              v-for="t in availableTopics" 
              :key="t.id"
              class="topic-item"
              :class="{ selected: topics.some(x => x.id === t.id) }"
              @click="toggleTopic(t)"
            >
              {{ t.name }}
            </view>
          </view>
          <view class="topic-modal-footer">
            <view class="topic-selected" v-if="topics.length > 0">
              <text class="topic-selected-label">已选：</text>
              <text 
                v-for="t in topics" 
                :key="t.id"
                class="topic-selected-item"
                @click="toggleTopic(t)"
              >
                #{{ t.name }} ×
              </text>
            </view>
            <button class="topic-confirm-btn" @click="showTopicModal = false">确定</button>
          </view>
        </view>
      </view>
      
      <view class="visibility-setting">
        <text class="label">谁可以看</text>
        <view class="options">
          <view 
            class="option" 
            :class="{ active: visibility === 'public' }" 
            @click="visibility = 'public'"
          >公开</view>
          <view 
            class="option" 
            :class="{ active: visibility === 'friends' }" 
            @click="visibility = 'friends'"
          >仅关注</view>
          <view 
            class="option" 
            :class="{ active: visibility === 'private' }" 
            @click="visibility = 'private'"
          >私密</view>
          <view 
            class="option" 
            :class="{ active: visibility === 'password' }" 
            @click="visibility = 'password'"
          >密码查看</view>
          <view 
            class="option" 
            :class="{ active: visibility === 'pay' }" 
            @click="visibility = 'pay'"
          >付费查看</view>
        </view>
        <view class="visibility-input" v-if="visibility === 'password'">
          <input 
            type="text" 
            v-model="viewPassword" 
            placeholder="请输入查看密码"
            maxlength="20"
          />
        </view>
        <view class="visibility-input" v-if="visibility === 'pay'">
          <input 
            type="number" 
            v-model="viewPrice" 
            placeholder="请输入查看价格(金币)"
            min="0"
            max="999"
          />
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import { toast } from '../composables/useToast'
import circleService from '../services/circleService'
import { uploadFile } from '../services/uploadService'
import { tagService } from '../services/tagService'
import regionService from '../services/regionService'
import { chooseImages, chooseVideo } from '../services/mediaPicker'
import { isApp } from '../common/platform'

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

const availableTopics = ref([])

const loadTopics = async () => {
  try {
    const res = await tagService.getTags()
    const list = res?.data?.list || res?.data || []
    availableTopics.value = (Array.isArray(list) ? list : [])
      .map(t => ({ id: t.id ?? t.tagId ?? t.tag_id, name: t.name ?? t.tagName ?? t.tag_name ?? '' }))
      .filter(t => t.id != null && t.name)
  } catch (e) {
    console.warn('加载话题失败:', e)
  }
}

const popularLocations = ref([])

// 从 API 加载省份列表作为初始位置显示
const loadPopularLocations = async () => {
  try {
    const res = await regionService.getProvinces()
    if (res.code === 0 || res.code === 200) {
      const cities = res.data || res.list || []
      popularLocations.value = cities.map(c => c.name || c.label || '')
    }
  } catch (e) {
    console.error('加载热门位置失败:', e)
  }
}

onMounted(() => {
  loadPopularLocations()
  loadTopics()
})

const filteredLocations = computed(() => {
  if (!locationSearch.value) return popularLocations.value
  const search = locationSearch.value.toLowerCase()
  return popularLocations.value.filter(loc => (loc || '').toLowerCase().includes(search))
})

const goBack = () => {
  router.back()
}

// 预览地址：H5 用 ObjectURL（需手动释放）；App 直接用 uni 临时路径
const addMediaItem = (file, type) => {
  if (!file || mediaItems.value.length >= 9) return
  const url = isApp ? file.path : URL.createObjectURL(file)
  mediaItems.value.push({ url, type, file })
}

// 点上传：H5 打开原生 <input type=file>；App 无法可靠触发 input，改用 mediaPicker
const triggerFileInput = () => {
  if (!isApp) {
    fileInputRef.value?.click()
    return
  }
  uni.showActionSheet({
    itemList: ['选择图片', '选择视频'],
    success: (res) => {
      if (res.tapIndex === 0) selectAppImages()
      else if (res.tapIndex === 1) selectAppVideo()
    }
  })
}

const selectAppImages = async () => {
  const remainingSlots = 9 - mediaItems.value.length
  if (remainingSlots <= 0) return
  try {
    const { supported, files } = await chooseImages(remainingSlots)
    if (supported) files.forEach((file) => addMediaItem(file, 'image'))
  } catch (err) {
    toast.error(err.message || '选择图片失败')
  }
}

const selectAppVideo = async () => {
  if (mediaItems.value.length >= 9) return
  try {
    const { supported, file } = await chooseVideo()
    if (supported && file) addMediaItem(file, 'video')
  } catch (err) {
    toast.error(err.message || '选择视频失败')
  }
}

const handleFileChange = (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return
  
  const remainingSlots = 9 - mediaItems.value.length
  const filesToAdd = Array.from(files).slice(0, remainingSlots)
  
  filesToAdd.forEach((file) => {
    addMediaItem(file, file.type.startsWith('video/') ? 'video' : 'image')
  })
  
  event.target.value = ''
}

const removeMedia = (index) => {
  const item = mediaItems.value[index]
  // 只有 H5 的 blob: ObjectURL 需要释放，App 的 uni 临时路径不能 revoke
  if (!isApp && item?.url && item.url.startsWith('blob:')) URL.revokeObjectURL(item.url)
  mediaItems.value.splice(index, 1)
}

// 释放所有本地预览 Object URL（F-14，仅 H5 的 blob:）
const revokeAllMedia = () => {
  if (isApp) return
  mediaItems.value.forEach((item) => {
    if (item?.url && item.url.startsWith('blob:')) URL.revokeObjectURL(item.url)
  })
}

onBeforeUnmount(() => {
  revokeAllMedia()
})

const selectLocation = (loc) => {
  location.value = loc
  showLocationModal.value = false
  locationSearch.value = ''
}

// 逆地理编码：H5/App 共用（uni.request 两端都可用），失败时由调用方回退经纬度文本
const resolveLocationName = async (latitude, longitude) => {
  const data = await new Promise((resolve, reject) => {
    uni.request({
      url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh`,
      timeout: 8000,
      dataType: 'json',
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data || {})
        else reject(new Error(`定位服务返回 ${res.statusCode}`))
      },
      fail: (err) => reject(new Error((err && err.errMsg) || '定位服务请求失败'))
    })
  })

  const address = data.address || {}
  const city = address.city || address.town || address.village || ''
  const district = address.suburb || address.district || ''
  return city ? (district ? `${city}·${district}` : city) : ''
}

const applyCurrentLocation = async (latitude, longitude) => {
  try {
    const name = await resolveLocationName(latitude, longitude)
    location.value = name || `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`
  } catch (error) {
    location.value = `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`
  }
  showLocationModal.value = false
}

// uni.getLocation 是回调式 API：Promise 化并把用户拒绝授权收口成 reject，不产生未捕获异常
const getUniLocation = () => new Promise((resolve, reject) => {
  if (typeof uni === 'undefined' || typeof uni.getLocation !== 'function') {
    reject(new Error('not_supported'))
    return
  }
  try {
    uni.getLocation({
      type: 'gcj02',
      success: (res) => resolve(res || {}),
      fail: (err) => reject(new Error((err && err.errMsg) || '定位失败'))
    })
  } catch (e) {
    reject(e)
  }
})

const locateByApp = async () => {
  locationLoading.value = true
  try {
    const { latitude, longitude } = await getUniLocation()
    await applyCurrentLocation(latitude, longitude)
  } catch (error) {
    const message = String((error && error.message) || '')
    if (message === 'not_supported') {
      toast.error('当前环境不支持定位功能')
    } else if (/deny|denied|auth|拒绝/i.test(message)) {
      toast.error('定位权限被拒绝，请在系统设置中开启定位权限')
    } else if (/timeout|超时/i.test(message)) {
      toast.error('定位请求超时')
    } else {
      toast.error('定位失败')
    }
  } finally {
    locationLoading.value = false
  }
}

const getCurrentLocation = () => {
  // App 原生端没有 navigator.geolocation，走 uni 定位；H5 保持浏览器定位逻辑
  if (isApp) {
    locateByApp()
    return
  }

  if (!navigator.geolocation) {
    toast.error('您的浏览器不支持定位功能')
    return
  }
  
  locationLoading.value = true
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords
      await applyCurrentLocation(latitude, longitude)
      locationLoading.value = false
    },
    (error) => {
      locationLoading.value = false
      switch (error.code) {
        case error.PERMISSION_DENIED:
          toast.error('定位权限被拒绝，请在浏览器设置中开启定位权限')
          break
        case error.POSITION_UNAVAILABLE:
          toast.error('无法获取您的位置信息')
          break
        case error.TIMEOUT:
          toast.error('定位请求超时')
          break
        default:
          toast.error('定位失败')
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  )
}

const toggleTopic = (t) => {
  const index = topics.value.findIndex(x => x.id === t.id)
  if (index > -1) {
    topics.value.splice(index, 1)
  } else if (topics.value.length < 3) {
    topics.value.push({ id: t.id, name: t.name })
  }
}

const publish = async () => {
  if (!content.value.trim() && mediaItems.value.length === 0) {
    toast.error('请输入内容或添加图片')
    return
  }
  if (visibility.value === 'password' && !viewPassword.value.trim()) {
    toast.error('请输入查看密码')
    return
  }
  if (visibility.value === 'pay' && (!viewPrice.value || viewPrice.value <= 0)) {
    toast.error('请输入有效的查看金币数')
    return
  }
  
  const visibilityMap = {
    'public': 0,
    'friends': 1,
    'private': 2,
    'password': 3,
    'pay': 4
  }

  // 媒体文件优先前端直传 COS，拿到真实访问 URL 写库（不再存 blob: 本地临时地址）
  const imageItems = mediaItems.value.filter(item => item.type === 'image')
  const videoItems = mediaItems.value.filter(item => item.type === 'video')

  try {
    const [images, videos] = await Promise.all([
      Promise.all(imageItems.map(item => uploadFile(item.file, 'image').then(r => r.data.url))),
      Promise.all(videoItems.map(item => uploadFile(item.file, 'video').then(r => r.data.url)))
    ])

    const postData = {
      content: content.value,
      images,
      videos,
      location: location.value,
      tagIds: topics.value.map(t => t.id),
      visibility: visibilityMap[visibility.value] || 0
    }
    if (visibility.value === 'password') {
      postData.password = viewPassword.value
    }
    if (visibility.value === 'pay') {
      postData.price = parseFloat(viewPrice.value)
    }

    await circleService.createPost(postData)
    toast.success('发布成功')
    // 发布成功后释放本地预览 URL 再离场（F-14）
    revokeAllMedia()
    router.back()
  } catch (error) {
    console.error('发布动态错误:', error)
    toast.error(error.message || '发布失败，请重试')
  }
}
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

.publish-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.content {
  padding: 12px;
  padding-top: 12px;
}

.text-input {
  width: 100%;
  min-height: 150px;
  border: none;
  background: white;
  border-radius: 0px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  font-size: 16px;
  outline: none;
  resize: none;
  box-sizing: border-box;
}

.image-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 12px 0 0;
  background: white;
  border-radius: 0px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  padding: 14px 16px;
  background: white;
  border-radius: 0px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  margin: 12px 0 0;
}

.location-tag .icon, .topic-tag .icon {
  font-size: 20px;
}

.location-tag .text, .topic-tag .text {
  font-size: 15px;
  color: #333;
  flex: 1;
}

.visibility-setting {
  margin-top: 12px;
  background: white;
  border-radius: 0px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  border-color: var(--color-primary);
  color: var(--color-primary);
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
  border-color: var(--color-primary);
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
  justify-content: center;
  z-index: 1000;
}

.topic-modal-content {
  width: 100%;
  max-width: var(--layout-max-width-pc, 650px);
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
  color: var(--color-primary);
  border-color: var(--color-primary);
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
  color: var(--color-primary);
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
  justify-content: center;
  z-index: 1000;
}

.location-modal-content {
  width: 100%;
  max-width: var(--layout-max-width-pc, 650px);
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
  color: var(--color-primary);
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
  border-color: var(--color-primary);
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
  color: var(--color-primary);
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
  color: var(--color-primary);
  font-size: 16px;
  font-weight: bold;
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
