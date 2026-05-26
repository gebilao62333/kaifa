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

    <!-- 分享功能弹窗 -->
    <div class="modal-overlay" v-if="showShareModal" @click="showShareModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>分享邀请</h3>
          <span class="modal-close" @click="showShareModal = false">✕</span>
        </div>
        <div class="modal-body">
          <div class="share-qr-section">
            <div class="qr-code-container">
              <img :src="shareQRCode" alt="二维码" class="qr-code-image" referrerpolicy="no-referrer" crossorigin="anonymous" />
            </div>
            <p class="qr-tip">扫描二维码访问我的主页</p>
            <button class="save-qr-btn" @click="saveQRCode">💾 保存二维码</button>
          </div>
          <div class="share-link-section">
            <label class="share-link-label">邀请链接</label>
            <div class="share-link-row">
              <input 
                type="text" 
                :value="shareLink" 
                class="share-link-input"
                readonly
              />
              <button class="copy-btn" @click="copyShareLink">复制</button>
            </div>
          </div>
          <div class="share-tips">
            <p>💡 分享链接或二维码，邀请好友访问您的主页</p>
            <p>💡 好友通过您的链接注册，您将获得奖励</p>
          </div>
        </div>
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

const goShare = () => {
  showShareModal.value = true
  generateShareLink()
}

const generateShareLink = async () => {
  const userId = userInfo.value.userId
  shareLink.value = `${window.location.origin}/user/${userId}?invite=true`
  
  isGeneratingQR.value = true
  try {
    const response = await fetch(`${api}/share/qrcode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: shareLink.value,
        width: 200
      })
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

const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    alert('链接已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const saveQRCode = async () => {
  
  if (navigator.share) {
    navigator.share({
      title: '我的主页二维码',
      text: '扫描二维码访问我的主页',
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
    link.download = '二维码.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    alert('二维码已保存')
  } catch {
    window.open(shareQRCode.value, '_blank')
  }
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
  margin: 82px 12px 12px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0 20px;
  height: 70px;
  display: flex;
  align-items: center;
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

/* 分享弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.modal-close {
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

/* 分享功能样式 */
.share-qr-section {
  text-align: center;
  margin-bottom: 20px;
}

.qr-code-container {
  display: inline-block;
  padding: 16px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
}

.qr-code-image {
  width: 200px;
  height: 200px;
}

.qr-tip {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.save-qr-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 14px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.save-qr-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
.save-qr-btn:active {
  transform: scale(0.97);
}

.share-link-section {
  margin-bottom: 20px;
}

.share-link-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.share-link-row {
  display: flex;
  gap: 12px;
}

.share-link-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  background: #f9f9f9;
}

.share-link-input:focus {
  outline: none;
  border-color: #667eea;
}

.copy-btn {
  padding: 0 20px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.copy-btn:hover {
  opacity: 0.9;
}

.share-tips {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
}

.share-tips p {
  margin: 4px 0;
  font-size: 13px;
  color: #666;
}
</style>
