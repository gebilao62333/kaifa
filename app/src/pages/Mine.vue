<template>
  <PageLayout>
    <template #nav>
      <view class="user-info">
        <view class="avatar-frame" :style="avatarFrameStyle">
          <image mode="aspectFill" class="avatar" :src="userInfo.avatar" alt="头像" @click="goEditProfile" />
        </view>
        <view class="info">
          <view class="name-row">
            <text class="nickname">{{ userInfo.nickName }}</text>
            <text class="level-tag" v-if="userInfo.level">Lv.{{ userInfo.level }}</text>
            <text class="vip-tag" v-if="userInfo.vip">VIP{{ userInfo.vipLevel }}</text>
            <text class="badge-tag" v-if="selectedBadge" :style="selectedBadge.style">
              <text class="badge-icon">{{ selectedBadge.icon }}</text>
              {{ selectedBadge.label }}
            </text>
          </view>
          <text class="user-id">ID: {{ userInfo.userId }}</text>
        </view>
        <text class="edit-btn" @click="goEditProfile">
          <text class="edit-icon">✏️</text>
          资料编辑
        </text>
      </view>
    </template>

    <view class="content-container">
      <view class="stats-section">
        <view class="stat-item" @click="goFollows">
          <text class="stat-num">{{ userInfo.followCount }}</text>
          <text class="stat-label">关注</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item" @click="goFans">
          <text class="stat-num">{{ userInfo.fansCount }}</text>
          <text class="stat-label">粉丝</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item" @click="goLikes">
          <text class="stat-num">{{ userInfo.likeCount }}</text>
          <text class="stat-label">获赞</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item" @click="goVisitors">
          <text class="stat-num">{{ userInfo.visitorCount }}</text>
          <text class="stat-label">访客</text>
        </view>
      </view>

      <view class="menu-section">
        <view class="menu-grid">
          <view class="menu-item" @click="goWallet">
            <text class="menu-icon">💰</text>
            <text class="menu-text">我的钱包</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goMyOrder">
            <text class="menu-icon">📋</text>
            <text class="menu-text">我的订单</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goMyDemand">
            <text class="menu-icon">📌</text>
            <text class="menu-text">我的需求</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goMyService">
            <text class="menu-icon">⭐</text>
            <text class="menu-text">我的服务</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goApplyCompanion">
            <text class="menu-icon">🎯</text>
            <text class="menu-text">申请服务</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goMyPosts">
            <text class="menu-icon">📝</text>
            <text class="menu-text">我的动态</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goMyAlbum">
            <text class="menu-icon">📷</text>
            <text class="menu-text">我的相册</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goMyReserve">
            <text class="menu-icon">📅</text>
            <text class="menu-text">我的预约</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goMyReports">
            <text class="menu-icon">🚨</text>
            <text class="menu-text">我的举报</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goVip">
            <text class="menu-icon">👑</text>
            <text class="menu-text">VIP会员</text>
            <text class="vip-badge" v-if="!userInfo.vip">开通</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goRecords">
            <text class="menu-icon">📚</text>
            <text class="menu-text">我的记录</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goAiChat">
            <text class="menu-icon">🤖</text>
            <text class="menu-text">AI陪聊</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goTagManager">
            <text class="menu-icon">🏷️</text>
            <text class="menu-text">标签管理</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goSettings">
            <text class="menu-icon">⚙️</text>
            <text class="menu-text">设置</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>
      </view>

      <view class="service-section">
        <view class="service-item" @click="goCustomerService">
          <text class="service-icon">🎧</text>
          <view class="service-info">
            <view class="service-name">在线客服</view>
            <view class="service-desc">为您解答各类问题</view>
          </view>
          <text class="service-arrow">›</text>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onHide, onPageScroll, onShow, onUnload } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import {
  readScrollTop,
  restoreScrollTop,
  restoreTabState,
  saveScrollTop,
  saveTabState,
  setTabStateOwner
} from '../common/tabState'
import PageLayout from '../components/PageLayout.vue'
import { useUserStore } from '../store/user-info'
import authService from '../services/authService'
import { DEFAULT_AVATAR } from '@/common/constants'

const router = useRouter()
const userStore = useUserStore()

const stats = ref({})

const userInfo = computed(() => ({
  userId: userStore.profile?.userId || 100001,
  nickName: userStore.profile?.nickName || '多客用户',
  avatar: userStore.profile?.avatar || DEFAULT_AVATAR,
  level: userStore.profile?.level || 0,
  vip: userStore.profile?.vip || 0,
  vipLevel: userStore.profile?.vipLevel || 0,
  balance: userStore.profile?.balance || 0,
  followCount: stats.value.followCount ?? userStore.profile?.followCount ?? 0,
  fansCount: stats.value.fansCount ?? userStore.profile?.fansCount ?? 0,
  likeCount: stats.value.likeCount ?? userStore.profile?.likeCount ?? 0,
  visitorCount: stats.value.visitorCount ?? 0,
  todayIncome: 0,
  todayExpense: 0,
  totalWithdraw: 0
}))

const isCompanion = ref(false)
const selectedBadge = ref(null)
const avatarFrameStyle = ref({})

const TAB_STATE_PATH = '/mine'
const tabOwnerId = () => userStore.profile?.userId || ''

// 主 Tab 用 reLaunch 切页会重建本页：优先恢复上次离开时的统计/装扮，避免骨架屏 + 滚动归零。
// 快照超过 30s 视为过期，恢复后仍静默刷新一次统计（见 tabState.TAB_STATE_FRESH_MS）。
const tabRestore = restoreTabState(TAB_STATE_PATH, tabOwnerId(), (snapshot) => {
  if (snapshot.stats && typeof snapshot.stats === 'object') stats.value = snapshot.stats
  if (snapshot.selectedBadge) selectedBadge.value = snapshot.selectedBadge
  if (snapshot.avatarFrameStyle && typeof snapshot.avatarFrameStyle === 'object') {
    avatarFrameStyle.value = snapshot.avatarFrameStyle
  }
  if (typeof snapshot.isCompanion === 'boolean') isCompanion.value = snapshot.isCompanion
})
const restoredScrollTop = tabRestore.restored ? readScrollTop(TAB_STATE_PATH) : 0
let pageScrollTop = restoredScrollTop
onPageScroll(({ scrollTop }) => {
  pageScrollTop = Number(scrollTop) || 0
})

// onHide 在 reLaunch 销毁前触发，onUnload 兜底；两者都触发时只保存一次
let tabStateSaved = false
const saveTabSnapshot = () => {
  if (tabStateSaved) return
  tabStateSaved = true
  saveTabState(TAB_STATE_PATH, {
    stats: stats.value,
    selectedBadge: selectedBadge.value,
    avatarFrameStyle: avatarFrameStyle.value,
    isCompanion: isCompanion.value
  })
  saveScrollTop(TAB_STATE_PATH, pageScrollTop)
}
onHide(saveTabSnapshot)
onUnload(saveTabSnapshot)

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
  if (import.meta.env.DEV) console.log('编辑资料')
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
  if (import.meta.env.DEV) console.log('进入充值页面')
  router.push('/recharge')
}

const goWithdraw = () => {
  router.push('/withdraw')
}

const goWallet = () => {
  router.push('/wallet')
}

const goMyOrder = () => {
  if (import.meta.env.DEV) console.log('查看我的订单')
  router.push('/my-order')
}

// P1-12：发布需求后的管理入口（列表/详情/取消）
const goMyDemand = () => {
  router.push('/my-demand')
}

const goMyService = () => {
  if (import.meta.env.DEV) console.log('查看我的服务')
  router.push('/my-services')
}

const goApplyCompanion = () => {
  if (import.meta.env.DEV) console.log('申请服务')
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

const goMyReports = () => {
  router.push('/my-reports')
}

const goVip = () => {
  if (import.meta.env.DEV) console.log('查看VIP会员')
  router.push('/vip-center')
}

const goRecords = () => {
  router.push('/records-center')
}

const goAiChat = () => {
  router.push('/ai-chat')
}

const goTagManager = () => {
  router.push('/tag-manager')
}

const goSettings = () => {
  router.push('/settings')
}

const goCustomerService = () => {
  router.push('/customer-service')
}

const loadStats = async () => {
  try {
    const res = await authService.getUserStats()
    const data = res?.data || res || {}
    stats.value = {
      followCount: Number(data.followCount) || 0,
      fansCount: Number(data.fansCount) || 0,
      likeCount: Number(data.likeCount) || 0,
      visitorCount: Number(data.visitorCount) || 0
    }
  } catch (error) {
    console.error('加载个人统计失败:', error)
  }
}

// 返回个人中心时静默刷新统计与本地装扮（关注/粉丝等可能在其它页面变化）
const refreshOnShow = () => {
  loadVipItems()
  loadStats()
}

onMounted(() => {
  if (tabRestore.restored) {
    // 统计/装扮已由快照渲染，等挂载后再恢复滚动位置（restoreScrollTop 内部会补两次重试）
    restoreScrollTop(restoredScrollTop)
    // 快照统计为空对象（上次加载失败）时不锁死空态：仍静默拉一次
    if (tabRestore.needRefresh || !stats.value || Object.keys(stats.value).length === 0) refreshOnShow()
    return
  }
  loadVipItems()
  loadStats()
})
// 首次 onShow 由 onMounted 首载，后续 onShow（返回本页）才静默刷新
let __firstShow = true
onShow(() => {
  // 账号（含登出）变化时清空全部 Tab 缓存，避免跨账号恢复旧列表
  setTabStateOwner(tabOwnerId())
  tabStateSaved = false
  if (__firstShow) {
    __firstShow = false
    return
  }
  refreshOnShow()
})
</script>

<style scoped>
.content-container {
  background: #fff;
  margin: 12px 0 0;
  padding: 20px;
  border-radius: 0px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  color: var(--color-primary);
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
  background: var(--gradient-primary);
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
  margin-top: -12px;
  margin-bottom: -12px;
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

/* PC 端我的页面优化（居中由 PageLayout 统一处理） */
@media (min-width: 768px) {
  .content-container {
    padding: 20px 24px;
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
    padding: 0;
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
    padding: 0;
    padding-top: 16px;
  }

  .service-item {
    padding: 14px 16px;
  }
}

@media (min-width: 1024px) {
}
</style>
