<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">我的相册</text>
      <text class="add-btn" @click="handleAddClick">+</text>
    </template>

    <view class="content">
      <view class="album-info" v-if="!isLoading">
        <view class="album-stats">
          <view class="stat-item">
            <view class="stat-num">{{ totalPhotos }}</view>
            <view class="stat-label">照片</view>
          </view>
          <view class="stat-item">
            <view class="stat-num">{{ totalViews }}</view>
            <view class="stat-label">浏览</view>
          </view>
          <view class="stat-item">
            <view class="stat-num">{{ totalLikes }}</view>
            <view class="stat-label">获赞</view>
          </view>
        </view>
      </view>

      <view class="loading-state" v-if="isLoading">
        <view class="loading-spinner"></view>
        <view class="loading-text">加载中...</view>
      </view>

      <view class="album-grid" v-else-if="photos.length > 0">
        <view class="photo-item" v-for="photo in photos" :key="photo.id" @click="viewPhoto(photo)">
          <image mode="aspectFill" class="photo-img" :src="photo.url" alt="" />
          <view class="photo-overlay">
            <text class="photo-likes" :class="{ active: photo.isLiked }" @click.stop="toggleLike(photo)">
              {{ photo.isLiked ? '❤️' : '🤍' }} {{ photo.likeCount }}
            </text>
          </view>
        </view>
      </view>

      <EmptyState v-else-if="!isLoading" icon="📷" text="暂无照片" hint="点击右上角添加照片" />

      <view class="load-more" v-if="hasMore && !isLoading" @click="loadMore">
        加载更多
      </view>
    </view>

    <view class="viewer" v-if="currentPhoto" @click.self="closeViewer">
      <view class="viewer-close" @click="closeViewer">✕</view>
      <image class="viewer-img" mode="aspectFit" style="width:100%;height:70vh;" :src="currentPhoto.url" />
      <view class="viewer-info">
        <view class="viewer-desc" v-if="currentPhoto.description">{{ currentPhoto.description }}</view>
        <view class="viewer-time">{{ formatDate(currentPhoto.createdAt) }}</view>
      </view>
      <view class="viewer-actions">
        <button class="viewer-btn like-btn" :class="{ active: currentPhoto.isLiked }" @click="toggleLike(currentPhoto)">
          {{ currentPhoto.isLiked ? '❤️ 取消点赞' : '🤍 点赞' }}
        </button>
        <button class="viewer-btn delete-btn" @click="deleteCurrentPhoto">删除</button>
      </view>
    </view>

    <view class="modal" v-if="showAdd" @click.self="showAdd = false">
      <view class="modal-content">
        <view class="modal-title">添加照片</view>
        <view class="modal-body">
          <view class="upload-area" @click="triggerUpload" ref="uploadArea">
            <view class="upload-icon">📷</view>
            <view class="upload-text">点击上传照片</view>
            <view class="upload-hint">支持 jpg、png 格式，可多选</view>
            <input type="file" ref="fileInput" accept="image/*" style="display: none" @change="handleFileChange" multiple />
          </view>
          <view class="desc-input" v-if="previewUrls.length > 0">
            <input
              type="text"
              v-model="photoDescription"
              placeholder="添加描述..."
              class="description-input"
              maxlength="50"
            />
          </view>
          <view class="privacy-section" v-if="previewUrls.length > 0">
            <view class="privacy-title">隐私设置</view>
            <view class="privacy-options">
              <label class="privacy-option">
                <input type="radio" v-model="privacySetting" value="public" />
                <text>公开可见</text>
              </label>
              <label class="privacy-option">
                <input type="radio" v-model="privacySetting" value="friends" />
                <text>好友可见</text>
              </label>
              <label class="privacy-option">
                <input type="radio" v-model="privacySetting" value="password" />
                <text>密码保护</text>
              </label>
              <label class="privacy-option">
                <input type="radio" v-model="privacySetting" value="paid" />
                <text>付费查看</text>
              </label>
              <label class="privacy-option">
                <input type="radio" v-model="privacySetting" value="private" />
                <text>仅自己可见</text>
              </label>
            </view>
            <view class="privacy-password" v-if="privacySetting === 'password'">
              <input type="password" v-model="privacyPassword" placeholder="设置访问密码" class="password-input" />
            </view>
            <view class="privacy-price" v-if="privacySetting === 'paid'">
              <input type="number" v-model="privacyPrice" placeholder="设置查看价格（金币）" class="price-input" />
            </view>
          </view>
          <view class="preview-list" v-if="previewUrls.length > 0">
            <view class="preview-item" v-for="(preview, index) in previewUrls" :key="index">
              <image mode="aspectFill" class="preview-img" :src="preview.url" alt="" />
              <view class="preview-remove" @click="removePreview(index)">✕</view>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="cancelAdd">取消</button>
          <button class="modal-btn confirm" :disabled="previewUrls.length === 0 || isUploading" @click="confirmAdd">
            <text v-if="isUploading">上传中...</text>
            <text v-else>确定</text>
          </button>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import { albumService } from '@/services/albumService'
import { isLoggedIn } from '@/common/common'
import PageLayout from '../components/PageLayout.vue'
import EmptyState from '../components/EmptyState.vue'
import { toast } from '../composables/useToast'
import { chooseImages } from '../services/mediaPicker'
import { isApp } from '../common/platform'

const router = useRouter()

const isLoading = ref(false)
const isUploading = ref(false)
const photos = ref([])
const currentPage = ref(1)
const hasMore = ref(false)
const currentPhoto = ref(null)
const showAdd = ref(false)
const fileInput = ref(null)
const previewUrls = ref([])
const photoDescription = ref('')
const privacySetting = ref('public')
const privacyPassword = ref('')
const privacyPrice = ref(0)
// App 端 uni.chooseImage 单次最多 9 张；相册总数上限仍由后端额度（基础 20/Lv.25 扩容 50）校验
const MAX_PICK_COUNT = 9

const serverTotal = ref(0)
const totalPhotos = computed(() => serverTotal.value || photos.value.length)
const totalViews = computed(() => photos.value.reduce((sum, p) => sum + (p.views || 0), 0))
const totalLikes = computed(() => photos.value.reduce((sum, p) => sum + (Number(p.likeCount) || 0), 0))

const goBack = () => {
  router.back()
}

const checkLogin = () => {
  if (!isLoggedIn()) {
    router.push('/login')
    return false
  }
  return true
}

const handleAddClick = () => {
  if (checkLogin()) {
    showAdd.value = true
  }
}

const loadPhotos = async (page = 1, append = false, silent = false) => {
  if (!silent) isLoading.value = true
  try {
    const result = await albumService.getPhotos(page)
    // 后端成功码为 200（request 层对 2xx 归一），列表/总数在 data.list/data.total
    if (result.code === 0 || result.code === 200) {
      const payload = result.data || {}
      const list = Array.isArray(payload.list) ? payload.list : []
      photos.value = append ? [...photos.value, ...list] : list
      serverTotal.value = Number(payload.total) || photos.value.length
      hasMore.value = photos.value.length < serverTotal.value
      currentPage.value = page
    }
  } catch (error) {
    console.error('加载照片失败:', error)
  } finally {
    if (!silent) isLoading.value = false
  }
}

const loadMore = () => {
  if (hasMore.value) {
    loadPhotos(currentPage.value + 1, true)
  }
}

const viewPhoto = (photo) => {
  currentPhoto.value = { ...photo }
}

const closeViewer = () => {
  currentPhoto.value = null
}

const toggleLike = async (photo) => {
  if (!checkLogin()) return
  try {
    const result = await albumService.likePhoto(photo.id)
    if (result.code === 0 || result.code === 200) {
      const updated = result.data || {}
      const patch = { isLiked: !!updated.isLiked, likeCount: Number(updated.likeCount) || 0 }
      const index = photos.value.findIndex(p => p.id === photo.id)
      if (index !== -1) {
        photos.value[index] = { ...photos.value[index], ...patch }
      }
      if (currentPhoto.value && currentPhoto.value.id === photo.id) {
        currentPhoto.value = { ...currentPhoto.value, ...patch }
      }
    }
  } catch (error) {
    toast.error(error.message || '点赞失败，请重试')
  }
}

// App 原生端没有可靠的 window.confirm：统一用 uni.showModal 二次确认；H5 保持 confirm 原逻辑
const confirmAction = (message) => new Promise((resolve) => {
  if (isApp) {
    if (typeof uni !== 'undefined' && typeof uni.showModal === 'function') {
      uni.showModal({
        title: '提示',
        content: message,
        success: (res) => resolve(!!res.confirm),
        fail: () => resolve(false)
      })
    } else {
      // 原生端拿不到 uni.showModal 时按「取消」处理，避免无法确认就执行破坏性操作
      resolve(false)
    }
    return
  }
  resolve(confirm(message))
})

const deleteCurrentPhoto = async () => {
  if (!currentPhoto.value) return
  if (await confirmAction('确定要删除这张照片吗？')) {
    const result = await albumService.deletePhoto(currentPhoto.value.id)
    if (result.code === 0 || result.code === 200) {
      photos.value = photos.value.filter(p => p.id !== currentPhoto.value.id)
      currentPhoto.value = null
    } else {
      toast.error(result.message || '删除失败')
    }
  }
}

// App 端没有可点击的 <input type=file>，统一走 mediaPicker（相册/相机）
const triggerUpload = async () => {
  if (!isApp) { fileInput.value?.click(); return }
  const remaining = MAX_PICK_COUNT - previewUrls.value.length
  if (remaining <= 0) {
    toast.error(`一次最多添加 ${MAX_PICK_COUNT} 张图片`)
    return
  }
  try {
    const { supported, files } = await chooseImages(remaining)
    if (supported && files.length) await appendPreviewFiles(files)
  } catch (err) {
    toast.error(err.message || '选择图片失败')
  }
}

// H5 与 App 共用：H5 仍用 FileReader 转 dataURL 预览（file 原样保留给确认上传），
// App 直接用 mediaPicker 的临时路径预览，确认时把 { path, ... } 交给 uploadFile
const appendPreviewFile = (file) => new Promise((resolve) => {
  if (isApp) {
    previewUrls.value.push({ url: file.path, file })
    resolve()
    return
  }
  const reader = new FileReader()
  reader.onload = (event) => {
    previewUrls.value.push({
      url: event.target?.result || '',
      file: file
    })
    resolve()
  }
  reader.readAsDataURL(file)
})

const appendPreviewFiles = async (files) => {
  for (const file of files) {
    // H5 保持原有「一次选择不限张数」的行为；App 受 uni.chooseImage 单批上限约束
    if (isApp && previewUrls.value.length >= MAX_PICK_COUNT) break
    await appendPreviewFile(file)
  }
}

const handleFileChange = async (e) => {
  const files = e.target.files
  const picked = files ? Array.from(files) : []
  e.target.value = ''
  if (!picked.length) return
  previewUrls.value = []
  await appendPreviewFiles(picked)
}

const clearPreview = () => {
  previewUrls.value = []
  photoDescription.value = ''
  privacySetting.value = 'public'
  privacyPassword.value = ''
  privacyPrice.value = 0
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const removePreview = (index) => {
  previewUrls.value.splice(index, 1)
}

const cancelAdd = () => {
  clearPreview()
  showAdd.value = false
}

const confirmAdd = async () => {
  if (previewUrls.value.length === 0 || isUploading.value) return

  isUploading.value = true
  try {
    const uploadResults = []
    for (let i = 0; i < previewUrls.value.length; i++) {
      const previewItem = previewUrls.value[i]
      const result = await albumService.uploadPhoto(
        previewItem.file, 
        photoDescription.value,
        privacySetting.value,
        privacyPassword.value,
        privacyPrice.value
      )
      if (result?.data) {
        // 后端上传返回 { id, url }，补齐列表展示字段，避免新照片点赞/计数为 undefined
        uploadResults.push({ ...result.data, isLiked: false, likeCount: 0 })
      }
    }
    
    if (uploadResults.length > 0) {
      photos.value.unshift(...uploadResults)
      cancelAdd()
      if (uploadResults.length < previewUrls.value.length) {
        toast.warning(`部分图片上传成功，成功 ${uploadResults.length} 张，失败 ${previewUrls.value.length - uploadResults.length} 张`)
      }
    } else {
      toast.error('上传失败')
    }
  } catch (error) {
    // 相册额度（Lv.25 扩容）等服务端拒绝原因必须可见，否则只剩一句「上传失败」
    toast.error(error?.message || '上传失败，请稍后重试')
  } finally {
    isUploading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 返回相册页时静默刷新第一页，不闪骨架屏、不重复首载
const refreshOnShow = () => {
  if (!isLoggedIn()) return
  currentPage.value = 1
  loadPhotos(1, false, true)
}

onMounted(() => {
  if (checkLogin()) {
    loadPhotos()
  }
})
// 首次 onShow 由 onMounted 首载，后续 onShow（返回本页）才静默刷新
let __firstShow = true
onShow(() => {
  if (__firstShow) {
    __firstShow = false
    return
  }
  refreshOnShow()
})
</script>

<style scoped>
.back-btn,
.add-btn {
  width: 40px;
  font-size: 24px;
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
  padding: 20px;
}

.album-info {
  background: white;
  border-radius: 0px;
  padding: 20px;
  margin: 12px 20px 0;
  display: flex;
  align-items: center;
  gap: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.album-stats {
  flex: 1;
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-num {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #999;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: #999;
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background: linear-gradient(transparent, rgba(0,0,0,0.5));
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.photo-likes {
  font-size: 14px;
  color: white;
  cursor: pointer;
  transition: transform 0.2s;
}

.photo-likes.active {
  transform: scale(1.1);
}

.photo-likes:hover {
  transform: scale(1.1);
}

.load-more {
  text-align: center;
  padding: 16px;
  color: var(--color-primary);
  font-size: 14px;
  cursor: pointer;
}

.viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.viewer-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  cursor: pointer;
  z-index: 10;
}

.viewer-img {
  flex: 1;
  width: 100%;
  object-fit: contain;
}

.viewer-info {
  padding: 16px 20px;
  background: rgba(0,0,0,0.7);
}

.viewer-desc {
  color: white;
  font-size: 14px;
  margin-bottom: 8px;
}

.viewer-time {
  color: rgba(255,255,255,0.6);
  font-size: 12px;
}

.viewer-actions {
  padding: 20px;
  display: flex;
  justify-content: center;
  gap: 16px;
}

.viewer-btn {
  padding: 12px 24px;
  font-size: 14px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
}

.like-btn {
  background: #333;
  color: white;
}

.like-btn.active {
  background: #ff6b6b;
}

.delete-btn {
  background: #ff6b6b;
  color: white;
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
  z-index: 9999;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 420px;
  max-height: 80vh;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}

.modal-title {
  padding: 20px 20px 16px;
  font-size: 17px;
  font-weight: bold;
  text-align: center;
  color: #333;
}

.modal-body {
  flex: 1;
  padding: 0 20px 20px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.upload-area {
  border: 2px dashed #e0e0e0;
  border-radius: 16px;
  padding: 32px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.upload-area:hover {
  border-color: var(--color-primary);
  background: rgba(102,126,234,0.08);
}

.upload-area.dragover {
  border-color: var(--color-primary);
  background: rgba(102,126,234,0.12);
  transform: scale(1.02);
}

.upload-icon {
  font-size: 40px;
  margin-bottom: 10px;
  opacity: 0.8;
}

.upload-text {
  font-size: 15px;
  color: #333;
  margin-bottom: 6px;
  font-weight: 500;
}

.upload-hint {
  font-size: 12px;
  color: #999;
}

.desc-input {
  margin-top: 18px;
}

.description-input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  font-size: 14px;
  box-sizing: border-box;
  background: #fafafa;
  transition: all 0.2s;
}

.description-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
}

.preview-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 18px;
}

.preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  background: rgba(0,0,0,0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.preview-remove:hover {
  background: rgba(255,107,107,0.9);
  transform: scale(1.1);
}

.privacy-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.privacy-title {
  font-size: 13px;
  font-weight: 500;
  color: #666;
  margin-bottom: 10px;
}

.privacy-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.privacy-option {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #f8f8f8;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.privacy-option:hover {
  background: #f0f0f0;
}

.privacy-option input[type="radio"] {
  display: none;
}

.privacy-option text {
  font-size: 13px;
  color: #666;
}

.privacy-option input[type="radio"]:checked + text {
  color: var(--color-primary);
  font-weight: 500;
}

.privacy-option input[type="radio"]:checked {
  background: var(--color-primary);
}

.privacy-option:has(input[type="radio"]:checked) {
  background: rgba(102, 126, 234, 0.1);
}

.privacy-password,
.privacy-price {
  margin-top: 12px;
}

.password-input,
.price-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.password-input:focus,
.price-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.modal-footer {
  display: flex;
  border-top: 1px solid #f0f0f0;
  padding: 14px 16px;
  padding-bottom: calc(14px + env(safe-area-inset-bottom));
  background: #fff;
  gap: 14px;
}

.modal-btn {
  flex: 1;
  padding: 15px 24px;
  font-size: 16px;
  font-weight: 500;
  border: none;
  border-radius: 28px;
  cursor: pointer;
  transition: all 0.25s;
}

.modal-btn.cancel {
  color: #666;
  background: #f8f8f8;
}

.modal-btn.cancel:hover {
  background: #f0f0f0;
  transform: translateY(-1px);
}

.modal-btn.confirm {
  color: #fff;
  background: var(--gradient-primary);
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102,126,234,0.35);
}

.modal-btn.confirm:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102,126,234,0.4);
}

.modal-btn.confirm:active:not(:disabled) {
  transform: translateY(0);
}

.modal-btn.confirm:disabled {
  color: #999;
  background: #f0f0f0;
  cursor: not-allowed;
  box-shadow: none;
}
</style>