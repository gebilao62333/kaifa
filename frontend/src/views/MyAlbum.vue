<template>
  <div class="album-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">我的相册</span>
      <span class="add-btn" @click="handleAddClick">+</span>
    </div>

    <div class="content">
      <div class="album-info" v-if="!isLoading">
        <div class="album-stats">
          <div class="stat-item">
            <div class="stat-num">{{ totalPhotos }}</div>
            <div class="stat-label">照片</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">{{ totalViews }}</div>
            <div class="stat-label">浏览</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">{{ totalLikes }}</div>
            <div class="stat-label">获赞</div>
          </div>
        </div>
      </div>

      <div class="loading-state" v-if="isLoading">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载中...</div>
      </div>

      <div class="album-grid" v-else-if="photos.length > 0">
        <div class="photo-item" v-for="photo in photos" :key="photo.id" @click="viewPhoto(photo)">
          <img class="photo-img" :src="photo.url" alt="" />
          <div class="photo-overlay">
            <span class="photo-likes" :class="{ active: photo.liked }" @click.stop="toggleLike(photo)">
              {{ photo.liked ? '❤️' : '🤍' }} {{ photo.likes }}
            </span>
          </div>
        </div>
      </div>

      <div class="empty-state" v-else-if="!isLoading">
        <div class="empty-icon">📷</div>
        <div class="empty-text">暂无照片</div>
        <div class="empty-hint">点击右上角添加照片</div>
      </div>

      <div class="load-more" v-if="hasMore && !isLoading" @click="loadMore">
        加载更多
      </div>
    </div>

    <div class="viewer" v-if="currentPhoto" @click.self="closeViewer">
      <div class="viewer-close" @click="closeViewer">✕</div>
      <img class="viewer-img" :src="currentPhoto.url" alt="" />
      <div class="viewer-info">
        <div class="viewer-desc" v-if="currentPhoto.description">{{ currentPhoto.description }}</div>
        <div class="viewer-time">{{ formatDate(currentPhoto.createdAt) }}</div>
      </div>
      <div class="viewer-actions">
        <button class="viewer-btn like-btn" :class="{ active: currentPhoto.liked }" @click="toggleLike(currentPhoto)">
          {{ currentPhoto.liked ? '❤️ 取消点赞' : '🤍 点赞' }}
        </button>
        <button class="viewer-btn delete-btn" @click="deleteCurrentPhoto">删除</button>
      </div>
    </div>

    <div class="modal" v-if="showAdd" @click.self="showAdd = false">
      <div class="modal-content">
        <div class="modal-title">添加照片</div>
        <div class="modal-body">
          <div class="upload-area" @click="triggerUpload" ref="uploadArea">
            <div class="upload-icon">📷</div>
            <div class="upload-text">点击上传照片</div>
            <div class="upload-hint">支持 jpg、png 格式，可多选</div>
            <input type="file" ref="fileInput" accept="image/*" style="display: none" @change="handleFileChange" multiple />
          </div>
          <div class="desc-input" v-if="previewUrls.length > 0">
            <input
              type="text"
              v-model="photoDescription"
              placeholder="添加描述..."
              class="description-input"
              maxlength="50"
            />
          </div>
          <div class="privacy-section" v-if="previewUrls.length > 0">
            <div class="privacy-title">隐私设置</div>
            <div class="privacy-options">
              <label class="privacy-option">
                <input type="radio" v-model="privacySetting" value="public" />
                <span>公开可见</span>
              </label>
              <label class="privacy-option">
                <input type="radio" v-model="privacySetting" value="friends" />
                <span>好友可见</span>
              </label>
              <label class="privacy-option">
                <input type="radio" v-model="privacySetting" value="password" />
                <span>密码保护</span>
              </label>
              <label class="privacy-option">
                <input type="radio" v-model="privacySetting" value="paid" />
                <span>付费查看</span>
              </label>
              <label class="privacy-option">
                <input type="radio" v-model="privacySetting" value="private" />
                <span>仅自己可见</span>
              </label>
            </div>
            <div class="privacy-password" v-if="privacySetting === 'password'">
              <input type="password" v-model="privacyPassword" placeholder="设置访问密码" class="password-input" />
            </div>
            <div class="privacy-price" v-if="privacySetting === 'paid'">
              <input type="number" v-model="privacyPrice" placeholder="设置查看价格（金币）" class="price-input" />
            </div>
          </div>
          <div class="preview-list" v-if="previewUrls.length > 0">
            <div class="preview-item" v-for="(preview, index) in previewUrls" :key="index">
              <img class="preview-img" :src="preview.url" alt="" />
              <div class="preview-remove" @click="removePreview(index)">✕</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel" @click="cancelAdd">取消</button>
          <button class="modal-btn confirm" :disabled="previewUrls.length === 0 || isUploading" @click="confirmAdd">
            <span v-if="isUploading">上传中...</span>
            <span v-else>确定</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { albumService } from '@/services/albumService'
import { isLoggedIn } from '../common/common'

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

const totalPhotos = computed(() => photos.value.length)
const totalViews = computed(() => photos.value.reduce((sum, p) => sum + (p.views || 0), 0))
const totalLikes = computed(() => photos.value.reduce((sum, p) => sum + (p.likes || 0), 0))

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

const loadPhotos = async (page = 1, append = false) => {
  isLoading.value = true
  try {
    const result = await albumService.getPhotos(page)
    if (result.code === 0) {
      if (append) {
        photos.value = [...photos.value, ...result.data.list]
      } else {
        photos.value = result.data.list
      }
      hasMore.value = result.data.hasMore
      currentPage.value = page
    }
  } catch (error) {
    console.error('加载照片失败:', error)
  } finally {
    isLoading.value = false
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
  const result = await albumService.likePhoto(photo.id)
  if (result.code === 0) {
    const updatedPhoto = result.data
    const index = photos.value.findIndex(p => p.id === photo.id)
    if (index !== -1) {
      photos.value[index] = updatedPhoto
    }
    if (currentPhoto.value && currentPhoto.value.id === photo.id) {
      currentPhoto.value = updatedPhoto
    }
  }
}

const deleteCurrentPhoto = async () => {
  if (!currentPhoto.value) return
  if (confirm('确定要删除这张照片吗？')) {
    const result = await albumService.deletePhoto(currentPhoto.value.id)
    if (result.code === 0) {
      photos.value = photos.value.filter(p => p.id !== currentPhoto.value.id)
      currentPhoto.value = null
    } else {
      alert(result.message || '删除失败')
    }
  }
}

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileChange = (e) => {
  const files = e.target.files
  if (files && files.length > 0) {
    previewUrls.value = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const reader = new FileReader()
      reader.onload = (event) => {
        previewUrls.value.push({
          url: event.target?.result || '',
          file: file
        })
      }
      reader.readAsDataURL(file)
    }
  }
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
      if (result.code === 0) {
        uploadResults.push(result.data)
      }
    }
    
    if (uploadResults.length > 0) {
      photos.value.unshift(...uploadResults)
      cancelAdd()
      if (uploadResults.length < previewUrls.value.length) {
        alert(`部分图片上传成功，成功 ${uploadResults.length} 张，失败 ${previewUrls.value.length - uploadResults.length} 张`)
      }
    } else {
      alert('上传失败')
    }
  } finally {
    isUploading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  if (checkLogin()) {
    loadPhotos()
  }
})
</script>

<style scoped>
.album-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  padding-top: 82px;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: -webkit-linear-gradient(315deg, #667eea 0%, #764ba2 100%);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.back-btn,
.add-btn {
  width: 40px;
  font-size: 24px;
  color: white;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.content {
  padding: 16px;
}

.album-info {
  background: white;
  border-radius: 10px;
  padding: 24px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 24px;
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
  border-top-color: #667eea;
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

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-text {
  font-size: 16px;
  color: #999;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: #ccc;
}

.load-more {
  text-align: center;
  padding: 16px;
  color: #667eea;
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
  border-color: #667eea;
  background: rgba(102,126,234,0.08);
}

.upload-area.dragover {
  border-color: #667eea;
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
  border-color: #667eea;
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

.privacy-option span {
  font-size: 13px;
  color: #666;
}

.privacy-option input[type="radio"]:checked + span {
  color: #667eea;
  font-weight: 500;
}

.privacy-option input[type="radio"]:checked {
  background: #667eea;
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
  border-color: #667eea;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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