<template>
  <div class="realname-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">实名认证</span>
      <span class="placeholder"></span>
    </div>

    <div class="content" v-if="!isVerified">
      <div class="tips-card">
        <div class="tips-icon">ℹ️</div>
        <div class="tips-text">
          <div class="tips-title">为什么需要实名认证？</div>
          <div class="tips-desc">保障用户权益，确保服务安全</div>
        </div>
      </div>

      <div class="form-card">
        <div class="form-item">
          <div class="form-label">真实姓名</div>
          <input type="text" class="form-input" v-model="realName" placeholder="请输入真实姓名" />
        </div>

        <div class="form-item">
          <div class="form-label">身份证号</div>
          <input type="text" class="form-input" v-model="idCard" placeholder="请输入身份证号码" maxlength="18" />
        </div>

        <div class="form-item">
          <div class="form-label">身份证正面</div>
          <div class="upload-area" @click="uploadFront">
            <div class="upload-icon" v-if="!frontImg">📷</div>
            <img class="upload-preview" v-else :src="frontImg" alt="" />
            <div class="upload-text" v-if="!frontImg">点击上传身份证正面</div>
          </div>
        </div>

        <div class="form-item">
          <div class="form-label">身份证反面</div>
          <div class="upload-area" @click="uploadBack">
            <div class="upload-icon" v-if="!backImg">📷</div>
            <img class="upload-preview" v-else :src="backImg" alt="" />
            <div class="upload-text" v-if="!backImg">点击上传身份证反面</div>
          </div>
        </div>

        <div class="agreement">
          <input type="checkbox" id="agree" v-model="agreed" />
          <label for="agree">我已阅读并同意《用户认证协议》</label>
        </div>

        <button class="submit-btn" @click="submitForm">提交认证</button>
      </div>
    </div>

    <div class="content" v-else>
      <div class="success-card">
        <div class="success-icon">✅</div>
        <div class="success-title">认证成功</div>
        <div class="success-desc">您已完成实名认证</div>
      </div>

      <div class="info-card">
        <div class="info-item">
          <div class="info-label">真实姓名</div>
          <div class="info-value">张**</div>
        </div>
        <div class="info-item">
          <div class="info-label">身份证号</div>
          <div class="info-value">110***********1234</div>
        </div>
        <div class="info-item">
          <div class="info-label">认证时间</div>
          <div class="info-value">2024-05-20</div>
        </div>
      </div>

      <div class="status-badge">
        <span class="status-dot"></span>
        已认证
      </div>
    </div>

    <input type="file" ref="fileInput" accept="image/*" style="display: none" @change="handleFileChange" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginManager } from '../composables/useLoginManager'

const router = useRouter()
const { requireLogin } = useLoginManager()

const isVerified = ref(false)
const realName = ref('')
const idCard = ref('')
const frontImg = ref('')
const backImg = ref('')
const agreed = ref(false)
const currentUpload = ref('')

const fileInput = ref(null)

const goBack = () => {
  router.back()
}

const uploadFront = () => {
  currentUpload.value = 'front'
  fileInput.value?.click()
}

const uploadBack = () => {
  currentUpload.value = 'back'
  fileInput.value?.click()
}

const handleFileChange = (e) => {
  const files = e.target.files
  if (files && files.length > 0) {
    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target?.result || ''
      if (currentUpload.value === 'front') {
        frontImg.value = url
      } else if (currentUpload.value === 'back') {
        backImg.value = url
      }
    }
    reader.readAsDataURL(files[0])
  }
}

const submitForm = async () => {
  const loginResult = await requireLogin()
  if (!loginResult.loggedIn) {
    return
  }

  if (!realName.value.trim()) {
    alert('请输入真实姓名')
    return
  }
  if (!idCard.value || idCard.value.length < 15) {
    alert('请输入正确的身份证号码')
    return
  }
  if (!frontImg.value || !backImg.value) {
    alert('请上传身份证照片')
    return
  }
  if (!agreed.value) {
    alert('请先同意认证协议')
    return
  }
  
  alert('认证信息已提交，将在1-3个工作日内审核')
  isVerified.value = true
}
</script>

<style scoped>
.realname-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.back-btn,
.placeholder {
  width: 40px;
  font-size: 20px;
  color: white;
  cursor: pointer;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.content {
  padding: 20px;
}

.tips-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.tips-icon {
  font-size: 32px;
}

.tips-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.tips-desc {
  font-size: 13px;
  color: #999;
}

.form-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
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
  border-color: #667eea;
  outline: none;
}

.upload-area {
  width: 100%;
  aspect-ratio: 16 / 10;
  border: 2px dashed #ddd;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
  position: relative;
}

.upload-area:hover {
  border-color: #667eea;
  background: rgba(102,126,234,0.05);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.upload-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}

.upload-text {
  font-size: 14px;
  color: #999;
}

.agreement {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  cursor: pointer;
}

.agreement input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.agreement label {
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 16px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-btn:active {
  transform: scale(0.98);
}

.success-card {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 12px;
  margin-bottom: 20px;
}

.success-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.success-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.success-desc {
  font-size: 14px;
  color: #999;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: rgba(52,199,89,0.1);
  color: #34c759;
  font-size: 14px;
  border-radius: 20px;
  margin: 0 auto;
  display: flex;
  width: fit-content;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #34c759;
  border-radius: 50%;
}
</style>
