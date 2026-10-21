<template>
  <view class="audio-call-page">
    <view class="call-header">
      <text class="caller-info">{{ callerName }}</text>
      <text class="call-status">{{ callStatus }}</text>
      <text class="call-mode" v-if="callMode">{{ callMode === 'webrtc' ? (nativeCall ? '原生 WebRTC' : 'WebRTC') : 'TRTC' }}</text>
    </view>
    
    <view class="call-visual">
      <view class="avatar-large">
        {{ callerName.charAt(0) }}
      </view>
      <view class="call-rate" v-if="voicePrice > 0">
        <text class="rate-label">{{ voicePrice }} 金币/分钟</text>
      </view>
      <view class="call-timer" v-if="isConnected">
        <text class="timer-text">{{ formattedDuration }}</text>
        <text class="cost-text" v-if="voicePrice > 0">费用：{{ totalCost }} 金币</text>
      </view>
      <view class="audio-wave" v-if="isConnected">
        <text v-for="i in 8" :key="i" class="wave-bar" :style="{ animationDelay: `${i * 0.15}s` }"></text>
      </view>
      <!-- WebRTC 远程音频流 -->
      <audio ref="remoteAudioRef" autoplay playsinline></audio>
    </view>
    
    <view class="call-actions">
      <button class="action-btn audio-btn" :class="{ active: audioEnabled }" @click="toggleAudio">
        <text>{{ audioEnabled ? '🔊' : '🔇' }}</text>
      </button>
      <button class="action-btn speaker-btn" :class="{ active: speakerEnabled }" @click="toggleSpeaker">
        <text>{{ speakerEnabled ? '🔈' : '🎧' }}</text>
      </button>
      <button class="action-btn hangup-btn" @click="hangup">
        <text>📞</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from '@/common/route';
import { callService } from '../services/callService';
import { webrtcCallService } from '../services/webrtcCallService';
import { socketService } from '../services/socketService';
import { trtcRoomService } from '../services/trtcRoomService';
import { isNativeCallAvailable } from '../services/nativeCallAdapter';

const route = useRoute();
const router = useRouter();
// App 原生通道：音频由原生 WebRTC 播放，页面不再绑定 MediaStream
const nativeCall = isNativeCallAvailable();

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
// 主叫是否已被接听（后端 status 从 0 呼叫中变为 1）：区分「取消呼叫」与「结束通话」
const callAccepted = ref(false);
const handleCallAccepted = () => { callAccepted.value = true; };

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
      if (nativeCall) return;
      if (remoteAudioRef.value) {
        remoteAudioRef.value.srcObject = stream;
      }
    },
    onLocalStream: (stream) => {
      if (nativeCall) return;
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

  // 主叫监听接听事件：接听后即使媒体还没连上，挂断也必须走 endCall（发 call_end），
  // 否则对端通话页会一直停在「正在连接」，只能等本地超时。
  socketService.on('call_accept', handleCallAccepted);

  try {
    if (isIncoming.value) {
      // 被叫方：WebRTC 的 PeerConnection 与本地流已在 acceptCall 时建好
      // 通道以接听时确定的为准：query > 服务实例当前模式 > localStorage 兜底
      const modeFromQuery = route.query.mode;
      const useWebRTC = modeFromQuery
        ? modeFromQuery === 'webrtc'
        : (callService.currentMode === 'webrtc' || localStorage.getItem('_pendingCallMode') === 'webrtc');
      callMode.value = useWebRTC ? 'webrtc' : 'trtc';

      // 复用已建立的本地流，避免再次 getUserMedia 产生第二条流（那条流没有接进 PeerConnection）
      if (useWebRTC) {
        if (!nativeCall) localStream.value = webrtcCallService.localStream;
      } else {
        // TRTC 通道：采集/推流/播放全部交给官方 SDK（房间号由来电方通过 ?room= 带入）
        await trtcRoomService.join({ callType: 1, roomId: route.query.room });
      }

      // 被叫是「先接通、后挂载页面」，回调回灌可能已置为已连接，不能覆盖回去
      if (!isConnected.value) {
        callStatus.value = '正在连接...';
        isConnecting.value = true;
      }

    } else {
      // 主叫方：使用 callService 发起
      const result = await callService.startCall(
        callerId.value,
        1,
        route.query.companion === '1',
        Number(route.query.orderId) || 0
      );
      callMode.value = result.mode;
      callId.value = result.callId;

      if (result.mode === 'webrtc') {
        if (!nativeCall) localStream.value = webrtcCallService.localStream;
      } else {
        await trtcRoomService.join({ callType: 1, roomId: result.trtcRoomId });
      }

      callStatus.value = '等待对方接听...';
      isConnecting.value = true;
    }

    // 信令（offer/answer/ICE 与「接听后发 offer」）已下沉到 webrtcCallService，
    // 早于页面挂载生效，这里只保留挂断提示
    socketService.on('call_end', () => {
      callStatus.value = '对方已挂断';
      setTimeout(() => hangup(), 1500);
    });
  } catch (error) {
    console.error('初始化通话失败:', error);
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

const toggleSpeaker = () => {
  speakerEnabled.value = !speakerEnabled.value;
  // 原生通道显式切换扬声器/听筒；H5 由系统音频路由决定，callService 内部自动降级
  callService.toggleSpeaker(speakerEnabled.value);
};

const hangup = async () => {
  if (durationTimer) {
    clearInterval(durationTimer);
    durationTimer = null;
  }

  // 未接通就挂断（后端 status=0 呼叫中）：走 cancelCall 发 call_cancel，
  // 让对方立刻关闭来电弹窗；endCall 发的是 call_end，弹窗要等 60s 超时才会消失（P1-7）。
  // 已接听后（status=1，即使媒体还在协商）必须走 endCall，否则对端通话页收不到 call_end。
  if (!isConnected.value && !isIncoming.value && !callAccepted.value) {
    await callService.cancelCall(callId.value);
  } else {
    await callService.endCall(callDuration.value);
  }

  if (localStream.value && callMode.value !== 'webrtc') {
    localStream.value.getTracks().forEach(track => track.stop());
    localStream.value = null;
  }

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
  socketService.off('call_accept', handleCallAccepted);
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
