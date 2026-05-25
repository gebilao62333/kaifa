<template>
  <div class="chat-room">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <div class="avatar-mini avatar-frame" :style="avatarFrameStyle" @click="goUserProfile">
        <img :src="userInfo.avatar" alt="" />
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
      
      <div v-for="(msg, index) in messages" :key="msg.id" :class="['message', msg.isOwn ? 'own' : 'other']">
        <div class="avatar-wrap-frame" :class="[msg.isOwn ? 'own' : 'other']" :style="msg.isOwn ? {} : avatarFrameStyle">
          <img class="avatar" :src="msg.isOwn ? myInfo.avatar : userInfo.avatar" alt="" />
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
              <div class="gift-msg">
                <span class="gift-icon">{{ msg.icon }}</span>
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
          <div class="record-indicator" :class="{ recording: isRecording }">
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
              <select v-model="selectedDistrict" class="location-select">
                <option value="">请选择区县</option>
                <option v-for="d in districts" :key="d.code" :value="d.code">{{ d.name }}</option>
              </select>
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
    
    <RedPacketPanel 
      :visible="showRedPacketPanel" 
      :user-balance="userBalance"
      :receiver-id="userInfo.userId"
      @close="showRedPacketPanel = false"
      @send="handleSendRedPacket"
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
              <img :src="friend.avatar" class="forward-avatar" />
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
  </div>
</template>

<script setup>import { ref, nextTick, onMounted, onUnmounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '../store/user-info';
import chatService from '../services/chatService';
import socketService from '../services/socketService';
import authService from '../services/authService';
import GiftList from '../components/gift-list/gift-list.vue';
import RedPacketPanel from '../components/RedPacketPanel.vue';
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const selectedBadge = ref(null);
const avatarFrameStyle = ref({});

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
  } catch (e) {}
};

const userInfo = ref({
 userId: 1,
 nickName: '小雪',
 avatar: '',
 isOnline: true
});
const myInfo = ref({
 userId: 100001,
 nickName: '我',
 avatar: '',
});
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
const showForwardPanel = ref(false);
const previewImageUrl = ref('');
const previewVideoUrl = ref('');
const selectedMessage = ref(null);
const contextMenuStyle = ref({});
const forwardSearch = ref('');
const forwardFriends = ref([
  { id: 2, nickName: '游戏达人', avatar: 'https://picsum.photos/100/100?random=1', isOnline: true },
  { id: 3, nickName: '小猫咪', avatar: 'https://picsum.photos/100/100?random=2', isOnline: true },
  { id: 4, nickName: '电竞王者', avatar: 'https://picsum.photos/100/100?random=3', isOnline: false },
  { id: 5, nickName: '午夜战神', avatar: 'https://picsum.photos/100/100?random=4', isOnline: true },
  { id: 6, nickName: '小甜心', avatar: 'https://picsum.photos/100/100?random=5', isOnline: false },
  { id: 7, nickName: '技术流', avatar: 'https://picsum.photos/100/100?random=6', isOnline: true },
]);
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
const provinces = ref([
 { code: '110000', name: '北京市' },
 { code: '310000', name: '上海市' },
 { code: '440000', name: '广东省' },
 { code: '330000', name: '浙江省' },
 { code: '320000', name: '江苏省' },
 { code: '420000', name: '湖北省' },
 { code: '430000', name: '湖南省' },
 { code: '510000', name: '四川省' }
]);
const cities = ref([]);
const districts = ref([]);
const cityData = {
 '110000': [{ code: '110100', name: '北京市', districts: ['东城区', '西城区', '朝阳区', '海淀区', '丰台区'] }],
 '310000': [{ code: '310100', name: '上海市', districts: ['黄浦区', '徐汇区', '长宁区', '静安区', '浦东新区'] }],
 '440000': [{ code: '440100', name: '广州市', districts: ['天河区', '越秀区', '海珠区', '白云区', '番禺区'] }, { code: '440300', name: '深圳市', districts: ['南山区', '福田区', '罗湖区', '宝安区', '龙华区'] }],
 '330000': [{ code: '330100', name: '杭州市', districts: ['西湖区', '拱墅区', '江干区', '滨江区', '余杭区'] }, { code: '330200', name: '宁波市', districts: ['海曙区', '江北区', '北仑区', '镇海区'] }],
 '320000': [{ code: '320100', name: '南京市', districts: ['玄武区', '秦淮区', '鼓楼区', '建邺区'] }, { code: '320500', name: '苏州市', districts: ['姑苏区', '虎丘区', '吴中区', '相城区'] }],
 '420000': [{ code: '420100', name: '武汉市', districts: ['江岸区', '江汉区', '硚口区', '汉阳区', '武昌区'] }],
 '430000': [{ code: '430100', name: '长沙市', districts: ['芙蓉区', '天心区', '岳麓区', '开福区', '雨花区'] }],
 '510000': [{ code: '510100', name: '成都市', districts: ['锦江区', '青羊区', '金牛区', '武侯区', '成华区'] }]
};
let recordTimer = null;
let typingTimer = null;

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
const blockUser = () => {
 if (confirm(`确定要拉黑 ${userInfo.value.nickName} 吗？`)) {
 alert('已拉黑该用户');
 showMoreMenu.value = false;
 router.back();
 }
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
const startRecord = () => {
 isRecording.value = true;
 recordDuration.value = '00:00';
 let seconds = 0;
 recordTimer = setInterval(() => {
 seconds++;
 const m = Math.floor(seconds / 60).toString().padStart(2, '0');
 const s = (seconds % 60).toString().padStart(2, '0');
 recordDuration.value = `${m}:${s}`;
 }, 1000);
};
const endRecord = () => {
 if (recordTimer) {
 clearInterval(recordTimer);
 recordTimer = null;
 }
 if (isRecording.value) {
 isRecording.value = false;
 const duration = Math.floor(parseInt(recordDuration.value.split(':')[0]) * 60 + parseInt(recordDuration.value.split(':')[1]));
 if (duration > 0) {
 sendAudio(duration);
 }
 }
 recordDuration.value = '';
};
const sendAudio = async (duration) => {
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
 await chatService.sendMessage(userInfo.value.userId, '', 1, '', duration);
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
 const reader = new FileReader();
 reader.onload = async (event) => {
 const imageUrl = event.target.result;
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
 await chatService.sendMessage(userInfo.value.userId, imageUrl, 2, imageUrl);
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
 };
 reader.readAsDataURL(file);
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
      const reader = new FileReader();
      reader.onload = async (event) => {
        const videoUrl = event.target.result;
        const msgId = Date.now();
        const newMessage = {
          id: msgId,
          isOwn: true,
          type: 'video',
          content: videoUrl,
          thumbnail: `https://picsum.photos/200/150?random=${msgId}`,
          duration: '00:15',
          showTime: messages.value.length === 0 ||
            (Date.now() - messages.value[messages.value.length - 1].createTime) > 300000,
          status: 'sending',
          createTime: Date.now()
        };
        messages.value.push(newMessage);
        scrollToBottom();
        try {
          await chatService.sendMessage(userInfo.value.userId, videoUrl, 3, videoUrl);
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
      };
      reader.readAsDataURL(file);
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
  selectedCity.value = '';
  selectedDistrict.value = '';
  if (selectedProvince.value) {
    cities.value = cityData[selectedProvince.value] || [];
  } else {
    cities.value = [];
  }
  districts.value = [];
};
const onCityChange = () => {
  selectedDistrict.value = '';
  if (selectedCity.value && selectedProvince.value) {
    const city = cities.value.find(c => c.code === selectedCity.value);
    if (city) {
      districts.value = city.districts.map((d, i) => ({ code: i, name: d }));
    }
  } else {
    districts.value = [];
  }
};
const useCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      alert('已获取当前位置');
      selectedProvince.value = '440000';
      onProvinceChange();
      selectedCity.value = '440300';
      onCityChange();
    }, () => {
      alert('无法获取位置，请手动选择');
    });
  } else {
    alert('您的浏览器不支持定位');
  }
};
const sendLocation = () => {
  if (!selectedProvince.value || !selectedCity.value) {
    alert('请选择完整地址');
    return;
  }
  const provinceName = provinces.value.find(p => p.code === selectedProvince.value)?.name || '';
  const cityName = cities.value.find(c => c.code === selectedCity.value)?.name || '';
  const districtName = districts.value.find(d => d.code === selectedDistrict.value)?.name || '';
  const address = [provinceName, cityName, districtName].filter(Boolean).join(' ');
  const msgId = Date.now();
  const newMessage = {
    id: msgId,
    isOwn: true,
    type: 'location',
    title: '我的位置',
    content: address || locationSearch.value || '未知位置',
    showTime: messages.value.length === 0 ||
      (Date.now() - messages.value[messages.value.length - 1].createTime) > 300000,
    status: 'sending',
    createTime: Date.now()
  };
  messages.value.push(newMessage);
  scrollToBottom();
  showLocationSelector.value = false;
  setTimeout(() => {
    const index = messages.value.findIndex(m => m.id === msgId);
    if (index > -1) {
      messages.value[index].status = 'sent';
    }
  }, 500);
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
  userStore.setBalance(userStore.balance - amount);
  setTimeout(() => {
    const index = messages.value.findIndex(m => m.id === msgId);
    if (index > -1) {
      messages.value[index].status = 'sent';
    }
  }, 500);
};
const handleSendGift = (data) => {
  const { gift, count } = data;
  const msgId = Date.now();
  const newMessage = {
    id: msgId,
    isOwn: true,
    type: 'gift',
    icon: gift.icon,
    name: gift.name,
    count: count,
    showTime: messages.value.length === 0 ||
      (Date.now() - messages.value[messages.value.length - 1].createTime) > 300000,
    status: 'sending',
    createTime: Date.now()
  };
  messages.value.push(newMessage);
  scrollToBottom();
  userStore.setBalance(userStore.balance - gift.price * count);
  setTimeout(() => {
    const index = messages.value.findIndex(m => m.id === msgId);
    if (index > -1) {
      messages.value[index].status = 'sent';
    }
  }, 500);
};
const makeCall = () => {
  const saved = localStorage.getItem('callSettings')
  const callSettings = saved ? JSON.parse(saved) : { voice: true, voicePrice: 0 }
  if (!callSettings.voice) {
    alert('对方已关闭语音通话功能')
    showAdd.value = false
    return
  }
  router.push(`/call/${userInfo.value.userId}/audio`);
  showAdd.value = false;
};
const makeVideoCall = () => {
  const saved = localStorage.getItem('callSettings')
  const callSettings = saved ? JSON.parse(saved) : { video: true, videoPrice: 0 }
  if (!callSettings.video) {
    alert('对方已关闭视频通话功能')
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
const revokeMessage = (msg) => {
 if (confirm('确定要撤回这条消息吗？')) {
 chatService.revokeMessage(msg.id);
 const index = messages.value.findIndex(m => m.id === msg.id);
 if (index > -1) {
 messages.value[index].content = '【消息已撤回】';
 messages.value[index].type = 'system';
 }
 }
 showMessageContextMenu.value = false;
};
const copyMessage = (msg) => {
 if (msg.type === 'text') {
 navigator.clipboard.writeText(msg.content).then(() => {
 alert('已复制');
 });
 }
 showMessageContextMenu.value = false;
};
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
 alert(`已转发给 ${friend.nickName}`);
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
 const response = await chatService.getMessages(userInfo.value.userId);
 if (response.data && response.data.length > 0) {
 messages.value = response.data.map(item => ({
 id: item.id,
 isOwn: item.fromId === myInfo.value.userId,
 type: item.type === 0 ? 'text' : item.type === 1 ? 'audio' : item.type === 2 ? 'image' : 'text',
 content: item.content,
 duration: item.duration || 0,
 showTime: true,
 status: item.isRead ? 'read' : 'sent',
 createTime: item.sendTime ? item.sendTime * 1000 : Date.now()
 }));
 } else {
 const now = Date.now();
 messages.value = [
 { id: now - 50000, isOwn: true, type: 'text', content: '你好，在吗？', showTime: true, status: 'read', createTime: now - 50000 },
 { id: now - 40000, isOwn: false, type: 'text', content: '在的呢，有什么可以帮你的？', showTime: true, status: 'read', createTime: now - 40000 },
 { id: now - 30000, isOwn: true, type: 'text', content: '我想预约一下陪玩服务', showTime: true, status: 'read', createTime: now - 30000 },
 { id: now - 20000, isOwn: false, type: 'text', content: '好的，请问你想预约什么游戏呢？', showTime: true, status: 'read', createTime: now - 20000 }
 ];
 scrollToBottom();
 }
 }
 catch (error) {
 console.error('加载消息失败:', error);
 const now = Date.now();
 messages.value = [
 { id: now - 50000, isOwn: true, type: 'text', content: '你好，在吗？', showTime: true, status: 'read', createTime: now - 50000 },
 { id: now - 40000, isOwn: false, type: 'text', content: '在的呢，有什么可以帮你的？', showTime: true, status: 'read', createTime: now - 40000 }
 ];
 scrollToBottom();
 }
};
const setupSocketListeners = () => {
 socketService.on('private_message', (data) => {
 if (data.fromId === userInfo.value.userId) {
 const newMessage = {
 id: data.id || Date.now(),
 isOwn: false,
 type: data.type === 0 ? 'text' : data.type === 1 ? 'audio' : data.type === 2 ? 'image' : 'text',
 content: data.content,
 duration: data.duration || 0,
 showTime: messages.value.length === 0 ||
 (Date.now() - messages.value[messages.value.length - 1].createTime) > 300000,
 createTime: data.sendTime ? data.sendTime * 1000 : Date.now()
 };
 messages.value.push(newMessage);
 scrollToBottom();
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
 
 if (!localStorage.getItem('token')) {
 localStorage.setItem('token', 'mock-token-100001');
 }
 
 const userRes = await authService.getUserInfo();
 if (userRes.code === 200 && userRes.data) {
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
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 70px;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  color: #667eea;
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
  padding: 10px 16px;
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
  color: #667eea;
  border-bottom: 2px solid #667eea;
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
  gap: 10px;
  padding: 8px;
}

.location-map {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 150px;
}

.location-title {
  font-size: 13px;
  font-weight: 500;
}

.location-address {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gift-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #ffd70022 0%, #ff8c0022 100%);
  border-radius: 12px;
}

.gift-icon {
  font-size: 24px;
}

.gift-content {
  font-size: 14px;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  color: #667eea;
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
</style>
