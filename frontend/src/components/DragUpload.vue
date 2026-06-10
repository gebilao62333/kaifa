<template>
  <div
    class="drag-upload"
    :class="{ 'drag-over': isDragOver, 'has-preview': previewUrl }"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      @change="onFileSelect"
      class="file-input"
    />

    <!-- 预览区域 -->
    <div v-if="previewUrl" class="preview-area">
      <img v-if="isImage" :src="previewUrl" class="preview-image" @click="triggerInput" />
      <video v-else-if="isVideo" :src="previewUrl" class="preview-video" controls @click="triggerInput"></video>
      <div v-else class="file-info" @click="triggerInput">
        <span class="file-icon">📄</span>
        <span class="file-name">{{ fileName }}</span>
      </div>
      <button class="remove-btn" @click.stop="handleRemove" v-if="!disabled">✕</button>
    </div>

    <!-- 拖拽占位 -->
    <div v-else class="placeholder" @click="triggerInput">
      <div class="upload-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      <p class="placeholder-text">{{ placeholder }}</p>
      <p class="placeholder-hint" v-if="hint">{{ hint }}</p>
    </div>

    <!-- 进度条 -->
    <div v-if="uploading" class="progress-bar">
      <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      <span class="progress-text">{{ progress }}%</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Object, File], default: null },
  accept: { type: String, default: 'image/*' },
  multiple: { type: Boolean, default: false },
  maxSize: { type: Number, default: 10 * 1024 * 1024 }, // 10MB
  placeholder: { type: String, default: '拖拽文件到此处，或点击上传' },
  hint: { type: String, default: '支持图片、视频等格式' },
  disabled: { type: Boolean, default: false },
  autoUpload: { type: Boolean, default: false },
  uploadUrl: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'upload-success', 'upload-error', 'file-selected'])

const fileInput = ref(null)
const isDragOver = ref(false)
const previewUrl = ref('')
const fileName = ref('')
const uploading = ref(false)
const progress = ref(0)

const isImage = computed(() => {
  if (!fileName.value) return false
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(fileName.value)
})

const isVideo = computed(() => {
  if (!fileName.value) return false
  return /\.(mp4|webm|ogg|mov|avi)$/i.test(fileName.value)
})

// 监听外部值变化
watch(() => props.modelValue, (val) => {
  if (!val) {
    previewUrl.value = ''
    fileName.value = ''
  }
})

const triggerInput = () => {
  if (props.disabled || uploading.value) return
  fileInput.value?.click()
}

const onDragEnter = () => { if (!props.disabled) isDragOver.value = true }
const onDragOver = () => { if (!props.disabled) isDragOver.value = true }
const onDragLeave = () => { isDragOver.value = false }
const onDrop = (e) => {
  isDragOver.value = false
  if (props.disabled) return
  const files = e.dataTransfer.files
  if (files.length > 0) {
    handleFile(files[0])
  }
}

const onFileSelect = (e) => {
  const files = e.target.files
  if (files && files.length > 0) {
    handleFile(files[0])
  }
  // 重置 input 以便重复选择同一文件
  if (fileInput.value) fileInput.value.value = ''
}

const handleFile = (file) => {
  if (file.size > props.maxSize) {
    emit('upload-error', `文件过大，最大支持 ${formatSize(props.maxSize)}`)
    return
  }
  fileName.value = file.name
  emit('file-selected', file)

  // 生成本地预览
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target.result
    emit('update:modelValue', e.target.result)
  }
  reader.readAsDataURL(file)

  if (props.autoUpload && props.uploadUrl) {
    startUpload(file)
  }
}

const startUpload = async (file) => {
  uploading.value = true
  progress.value = 0
  try {
    const formData = new FormData()
    formData.append('file', file)
    // 模拟上传进度
    const timer = setInterval(() => {
      if (progress.value < 90) progress.value += Math.random() * 15
    }, 300)
    const response = await fetch(props.uploadUrl, { method: 'POST', body: formData })
    clearInterval(timer)
    progress.value = 100
    const result = await response.json()
    setTimeout(() => {
      uploading.value = false
      emit('upload-success', result)
    }, 500)
  } catch (err) {
    uploading.value = false
    progress.value = 0
    emit('upload-error', err.message || '上传失败')
  }
}

const handleRemove = () => {
  previewUrl.value = ''
  fileName.value = ''
  emit('update:modelValue', null)
}

const formatSize = (bytes) => {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return bytes + 'B'
}

defineExpose({ triggerInput, handleRemove })
</script>

<style scoped>
.drag-upload {
  position: relative;
  border: 2px dashed #d0d5dd;
  border-radius: 12px;
  background: #fafbfc;
  transition: all 0.2s ease;
  cursor: pointer;
  overflow: hidden;
  min-height: 160px;
}

.drag-upload:hover {
  border-color: #667eea;
  background: #f0f2ff;
}

.drag-upload.drag-over {
  border-color: #667eea;
  background: #eef0ff;
  transform: scale(1.01);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
}

.drag-upload.has-preview {
  border-style: solid;
  border-color: #e0e0e0;
  min-height: auto;
}

.file-input {
  display: none;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 160px;
}

.upload-icon {
  color: #667eea;
  margin-bottom: 12px;
  opacity: 0.7;
}

.drag-over .upload-icon {
  opacity: 1;
  transform: translateY(-4px);
}

.placeholder-text {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.placeholder-hint {
  font-size: 12px;
  color: #999;
}

/* 预览 */
.preview-area {
  position: relative;
  padding: 8px;
}

.preview-image,
.preview-video {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
  display: block;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.file-icon { font-size: 28px; }
.file-name { font-size: 14px; color: #333; word-break: break-all; }

.remove-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.5);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.remove-btn:hover { background: rgba(255,0,0,0.7); }

/* 进度条 */
.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 28px;
  background: rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
  border-radius: 0 0 12px 12px;
}

.progress-text {
  position: relative;
  z-index: 1;
  font-size: 12px;
  color: #333;
  font-weight: 600;
}
</style>
