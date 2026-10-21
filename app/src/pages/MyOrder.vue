<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">我的订单</text>
    </template>

    <view class="role-switch">
      <view
        class="role-item"
        :class="{ active: role === 'user' }"
        @click="switchRole('user')">
        我买到的
      </view>
      <view
        class="role-item"
        :class="{ active: role === 'companion' }"
        @click="switchRole('companion')">
        我接的单
      </view>
    </view>

    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >{{ tab.label }}</view>
    </view>

    <view class="order-list">
      <view class="loading-tip" v-if="loading">加载中...</view>
      <view 
        class="order-card" 
        v-for="(item, idx) in getFilteredOrders()"
        :key="idx"
        @click="goOrderDetail(item)">
        <view class="order-header">
          <view class="game-info">
            <text class="game-icon">🎮</text>
            <text class="game-name">{{ item && item.gameName }}</text>
          </view>
          <text class="status" :class="getStatusClass(item.status)">{{ getStatusText(item.status) }}</text>
        </view>

        <view class="order-meta">
          <text class="order-no">订单号：{{ formatOrderNo(item.orderNo) }}</text>
          <text class="order-time">{{ formatTime(item.createTime) }}</text>
        </view>

        <view class="order-content">
          <view class="companion-info">
            <image mode="aspectFill" class="companion-avatar" :src="item.targetAvatar" alt="" />
            <view class="info">
              <view class="companion-name">
                {{ item.targetNickName }}
                <text class="role-tag">{{ role === 'companion' ? '下单用户' : '陪玩师' }}</text>
              </view>
              <view class="order-desc">下单数量：{{ item.num }} 单</view>
              <view class="order-tags">
                <text class="tag service-tag">游戏陪玩</text>
              </view>
            </view>
          </view>
        </view>

        <view class="order-footer">
          <view class="price-info">
            <text class="price">{{ item.totalPrice }} 金币</text>
            <text class="duration">{{ item.num }} 单</text>
          </view>
          <view class="order-actions">
            <template v-if="role === 'user'">
              <button class="action-btn secondary" v-if="item.status === 0 || item.status === 1" @click.stop="cancelOrder(item)">取消</button>
              <button class="action-btn primary" v-if="item.status === 2" @click.stop="completeOrder(item)">服务结束</button>
              <button class="action-btn primary" v-if="item.status === 0 || item.status === 1 || item.status === 2" @click.stop="contactUser(item)">联系陪玩</button>
              <button class="action-btn primary" v-if="item.status === 3 && !item.rated" @click.stop="rateOrder(item)">评价</button>
              <button class="action-btn secondary" v-if="item.status === 3 && item.rated" disabled>已评价</button>
              <button class="action-btn secondary" v-if="item.status === 3" @click.stop="appealOrder(item)">申诉</button>
            </template>
            <template v-else>
              <button class="action-btn primary" v-if="item.status === 1" :disabled="busyOrderId === item.orderId" @click.stop="startService(item)">开始服务</button>
              <button class="action-btn secondary" v-if="item.status === 2" disabled>等待对方确认完成</button>
              <button class="action-btn primary" v-if="item.status === 1 || item.status === 2 || item.status === 3" @click.stop="contactUser(item)">联系用户</button>
            </template>
          </view>
        </view>
      </view>

      <view class="empty-state" v-if="getFilteredOrders().length === 0">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无订单</text>
        <text class="empty-hint">{{ role === 'companion' ? '去派单大厅抢单后，订单会出现在这里' : '快去下单体验精彩服务吧' }}</text>
        <button v-if="role === 'companion'" class="empty-btn" @click="goPaidan">去派单大厅</button>
      </view>
    </view>

    <view class="detail-modal-overlay" v-if="showDetailModal" @click.self="closeDetailModal">
      <view class="detail-modal">
        <view class="modal-header">
          <text class="modal-title">订单详情</text>
          <text class="modal-close" @click="closeDetailModal">×</text>
        </view>
        <view class="modal-body">
          <text class="detail-loading" v-if="detailLoading">加载中...</text>
          <template v-else-if="orderDetail">
            <view class="detail-row">
              <text class="detail-label">订单号</text>
              <text class="detail-value">{{ orderDetail.orderNo }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">订单状态</text>
              <text class="status" :class="getStatusClass(orderDetail.status)">{{ getStatusText(orderDetail.status) }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">游戏</text>
              <text class="detail-value">{{ orderDetail.gameName }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">单价 / 数量</text>
              <text class="detail-value">{{ orderDetail.price }} 金币 × {{ orderDetail.num }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">总价</text>
              <text class="detail-value detail-price">{{ orderDetail.totalPrice }} 金币</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">下单用户</text>
              <text class="detail-value">{{ orderDetail.user && orderDetail.user.nickname }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">陪玩师</text>
              <text class="detail-value">{{ orderDetail.targetUser && orderDetail.targetUser.nickname }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">下单时间</text>
              <text class="detail-value">{{ formatTime(orderDetail.createTime) }}</text>
            </view>
            <view class="detail-row" v-if="orderDetail.addTime">
              <text class="detail-label">接单时间</text>
              <text class="detail-value">{{ formatTime(orderDetail.addTime) }}</text>
            </view>
            <view class="detail-row" v-if="orderDetail.endTime">
              <text class="detail-label">结束时间</text>
              <text class="detail-value">{{ formatTime(orderDetail.endTime) }}</text>
            </view>
            <view class="detail-row" v-if="orderDetail.star">
              <text class="detail-label">订单评价</text>
              <text class="detail-value">{{ orderDetail.star }} 星{{ orderDetail.content ? ' · ' + orderDetail.content : '' }}</text>
            </view>
          </template>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="closeDetailModal">关闭</button>
        </view>
      </view>
    </view>

    <view class="rate-modal-overlay" v-if="showRateModal" @click.self="closeRateModal">
      <view class="rate-modal">
        <view class="modal-header">
          <text class="modal-title">评价订单</text>
          <text class="modal-close" @click="closeRateModal">×</text>
        </view>
        <view class="modal-body">
          <view class="rating-section">
            <text class="rating-label">评分</text>
            <view class="star-rating">
              <text 
                v-for="n in 5" 
                :key="n" 
                class="star"
                :class="{ active: ratingValue >= n }"
                @click="ratingValue = n"
              >★</text>
            </view>
          </view>
          <view class="comment-section">
            <text class="comment-label">评价内容</text>
            <textarea 
              v-model="ratingComment" 
              class="comment-input" 
              placeholder="请输入评价内容（可选）"
              maxlength="200"
            ></textarea>
            <text class="char-count">{{ ratingComment.length }}/200</text>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="closeRateModal">取消</button>
          <button class="btn-submit" :disabled="ratingValue === 0" @click="submitRating">提交评价</button>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter, useRoute } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import { toast } from '../composables/useToast'
import orderService from '../services/orderService'
import { isApp } from '../common/platform'

const router = useRouter()
const route = useRoute()
const activeTab = ref('all')
const loading = ref(false)
const showRateModal = ref(false)
const ratingValue = ref(0)
const ratingComment = ref('')
const currentRateOrder = ref(null)
const orderList = ref([])
// 订单视角：user=我买到的（默认），companion=我接的单（陪玩师工作台）
const role = ref('user')
// 状态 Tab 以数据驱动：待接单只属于「我买到的」视角，其余状态两个视角都可见。
// 新增 4(已取消)/5(申诉中)，与后端 xn_game_order.status 数字状态机对齐。
const tabs = computed(() => {
  const items = [{ label: '全部', value: 'all' }]
  if (role.value === 'user') items.push({ label: '待接单', value: '0' })
  items.push(
    { label: '已接单', value: '1' },
    { label: '进行中', value: '2' },
    { label: '已完成', value: '3' },
    { label: '已取消', value: '4' },
    { label: '申诉中', value: '5' }
  )
  return items
})

// 切换视角后若当前 Tab 在新视角不可见，回到「全部」，避免停在空页
watch(role, () => {
  if (!tabs.value.some(tab => tab.value === activeTab.value)) activeTab.value = 'all'
})
const busyOrderId = ref(0)
const showDetailModal = ref(false)
const detailLoading = ref(false)
const orderDetail = ref(null)

const loadOrders = async (silent = false) => {
  if (!silent) loading.value = true
  try {
    const res = await orderService.getOrders({ role: role.value })
    // 后端返回 { list, total }，真实列表在 res.data.list
    const payload = (res.data && res.data.list) || res.list || res
    // C-4：B-15 起列表带权威评价态 pingjiaStatus/rated；刷新后「已评价」不再丢失
    orderList.value = (Array.isArray(payload) ? payload.filter(Boolean) : []).map(item => ({
      ...item,
      rated: item.rated === true || Number(item.pingjiaStatus) === 1
    }))
  } catch (err) {
    console.error('加载订单失败:', err)
    // 静默刷新（返回本页）失败时保留旧列表，也不弹 toast
    if (!silent) {
      toast.error(err && err.message ? err.message : '加载订单失败')
      orderList.value = []
    }
  } finally {
    if (!silent) loading.value = false
  }
}

onMounted(() => {
  // 支持 /my-order?role=companion 直达「我接的单」
  if (route.query && route.query.role === 'companion') role.value = 'companion'
  loadOrders()
  const paidOrderId = route.query.paidOrderId
  if (paidOrderId) {
    loadOrders()
    router.replace({ path: '/my-order' })
  }
})

// 返回订单页时静默刷新，不闪「加载中」、不重复首载
const refreshOnShow = () => {
  loadOrders(true)
}
// 首次 onShow 由 onMounted 首载，后续 onShow（返回本页）才静默刷新
let __firstShow = true
onShow(() => {
  if (__firstShow) {
    __firstShow = false
    return
  }
  refreshOnShow()
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
  if (!timestamp) return ''
  const value = Number(timestamp)
  if (!Number.isFinite(value) || value <= 0) return ''
  // 后端 create_time/add_time/end_time 是秒级时间戳（INTEGER(10)），兼容毫秒值
  const date = new Date(value < 1e12 ? value * 1000 : value)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

const getFilteredOrders = () => {
  if (activeTab.value === 'all') return orderList.value
  return orderList.value.filter(item => item && String(item.status) === activeTab.value)
}

const goOrderDetail = async (item) => {
  if (!item || !item.orderId) return
  orderDetail.value = item
  showDetailModal.value = true
  detailLoading.value = true
  try {
    const res = await orderService.getOrderDetail(item.orderId)
    if (res && res.data) orderDetail.value = res.data
  } catch (err) {
    toast.error(err && err.message ? err.message : '加载订单详情失败')
    showDetailModal.value = false
    orderDetail.value = null
  } finally {
    detailLoading.value = false
  }
}

const closeDetailModal = () => {
  showDetailModal.value = false
  orderDetail.value = null
}

const switchRole = (next) => {
  if (role.value === next) return
  role.value = next
  activeTab.value = 'all'
  loadOrders()
}

// App 原生端没有可靠的 window.confirm：统一用 uni.showModal 二次确认；H5 保持 confirm 原逻辑
const confirmAction = (message) => new Promise((resolve) => {
  if (isApp) {
    if (typeof uni !== 'undefined' && typeof uni.showModal === 'function') {
      uni.showModal({
        title: '提示',
        content: message,
        success: (res) => resolve(!!res.confirm),
        fail: () => resolve(false)
      })
    } else {
      // 原生端拿不到 uni.showModal 时按「取消」处理，避免无法确认就执行破坏性操作
      resolve(false)
    }
    return
  }
  resolve(confirm(message))
})

const cancelOrder = async (item) => {
  if (!(await confirmAction('确定要取消这个订单吗？取消后将自动退款'))) return
  try {
    await orderService.cancelOrder(item.orderId, '用户主动取消')
    toast.success('订单已取消，金币已退回')
    await loadOrders()
  } catch (err) {
    toast.error(err.message || '取消失败，请重试')
    // C-6：失败分支也刷新列表，避免对方已完成/已取消后本地状态过期
    loadOrders()
  }
}

// 游戏订单在 /api/games/push 创建时已实时扣款，无“待付款”状态，因此不提供“立即付款”；
// 后端 start 仅允许陪玩师（target_user_id）调用，用户端不提供“开始服务”。
const completeOrder = async (item) => {
  if (!(await confirmAction('确认该订单服务已完成？'))) return
  try {
    await orderService.completeService(item.orderId)
    toast.success('服务已结束')
    await loadOrders()
  } catch (err) {
    toast.error(err.message || '操作失败')
    loadOrders()
  }
}

// App 原生端 window.prompt 不可用：用 uni.showModal 的 editable 收集输入（取 res.content）。
// 运行时不支持 editable 时 res.content 为 undefined，按「空输入」返回交上层提示，不回退浏览器 prompt。
const askAppealReason = () => new Promise((resolve) => {
  if (isApp) {
    if (typeof uni !== 'undefined' && typeof uni.showModal === 'function') {
      uni.showModal({
        title: '请输入申诉原因',
        editable: true,
        placeholderText: '请输入申诉原因',
        success: (res) => {
          if (!res.confirm) { resolve(null); return }
          resolve(typeof res.content === 'string' ? res.content : '')
        },
        fail: () => resolve(null)
      })
    } else {
      // 原生端拿不到 uni.showModal 时按「空输入」返回，交给上层提示，不回退浏览器 prompt
      resolve('')
    }
    return
  }
  resolve(window.prompt('请输入申诉原因'))
})

const appealOrder = async (item) => {
  const reason = await askAppealReason()
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
    loadOrders()
  }
}

// 聊天的目标应该是「对方用户」，不是订单号；此前误把 orderId 当 userId 传，打开的是错误会话
const contactUser = (item) => {
  const targetUserId = role.value === 'companion' ? item.userId : item.targetUserId
  if (!targetUserId) {
    toast.error('无法获取对方账号')
    return
  }
  router.push(`/chat-room/${targetUserId}`)
}

// 陪玩师侧：抢单后由陪玩师「开始服务」，订单从 1(已接单) 进入 2(进行中)，
// 之后用户才能「服务结束」触发分账——此前缺这个入口，订单永久停在已接单。
const startService = async (item) => {
  if (!item || !item.orderId || busyOrderId.value) return
  if (!(await confirmAction('确认开始服务？开始后订单进入进行中，等待用户确认完成。'))) return
  busyOrderId.value = item.orderId
  try {
    await orderService.startService(item.orderId)
    toast.success('已开始服务')
    await loadOrders()
  } catch (err) {
    toast.error(err && err.message ? err.message : '开始服务失败')
  } finally {
    busyOrderId.value = 0
  }
}

const goPaidan = () => {
  router.push('/paidan')
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
    // C-5：透传服务端文案（如「该订单已评价」），不再统一吞成「评价失败，请重试」
    toast.error(err && err.message ? err.message : '评价失败，请重试')
    // C-6：失败分支也刷新列表，避免对方已完成/已取消后本地状态过期
    loadOrders()
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
  padding: 12px 0 8px;
  overflow-x: auto;
}

.tab-item {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
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

.status.appeal {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
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

.role-switch {
  display: flex;
  gap: 10px;
  padding: 12px 16px 0;
}

.role-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  border-radius: 12px;
  background: #f5f5f5;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.role-item.active {
  background: var(--gradient-primary);
  color: white;
  font-weight: 500;
}

.role-tag {
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 4px;
  background: #f5f5f5;
  font-size: 11px;
  font-weight: normal;
  color: #999;
}

.loading-tip {
  text-align: center;
  padding: 12px 0;
  font-size: 13px;
  color: #999;
}

.empty-btn {
  padding: 10px 28px;
  border: none;
  border-radius: 20px;
  background: var(--gradient-primary);
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.detail-modal-overlay {
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

.detail-modal {
  width: 100%;
  max-width: 360px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

.detail-loading {
  display: block;
  padding: 20px 0;
  text-align: center;
  font-size: 13px;
  color: #999;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid #f7f7f7;
  font-size: 14px;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  flex-shrink: 0;
  color: #999;
}

.detail-value {
  color: #333;
  text-align: right;
  word-break: break-all;
}

.detail-price {
  color: #ff6b6b;
  font-weight: bold;
}
</style>
