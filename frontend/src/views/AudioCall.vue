<template>
  <div class="audio-call-page">
    <div class="call-header">
      <span class="caller-info">{{ callerName }}</span>
      <span class="call-status">{{ callStatus }}</span>
    </div>
    
    <div class="call-visual">
      <div class="avatar-large">
        {{ callerName.charAt(0) }}
      </div>
      <div class="call-rate" v-if="voicePrice > 0">
        <span class="rate-label">{{ voicePrice }} 金币/分钟</span>
      </div>
      <div class="call-timer" v-if="isConnected">
        <span class="timer-text">{{ formattedDuration }}</span>
        <span class="cost-text" v-if="voicePrice > 0">费用：{{ totalCost }} 金币</span>
      </div>
      <div class="audio-wave" v-if="isConnected">
        <span v-for="i in 8" :key="i" class="wave-bar" :style="{ animationDelay: `${i * 0.15}s` }"></span>
      </div>
    </div>
    
    <div class="call-actions">
      <button class="action-btn audio-btn" :class="{ active: audioEnabled }" @click="toggleAudio">
        <span>{{ audioEnabled ? '🔊' : '🔇' }}</span>
      </button>
      <button class="action-btn speaker-btn" :class="{ active: speakerEnabled }" @click="toggleSpeaker">
        <span>{{ speakerEnabled ? '🔈' : '🎧' }}</span>
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

const localStream = ref(null);
const audioEnabled = ref(true);
const speakerEnabled = ref(true);
const voicePrice = ref(0);
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
    voicePrice.value = settings.voicePrice || 0;
  }

  try {
    const authRes = await trtcService.getAuth();
    if (!authRes.data) {
      throw new Error('获取通话权限失败');
    }

    localStream.value = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    const startRes = await trtcService.startCall(callerId.value, 1, false, 0);
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
        startDurationTimer();
      }
    }, 2000);

  } catch (error) {
    console.error('初始化通话失败:', error);
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
    totalCost.value = Math.ceil(callDuration.value / 60) * voicePrice.value;
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

const toggleSpeaker = () => {
  speakerEnabled.value = !speakerEnabled.value;
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
    durationTimer = null;
  }
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop());
  }
});
</script>

<style scoped>
.audio-call-page {
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
}

.call-visual {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.call-rate {
  margin-bottom: 8px;
}

.rate-label {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
  background: rgba(255,255,255,0.1);
  padding: 4px 16px;
  border-radius: 12px;
}

.call-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
}

.timer-text {
  font-size: 32px;
  font-weight: bold;
  color: white;
  font-variant-numeric: tabular-nums;
}

.cost-text {
  font-size: 13px;
  color: rgba(255,255,255,0.6);
}

.avatar-large {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  color: white;
  margin-bottom: 40px;
  box-shadow: 0 8px 32px rgba(102,126,234,0.3);
}

.audio-wave {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
}

.wave-bar {
  width: 6px;
  height: 100%;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  animation: wave 0.8s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { height: 20%; }
  50% { height: 100%; }
}

.call-actions {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 40px 20px;
  padding-bottom: calc(40px + env(safe-area-inset-bottom));
}

.action-btn {
  width: 75px;
  height: 75px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
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

.speaker-btn {
  background: rgba(255,255,255,0.15);
}

.speaker-btn:hover {
  background: rgba(255,255,255,0.25);
}

.speaker-btn.active {
  background: rgba(102,126,234,0.8);
}

.hangup-btn {
  background: rgba(255,107,107,0.9);
}

.hangup-btn:hover {
  background: rgba(255,107,107,1);
  transform: scale(1.05);
}

@media (min-width: 768px) {
  .audio-call-page {
    max-width: 650px;
    margin: 0 auto;
  }
  .header {
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
  }
}
@media (min-width: 1024px) {
  .audio-call-page {
    max-width: 720px;
  }
  .header {
    max-width: 720px;
  }
}
</style>
