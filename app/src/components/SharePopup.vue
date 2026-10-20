<template>
  <teleport to="body">
    <view class="share-overlay" v-if="visible" @click.self="close">
      <view class="share-panel">
        <view class="share-title">分享到</view>
        <view class="share-options">
          <view class="share-option" @click="shareExternal">
            <text class="share-icon">📤</text>
            <text class="share-label">分享给好友</text>
            <text class="share-desc">微信 / QQ / 复制链接</text>
          </view>
          <view class="share-option" @click="startRepost">
            <text class="share-icon">🔄</text>
            <text class="share-label">转发到动态</text>
            <text class="share-desc">附上想法，转发到自己的主页</text>
          </view>
        </view>

        <!-- 转发输入区 -->
        <view class="repost-input" v-if="showRepostInput">
          <textarea
            v-model="repostComment"
            placeholder="说点什么吧..."
            maxlength="200"
            rows="3"
            ref="repostTextarea"
          ></textarea>
          <view class="repost-actions">
            <button class="btn-cancel" @click="cancelRepost">取消</button>
            <button class="btn-confirm" @click="confirmRepost" :disabled="submitting">
              {{ submitting ? '转发中...' : '转发' }}
            </button>
          </view>
        </view>

        <button class="btn-close" @click="close">取消</button>
      </view>
    </view>
  </teleport>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import circleService from '../services/circleService'
import { isApp } from '../common/platform'

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

// App 端没有 navigator.clipboard（部分非安全上下文也没有），复制链接交给 uni.setClipboardData
const copyText = async (text) => {
  if (!text) throw new Error('没有可复制的分享链接')
  if (!isApp && typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    await navigator.clipboard.writeText(text)
    return
  }
  if (typeof uni !== 'undefined' && typeof uni.setClipboardData === 'function') {
    await new Promise((resolve, reject) => {
      uni.setClipboardData({
        data: text,
        showToast: false,
        success: () => resolve(),
        fail: (err) => reject(new Error((err && err.errMsg) || '复制链接失败'))
      })
    })
    return
  }
  throw new Error('当前环境不支持复制链接')
}

const showShareFail = (message) => {
  if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
    uni.showToast({ title: message, icon: 'none' })
    return
  }
  try { window.alert(message) } catch (e) { /* 提示失败不影响业务 */ }
}

const close = () => {
  showRepostInput.value = false
  repostComment.value = ''
  emit('close')
}

const shareExternal = async () => {
  const shareData = {
    title: props.postNickname ? `${props.postNickname} 的动态` : 'eu搭子动态',
    text: props.postContent ? props.postContent.substring(0, 100) : '快来看看这篇精彩动态！',
    // App 端没有 window.location：分享链接由页面通过 postShareUrl 传入
    url: props.postShareUrl || (typeof window !== 'undefined' && window.location ? window.location.href : '')
  }

  // 先记后端分享次数；记录失败不阻断客户端分享（原逻辑同样忽略该失败）
  try {
    await circleService.sharePost(props.postId)
  } catch (e) {
    console.error('记录分享失败:', e)
  }

  try {
    if (isApp) {
      // App 无 navigator.share/clipboard：复制链接，由用户粘贴到微信/QQ
      await copyText(shareData.url)
    } else if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData)
      } catch (e) {
        if (e && e.name === 'AbortError') return
        // 系统分享不可用（非安全上下文/未授予）时回落到复制链接
        await copyText(shareData.url)
      }
    } else {
      await copyText(shareData.url)
    }
    emit('shared', 'external')
    close()
  } catch (e) {
    // P2-11：复制/分享都失败时不能再当成功关闭弹窗，避免传播数据虚高
    console.error('分享失败:', e)
    showShareFail((e && e.message) || '分享失败，请稍后重试')
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
