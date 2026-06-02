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
        <button class="order-btn" @click="goOrder">📝 下单</button>
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
        <div class="section-title">开通的服务</div>
        <div class="service-list">
          <div class="service-card" v-for="(game, i) in user.games" :key="i">
            <div class="service-name">{{ game.name }}</div>
            <div class="service-level">{{ game.level }}</div>
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

    <ReserveModal v-model:visible="showReserveModal" :companion="user" @submit="handleReserveSubmit" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ReserveModal from '../components/ReserveModal.vue'
import gamesService from '../services/gamesService'

const router = useRouter()
const route = useRoute()

const showReserveModal = ref(false)
const loading = ref(false)
const error = ref(null)

const selectedBadge = ref(null)
const avatarFrameStyle = ref({})

const userData = ref(null)

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

const loadUserProfile = async (userId) => {
  loading.value = true
  error.value = null
  try {
    const result = await gamesService.getCompanionDetail(userId)
    if (result.code === 200 && result.data) {
      const data = result.data
      // 转换数据结构以适配页面
      userData.value = {
        id: data.userId,
        avatar: data.avatar,
        bgImage: 'https://picsum.photos/800/400?random=' + userId,
        name: data.nickName,
        level: data.level,
        vip: data.vip,
        signature: '陪玩师签名',
        follows: Math.floor(Math.random() * 300),
        fans: data.fansCount || 0,
        likes: Math.floor(Math.random() * 1000),
        gender: '未知',
        age: Math.floor(Math.random() * 10) + 18,
        height: Math.floor(Math.random() * 30) + 160,
        region: data.location || '未知地区',
        onlineService: data.onlineService,
        offlineService: data.offlineService,
        tags: data.tags || [],
        games: data.gameIds ? data.gameIds.map(id => ({ 
          name: '游戏' + id, 
          level: ['王者', '大师', '钻石', '黄金', '白银'][Math.floor(Math.random() * 5)]
        })) : [],
        photos: Array(6).fill(0).map((_, i) => `https://picsum.photos/200/200?random=${userId * 10 + i}`),
        price: data.price,
        game: null
      }
    }
  } catch (err) {
    console.error('加载用户资料失败:', err)
    error.value = '加载失败'
  } finally {
    loading.value = false
  }
}

const user = computed(() => {
  if (userData.value) return userData.value
  
  // 如果真实数据加载失败，使用简单的mock数据作为后备
  const userId = parseInt(route.params.id) || 10001
  return {
    id: userId,
    avatar: 'https://picsum.photos/200/200?random=' + userId,
    bgImage: 'https://picsum.photos/800/400?random=' + userId,
    name: '用户' + userId,
    level: Math.floor(Math.random() * 50) + 1,
    vip: Math.random() > 0.5,
    signature: '陪玩师签名',
    follows: Math.floor(Math.random() * 300),
    fans: Math.floor(Math.random() * 5000),
    likes: Math.floor(Math.random() * 10000),
    gender: '未知',
    age: Math.floor(Math.random() * 10) + 18,
    height: Math.floor(Math.random() * 30) + 160,
    region: '未知地区',
    onlineService: true,
    offlineService: false,
    tags: ['陪玩师'],
    games: [{ name: '王者荣耀', level: '王者' }],
    photos: Array(6).fill(0).map((_, i) => `https://picsum.photos/200/200?random=${userId * 10 + i}`),
    price: 50
  }
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

const goOrder = () => {
  showReserveModal.value = true
}

const handleReserveSubmit = (data, done) => {
  console.log('预约数据:', data)
  alert('预约成功！我们会尽快联系您。')
  done()
  showReserveModal.value = false
}

onMounted(async () => {
  loadVipItems()
  const userId = route.params.id
  if (userId) {
    await loadUserProfile(userId)
  }
})

const viewPhoto = (url, index) => {
  alert(`查看第 ${index + 1} 张图片：${url}`)
}
</script>

<style scoped>
.user-profile-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: var(--bg-secondary);
  padding-top: 70px;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 70px;
  background: var(--gradient-primary);
  background: -webkit-linear-gradient(315deg, #FF6B81 0%, #E64C65 100%);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  box-sizing: border-box;
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
  background: var(--bg-primary);
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
  color: var(--text-primary);
}

.stat-item .label {
  font-size: 13px;
  color: var(--text-muted);
}

.divider {
  width: 1px;
  background: var(--border-light);
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
  background: var(--gradient-primary);
  color: white;
}

.follow-btn.followed {
  background: var(--bg-secondary);
  color: var(--text-muted);
}

.chat-btn {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color) !important;
}

.order-btn {
  background: linear-gradient(135deg, #FF6B81 0%, #E64C65 100%);
  color: white;
}

.section {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
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
  color: var(--text-muted);
}

.info-item .value {
  font-size: 14px;
  color: var(--text-primary);
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
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.service-item.active {
  background: rgba(255, 107, 129, 0.1);
  border-color: var(--primary-color);
}

.service-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.service-name {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.service-badge {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  background: var(--border-light);
  color: var(--text-muted);
}

.service-item.active .service-badge {
  background: var(--gradient-primary);
  color: white;
}

.service-item.active .service-name {
  color: var(--text-primary);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tags-list .tag {
  padding: 6px 14px;
  background: var(--gradient-primary);
  color: white;
  font-size: 13px;
  border-radius: 16px;
}

.service-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.service-card {
  flex: 1;
  min-width: 100px;
  background: var(--gradient-primary);
  padding: 12px;
  border-radius: 12px;
  text-align: center;
}

.service-name {
  font-size: 14px;
  color: white;
  font-weight: 500;
  margin-bottom: 4px;
}

.service-level {
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

@media (min-width: 768px) {
  .user-profile-page {
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
  .user-profile-page {
    max-width: 720px;
  }
  .header {
    max-width: 720px;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
