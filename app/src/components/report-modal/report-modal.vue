<template>
  <view class="report-modal-overlay" v-if="visible" @click.self="close">
    <view class="report-modal">
      <view class="modal-header">
        <text class="modal-title">🚨 举报内容</text>
        <text class="modal-close" @click="close">✕</text>
      </view>

      <view class="modal-body">
        <view class="report-type-section">
          <view class="section-label">举报类型</view>
          <view class="type-grid">
            <text
              v-for="type in reportTypes"
              :key="type.id"
              :class="['type-item', { active: selectedType === type.id }]"
              @click="selectedType = type.id"
            >
              {{ type.name }}
            </text>
          </view>
        </view>

        <view class="report-reason-section">
          <view class="section-label">举报原因</view>
          <view class="reason-list">
            <view
              v-for="reason in reasons"
              :key="reason.id"
              :class="['reason-item', { active: selectedReason === reason.id }]"
              @click="selectedReason = reason.id"
            >
              <text class="reason-icon">{{ selectedReason === reason.id ? '✓' : '' }}</text>
              <text class="reason-text">{{ reason.name }}</text>
            </view>
          </view>
        </view>

        <view class="report-desc-section">
          <view class="section-label">补充说明（选填）</view>
          <textarea name="description"
            class="desc-input"
            v-model="description"
            placeholder="请详细描述举报原因，有助于我们更快处理..."
            rows="4"
          ></textarea>
          <view class="desc-length">{{ description.length }}/200</view>
        </view>

        <view class="upload-evidence">
          <view class="section-label">上传证据（选填）</view>
          <view class="evidence-grid">
            <view
              v-for="(img, index) in evidenceImages"
              :key="index"
              class="evidence-item"
            >
              <image mode="aspectFill" :src="img.url" class="evidence-img" />
              <text class="evidence-remove" @click="removeEvidence(index)">✕</text>
            </view>
            <view class="evidence-add" @click="triggerFileInput" v-if="evidenceImages.length < 3">
              <text class="add-icon">{{ uploading ? '…' : '+' }}</text>
              <text class="add-text">{{ uploading ? '上传中' : '添加图片' }}</text>
            </view>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="evidence-file-input"
              @change="handleFileChange"
            />
          </view>
        </view>
      </view>

      <view class="modal-footer">
        <button class="cancel-btn" @click="close">取消</button>
        <button class="submit-btn" @click="submitReport" :disabled="!canSubmit">
          提交举报
        </button>
      </view>

      <view class="success-modal" v-if="showSuccess">
        <view class="success-content">
          <text class="success-icon">✅</text>
          <text class="success-text">举报成功</text>
          <text class="success-desc">感谢您的反馈，我们会尽快处理</text>
          <button class="success-btn" @click="confirmSuccess">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import reportService from '../../services/reportService'
import { uploadImage } from '../../services/uploadService'
import { chooseImages } from '../../services/mediaPicker'
import { isApp } from '../../common/platform'
import { toast } from '../../composables/useToast'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  // 与后端 xn_report.target_type 一致：1=用户 2=动态 3=评论
  targetType: {
    type: Number,
    required: true
  },
  targetId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['close', 'submitted'])

const fileInputRef = ref(null)
const selectedType = ref('')
const selectedReason = ref('')
const description = ref('')
const evidenceImages = ref([])
const showSuccess = ref(false)
const submitting = ref(false)
const uploading = ref(false)
// 举报凭证最多 3 张（与模板里的 evidenceImages.length < 3 保持一致）
const MAX_EVIDENCE = 3

const reportTypes = [
  { id: 'spam', name: '垃圾广告' },
  { id: 'porn', name: '色情内容' },
  { id: 'violence', name: '暴力内容' },
  { id: 'fraud', name: '欺诈行为' },
  { id: 'harassment', name: '骚扰他人' },
  { id: 'fake', name: '虚假信息' },
  { id: 'copyright', name: '侵权投诉' },
  { id: 'other', name: '其他问题' }
]

const reasons = [
  { id: 'violation', name: '违反社区规定' },
  { id: 'improper', name: '内容不当' },
  { id: 'fake', name: '虚假信息' },
  { id: 'harassment', name: '恶意骚扰' },
  { id: 'fraud', name: '涉嫌诈骗' },
  { id: 'other', name: '其他原因' }
]

const canSubmit = computed(() => {
  return !!selectedType.value && !!selectedReason.value && !!props.targetId && !submitting.value
})

watch(() => props.visible, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})

const resetForm = () => {
  selectedType.value = ''
  selectedReason.value = ''
  description.value = ''
  evidenceImages.value = []
  showSuccess.value = false
  submitting.value = false
}

const close = () => {
  emit('close')
}

// App 端没有可点击的 <input type=file>，统一走 mediaPicker（相册/相机）
const triggerFileInput = async () => {
  if (!isApp) { fileInputRef.value?.click(); return }
  if (uploading.value) return
  const remaining = MAX_EVIDENCE - evidenceImages.value.length
  if (remaining <= 0) return
  try {
    const { supported, files } = await chooseImages(remaining)
    if (supported && files.length) await applyEvidenceFiles(files)
  } catch (err) {
    toast.error(err.message || '选择图片失败')
  }
}

// H5 与 App 共用：H5 传 File，App 传 mediaPicker 的 { path, name, type, size }
const applyEvidenceFiles = async (files) => {
  if (!files.length || uploading.value) return

  uploading.value = true
  try {
    for (const file of files) {
      if (evidenceImages.value.length >= MAX_EVIDENCE) break
      const res = await uploadImage(file)
      const url = res?.data?.url
      if (url) evidenceImages.value.push({ url })
    }
  } catch (err) {
    toast.error(err.message || '图片上传失败')
  } finally {
    uploading.value = false
  }
}

const handleFileChange = async (event) => {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  await applyEvidenceFiles(files)
}

const removeEvidence = (index) => {
  evidenceImages.value.splice(index, 1)
}

// 后端 xn_report 仅有 reason 字段（255 字符），将类型/原因/补充说明合并写入
const buildReason = () => {
  const typeName = reportTypes.find(t => t.id === selectedType.value)?.name || ''
  const reasonName = reasons.find(r => r.id === selectedReason.value)?.name || ''
  let reason = `${typeName}：${reasonName}`
  if (description.value.trim()) {
    reason += `（${description.value.trim()}）`
  }
  return reason.slice(0, 255)
}

const submitReport = async () => {
  if (!canSubmit.value) return

  submitting.value = true
  try {
    await reportService.submitReport({
      targetType: props.targetType,
      targetId: Number(props.targetId),
      reason: buildReason(),
      images: evidenceImages.value.map(img => img.url)
    })
    showSuccess.value = true
    emit('submitted')
  } catch (err) {
    toast.error(err.message || '举报提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const confirmSuccess = () => {
  showSuccess.value = false
  close()
}
</script>

<style scoped>
.report-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.report-modal {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #f5f5f5;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 20px;
  color: #999;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.section-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  font-weight: 500;
}

.report-type-section {
  margin-bottom: 20px;
}

.type-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.type-item {
  padding: 8px 16px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.type-item.active {
  background: rgba(102, 126, 234, 0.1);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.report-reason-section {
  margin-bottom: 20px;
}

.reason-list {
  background: #f9f9f9;
  border-radius: 12px;
  overflow: hidden;
}

.reason-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.reason-item:last-child {
  border-bottom: none;
}

.reason-item:hover {
  background: #f0f0f0;
}

.reason-item.active {
  background: rgba(102, 126, 234, 0.05);
}

.reason-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #ddd;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
  background: transparent;
}

.reason-item.active .reason-icon {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.reason-text {
  font-size: 14px;
  color: #333;
}

.report-desc-section {
  margin-bottom: 20px;
}

.desc-input {
  width: 100%;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  resize: none;
  outline: none;
  font-family: inherit;
}

.desc-input:focus {
  border-color: var(--color-primary);
}

.desc-length {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.upload-evidence {
  margin-bottom: 10px;
}

.evidence-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.evidence-item {
  position: relative;
  width: 80px;
  height: 80px;
}

.evidence-img {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.evidence-remove {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
}

.evidence-add {
  width: 80px;
  height: 80px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.evidence-add:hover {
  border-color: var(--color-primary);
}

.evidence-file-input {
  display: none;
}

.add-icon {
  font-size: 24px;
  color: #999;
}

.add-text {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  padding: 16px 20px;
  gap: 12px;
  border-top: 1px solid #f5f5f5;
}

.cancel-btn {
  flex: 1;
  padding: 14px;
  border: 1px solid #ddd;
  border-radius: 24px;
  background: white;
  font-size: 15px;
  color: #666;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #f5f5f5;
}

.submit-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 24px;
  background: var(--gradient-primary);
  font-size: 15px;
  color: white;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn:not(:disabled):hover {
  transform: scale(1.02);
}

.success-modal {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.success-content {
  text-align: center;
  padding: 40px;
}

.success-icon {
  font-size: 60px;
  display: block;
  margin-bottom: 16px;
}

.success-text {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.success-desc {
  font-size: 14px;
  color: #666;
  display: block;
  margin-bottom: 24px;
}

.success-btn {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 12px 40px;
  border-radius: 24px;
  font-size: 15px;
  cursor: pointer;
}
</style>
