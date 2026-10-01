<template>
  <PageLayout>
    <template #nav>
      <span class="back-btn" @click="goBack">←</span>
      <span class="nav-title">意见反馈</span>
      <span class="placeholder"></span>
    </template>

    <div class="content">
      <div class="type-card">
        <div class="section-title">反馈类型</div>
        <div class="type-grid">
          <div class="type-item" :class="{ active: feedbackType === item.value }" v-for="item in typeList" :key="item.value" @click="feedbackType = item.value">
            <span class="type-icon">{{ item.icon }}</span>
            <span class="type-text">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <div class="form-card">
        <div class="form-item">
          <div class="form-label">
            反馈内容
            <span class="count">{{ feedbackContent.length }}/500</span>
          </div>
          <textarea class="form-textarea" v-model="feedbackContent" placeholder="请详细描述您遇到的问题或建议..." maxlength="500"></textarea>
        </div>

        <div class="form-item">
          <div class="form-label">上传图片（选填）</div>
          <div class="upload-list">
            <div class="upload-item" v-for="(img, index) in uploadImages" :key="index">
              <img class="upload-img" :src="img" alt="" />
              <span class="upload-remove" @click="removeImage(index)">×</span>
            </div>
            <div class="upload-btn" @click="uploadImage" v-if="uploadImages.length < 6">
              <span class="upload-add">+</span>
              <span class="upload-hint">{{ uploadImages.length }}/6</span>
            </div>
          </div>
        </div>

        <div class="form-item">
          <div class="form-label">联系方式（选填）</div>
          <input type="text" class="form-input" v-model="contact" placeholder="手机号或微信，方便我们联系您" />
        </div>
      </div>

      <button class="submit-btn" @click="submitFeedback">提交反馈</button>

      <div class="history-card">
        <div class="section-title">我的反馈</div>
        <div class="history-list">
          <div class="history-item" v-for="(item, index) in historyList" :key="index">
            <div class="history-header">
              <div class="history-type">{{ item.type }}</div>
              <div class="history-status" :class="item.status">{{ item.statusText }}</div>
            </div>
            <div class="history-content">{{ item.content }}</div>
            <div class="history-time">{{ item.time }}</div>
          </div>
        </div>
      </div>
    </div>

    <input type="file" ref="fileInput" accept="image/*" multiple style="display: none" @change="handleFileChange" />
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '../components/PageLayout.vue'
import { toast } from '../composables/useToast'
import { uploadFile } from '../services/uploadService'
import feedbackService from '../services/feedbackService'

const router = useRouter()

const feedbackType = ref('bug')
const feedbackContent = ref('')
const contact = ref('')
const uploadImages = ref([])
const fileInput = ref(null)
const uploading = ref(false)
const submitting = ref(false)

const typeList = [
  { label: '功能问题', value: 'bug', icon: '⚠️' },
  { label: '意见建议', value: 'suggest', icon: '💡' },
  { label: '内容举报', value: 'report', icon: '🚫' },
  { label: '其他问题', value: 'other', icon: '❓' },
]

const historyList = ref([])

const formatTime = (sec) => {
  if (!sec) return ''
  return new Date(Number(sec) * 1000).toLocaleString()
}

const loadHistory = async () => {
  try {
    const res = await feedbackService.getMyFeedbacks({ page: 1, pageSize: 20 })
    if (res?.code === 200 && res.data) {
      historyList.value = (res.data.list || []).map(item => ({
        type: item.typeText || '其他问题',
        status: item.status,
        statusText: item.statusText,
        content: item.content,
        time: formatTime(item.createTime)
      }))
    }
  } catch (e) {
    console.warn('加载反馈历史失败:', e?.message)
  }
}

onMounted(loadHistory)

const goBack = () => {
  router.back()
}

const uploadImage = () => {
  fileInput.value?.click()
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024

// 截图选中后立即上传，列表中保存的是可提交的URL而非base64
const handleFileChange = async (e) => {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  if (!files.length || uploading.value) return

  uploading.value = true
  try {
    for (const file of files) {
      if (uploadImages.value.length >= 6) {
        toast.error('最多上传6张图片')
        break
      }
      if (!file.type?.startsWith('image/')) {
        toast.error(`${file.name} 不是图片文件`)
        continue
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`${file.name} 超过10MB`)
        continue
      }
      try {
        const res = await uploadFile(file, 'image')
        if (res?.code === 200 && res.data?.url) {
          uploadImages.value.push(res.data.url)
        } else {
          toast.error(res?.message || '图片上传失败')
        }
      } catch (err) {
        toast.error(err.message || '图片上传失败')
      }
    }
  } finally {
    uploading.value = false
  }
}

const removeImage = (index) => {
  uploadImages.value.splice(index, 1)
}

const submitFeedback = async () => {
  if (submitting.value) return

  if (!feedbackContent.value.trim()) {
    toast.error('请输入反馈内容')
    return
  }
  if (uploading.value) {
    toast.error('图片上传中，请稍候')
    return
  }

  submitting.value = true
  try {
    const res = await feedbackService.submitFeedback({
      type: feedbackType.value,
      content: feedbackContent.value.trim(),
      images: uploadImages.value,
      contact: contact.value.trim()
    })

    if (res?.code === 200) {
      toast.success('感谢您的反馈，我们会尽快处理！')
      feedbackContent.value = ''
      contact.value = ''
      uploadImages.value = []
      await loadHistory()
    } else {
      toast.error(res?.message || '提交失败')
    }
  } catch (err) {
    toast.error(err.message || '提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.back-btn,
.placeholder {
  width: 40px;
  font-size: 20px;
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
  padding: 16px;
}

.type-card,
.form-card,
.history-card {
  background: white;
  border-radius: 0px;
  padding: 20px;
  margin: 12px 20px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 16px;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.type-item.active {
  border-color: var(--color-primary);
  background: rgba(102,126,234,0.05);
}

.type-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.type-text {
  font-size: 14px;
  color: #333;
}

.form-item {
  margin-bottom: 20px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.count {
  font-size: 13px;
  color: #999;
}

.form-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px 16px;
  font-size: 15px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.form-textarea:focus {
  border-color: var(--color-primary);
  outline: none;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.form-input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.upload-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.upload-item {
  position: relative;
  width: 80px;
  height: 80px;
}

.upload-img {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.upload-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  background: #333;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
}

.upload-btn {
  width: 80px;
  height: 80px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-btn:hover {
  border-color: var(--color-primary);
}

.upload-add {
  font-size: 28px;
  color: #999;
  line-height: 1;
}

.upload-hint {
  font-size: 12px;
  color: #999;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background: var(--gradient-primary);
  color: white;
  font-size: 16px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 16px;
}

.submit-btn:active {
  transform: scale(0.98);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-type {
  font-size: 13px;
  color: var(--color-primary);
  background: rgba(102,126,234,0.1);
  padding: 4px 10px;
  border-radius: 12px;
}

.history-status {
  font-size: 13px;
}

.history-status.done {
  color: #34c759;
}

.history-status.pending {
  color: #ff9500;
}

.history-content {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.history-time {
  font-size: 12px;
  color: #999;
}
</style>
