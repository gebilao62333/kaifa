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
            <span class="menu-text">我的钱包</span>
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
        <div class="service-item" @click="goShare">
          <span class="service-icon">🔗</span>
          <div class="service-info">
            <div class="service-name">分享邀请</div>
            <div class="service-desc">分享链接邀请好友</div>
          </div>
          <span class="service-arrow">›</span>
        </div>
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

    <!-- 分享邀请弹窗 -->
    <div class="modal-overlay" v-if="showShareModal" @click="showShareModal = false">
      <div class="share-modal" @click.stop>
        <!-- 头部 -->
        <div class="share-modal-header">
          <div class="share-modal-title">
            <span class="share-title-icon">📨</span>
            <h3>分享邀请</h3>
          </div>
          <p class="share-modal-subtitle">邀请好友加入，双方均可获得奖励</p>
          <span class="share-modal-close" @click="showShareModal = false">✕</span>
        </div>

        <!-- 内容区 -->
        <div class="share-modal-body">
          <!-- 邀请码卡片 -->
          <div class="share-card invite-code-card">
            <div class="share-card-header">
              <span class="share-card-icon">🎫</span>
              <span class="share-card-title">我的邀请码</span>
            </div>
            <div class="invite-code-box">
              <span v-for="(ch, idx) in inviteCode.split('')" :key="idx" class="invite-code-char">{{ ch }}</span>
            </div>
            <button class="share-btn-outline" @click="copyInviteCode">
              <span v-if="copiedType === 'code'">✅ 已复制</span>
              <span v-else>📋 复制邀请码</span>
            </button>
          </div>

          <!-- 二维码卡片 -->
          <div class="share-card qr-card">
            <div class="share-card-header">
              <span class="share-card-icon">📱</span>
              <span class="share-card-title">邀请二维码</span>
            </div>
            <div class="qr-wrapper">
              <div class="qr-loading" v-if="isGeneratingQR">
                <span class="qr-spinner"></span>
                <span>生成中...</span>
              </div>
              <img 
                v-else-if="shareQRCode" 
                :src="shareQRCode" 
                alt="邀请二维码" 
                class="qr-image" 
                referrerpolicy="no-referrer" 
                crossorigin="anonymous" 
              />
              <div class="qr-placeholder" v-else>
                <span>二维码加载失败</span>
              </div>
            </div>
            <button class="share-btn-outline" @click="saveQRCode">💾 保存二维码</button>
          </div>

          <!-- 邀请链接卡片 -->
          <div class="share-card link-card">
            <div class="share-card-header">
              <span class="share-card-icon">🔗</span>
              <span class="share-card-title">邀请链接</span>
            </div>
            <div class="link-input-row">
              <input 
                type="text" 
                :value="shareLink" 
                class="link-input"
                readonly
                @focus="$event.target.select()"
              />
              <button class="share-btn-primary" @click="copyShareLink">
                <span v-if="copiedType === 'link'">✅</span>
                <span v-else>复制</span>
              </button>
            </div>
          </div>

          <!-- 分享渠道 -->
          <div class="share-channels">
            <span class="channels-label">分享到</span>
            <div class="channels-row">
              <button class="channel-btn wechat-btn" @click="shareToWechat">
                <span class="channel-icon">💬</span>
                <span class="channel-name">微信</span>
              </button>
              <button class="channel-btn qq-btn" @click="shareToQQ">
                <span class="channel-icon">🐧</span>
                <span class="channel-name">QQ</span>
              </button>
              <button class="channel-btn copy-btn-channel" @click="shareToClipboard">
                <span class="channel-icon">📋</span>
                <span class="channel-name">复制链接</span>
              </button>
              <button class="channel-btn more-btn" @click="shareNative">
                <span class="channel-icon">⋯</span>
                <span class="channel-name">更多</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast 提示 -->
      <div class="share-toast" v-if="toastMsg" :class="{ 'toast-show': toastMsg }">
        {{ toastMsg }}
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user-info'
import { api } from '../common/config'

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

// 分享功能
const showShareModal = ref(false)
const shareLink = ref('')
const shareQRCode = ref('')
const isGeneratingQR = ref(false)
const inviteCode = ref('')
const toastMsg = ref('')
const copiedType = ref('')
let toastTimer = null

const showToast = (msg, type = '') => {
  toastMsg.value = msg
  if (type) {
    copiedType.value = type
    setTimeout(() => { copiedType.value = '' }, 2000)
  }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMsg.value = ''
  }, 2000)
}

const goShare = async () => {
  showShareModal.value = true
  copiedType.value = ''
  await fetchInviteCode()
  generateShareLink()
}

const fetchInviteCode = async () => {
  try {
    const response = await fetch(`${api}/share/invite-code?userId=${userInfo.value.userId}`)
    const data = await response.json()
    if (data.code === 200 && data.data) {
      inviteCode.value = data.data.inviteCode
      return
    }
  } catch (error) {
    console.error('获取邀请码失败:', error)
  }
  inviteCode.value = 'INV' + String(userInfo.value.userId).padStart(5, '0')
}

const generateShareLink = async () => {
  const userId = userInfo.value.userId
  const code = inviteCode.value || ''
  const params = new URLSearchParams()
  params.set('invite', 'true')
  if (code) params.set('inviteCode', code)
  shareLink.value = `${window.location.origin}/user/${userId}?${params.toString()}`
  
  isGeneratingQR.value = true
  shareQRCode.value = ''
  try {
    const response = await fetch(`${api}/share/qrcode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: shareLink.value, width: 200 })
    })
    
    const data = await response.json()
    if (data.code === 200 && data.data) {
      shareQRCode.value = data.data.base64
    } else {
      shareQRCode.value = `https://api.qrserver.com/v1/create-qrcode/?size=200x200&data=${encodeURIComponent(shareLink.value)}`
    }
  } catch (error) {
    console.error('生成二维码失败:', error)
    shareQRCode.value = `https://api.qrserver.com/v1/create-qrcode/?size=200x200&data=${encodeURIComponent(shareLink.value)}`
  } finally {
    isGeneratingQR.value = false
  }
}

const copyInviteCode = async () => {
  try {
    await navigator.clipboard.writeText(inviteCode.value)
    showToast('邀请码已复制', 'code')
  } catch (err) {
    showToast('复制失败，请手动复制')
  }
}

const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    showToast('链接已复制', 'link')
  } catch (err) {
    showToast('复制失败，请手动复制')
  }
}

const shareToWechat = () => {
  copyShareLink()
  showToast('链接已复制，请打开微信粘贴发送')
}

const shareToQQ = () => {
  copyShareLink()
  showToast('链接已复制，请打开QQ粘贴发送')
}

const shareToClipboard = () => {
  const text = `🎮 快来加入我吧！\n我的邀请码：${inviteCode.value}\n邀请链接：${shareLink.value}`
  try {
    navigator.clipboard.writeText(text).then(() => {
      showToast('邀请信息已复制')
    })
  } catch {
    copyShareLink()
  }
}

const shareNative = () => {
  if (navigator.share) {
    navigator.share({
      title: '邀请你加入',
      text: `快来加入我吧！我的邀请码：${inviteCode.value}`,
      url: shareLink.value
    }).catch(() => {})
  } else {
    copyShareLink()
  }
}

const saveQRCode = async () => {
  if (!shareQRCode.value) {
    showToast('二维码尚未生成')
    return
  }

  if (navigator.share) {
    navigator.share({
      title: '我的邀请二维码',
      text: `邀请码：${inviteCode.value}`,
      url: shareLink.value
    }).catch(() => {})
    return
  }

  try {
    const response = await fetch(shareQRCode.value)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '邀请二维码.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast('二维码已保存')
  } catch {
    window.open(shareQRCode.value, '_blank')
  }
}

onMounted(() => {
  loadVipItems()
})
</script>

<style scoped>
/* --- 页面容器 --- */
.mine-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  padding-top: 80px;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

/* --- 内容卡片 --- */
.content-container {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 100%;
  padding: 0 12px;
  box-sizing: border-box;
}

/* --- 头部 --- */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0 20px;
  height: 80px;
  display: flex;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  box-sizing: border-box;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 60px;
  height: 60px;
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
  border-radius: 10px;
}

.vip-tag {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #fff;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
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
  height: 30px;
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
  margin-top: 24px;
  margin-bottom: 24px;
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
  border-radius: 10px;
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
  margin-top: 0;
  margin-bottom: 0;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 0;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
}

.menu-group {
  background-color: #fff;
  border-radius: 10px;
  margin-bottom: 0;
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
  padding: 12px 4px;
  border-right: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
  height: 88px;
  gap: 6px;
  box-sizing: border-box;
}

.menu-item:nth-child(3n) {
  border-right: none;
}

.menu-item:nth-last-child(-n+3) {
  border-bottom: none;
}

.menu-item:hover {
  background-color: #fafafa;
}

.menu-icon {
  font-size: 24px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.menu-text {
  font-size: 12px;
  color: #333;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
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
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 8px;
  margin-left: 0;
  margin-top: 2px;
  white-space: nowrap;
}

.service-section {
  padding: 0 16px;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.service-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  min-height: 56px;
  box-sizing: border-box;
}

.service-item:active {
  background-color: #f9f9f9;
}

.service-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea15, #764ba215);
  border-radius: 10px;
  margin-right: 12px;
  flex-shrink: 0;
}

.service-info {
  flex: 1;
}

.service-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.service-desc {
  font-size: 12px;
  color: #999;
}

.service-arrow {
  font-size: 18px;
  color: #ccc;
  flex-shrink: 0;
  margin-left: 8px;
}

/* PC 端我的页面优化 */
@media (min-width: 768px) {
  .mine-page {
    max-width: 650px;
    margin: 0 auto;
  }
  
  .header {
    left: 50%;
    transform: translateX(-50%);
    max-width: 650px;
  }
  
  .content-container {
    width: 100%;
    max-width: 100%;
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

/* ===== 分享弹窗样式 ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.share-modal {
  background: #fff;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* 头部 */
.share-modal-header {
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px 20px 20px;
  border-radius: 20px 20px 0 0;
  text-align: center;
  z-index: 1;
}

.share-modal-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 6px;
}

.share-title-icon {
  font-size: 24px;
}

.share-modal-title h3 {
  margin: 0;
  font-size: 20px;
  color: #fff;
  font-weight: 700;
}

.share-modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.share-modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  line-height: 1;
}

.share-modal-close:hover {
  background: rgba(255, 255, 255, 0.35);
}

/* 内容区 */
.share-modal-body {
  padding: 16px 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 分享卡片 */
.share-card {
  background: #fafafa;
  border-radius: 14px;
  padding: 16px;
  border: 1px solid #f0f0f0;
}

.share-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.share-card-icon {
  font-size: 18px;
}

.share-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 邀请码 */
.invite-code-box {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 12px;
}

.invite-code-char {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 44px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  border-radius: 8px;
  letter-spacing: 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

/* 二维码 */
.qr-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 12px;
  border: 2px dashed #e0e0e0;
}

.qr-image {
  width: 180px;
  height: 180px;
  padding: 8px;
}

.qr-loading,
.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 13px;
}

.qr-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e0e0e0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 链接 */
.link-input-row {
  display: flex;
  gap: 10px;
}

.link-input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 13px;
  color: #555;
  background: #fff;
  transition: border-color 0.2s;
}

.link-input:focus {
  outline: none;
  border-color: #667eea;
}

/* 按钮 */
.share-btn-outline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  padding: 10px;
  border: 2px solid #667eea;
  background: transparent;
  color: #667eea;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.share-btn-outline:hover {
  background: #667eea;
  color: #fff;
}

.share-btn-outline:active {
  transform: scale(0.98);
}

.share-btn-primary {
  padding: 10px 20px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 64px;
}

.share-btn-primary:hover {
  opacity: 0.9;
}

.share-btn-primary:active {
  transform: scale(0.97);
}

/* 分享渠道 */
.share-channels {
  padding-top: 4px;
}

.channels-label {
  display: block;
  font-size: 13px;
  color: #999;
  margin-bottom: 10px;
  text-align: center;
}

.channels-row {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.channel-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 0;
  width: 72px;
  border: none;
  background: transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.channel-btn:hover {
  background: #f5f5f5;
}

.channel-btn:active {
  transform: scale(0.95);
}

.channel-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 14px;
}

.wechat-btn .channel-icon { background: #e8fce8; }
.qq-btn .channel-icon { background: #e8f0fe; }
.copy-btn-channel .channel-icon { background: #fef3e8; }
.more-btn .channel-icon { background: #f0f0f0; }

.channel-name {
  font-size: 11px;
  color: #666;
}

/* Toast */
.share-toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  padding: 10px 24px;
  border-radius: 24px;
  font-size: 14px;
  white-space: nowrap;
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
  z-index: 1001;
}

.share-toast.toast-show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* PC 适配 */
@media (min-width: 768px) {
  .modal-overlay {
    align-items: center;
  }

  .share-modal {
    border-radius: 20px;
    max-height: 85vh;
    animation: fadeIn 0.25s ease-out;
  }

  .share-modal-header {
    border-radius: 20px 20px 0 0;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .share-modal-body {
    padding: 20px 24px 32px;
  }
}
</style>
