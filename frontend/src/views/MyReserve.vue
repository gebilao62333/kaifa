<template>
  <div class="reserve-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">我的预约</span>
      <span class="placeholder"></span>
    </div>

    <div class="tabs">
      <div class="tab-item" :class="{ active: currentTab === 'pending' }" @click="currentTab = 'pending'">
        <span class="tab-label">待确认</span>
        <span class="tab-count" v-if="tabCounts.pending > 0">{{ tabCounts.pending }}</span>
      </div>
      <div class="tab-item" :class="{ active: currentTab === 'cancelled' }" @click="currentTab = 'cancelled'">
        <span class="tab-label">已取消</span>
        <span class="tab-count" v-if="tabCounts.cancelled > 0">{{ tabCounts.cancelled }}</span>
      </div>
    </div>

    <div class="content">
      <div class="order-list" v-if="filteredOrders.length > 0">
        <div class="order-card" v-for="order in filteredOrders" :key="order.id" @click="viewOrderDetail(order)">
          <div class="order-header">
            <div class="order-type" :style="{ background: getTypeColor(order.type) }">
              <span class="type-icon">{{ order.typeIcon }}</span>
              <span>{{ order.typeText }}</span>
            </div>
            <div class="order-status" :class="order.status">
              <span class="status-dot"></span>
              {{ order.statusText }}
            </div>
          </div>
          <div class="order-body">
            <img class="order-avatar" :src="order.avatar" alt="" />
            <div class="order-info">
              <div class="order-info-left">
                <div class="order-name">
                  {{ order.name }}
                  <span class="vip-badge" v-if="order.isVip">VIP</span>
                </div>
                <div class="order-game">
                  <span class="game-icon">{{ order.gameIcon }}</span>
                  <span>{{ order.gameName }}</span>
                </div>
                <div class="order-detail">
                  {{ order.date }} {{ order.time }} | {{ order.duration }}
                </div>
                <div class="order-price">
                  <span class="price-label">金额</span>
                  <span class="price-value">{{ order.price }} 金币</span>
                </div>
              </div>
              <div class="order-info-right">
                <div class="arrow-icon">›</div>
              </div>
            </div>
          </div>
          <div class="countdown" v-if="order.status === 'pending' && order.countdown && order.countdown > 0">
            <span class="countdown-icon">⏳</span>
            <span class="countdown-text">剩余 {{ formatCountdown(order.countdown) }} 自动取消</span>
          </div>
          <div class="order-footer" @click.stop>
            <div class="order-id">订单号：{{ order.id }}</div>
            <div class="order-actions">
              <template v-if="order.status === 'pending'">
                <button class="action-btn secondary" @click="openCancelModal(order)">取消</button>
                <button class="action-btn primary" @click="confirmOrder(order)">确认预约</button>
              </template>
              <template v-if="order.status === 'cancelled'">
                <button class="action-btn secondary" @click="contactUser(order)">联系</button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" v-else>
        <div class="empty-icon">📋</div>
        <div class="empty-text">暂无预约记录</div>
        <div class="empty-hint">快去预约陪玩师吧</div>
        <button class="empty-btn" @click="goHome">去首页</button>
      </div>
    </div>

    <div class="detail-overlay" v-if="showDetail && currentOrder" @click.self="closeDetail">
      <div class="detail-panel">
        <div class="detail-header">
          <button class="detail-back" @click="closeDetail">
            <span class="back-icon">←</span>
          </button>
          <span class="detail-title">预约详情</span>
          <button class="detail-close" @click="closeDetail">✕</button>
        </div>

        <div class="detail-body">
          <div class="status-banner" :class="currentOrder.status">
            <span class="status-banner-icon">{{ getStatusIcon(currentOrder.status) }}</span>
            <div class="status-banner-info">
              <div class="status-banner-title">{{ getStatusText(currentOrder.status) }}</div>
              <div class="status-banner-desc">{{ getStatusDesc(currentOrder.status) }}</div>
            </div>
          </div>

          <div class="detail-section">
            <div class="section-title">陪玩师信息</div>
            <div class="companion-card">
              <img class="companion-avatar" :src="currentOrder.avatar" alt="" />
              <div class="companion-info">
                <div class="companion-name">
                  {{ currentOrder.name }}
                  <span class="vip-badge" v-if="currentOrder.isVip">VIP</span>
                </div>
                <div class="companion-game">
                  <span class="game-icon">{{ currentOrder.gameIcon }}</span>
                  <span>{{ currentOrder.gameName }}</span>
                </div>
              </div>
              <button class="contact-btn" @click="contactUser(currentOrder)">联系</button>
            </div>
          </div>

          <div class="detail-section">
            <div class="section-title">预约信息</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">预约编号</span>
                <span class="info-value">{{ currentOrder.id }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">服务类型</span>
                <span class="info-value">
                  <span class="type-tag" :style="{ background: getTypeColor(currentOrder.type) }">
                    {{ currentOrder.typeIcon }} {{ currentOrder.typeText }}
                  </span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">预约日期</span>
                <span class="info-value">{{ currentOrder.date }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">预约时间</span>
                <span class="info-value">{{ currentOrder.time }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">服务时长</span>
                <span class="info-value">{{ currentOrder.duration }}</span>
              </div>
              <div class="info-item" v-if="currentOrder.location">
                <span class="info-label">服务地点</span>
                <span class="info-value location-value">{{ currentOrder.location }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">服务金额</span>
                <span class="info-value price-value">{{ currentOrder.price }} 金币</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间</span>
                <span class="info-value">{{ formatDateTime(currentOrder.createTime) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="section-title">进度跟踪</div>
            <div class="timeline">
              <div class="timeline-item" :class="{ active: true }">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-title">预约提交</div>
                  <div class="timeline-time">{{ formatDateTime(currentOrder.createTime) }}</div>
                </div>
              </div>
              <div class="timeline-item" :class="{ active: currentOrder.status !== 'pending' && currentOrder.status !== 'cancelled' }">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-title">预约确认</div>
                  <div class="timeline-time" v-if="currentOrder.status !== 'pending' && currentOrder.status !== 'cancelled'">{{ formatDateTime(currentOrder.createTime + 3600000) }}</div>
                  <div class="timeline-time muted" v-else>等待确认</div>
                </div>
              </div>
              <div class="timeline-item" :class="{ active: currentOrder.status === 'ongoing' || currentOrder.status === 'finished' }">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-title">服务进行中</div>
                  <div class="timeline-time" v-if="currentOrder.status === 'ongoing' || currentOrder.status === 'finished'">{{ formatDateTime(currentOrder.createTime + 7200000) }}</div>
                  <div class="timeline-time muted" v-else>未开始</div>
                </div>
              </div>
              <div class="timeline-item" :class="{ active: currentOrder.status === 'finished' }">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-title">服务完成</div>
                  <div class="timeline-time" v-if="currentOrder.status === 'finished'">{{ formatDateTime(currentOrder.createTime + 10800000) }}</div>
                  <div class="timeline-time muted" v-else>未完成</div>
                </div>
              </div>
              <div class="timeline-item cancel-node" :class="{ active: currentOrder.status === 'cancelled' }" v-if="currentOrder.status === 'cancelled'">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-title">预约已取消</div>
                  <div class="timeline-time">{{ formatDateTime(currentOrder.createTime + 3600000) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-footer" v-if="currentOrder.status !== 'cancelled'">
          <template v-if="currentOrder.status === 'pending'">
            <button class="footer-btn secondary" @click="handleDetailAction('cancel', currentOrder)">取消预约</button>
            <button class="footer-btn primary" @click="handleDetailAction('confirm', currentOrder)">确认预约</button>
          </template>
        </div>
      </div>
    </div>

    <div class="confirm-modal" v-if="showCancelModal" @click.self="showCancelModal = false">
      <div class="confirm-dialog">
        <div class="confirm-icon">⚠️</div>
        <div class="confirm-title">确认取消预约</div>
        <div class="confirm-message">
          取消预约后，该预约将无法恢复。确定要取消吗？
        </div>
        <div class="confirm-actions">
          <button class="confirm-btn secondary" @click="showCancelModal = false">再想想</button>
          <button class="confirm-btn danger" @click="confirmCancel">确认取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user-info'
import { toast } from '../composables/useToast'

const router = useRouter()
const userStore = useUserStore()

const currentTab = ref('pending')
const showDetail = ref(false)
const currentOrder = ref(null)
const showCancelModal = ref(false)
const cancelTarget = ref(null)

const defaultOrders = [
  { id: 'RS20240520001', companionUserId: 101, type: 'online', typeText: '线上陪玩', typeIcon: '💻', status: 'pending', statusText: '待确认', avatar: 'https://picsum.photos/100/100?random=101', name: '小明同学', isVip: true, gameName: '王者荣耀', gameIcon: '🎮', date: '2024-05-22', time: '14:00-16:00', duration: '2小时', durationHours: 2, location: '王者荣耀', price: 88, createTime: Date.now() - 7200000, countdown: 1800 },
  { id: 'RS20240520002', companionUserId: 102, type: 'offline', typeText: '线下陪玩', typeIcon: '🏠', status: 'confirmed', statusText: '已确认', avatar: 'https://picsum.photos/100/100?random=102', name: '游戏达人', isVip: false, gameName: '和平精英', gameIcon: '🔫', date: '2024-05-25', time: '18:00-20:00', duration: '2小时', durationHours: 2, location: '北京市朝阳区 XX 网咖', price: 288, createTime: Date.now() - 86400000, countdown: null },
  { id: 'RS20240520003', companionUserId: 103, type: 'online', typeText: '线上陪玩', typeIcon: '💻', status: 'ongoing', statusText: '进行中', avatar: 'https://picsum.photos/100/100?random=103', name: '绝地枪神', isVip: false, gameName: 'CS2', gameIcon: '🎯', date: '2024-05-21', time: '16:00-18:00', duration: '2小时', durationHours: 2, location: 'CS2', price: 96, createTime: Date.now() - 86400000, countdown: null },
  { id: 'RS20240520004', companionUserId: 104, type: 'online', typeText: '线上陪玩', typeIcon: '💻', status: 'pending', statusText: '待确认', avatar: 'https://picsum.photos/100/100?random=104', name: '王者大神', isVip: false, gameName: '英雄联盟', gameIcon: '⚔️', date: '2024-05-23', time: '19:00-21:00', duration: '2小时', durationHours: 2, location: '英雄联盟', price: 99, createTime: Date.now() - 3600000, countdown: 3600 },
  { id: 'RS20240520005', companionUserId: 105, type: 'online', typeText: '线上陪玩', typeIcon: '💻', status: 'finished', statusText: '已完成', avatar: 'https://picsum.photos/100/100?random=105', name: '吃鸡狂魔', isVip: true, gameName: '永劫无间', gameIcon: '🗡️', date: '2024-05-20', time: '15:00-17:00', duration: '2小时', durationHours: 2, location: '永劫无间', price: 120, createTime: Date.now() - 172800000, countdown: null },
  { id: 'RS20240520006', companionUserId: 106, type: 'offline', typeText: '线下陪玩', typeIcon: '🏠', status: 'cancelled', statusText: '已取消', avatar: 'https://picsum.photos/100/100?random=106', name: '剧本杀达人', isVip: false, gameName: '剧本杀', gameIcon: '🎭', date: '2024-05-22', time: '14:00-17:00', duration: '3小时', durationHours: 3, location: '上海市静安区 XX 剧本杀店', price: 256, createTime: Date.now() - 259200000, countdown: null },
  { id: 'RS20240520007', companionUserId: 107, type: 'online', typeText: '线上陪玩', typeIcon: '💻', status: 'finished', statusText: '已完成', avatar: 'https://picsum.photos/100/100?random=107', name: '声优陪玩', isVip: true, gameName: '原神', gameIcon: '✨', date: '2024-05-19', time: '20:00-22:30', duration: '2.5小时', durationHours: 2.5, location: '原神', price: 110, createTime: Date.now() - 259200000, countdown: null },
  { id: 'RS20240520008', companionUserId: 108, type: 'online', typeText: '线上陪玩', typeIcon: '💻', status: 'waiting', statusText: '待服务', avatar: 'https://picsum.photos/100/100?random=108', name: '云顶高手', isVip: true, gameName: '云顶之弈', gameIcon: '♟️', date: '2024-05-24', time: '21:00-23:00', duration: '2小时', durationHours: 2, location: '云顶之弈', price: 78, createTime: Date.now() - 5400000, countdown: null },
  { id: 'RS20240520009', companionUserId: 109, type: 'online', typeText: '线上陪玩', typeIcon: '💻', status: 'pending', statusText: '待确认', avatar: 'https://picsum.photos/100/100?random=109', name: '带飞大神', isVip: true, gameName: '王者荣耀', gameIcon: '🎮', date: '2024-05-27', time: '20:00-22:30', duration: '2.5小时', durationHours: 2.5, location: '王者荣耀', price: 110, createTime: Date.now() - 1800000, countdown: 5400 }
]

const loadOrders = () => {
  const saved = localStorage.getItem('reserveList')
  if (saved) {
    try { return JSON.parse(saved) }
    catch { return defaultOrders }
  }
  localStorage.setItem('reserveList', JSON.stringify(defaultOrders))
  return defaultOrders
}

const saveOrders = (list) => {
  localStorage.setItem('reserveList', JSON.stringify(list))
}

const orders = ref(loadOrders())

const tabCounts = computed(() => ({
  pending: orders.value.filter(o => o.status === 'pending').length,
  cancelled: orders.value.filter(o => o.status === 'cancelled').length
}))

const filteredOrders = computed(() => {
  return orders.value.filter(order => order.status === currentTab.value)
})

const getTypeColor = (type) => {
  return type === 'online'
    ? 'linear-gradient(135deg, #FF6B81, #E64C65)'
    : 'linear-gradient(135deg, #f093fb, #f5576c)'
}

const getStatusText = (status) => {
  const map = { pending: '待确认', waiting: '待服务', confirmed: '已确认', ongoing: '进行中', finished: '已完成', cancelled: '已取消' }
  return map[status] || status
}

const getStatusDesc = (status) => {
  const map = {
    pending: '请尽快确认预约，超时将自动取消',
    waiting: '预约已确认，等待服务开始',
    confirmed: '预约已确认，请按时参加',
    ongoing: '服务正在进行中',
    finished: '服务已顺利完成',
    cancelled: '预约已取消'
  }
  return map[status] || ''
}

const getStatusIcon = (status) => {
  const map = { pending: '⏳', waiting: '🕐', confirmed: '✅', ongoing: '🔄', finished: '🏁', cancelled: '❌' }
  return map[status] || '📋'
}

const formatDateTime = (ts) => {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const formatCountdown = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const goBack = () => router.back()
const goHome = () => router.push('/')

const findIndex = (order) => orders.value.findIndex(o => o.id === order.id)

const openCancelModal = (order) => {
  cancelTarget.value = order
  showCancelModal.value = true
}

const confirmCancel = () => {
  if (!cancelTarget.value) return
  const idx = findIndex(cancelTarget.value)
  if (idx > -1) {
    orders.value[idx].status = 'cancelled'
    orders.value[idx].statusText = '已取消'
    orders.value[idx].countdown = null
    saveOrders(orders.value)
  }
  showCancelModal.value = false
  cancelTarget.value = null
  toast.success('预约已取消')
}

const confirmOrder = async (order) => {
  if (!userStore.isLogin) {
    toast.warning('请先登录')
    return
  }
  const idx = findIndex(order)
  if (idx > -1) {
    orders.value[idx].status = 'waiting'
    orders.value[idx].statusText = '待服务'
    orders.value[idx].countdown = null
    saveOrders(orders.value)
    toast.success('预约已确认')
  }
}

const startService = (order) => {
  const idx = findIndex(order)
  if (idx > -1) {
    orders.value[idx].status = 'ongoing'
    orders.value[idx].statusText = '进行中'
    saveOrders(orders.value)
    toast.success('服务已开始')
  }
}

const finishService = (order) => {
  const idx = findIndex(order)
  if (idx > -1) {
    orders.value[idx].status = 'finished'
    orders.value[idx].statusText = '已完成'
    saveOrders(orders.value)
    toast.success('服务已完成')
  }
}

const contactUser = async (order) => {
  if (!userStore.isLogin) {
    toast.warning('请先登录')
    router.push('/login')
    return
  }
  const targetId = order.companionUserId
  if (!targetId) {
    toast.warning('无法获取陪玩师信息')
    return
  }
  router.push(`/chat-room/${targetId}`)
}

const viewOrderDetail = (order) => {
  currentOrder.value = order
  showDetail.value = true
}

const closeDetail = () => {
  showDetail.value = false
  currentOrder.value = null
}

const handleDetailAction = (action, order) => {
  if (action === 'cancel') openCancelModal(order)
  else if (action === 'confirm') confirmOrder(order)
  else if (action === 'start') startService(order)
  else if (action === 'finish') finishService(order)
  else if (action === 'contact') contactUser(order)
}

let countdownTimer = null

onMounted(() => {
  countdownTimer = setInterval(() => {
    orders.value.forEach(order => {
      if (order.status === 'pending' && order.countdown && order.countdown > 0) {
        order.countdown--
        if (order.countdown <= 0) {
          order.status = 'cancelled'
          order.statusText = '已取消'
          order.countdown = null
          saveOrders(orders.value)
        }
      }
    })
  }, 1000)
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped>
.reserve-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: var(--bg-secondary);
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
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
  background: var(--gradient-primary);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  box-sizing: border-box;
}

.back-btn,
.placeholder {
  width: 40px;
  font-size: 20px;
  color: white;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.tabs {
  display: flex;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab-item {
  flex-shrink: 0;
  padding: 12px 14px;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tab-item:active {
  background: var(--bg-secondary);
}

.tab-item.active {
  color: var(--primary-color);
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 3px;
  background: var(--gradient-primary);
  border-radius: 2px;
}

.tab-count {
  background: var(--primary-color);
  color: white;
  font-size: 10px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

.content {
  padding: 10px 12px;
  max-width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.order-card {
  background: var(--bg-primary);
  border-radius: 16px;
  margin-bottom: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-light);
  max-width: 100%;
  box-sizing: border-box;
}

.order-card:active {
  transform: scale(0.98);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
  min-height: 46px;
  flex-wrap: wrap;
  gap: 8px;
}

.order-type {
  padding: 4px 12px;
  color: white;
  font-size: 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.type-icon {
  font-size: 14px;
}

.order-status {
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.order-status.pending .status-dot {
  background: #ff9500;
}

.order-status.pending {
  color: #ff9500;
}

.order-status.waiting .status-dot {
  background: #5856d6;
}

.order-status.waiting {
  color: #5856d6;
}

.order-status.confirmed .status-dot {
  background: var(--primary-color);
}

.order-status.confirmed {
  color: var(--primary-color);
}

.order-status.ongoing .status-dot {
  background: #34c759;
  animation: pulse-dot 1.5s infinite;
}

.order-status.ongoing {
  color: #34c759;
}

.order-status.finished .status-dot {
  background: #8e8e93;
}

.order-status.finished {
  color: #8e8e93;
}

.order-status.cancelled .status-dot {
  background: #ff3b30;
}

.order-status.cancelled {
  color: #ff3b30;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.order-body {
  display: flex;
  padding: 16px;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
}

.order-avatar {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
}

.order-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.order-info-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.order-info-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  flex-shrink: 0;
}

.arrow-icon {
  font-size: 24px;
  color: var(--text-muted);
  font-weight: 300;
}

.order-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.vip-badge {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px;
}

.order-game {
  font-size: 13px;
  color: var(--primary-color);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.game-icon {
  font-size: 16px;
}

.order-detail {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.order-price {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.price-label {
  font-size: 13px;
  color: var(--text-muted);
}

.price-value {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color);
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid var(--border-light);
  min-height: 44px;
  flex-wrap: wrap;
  gap: 8px;
}

.order-id {
  font-size: 12px;
  color: var(--text-muted);
}

.order-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex: 1;
}

.action-btn {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.action-btn:active {
  transform: scale(0.95);
}

.action-btn.primary {
  background: var(--gradient-primary);
  color: white;
}

.action-btn.secondary {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.countdown {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  border-top: 1px solid #ffcc80;
}

.countdown-icon {
  font-size: 16px;
}

.countdown-text {
  font-size: 12px;
  color: #ff6b00;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-text {
  font-size: 16px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.empty-btn {
  padding: 12px 40px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  cursor: pointer;
}

.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  animation: overlayFadeIn 0.25s;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.detail-panel {
  width: 100%;
  max-width: 500px;
  max-height: 92vh;
  background: var(--bg-secondary);
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: panelSlideUp 0.3s ease-out;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}

@keyframes panelSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}

.detail-back {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-primary);
  cursor: pointer;
  padding: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.detail-close {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 16px 0;
}

.status-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  margin-bottom: 16px;
}

.status-banner.pending {
  background: linear-gradient(135deg, #fff8e1, #fff3e0);
  border: 1px solid #ffe0b2;
}

.status-banner.waiting {
  background: linear-gradient(135deg, #f3e8ff, #ede9fe);
  border: 1px solid #d8b4fe;
}

.status-banner.confirmed {
  background: linear-gradient(135deg, #e8f5e9, #e0f2f1);
  border: 1px solid #a5d6a7;
}

.status-banner.ongoing {
  background: linear-gradient(135deg, #e3f2fd, #e8eaf6);
  border: 1px solid #90caf9;
}

.status-banner.finished {
  background: linear-gradient(135deg, #f5f5f5, #eeeeee);
  border: 1px solid #e0e0e0;
}

.status-banner.cancelled {
  background: linear-gradient(135deg, #fce4ec, #ffebee);
  border: 1px solid #ef9a9a;
}

.status-banner-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.status-banner-info {
  flex: 1;
}

.status-banner-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.status-banner-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.detail-section {
  background: var(--bg-primary);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-light);
}

.companion-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.companion-avatar {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  object-fit: cover;
  flex-shrink: 0;
}

.companion-info {
  flex: 1;
}

.companion-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.companion-game {
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.game-icon {
  font-size: 15px;
}

.contact-btn {
  padding: 8px 18px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 18px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.contact-btn:active {
  background: var(--border-light);
}

.info-grid {
  display: flex;
  flex-direction: column;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}

.info-value.price-value {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color);
}

.info-value.location-value {
  font-size: 13px;
  color: var(--primary-color);
}

.type-tag {
  padding: 3px 10px;
  color: white;
  font-size: 12px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.timeline {
  position: relative;
  padding-left: 4px;
}

.timeline-item {
  display: flex;
  gap: 12px;
  padding-bottom: 20px;
  position: relative;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 18px;
  bottom: 0;
  width: 2px;
  background: var(--border-light);
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-item.active::before {
  background: var(--primary-color);
}

.timeline-item.cancel-node::before {
  background: #ff3b30;
}

.timeline-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--border-light);
  background: var(--bg-primary);
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  margin-top: 2px;
}

.timeline-item.active .timeline-dot {
  border-color: var(--primary-color);
  background: var(--primary-color);
}

.timeline-item.cancel-node.active .timeline-dot {
  border-color: #ff3b30;
  background: #ff3b30;
}

.timeline-content {
  flex: 1;
  min-width: 0;
}

.timeline-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.timeline-time {
  font-size: 12px;
  color: var(--text-muted);
}

.timeline-time.muted {
  color: var(--text-muted);
  opacity: 0.6;
}

.detail-footer {
  padding: 14px 16px;
  padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px));
  background: var(--bg-primary);
  border-top: 1px solid var(--border-light);
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.footer-btn {
  flex: 1;
  padding: 12px;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.footer-btn:active {
  transform: scale(0.96);
}

.footer-btn.primary {
  background: var(--gradient-primary);
  color: white;
}

.footer-btn.secondary {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-light);
}

.confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: overlayFadeIn 0.2s;
}

.confirm-dialog {
  width: 85%;
  max-width: 320px;
  background: var(--bg-primary);
  border-radius: 18px;
  padding: 28px 24px 20px;
  text-align: center;
  animation: dialogBounce 0.3s ease-out;
}

@keyframes dialogBounce {
  from {
    transform: scale(0.85);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.confirm-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.confirm-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.confirm-message {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 20px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.confirm-btn {
  flex: 1;
  padding: 12px;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-btn:active {
  transform: scale(0.95);
}

.confirm-btn.secondary {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.confirm-btn.danger {
  background: linear-gradient(135deg, #ff3b30, #ff6b6b);
  color: white;
}

@media (min-width: 768px) {
  .reserve-page {
    max-width: 650px;
    margin: 0 auto;
  }
  .header {
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
  }
  .detail-panel {
    border-radius: 20px;
    max-height: 85vh;
  }
}
@media (min-width: 1024px) {
  .reserve-page {
    max-width: 720px;
  }
  .header {
    max-width: 720px;
  }
}
</style>
