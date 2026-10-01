<template>
  <PageLayout>
    <template #nav>
      <span class="back-btn" @click="goBack">←</span>
      <span class="nav-title">我的订单</span>
    </template>

    <div class="tabs">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'all' }"
        @click="activeTab = 'all'">
        全部
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === '0' }"
        @click="activeTab = '0'">
        待接单
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === '1' }"
        @click="activeTab = '1'">
        已接单
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === '2' }"
        @click="activeTab = '2'">
        进行中
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === '3' }"
        @click="activeTab = '3'">
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
            <span class="game-name">{{ item.gameName }}</span>
          </div>
          <span class="status" :class="getStatusClass(item.status)">{{ getStatusText(item.status) }}</span>
        </div>

        <div class="order-meta">
          <span class="order-no">订单号：{{ formatOrderNo(item.orderNo) }}</span>
          <span class="order-time">{{ formatTime(item.createTime) }}</span>
        </div>

        <div class="order-content">
          <div class="companion-info">
            <img class="companion-avatar" :src="item.targetAvatar" alt="" />
            <div class="info">
              <div class="companion-name">{{ item.targetNickName }}</div>
              <div class="order-desc">下单数量：{{ item.num }} 单</div>
              <div class="order-tags">
                <span class="tag service-tag">游戏陪玩</span>
              </div>
            </div>
          </div>
        </div>

        <div class="order-footer">
          <div class="price-info">
            <span class="price">{{ item.totalPrice }} 金币</span>
            <span class="duration">{{ item.num }} 单</span>
          </div>
          <div class="order-actions">
            <button class="action-btn secondary" v-if="item.status === 0 || item.status === 1" @click.stop="cancelOrder(item)">取消</button>
            <button class="action-btn primary" v-if="item.status === 2" @click.stop="completeOrder(item)">服务结束</button>
            <button class="action-btn primary" v-if="item.status === 0 || item.status === 1 || item.status === 2" @click.stop="contactCompanion(item)">联系陪玩</button>
            <button class="action-btn primary" v-if="item.status === 3 && !item.rated" @click.stop="rateOrder(item)">评价</button>
            <button class="action-btn secondary" v-if="item.status === 3 && item.rated" disabled>已评价</button>
            <button class="action-btn secondary" v-if="item.status === 3" @click.stop="appealOrder(item)">申诉</button>
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
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PageLayout from '../components/PageLayout.vue'
import { toast } from '../composables/useToast'
import orderService from '../services/orderService'

const router = useRouter()
const route = useRoute()
const activeTab = ref('all')
const loading = ref(false)
const showRateModal = ref(false)
const ratingValue = ref(0)
const ratingComment = ref('')
const currentRateOrder = ref(null)
const orderList = ref([])

const loadOrders = async () => {
  loading.value = true
  try {
    const res = await orderService.getOrders()
    // 后端返回 { list, total }，真实列表在 res.data.list
    orderList.value = (res.data && res.data.list) || res.list || res || []
  } catch (err) {
    console.error('加载订单失败:', err)
    orderList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrders()
  const paidOrderId = route.query.paidOrderId
  if (paidOrderId) {
    loadOrders()
    router.replace({ path: '/my-order' })
  }
})

const goBack = () => {
  router.back()
}

// 与后端 xn_game_order.status 数字状态机对齐：0待接单/1已接单/2进行中/3已完成/4已取消/5申诉中
const STATUS_TEXT = {
  0: '待接单',
  1: '已接单',
  2: '进行中',
  3: '已完成',
  4: '已取消',
  5: '申诉中'
}

const STATUS_CLASS = {
  0: 'pending',
  1: 'waiting',
  2: 'ongoing',
  3: 'finished',
  4: 'cancelled',
  5: 'appeal'
}

const getStatusText = (status) => {
  return STATUS_TEXT[status] || '未知状态'
}

const getStatusClass = (status) => {
  return STATUS_CLASS[status] || ''
}

const formatOrderNo = (orderNo) => {
  return orderNo ? String(orderNo) : ''
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
  return orderList.value.filter(item => String(item.status) === activeTab.value)
}

const goOrderDetail = (item) => {
  toast.info('订单详情功能开发中...')
}

const cancelOrder = async (item) => {
  if (!confirm('确定要取消这个订单吗？取消后将自动退款')) return
  try {
    await orderService.cancelOrder(item.orderId, '用户主动取消')
    toast.success('订单已取消，金币已退回')
    await loadOrders()
  } catch (err) {
    toast.error(err.message || '取消失败，请重试')
  }
}

// 游戏订单在 /api/games/push 创建时已实时扣款，无“待付款”状态，因此不提供“立即付款”；
// 后端 start 仅允许陪玩师（target_user_id）调用，用户端不提供“开始服务”。
const completeOrder = async (item) => {
  if (!confirm('确认该订单服务已完成？')) return
  try {
    await orderService.completeService(item.orderId)
    toast.success('服务已结束')
    await loadOrders()
  } catch (err) {
    toast.error(err.message || '操作失败')
  }
}

const appealOrder = async (item) => {
  const reason = window.prompt('请输入申诉原因')
  if (reason === null) return
  if (!reason.trim()) {
    toast.error('请填写申诉原因')
    return
  }
  try {
    await orderService.appealOrder(item.orderId, reason.trim())
    toast.success('申诉已提交，请等待处理')
    loadOrders()
  } catch (err) {
    toast.error(err.message || '申诉失败')
  }
}

const contactCompanion = (item) => {
  router.push(`/chat-room/${item.orderId}`)
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

const submitRating = async () => {
  if (!currentRateOrder.value || ratingValue.value === 0) return
  try {
    await orderService.evaluateOrder(currentRateOrder.value.orderId, ratingValue.value, ratingComment.value)
    // 列表接口不返回是否已评价，提交成功后本地标记，避免重复评价
    const ratedOrder = orderList.value.find(o => o.orderId === currentRateOrder.value.orderId)
    if (ratedOrder) ratedOrder.rated = true
    showRateModal.value = false
    toast.success(`评价成功！您的评分：${ratingValue.value}星`)
    currentRateOrder.value = null
  } catch (err) {
    toast.error('评价失败，请重试')
  }
}
</script>

<style scoped>
.back-btn {
  font-size: 24px;
  color: white;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
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
  background: var(--gradient-primary);
  color: white;
}

.order-list {
  padding: 16px;
}

.order-card {
  background: white;
  border-radius: 0px;
  padding: 16px 20px;
  margin: 12px 20px 0;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  color: var(--color-primary);
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
  background: var(--gradient-primary);
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
  background: var(--gradient-primary);
  color: white;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
