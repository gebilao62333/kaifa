<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">我的预约</text>
      <text class="placeholder"></text>
    </template>

    <!-- C-2：同一页面区分「我发起的」与「我收到的」，接单方流程不再缺失 -->
    <view class="role-switch">
      <button class="role-btn" :class="{ active: role === 'user' }" @click="switchRole('user')">我发起的</button>
      <button class="role-btn" :class="{ active: role === 'companion' }" @click="switchRole('companion')">我收到的</button>
    </view>

    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @click="switchTab(tab.value)"
      >{{ tab.label }}</view>
    </view>

    <!-- C-2：陪玩师可约时段管理（后端 /api/reserve/slots* 已就绪） -->
    <view class="slots-panel" v-if="role === 'companion'">
      <view class="slots-header">
        <text class="slots-title">可约时段</text>
        <text class="slots-hint">只有开启的时段，用户才能预约</text>
      </view>
      <view class="slots-form">
        <!-- App 原生端没有 browser date/time input，统一用 uni picker（H5/App 通用） -->
        <picker mode="date" :value="slotDate" @change="onSlotDateChange">
          <view class="slots-input">{{ slotDate || '选择日期' }}</view>
        </picker>
        <picker mode="time" :value="slotTime" @change="onSlotTimeChange">
          <view class="slots-input">{{ slotTime || '选择时间' }}</view>
        </picker>
        <button class="slots-add" :disabled="slotSaving || !slotDate || !slotTime" @click="addSlot">
          {{ slotSaving ? '保存中...' : '添加时段' }}
        </button>
      </view>
      <view class="slots-list" v-if="slotList.length > 0">
        <view
          v-for="slot in slotList"
          :key="slot.slotId"
          class="slot-chip"
          :class="{ disabled: slot.status === 2, booked: slot.status === 1 }"
        >
          {{ slot.time }}
          <em v-if="slot.status === 1">已预约</em>
          <button v-else class="slot-toggle" @click="toggleSlot(slot)">{{ slot.status === 2 ? '开启' : '关闭' }}</button>
        </view>
      </view>
      <view class="slots-empty" v-else>当天还没有设置可约时段</view>
    </view>

    <view class="content">
      <view class="order-list" v-if="filteredOrders.length > 0">
        <view class="order-card" v-for="(order, index) in filteredOrders" :key="index" @click="viewOrderDetail(order)">
          <view class="order-header">
            <view class="order-type" :style="{ background: getTypeColor(order.status) }">
              <text class="type-icon">🎮</text>
              {{ order.gameName || '陪玩预约' }}
            </view>
            <view class="order-status" :style="{ color: getStatusColor(order.status) }">{{ statusText(order.status) }}</view>
          </view>
          <view class="order-body">
            <SafeImage class="order-avatar" :src="order.companionAvatar" alt="" :fallback="order.companionName" mode="aspectFill" />
            <view class="order-info">
              <view class="order-name">{{ order.companionName }}</view>
              <view class="order-game">
                <text class="game-icon">🎮</text>
                {{ order.gameName || '陪玩服务' }}
              </view>
              <view class="order-detail">📅 {{ order.date }} {{ order.time }}</view>
              <view class="order-detail">🆔 预约号 {{ order.reserveId }}</view>
            </view>
          </view>
          <view class="order-footer">
            <view class="order-id">下单时间：{{ formatTime(order.createTime) }}</view>
            <view class="order-actions" @click.stop>
              <template v-if="role === 'companion'">
                <button class="action-btn primary" v-if="order.status === 0" @click="confirmOrder(order)">接受预约</button>
                <button class="action-btn secondary" v-if="order.status === 0" @click="rejectOrder(order)">拒绝</button>
                <button class="action-btn secondary" v-if="order.status === 1" @click="contactUser(order)">联系对方</button>
              </template>
              <template v-else>
                <button class="action-btn secondary" v-if="order.status === 0" @click="cancelOrder(order)">取消预约</button>
                <button class="action-btn primary" v-if="order.status === 1" @click="completeOrder(order)">完成服务</button>
                <button class="action-btn secondary" v-if="order.status === 1" @click="contactUser(order)">联系对方</button>
              </template>
            </view>
          </view>
        </view>
      </view>

      <view class="empty-state" v-else>
        <view class="empty-icon">📋</view>
        <view class="empty-text">暂无预约记录</view>
        <view class="empty-hint">{{ role === 'companion' ? '还没有人预约你，先去「我的服务」开启接单吧' : '快去预约陪玩师吧' }}</view>
        <button class="empty-btn" @click="goHome">去首页</button>
      </view>
    </view>

    <view class="modal detail-modal" v-if="showDetail" @click.self="showDetail = false">
      <view class="modal-content">
        <view class="detail-header">
          <view class="detail-avatar" :style="{ background: 'url(' + currentOrder?.companionAvatar + ') center/cover' }"></view>
          <view class="detail-info">
            <view class="detail-name">{{ currentOrder?.companionName }}</view>
            <view class="detail-game">{{ currentOrder?.gameName || '陪玩服务' }}</view>
          </view>
          <text class="detail-close" @click="showDetail = false">✕</text>
        </view>
        <view class="detail-body" v-if="currentOrder">
          <view class="detail-item">
            <view class="detail-label">预约状态</view>
            <view class="detail-value" :style="{ color: getStatusColor(currentOrder.status) }">{{ statusText(currentOrder.status) }}</view>
          </view>
          <view class="detail-item">
            <view class="detail-label">{{ role === 'companion' ? '预约用户' : '陪玩师' }}</view>
            <view class="detail-value">{{ currentOrder.companionName }}</view>
          </view>
          <view class="detail-item">
            <view class="detail-label">服务项目</view>
            <view class="detail-value">{{ currentOrder.gameName || '陪玩服务' }}</view>
          </view>
          <view class="detail-item">
            <view class="detail-label">预约时间</view>
            <view class="detail-value">{{ currentOrder.date }} {{ currentOrder.time }}</view>
          </view>
          <view class="detail-item">
            <view class="detail-label">预约号</view>
            <view class="detail-value">{{ currentOrder.reserveId }}</view>
          </view>
          <view class="detail-item">
            <view class="detail-label">下单时间</view>
            <view class="detail-value">{{ formatTime(currentOrder.createTime) }}</view>
          </view>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import reserveService from '../services/reserveService'
import { toast } from '../composables/useToast'
import { useUserStore } from '../store/user-info'
import SafeImage from '../components/SafeImage.vue'

const router = useRouter()
const userStore = useUserStore()

// C-2：role=user 看「我发起的」，role=companion 看「我收到的」（后端 /api/reserve/list?role=）
const role = ref('user')

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

// silent 仅抑制失败 toast：本页没有用 loading 渲染骨架，静默刷新照旧占用并发锁
const loadOrders = async (silent = false) => {
  if (loading.value) return
  loading.value = true
  try {
    const res = await reserveService.getReserveList({
      status: currentTab.value,
      role: role.value,
      page: 1,
      pageSize: 50
    })
    orders.value = res.data?.list || []
  } catch (err) {
    if (!silent) toast.error(err.message || '加载预约记录失败')
  } finally {
    loading.value = false
  }
}

const switchRole = (value) => {
  if (role.value === value) return
  role.value = value
  currentTab.value = 0
  loadOrders()
  if (value === 'companion') loadSlots()
}

const switchTab = (value) => {
  if (currentTab.value === value) return
  currentTab.value = value
  loadOrders()
}

// C-2 接单方：接受 / 拒绝（后端 confirm、reject 均校验 target_user_id）
// App 原生端没有可靠 window.confirm/prompt：统一封装为 uni.showModal（H5 也走同一实现）
const confirmAction = (message) => new Promise((resolve) => {
  if (typeof uni !== 'undefined' && uni.showModal) {
    uni.showModal({
      title: '提示',
      content: message,
      success: (res) => resolve(!!res.confirm),
      fail: () => resolve(false)
    })
    return
  }
  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    resolve(window.confirm(message))
    return
  }
  resolve(false)
})

const askRejectReason = () => new Promise((resolve) => {
  if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
    resolve(window.prompt('请输入拒绝原因（可留空）', ''))
    return
  }
  if (typeof uni !== 'undefined' && uni.showModal) {
    uni.showModal({
      title: '拒绝预约',
      content: '确定拒绝该预约吗？',
      success: (res) => resolve(res.confirm ? '' : null),
      fail: () => resolve(null)
    })
    return
  }
  resolve(null)
})

const confirmOrder = async (order) => {
  if (!(await confirmAction('确定接受该预约吗？'))) return
  try {
    await reserveService.confirmReserve(order.reserveId)
    toast.success('已接受预约')
    loadOrders()
  } catch (err) {
    toast.error(err.message || '接受失败')
    loadOrders()
  }
}

const rejectOrder = async (order) => {
  const reason = await askRejectReason()
  if (reason === null) return
  try {
    await reserveService.rejectReserve(order.reserveId, reason)
    toast.success('已拒绝预约')
    loadOrders()
  } catch (err) {
    toast.error(err.message || '拒绝失败')
    loadOrders()
  }
}

// C-2 用户侧：确认服务已完成后结算（后端 complete 仅允许 status=1）
const completeOrder = async (order) => {
  if (!(await confirmAction('确认服务已完成？完成后将结算给陪玩师'))) return
  try {
    await reserveService.completeReserve(order.reserveId)
    toast.success('预约已完成')
    loadOrders()
  } catch (err) {
    toast.error(err.message || '操作失败')
    loadOrders()
  }
}

// ===== C-2 可约时段管理 =====
const todayStr = () => {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const slotDate = ref(todayStr())
const slotTime = ref('20:00')
const slotList = ref([])
const slotSaving = ref(false)

// App 端 picker 回调；H5 同样适用
const onSlotDateChange = (e) => {
  slotDate.value = e.detail.value
  loadSlots()
}
const onSlotTimeChange = (e) => {
  slotTime.value = e.detail.value
}

// app 的 user store 用 getter 暴露 userId（state.profile.userId）
const myUserId = () => Number(userStore.userId) || 0

const loadSlots = async () => {
  const companionId = myUserId()
  if (!companionId) return
  try {
    const res = await reserveService.getSlots({ companionId, date: slotDate.value, includeDisabled: true })
    slotList.value = res.data?.list || res.data || []
  } catch (err) {
    slotList.value = []
  }
}

const addSlot = async () => {
  if (slotSaving.value || !slotDate.value || !slotTime.value) return
  slotSaving.value = true
  try {
    await reserveService.batchCreateSlots([{ date: slotDate.value, time: slotTime.value }])
    toast.success('时段已添加')
    await loadSlots()
  } catch (err) {
    toast.error(err.message || '添加失败')
  } finally {
    slotSaving.value = false
  }
}

const toggleSlot = async (slot) => {
  try {
    await reserveService.toggleSlot(slot.slotId)
    await loadSlots()
  } catch (err) {
    toast.error(err.message || '切换失败')
  }
}

const cancelOrder = async (order) => {
  if (!(await confirmAction('确定要取消这个预约吗？'))) return
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

// 返回预约页时静默刷新当前视角；接单方连同时段一起刷新
const refreshOnShow = () => {
  loadOrders(true)
  if (role.value === 'companion') loadSlots()
}

onMounted(() => {
  loadOrders()
  // 用户默认在「我发起的」；切到「我收到的」时才加载时段管理
})
// 首次 onShow 由 onMounted 首载，后续 onShow（返回本页）才静默刷新
let __firstShow = true
onShow(() => {
  if (__firstShow) {
    __firstShow = false
    return
  }
  refreshOnShow()
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

/* C-2：角色切换 + 可约时段管理 */
.role-switch {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.role-btn {
  flex: 1;
  padding: 8px 0;
  border: 1px solid var(--color-primary);
  border-radius: 18px;
  background: #fff;
  color: var(--color-primary);
  font-size: 14px;
  cursor: pointer;
}

.role-btn.active {
  background: var(--gradient-primary);
  color: #fff;
  border-color: transparent;
}

.slots-panel {
  margin: 12px 16px 0;
  padding: 14px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
}

.slots-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.slots-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.slots-hint {
  font-size: 12px;
  color: #999;
}

.slots-form {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.slots-input {
  flex: 1;
  min-width: 0;
  padding: 8px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 13px;
  background: #fafafa;
}

.slots-add {
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  background: var(--gradient-primary);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.slots-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slots-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.slot-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 14px;
  background: #eefbf1;
  color: #2e7d32;
  font-size: 13px;
}

.slot-chip.disabled {
  background: #f5f5f5;
  color: #999;
}

.slot-chip.booked {
  background: #fff7e6;
  color: #d48806;
}

.slot-chip em {
  font-style: normal;
  font-size: 12px;
}

.slot-toggle {
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.slots-empty {
  font-size: 13px;
  color: #aaa;
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
