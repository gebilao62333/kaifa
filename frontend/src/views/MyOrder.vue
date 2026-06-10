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

    <div class="confirm-modal" v-if="showCancelModal" @click.self="showCancelModal = false">
      <div class="confirm-dialog">
        <div class="confirm-icon">⚠️</div>
        <div class="confirm-title">确认取消订单</div>
        <div class="confirm-message">
          取消订单后将无法恢复，退款会在1-3个工作日内到账。
        </div>
        <div class="confirm-actions">
          <button class="confirm-btn secondary" @click="showCancelModal = false">再想想</button>
          <button class="confirm-btn danger" @click="confirmCancel">确认取消</button>
        </div>
      </div>
    </div>

    <div class="order-detail-overlay" v-if="showOrderDetail && selectedOrder" @click.self="closeOrderDetail">
      <div class="order-detail-page">
        <div class="detail-header">
          <span class="detail-back-btn" @click="closeOrderDetail">←</span>
          <span class="detail-title">订单详情</span>
        </div>

        <div class="detail-body">
          <div class="detail-status-banner" :class="selectedOrder.status">
            <span class="status-icon-large">
              <template v-if="selectedOrder.status === 'pending'">⏳</template>
              <template v-else-if="selectedOrder.status === 'waiting'">🕐</template>
              <template v-else-if="selectedOrder.status === 'ongoing'">🔄</template>
              <template v-else-if="selectedOrder.status === 'finished'">✅</template>
              <template v-else-if="selectedOrder.status === 'cancelled'">❌</template>
            </span>
            <span class="status-text-large">{{ getStatusText(selectedOrder.status) }}</span>
            <span class="status-desc">{{ getStatusDesc(selectedOrder.status) }}</span>
          </div>

          <div class="detail-section">
            <div class="section-title">订单信息</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">订单编号</span>
                <span class="info-value">{{ formatOrderNo(selectedOrder.id) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">下单时间</span>
                <span class="info-value">{{ formatDateTime(selectedOrder.createTime) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">游戏名称</span>
                <span class="info-value">{{ selectedOrder.game }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">服务类型</span>
                <span class="info-value">
                  <span class="tag service-tag">{{ selectedOrder.serviceType }}</span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">订单来源</span>
                <span class="info-value">
                  <span class="tag source-tag">{{ selectedOrder.orderSource }}</span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">服务时长</span>
                <span class="info-value">{{ selectedOrder.duration }} 小时</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="section-title">陪玩信息</div>
            <div class="companion-detail-card">
              <img class="detail-companion-avatar" :src="selectedOrder.avatar" alt="" />
              <div class="detail-companion-info">
                <div class="detail-companion-name">{{ selectedOrder.companionName }}</div>
                <div class="detail-companion-desc">{{ selectedOrder.title }}</div>
                <div class="detail-companion-tags">
                  <span class="tag service-tag">{{ selectedOrder.serviceType }}</span>
                  <span class="tag source-tag">{{ selectedOrder.orderSource }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="section-title">订单进度</div>
            <div class="timeline">
              <div class="timeline-item" :class="{ active: true }">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-title">订单创建</div>
                  <div class="timeline-time">{{ formatDateTime(selectedOrder.createTime) }}</div>
                </div>
              </div>
              <div class="timeline-item" :class="{ active: selectedOrder.status !== 'pending' && selectedOrder.status !== 'cancelled' }">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-title">已付款</div>
                  <div class="timeline-time" v-if="selectedOrder.status !== 'pending' && selectedOrder.status !== 'cancelled'">{{ formatDateTime(selectedOrder.createTime + 600000) }}</div>
                  <div class="timeline-time" v-else>等待付款</div>
                </div>
              </div>
              <div class="timeline-item" :class="{ active: selectedOrder.status === 'ongoing' || selectedOrder.status === 'finished' }">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-title">服务进行中</div>
                  <div class="timeline-time" v-if="selectedOrder.status === 'ongoing' || selectedOrder.status === 'finished'">{{ formatDateTime(selectedOrder.createTime + 1800000) }}</div>
                  <div class="timeline-time" v-else>未开始</div>
                </div>
              </div>
              <div class="timeline-item" :class="{ active: selectedOrder.status === 'finished' }">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-title">服务完成</div>
                  <div class="timeline-time" v-if="selectedOrder.status === 'finished'">{{ formatDateTime(selectedOrder.createTime + 7200000) }}</div>
                  <div class="timeline-time" v-else>未完成</div>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="section-title">金额明细</div>
            <div class="price-breakdown">
              <div class="price-row">
                <span class="price-row-label">服务单价</span>
                <span class="price-row-value">{{ Math.round(selectedOrder.price / selectedOrder.duration) }} 金币/小时</span>
              </div>
              <div class="price-row">
                <span class="price-row-label">服务时长</span>
                <span class="price-row-value">{{ selectedOrder.duration }} 小时</span>
              </div>
              <div class="price-row price-row--total">
                <span class="price-row-label">合计</span>
                <span class="price-row-value price-row-value--total">{{ selectedOrder.price }} 金币</span>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-footer">
          <div class="detail-price-info">
            <span class="detail-price-label">应付金额</span>
            <span class="detail-price">{{ selectedOrder.price }} 金币</span>
          </div>
          <div class="detail-actions">
            <button class="action-btn secondary" v-if="selectedOrder.status === 'pending'" @click="cancelOrder(selectedOrder)">取消订单</button>
            <button class="action-btn primary" v-if="selectedOrder.status === 'pending'" @click="payOrder(selectedOrder)">立即付款</button>
            <button class="action-btn primary" v-if="selectedOrder.status === 'waiting'" @click="startService(selectedOrder); closeOrderDetail()">开始服务</button>
            <button class="action-btn primary" v-if="selectedOrder.status === 'ongoing'" @click="endService(selectedOrder); closeOrderDetail()">服务结束</button>
            <button class="action-btn primary" v-if="selectedOrder.status === 'pending' || selectedOrder.status === 'ongoing'" @click="contactCompanion(selectedOrder)">联系陪玩</button>
            <button class="action-btn primary" v-if="selectedOrder.status === 'finished' && !selectedOrder.rated" @click="rateOrder(selectedOrder); closeOrderDetail()">评价</button>
            <button class="action-btn secondary" v-if="selectedOrder.status === 'finished' && selectedOrder.rated" disabled>已评价</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../store/user-info'
import { toast } from '../composables/useToast'
import gamesService from '../services/gamesService'
import { formatTimeMs, formatTimeHMS } from '../common/common'
import { useLoginManager } from '../composables/useLoginManager'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { requireLogin } = useLoginManager()
const activeTab = ref('all')

const goBack = () => {
  router.back()
}

const showRateModal = ref(false)
const ratingValue = ref(0)
const ratingComment = ref('')
const currentRateOrder = ref(null)
const selectedOrder = ref(null)
const showOrderDetail = ref(false)
const showCancelModal = ref(false)
const cancelTarget = ref(null)

const loading = ref(false)

// 加载订单数据
const loadOrders = async () => {
  loading.value = true
  try {
    const res = await gamesService.getOrders({ page: 1, pageSize: 50 })
    if (res.code === 200 && res.data) {
      const orders = res.data.list || res.data
      orderList.value = orders.map(order => ({
        id: order.id || order.orderId,
        game: order.gameName || '未知游戏',
        avatar: order.companionAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
        companionName: order.companionName || '未知陪玩',
        companionUserId: order.companionId || order.companionUserId || 0,
        title: `${order.type || order.serviceType || '陪玩'}服务`,
        price: order.price || 0,
        duration: order.duration || 1,
        status: order.status === '待接单' ? 'pending' : 
                order.status === '已接单' ? 'waiting' : 
                order.status === '进行中' ? 'ongoing' : 
                order.status === '已完成' ? 'finished' : 
                order.status === '待付款' ? 'pending' : 'cancelled',
        rated: order.rated || false,
        createTime: order.createTime || order.createdAt || Date.now(),
        serviceType: order.type || order.serviceType || '陪玩',
        orderSource: order.source || order.orderSource || '大厅下单'
      }))
    }
  } catch (error) {
    console.warn('加载订单失败:', error.message)
    // 使用本地存储的备份数据
    const saved = localStorage.getItem('orderList')
    if (saved) {
      try {
        orderList.value = JSON.parse(saved)
      } catch (e) {
        orderList.value = []
      }
    }
  } finally {
    loading.value = false
  }
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

// 在组件挂载时加载订单数据
onMounted(async () => {
  await loadOrders()
  
  // 检查是否有刚支付的订单需要更新
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

// 订单列表
const orderList = ref([])

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

const getStatusDesc = (status) => {
  const descMap = {
    pending: '请尽快完成付款，超时订单将自动取消',
    waiting: '等待陪玩师开始服务',
    ongoing: '服务正在进行中，请保持联系',
    finished: '服务已顺利完成',
    cancelled: '订单已取消'
  }
  return descMap[status] || ''
}

const formatOrderNo = (id) => {
  return `DD${String(id).padStart(8, '0')}`
}

const formatTime = formatTimeMs
const formatDateTime = (timestamp) => formatTimeMs(timestamp, 'YYYY-MM-DD HH:mm')

const getFilteredOrders = () => {
  if (activeTab.value === 'all') return orderList.value
  return orderList.value.filter(item => item.status === activeTab.value)
}

const goOrderDetail = (item) => {
  selectedOrder.value = item
  showOrderDetail.value = true
}

const closeOrderDetail = () => {
  showOrderDetail.value = false
  selectedOrder.value = null
}

const cancelOrder = (item) => {
  cancelTarget.value = item
  showCancelModal.value = true
}

const confirmCancel = () => {
  if (cancelTarget.value) {
    cancelTarget.value.status = 'cancelled'
    saveOrders(orderList.value)
    showCancelModal.value = false
    if (showOrderDetail.value) {
      closeOrderDetail()
    }
    cancelTarget.value = null
    toast.success('订单已取消，退款将在1-3个工作日内到账')
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
  toast.success('服务已开始')
}

const endService = (item) => {
  item.status = 'finished'
  saveOrders(orderList.value)
  activeTab.value = 'finished'
  toast.success('服务已结束')
}

const contactCompanion = async (item) => {
  if (!userStore.isLogin) {
    try {
      await requireLogin()
    } catch {
      return
    }
  }
  const targetId = item.companionUserId
  if (!targetId) {
    toast.warning('无法获取陪玩师信息')
    return
  }
  router.push(`/chat-room/${targetId}`)
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
    toast.success(`评价成功！您的评分：${ratingValue.value}星`)
    currentRateOrder.value = null
  }
}
</script>

<style scoped>
.my-order-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: var(--bg-secondary);
  padding-bottom: 80px;
  padding-bottom: calc(80px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  padding-top: 70px;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 70px;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 650px;
  z-index: 100;
  box-sizing: border-box;
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
  font-size: 18px;
  font-weight: bold;
  color: white;
  text-align: center;
  flex: 1;
  margin-right: 40px;
}

.tabs {
  background: var(--bg-primary);
  display: flex;
  justify-content: space-around;
  padding: 12px 0 0;
  overflow-x: auto;
  height: 60px;
  margin-bottom: 0;
}

.tab-item {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
}

.tab-item.active {
  background: var(--gradient-primary);
  color: white;
  padding-top: 11px;
  padding-bottom: 5px;
  height: 40px;
  border-radius: 10px;
  margin-top: -2px;
}

.order-list {
  padding: 16px;
}

.order-card {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  cursor: pointer;
  width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.order-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--border-light);
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
  font-size: 22px;
}

.game-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.status {
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 500;
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
  background: var(--bg-secondary);
  color: var(--text-muted);
}

.status.cancelled {
  background: var(--bg-secondary);
  color: var(--text-muted);
}

.order-content {
  margin-bottom: 16px;
}

.companion-info {
  display: flex;
  gap: 14px;
  align-items: center;
}

.companion-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--bg-secondary);
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.companion-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.order-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.order-tags {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.service-tag {
  background: rgba(255, 107, 129, 0.1);
  color: var(--primary-color);
}

.source-tag {
  background: rgba(76, 217, 100, 0.1);
  color: #4cd964;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}

.price-info {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.price {
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-color);
}

.duration {
  font-size: 14px;
  color: var(--text-muted);
  background: var(--bg-secondary);
  padding: 4px 10px;
  border-radius: 12px;
}

.order-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 10px 24px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-btn:active {
  transform: scale(0.95);
}

.action-btn.secondary {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.action-btn.primary {
  background: var(--gradient-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 107, 129, 0.3);
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
  background: var(--bg-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}

.empty-text {
  font-size: 15px;
  color: var(--text-muted);
}

.empty-hint {
  font-size: 13px;
  color: var(--text-muted);
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
  background: var(--bg-primary);
  border-radius: 16px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
}

.modal-close {
  font-size: 24px;
  color: var(--text-muted);
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
  color: var(--text-primary);
  margin-bottom: 12px;
}

.star-rating {
  display: flex;
  gap: 12px;
}

.star {
  font-size: 40px;
  color: var(--border-color);
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
  color: var(--text-primary);
  margin-bottom: 8px;
}

.comment-input {
  width: 100%;
  height: 100px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  resize: none;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.char-count {
  position: absolute;
  right: 8px;
  bottom: 8px;
  font-size: 12px;
  color: var(--text-muted);
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-light);
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
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.btn-submit {
  background: var(--gradient-primary);
  color: white;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  .my-order-page {
    max-width: 650px;
    margin: 0 auto;
    position: relative;
  }

  .header {
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 0 0 10px 10px;
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

.order-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  justify-content: center;
  animation: overlayFadeIn 0.3s ease;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.order-detail-page {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 650px;
  height: 100vh;
  height: 100dvh;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
}

@keyframes slideInRight {
  from { transform: translateX(-50%) translateX(40px); opacity: 0; }
  to { transform: translateX(-50%) translateX(0); opacity: 1; }
}

.detail-header {
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  flex-shrink: 0;
}

.detail-back-btn {
  font-size: 24px;
  color: white;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.detail-title {
  font-size: 18px;
  font-weight: bold;
  color: white;
  flex: 1;
  text-align: center;
  margin-right: 40px;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 20px;
  padding-bottom: 120px;
}

.detail-status-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 20px;
  border-radius: 16px;
  margin-bottom: 20px;
  color: white;
}

.detail-status-banner.pending {
  background: linear-gradient(135deg, #ff9500, #ff7a00);
}

.detail-status-banner.waiting {
  background: linear-gradient(135deg, #007aff, #0056d6);
}

.detail-status-banner.ongoing {
  background: linear-gradient(135deg, #34c759, #28a745);
}

.detail-status-banner.finished {
  background: linear-gradient(135deg, #8e8e93, #636366);
}

.detail-status-banner.cancelled {
  background: linear-gradient(135deg, #ff3b30, #cc0000);
}

.status-icon-large {
  font-size: 40px;
  margin-bottom: 8px;
}

.status-text-large {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 6px;
}

.status-desc {
  font-size: 13px;
  opacity: 0.85;
  text-align: center;
}

.detail-section {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-light);
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  text-align: right;
}

.companion-detail-card {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 8px 0;
}

.detail-companion-avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 107, 129, 0.2);
  flex-shrink: 0;
}

.detail-companion-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-companion-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-primary);
}

.detail-companion-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.detail-companion-tags {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.timeline {
  padding-left: 8px;
}

.timeline-item {
  display: flex;
  gap: 14px;
  padding-bottom: 24px;
  position: relative;
  opacity: 0.4;
}

.timeline-item.active {
  opacity: 1;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 18px;
  bottom: 0;
  width: 2px;
  background: var(--border-color);
}

.timeline-item.active:not(:last-child)::after {
  background: var(--primary-color);
}

.timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--border-color);
  flex-shrink: 0;
  margin-top: 2px;
}

.timeline-item.active .timeline-dot {
  background: var(--gradient-primary);
  box-shadow: 0 0 0 4px rgba(255, 107, 129, 0.2);
}

.timeline-content {
  flex: 1;
}

.timeline-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.timeline-time {
  font-size: 13px;
  color: var(--text-muted);
}

.price-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-row-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.price-row-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.price-row--total {
  padding-top: 14px;
  border-top: 1px solid var(--border-light);
  margin-top: 4px;
}

.price-row-value--total {
  font-size: 20px;
  font-weight: bold;
  color: var(--primary-color);
}

.detail-footer {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 650px;
  background: var(--bg-primary);
  padding: 16px 20px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.detail-price-info {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.detail-price-label {
  font-size: 12px;
  color: var(--text-muted);
}

.detail-price {
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-color);
}

.detail-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

@media (min-width: 768px) {
  .order-detail-page {
    max-width: 650px;
  }

  .detail-footer {
    max-width: 650px;
  }
}

@media (min-width: 1024px) {
  .order-detail-page {
    max-width: 720px;
    border-radius: 0;
  }

  .detail-footer {
    max-width: 720px;
  }
}
</style>
