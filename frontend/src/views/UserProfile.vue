<template>
  <PageLayout>
    <template #nav>
      <span class="back-btn" @click="goBack">←</span>
      <span class="nav-title">用户资料</span>
      <span class="placeholder"></span>
    </template>

    <div class="cover-bg" :style="{ backgroundImage: `url(${user.bgImage})` }">
      <div class="user-info-top">
        <div class="avatar-frame" :style="avatarFrameStyle">
          <img class="avatar" :src="user.avatar" alt="" v-img-fallback="user.name" />
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
        <button class="reserve-btn" @click="openReserve">📅 预约</button>
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
          <img class="photo" v-for="(photo, i) in user.photos" :key="i" :src="photo" alt="" v-img-fallback="user.name" @click="viewPhoto(photo, i)" />
        </div>
      </div>
    </div>

    <ReserveModal
      v-if="showReserve"
      :visible="showReserve"
      :companion="reserveCompanion"
      @close="showReserve = false"
      @submit="handleReserveSubmit"
    />
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { DEFAULT_AVATAR } from '@/common/constants'
import PageLayout from '../components/PageLayout.vue'
import ReserveModal from '../components/ReserveModal.vue'
import reserveService from '../services/reserveService'
import authService from '../services/authService'
import gamesService from '../services/gamesService'
import { toast } from '../composables/useToast'

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

const user = ref({
  id: '',
  avatar: DEFAULT_AVATAR,
  bgImage: '',
  name: '',
  level: 0,
  vip: false,
  signature: '',
  follows: 0,
  fans: 0,
  likes: 0,
  gender: '',
  age: null,
  height: null,
  region: '',
  onlineService: false,
  offlineService: false,
  tags: [],
  games: [],
  photos: []
})

const goBack = () => {
  router.back()
}

const toggleFollow = async () => {
  const uid = Number(user.value.id)
  if (!uid) return
  const next = !isFollowed.value
  try {
    if (next) await authService.follow(uid)
    else await authService.unfollow(uid)
    isFollowed.value = next
  } catch (e) {
    toast.error(e.message || '操作失败')
  }
}

const goChat = () => {
  router.push({ name: 'ChatRoom', params: { id: user.value.id } })
}

const showReserve = ref(false)

const reserveCompanion = computed(() => ({
  id: user.value.id,
  name: user.value.name,
  avatar: user.value.avatar,
  game: user.value.games?.[0]?.name || '',
  onlineService: user.value.onlineService === true,
  offlineService: !!user.value.offlineService,
  offlineLocation: user.value.region || ''
}))

const openReserve = () => {
  showReserve.value = true
}

// 后端仅接收 companionId/gameId/date/time，其余字段（时长、价格、线下地点）待接口扩展
const handleReserveSubmit = async (data, done) => {
  try {
    const res = await reserveService.createReserve({
      companionId: Number(data.companionId),
      gameId: Number(data.gameId) || 0,
      date: data.date,
      time: data.startTime,
      endTime: data.endTime,
      duration: data.duration,
      price: data.price,
      remark: data.remark,
      serviceType: data.serviceType,
      offlineLocation: data.offlineLocation
    })

    if (res?.code === 200 || res?.code === 201) {
      toast.success('预约成功，等待对方确认')
      showReserve.value = false
    } else {
      toast.error(res?.message || '预约失败')
    }
  } catch (err) {
    toast.error(err.message || '预约失败，请稍后重试')
  } finally {
    done?.()
  }
}

const loadUser = async () => {
  const id = Number(route.params.id)
  if (!id) return
  try {
    const res = await gamesService.getCompanionDetail(id)
    const d = res?.data || {}
    user.value = {
      ...user.value,
      id: d.userId || id,
      name: d.nickname || '',
      avatar: d.avatar || DEFAULT_AVATAR,
      level: d.level || 1,
      signature: d.signature || '',
      region: d.city || '',
      gender: d.gender === 1 ? 'male' : d.gender === 2 ? 'female' : 'unknown',
      age: d.age || null,
      fans: d.fansCount || 0,
      tags: Array.isArray(d.tags) ? d.tags : [],
      onlineService: !!d.gameId,
      offlineService: !!d.offlineService
    }
  } catch (e) {
    // 回退到通用用户接口
    try {
      const res = await authService.getUserInfo(id)
      const d = res?.data?.user || res?.data || {}
      if (d && (d.userId || d.id)) {
        user.value = {
          ...user.value,
          id: d.userId || d.id,
          name: d.nickname || d.nickName || '',
          avatar: d.avatar || DEFAULT_AVATAR,
          level: d.level || d.lv || 1,
          signature: d.signature || d.dec || '',
          region: d.city || d.region || ''
        }
      }
    } catch (e2) { /* 静默 */ }
  }
  try {
    const fr = await authService.checkFollowStatus(id)
    const v = fr?.data?.isFollow ?? fr?.data?.isFollowed
    if (v !== undefined) isFollowed.value = !!v
  } catch (e) { /* 静默 */ }
}

onMounted(() => {
  loadVipItems()
  loadUser()
  // 记录一次主页访问（用于「访客记录」）
  const visitId = Number(route.params.id)
  if (visitId) authService.visitUser(visitId).catch(() => {})
})

const viewPhoto = (url, index) => {
  toast.info(`查看第 ${index + 1} 张图片：${url}`)
}
</script>

<style scoped>
.back-btn, .placeholder {
  width: 40px;
  font-size: 20px;
  color: white;
  cursor: pointer;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.cover-bg {
  height: 200px;
  background-size: cover;
  background-position: center;
  position: relative;
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
  background: var(--gradient-primary);
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

.reserve-btn {
  background: linear-gradient(135deg, #ff6b81, #ff8e53);
  color: #fff;
  border: none !important;
}

.reserve-btn:active {
  opacity: 0.85;
}

.section {
  background: white;
  border-radius: 0px;
  padding: 20px;
  margin: 12px 20px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  border-color: var(--gradient-primary);
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
  background: var(--gradient-primary);
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
  background: var(--gradient-primary);
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
