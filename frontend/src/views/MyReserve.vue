<template>
  <PageLayout>
    <template #nav>
      <span class="back-btn" @click="goBack">←</span>
      <span class="nav-title">我的预约</span>
      <span class="placeholder"></span>
    </template>

    <div class="tabs">
      <div
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @click="switchTab(tab.value)"
      >{{ tab.label }}</div>
    </div>

    <div class="content">
      <div class="order-list" v-if="filteredOrders.length > 0">
        <div class="order-card" v-for="(order, index) in filteredOrders" :key="index" @click="viewOrderDetail(order)">
          <div class="order-header">
            <div class="order-type" :style="{ background: getTypeColor(order.status) }">
              <span class="type-icon">🎮</span>
              {{ order.gameName || '陪玩预约' }}
            </div>
            <div class="order-status" :style="{ color: getStatusColor(order.status) }">{{ statusText(order.status) }}</div>
          </div>
          <div class="order-body">
            <img class="order-avatar" :src="order.companionAvatar" alt="" v-img-fallback="order.companionName" />
            <div class="order-info">
              <div class="order-name">{{ order.companionName }}</div>
              <div class="order-game">
                <span class="game-icon">🎮</span>
                {{ order.gameName || '陪玩服务' }}
              </div>
              <div class="order-detail">📅 {{ order.date }} {{ order.time }}</div>
              <div class="order-detail">🆔 预约号 {{ order.reserveId }}</div>
            </div>
          </div>
          <div class="order-footer">
            <div class="order-id">下单时间：{{ formatTime(order.createTime) }}</div>
            <div class="order-actions" @click.stop>
              <button class="action-btn secondary" v-if="order.status === 0" @click="cancelOrder(order)">取消预约</button>
              <button class="action-btn primary" v-if="order.status === 1" @click="contactUser(order)">联系对方</button>
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

    <div class="modal detail-modal" v-if="showDetail" @click.self="showDetail = false">
      <div class="modal-content">
        <div class="detail-header">
          <div class="detail-avatar" :style="{ background: 'url(' + currentOrder?.companionAvatar + ') center/cover' }"></div>
          <div class="detail-info">
            <div class="detail-name">{{ currentOrder?.companionName }}</div>
            <div class="detail-game">{{ currentOrder?.gameName || '陪玩服务' }}</div>
          </div>
          <span class="detail-close" @click="showDetail = false">✕</span>
        </div>
        <div class="detail-body" v-if="currentOrder">
          <div class="detail-item">
            <div class="detail-label">预约状态</div>
            <div class="detail-value" :style="{ color: getStatusColor(currentOrder.status) }">{{ statusText(currentOrder.status) }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">陪玩师</div>
            <div class="detail-value">{{ currentOrder.companionName }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">服务项目</div>
            <div class="detail-value">{{ currentOrder.gameName || '陪玩服务' }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">预约时间</div>
            <div class="detail-value">{{ currentOrder.date }} {{ currentOrder.time }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">预约号</div>
            <div class="detail-value">{{ currentOrder.reserveId }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">下单时间</div>
            <div class="detail-value">{{ formatTime(currentOrder.createTime) }}</div>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '../components/PageLayout.vue'
import reserveService from '../services/reserveService'
import { toast } from '../composables/useToast'

const router = useRouter()

// 后端 xn_reserve.status：0待确认 1已确认 2已拒绝 3已完成 4已取消
const STATUS_TEXT = { 0: '待确认', 1: '已确认', 2: '已拒绝', 3: '已完成', 4: '已取消' }
const STATUS_COLOR = { 0: '#ff9500', 1: '#5b6ef5', 2: '#ff4d4f', 3: '#52c41a', 4: '#999999' }

const tabs = [
  { label: '待确认', value: 0 },
  { label: '已确认', value: 1 },
  { label: '已完成', value: 3 },
  { label: '已取消', value: 4 }
]

const currentTab = ref(0)
const orders = ref([])
const loading = ref(false)
const showDetail = ref(false)
const currentOrder = ref(null)

const filteredOrders = computed(() => orders.value)

const statusText = (s) => STATUS_TEXT[s] || '未知'
const getStatusColor = (s) => STATUS_COLOR[s] || '#999'
const getTypeColor = () => 'linear-gradient(135deg, #667eea, #764ba2)'

const formatTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const loadOrders = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const res = await reserveService.getReserveList({ status: currentTab.value, page: 1, pageSize: 50 })
    orders.value = res.data?.list || []
  } catch (err) {
    toast.error(err.message || '加载预约记录失败')
  } finally {
    loading.value = false
  }
}

const switchTab = (value) => {
  if (currentTab.value === value) return
  currentTab.value = value
  loadOrders()
}

const cancelOrder = async (order) => {
  if (!confirm('确定要取消这个预约吗？')) return
  try {
    await reserveService.cancelReserve(order.reserveId)
    toast.success('预约已取消')
    loadOrders()
  } catch (err) {
    toast.error(err.message || '取消失败')
  }
}

const contactUser = (order) => {
  router.push(`/chat-room/${order.companionId}`)
}

const viewOrderDetail = (order) => {
  currentOrder.value = order
  showDetail.value = true
}

const goBack = () => router.back()

const goHome = () => {
  router.push('/')
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.back-btn,
.placeholder {
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

.tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.tab-item {
  flex: 1;
  padding: 14px;
  text-align: center;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.tab-item:active {
  background: #f5f5f5;
}

.tab-item.active {
  color: var(--color-primary);
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: var(--gradient-primary);
  border-radius: 2px;
}

.content {
  padding: 12px;
}

.order-card {
  background: white;
  border-radius: 0px;
  margin-bottom: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  color: var(--color-primary);
}

.order-body {
  display: flex;
  padding: 16px;
  gap: 12px;
}

.order-avatar {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  object-fit: cover;
}

.order-info {
  flex: 1;
}

.order-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
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
  color: var(--color-primary);
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
  color: #999;
  margin-bottom: 4px;
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
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #f5f5f5;
  flex-wrap: wrap;
  gap: 10px;
}

.order-id {
  font-size: 12px;
  color: #ccc;
}

.order-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
  background: var(--gradient-primary);
  color: white;
}

.action-btn.secondary {
  background: #f5f5f5;
  color: #666;
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
  background: var(--gradient-primary);
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
  color: var(--color-primary);
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

.loading-box {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 60px 0;
}
</style>
