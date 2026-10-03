<template>
  <div class="call-page">
    <div class="call-header">
      <span class="caller-info">{{ callerName }}</span>
      <span class="call-status">{{ callStatus }}</span>
      <span class="call-mode" v-if="callMode">{{ callMode === 'webrtc' ? 'WebRTC' : 'TRTC' }}</span>
      <div class="call-rate-info" v-if="videoPrice > 0">
        <span class="rate-badge">{{ videoPrice }} 金币/分钟</span>
      </div>
    </div>
    
    <div class="video-container">
      <div class="remote-video">
        <video ref="remoteVideoRef" autoplay playsinline></video>
        <div class="video-placeholder" v-if="!remoteStream && !trtcActive">
          <div class="avatar-circle">
            {{ callerName.charAt(0) }}
          </div>
          <span class="placeholder-text">{{ callerName }}</span>
        </div>
      </div>
      
      <div class="local-video" v-if="localStream">
        <video ref="localVideoRef" autoplay playsinline muted></video>
        <span class="local-label">我</span>
      </div>
      
      <div class="call-overlay" v-if="isConnected">
        <span class="overlay-timer">{{ formattedDuration }}</span>
        <span class="overlay-cost" v-if="videoPrice > 0">{{ totalCost }} 金币</span>
      </div>
    </div>
    
    <div class="call-actions">
      <button class="action-btn audio-btn" :class="{ active: audioEnabled }" @click="toggleAudio">
        <span>{{ audioEnabled ? '🔊' : '🔇' }}</span>
      </button>
      <button class="action-btn video-btn" :class="{ active: videoEnabled }" @click="toggleVideo">
        <span>{{ videoEnabled ? '📹' : '🚫' }}</span>
      </button>
      <button class="action-btn hangup-btn" @click="hangup">
        <span>📞</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { callService } from '../services/callService';
import { webrtcCallService } from '../services/webrtcCallService';
import { socketService } from '../services/socketService';
import { trtcRoomService } from '../services/trtcRoomService';

const route = useRoute();
const router = useRouter();

// 安全返回：直接进入 / 刷新 / 从分享链接打开时没有站内历史，
// router.back() 会退到 about:blank（空白页），因此先判断站内历史再决定回退还是回首页。
const safeBack = () => {
  try {
    const state = router.options && router.options.history ? router.options.history.state : null;
    if (state && state.back) router.back();
    else router.replace('/home');
  } catch (e) {
    router.replace('/home');
  }
};

const callerId = ref('');
const callerName = ref('对方');
const callStatus = ref('正在连接...');
const callMode = ref(null); // 'trtc' | 'webrtc'
const isConnected = ref(false);
const callId = ref(null);
const isConnecting = ref(true);
const connectionError = ref('');

const localStream = ref(null);
const remoteStream = ref(null);
const localVideoRef = ref(null);
const remoteVideoRef = ref(null);
const audioEnabled = ref(true);
const videoEnabled = ref(true);
const videoPrice = ref(0);
const callDuration = ref(0);
const formattedDuration = ref('00:00');
const totalCost = ref(0);
let durationTimer = null;

const isIncoming = ref(false);
// TRTC 模式下远端画面由官方 SDK 直接渲染进 <video>，此时不要显示占位层
const trtcActive = ref(false);

// flush: 'post' —— <video> 由 v-if="localStream" 控制，默认 pre 时机触发时 ref 仍为 null，
// 会导致本地自画面永远绑不上 srcObject（远端画面不受影响）
watch(localStream, (stream) => {
  if (stream && localVideoRef.value) {
    localVideoRef.value.srcObject = stream;
  }
}, { flush: 'post' });

const initCall = async () => {
  callerId.value = route.params.id;
  callerName.value = localStorage.getItem('callTargetName') || `用户${callerId.value}`;

  const saved = localStorage.getItem('callSettings');
  if (saved) {
    const settings = JSON.parse(saved);
    videoPrice.value = settings.videoPrice || 0;
  }

  isIncoming.value = route.query.incoming === '1';

  // 设置 WebRTC 回调
  webrtcCallService.setCallbacks({
    onRemoteStream: (stream) => {
      remoteStream.value = stream;
      if (remoteVideoRef.value) {
        remoteVideoRef.value.srcObject = stream;
      }
    },
    onLocalStream: (stream) => {
      localStream.value = stream;
    },
    onCallStateChange: (state) => {
      if (state === 'connected') {
        isConnected.value = true;
        isConnecting.value = false;
        callStatus.value = '已连接';
        startDurationTimer();
      } else if (state === 'disconnected' || state === 'failed') {
        callStatus.value = state === 'failed' ? '连接失败' : '对方已挂断';
        setTimeout(() => hangup(), 1500);
      }
    }
  });

  // 设置 callService 回调
  callService.setCallbacks({
    onDurationTick: (duration) => {
      callDuration.value = duration;
      const m = Math.floor(duration / 60).toString().padStart(2, '0');
      const s = (duration % 60).toString().padStart(2, '0');
      formattedDuration.value = `${m}:${s}`;
      totalCost.value = Math.ceil(duration / 60) * videoPrice.value;
    },
    onCallEnd: (duration) => {
      if (durationTimer) {
        clearInterval(durationTimer);
        durationTimer = null;
      }
    }
  });

  try {
    if (isIncoming.value) {
      // 被叫方：WebRTC 的 PeerConnection 与本地流已在 acceptCall 时建好
      const modeFromQuery = route.query.mode;
      const useWebRTC = modeFromQuery
        ? modeFromQuery === 'webrtc'
        : (callService.currentMode === 'webrtc' || localStorage.getItem('_pendingCallMode') === 'webrtc');
      callMode.value = useWebRTC ? 'webrtc' : 'trtc';

      if (useWebRTC) {
        localStream.value = webrtcCallService.localStream;
      } else {
        // TRTC 通道：房间号由来电方通过 ?room= 带入
        await trtcRoomService.join({ callType: 2, roomId: route.query.room });
        trtcRoomService.setRemoteView(remoteVideoRef.value);
        trtcActive.value = true;
      }

      // 被叫是「先接通、后挂载页面」，回调回灌可能已置为已连接，不能覆盖回去
      if (!isConnected.value) {
        callStatus.value = '正在连接...';
        isConnecting.value = true;
      }

    } else {
      const result = await callService.startCall(callerId.value, 2);
      callMode.value = result.mode;
      callId.value = result.callId;

      if (result.mode === 'webrtc') {
        localStream.value = webrtcCallService.localStream;
      } else {
        await trtcRoomService.join({ callType: 2, roomId: result.trtcRoomId });
        trtcRoomService.setRemoteView(remoteVideoRef.value);
        trtcActive.value = true;
      }

      callStatus.value = '等待对方接听...';
      isConnecting.value = true;
    }

    // 信令已下沉到 webrtcCallService，这里只保留挂断提示
    socketService.on('call_end', () => {
      callStatus.value = '对方已挂断';
      setTimeout(() => hangup(), 1500);
    });
  } catch (error) {
    console.error('初始化通话失败:', error);
    connectionError.value = error.message || '无法建立通话连接';
    callStatus.value = '连接失败';
    setTimeout(() => {
      safeBack();
    }, 2000);
  }
};

const startDurationTimer = () => {
  callService.startDurationTimer();
};

const toggleAudio = () => {
  audioEnabled.value = !audioEnabled.value;
  callService.toggleAudio(audioEnabled.value);
  if (!callMode.value || callMode.value === 'trtc') {
    if (localStream.value) {
      localStream.value.getAudioTracks().forEach(track => {
        track.enabled = audioEnabled.value;
      });
    }
  }
};

const toggleVideo = () => {
  videoEnabled.value = !videoEnabled.value;
  callService.toggleVideo(videoEnabled.value);
  if (!callMode.value || callMode.value === 'trtc') {
    if (localStream.value) {
      localStream.value.getVideoTracks().forEach(track => {
        track.enabled = videoEnabled.value;
      });
    }
  }
};

const hangup = async () => {
  if (durationTimer) {
    clearInterval(durationTimer);
    durationTimer = null;
  }

  await callService.endCall(callDuration.value);

  if (localStream.value && callMode.value !== 'webrtc') {
    localStream.value.getTracks().forEach(track => track.stop());
    localStream.value = null;
  }

  remoteStream.value = null;

  // 只清理本页注册的挂断提示；WebRTC 信令监听由 webrtcCallService 全局持有，不能在此注销
  socketService.off('call_end');

  safeBack();
};

onMounted(() => {
  initCall();
});

onUnmounted(() => {
  if (durationTimer) {
    clearInterval(durationTimer);
    durationTimer = null;
  }
  callService.cleanup();
  socketService.off('call_end');
});
</script>

<style scoped>
.call-page {
  min-height: 100dvh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
}

.call-header {
  padding: 60px 20px 30px;
  text-align: center;
  position: relative;
}

.caller-info {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: white;
  margin-bottom: 8px;
}

.call-status {
  display: block;
  font-size: 14px;
  color: rgba(255,255,255,0.7);
  margin-bottom: 4px;
}

.call-mode {
  display: inline-block;
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.1);
  padding: 2px 8px;
  border-radius: 8px;
}

.call-rate-info {
  margin-top: 6px;
}

.rate-badge {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  background: rgba(255,255,255,0.1);
  padding: 3px 14px;
  border-radius: 10px;
}

.video-container {
  flex: 1;
  position: relative;
  padding: 20px;
}

.remote-video {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(0,0,0,0.5);
  position: relative;
}

.remote-video video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.avatar-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: white;
  margin-bottom: 16px;
}

.placeholder-text {
  color: rgba(255,255,255,0.8);
  font-size: 16px;
}

.local-video {
  position: absolute;
  bottom: 40px;
  right: 40px;
  width: 120px;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid rgba(255,255,255,0.3);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.local-video video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.local-label {
  position: absolute;
  bottom: 4px;
  left: 4px;
  font-size: 12px;
  color: white;
  background: rgba(0,0,0,0.5);
  padding: 2px 6px;
  border-radius: 4px;
}

.call-overlay {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 10;
  pointer-events: none;
}

.overlay-timer {
  font-size: 20px;
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  font-variant-numeric: tabular-nums;
}

.overlay-cost {
  font-size: 12px;
  color: rgba(255,255,255,0.8);
  text-shadow: 0 1px 4px rgba(0,0,0,0.5);
}

.call-actions {
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 30px 20px;
  padding-bottom: calc(30px + env(safe-area-inset-bottom));
}

.action-btn {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  cursor: pointer;
  transition: all 0.2s;
}

.audio-btn {
  background: rgba(255,255,255,0.15);
}

.audio-btn:hover {
  background: rgba(255,255,255,0.25);
}

.audio-btn.active {
  background: rgba(102,126,234,0.8);
}

.video-btn {
  background: rgba(255,255,255,0.15);
}

.video-btn:hover {
  background: rgba(255,255,255,0.25);
}

.video-btn.active {
  background: rgba(102,126,234,0.8);
}

.hangup-btn {
  background: rgba(255,107,107,0.9);
}

.hangup-btn:hover {
  background: rgba(255,107,107,1);
  transform: scale(1.05);
}
</style>
