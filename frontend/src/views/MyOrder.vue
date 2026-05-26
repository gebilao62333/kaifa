<template>
  <div class="my-order-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">我的订单</span>
    </div>

    <div class="tabs">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'all' }"
        @click="activeTab = 'all'">
        全部
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'pending' }"
        @click="activeTab = 'pending'">
        待付款
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'waiting' }"
        @click="activeTab = 'waiting'">
        待服务
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'ongoing' }"
        @click="activeTab = 'ongoing'">
        进行中
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'finished' }"
        @click="activeTab = 'finished'">
        已完成
      </div>
    </div>

    <div class="order-list">
      <div 
        class="order-card" 
        v-for="(item, idx) in getFilteredOrders()" 
        :key="idx"
        @click="goOrderDetail(item)">
        <div class="order-header">
          <div class="game-info">
            <span class="game-icon">🎮</span>
            <span class="game-name">{{ item.game }}</span>
          </div>
          <span class="status" :class="item.status">{{ getStatusText(item.status) }}</span>
        </div>

        <div class="order-meta">
          <span class="order-no">订单号：{{ formatOrderNo(item.id) }}</span>
          <span class="order-time">{{ formatTime(item.createTime) }}</span>
        </div>

        <div class="order-content">
          <div class="companion-info">
            <img class="companion-avatar" :src="item.avatar" alt="" />
            <div class="info">
              <div class="companion-name">{{ item.companionName }}</div>
              <div class="order-desc">{{ item.title }}</div>
              <div class="order-tags">
                <span class="tag service-tag">{{ item.serviceType }}</span>
                <span class="tag source-tag">{{ item.orderSource }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="order-footer">
          <div class="price-info">
            <span class="price">{{ item.price }} 金币</span>
            <span class="duration">{{ item.duration }}小时</span>
          </div>
          <div class="order-actions">
            <button class="action-btn secondary" v-if="item.status === 'pending'" @click.stop="cancelOrder(item)">取消</button>
            <button class="action-btn primary" v-if="item.status === 'pending'" @click.stop="payOrder(item)">立即付款</button>
            <button class="action-btn primary" v-if="item.status === 'waiting'" @click.stop="startService(item)">开始服务</button>
            <button class="action-btn primary" v-if="item.status === 'ongoing'" @click.stop="endService(item)">服务结束</button>
            <button class="action-btn primary" v-if="item.status === 'pending' || item.status === 'ongoing'" @click.stop="contactCompanion(item)">联系陪玩</button>
            <button class="action-btn primary" v-if="item.status === 'finished' && !item.rated" @click.stop="rateOrder(item)">评价</button>
            <button class="action-btn secondary" v-if="item.status === 'finished' && item.rated" disabled>已评价</button>
          </div>
        </div>
      </div>

      <div class="empty-state" v-if="getFilteredOrders().length === 0">
        <span class="empty-icon">📋</span>
        <span class="empty-text">暂无订单</span>
        <span class="empty-hint">快去下单体验精彩服务吧</span>
      </div>
    </div>

    <div class="rate-modal-overlay" v-if="showRateModal" @click.self="closeRateModal">
      <div class="rate-modal">
        <div class="modal-header">
          <span class="modal-title">评价订单</span>
          <span class="modal-close" @click="closeRateModal">×</span>
        </div>
        <div class="modal-body">
          <div class="rating-section">
            <span class="rating-label">评分</span>
            <div class="star-rating">
              <span 
                v-for="n in 5" 
                :key="n" 
                class="star"
                :class="{ active: ratingValue >= n }"
                @click="ratingValue = n"
              >★</span>
            </div>
          </div>
          <div class="comment-section">
            <span class="comment-label">评价内容</span>
            <textarea 
              v-model="ratingComment" 
              class="comment-input" 
              placeholder="请输入评价内容（可选）"
              maxlength="200"
            ></textarea>
            <span class="char-count">{{ ratingComment.length }}/200</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeRateModal">取消</button>
          <button class="btn-submit" :disabled="ratingValue === 0" @click="submitRating">提交评价</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const activeTab = ref('all')

const goBack = () => {
  router.back()
}

// 在组件挂载时检查是否有刚支付的订单需要更新
onMounted(() => {
  const seen = new Set()
  const deduped = orderList.value.filter(order => {
    const key = order.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  if (deduped.length !== orderList.value.length) {
    orderList.value = deduped
    saveOrders(deduped)
  }
  const paidOrderId = route.query.paidOrderId
  if (paidOrderId) {
    const orderId = Number(paidOrderId)
    const order = orderList.value.find(o => o.id === orderId)
    if (order && order.status === 'pending') {
      order.status = 'waiting'
      saveOrders(orderList.value)
    }
    // 清除URL中的查询参数，避免刷新时重复处理
    router.replace({ path: '/my-order' })
  }
})
const showRateModal = ref(false)
const ratingValue = ref(0)
const ratingComment = ref('')
const currentRateOrder = ref(null)

// 默认订单数据
const defaultOrders = [
  {
    id: 1,
    game: '王者荣耀',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=order1',
    companionName: '小雪',
    title: '钻石到星耀段位陪练',
    price: 60,
    duration: 2,
    status: 'pending',
    createTime: Date.now() - 1800000,
    serviceType: '段位陪练',
    orderSource: '大厅下单'
  },
  {
    id: 2,
    game: '和平精英',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=order2',
    companionName: '阿杰',
    title: '娱乐局打打吃鸡',
    price: 75,
    duration: 3,
    status: 'waiting',
    createTime: Date.now() - 3600000,
    serviceType: '娱乐陪玩',
    orderSource: '组队邀请'
  },
  {
    id: 5,
    game: '永劫无间',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=order5',
    companionName: '战神',
    title: '上分冲榜',
    price: 88,
    duration: 2,
    status: 'ongoing',
    createTime: Date.now() - 7200000,
    serviceType: '段位陪练',
    orderSource: '大厅下单'
  },
  {
    id: 3,
    game: '原神',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=order3',
    companionName: '小美',
    title: '刷圣遗物和材料',
    price: 90,
    duration: 3,
    status: 'finished',
    rated: false,
    createTime: Date.now() - 86400000,
    serviceType: '副本代练',
    orderSource: '指定下单'
  },
  {
    id: 4,
    game: '英雄联盟',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=order4',
    companionName: '大飞',
    title: '白银到黄金排位',
    price: 120,
    duration: 4,
    status: 'finished',
    rated: true,
    createTime: Date.now() - 172800000,
    serviceType: '段位陪练',
    orderSource: '大厅下单'
  }
]

// 从 localStorage 加载订单数据
const loadOrders = () => {
  const saved = localStorage.getItem('orderList')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      return defaultOrders
    }
  }
  localStorage.setItem('orderList', JSON.stringify(defaultOrders))
  return defaultOrders
}

// 保存订单数据到 localStorage（自动去重）
const saveOrders = (orders) => {
  const seen = new Set()
  const deduped = orders.filter(order => {
    const key = order.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  localStorage.setItem('orderList', JSON.stringify(deduped))
}

// 订单列表
const orderList = ref(loadOrders())

const getStatusText = (status) => {
  const statusMap = {
    pending: '待付款',
    waiting: '待服务',
    ongoing: '进行中',
    finished: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

const formatOrderNo = (id) => {
  return `DD${String(id).padStart(8, '0')}`
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

const getFilteredOrders = () => {
  if (activeTab.value === 'all') return orderList.value
  return orderList.value.filter(item => item.status === activeTab.value)
}

const goOrderDetail = (item) => {
  console.log('订单详情:', item.id)
  alert('订单详情功能开发中...')
}

const cancelOrder = (item) => {
  if (confirm('确定要取消这个订单吗？取消后无法恢复')) {
    item.status = 'cancelled'
    saveOrders(orderList.value)
    alert('订单已取消，退款将在1-3个工作日内到账')
  }
}

const payOrder = (item) => {
  router.push({
    path: '/payment-gateway',
    query: {
      type: 'order',
      method: 'coin',
      amount: item.price,
      balance: 500000,
      orderId: item.id
    }
  })
}

const startService = (item) => {
  item.status = 'ongoing'
  saveOrders(orderList.value)
  alert('服务已开始')
}

const endService = (item) => {
  item.status = 'finished'
  saveOrders(orderList.value)
  activeTab.value = 'finished'
  alert('服务已结束')
}

const contactCompanion = (item) => {
  console.log('联系陪玩:', item.companionName)
  router.push(`/chat-room/${item.id}`)
}

const rateOrder = (item) => {
  currentRateOrder.value = item
  ratingValue.value = 0
  ratingComment.value = ''
  showRateModal.value = true
}

const closeRateModal = () => {
  showRateModal.value = false
  currentRateOrder.value = null
}

const submitRating = () => {
  if (currentRateOrder.value && ratingValue.value > 0) {
    currentRateOrder.value.rated = true
    saveOrders(orderList.value)
    showRateModal.value = false
    alert(`评价成功！您的评分：${ratingValue.value}星，评价：${ratingComment.value || '无'}`)
    currentRateOrder.value = null
  }
}
</script>

<style scoped>
.my-order-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  padding-bottom: 80px;
  padding-bottom: calc(80px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  padding-top: 82px;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: -webkit-linear-gradient(315deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 70px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.back-btn {
  font-size: 24px;
  color: white;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: static;
  padding: 0;
  margin: 0;
  -webkit-tap-highlight-color: transparent;
}

.header .title {
  font-size: 17px;
  font-weight: bold;
  color: white;
  padding: 0;
  margin: 0;
  transform: none;
}

.tabs {
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 62px 0 12px;
  overflow-x: auto;
}

.tab-item {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
}

.tab-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.order-list {
  padding: 16px;
}

.order-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.order-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #f0f0f0;
}

.order-no {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-time {
  margin-left: 12px;
}

.game-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.game-icon {
  font-size: 20px;
}

.game-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.status {
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 4px;
}

.status.pending {
  background: rgba(255, 149, 0, 0.1);
  color: #ff9500;
}

.status.waiting {
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
}

.status.ongoing {
  background: rgba(76, 217, 100, 0.1);
  color: #4cd964;
}

.status.finished {
  background: #f5f5f5;
  color: #999;
}

.status.cancelled {
  background: #f5f5f5;
  color: #999;
}

.order-content {
  margin-bottom: 12px;
}

.companion-info {
  display: flex;
  gap: 12px;
}

.companion-avatar {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: cover;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.companion-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.order-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.order-tags {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.service-tag {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.source-tag {
  background: rgba(76, 217, 100, 0.1);
  color: #4cd964;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.price-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.price {
  font-size: 20px;
  font-weight: bold;
  color: #ff6b6b;
}

.duration {
  font-size: 13px;
  color: #999;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 13px;
  border: none;
  cursor: pointer;
}

.action-btn.secondary {
  background: #f5f5f5;
  color: #666;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
}

.empty-icon {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}

.empty-text {
  font-size: 15px;
  color: #999;
}

.empty-hint {
  font-size: 13px;
  color: #ccc;
}

.rate-modal-overlay {
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

.rate-modal {
  width: 100%;
  max-width: 360px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 24px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 20px;
}

.rating-section {
  margin-bottom: 20px;
}

.rating-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 12px;
}

.star-rating {
  display: flex;
  gap: 12px;
}

.star {
  font-size: 40px;
  color: #e0e0e0;
  cursor: pointer;
  transition: color 0.2s;
}

.star.active {
  color: #ffc53d;
}

.comment-section {
  position: relative;
}

.comment-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.comment-input {
  width: 100%;
  height: 100px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 14px;
  resize: none;
  box-sizing: border-box;
}

.char-count {
  position: absolute;
  right: 8px;
  bottom: 8px;
  font-size: 12px;
  color: #999;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel, .btn-submit {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 15px;
  border: none;
  cursor: pointer;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-submit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (min-width: 768px) {
  .my-order-page {
    max-width: 650px;
    margin: 0 auto;
    position: relative;
  }

  .header {
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 0 0 16px 16px;
    padding: 14px 20px;
  }
}

@media (min-width: 1024px) {
  .my-order-page {
    max-width: 720px;
  }

  .header {
    max-width: 720px;
  }
}
</style>
