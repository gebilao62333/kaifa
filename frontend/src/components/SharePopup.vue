<template>
  <teleport to="body">
    <div class="share-overlay" v-if="visible" @click.self="close">
      <div class="share-panel">
        <div class="share-title">分享到</div>
        <div class="share-options">
          <div class="share-option" @click="shareExternal">
            <span class="share-icon">📤</span>
            <span class="share-label">分享给好友</span>
            <span class="share-desc">微信 / QQ / 复制链接</span>
          </div>
          <div class="share-option" @click="startRepost">
            <span class="share-icon">🔄</span>
            <span class="share-label">转发到动态</span>
            <span class="share-desc">附上想法，转发到自己的主页</span>
          </div>
        </div>

        <!-- 转发输入区 -->
        <div class="repost-input" v-if="showRepostInput">
          <textarea
            v-model="repostComment"
            placeholder="说点什么吧..."
            maxlength="200"
            rows="3"
            ref="repostTextarea"
          ></textarea>
          <div class="repost-actions">
            <button class="btn-cancel" @click="cancelRepost">取消</button>
            <button class="btn-confirm" @click="confirmRepost" :disabled="submitting">
              {{ submitting ? '转发中...' : '转发' }}
            </button>
          </div>
        </div>

        <button class="btn-close" @click="close">取消</button>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import circleService from '../services/circleService'

const props = defineProps({
  visible: Boolean,
  postId: [Number, String],
  postNickname: { type: String, default: '' },
  postContent: { type: String, default: '' },
  postShareUrl: { type: String, default: '' }
})

const emit = defineEmits(['close', 'shared', 'reposted'])

const showRepostInput = ref(false)
const repostComment = ref('')
const repostTextarea = ref(null)
const submitting = ref(false)

const close = () => {
  showRepostInput.value = false
  repostComment.value = ''
  emit('close')
}

const shareExternal = async () => {
  try {
    // 调用后端记录分享
    await circleService.sharePost(props.postId)

    const shareData = {
      title: props.postNickname ? `${props.postNickname} 的动态` : 'eu搭子动态',
      text: props.postContent ? props.postContent.substring(0, 100) : '快来看看这篇精彩动态！',
      url: props.postShareUrl || window.location.href
    }

    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(shareData.url)
    }
    emit('shared', 'external')
    close()
  } catch (e) {
    if (e.name === 'AbortError') return
    console.error('分享失败:', e)
    emit('shared', 'external') // 后端已记录，关闭弹窗
    close()
  }
}

const startRepost = () => {
  showRepostInput.value = true
  nextTick(() => {
    repostTextarea.value?.focus()
  })
}

const cancelRepost = () => {
  showRepostInput.value = false
  repostComment.value = ''
}

const confirmRepost = async () => {
  if (submitting.value) return
  submitting.value = true
  try {
    await circleService.repostPost(props.postId, repostComment.value.trim())
    emit('reposted')
    close()
  } catch (e) {
    console.error('转发失败:', e)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.share-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s;
}

.share-panel {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 20px 20px 32px;
  animation: slideUp 0.25s ease;
}

.share-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 16px;
}

.share-options {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.share-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.share-option:active {
  background: #e9ecef;
}

.share-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.share-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.share-desc {
  font-size: 11px;
  color: #999;
  text-align: center;
}

.repost-input {
  margin-bottom: 12px;
}

.repost-input textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
}

.repost-input textarea:focus {
  border-color: var(--color-primary, #667eea);
}

.repost-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.btn-cancel {
  padding: 8px 20px;
  background: #f0f0f0;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.btn-confirm {
  padding: 8px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 20px;
  font-size: 14px;
  color: #fff;
  cursor: pointer;
}

.btn-confirm:disabled {
  opacity: 0.6;
}

.btn-close {
  width: 100%;
  padding: 14px;
  background: #f0f0f0;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  color: #666;
  cursor: pointer;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
