<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div class="incoming-call-overlay" v-if="visible">
        <div class="incoming-call-card">
          <div class="caller-avatar">
            {{ callerInfo.nickname?.charAt(0) || '?' }}
          </div>
          <div class="caller-name">{{ callerInfo.nickname || '未知用户' }}</div>
          <div class="call-type">
            {{ callerInfo.callType === 2 ? '📹 视频通话' : '📞 语音通话' }}
          </div>
          <div class="call-tip">邀请你进行{{ callerInfo.callType === 2 ? '视频' : '语音' }}通话</div>

          <div class="action-buttons">
            <div class="action-btn reject-btn" @click="handleReject">
              <span class="btn-icon">📵</span>
              <span class="btn-text">拒绝</span>
            </div>
            <div class="action-btn accept-btn" @click="handleAccept">
              <span class="btn-icon">📞</span>
              <span class="btn-text">接听</span>
            </div>
          </div>

          <div class="call-timer" v-if="ringing">
            响铃中 {{ ringDuration }}s
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { trtcService } from '../services/trtcService'
import { socketService } from '../services/socketService'

const router = useRouter()
const visible = ref(false)
const ringing = ref(false)
const ringDuration = ref(0)
const callerInfo = ref({
  callerId: null,
  nickname: '',
  avatar: '',
  callType: 1,
  callId: null
})

let ringTimer = null
let rejectCallback = null
let acceptCallback = null

const showIncomingCall = (info) => {
  callerInfo.value = {
    callerId: info.fromId,
    nickname: info.fromName || `用户${info.fromId}`,
    avatar: info.fromAvatar || '',
    callType: info.callType || 1,
    callId: info.callId
  }
  visible.value = true
  ringing.value = true
  ringDuration.value = 0

  ringTimer = setInterval(() => {
    ringDuration.value++
    if (ringDuration.value >= 60) {
      handleReject()
    }
  }, 1000)

  socketService.on('call_cancel', handleCallCancelled)
  socketService.on('call_reject', handleCallCancelled)
}

const hideIncomingCall = () => {
  visible.value = false
  ringing.value = false
  if (ringTimer) {
    clearInterval(ringTimer)
    ringTimer = null
  }
  socketService.off('call:cancelled', handleCallCancelled)
}

const handleCallCancelled = () => {
  hideIncomingCall()
}

const handleAccept = async () => {
  if (!callerInfo.value.callId) {
    console.error('缺少callId')
    return
  }

  try {
    await trtcService.acceptCall(callerInfo.value.callId)
    hideIncomingCall()

    if (callerInfo.value.callType === 2) {
      router.push(`/call/${callerInfo.value.callerId}/video`)
    } else {
      router.push(`/call/${callerInfo.value.callerId}/audio`)
    }
  } catch (error) {
    console.error('接听失败:', error)
    hideIncomingCall()
  }
}

const handleReject = async () => {
  if (callerInfo.value.callId) {
    try {
      await trtcService.rejectCall(callerInfo.value.callId)
    } catch (error) {
      console.error('拒绝失败:', error)
    }
  }
  hideIncomingCall()
}

watch(visible, (val) => {
  if (!val && ringTimer) {
    clearInterval(ringTimer)
    ringTimer = null
  }
})

onUnmounted(() => {
  if (ringTimer) {
    clearInterval(ringTimer)
  }
  socketService.off('call_cancel', handleCallCancelled)
  socketService.off('call_reject', handleCallCancelled)
})

defineExpose({
  showIncomingCall,
  hideIncomingCall
})
</script>

<style scoped>
.incoming-call-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.incoming-call-card {
  background: linear-gradient(145deg, #2a2a3e 0%, #1a1a2e 100%);
  border-radius: 24px;
  padding: 40px 30px 30px;
  text-align: center;
  width: 85%;
  max-width: 320px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.caller-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: white;
  margin: 0 auto 20px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.caller-name {
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.call-type {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.call-tip {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 30px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 20px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.btn-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 8px;
  transition: transform 0.2s;
}

.reject-btn .btn-icon {
  background: #ff5252;
}

.accept-btn .btn-icon {
  background: #4caf50;
}

.action-btn:active .btn-icon {
  transform: scale(0.95);
}

.btn-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.call-timer {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>