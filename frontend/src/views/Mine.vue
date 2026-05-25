<template>
  <div class="mine-page">
    <div class="header">
      <div class="user-info">
        <div class="avatar-frame" :style="avatarFrameStyle">
          <img class="avatar" :src="userInfo.avatar" alt="头像" @click="goEditProfile" />
        </div>
        <div class="info">
          <div class="name-row">
            <span class="nickname">{{ userInfo.nickName }}</span>
            <span class="level-tag" v-if="userInfo.level">Lv.{{ userInfo.level }}</span>
            <span class="vip-tag" v-if="userInfo.vip">VIP{{ userInfo.vipLevel }}</span>
            <span class="badge-tag" v-if="selectedBadge" :style="selectedBadge.style">
              <span class="badge-icon">{{ selectedBadge.icon }}</span>
              {{ selectedBadge.label }}
            </span>
          </div>
          <span class="user-id">ID: {{ userInfo.userId }}</span>
        </div>
        <span class="edit-btn" @click="goEditProfile">
          <span class="edit-icon">✏️</span>
          资料编辑
        </span>
      </div>
    </div>

    <div class="content-container">
      <div class="stats-section">
        <div class="stat-item" @click="goFollows">
          <span class="stat-num">{{ userInfo.followCount }}</span>
          <span class="stat-label">关注</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item" @click="goFans">
          <span class="stat-num">{{ userInfo.fansCount }}</span>
          <span class="stat-label">粉丝</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item" @click="goLikes">
          <span class="stat-num">{{ userInfo.likeCount }}</span>
          <span class="stat-label">获赞</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item" @click="goVisitors">
          <span class="stat-num">{{ userInfo.visitorCount }}</span>
          <span class="stat-label">访客</span>
        </div>
      </div>

      <div class="menu-section">
        <div class="menu-grid">
          <div class="menu-item" @click="goWallet">
            <span class="menu-icon">💰</span>
            <span class="menu-text">我的余额</span>
            <span class="menu-arrow">›</span>
          </div>
          <div class="menu-item" @click="goMyOrder">
            <span class="menu-icon">📋</span>
            <span class="menu-text">我的订单</span>
            <span class="menu-arrow">›</span>
          </div>
          <div class="menu-item" @click="goMyService">
            <span class="menu-icon">⭐</span>
            <span class="menu-text">我的服务</span>
            <span class="menu-arrow">›</span>
          </div>
          <div class="menu-item" @click="goApplyCompanion">
            <span class="menu-icon">🎯</span>
            <span class="menu-text">申请服务</span>
            <span class="menu-arrow">›</span>
          </div>
          <div class="menu-item" @click="goMyPosts">
            <span class="menu-icon">📝</span>
            <span class="menu-text">我的动态</span>
            <span class="menu-arrow">›</span>
          </div>
          <div class="menu-item" @click="goMyAlbum">
            <span class="menu-icon">📷</span>
            <span class="menu-text">我的相册</span>
            <span class="menu-arrow">›</span>
          </div>
          <div class="menu-item" @click="goMyReserve">
            <span class="menu-icon">📅</span>
            <span class="menu-text">我的预约</span>
            <span class="menu-arrow">›</span>
          </div>
          <div class="menu-item" @click="goVip">
            <span class="menu-icon">👑</span>
            <span class="menu-text">VIP会员</span>
            <span class="vip-badge" v-if="!userInfo.vip">开通</span>
            <span class="menu-arrow">›</span>
          </div>
          <div class="menu-item" @click="goSettings">
            <span class="menu-icon">⚙️</span>
            <span class="menu-text">设置</span>
            <span class="menu-arrow">›</span>
          </div>
        </div>
      </div>

      <div class="service-section">
        <div class="service-item" @click="goCustomerService">
          <span class="service-icon">🎧</span>
          <div class="service-info">
            <div class="service-name">在线客服</div>
            <div class="service-desc">为您解答各类问题</div>
          </div>
          <span class="service-arrow">›</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user-info'

const router = useRouter()
const userStore = useUserStore()

const userInfo = computed(() => ({
  userId: userStore.profile?.userId || 100001,
  nickName: userStore.profile?.nickName || '多客用户',
  avatar: userStore.profile?.avatar || 'https://picsum.photos/200/200',
  level: userStore.profile?.level || 0,
  vip: userStore.profile?.vip || 0,
  vipLevel: userStore.profile?.vipLevel || 0,
  balance: userStore.profile?.balance || 0,
  followCount: userStore.profile?.followCount || 0,
  fansCount: userStore.profile?.fansCount || 0,
  likeCount: userStore.profile?.likeCount || 0,
  visitorCount: 0,
  todayIncome: 0,
  todayExpense: 0,
  totalWithdraw: 0
}))

const isCompanion = ref(false)
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

const formatBalance = (balance) => {
  return balance?.toFixed(2) || '0.00'
}

const goEditProfile = () => {
  console.log('编辑资料')
  router.push('/edit-profile')
}

const goFollows = () => {
  router.push('/follows')
}

const goFans = () => {
  router.push('/fans')
}

const goLikes = () => {
  router.push('/likes-records')
}

const goVisitors = () => {
  router.push('/visitors-records')
}

const goIncomeRecords = () => {
  router.push('/income-records')
}

const goExpenseRecords = () => {
  router.push('/expense-records')
}

const goWithdrawRecords = () => {
  router.push('/withdraw-records')
}

const goRecharge = () => {
  console.log('进入充值页面')
  router.push('/recharge')
}

const goWithdraw = () => {
  router.push('/withdraw')
}

const goWallet = () => {
  router.push('/wallet')
}

const goMyOrder = () => {
  console.log('查看我的订单')
  router.push('/my-order')
}

const goMyService = () => {
  console.log('查看我的服务')
  router.push('/my-services')
}

const goApplyCompanion = () => {
  console.log('申请服务')
  router.push('/companion-apply')
}

const goMyPosts = () => {
  router.push('/my-dynamic')
}

const goMyAlbum = () => {
  router.push('/my-album')
}

const goMyReserve = () => {
  router.push('/my-reserve')
}

const goVip = () => {
  console.log('查看VIP会员')
  router.push('/vip-center')
}

const goSettings = () => {
  router.push('/settings')
}

const goCustomerService = () => {
  router.push('/customer-service')
}

onMounted(() => {
  loadVipItems()
})
</script>

<style scoped>
.mine-page {
  min-height: calc(100vh - 80px);
  background-color: #f5f5f5;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.content-container {
  background: #fff;
  margin: 12px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 12px 20px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  object-fit: cover;
  cursor: pointer;
}

.avatar-frame {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  transition: all 0.3s;
}

.avatar-frame .avatar {
  width: 74px;
  height: 74px;
  border-radius: 8px;
  margin-right: 0;
  border: none;
}

.info {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.nickname {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.level-tag {
  background-color: rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
}

.vip-tag {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #fff;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
}

.badge-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  line-height: 1.4;
}

.badge-icon {
  font-size: 12px;
}

.user-id {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
}

.edit-btn {
  background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
  color: #667eea;
  font-size: 14px;
  font-weight: 500;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 20px;
  margin-right: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.edit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}

.edit-btn:active {
  transform: translateY(0);
}

.edit-icon {
  font-size: 16px;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  padding: 24px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  text-align: center;
  cursor: pointer;
}

.stat-num {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #999;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background-color: #f0f0f0;
}

.wallet-card {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 10px 0px;
  padding: 10px 0px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  height: 70px;
}

.wallet-icon {
  font-size: 40px;
}

.wallet-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wallet-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.wallet-balance {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
}

.wallet-unit {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.wallet-arrow {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.5);
}

.menu-section {
  padding: 0 16px;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
}

.menu-group {
  background-color: #fff;
  border-radius: 16px;
  margin-bottom: 16px;
  overflow: hidden;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.menu-title {
  padding: 16px 20px 12px;
  font-size: 15px;
  color: #333;
  font-weight: bold;
  border-bottom: 1px solid #f5f5f5;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  border-right: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
  min-height: 100px;
  gap: 8px;
}

.menu-item:nth-child(3n) {
  border-right: none;
}

.menu-item:nth-last-child(-n+3) {
  border-bottom: none;
}

.menu-item:last-child,
.menu-item:nth-last-child(-n+2) {
  border-bottom: none;
}

.menu-item:hover {
  background-color: #fafafa;
}

.menu-icon {
  font-size: 28px;
}

.menu-text {
  font-size: 14px;
  color: #333;
}

.menu-arrow {
  display: none;
}

.tag.new {
  background-color: #ff6b6b;
  color: #fff;
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 6px;
  margin-left: 8px;
}

.vip-badge {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #fff;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  margin-left: 8px;
}

.service-section {
  padding: 0 16px;
  padding-top: 16px;
}

.service-item {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-top: 1px solid #f0f0f0;
}

.service-item:active {
  background-color: #f9f9f9;
}

.service-icon {
  font-size: 28px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea15, #764ba215);
  border-radius: 12px;
  margin-right: 14px;
}

.service-info {
  flex: 1;
}

.service-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.service-desc {
  font-size: 13px;
  color: #999;
}

.service-arrow {
  font-size: 20px;
  color: #ccc;
}

/* PC端我的页面优化 */
@media (min-width: 768px) {
  .mine-page {
    padding-top: 60px;
    padding-left: 16px;
    padding-right: 16px;
    padding-bottom: 16px;
    max-width: 650px;
    margin: 0 auto;
  }
  
  .header {
    max-width: 620px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 0 0 16px 16px;
    padding: 12px 24px;
  }
  
  .content-container {
    margin: 0;
    margin-top: 12px;
  }
  
  .user-info {
    gap: 16px;
  }
  
  .avatar {
    width: 72px;
    height: 72px;
  }
  
  .avatar-frame {
    width: 72px;
    height: 72px;
  }
  
  .avatar-frame .avatar {
    width: 66px;
    height: 66px;
  }
  
  .nickname {
    font-size: 18px;
  }
  
  .edit-btn {
    margin-left: auto;
    margin-right: 0;
    padding: 8px 16px;
    font-size: 13px;
  }
  
  .stats-section {
    padding: 20px 0;
    gap: 16px;
  }
  
  .stat-num {
    font-size: 18px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .wallet-card {
    margin: 0;
    padding: 16px 20px;
    margin-top: 16px;
    height: auto;
    min-height: 70px;
  }
  
  .wallet-balance {
    font-size: 24px;
  }
  
  .menu-section {
    padding: 0 16px;
  }
  
  .menu-item {
    padding: 14px 8px;
    min-height: 90px;
  }
  
  .menu-icon {
    font-size: 26px;
  }
  
  .menu-text {
    font-size: 13px;
  }
  
  .service-section {
    padding: 0 16px;
    padding-top: 16px;
  }
  
  .service-item {
    padding: 14px 16px;
  }
}

@media (min-width: 1024px) {
  .mine-page {
    max-width: 720px;
  }
  
  .header {
    max-width: 720px;
  }
}
</style>
