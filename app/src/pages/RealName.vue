<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">实名认证</text>
      <text class="placeholder"></text>
    </template>

    <view class="content" v-if="showForm">
      <view class="tips-card">
        <view class="tips-icon">ℹ️</view>
        <view class="tips-text">
          <view class="tips-title">为什么需要实名认证？</view>
          <view class="tips-desc">保障用户权益，确保服务安全</view>
        </view>
      </view>

      <view class="form-card">
        <view class="form-item">
          <view class="form-label">真实姓名</view>
          <input type="text" class="form-input" v-model="realName" placeholder="请输入真实姓名" />
        </view>

        <view class="form-item">
          <view class="form-label">身份证号</view>
          <input type="text" class="form-input" v-model="idCard" placeholder="请输入身份证号码" maxlength="18" />
        </view>

        <view class="form-item">
          <view class="form-label">身份证正面</view>
          <view class="upload-area" @click="uploadFront">
            <view class="upload-icon" v-if="!frontImg">📷</view>
            <image mode="aspectFill" class="upload-preview" v-else :src="frontImg" alt="" />
            <view class="upload-text" v-if="!frontImg">点击上传身份证正面</view>
          </view>
        </view>

        <view class="form-item">
          <view class="form-label">身份证反面</view>
          <view class="upload-area" @click="uploadBack">
            <view class="upload-icon" v-if="!backImg">📷</view>
            <image mode="aspectFill" class="upload-preview" v-else :src="backImg" alt="" />
            <view class="upload-text" v-if="!backImg">点击上传身份证反面</view>
          </view>
        </view>

        <view class="agreement">
          <input type="checkbox" id="agree" v-model="agreed" />
          <label for="agree">我已阅读并同意《用户认证协议》</label>
        </view>

        <button class="submit-btn" @click="submitForm">提交认证</button>
      </view>
    </view>

    <view class="content" v-else>
      <view class="success-card">
        <view class="success-icon">{{ statusMeta.icon }}</view>
        <view class="success-title">{{ statusMeta.title }}</view>
        <view class="success-desc">{{ statusMeta.desc }}</view>
      </view>

      <view class="info-card">
        <view class="info-item">
          <view class="info-label">真实姓名</view>
          <view class="info-value">{{ maskedName || '—' }}</view>
        </view>
        <view class="info-item">
          <view class="info-label">身份证号</view>
          <view class="info-value">{{ maskedIdCard || '—' }}</view>
        </view>
        <view class="info-item">
          <view class="info-label">提交时间</view>
          <view class="info-value">{{ verifyTime ? formatTime(verifyTime, 'YYYY-MM-DD') : '—' }}</view>
        </view>
      </view>

      <view class="status-badge" :class="{ pending: status === 1, rejected: status === 3 }">
        <text class="status-dot"></text>
        {{ statusMeta.badge }}
      </view>

      <button class="submit-btn resubmit-btn" v-if="status === 3" @click="status = 0">重新提交认证</button>
    </view>

    <input type="file" ref="fileInput" accept="image/*" style="display: none" @change="handleFileChange" />
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import authService from '../services/authService'
import { uploadFile } from '../services/uploadService'
import { chooseImages } from '../services/mediaPicker'
import { isApp } from '../common/platform'
import { toast } from '../composables/useToast'
import { formatTime } from '../common/common'

const router = useRouter()

// 后端 real_name_status：0-未认证 1-待审 2-已认证 3-驳回
const status = ref(0)
const maskedName = ref('')
const maskedIdCard = ref('')
const verifyTime = ref(0)

// 驳回态先展示结果卡（含原因），由「重新提交认证」回到表单，避免用户看不到审核结论
const showForm = computed(() => status.value === 0)

const STATUS_META = {
  1: { icon: '⏳', title: '认证审核中', desc: '认证信息已提交，将在 1-3 个工作日内完成审核', badge: '审核中' },
  2: { icon: '✅', title: '认证成功', desc: '您已完成实名认证', badge: '已认证' },
  3: { icon: '❌', title: '认证未通过', desc: '请核对姓名与身份证照片后重新提交', badge: '未通过' }
}

const statusMeta = computed(() => STATUS_META[status.value] || STATUS_META[2])
const realName = ref('')
const idCard = ref('')
const frontImg = ref('')
const backImg = ref('')
const agreed = ref(false)
const currentUpload = ref('')

const fileInput = ref(null)
// App 端选到的是 mediaPicker 的临时文件（只有 path），需在提交时交给 uploadFile 走 uni.uploadFile
const frontFile = ref(null)
const backFile = ref(null)

const goBack = () => {
  router.back()
}

const selectIdCard = async (side) => {
  currentUpload.value = side
  // App 端没有可点击的 <input type=file>，统一走 mediaPicker（相册/相机）
  if (!isApp) { fileInput.value?.click(); return }
  try {
    const { supported, files } = await chooseImages(1)
    if (supported && files.length) applyIdCardFile(files[0])
  } catch (err) {
    toast.error(err.message || '选择图片失败')
  }
}

const uploadFront = () => selectIdCard('front')

const uploadBack = () => selectIdCard('back')

// H5 与 App 共用：H5 仍用 FileReader 转 dataURL 预览（提交时再转 File），
// App 直接用临时路径预览并记录文件对象，提交时走 uni.uploadFile。
const applyIdCardFile = (file) => {
  if (!file) return
  const side = currentUpload.value
  const urlRef = side === 'back' ? backImg : frontImg
  const fileRef = side === 'back' ? backFile : frontFile
  if (isApp) {
    urlRef.value = file.path
    fileRef.value = file
    return
  }
  const reader = new FileReader()
  reader.onload = (event) => {
    urlRef.value = event.target?.result || ''
  }
  reader.readAsDataURL(file)
}

const handleFileChange = (e) => {
  const files = e.target.files
  const file = files && files[0]
  e.target.value = ''
  if (file) applyIdCardFile(file)
}

const dataUrlToFile = (dataUrl, name) => {
  const [meta, b64] = dataUrl.split(',')
  const mime = (meta.match(/:(.*?);/) || [])[1] || 'application/octet-stream'
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new File([arr], name, { type: mime })
}

const submitting = ref(false)

const submitForm = async () => {
  if (!realName.value.trim()) {
    toast.error('请输入真实姓名')
    return
  }
  if (!idCard.value || idCard.value.length < 15) {
    toast.error('请输入正确的身份证号码')
    return
  }
  if (!frontImg.value || !backImg.value) {
    toast.error('请上传身份证照片')
    return
  }
  if (!agreed.value) {
    toast.error('请先同意认证协议')
    return
  }
  if (submitting.value) return
  submitting.value = true

  try {
    // 正反面照片先直传 COS 换真实 URL，再提交认证：
    // App 上传 mediaPicker 选到的临时文件，H5 保持原有 dataURL → File 流程
    let frontUrl = frontImg.value
    let backUrl = backImg.value
    if (frontFile.value) {
      const r = await uploadFile(frontFile.value, 'image')
      frontUrl = r.data.url
      frontFile.value = null
    } else if (frontUrl.startsWith('data:')) {
      const r = await uploadFile(dataUrlToFile(frontUrl, `idcard_front_${Date.now()}.jpg`), 'image')
      frontUrl = r.data.url
    }
    if (backFile.value) {
      const r = await uploadFile(backFile.value, 'image')
      backUrl = r.data.url
      backFile.value = null
    } else if (backUrl.startsWith('data:')) {
      const r = await uploadFile(dataUrlToFile(backUrl, `idcard_back_${Date.now()}.jpg`), 'image')
      backUrl = r.data.url
    }

    await authService.submitRealName({
      realName: realName.value.trim(),
      idCard: idCard.value.trim(),
      front: frontUrl,
      back: backUrl
    })
    toast.success('认证信息已提交，将在1-3个工作日内审核')
    status.value = 1
    frontImg.value = frontUrl
    backImg.value = backUrl
  } catch (err) {
    toast.error(err.message || '提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const res = await authService.getRealNameStatus()
    const st = res?.data || {}
    status.value = Number(st.status) || 0
    maskedName.value = st.realName || ''
    maskedIdCard.value = st.idCard || ''
    verifyTime.value = Number(st.time) || 0
  } catch (e) { /* 未登录或接口异常时忽略 */ }
})
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
  padding: 20px;
}

.tips-card {
  background: white;
  border-radius: 0px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  border-radius: 0px;
  padding: 20px;
  margin: 12px 20px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  border-color: var(--color-primary);
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
  border-color: var(--color-primary);
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
  background: var(--gradient-primary);
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
  border-radius: 0px;
  margin: 12px 0 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  border-radius: 0px;
  padding: 20px;
  margin: 12px 0 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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

.status-badge.pending {
  background: rgba(255, 149, 0, 0.12);
  color: #ff9500;
}

.status-badge.pending .status-dot {
  background: #ff9500;
}

.status-badge.rejected {
  background: rgba(255, 59, 48, 0.12);
  color: #ff3b30;
}

.status-badge.rejected .status-dot {
  background: #ff3b30;
}

.resubmit-btn {
  display: block;
  width: fit-content;
  margin: 16px auto 0;
}
</style>
