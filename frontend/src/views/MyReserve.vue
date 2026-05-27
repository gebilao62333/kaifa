<template>
  <div class="reserve-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">我的预约</span>
      <span class="placeholder"></span>
    </div>

    <div class="tabs">
      <div class="tab-item" :class="{ active: currentTab === 'pending' }" @click="currentTab = 'pending'">待确认</div>
      <div class="tab-item" :class="{ active: currentTab === 'confirmed' }" @click="currentTab = 'confirmed'">已确认</div>
    </div>

    <div class="content">
      <div class="order-list" v-if="filteredOrders.length > 0">
        <div class="order-card" v-for="(order, index) in filteredOrders" :key="index" @click="viewOrderDetail(order)">
          <div class="order-header">
            <div class="order-type" :style="{ background: getTypeColor(order.type) }">
              <span class="type-icon">{{ order.typeIcon }}</span>
              {{ order.typeText }}
            </div>
            <div class="order-status" :class="order.status">{{ order.statusText }}</div>
            <div class="order-id">订单号：{{ order.id }}</div>
          </div>
          <div class="order-body">
            <img class="order-avatar" :src="order.avatar" alt="" />
            <div class="order-info">
              <div class="order-info-left">
                <div class="order-name">
                  <span>{{ order.name }}</span>
                  <span v-if="order.isVip" class="vip-badge">VIP</span>
                </div>
                <div class="order-game">
                  <span class="game-icon">{{ order.typeIcon }}</span>
                  {{ order.typeText }}
                </div>
                <div class="order-detail">📅 {{ order.date }} {{ order.time }}</div>
              </div>
              <div class="order-info-right">
                <div class="order-detail">📍 {{ order.location }}</div>
                <div class="order-detail">⏱️ 时长 {{ order.duration }}</div>
                <div class="order-price">
                  <span class="price-label">订单金额</span>
                  <span class="price-value">¥{{ order.price }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="order-footer">
            <div class="order-actions" @click.stop>
              <button class="action-btn secondary" v-if="order.status === 'pending'" @click="cancelOrder(order)">取消预约</button>
              <button class="action-btn primary" v-if="order.status === 'pending'" @click="confirmOrder(order)">确认预约</button>
              <button class="action-btn primary" v-if="order.status === 'confirmed'" @click="contactUser(order)">联系对方</button>
            </div>
          </div>
          <div class="countdown" v-if="order.status === 'pending' && order.countdown">
            <div class="countdown-icon">⏰</div>
            <div class="countdown-text">请在 {{ formatCountdown(order.countdown) }} 内确认</div>
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

    <div class="modal detail-modal" v-if="showDetail" @click.self="showDetail = false">
      <div class="modal-content">
        <div class="detail-header">
          <div class="detail-avatar" :style="{ background: 'url(' + currentOrder?.avatar + ') center/cover' }"></div>
          <div class="detail-info">
            <div class="detail-name">
              <span>{{ currentOrder?.name }}</span>
              <span v-if="currentOrder?.isVip" class="vip-badge">VIP</span>
            </div>
            <div class="detail-game">{{ currentOrder?.gameName }}</div>
          </div>
          <span class="detail-close" @click="showDetail = false">✕</span>
        </div>
        <div class="detail-body" v-if="currentOrder">
          <div class="detail-item">
            <div class="detail-label">订单状态</div>
            <div class="detail-value" :class="currentOrder.status">{{ currentOrder.statusText }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">服务类型</div>
            <div class="detail-value">
              <span class="detail-type" :style="{ background: getTypeColor(currentOrder.type) }">
                {{ currentOrder.typeIcon }} {{ currentOrder.typeText }}
              </span>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-label">预约时间</div>
            <div class="detail-value">{{ currentOrder.date }} {{ currentOrder.time }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">服务时长</div>
            <div class="detail-value">{{ currentOrder.duration }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">预约地点</div>
            <div class="detail-value">{{ currentOrder.location }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">订单金额</div>
            <div class="detail-value price">¥{{ currentOrder.price }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">下单时间</div>
            <div class="detail-value">{{ currentOrder.createTime }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginManager } from '../composables/useLoginManager'

const router = useRouter()
const { requireLogin } = useLoginManager()

const currentTab = ref('pending')
const showDetail = ref(false)
const currentOrder = ref(null)

const orders = ref([
  { id: 'RS20240520001', type: 'online', typeText: '线上陪玩', typeIcon: '💻', status: 'pending', statusText: '待确认', avatar: 'https://picsum.photos/100/100?random=101', name: '小明同学', isVip: true, gameName: '王者荣耀', gameIcon: '🎮', date: '2024-05-22', time: '14:00-16:00', duration: '2小时', location: '王者荣耀', price: 88, createTime: '2024-05-20 10:30', countdown: 1800 },
  { id: 'RS20240520002', type: 'offline', typeText: '线下陪玩', typeIcon: '🏠', status: 'confirmed', statusText: '已确认', avatar: 'https://picsum.photos/100/100?random=102', name: '游戏达人', isVip: false, gameName: '和平精英', gameIcon: '🔫', date: '2024-05-25', time: '18:00-20:00', duration: '2小时', location: '北京市朝阳区 XX 网咖', price: 288, createTime: '2024-05-20 09:15' },
  { id: 'RS20240520004', type: 'online', typeText: '线上陪玩', typeIcon: '💻', status: 'pending', statusText: '待确认', avatar: 'https://picsum.photos/100/100?random=104', name: '王者大神', isVip: false, gameName: '英雄联盟', gameIcon: '⚔️', date: '2024-05-23', time: '19:00-21:00', duration: '2小时', location: '英雄联盟', price: 99, createTime: '2024-05-20 11:45', countdown: 3600 },
  { id: 'RS20240520005', type: 'online', typeText: '线上陪玩', typeIcon: '💻', status: 'confirmed', statusText: '已确认', avatar: 'https://picsum.photos/100/100?random=105', name: '吃鸡狂魔', isVip: true, gameName: '永劫无间', gameIcon: '🗡️', date: '2024-05-26', time: '15:00-17:00', duration: '2小时', location: '永劫无间', price: 120, createTime: '2024-05-19 20:30' },
  { id: 'RS20240520008', type: 'online', typeText: '线上陪玩', typeIcon: '💻', status: 'confirmed', statusText: '已确认', avatar: 'https://picsum.photos/100/100?random=108', name: '云顶高手', isVip: true, gameName: '云顶之弈', gameIcon: '♟️', date: '2024-05-24', time: '21:00-23:00', duration: '2小时', location: '云顶之弈', price: 78, createTime: '2024-05-20 08:50' },
  { id: 'RS20240520009', type: 'online', typeText: '线上陪玩', typeIcon: '💻', status: 'pending', statusText: '待确认', avatar: 'https://picsum.photos/100/100?random=109', name: '声优陪玩', isVip: true, gameName: '王者荣耀', gameIcon: '🎮', date: '2024-05-27', time: '20:00-22:30', duration: '2.5小时', location: '王者荣耀', price: 110, createTime: '2024-05-20 13:20', countdown: 7200 },
  { id: 'RS20240520011', type: 'online', typeText: '线上陪玩', typeIcon: '💻', status: 'confirmed', statusText: '已确认', avatar: 'https://picsum.photos/100/100?random=111', name: '原神导游', isVip: true, gameName: '原神', gameIcon: '✨', date: '2024-05-28', time: '10:00-13:00', duration: '3小时', location: '原神', price: 150, createTime: '2024-05-20 14:10' }
])

let timer = null

const filteredOrders = computed(() => {
  return orders.value.filter(order => order.status === currentTab.value)
})

const getTypeColor = (type) => {
  return type === 'online' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'linear-gradient(135deg, #f093fb, #f5576c)'
}

const formatCountdown = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/')
}

const findOrderIndex = (order) => orders.value.findIndex(o => o.id === order.id)

const cancelOrder = async (order) => {
  const loginResult = await requireLogin()
  if (!loginResult.loggedIn) {
    return
  }
  
  if (confirm('确定要取消这个预约吗？')) {
    const index = findOrderIndex(order)
    if (index > -1) orders.value.splice(index, 1)
    alert('订单已取消')
  }
}

const confirmOrder = async (order) => {
  const loginResult = await requireLogin()
  if (!loginResult.loggedIn) {
    return
  }
  
  const index = findOrderIndex(order)
  if (index > -1) {
    orders.value[index].status = 'confirmed'
    orders.value[index].statusText = '已确认'
    orders.value[index].countdown = null
  }
  const newOrder = {
    id: Date.now(),
    game: order.gameName || '王者荣耀',
    avatar: order.avatar,
    companionName: order.name,
    title: order.gameName ? `${order.gameName}陪玩` : '陪玩服务',
    price: order.price,
    duration: parseInt(order.duration) || 2,
    status: 'waiting',
    createTime: Date.now(),
    serviceType: order.typeText || '线上陪玩',
    orderSource: '预约确认'
  }
  const saved = localStorage.getItem('orderList')
  let orderList = saved ? JSON.parse(saved) : []
  if (!orderList.some(o => o.id === newOrder.id)) {
    orderList.unshift(newOrder)
  }
  localStorage.setItem('orderList', JSON.stringify(orderList))
  alert('预约已确认')
}

const contactUser = async (order) => {
  const loginResult = await requireLogin()
  if (!loginResult.loggedIn) {
    return
  }
  
  router.push(`/chat-room/${order.id}`)
}

const viewOrderDetail = (order) => {
  currentOrder.value = order
  showDetail.value = true
}

onMounted(() => {
  timer = setInterval(() => {
    orders.value.forEach(order => {
      if (order.countdown && order.countdown > 0) {
        order.countdown--
        if (order.countdown <= 0) order.countdown = null
      }
    })
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.reserve-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  padding-bottom: 20px;
  padding-bottom: calc(20px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
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
  background: white;
  border-bottom: 1px solid #f0f0f0;
  width: 650px;
  margin-left: 448px;
}

.tab-item {
  padding: 14px;
  text-align: center;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  width: 325px;
  margin-left: 20px;
  margin-right: 20px;
}

.tab-item:nth-child(2) {
  margin-left: 60px;
  margin-right: 40px;
}

.tab-item:active {
  background: #f5f5f5;
}

.tab-item.active {
  color: #667eea;
  font-weight: 500;
  width: 300px;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 2px;
}

.content {
  padding: 10px 0;
  max-width: 650px;
  margin: 0 auto;
}

.order-card {
  background: white;
  border-radius: 16px;
  margin-bottom: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.order-card:active {
  transform: scale(0.98);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  height: 46px;
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
}

.order-status.pending {
  color: #ff9500;
}

.order-status.confirmed {
  color: #667eea;
}

.order-body {
  display: flex;
  padding: 16px;
  gap: 12px;
  width: 650px;
  margin-left: -16px;
  height: 110px;
}

.order-avatar {
  width: 70px;
  height: 70px;
  border-radius: 12px;
  object-fit: cover;
  margin-left: 20px;
  margin-top: 5px;
  margin-bottom: 2px;
}

.order-info {
  flex: 1;
  padding-right: 8px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.order-info-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 90px;
  margin-left: 10px;
}

.order-info-right {
  display: flex;
  flex-direction: column;
  height: 90px;
  width: 140px;
}

.order-info-right .order-detail:nth-child(1),
.order-info-right .order-detail:nth-child(2) {
  text-align: left;
}

.order-info-right .order-detail:nth-child(2) {
  margin-top: 7px;
  margin-bottom: 7px;
  height: 20px;
}

.order-info-right .order-price {
  text-align: center;
  margin-top: 7px;
  margin-bottom: 7px;
}

.order-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
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
  color: #667eea;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.game-icon {
  font-size: 16px;
}

.order-detail {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
}

.order-price {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.price-label {
  font-size: 13px;
  color: #999;
}

.price-value {
  font-size: 18px;
  font-weight: bold;
  color: #ff6b6b;
}

.order-footer {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 16px;
  border-top: 1px solid #f5f5f5;
  height: 44px;
}

.order-id {
  font-size: 12px;
  color: #ccc;
}

.order-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  width: 500px;
}

.action-btn {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:active {
  transform: scale(0.95);
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  margin-left: 309px;
  margin-right: -70px;
}

.action-btn.secondary {
  background: #f5f5f5;
  color: #666;
  padding-left: 0px;
  padding-right: 0px;
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
  color: #999;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: #ccc;
  margin-bottom: 24px;
}

.empty-btn {
  padding: 12px 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  cursor: pointer;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  width: 90%;
  max-width: 360px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.3s;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.detail-modal .modal-content {
  max-width: 400px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid #f5f5f5;
  position: relative;
}

.detail-avatar {
  width: 60px;
  height: 60px;
  border-radius: 12px;
}

.detail-info {
  flex: 1;
}

.detail-name {
  font-size: 17px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-game {
  font-size: 13px;
  color: #999;
}

.detail-close {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 20px;
  color: #999;
  cursor: pointer;
}

.detail-body {
  padding: 16px 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  color: #999;
}

.detail-value {
  font-size: 14px;
  color: #333;
  text-align: right;
  max-width: 60%;
}

.detail-value.price {
  font-size: 18px;
  font-weight: bold;
  color: #ff6b6b;
}

.detail-value.pending {
  color: #ff9500;
}

.detail-value.confirmed {
  color: #667eea;
}

.detail-type {
  padding: 4px 12px;
  color: white;
  font-size: 12px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
