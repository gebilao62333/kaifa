<template>
  <div class="audio-call-page">
    <div class="call-header">
      <span class="caller-info">{{ callerName }}</span>
      <span class="call-status">{{ callStatus }}</span>
      <span class="call-mode" v-if="callMode">{{ callMode === 'webrtc' ? 'WebRTC' : 'TRTC' }}</span>
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
      <!-- WebRTC 远程音频流 -->
      <audio ref="remoteAudioRef" autoplay playsinline></audio>
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
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { callService } from '../services/callService';
import { webrtcCallService } from '../services/webrtcCallService';
import { socketService } from '../services/socketService';

const route = useRoute();
const router = useRouter();

const callerId = ref('');
const callerName = ref('对方');
const callStatus = ref('正在连接...');
const callMode = ref(null); // 'trtc' | 'webrtc'
const isConnected = ref(false);
const callId = ref(null);
const isConnecting = ref(true);

const localStream = ref(null);
const remoteAudioRef = ref(null);
const audioEnabled = ref(true);
const speakerEnabled = ref(true);
const voicePrice = ref(0);
const callDuration = ref(0);
const formattedDuration = ref('00:00');
const totalCost = ref(0);
let durationTimer = null;

// 是否是来电接听方
const isIncoming = ref(false);

const initCall = async () => {
  callerId.value = route.params.id;
  callerName.value = localStorage.getItem('callTargetName') || `用户${callerId.value}`;

  const saved = localStorage.getItem('callSettings');
  if (saved) {
    const settings = JSON.parse(saved);
    voicePrice.value = settings.voicePrice || 0;
  }

  // 获取路由参数判断是主叫还是被叫
  isIncoming.value = route.query.incoming === '1';

  // 设置 WebRTC 回调
  webrtcCallService.setCallbacks({
    onRemoteStream: (stream) => {
      if (remoteAudioRef.value) {
        remoteAudioRef.value.srcObject = stream;
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
      totalCost.value = Math.ceil(duration / 60) * voicePrice.value;
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
      // 被叫方：WebRTC 已经在 handleIncomingCall 中初始化
      // TRTC 模式需要本地获取 media
      const useWebRTC = localStorage.getItem('_pendingCallMode') === 'webrtc';
      callMode.value = useWebRTC ? 'webrtc' : 'trtc';

      if (!useWebRTC) {
        localStream.value = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
      }

      callStatus.value = '正在连接...';
      isConnecting.value = true;

    } else {
      // 主叫方：使用 callService 发起
      const result = await callService.startCall(callerId.value, 1);
      callMode.value = result.mode;
      callId.value = result.callId;

      if (result.mode === 'webrtc') {
        localStream.value = webrtcCallService.localStream;
        // 监听对方接听事件以发送offer
        socketService.on('call_accept', () => {
          webrtcCallService.sendDelayedOffer();
        });
      }

      callStatus.value = '等待对方接听...';
      isConnecting.value = true;

      // 监听对方接听（WebRTC模式）
      socketService.on('webrtc_offer', (data) => {
        webrtcCallService.handleOffer(data.fromId, data.sdp);
      });
      socketService.on('webrtc_answer', (data) => {
        webrtcCallService.handleAnswer(data.fromId, data.sdp);
      });
      socketService.on('webrtc_ice_candidate', (data) => {
        webrtcCallService.handleIceCandidate(data.fromId, data.candidate);
      });

      // 对方挂断
      socketService.on('call_end', () => {
        callStatus.value = '对方已挂断';
        setTimeout(() => hangup(), 1500);
      });
    }
  } catch (error) {
    console.error('初始化通话失败:', error);
    callStatus.value = '连接失败';
    setTimeout(() => router.back(), 2000);
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

const toggleSpeaker = () => {
  speakerEnabled.value = !speakerEnabled.value;
  // WebRTC 模式下不需要额外处理，浏览器自动使用扬声器
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

  // 清理 WebRTC 监听
  socketService.off('webrtc_offer');
  socketService.off('webrtc_answer');
  socketService.off('webrtc_ice_candidate');
  socketService.off('call_accept');
  socketService.off('call_end');

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
  callService.cleanup();
  socketService.off('webrtc_offer');
  socketService.off('webrtc_answer');
  socketService.off('webrtc_ice_candidate');
  socketService.off('call_accept');
  socketService.off('call_end');
});
</script>

<style scoped>
.audio-call-page {
  min-height: 100dvh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
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

.call-mode {
  display: inline-block;
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.1);
  padding: 2px 8px;
  border-radius: 8px;
  margin-top: 6px;
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
  background: var(--gradient-primary);
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
  background: var(--gradient-primary-180);
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
</style>
