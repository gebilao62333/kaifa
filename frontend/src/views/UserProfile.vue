<template>
  <div class="user-profile-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">用户资料</span>
      <span class="placeholder"></span>
    </div>

    <div class="cover-bg" :style="{ backgroundImage: `url(${user.bgImage})` }">
      <div class="user-info-top">
        <div class="avatar-frame" :style="avatarFrameStyle">
          <img class="avatar" :src="user.avatar" alt="" />
        </div>
        <div class="info-right">
          <div class="name-row">
            <span class="name">{{ user.name }}</span>
            <span class="level" v-if="user.level">Lv.{{ user.level }}</span>
            <span class="vip-tag" v-if="user.vip">VIP</span>
            <span class="badge-tag" v-if="selectedBadge" :style="selectedBadge.style">
              <span class="badge-icon">{{ selectedBadge.icon }}</span>
              {{ selectedBadge.label }}
            </span>
          </div>
          <div class="signature">{{ user.signature }}</div>
          <div class="id">ID: {{ user.id }}</div>
        </div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <div class="num">{{ user.follows }}</div>
        <div class="label">关注</div>
      </div>
      <div class="divider"></div>
      <div class="stat-item">
        <div class="num">{{ user.fans }}</div>
        <div class="label">粉丝</div>
      </div>
      <div class="divider"></div>
      <div class="stat-item">
        <div class="num">{{ user.likes }}</div>
        <div class="label">获赞</div>
      </div>
    </div>

    <div class="content">
      <div class="action-bar">
        <button class="follow-btn" :class="{ followed: isFollowed }" @click="toggleFollow">
          {{ isFollowed ? '已关注' : '+ 关注' }}
        </button>
        <button class="chat-btn" @click="goChat">💬 私信</button>
      </div>

      <div class="section">
        <div class="section-title">基本信息</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="key">性别</span>
            <span class="value">{{ user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '保密' }}</span>
          </div>
          <div class="info-item">
            <span class="key">年龄</span>
            <span class="value">{{ user.age }}岁</span>
          </div>
          <div class="info-item">
            <span class="key">身高</span>
            <span class="value">{{ user.height }}cm</span>
          </div>
          <div class="info-item">
            <span class="key">地区</span>
            <span class="value">{{ user.region }}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">服务状态</div>
        <div class="service-status">
          <div class="service-item" :class="{ active: user.onlineService }">
            <span class="service-icon">💻</span>
            <span class="service-name">线上服务</span>
            <span class="service-badge">{{ user.onlineService ? '已开通' : '未开通' }}</span>
          </div>
          <div class="service-item" :class="{ active: user.offlineService }">
            <span class="service-icon">📍</span>
            <span class="service-name">线下服务</span>
            <span class="service-badge">{{ user.offlineService ? '已开通' : '未开通' }}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">兴趣爱好</div>
        <div class="tags-list">
          <span class="tag" v-for="(tag, i) in user.tags" :key="i">{{ tag }}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">擅长游戏</div>
        <div class="game-list">
          <div class="game-card" v-for="(game, i) in user.games" :key="i">
            <div class="game-name">{{ game.name }}</div>
            <div class="game-level">{{ game.level }}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">相册</div>
        <div class="photo-grid">
          <img class="photo" v-for="(photo, i) in user.photos" :key="i" :src="photo" alt="" @click="viewPhoto(photo, i)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const selectedBadge = ref(null)
const avatarFrameStyle = ref({})

const loadVipItems = () => {
  try {
    const savedBadge = localStorage.getItem('selectedBadge')
    if (savedBadge) {
      selectedBadge.value = JSON.parse(savedBadge)
    }
    const savedFrame = localStorage.getItem('selectedAvatarFrame')
    if (savedFrame) {
      const frame = JSON.parse(savedFrame)
      avatarFrameStyle.value = frame.style || {}
    }
  } catch {}
}

const isFollowed = ref(false)

const mockUsers = {
  '10001': {
    id: '10001',
    avatar: 'https://picsum.photos/200/200',
    bgImage: 'https://picsum.photos/800/400',
    name: '游戏大神',
    level: 28,
    vip: true,
    signature: '专注王者荣耀，带你上王者',
    follows: 128,
    fans: 2560,
    likes: 12345,
    gender: 'male',
    age: 24,
    height: 178,
    region: '北京市朝阳区',
    onlineService: true,
    offlineService: false,
    tags: ['游戏达人', '技术流', '声音好听', '段位高'],
    games: [
      { name: '王者荣耀', level: '荣耀王者' },
      { name: '和平精英', level: '无敌战神' },
      { name: '英雄联盟', level: '大师' }
    ],
    photos: [
      'https://picsum.photos/200/200?random=1',
      'https://picsum.photos/200/200?random=2',
      'https://picsum.photos/200/200?random=3',
      'https://picsum.photos/200/200?random=4',
      'https://picsum.photos/200/200?random=5',
      'https://picsum.photos/200/200?random=6'
    ]
  },
  '10002': {
    id: '10002',
    avatar: 'https://picsum.photos/200/200?random=10',
    bgImage: 'https://picsum.photos/800/400?random=20',
    name: '小雪',
    level: 28,
    vip: true,
    signature: '热爱生活，热爱游戏~',
    follows: 89,
    fans: 1890,
    likes: 8765,
    gender: 'female',
    age: 22,
    height: 165,
    region: '上海市浦东新区',
    onlineService: true,
    offlineService: true,
    tags: ['萌妹子', '声音甜美', '技术流', '活泼可爱'],
    games: [
      { name: '王者荣耀', level: '王者' },
      { name: '和平精英', level: '王牌' }
    ],
    photos: [
      'https://picsum.photos/200/200?random=11',
      'https://picsum.photos/200/200?random=12',
      'https://picsum.photos/200/200?random=13'
    ]
  },
  '10003': {
    id: '10003',
    avatar: 'https://picsum.photos/200/200?random=20',
    bgImage: 'https://picsum.photos/800/400?random=30',
    name: '阿杰',
    level: 35,
    vip: true,
    signature: '新赛季更新了，感觉打野位又加强了！',
    follows: 256,
    fans: 3420,
    likes: 15678,
    gender: 'male',
    age: 26,
    height: 182,
    region: '广州市天河区',
    onlineService: true,
    offlineService: false,
    tags: ['职业选手', '意识流', '教学达人'],
    games: [
      { name: '英雄联盟', level: '王者' },
      { name: '王者荣耀', level: '荣耀王者' }
    ],
    photos: [
      'https://picsum.photos/200/200?random=21',
      'https://picsum.photos/200/200?random=22',
      'https://picsum.photos/200/200?random=23',
      'https://picsum.photos/200/200?random=24'
    ]
  }
}

const user = computed(() => {
  const userId = route.params.id || '10001'
  return mockUsers[userId] || mockUsers['10001']
})

const goBack = () => {
  router.back()
}

const toggleFollow = () => {
  isFollowed.value = !isFollowed.value
}

const goChat = () => {
  router.push({ name: 'ChatRoom', params: { id: user.value.id } })
}

onMounted(() => {
  loadVipItems()
})

const viewPhoto = (url, index) => {
  alert(`查看第 ${index + 1} 张图片：${url}`)
}
</script>

<style scoped>
.user-profile-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  padding-top: 82px;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: -webkit-linear-gradient(315deg, #667eea 0%, #764ba2 100%);
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 650px;
  z-index: 100;
}

.back-btn, .placeholder {
  width: 40px;
  font-size: 20px;
  color: white;
  cursor: pointer;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.cover-bg {
  height: 200px;
  background-size: cover;
  background-position: center;
  position: relative;
  max-width: 650px;
  margin: 0 auto;
}

.user-info-top {
  position: absolute;
  bottom: -40px;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-end;
  padding: 0 20px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 10px;
  object-fit: cover;
}

.avatar-frame {
  width: 100px;
  height: 100px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-frame .avatar {
  width: 92px;
  height: 92px;
  border-radius: 8px;
  border: none;
}

.badge-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  line-height: 1.4;
}

.badge-icon {
  font-size: 11px;
}

.info-right {
  margin-left: 16px;
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.name {
  font-size: 20px;
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.level {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
}

.vip-tag {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: bold;
}

.signature {
  font-size: 13px;
  color: rgba(255,255,255,0.9);
  margin-bottom: 4px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.id {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
}

.stats-row {
  display: flex;
  background: white;
  padding: 20px;
  padding-top: 50px;
  gap: 10px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-item .num {
  font-size: 22px;
  font-weight: bold;
  color: #333;
}

.stat-item .label {
  font-size: 13px;
  color: #999;
}

.divider {
  width: 1px;
  background: #f0f0f0;
}

.content {
  padding: 12px;
}

.action-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.action-bar button {
  flex: 1;
  padding: 12px;
  border-radius: 24px;
  border: none;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.follow-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.follow-btn.followed {
  background: #f5f5f5;
  color: #999;
}

.chat-btn {
  background: white;
  color: #333;
  border: 1px solid #e5e5e5 !important;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .key {
  font-size: 12px;
  color: #999;
}

.info-item .value {
  font-size: 14px;
  color: #333;
}

.service-status {
  display: flex;
  gap: 12px;
}

.service-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f8f8f8;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.service-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-color: linear-gradient(135deg, #667eea, #764ba2);
}

.service-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.service-name {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.service-badge {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  background: #e5e5e5;
  color: #999;
}

.service-item.active .service-badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.service-item.active .service-name {
  color: #333;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tags-list .tag {
  padding: 6px 14px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 13px;
  border-radius: 16px;
}

.game-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.game-card {
  flex: 1;
  min-width: 100px;
  background: linear-gradient(135deg, #f093fb, #f5576c);
  padding: 12px;
  border-radius: 12px;
  text-align: center;
}

.game-name {
  font-size: 14px;
  color: white;
  font-weight: 500;
  margin-bottom: 4px;
}

.game-level {
  font-size: 11px;
  color: rgba(255,255,255,0.9);
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.photo {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
}
</style>
