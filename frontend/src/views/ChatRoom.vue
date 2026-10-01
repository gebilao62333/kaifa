<template>
  <div class="chat-room">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <div class="avatar-mini avatar-frame" :style="avatarFrameStyle" @click="goUserProfile">
        <img :src="userInfo.avatar" alt="" v-img-fallback="userInfo.nickName" />
      </div>
      <span class="nickname">{{ userInfo.nickName }}</span>
      <span class="badge-tag" v-if="selectedBadge" :style="selectedBadge.style">
        <span class="badge-icon">{{ selectedBadge.icon }}</span>
        {{ selectedBadge.label }}
      </span>
      <span class="online-status" v-if="userInfo.isOnline">在线</span>
      <span class="more-btn" @click="showMoreMenu = true">•••</span>
    </div>
    
    <div class="messages" ref="messagesRef" @scroll="handleScroll">
      <div class="date-divider" v-if="showDateDivider">
        <span>{{ currentDateText }}</span>
      </div>

      <div v-if="messages.length === 0 && !loadingMessages" class="empty-chat">
        <span class="empty-icon">💬</span>
        <p>暂无消息，发送一条消息开始聊天吧</p>
      </div>
      
      <div v-for="(msg, index) in messages" :key="msg.id" :class="['message', msg.isOwn ? 'own' : 'other']">
        <div class="avatar-wrap-frame" :class="[msg.isOwn ? 'own' : 'other']" :style="msg.isOwn ? {} : avatarFrameStyle">
          <img class="avatar" :src="msg.isOwn ? myInfo.avatar : userInfo.avatar" alt="" v-img-fallback="msg.isOwn ? myInfo.nickName : userInfo.nickName" />
        </div>
        <div class="content">
          <div class="time" v-if="shouldShowTime(index)">{{ formatTime(msg.createTime) }}</div>
          <div 
            class="bubble" 
            @click="handleMessageClick(msg)"
            @contextmenu.prevent="showMessageMenu(msg, $event)"
          >
            <template v-if="msg.type === 'text'">
              {{ msg.content }}
            </template>
            <template v-else-if="msg.type === 'image'">
              <img class="image-msg" :src="msg.content" alt="" @click.stop="previewImage(msg)" />
            </template>
            <template v-else-if="msg.type === 'video'">
              <div class="video-msg" @click.stop="previewVideo(msg)">
                <img class="video-thumbnail" :src="msg.thumbnail || msg.content" alt="" />
                <span class="video-play-icon">▶️</span>
                <span class="video-duration">{{ msg.duration }}</span>
              </div>
            </template>
            <template v-else-if="msg.type === 'audio'">
              <div class="audio-msg" @click.stop="toggleAudio(msg)">
                <span class="icon" :class="{ playing: playingAudioId === msg.id }">
                  {{ playingAudioId === msg.id ? '⏸️' : '🔊' }}
                </span>
                <span class="waveform" v-if="playingAudioId === msg.id">
                  <span v-for="i in 5" :key="i" class="bar" :style="{ animationDelay: `${i * 0.1}s` }"></span>
                </span>
                <span class="duration">{{ msg.duration }}''</span>
              </div>
            </template>
            <template v-else-if="msg.type === 'location'">
              <div class="location-msg">
                <div class="location-map">
                  <span class="location-icon">📍</span>
                </div>
                <div class="location-info">
                  <span class="location-title">{{ msg.title }}</span>
                  <span class="location-address">{{ msg.content }}</span>
                </div>
              </div>
            </template>
            <template v-else-if="msg.type === 'gift'">
              <div class="gift-msg" :class="{ 'gift-msg-luxury': msg.giftType === 1 }">
                <span class="gift-msg-badge" v-if="msg.giftType === 1">豪华</span>
                <img v-if="msg.icon && /^https?:/.test(msg.icon)" class="gift-icon-img" :src="msg.icon" alt="" />
                <span v-else class="gift-icon">{{ msg.icon }}</span>
                <span class="gift-content">赠送了 {{ msg.count }} 个 {{ msg.name }}</span>
              </div>
            </template>
            <template v-else-if="msg.type === 'redpacket'">
              <div class="redpacket-msg">
                <div class="redpacket-icon">🧧</div>
                <div class="redpacket-content">
                  <span class="redpacket-title">{{ msg.message }}</span>
                  <span class="redpacket-info">
                    普通红包 · {{ msg.count }}个 · ¥{{ msg.amount }}
                  </span>
                </div>
              </div>
            </template>
            <template v-else-if="msg.type === 'system'">
              <span class="system-text">{{ msg.content }}</span>
            </template>
            <template v-else-if="msg.status === 'recalled'">
              <span class="recalled-text">消息已撤回</span>
            </template>
          </div>
          <div class="status">
            <span v-if="msg.isOwn" class="send-status">
              <span v-if="msg.status === 'sending'">发送中...</span>
              <span v-else-if="msg.status === 'failed'" class="failed" @click="retrySend(msg)">发送失败</span>
              <span v-else-if="msg.status === 'sent'">✓</span>
              <span v-else-if="msg.status === 'read'" class="read-icon">已读</span>
            </span>
          </div>
        </div>
      </div>
      
      <div v-if="typing" class="typing-indicator">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span>{{ userInfo.nickName }}正在输入...</span>
      </div>
    </div>
    
    <div v-if="showMoreMenu" class="modal" @click.self="showMoreMenu = false">
      <div class="more-menu">
        <div class="menu-item" @click="goUserProfile">查看资料</div>
        <div class="menu-item" @click="blockUser">拉黑</div>
        <div class="menu-item" @click="openReport">举报</div>
        <div class="menu-item cancel" @click="showMoreMenu = false">取消</div>
      </div>
    </div>

    <div v-if="showMessageContextMenu" class="modal" @click.self="showMessageContextMenu = false">
      <div class="context-menu" :style="contextMenuStyle">
        <div class="context-item" v-if="selectedMessage?.isOwn" @click="revokeMessage(selectedMessage)">撤回</div>
        <div class="context-item" @click="copyMessage(selectedMessage)">复制</div>
        <div class="context-item" @click="forwardMessage(selectedMessage)">转发</div>
        <div class="context-item cancel" @click="showMessageContextMenu = false">取消</div>
      </div>
    </div>
    
    <div class="bottom-bar">
      <div class="voice-btn" @click="toggleVoice">
        {{ isVoice ? '⌨️' : '🎤' }}
      </div>
      <div class="input-wrapper">
        <input 
          v-if="!isVoice" 
          class="text-input" 
          type="text" 
          v-model="text" 
          placeholder="请输入..." 
          @keyup.enter="sendText"
          @input="handleInput"
        />
        <div v-else class="voice-input">
          <div class="record-indicator" :class="{ recording: isRecording }"
            @touchstart.prevent="startRecord"
            @touchend.prevent="endRecord"
            @touchcancel="endRecord"
            @mousedown.prevent="startRecord"
            @mouseup="endRecord"
            @mouseleave="endRecord">
            <span class="record-icon">{{ isRecording ? '🔴' : '🎤' }}</span>
            <span class="record-text">{{ isRecording ? '松开发送' : '按住录音' }}</span>
            <span class="record-time" v-if="isRecording">{{ recordDuration }}</span>
          </div>
        </div>
      </div>
      <div class="emoji-btn" @click="toggleEmoji">😊</div>
      <div class="add-btn" @click="toggleAdd">+</div>
    </div>
    
    <div v-if="showEmoji" class="emoji-panel">
      <div class="emoji-tabs">
        <span 
          v-for="(tab, index) in emojiTabs" 
          :key="index" 
          :class="['tab', { active: activeEmojiTab === index }]"
          @click="activeEmojiTab = index"
        >{{ tab }}</span>
      </div>
      <div class="emoji-content">
        <div class="emoji-item" v-for="emoji in currentEmojis" :key="emoji" @click="selectEmoji(emoji)">
          {{ emoji }}
        </div>
      </div>
    </div>
    
    <div v-if="showAdd" class="add-panel">
      <div class="add-item" @click="selectImage">📷 图片</div>
      <div class="add-item" @click="selectVideo">🎬 视频</div>
      <div class="add-item" @click="makeCall">📞 语音通话<span class="add-price" v-if="callRates.voicePrice">{{ callRates.voicePrice }}金币/分钟</span></div>
      <div class="add-item" @click="makeVideoCall">📹 视频通话<span class="add-price" v-if="callRates.videoPrice">{{ callRates.videoPrice }}金币/分钟</span></div>
      <div class="add-item" @click="selectLocation">📍 位置</div>
      <div class="add-item" @click="selectGift">🎁 礼物</div>
      <div class="add-item" @click="selectRedPacket">🧧 红包</div>
    </div>

    <div v-if="showImagePreview" class="modal" @click.self="showImagePreview = false">
      <div class="image-preview">
        <img :src="previewImageUrl" alt="" />
        <span class="close-btn" @click="showImagePreview = false">✕</span>
      </div>
    </div>

    <div v-if="showVideoPreview" class="modal" @click.self="showVideoPreview = false">
      <div class="video-preview">
        <video :src="previewVideoUrl" controls autoplay></video>
        <span class="close-btn" @click="showVideoPreview = false">✕</span>
      </div>
    </div>

    <div v-if="showLocationSelector" class="modal" @click.self="showLocationSelector = false">
      <div class="location-modal">
        <div class="modal-header">
          <span class="modal-title">选择位置</span>
          <span class="modal-close" @click="showLocationSelector = false">✕</span>
        </div>
        <div class="location-body">
          <div class="location-search">
            <input 
              type="text" 
              v-model="locationSearch" 
              placeholder="搜索地址..." 
              class="search-input"
            />
          </div>
          <div class="location-picker">
            <div class="picker-row">
              <select v-model="selectedProvince" @change="onProvinceChange" class="location-select">
                <option value="">请选择省份</option>
                <option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
              </select>
            </div>
            <div class="picker-row">
              <select v-model="selectedCity" @change="onCityChange" class="location-select">
                <option value="">请选择城市</option>
                <option v-for="c in cities" :key="c.code" :value="c.code">{{ c.name }}</option>
              </select>
            </div>
            <div class="picker-row">
              <select v-model="selectedDistrict" @change="onDistrictChange" class="location-select">
                <option value="">请选择区县</option>
                <option v-for="d in districts" :key="d.code" :value="d.code">{{ d.name }}</option>
              </select>
            </div>
            <div class="picker-row">
              <select v-model="selectedTown" @change="onTownChange" class="location-select">
                <option value="">请选择乡镇</option>
                <option v-for="t in towns" :key="t.code" :value="t.code">{{ t.name }}</option>
              </select>
            </div>
            <div class="picker-row">
              <input v-model="selectedStreet" class="location-select" placeholder="请输入街道（可自定义）" />
            </div>
          </div>
          <div class="current-location" @click="useCurrentLocation">
            <span class="location-icon">📍</span>
            <span>使用当前位置</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel" @click="showLocationSelector = false">取消</button>
          <button class="modal-btn confirm" @click="sendLocation">发送位置</button>
        </div>
      </div>
    </div>

    <GiftList 
      :visible="showGiftPanel" 
      :user-balance="userBalance"
      :receiver-id="userInfo.userId"
      @close="showGiftPanel = false"
      @send="handleSendGift"
    />
    
    <div v-if="giftEffect" class="gift-effect-overlay" @click="giftEffect = null">
      <div class="gift-effect-content">
        <div class="effect-rays"></div>
        <div class="effect-icon">
          <video v-if="giftEffect.animation && isVideoUrl(giftEffect.animation)" :src="giftEffect.animation" class="effect-video" autoplay loop muted playsinline></video>
          <img v-else-if="giftEffect.animation" :src="giftEffect.animation" alt="">
          <img v-else-if="giftEffect.icon" :src="giftEffect.icon" alt="">
          <span v-else>👑</span>
        </div>
        <div class="effect-title">豪华礼物</div>
        <div class="effect-name">{{ giftEffect.name }}</div>
        <div class="effect-count">x{{ giftEffect.count }}</div>
        <div class="effect-particles">
          <span v-for="i in 16" :key="i" class="particle" :style="{ left: (5 + i * 6) + '%', animationDelay: (i * 0.08) + 's' }">✨</span>
        </div>
      </div>
    </div>
    
    <RedPacketPanel 
      :visible="showRedPacketPanel" 
      :user-balance="userBalance"
      :receiver-id="userInfo.userId"
      @close="showRedPacketPanel = false"
      @send="handleSendRedPacket"
    />

    <ReportModal
      :visible="showReport"
      :target-type="1"
      :target-id="userInfo.userId"
      @close="showReport = false"
      @submitted="onReported"
    />
    
    <div v-if="showForwardPanel" class="modal" @click.self="showForwardPanel = false">
      <div class="forward-modal">
        <div class="modal-header">
          <span class="modal-title">转发给好友</span>
          <span class="modal-close" @click="showForwardPanel = false">✕</span>
        </div>
        <div class="forward-body">
          <div class="forward-search">
            <input 
              type="text" 
              v-model="forwardSearch" 
              placeholder="搜索好友..." 
              class="search-input"
            />
          </div>
          <div class="forward-list">
            <div 
              v-for="friend in forwardFriends" 
              :key="friend.id" 
              class="forward-item"
              @click="confirmForward(friend)"
            >
              <img :src="friend.avatar" class="forward-avatar" v-img-fallback="friend.nickName" />
              <div class="forward-info">
                <span class="forward-name">{{ friend.nickName }}</span>
                <span class="forward-status" v-if="friend.isOnline">在线</span>
                <span class="forward-status offline" v-else>离线</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="confirmDialog.show" class="modal" @click.self="confirmDialog.onCancel">
      <div class="confirm-dialog">
        <div class="confirm-dialog-body">{{ confirmDialog.message }}</div>
        <div class="confirm-dialog-actions">
          <button class="cancel-btn" @click="confirmDialog.onCancel">取消</button>
          <button class="confirm-btn" @click="confirmDialog.onConfirm">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>import { ref, reactive, nextTick, onMounted, onUnmounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '../store/user-info';
import chatService from '../services/chatService';
import giftService from '../services/giftService';
import { uploadFile } from '../services/uploadService';
import socketService from '../services/socketService';
import authService from '../services/authService';
import GiftList from '../components/gift-list/gift-list.vue';
import RedPacketPanel from '../components/RedPacketPanel.vue';
import ReportModal from '../components/report-modal/report-modal.vue';
import { toast } from '../composables/useToast';
import { DEFAULT_AVATAR, STORAGE_KEYS } from '../common/constants';
import { provinceList, cityData as chinaCityData } from '../data/china-regions';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const selectedBadge = ref(null);
const avatarFrameStyle = ref({});

const confirmDialog = reactive({ show: false, message: '', onConfirm: () => {}, onCancel: () => {} })
const showConfirm = (message) => {
  return new Promise((resolve) => {
    confirmDialog.show = true
    confirmDialog.message = message
    confirmDialog.onConfirm = () => { confirmDialog.show = false; resolve(true) }
    confirmDialog.onCancel = () => { confirmDialog.show = false; resolve(false) }
  })
}

const loadVipItems = () => {
  try {
    const savedBadge = localStorage.getItem('selectedBadge');
    if (savedBadge) {
      selectedBadge.value = JSON.parse(savedBadge);
    }
    const savedFrame = localStorage.getItem('selectedAvatarFrame');
    if (savedFrame) {
      const frame = JSON.parse(savedFrame);
      avatarFrameStyle.value = frame.style || {};
    }
  } catch (e) { console.warn('加载装扮信息失败:', e) }
};

const userInfo = ref({
 userId: 0,
 nickName: '',
 avatar: DEFAULT_AVATAR,
 isOnline: false
});
const myInfo = ref({
 userId: 0,
 nickName: '',
 avatar: DEFAULT_AVATAR,
});
const loadingMessages = ref(false);
const messages = ref([]);
const text = ref('');
const isVoice = ref(false);
const isRecording = ref(false);
const recordDuration = ref('');
const showEmoji = ref(false);
const showAdd = ref(false);
const callRates = ref({ voicePrice: 0, videoPrice: 0 })
const loadCallRates = () => {
  const saved = localStorage.getItem('callSettings')
  if (saved) {
    const s = JSON.parse(saved)
    callRates.value = { voicePrice: s.voicePrice || 0, videoPrice: s.videoPrice || 0 }
  }
}
const showMoreMenu = ref(false);
const showMessageContextMenu = ref(false);
const showImagePreview = ref(false);
const showVideoPreview = ref(false);
const showLocationSelector = ref(false);
const showGiftPanel = ref(false);
const showRedPacketPanel = ref(false);
const showReport = ref(false);
const showForwardPanel = ref(false);
const previewImageUrl = ref('');
const previewVideoUrl = ref('');
const selectedMessage = ref(null);
const contextMenuStyle = ref({});
const forwardSearch = ref('');
const forwardFriends = ref([]);
const typing = ref(false);
const playingAudioId = ref(null);
const messagesRef = ref(null);
const activeEmojiTab = ref(0);
const emojiTabs = ['😊', '🎉', '💯', '❤️'];
const emojiGroups = [
 ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😣', '😥', '😓', '🤗', '😍', '🥳', '😎', '🤩', '🥳', '😇', '🤠', '🥸', '🤡', '🥶', '🥵', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'],
 ['🎉', '🎊', '✨', '🌟', '💫', '⚡', '🔥', '💯', '💪', '👏', '🙌', '👋', '🤝', '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '🤟', '🤘', '👌', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🦾', '🦿', '🦵', '🦶', '👀', '👁️', '👂', '👃', '👄', '👅', '💋', '🤩', '🥰', '😘', '😗'],
 ['💯', '🔢', '🔤', '🔡', '🔠', '📝', '✏️', '✒️', '🖊️', '🖋️', '📄', '📃', '📑', '📜', '📝', '🔖', '🏷️', '💰', '💴', '💵', '💶', '💷', '💸', '🪙', '🧾', '📦', '📮', '📪', '📫', '📬', '📭', '📨', '📩', '📧', '📨', '💌', '✉️', '📩', '📨', '📧', '💼', '👜', '👝', '🎒', '💼', '🧳', '👝', '🎒', '📁', '📂', '📋'],
 ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌', '❤️‍🔥', '❤️‍🩹', '💋', '👩❤️👨', '👨❤️👨', '👩❤️👩', '💏', '💑', '👪', '👨👩👧', '👨👩👧👦', '👨👩👦👦', '👩👩👧👦', '👨👨👧👧', '👨👩👧👧', '👩👩👧', '👨👨👧', '👨👨👦', '👩👩👦', '👨👧👦', '👩👧👦']
];
const currentEmojis = computed(() => emojiGroups[activeEmojiTab.value]);
const userBalance = computed(() => userStore.balance);
const locationSearch = ref('');
const selectedProvince = ref('');
const selectedCity = ref('');
const selectedDistrict = ref('');
const selectedTown = ref('');
const selectedStreet = ref(''); // 街道为用户自由输入文本
const provinces = ref(provinceList);
const cities = ref([]);
const districts = ref([]);
const towns = ref([]);
const streets = ref([]);
const cityData = chinaCityData;
let recordTimer = null;
let typingTimer = null;
let mediaRecorder = null;
let recordedChunks = [];

const privacySettings = ref({
  autoRecall: 0,
  autoDestroy: 0
});

const loadPrivacySettings = () => {
  const saved = localStorage.getItem('privacy');
  if (saved) {
    privacySettings.value = JSON.parse(saved);
  }
};

loadPrivacySettings();

const scheduleAutoRecall = (msgId, delaySeconds) => {
  if (delaySeconds <= 0) return;
  setTimeout(() => {
    const index = messages.value.findIndex(m => m.id === msgId);
    if (index > -1 && messages.value[index].isOwn) {
      messages.value[index].status = 'recalled';
    }
  }, delaySeconds * 1000);
};

const scheduleAutoDestroy = (msgId) => {
  const delaySeconds = privacySettings.value.autoDestroy;
  if (delaySeconds <= 0) return;
  setTimeout(() => {
    const index = messages.value.findIndex(m => m.id === msgId);
    if (index > -1) {
      messages.value.splice(index, 1);
    }
  }, delaySeconds * 1000);
};
const formatTime = (timestamp) => {
 const date = new Date(timestamp);
 const h = date.getHours().toString().padStart(2, '0');
 const m = date.getMinutes().toString().padStart(2, '0');
 return `${h}:${m}`;
};
const shouldShowTime = (index) => {
 if (index === 0)
 return true;
 const current = messages.value[index];
 const prev = messages.value[index - 1];
 return (current.createTime - prev.createTime) > 300000;
};
const currentDateText = computed(() => {
 if (messages.value.length === 0)
 return '今天';
 const now = new Date();
 const msgDate = new Date(messages.value[0].createTime);
 const diffDays = Math.floor((now - msgDate) / (1000 * 60 * 60 * 24));
 if (diffDays === 0)
 return '今天';
 if (diffDays === 1)
 return '昨天';
 if (diffDays < 7)
 return `${diffDays}天前`;
 return `${msgDate.getMonth() + 1}月${msgDate.getDate()}日`;
});
const showDateDivider = computed(() => messages.value.length > 0);
const scrollToBottom = () => {
 nextTick(() => {
 if (messagesRef.value) {
 messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
 }
 });
};
const goBack = () => {
 router.back();
};
const goUserProfile = () => {
 showMoreMenu.value = false;
 router.push(`/user/${userInfo.value.userId}`);
};
const blockUser = async () => {
 showMoreMenu.value = false;
 if (await showConfirm(`确定要拉黑 ${userInfo.value.nickName} 吗？`)) {
 toast.success('已拉黑该用户');
 router.back();
 }
};
const openReport = () => {
 showMoreMenu.value = false;
 showReport.value = true;
};
const onReported = () => {
 showReport.value = false;
 toast.success('举报已提交，我们会尽快处理');
};
const toggleVoice = () => {
 isVoice.value = !isVoice.value;
 showEmoji.value = false;
 showAdd.value = false;
};
const toggleEmoji = () => {
 showEmoji.value = !showEmoji.value;
 showAdd.value = false;
};
const toggleAdd = () => {
  showAdd.value = !showAdd.value;
  showEmoji.value = false;
  if (showAdd.value) loadCallRates()
};
const selectEmoji = (emoji) => {
 text.value += emoji;
};
const handleInput = () => {
 if (typingTimer)
 clearTimeout(typingTimer);
 socketService.sendTyping(userInfo.value.userId);
 typingTimer = setTimeout(() => {
 socketService.sendTyping(userInfo.value.userId);
 }, 1000);
};
const sendText = async () => {
 if (!text.value.trim())
 return;
 const msgId = Date.now();
 const newMessage = {
 id: msgId,
 isOwn: true,
 type: 'text',
 content: text.value,
 showTime: messages.value.length === 0 ||
 (Date.now() - messages.value[messages.value.length - 1].createTime) > 300000,
 status: 'sending',
 createTime: Date.now()
 };
 messages.value.push(newMessage);
 text.value = '';
 scrollToBottom();
 try {
 await chatService.sendMessage(userInfo.value.userId, newMessage.content, 0);
 const index = messages.value.findIndex(m => m.id === msgId);
 if (index > -1) {
 messages.value[index].status = 'sent';
 }
 setTimeout(() => {
 const idx = messages.value.findIndex(m => m.id === msgId);
 if (idx > -1) {
 messages.value[idx].status = 'read';
 scheduleAutoRecall(msgId, privacySettings.value.autoRecall);
 scheduleAutoDestroy(msgId);
 }
 }, 1000);
 }
 catch (error) {
 const index = messages.value.findIndex(m => m.id === msgId);
 if (index > -1) {
 messages.value[index].status = 'failed';
 }
 }
};
const startRecord = async () => {
 if (isRecording.value) return;
 if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
 toast.error('当前环境不支持录音');
 return;
 }
 try {
 const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 recordedChunks = [];
 mediaRecorder = new MediaRecorder(stream);
 mediaRecorder.ondataavailable = (e) => {
 if (e.data && e.data.size > 0) recordedChunks.push(e.data);
 };
 mediaRecorder.start();
 isRecording.value = true;
 recordDuration.value = '00:00';
 let seconds = 0;
 recordTimer = setInterval(() => {
 seconds++;
 if (seconds >= 60) { endRecord(); return; }
 const m = Math.floor(seconds / 60).toString().padStart(2, '0');
 const s = (seconds % 60).toString().padStart(2, '0');
 recordDuration.value = `${m}:${s}`;
 }, 1000);
 } catch (error) {
 console.warn('[ChatRoom] 录音启动失败:', error);
 toast.error('无法访问麦克风，请检查权限');
 isRecording.value = false;
 }
};
const endRecord = () => {
 if (recordTimer) {
 clearInterval(recordTimer);
 recordTimer = null;
 }
 if (!isRecording.value || !mediaRecorder) return;
 const duration = Math.max(1, Math.floor(parseInt(recordDuration.value.split(':')[0]) * 60 + parseInt(recordDuration.value.split(':')[1])) || 0);
 const recorder = mediaRecorder;
 const stream = recorder.stream;
 mediaRecorder = null;
 isRecording.value = false;
 recordDuration.value = '';
 recorder.onstop = async () => {
 stream.getTracks().forEach(t => t.stop());
 if (!recordedChunks.length) return;
 const blob = new Blob(recordedChunks, { type: recorder.mimeType || 'audio/webm' });
 recordedChunks = [];
 const file = new File([blob], `voice_${Date.now()}.webm`, { type: blob.type });
 await sendAudio(duration, file);
 };
 recorder.stop();
};
const sendAudio = async (duration, file) => {
 const msgId = Date.now();
 const newMessage = {
 id: msgId,
 isOwn: true,
 type: 'audio',
 content: '',
 duration,
 showTime: messages.value.length === 0 ||
 (Date.now() - messages.value[messages.value.length - 1].createTime) > 300000,
 status: 'sending',
 createTime: Date.now()
 };
 messages.value.push(newMessage);
 scrollToBottom();
 try {
 let mediaUrl = '';
 if (file) {
 const result = await uploadFile(file, 'audio');
 mediaUrl = result.data.url;
 newMessage.content = mediaUrl;
 }
 // 后端 sendMessage 要求 content 非空，语音用占位文本承载，音频地址放 mediaUrl
 await chatService.sendMessage(userInfo.value.userId, '[语音]', 1, mediaUrl, duration);
 const index = messages.value.findIndex(m => m.id === msgId);
 if (index > -1) {
 messages.value[index].status = 'sent';
 }
 setTimeout(() => {
 const idx = messages.value.findIndex(m => m.id === msgId);
 if (idx > -1) {
 messages.value[idx].status = 'read';
 }
 }, 1000);
 }
 catch (error) {
 const index = messages.value.findIndex(m => m.id === msgId);
 if (index > -1) {
 messages.value[index].status = 'failed';
 }
 }
};
const toggleAudio = (msg) => {
 if (playingAudioId.value === msg.id) {
 playingAudioId.value = null;
 }
 else {
 playingAudioId.value = msg.id;
 setTimeout(() => {
 playingAudioId.value = null;
 }, msg.duration * 1000);
 }
};
const selectImage = () => {
 const input = document.createElement('input');
 input.type = 'file';
 input.accept = 'image/*';
 input.capture = 'environment';
 input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // 本地预览用临时对象URL，避免把整图读入内存
      const imageUrl = URL.createObjectURL(file);
      const msgId = Date.now();
      const newMessage = {
        id: msgId,
        isOwn: true,
        type: 'image',
        content: imageUrl,
        showTime: messages.value.length === 0 ||
        (Date.now() - messages.value[messages.value.length - 1].createTime) > 300000,
        status: 'sending',
        createTime: Date.now()
      };
      messages.value.push(newMessage);
      scrollToBottom();
      try {
        // 前端直传 COS，消息体只存真实访问 URL（不再塞整图字节）
        const result = await uploadFile(file, 'image');
        const realUrl = result.data.url;
        newMessage.content = realUrl;
        await chatService.sendMessage(userInfo.value.userId, realUrl, 2, realUrl);
        const index = messages.value.findIndex(m => m.id === msgId);
        if (index > -1) {
          messages.value[index].status = 'sent';
        }
      }
      catch (error) {
        const index = messages.value.findIndex(m => m.id === msgId);
        if (index > -1) {
          messages.value[index].status = 'failed';
        }
      }
    }
 };
 input.click();
 showAdd.value = false;
};
const selectVideo = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'video/*';
  input.capture = 'environment';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      const msgId = Date.now();
      const newMessage = {
        id: msgId,
        isOwn: true,
        type: 'video',
        content: videoUrl,
        thumbnail: videoUrl,
        duration: '00:15',
        showTime: messages.value.length === 0 ||
          (Date.now() - messages.value[messages.value.length - 1].createTime) > 300000,
        status: 'sending',
        createTime: Date.now()
      };
      messages.value.push(newMessage);
      scrollToBottom();
      try {
        // 前端直传 COS，消息体只存真实访问 URL
        const result = await uploadFile(file, 'video');
        const realUrl = result.data.url;
        newMessage.content = realUrl;
        newMessage.thumbnail = realUrl;
        await chatService.sendMessage(userInfo.value.userId, realUrl, 3, realUrl);
        const index = messages.value.findIndex(m => m.id === msgId);
        if (index > -1) {
          messages.value[index].status = 'sent';
        }
      }
      catch (error) {
        const index = messages.value.findIndex(m => m.id === msgId);
        if (index > -1) {
          messages.value[index].status = 'failed';
        }
      }
    }
  };
  input.click();
  showAdd.value = false;
};
const previewVideo = (msg) => {
  previewVideoUrl.value = msg.content;
  showVideoPreview.value = true;
};
const selectLocation = () => {
  showLocationSelector.value = true;
  showAdd.value = false;
};
const onProvinceChange = () => {
  locationSearch.value = '';
  selectedCity.value = '';
  selectedDistrict.value = '';
  selectedTown.value = '';
  selectedStreet.value = '';
  if (selectedProvince.value) {
    cities.value = cityData[selectedProvince.value] || [];
  } else {
    cities.value = [];
  }
  districts.value = [];
  towns.value = [];
  streets.value = [];
};
const onCityChange = () => {
  locationSearch.value = '';
  selectedDistrict.value = '';
  selectedTown.value = '';
  selectedStreet.value = '';
  if (selectedCity.value && selectedProvince.value) {
    const city = cities.value.find(c => c.code === selectedCity.value);
    districts.value = city ? city.districts : [];
  } else {
    districts.value = [];
  }
  towns.value = [];
  streets.value = [];
};
// 选中区县后按需加载乡级数据（懒加载），按名称拆分：towns 用于乡镇下拉，streets 仅用于定位时自动填充街道输入框
const onDistrictChange = async (keepSearch = false) => {
  if (!keepSearch) locationSearch.value = '';
  selectedTown.value = '';
  selectedStreet.value = '';
  towns.value = [];
  streets.value = [];
  if (!selectedDistrict.value) return;
  try {
    const mod = await import('../data/china-streets');
    const names = (mod.streetData && mod.streetData[selectedDistrict.value]) || [];
    const townNames = [];
    const streetNames = [];
    for (const n of names) {
      if (n.endsWith('街道')) streetNames.push(n);
      else townNames.push(n);
    }
    towns.value = townNames.map((n, i) => ({ code: 't' + i, name: n }));
    streets.value = streetNames.map((n, i) => ({ code: 's' + i, name: n }));
  } catch (e) {
    // 乡级数据加载失败，不影响选择区县发送
    towns.value = [];
    streets.value = [];
  }
};
// 选择乡镇后保留街道输入（街道为自定义文本，可与乡镇并存作为详细地址补充）
const onTownChange = () => {
  locationSearch.value = '';
};
// 清洗逆地理编码返回的完整地址文本：按逗号拆分、去掉国家、省→街道正序、去重
const formatDisplayName = (raw) => {
  if (!raw) return '';
  let parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length && /^(中国|China)$/i.test(parts[parts.length - 1])) parts.pop();
  parts.reverse();
  const result = [];
  for (const p of parts) {
    if (!result.some((r) => r.includes(p) || p.includes(r))) result.push(p);
  }
  return result.join(' ');
};
const useCurrentLocation = () => {
  if (!navigator.geolocation) {
    toast.error('您的浏览器不支持定位');
    return;
  }
  toast.info('正在获取当前位置...');
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      // 带超时的 JSON 请求
      const fetchJson = async (url) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        try {
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return await res.json();
        } finally {
          clearTimeout(timer);
        }
      };
      // 依次尝试多个逆地理编码服务（国内高德/腾讯优先，需在 .env.local 配置 key），拿到中文地址
      const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || '';
      const QQMAP_KEY = import.meta.env.VITE_QQMAP_KEY || '';
      let addr = null;
      let display = '';
      const providers = [
        {
          name: 'amap',
          build: () => (AMAP_KEY ? `https://restapi.amap.com/v3/geocode/regeo?location=${longitude},${latitude}&key=${AMAP_KEY}&extensions=base` : ''),
          parse: (d) => {
            if (!d || d.status !== '1' || !d.regeocode) throw new Error('amap empty');
            const c = d.regeocode.addressComponent || {};
            return {
              addr: {
                province: c.province || '',
                city: c.city || c.province || '',
                district: c.district || '',
                township: c.township || '',
                road: (c.streetNumber && c.streetNumber.street) || ''
              },
              display: d.regeocode.formatted_address || ''
            };
          }
        },
        {
          name: 'qqmap',
          build: () => (QQMAP_KEY ? `https://apis.map.qq.com/ws/geocoder/v1/?location=${latitude},${longitude}&key=${QQMAP_KEY}` : ''),
          parse: (d) => {
            if (!d || d.status !== 0 || !d.result) throw new Error('qqmap empty');
            const c = d.result.address_component || {};
            return {
              addr: {
                province: c.province || '',
                city: c.city || c.province || '',
                district: c.district || '',
                township: c.street || '',
                road: ''
              },
              display: d.result.address || ''
            };
          }
        },
        {
          name: 'nominatim',
          build: () => `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh`,
          parse: (d) => ({ addr: d.address || {}, display: d.display_name || '' })
        },
        {
          name: 'bigdatacloud',
          build: () => `https://bigdatacloudapi.com/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`,
          parse: (d) => ({
            addr: {
              province: d.principalSubdivision || d.region || '',
              city: d.subregion || d.city || '',
              district: d.locality || d.city || ''
            },
            display: [d.locality, d.city, d.subregion, d.principalSubdivision].filter(Boolean).join(', ')
          })
        }
      ];
      for (const p of providers) {
        const url = p.build();
        if (!url) continue;
        try {
          const data = await fetchJson(url);
          const r = p.parse(data);
          addr = r.addr;
          display = r.display;
          break;
        } catch (e) {
          // 该服务失败，尝试下一个
        }
      }
      const provinceName = (addr && (addr.province || addr.state || addr.region)) || '';
      const cityName = (addr && (addr.city || addr.town || addr.county || addr.municipality)) || '';
      const districtName = (addr && (addr.suburb || addr.district || addr.city_district || addr.quarter || addr.neighbourhood)) || '';
      // 优先用服务返回的完整地址文本，否则手工拼接
      const fullAddress = formatDisplayName(display) || [districtName, cityName, provinceName].filter(Boolean).join(' ');
      if (!fullAddress) {
        // 全部逆编码服务都失败，最后才回退为坐标
        locationSearch.value = `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
        toast.info('逆地理编码服务不可用，已使用坐标，可手动修改地址');
        return;
      }
      // 在本地省市联动数据中匹配（匹配不上也不影响发送）
      const province = provinces.value.find(
        (p) =>
          p.name === provinceName ||
          p.name.replace('省', '').replace('市', '') === provinceName.replace('省', '').replace('市', '')
      );
      if (province) {
        selectedProvince.value = province.code;
        onProvinceChange();
        const city = (cityData[province.code] || []).find(
          (c) => c.name === cityName || c.name.includes(cityName) || cityName.includes(c.name)
        );
        if (city) {
          selectedCity.value = city.code;
          onCityChange();
          const district = (city.districts || []).find(
            (d) => d.name === districtName || d.name.includes(districtName) || districtName.includes(d.name)
          );
          if (district) {
            selectedDistrict.value = district.code;
            // 加载乡镇/街道后尝试匹配（township 来自高德/腾讯的乡镇或街道名）
            await onDistrictChange(true);
            const streetName = (addr && (addr.road || addr.township || addr.neighbourhood || addr.quarter)) || '';
            if (streetName) {
              const match = (list) => list.find(
                (s) => s.name === streetName || s.name.includes(streetName) || streetName.includes(s.name)
              );
              const inStreet = match(streets.value);
              const inTown = match(towns.value);
              if (inStreet) {
                // 街道为自由输入，填入匹配到的街道名（可再修改）
                selectedStreet.value = inStreet.name;
              } else if (inTown) {
                selectedTown.value = inTown.code;
              } else {
                // 匹配不到行政区划街道时，把逆地理编码的道路名作为默认值填入
                selectedStreet.value = streetName;
              }
            }
          }
        }
      }
      // 完整地址填入搜索框，可直接发送
      locationSearch.value = fullAddress;
      toast.success('已获取当前位置，可直接发送');
    },
    (error) => {
      let msg = '无法获取位置，请手动选择';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          msg = '定位权限被拒绝，请在浏览器地址栏/系统设置中开启定位权限';
          break;
        case error.POSITION_UNAVAILABLE:
          msg = '暂时无法获取您的位置，请手动选择';
          break;
        case error.TIMEOUT:
          msg = '定位超时，请重试或手动选择';
          break;
      }
      toast.error(msg);
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
  );
};
const sendLocation = async () => {
  const provinceName = provinces.value.find(p => p.code === selectedProvince.value)?.name || '';
  const cityName = cities.value.find(c => c.code === selectedCity.value)?.name || '';
  const districtName = districts.value.find(d => d.code === selectedDistrict.value)?.name || '';
  const townName = towns.value.find(t => t.code === selectedTown.value)?.name || '';
  const streetName = selectedStreet.value.trim() || '';
  const address = [provinceName, cityName, districtName, townName, streetName].filter(Boolean).join(' ');
  // 优先使用搜索框里的地址（定位/手动输入的详细地址），其次用省市区拼接
  const content = locationSearch.value.trim() || address;
  if (!content) {
    toast.error('请先使用当前位置或搜索地址');
    return;
  }
  const msgId = Date.now();
  const newMessage = {
    id: msgId,
    isOwn: true,
    type: 'location',
    title: '我的位置',
    content,
    showTime: messages.value.length === 0 ||
      (Date.now() - messages.value[messages.value.length - 1].createTime) > 300000,
    status: 'sending',
    createTime: Date.now()
  };
  messages.value.push(newMessage);
  scrollToBottom();
  showLocationSelector.value = false;
  try {
    // 位置消息走统一消息接口（type=4），content 承载地址文本
    await chatService.sendMessage(userInfo.value.userId, content, 4, '', 0);
    const index = messages.value.findIndex(m => m.id === msgId);
    if (index > -1) {
      messages.value[index].status = 'sent';
    }
  } catch (error) {
    const index = messages.value.findIndex(m => m.id === msgId);
    if (index > -1) {
      messages.value[index].status = 'failed';
    }
  }
};
const selectGift = () => {
  showGiftPanel.value = true;
  showAdd.value = false;
};
const selectRedPacket = () => {
  showRedPacketPanel.value = true;
  showAdd.value = false;
};
const handleSendRedPacket = (data) => {
  const { type, amount, count, message } = data;
  const msgId = Date.now();
  const newMessage = {
    id: msgId,
    isOwn: true,
    type: 'redpacket',
    redPacketType: type,
    amount: amount,
    count: count,
    message: message,
    showTime: messages.value.length === 0 ||
      (Date.now() - messages.value[messages.value.length - 1].createTime) > 300000,
    status: 'sending',
    createTime: Date.now()
  };
  messages.value.push(newMessage);
  scrollToBottom();
  // 红包已在面板内经 /api/gift/redpacket/send 提交，服务端已扣款，这里不再本地扣减，改为同步余额
  userStore.fetchUserInfo().catch(() => {});
  setTimeout(() => {
    const index = messages.value.findIndex(m => m.id === msgId);
    if (index > -1) {
      messages.value[index].status = 'sent';
    }
  }, 500);
};
const giftEffect = ref(null);
const isVideoUrl = (url) => /\.mp4(\?|$)/i.test(url || '');
const triggerGiftEffect = (gift, count) => {
  giftEffect.value = { icon: gift.icon, name: gift.name, count, animation: gift.animation || gift.giftAnimation || '' };
  setTimeout(() => {
    giftEffect.value = null;
  }, 3000);
};
const handleSendGift = async (data) => {
  const { gift, count, giftType = 0, animation = '' } = data;
  const msgId = Date.now();
  const newMessage = {
    id: msgId,
    isOwn: true,
    type: 'gift',
    icon: gift.icon,
    name: gift.name,
    count: count,
    giftType: giftType,
    showTime: messages.value.length === 0 ||
      (Date.now() - messages.value[messages.value.length - 1].createTime) > 300000,
    status: 'sending',
    createTime: Date.now()
  };
  messages.value.push(newMessage);
  scrollToBottom();
  try {
    // 调用后端赠送礼物（服务端扣款/分账），成功后同步余额
    await giftService.sendGift(userInfo.value.userId, gift.id, count);
    const index = messages.value.findIndex(m => m.id === msgId);
    if (index > -1) messages.value[index].status = 'sent';
    await userStore.fetchUserInfo().catch(() => {});
    if (Number(giftType) === 1 || animation) {
      triggerGiftEffect(gift, count);
    }
  } catch (error) {
    const index = messages.value.findIndex(m => m.id === msgId);
    if (index > -1) messages.value[index].status = 'failed';
    toast.error(error.message || '礼物发送失败');
  }
};
const makeCall = () => {
  const saved = localStorage.getItem('callSettings')
  const callSettings = saved ? JSON.parse(saved) : { voice: false, voicePrice: 0 }
  if (!callSettings.voice) {
    toast.info('对方已关闭语音通话功能')
    showAdd.value = false
    return
  }
  router.push(`/call/${userInfo.value.userId}/audio`);
  showAdd.value = false;
};
const makeVideoCall = () => {
  const saved = localStorage.getItem('callSettings')
  const callSettings = saved ? JSON.parse(saved) : { video: false, videoPrice: 0 }
  if (!callSettings.video) {
    toast.info('对方已关闭视频通话功能')
    showAdd.value = false
    return
  }
  router.push(`/call/${userInfo.value.userId}/video`);
  showAdd.value = false;
};
const previewImage = (msg) => {
 previewImageUrl.value = msg.content;
 showImagePreview.value = true;
};
const MESSAGE_TYPE_MAP = { 0: 'text', 1: 'audio', 2: 'image' }
const getMessageTypeName = (type) => MESSAGE_TYPE_MAP[type] || 'text'

const handleMessageClick = (msg) => {
 console.log('点击消息:', msg);
};
const showMessageMenu = (msg, event) => {
 selectedMessage.value = msg;
 contextMenuStyle.value = {
 left: `${event.clientX}px`,
 top: `${event.clientY}px`
 };
 showMessageContextMenu.value = true;
};
const revokeMessage = async (msg) => {
 showMessageContextMenu.value = false;
 if (await showConfirm('确定要撤回这条消息吗？')) {
 chatService.revokeMessage(msg.id);
 const index = messages.value.findIndex(m => m.id === msg.id);
 if (index > -1) {
 messages.value[index].content = '【消息已撤回】';
 messages.value[index].type = 'system';
 }
 }
};
const copyMessage = async (msg) => {
 if (msg.type === 'text') {
   try {
     await navigator.clipboard.writeText(msg.content)
     toast.success('已复制')
   } catch {
     toast.error('复制失败，请手动复制')
   }
 }
 showMessageContextMenu.value = false
}
const forwardMessage = (msg) => {
 selectedMessage.value = msg;
 showMessageContextMenu.value = false;
 showForwardPanel.value = true;
};
const confirmForward = (friend) => {
 if (selectedMessage.value) {
 const forwardedMsg = {
 ...selectedMessage.value,
 id: Date.now(),
 isOwn: true,
 status: 'sending',
 createTime: Date.now()
 };
 chatService.sendMessage(
 friend.id,
 selectedMessage.value.content,
 getMessageTypeCode(selectedMessage.value.type)
 ).then(() => {
 toast.success(`已转发给 ${friend.nickName}`);
 });
 }
 showForwardPanel.value = false;
};
const getMessageTypeCode = (type) => {
 const typeMap = {
 text: 0,
 image: 2,
 video: 3,
 audio: 1,
 location: 4,
 gift: 5,
 redpacket: 6
 };
 return typeMap[type] || 0;
};
const retrySend = (msg) => {
 const index = messages.value.findIndex(m => m.id === msg.id);
 if (index > -1) {
 messages.value[index].status = 'sending';
 }
 if (msg.type === 'text') {
 chatService.sendMessage(userInfo.value.userId, msg.content, 0).then(() => {
 const idx = messages.value.findIndex(m => m.id === msg.id);
 if (idx > -1) {
 messages.value[idx].status = 'sent';
 }
 }).catch(() => {
 const idx = messages.value.findIndex(m => m.id === msg.id);
 if (idx > -1) {
 messages.value[idx].status = 'failed';
 }
 });
 }
};
const handleScroll = () => {
};
const loadMessages = async () => {
 try {
   loadingMessages.value = true
 const response = await chatService.getMessages(userInfo.value.userId);
 if (response.data && response.data.length > 0) {
 messages.value = response.data.map(item => ({
 id: item.id,
 isOwn: item.fromId === myInfo.value.userId,
 type: getMessageTypeName(item.type),
 content: item.content,
 duration: item.duration || 0,
 showTime: true,
 status: item.isRead ? 'read' : 'sent',
 createTime: item.sendTime ? item.sendTime * 1000 : Date.now()
 }));
    } else {
      messages.value = []
    }
  }
  catch (error) {
    console.error('加载消息失败:', error)
    messages.value = []
    toast.error('消息加载失败，请稍后重试')
  } finally {
    loadingMessages.value = false
  }
};
const setupSocketListeners = () => {
 socketService.on('private_message', (data) => {
 if (data.fromId === userInfo.value.userId) {
 const newMessage = {
 id: data.id || Date.now(),
 isOwn: false,
 type: getMessageTypeName(data.type),
 content: data.content,
 duration: data.duration || 0,
 giftType: Number(data.giftType) || 0,
 icon: data.giftImage || data.icon || '',
 name: data.giftName || '',
 count: Number(data.giftCount) || 1,
 animation: data.giftAnimation || '',
 showTime: messages.value.length === 0 ||
 (Date.now() - messages.value[messages.value.length - 1].createTime) > 300000,
 createTime: data.sendTime ? data.sendTime * 1000 : Date.now()
 };
 messages.value.push(newMessage);
 scrollToBottom();
 if (Number(data.giftType) === 1 && (data.giftImage || data.giftAnimation)) {
   triggerGiftEffect({ icon: data.giftImage, name: data.giftName || '豪华礼物', animation: data.giftAnimation || '' }, data.giftCount || 1);
 }
 }
 });
 socketService.on('typing', (data) => {
 if (data.fromId === userInfo.value.userId) {
 typing.value = true;
 setTimeout(() => {
 typing.value = false;
 }, 2000);
 }
 });
 socketService.on('message_revoked', (data) => {
 if (data.fromId === userInfo.value.userId) {
 const index = messages.value.findIndex(m => m.id === data.messageId);
 if (index > -1) {
 messages.value[index].content = '【消息已撤回】';
 messages.value[index].type = 'system';
 }
 }
 });
};
onMounted(async () => {
 loadVipItems();
 const targetId = route.params.id;
 if (targetId && targetId !== 'kefu') {
 userInfo.value.userId = parseInt(targetId);
 }
 
 if (!localStorage.getItem(STORAGE_KEYS.TOKEN)) {
 router.replace('/login');
 return;
 }

 const userRes = await authService.getUserInfo();
 if (userRes?.code === 200 && userRes.data) {
   userStore.setUserInfo(userRes.data);
 }
 
 await loadMessages();
 scrollToBottom();
 setupSocketListeners();
});
onUnmounted(() => {
 if (recordTimer) {
 clearInterval(recordTimer);
 }
 if (typingTimer) {
 clearTimeout(typingTimer);
 }
});
</script>

<style scoped>
.chat-room {
  height: 100dvh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60px 20px 16px;
  background: white;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn, .more-btn {
  font-size: 24px;
  cursor: pointer;
  width: 40px;
  text-align: center;
}

.avatar-mini {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  overflow: hidden;
  margin-right: 10px;
  cursor: pointer;
}

.avatar-mini.avatar-frame {
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-mini.avatar-frame img {
  width: 30px;
  height: 30px;
  border-radius: 6px;
}

.badge-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-right: 8px;
  line-height: 1.4;
}

.badge-icon {
  font-size: 11px;
}

.avatar-wrap-frame {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-wrap-frame .avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
}

.avatar-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nickname {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  flex: 1;
  text-align: left;
}

.online-status {
  font-size: 12px;
  color: #4cd964;
  margin-right: 10px;
}

.messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.messages::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #999;
  font-size: 14px;
}

.empty-chat .empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.date-divider {
  text-align: center;
  margin: 8px 0;
}

.date-divider span {
  background: #ddd;
  color: #666;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.message {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.message.own {
  flex-direction: row-reverse;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}

.content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message.own .content {
  align-items: flex-end;
}

.time {
  font-size: 11px;
  color: #aaa;
  margin-bottom: 4px;
}

.bubble {
  padding: 10px 14px;
  border-radius: 16px;
  line-height: 1.5;
  word-break: break-word;
  position: relative;
}

.message.other .bubble {
  background: white;
  color: #333;
  border-top-left-radius: 4px;
}

.message.own .bubble {
  background: var(--gradient-primary);
  color: white;
  border-top-right-radius: 4px;
}

.system-text {
  font-size: 12px;
  color: #999;
  text-align: center;
}

.recalled-text {
  font-size: 12px;
  color: #999;
  font-style: italic;
}

.image-msg {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  object-fit: cover;
}

.audio-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
}

.audio-msg .icon {
  font-size: 18px;
}

.audio-msg .waveform {
  display: flex;
  align-items: center;
  gap: 2px;
}

.audio-msg .bar {
  width: 4px;
  height: 16px;
  background: currentColor;
  border-radius: 2px;
  animation: wave 0.5s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { height: 8px; }
  50% { height: 20px; }
}

.audio-msg .duration {
  font-size: 13px;
}

.status {
  margin-top: 4px;
}

.send-status {
  font-size: 11px;
  color: #999;
}

.send-status.failed {
  color: #ff4d4f;
  cursor: pointer;
}

.read-icon {
  color: var(--color-primary);
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #999;
  padding: 8px 0;
}

.typing-dots {
  display: flex;
  gap: 3px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: 0s; }
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.bottom-bar {
  display: flex;
  align-items: center;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0));
  background: white;
  border-top: 1px solid #eee;
  gap: 10px;
  position: sticky;
  bottom: 0;
  z-index: 20;
}

.voice-btn, .emoji-btn, .add-btn {
  font-size: 28px;
  cursor: pointer;
}

.input-wrapper {
  flex: 1;
}

.text-input {
  width: 100%;
  border: none;
  background: #f5f5f5;
  padding: 10px 14px;
  border-radius: 20px;
  font-size: 15px;
  outline: none;
}

.voice-input {
  width: 100%;
  padding: 10px;
  text-align: center;
  background: #f5f5f5;
  border-radius: 20px;
}

.record-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.record-indicator.recording {
  color: #ff4d4f;
}

.record-icon {
  font-size: 20px;
}

.record-text {
  font-size: 15px;
}

.record-time {
  font-size: 14px;
  font-weight: bold;
}

.emoji-panel, .add-panel {
  background: white;
  border-top: 1px solid #eee;
  max-height: 280px;
  overflow-y: auto;
}

.emoji-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
}

.emoji-tabs .tab {
  flex: 1;
  padding: 12px 0;
  text-align: center;
  font-size: 20px;
  cursor: pointer;
}

.emoji-tabs .tab.active {
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
}

.emoji-content {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 12px;
  padding: 16px;
}

.emoji-item {
  font-size: 28px;
  text-align: center;
  cursor: pointer;
}

.add-panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 20px;
}

.add-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.add-price {
  font-size: 11px;
  color: #e6a23c;
  font-weight: 500;
}

.more-menu {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 12px;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  padding: 10px 0;
  min-width: 200px;
  margin-bottom: 10px;
}

.more-menu .menu-item {
  padding: 14px 30px;
  text-align: center;
  font-size: 15px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s;
}

.more-menu .menu-item:hover {
  background-color: #f5f5f5;
}

.more-menu .menu-item.cancel {
  color: #999;
  border-top: 1px solid #f0f0f0;
}

.context-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  padding: 8px 0;
  min-width: 160px;
  z-index: 1000;
}

.context-item {
  padding: 10px 20px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s;
}

.context-item:hover {
  background-color: #f5f5f5;
}

.context-item.cancel {
  color: #999;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
}

.image-preview {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.image-preview img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}

.image-preview .close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  color: white;
  font-size: 28px;
  cursor: pointer;
}

.video-msg {
  position: relative;
  max-width: 200px;
  border-radius: 8px;
  overflow: hidden;
}

.video-thumbnail {
  width: 100%;
  height: auto;
  display: block;
}

.video-play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  padding: 8px;
}

.video-duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0,0,0,0.7);
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}

.video-preview {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.video-preview video {
  max-width: 90%;
  max-height: 90%;
}

.video-preview .close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  color: white;
  font-size: 28px;
  cursor: pointer;
}

.location-msg {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px;
  min-width: 170px;
}

.location-map {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}

.message.own .location-map {
  background: rgba(255, 255, 255, 0.2);
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.location-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
}

.location-address {
  font-size: 13px;
  line-height: 1.45;
  opacity: 0.85;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-all;
}

.gift-msg {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #ffd70022 0%, #ff8c0022 100%);
  border-radius: 12px;
}

.gift-msg-luxury {
  background: linear-gradient(135deg, #ffd70044 0%, #ff450044 100%);
  border: 1px solid rgba(255, 215, 0, 0.5);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.gift-msg-badge {
  font-size: 10px;
  color: #fff;
  background: linear-gradient(135deg, #ffd700, #ff9d00);
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: bold;
}

.gift-icon {
  font-size: 24px;
  line-height: 1;
}

.gift-icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
  flex-shrink: 0;
  vertical-align: middle;
}

.gift-content {
  font-size: 14px;
}

.gift-effect-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  overflow: hidden;
}

.gift-effect-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: effectPop 0.5s ease-out;
}

.effect-rays {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 260px;
  height: 260px;
  transform: translate(-50%, -50%);
  background: conic-gradient(from 0deg, rgba(255, 215, 0, 0.35) 0deg, transparent 20deg, rgba(255, 215, 0, 0.35) 40deg, transparent 60deg, rgba(255, 215, 0, 0.35) 80deg, transparent 100deg, rgba(255, 215, 0, 0.35) 120deg, transparent 140deg, rgba(255, 215, 0, 0.35) 160deg, transparent 180deg, rgba(255, 215, 0, 0.35) 200deg, transparent 220deg, rgba(255, 215, 0, 0.35) 240deg, transparent 260deg, rgba(255, 215, 0, 0.35) 280deg, transparent 300deg, rgba(255, 215, 0, 0.35) 320deg, transparent 340deg);
  border-radius: 50%;
  animation: raysSpin 3s linear infinite;
}

.effect-icon {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 90px;
  z-index: 2;
  animation: effectBounce 0.8s ease-in-out infinite;
  filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.8));
}

.effect-icon img {
  width: 120px;
  height: 120px;
  object-fit: contain;
}

.effect-icon .effect-video {
  width: 240px;
  height: 240px;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 0 40px rgba(255, 215, 0, 0.5);
}

.effect-title {
  z-index: 2;
  margin-top: 12px;
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  letter-spacing: 4px;
  text-shadow: 0 0 12px rgba(255, 215, 0, 0.8);
}

.effect-name {
  z-index: 2;
  margin-top: 8px;
  font-size: 22px;
  font-weight: bold;
  color: #fff;
}

.effect-count {
  z-index: 2;
  margin-top: 6px;
  font-size: 30px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 16px rgba(255, 215, 0, 0.8);
}

.effect-particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  bottom: 30%;
  font-size: 18px;
  animation: particleUp 2.4s ease-in infinite;
  opacity: 0;
}

@keyframes effectPop {
  0% { transform: scale(0.3); opacity: 0; }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes effectBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-14px); }
}

@keyframes raysSpin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes particleUp {
  0% { transform: translateY(0) scale(0.6); opacity: 0; }
  15% { opacity: 1; }
  100% { transform: translateY(-320px) scale(1.2); opacity: 0; }
}

.redpacket-msg {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #d62929 0%, #ff6b6b 100%);
  border-radius: 12px;
  min-width: 180px;
}

.redpacket-icon {
  font-size: 32px;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.redpacket-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.redpacket-title {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.redpacket-info {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.location-modal {
  width: 85%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 20px;
  color: #999;
  cursor: pointer;
}

.location-body {
  padding: 20px;
}

.location-search {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.location-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.picker-row {
  display: flex;
}

.location-select {
  flex: 1;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  background: white;
}

.current-location {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: var(--gradient-primary);
  color: white;
  border-radius: 8px;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  border-top: 1px solid #f0f0f0;
}

.modal-btn {
  flex: 1;
  padding: 16px;
  font-size: 16px;
  border: none;
  background: none;
  cursor: pointer;
}

.modal-btn.cancel {
  color: #999;
  border-right: 1px solid #f0f0f0;
}

.modal-btn.confirm {
  color: var(--color-primary);
  font-weight: 500;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.modal.location-modal-wrap {
  align-items: center;
}

.forward-modal {
  width: 85%;
  max-width: 400px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.forward-body {
  flex: 1;
  overflow-y: auto;
}

.forward-search {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.forward-search .search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 25px;
  font-size: 14px;
  box-sizing: border-box;
}

.forward-list {
  padding: 8px;
}

.forward-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.forward-item:hover {
  background: #f5f5f5;
}

.forward-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 14px;
  object-fit: cover;
}

.forward-info {
  flex: 1;
}

.forward-name {
  display: block;
  font-size: 15px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.forward-status {
  font-size: 12px;
  color: #52c41a;
}

.forward-status.offline {
  color: #999;
}

.confirm-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 24px 20px 16px;
  width: 280px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.confirm-dialog-body {
  font-size: 16px;
  color: #333;
  margin-bottom: 20px;
  line-height: 1.5;
}

.confirm-dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-dialog-actions button {
  flex: 1;
  padding: 10px 0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.confirm-dialog-actions button:active {
  opacity: 0.7;
}

.confirm-dialog-actions .cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.confirm-dialog-actions .confirm-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

/* PC 端与 /preferred 等 PageLayout 页面尺寸完全对齐：同宽居中、导航栏等高 */
@media (min-width: 768px) {
  .chat-room {
    max-width: var(--layout-max-width-pc, 650px);
    margin: 0 auto;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.06);
  }

  .header {
    height: 50px;
    padding: 0 20px;
  }
}

@media (min-width: 1024px) {
  .chat-room {
    max-width: var(--layout-max-width-pc-lg, 720px);
  }
}
</style>
