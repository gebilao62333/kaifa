<template>
  <div class="call-page">
    <div class="call-header">
      <span class="caller-info">{{ callerName }}</span>
      <span class="call-status">{{ callStatus }}</span>
      <div class="call-rate-info" v-if="videoPrice > 0">
        <span class="rate-badge">{{ videoPrice }} 金币/分钟</span>
      </div>
    </div>
    
    <div class="video-container">
      <div class="remote-video">
        <video ref="remoteVideoRef" autoplay playsinline></video>
        <div class="video-placeholder" v-if="!remoteStream">
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
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { trtcService } from '../services/trtcService';

const route = useRoute();
const router = useRouter();

const callerId = ref('');
const callerName = ref('对方');
const callStatus = ref('正在连接...');
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

const initCall = async () => {
  callerId.value = route.params.id;
  callerName.value = localStorage.getItem('callTargetName') || `用户${callerId.value}`;

  const saved = localStorage.getItem('callSettings');
  if (saved) {
    const settings = JSON.parse(saved);
    videoPrice.value = settings.videoPrice || 0;
  }

  try {
    const authRes = await trtcService.getAuth();
    if (!authRes.data) {
      throw new Error('获取通话权限失败');
    }

    localStream.value = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    if (localVideoRef.value) {
      localVideoRef.value.srcObject = localStream.value;
    }

    const startRes = await trtcService.startCall(callerId.value, 2, false, 0);
    if (startRes.data) {
      callId.value = startRes.data.callId;
    }

    callStatus.value = '等待对方接听...';
    isConnecting.value = true;

    setTimeout(() => {
      if (isConnecting.value) {
        isConnected.value = true;
        isConnecting.value = false;
        callStatus.value = '已连接';
        remoteStream.value = localStream.value;
        if (remoteVideoRef.value && remoteStream.value) {
          remoteVideoRef.value.srcObject = remoteStream.value;
        }
        startDurationTimer();
      }
    }, 2000);

  } catch (error) {
    console.error('初始化通话失败:', error);
    connectionError.value = error.message || '无法建立通话连接';
    callStatus.value = '连接失败';
    setTimeout(() => router.back(), 2000);
  }
};

const startDurationTimer = () => {
  durationTimer = setInterval(() => {
    callDuration.value++;
    const m = Math.floor(callDuration.value / 60).toString().padStart(2, '0');
    const s = (callDuration.value % 60).toString().padStart(2, '0');
    formattedDuration.value = `${m}:${s}`;
    totalCost.value = Math.ceil(callDuration.value / 60) * videoPrice.value;
  }, 1000);
};

const toggleAudio = () => {
  if (localStream.value) {
    localStream.value.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    audioEnabled.value = !audioEnabled.value;
  }
};

const toggleVideo = () => {
  if (localStream.value) {
    localStream.value.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    videoEnabled.value = !videoEnabled.value;
  }
};

const hangup = async () => {
  if (durationTimer) {
    clearInterval(durationTimer);
    durationTimer = null;
  }

  if (callId.value) {
    try {
      await trtcService.endCall(callId.value);
    } catch (error) {
      console.error('结束通话请求失败:', error);
    }
  }

  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop());
    localStream.value = null;
  }

  router.back();
};

onMounted(() => {
  initCall();
});

onUnmounted(() => {
  if (durationTimer) {
    clearInterval(durationTimer);
  }
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop());
  }
});
</script>

<style scoped>
.call-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  background: -webkit-linear-gradient(315deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
