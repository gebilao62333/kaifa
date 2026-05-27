<template>
  <div class="feedback-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">意见反馈</span>
      <span class="placeholder"></span>
    </div>

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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const feedbackType = ref('bug')
const feedbackContent = ref('')
const contact = ref('')
const uploadImages = ref([])
const fileInput = ref(null)

const typeList = [
  { label: '功能问题', value: 'bug', icon: '⚠️' },
  { label: '意见建议', value: 'suggest', icon: '💡' },
  { label: '内容举报', value: 'report', icon: '🚫' },
  { label: '其他问题', value: 'other', icon: '❓' },
]

const historyList = ref([
  { type: '功能问题', status: 'done', statusText: '已处理', content: '充值后金币未到账', time: '2024-05-15 10:30' },
  { type: '意见建议', status: 'pending', statusText: '处理中', content: '希望能增加更多游戏分类', time: '2024-05-18 15:20' },
])

const goBack = () => {
  router.back()
}

const uploadImage = () => {
  fileInput.value?.click()
}

const handleFileChange = (e) => {
  const files = e.target.files
  if (files) {
    Array.from(files).forEach(file => {
      if (uploadImages.value.length >= 6) return
      const reader = new FileReader()
      reader.onload = (event) => {
        uploadImages.value.push(event.target?.result || '')
      }
      reader.readAsDataURL(file)
    })
  }
}

const removeImage = (index) => {
  uploadImages.value.splice(index, 1)
}

const submitFeedback = () => {
  if (!feedbackContent.value.trim()) {
    alert('请输入反馈内容')
    return
  }
  
  historyList.value.unshift({
    type: typeList.find(t => t.value === feedbackType.value)?.label || '其他',
    status: 'pending',
    statusText: '处理中',
    content: feedbackContent.value,
    time: new Date().toLocaleString()
  })
  
  alert('感谢您的反馈，我们会尽快处理！')
  feedbackContent.value = ''
  contact.value = ''
  uploadImages.value = []
}
</script>

<style scoped>
.feedback-page {
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
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 650px;
  z-index: 100;
}

.back-btn,
.placeholder {
  width: 40px;
  font-size: 20px;
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
  padding-bottom: calc(16px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  max-width: 650px;
  margin: 0 auto;
}

.type-card,
.form-card,
.history-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
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
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  -webkit-transition: all 0.3s;
  -webkit-tap-highlight-color: transparent;
}

.type-item.active {
  border-color: #667eea;
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
  -webkit-transition: border-color 0.3s;
  -webkit-appearance: none;
  appearance: none;
}

.form-textarea:focus {
  border-color: #667eea;
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
  -webkit-transition: border-color 0.3s;
  -webkit-appearance: none;
  appearance: none;
}

.form-input:focus {
  border-color: #667eea;
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
  -webkit-user-select: none;
  user-select: none;
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
  -webkit-tap-highlight-color: transparent;
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
  -webkit-transition: all 0.3s;
  -webkit-tap-highlight-color: transparent;
}

.upload-btn:hover {
  border-color: #667eea;
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
  background: linear-gradient(135deg, #667eea, #764ba2);
  background: -webkit-linear-gradient(315deg, #667eea, #764ba2);
  color: white;
  font-size: 16px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
  -webkit-transition: all 0.3s;
  -webkit-tap-highlight-color: transparent;
  margin-bottom: 16px;
}

.submit-btn:active {
  transform: scale(0.98);
  -webkit-transform: scale(0.98);
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
  color: #667eea;
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
