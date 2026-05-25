<template>
  <div class="report-modal-overlay" v-if="visible" @click.self="close">
    <div class="report-modal">
      <div class="modal-header">
        <span class="modal-title">🚨 举报内容</span>
        <span class="modal-close" @click="close">✕</span>
      </div>

      <div class="modal-body">
        <div class="report-type-section">
          <div class="section-label">举报类型</div>
          <div class="type-grid">
            <span
              v-for="type in reportTypes"
              :key="type.id"
              :class="['type-item', { active: selectedType === type.id }]"
              @click="selectedType = type.id"
            >
              {{ type.name }}
            </span>
          </div>
        </div>

        <div class="report-reason-section">
          <div class="section-label">举报原因</div>
          <div class="reason-list">
            <div
              v-for="reason in reasons"
              :key="reason.id"
              :class="['reason-item', { active: selectedReason === reason.id }]"
              @click="selectedReason = reason.id"
            >
              <span class="reason-icon">{{ selectedReason === reason.id ? '✓' : '' }}</span>
              <span class="reason-text">{{ reason.name }}</span>
            </div>
          </div>
        </div>

        <div class="report-desc-section">
          <div class="section-label">补充说明（选填）</div>
          <textarea
            class="desc-input"
            v-model="description"
            placeholder="请详细描述举报原因，有助于我们更快处理..."
            rows="4"
          ></textarea>
          <div class="desc-length">{{ description.length }}/200</div>
        </div>

        <div class="upload-evidence">
          <div class="section-label">上传证据（选填）</div>
          <div class="evidence-grid">
            <div
              v-for="(img, index) in evidenceImages"
              :key="index"
              class="evidence-item"
            >
              <img :src="img" class="evidence-img" />
              <span class="evidence-remove" @click="removeEvidence(index)">✕</span>
            </div>
            <div class="evidence-add" @click="addEvidence" v-if="evidenceImages.length < 3">
              <span class="add-icon">+</span>
              <span class="add-text">添加图片</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" @click="close">取消</button>
        <button class="submit-btn" @click="submitReport" :disabled="!canSubmit">
          提交举报
        </button>
      </div>

      <div class="success-modal" v-if="showSuccess">
        <div class="success-content">
          <span class="success-icon">✅</span>
          <span class="success-text">举报成功</span>
          <span class="success-desc">感谢您的反馈，我们会尽快处理</span>
          <button class="success-btn" @click="confirmSuccess">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  reportTarget: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'submit'])

const selectedType = ref('')
const selectedReason = ref('')
const description = ref('')
const evidenceImages = ref([])
const showSuccess = ref(false)

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
  return selectedType.value && selectedReason.value
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
}

const close = () => {
  emit('close')
}

const addEvidence = () => {
  if (evidenceImages.value.length >= 3) return
  const mockImages = [
    'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
  ]
  const randomImg = mockImages[Math.floor(Math.random() * mockImages.length)]
  evidenceImages.value.push(randomImg)
}

const removeEvidence = (index) => {
  evidenceImages.value.splice(index, 1)
}

const submitReport = () => {
  if (!canSubmit.value) return

  const reportData = {
    type: selectedType.value,
    reason: selectedReason.value,
    description: description.value,
    evidence: evidenceImages.value,
    target: props.reportTarget,
    timestamp: new Date().toISOString()
  }

  console.log('提交举报:', reportData)
  emit('submit', reportData)

  showSuccess.value = true
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
  border-color: #667eea;
  color: #667eea;
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
  background: #667eea;
  border-color: #667eea;
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
  border-color: #667eea;
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
  border-color: #667eea;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 40px;
  border-radius: 24px;
  font-size: 15px;
  cursor: pointer;
}
</style>
