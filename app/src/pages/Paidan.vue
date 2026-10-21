<template>
  <PageLayout
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <template #nav>
      <view class="header-back" @click="goBack">‹</view>
      <view class="title">派单大厅</view>
      <view class="bounty-entry" @click="openBounty">＋ 悬赏</view>
    </template>

    <view class="pull-tip" v-if="pullTipVisible">
      {{ pullTipText }}
    </view>

    <view class="tabs">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'all' }"
        @click="setTab('all')">
        全部
        <text class="tab-count">{{ orderList.filter(o => o.status === 'active').length }}</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'new' }"
        @click="setTab('new')">
        最新
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'hot' }"
        @click="setTab('hot')">
        热门
      </view>
    </view>

    <view class="order-list">
      <view 
        class="order-card" 
        v-for="(item, idx) in filteredOrders" 
        :key="idx"
        @click="goOrderDetail(item)">
        <view class="order-header">
          <view class="user-info" @click.stop="goUserProfile(item)">
            <image mode="aspectFill" class="user-avatar" :src="item.avatar" alt="" />
            <view class="info">
              <view class="nickname-row">
                <text class="nickname">{{ item.nickname }}</text>
                <text class="level" v-if="item.level">Lv.{{ item.level }}</text>
              </view>
              <text class="time">{{ formatTime(item.createTime) }}</text>
            </view>
          </view>
          <text class="status" :class="item.status">{{ getStatusText(item.status) }}</text>
        </view>

        <view class="order-content">
          <h3 class="order-title">{{ item.title }}</h3>
          <view class="order-desc">{{ item.desc }}</view>
        </view>

        <view class="order-tags">
          <text class="tag" v-for="(tag, tIdx) in item.tags" :key="tIdx">{{ tag }}</text>
        </view>

        <view class="order-footer">
          <view class="price">{{ item.price }} 金币/{{ item.unit }}</view>
          <view class="stats">
            <text>💰 共 {{ item.totalPrice }} 金币</text>
          </view>
          <button class="apply-btn" v-if="item.status === 'active'" :disabled="grabbing" @click.stop="applyOrder(item)">立即接单</button>
        </view>
      </view>

      <view class="loading-more" v-if="loading">
        <text>加载中...</text>
      </view>
      <view class="empty-state" v-else-if="filteredOrders.length === 0">
        <view class="empty-icon">📋</view>
        <view class="empty-text">暂无订单</view>
        <view class="empty-hint">下拉刷新试试</view>
      </view>
      <view class="no-more" v-else-if="!hasMore && orderList.length">
        <text>没有更多了</text>
      </view>
    </view>

    <view class="order-detail-modal" v-if="showOrderDetail" @click="closeOrderDetail">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">订单详情</text>
          <text class="close-btn" @click="closeOrderDetail">×</text>
        </view>
        <view class="modal-body" v-if="currentOrder">
          <view class="detail-user">
            <image mode="aspectFill" class="detail-avatar" :src="currentOrder.avatar" alt="" />
            <view class="detail-user-info">
              <view class="detail-nickname">{{ currentOrder.nickname }}</view>
              <view class="detail-level">Lv.{{ currentOrder.level }}</view>
            </view>
          </view>
          <view class="detail-status" :class="currentOrder.status">
            {{ getStatusText(currentOrder.status) }}
          </view>
          <view class="detail-section">
            <view class="detail-label">需求标题</view>
            <view class="detail-value">{{ currentOrder.title }}</view>
          </view>
          <view class="detail-section">
            <view class="detail-label">需求描述</view>
            <view class="detail-value">{{ currentOrder.desc }}</view>
          </view>
          <view class="detail-section">
            <view class="detail-label">服务标签</view>
            <view class="detail-tags">
              <text class="tag" v-for="(tag, idx) in currentOrder.tags" :key="idx">{{ tag }}</text>
            </view>
          </view>
          <view class="detail-row">
            <view class="detail-section">
              <view class="detail-label">单价</view>
              <view class="detail-value price">{{ currentOrder.price }} 金币/{{ currentOrder.unit }}</view>
            </view>
            <view class="detail-section">
              <view class="detail-label">合计</view>
              <view class="detail-value">{{ currentOrder.totalPrice }} 金币</view>
            </view>
          </view>
          <view class="detail-section">
            <view class="detail-label">发布时间</view>
            <view class="detail-value">{{ formatTime(currentOrder.createTime) }}</view>
          </view>
          <view class="detail-actions" v-if="currentOrder.status === 'active'">
            <button class="action-btn primary" :disabled="grabbing" @click="applyOrder(currentOrder)">{{ grabbing ? '抢单中...' : '立即接单' }}</button>
          </view>
        </view>
      </view>
    </view>

    <view class="bounty-overlay" v-if="showBounty" @click.self="showBounty = false">
      <view class="bounty-modal">
        <view class="bounty-title">发布悬赏单</view>
        <label class="bounty-label">游戏</label>
        <!-- H5 保留原生 select；App 没有浏览器 select，改 uni picker(selector) 回填 gameId -->
        <select v-if="!isApp" v-model.number="bountyForm.gameId" class="bounty-input">
          <option v-for="g in categories" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
        <picker v-else class="picker-block" mode="selector" :range="categoryNames" :value="categoryIndex" @change="onCategoryPick">
          <view class="bounty-input app-picker-value">{{ categoryLabel }}</view>
        </picker>
        <label class="bounty-label">悬赏单价（金币/单）</label>
        <input v-model.number="bountyForm.price" type="number" min="1" class="bounty-input" />
        <label class="bounty-label">单数</label>
        <input v-model.number="bountyForm.num" type="number" min="1" max="10" class="bounty-input" />
        <view class="bounty-tip">发布即从余额扣款；陪玩师接单后可在「我的订单」查看</view>
        <view class="bounty-actions">
          <button class="bounty-cancel" @click="showBounty = false">取消</button>
          <button class="bounty-submit" :disabled="bountySubmitting" @click="submitBounty">
            {{ bountySubmitting ? '提交中...' : '发布悬赏' }}
          </button>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { onPageScroll, onShow } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import { toast } from '../composables/useToast'
import PageLayout from '../components/PageLayout.vue'
import gamesService from '../services/gamesService'
import { DEFAULT_AVATAR } from '../common/constants'
import { isApp } from '../common/platform'
import { formatTimeAgo } from '../common/time'

const router = useRouter()

const activeTab = ref('all')
const loading = ref(false)
const hasMore = ref(true)
const showOrderDetail = ref(false)
const currentOrder = ref(null)
const grabbing = ref(false)
const pullTipVisible = ref(false)
const pullTipText = ref('下拉刷新')

let touchStartY = 0
let scrollStartY = 0
// App 端没有 window.scrollY：onPageScroll 持续记录页面滚动位置，供下拉刷新判定使用
const pageScrollTop = ref(0)
const getScrollTop = () => {
  if (isApp) return pageScrollTop.value
  return typeof window !== 'undefined' ? (window.scrollY || 0) : 0
}

const orderList = ref([])

const filteredOrders = computed(() => {
  const activeOrders = orderList.value.filter(o => o.status === 'active')
  if (activeTab.value === 'new') {
    return [...activeOrders].sort((a, b) => b.createTime - a.createTime)
  } else if (activeTab.value === 'hot') {
    return [...activeOrders].sort((a, b) => b.totalPrice - a.totalPrice)
  }
  return activeOrders
})

const setTab = (tab) => {
  activeTab.value = tab
}

const onTouchStart = (e) => {
  touchStartY = e.touches[0].clientY
  scrollStartY = getScrollTop()
}

const onTouchMove = (e) => {
  const currentY = e.touches[0].clientY
  const diff = touchStartY - currentY
  if (diff > 50 && getScrollTop() === 0) {
    pullTipVisible.value = true
    pullTipText.value = '释放刷新...'
  }
}

const onTouchEnd = (e) => {
  const currentY = e.changedTouches[0].clientY
  const diff = touchStartY - currentY
  if (diff > 50 && getScrollTop() === 0) {
    pullTipText.value = '刷新中...'
    setTimeout(() => {
      loadOrders()
      pullTipVisible.value = false
    }, 500)
  } else {
    pullTipVisible.value = false
  }
}

const formatTime = (timestamp) => formatTimeAgo(timestamp, { fallback: 'cn' })

const getStatusText = (status) => {
  const statusMap = {
    active: '待接单',
    closed: '已结束',
    finished: '已完成'
  }
  return statusMap[status] || status
}

const mapPoolItem = (o) => ({
  id: o.orderId,
  orderNo: o.orderNo,
  userId: o.userId,
  avatar: o.avatar || DEFAULT_AVATAR,
  nickname: o.nickName || '玩家',
  level: o.level,
  gameId: o.gameId,
  title: o.gameName ? `${o.gameName} 陪玩悬赏` : '陪玩悬赏',
  desc: o.remark || `悬赏 ${o.num} 单，合计 ${o.totalPrice} 金币`,
  tags: [o.gameName].filter(Boolean),
  price: o.price,
  unit: '单',
  num: o.num,
  totalPrice: o.totalPrice,
  status: 'active',
  createTime: (o.createTime || 0) * 1000
})

const loadOrders = async (silent = false) => {
  // silent=true：onShow 静默刷新，不闪 loading、失败不弹 toast
  if (!silent) loading.value = true
  try {
    const res = await gamesService.getPool({ page: 1, pageSize: 50 })
    orderList.value = (res.data?.list || []).map(mapPoolItem)
  } catch (err) {
    if (!silent) toast.error(err.message || '加载派单列表失败')
  } finally {
    if (!silent) loading.value = false
    hasMore.value = false
  }
}

const goOrderDetail = (item) => {
  if (import.meta.env.DEV) console.log('订单详情:', item.id)
  currentOrder.value = item
  showOrderDetail.value = true
}

const closeOrderDetail = () => {
  showOrderDetail.value = false
  currentOrder.value = null
}

const goUserProfile = (item) => {
  if (import.meta.env.DEV) console.log('查看用户资料:', item.nickname)
  router.push({ name: 'UserProfile', params: { id: item.userId } })
}

const applyOrder = async (item) => {
  if (grabbing.value) return
  grabbing.value = true
  try {
    await gamesService.grabOrder(item.id)
    item.status = 'closed'
    closeOrderDetail()
    toast.success('抢单成功，可在「我的订单」查看')
  } catch (err) {
    toast.error(err.message || '抢单失败')
  } finally {
    grabbing.value = false
  }
}

const showBounty = ref(false)
const bountySubmitting = ref(false)
const categories = ref([])
const bountyForm = reactive({ gameId: 0, price: 50, num: 1 })

// App 端没有浏览器 <select>：同一份游戏分类用 uni picker(selector) 回填 gameId，
// range 顺序与原生 option 顺序一致，提交字段不变
const categoryNames = computed(() => categories.value.map((g) => g.name))
const categoryIndex = computed(() => {
  const index = categories.value.findIndex((g) => g.id === bountyForm.gameId)
  return index < 0 ? 0 : index
})
const categoryLabel = computed(() => {
  const game = categories.value.find((g) => g.id === bountyForm.gameId)
  return game ? game.name : '请选择游戏'
})
const onCategoryPick = (e) => {
  const game = categories.value[Number(e.detail.value) || 0]
  if (game) bountyForm.gameId = game.id
}

const loadCategories = async () => {
  try {
    const res = await gamesService.getCategories()
    const data = res && res.data !== undefined ? res.data : res
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.list) ? data.list : [])
    categories.value = list
      .map(item => ({ id: Number(item.gameId || item.id), name: item.name || '' }))
      .filter(item => item.id)
    if (!bountyForm.gameId) bountyForm.gameId = categories.value[0]?.id || 0
  } catch (error) {
    console.error('加载游戏分类失败:', error)
    categories.value = []
  }
}

const openBounty = async () => {
  showBounty.value = true
  await loadCategories()
}

const submitBounty = async () => {
  if (bountySubmitting.value) return
  if (!bountyForm.gameId) {
    toast.error('请选择游戏')
    return
  }
  const price = Number(bountyForm.price)
  const num = Math.min(10, Math.max(1, Number(bountyForm.num) || 1))
  if (!Number.isFinite(price) || price <= 0) {
    toast.error('请填写正确的悬赏单价')
    return
  }
  bountySubmitting.value = true
  try {
    await gamesService.pushOrder({ gameId: bountyForm.gameId, price, num })
    toast.success('悬赏已发布')
    showBounty.value = false
    await loadOrders()
  } catch (error) {
    toast.error(error.message || '发布悬赏失败')
  } finally {
    bountySubmitting.value = false
  }
}

const goBack = () => {
  // H5 保留 history.back（可回退站外来源）；App 端没有 window.history，走 uni 页面栈
  if (isApp) {
    router.back()
    return
  }
  window.history.back()
}

onMounted(() => {
  loadOrders()
})

onPageScroll(({ scrollTop }) => {
  pageScrollTop.value = scrollTop || 0
})

// 首次 onShow 跳过（onMounted 已首载）；从详情/抢单返回时静默刷新列表
let __firstShow = true
onShow(() => {
  if (__firstShow) {
    __firstShow = false
    return
  }
  loadOrders(true)
})
</script>

<style scoped>
.bounty-entry {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  padding: 6px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  z-index: 2;
}
.bounty-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}
.bounty-modal {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 18px 18px 0 0;
  padding: 18px 20px 24px;
  box-sizing: border-box;
}
.bounty-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #222;
}
.bounty-label {
  display: block;
  margin: 10px 0 6px;
  color: #666;
  font-size: 13px;
}
.bounty-input {
  width: 100%;
  height: 40px;
  padding: 0 10px;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  background: #fafafa;
  font-size: 14px;
  box-sizing: border-box;
}

/* App 端 uni picker 默认不是块级占满，补成与 .bounty-input 同宽 */
.picker-block {
  display: block;
  width: 100%;
}

/* App 端 uni picker 触发区：沿用 .bounty-input 的尺寸，文字垂直居中 */
.app-picker-value {
  display: flex;
  align-items: center;
  color: #333;
}
.bounty-tip {
  margin: 12px 0 0;
  color: #999;
  font-size: 12px;
}
.bounty-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
.bounty-cancel,
.bounty-submit {
  flex: 1;
  height: 42px;
  border-radius: 21px;
  border: none;
  font-size: 15px;
  cursor: pointer;
}
.bounty-cancel {
  background: #f2f3f5;
  color: #555;
}
.bounty-submit {
  background: var(--gradient-primary, linear-gradient(135deg, #667eea, #764ba2));
  color: #fff;
}
.bounty-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.header-back {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 28px;
  color: white;
  cursor: pointer;
  z-index: 2;
}

.title {
  flex: 1;
  font-size: 20px;
  font-weight: bold;
  color: white;
  text-align: center;
}

.tabs {
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
}

.tab-item {
  padding: 8px 24px;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-item.active {
  background: var(--gradient-primary);
  color: white;
}

.tab-count {
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-primary);
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 11px;
}

.tab-item.active .tab-count {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.pull-tip {
  text-align: center;
  padding: 10px;
  color: var(--color-primary);
  font-size: 14px;
  background: linear-gradient(135deg, #f0f0ff 0%, #fff 100%);
}

.order-list {
  padding: 16px;
}

.order-card {
  background: white;
  border-radius: 0px;
  padding: 20px;
  margin: 12px 0 0;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  gap: 12px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nickname-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nickname {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.level {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.time {
  font-size: 12px;
  color: #999;
}

.status {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 4px;
}

.status.active {
  background: rgba(76, 217, 100, 0.1);
  color: #4cd964;
}

.status.closed,
.status.finished {
  background: #f5f5f5;
  color: #999;
}

.order-content {
  margin-bottom: 12px;
}

.order-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 8px 0;
}

.order-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.order-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.order-tags .tag {
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-primary);
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
}

.order-footer {
  display: flex;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f5f5f5;
}

.price {
  font-size: 18px;
  font-weight: bold;
  color: #ff6b6b;
}

.stats {
  flex: 1;
  font-size: 13px;
  color: #999;
  margin-left: 16px;
}

.apply-btn {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}

.loading-more,
.no-more {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: #999;
}

.order-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  background: #fff;
  border-radius: 16px 16px 0 0;
  max-height: 85vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background: #fff;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  font-size: 24px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 20px;
}

.detail-user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.detail-user-info {
  flex: 1;
}

.detail-nickname {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.detail-level {
  font-size: 12px;
  color: #ff6b6b;
  margin-top: 2px;
}

.detail-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  margin-bottom: 16px;
}

.detail-status.active {
  background: #e6f7e6;
  color: #52c41a;
}

.detail-status.closed {
  background: #f5f5f5;
  color: #999;
}

.detail-status.finished {
  background: #fff7e6;
  color: #fa8c16;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 14px;
  color: #333;
}

.detail-value.price {
  color: #ff6b6b;
  font-size: 18px;
  font-weight: 600;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-row {
  display: flex;
  gap: 20px;
}

.detail-row .detail-section {
  flex: 1;
}

.detail-actions {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.action-btn {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  font-size: 16px;
  border: none;
  cursor: pointer;
}

.action-btn.primary {
  background: var(--gradient-primary);
  color: #fff;
}

/* PC 端派单大厅优化（居中由 PageLayout 统一处理，与首页一致） */
@media (min-width: 768px) {
  .order-list {
    padding: 16px 24px;
  }

  .tabs {
    padding: 16px 24px;
  }

  .order-detail-modal {
    justify-content: center;
  }

  .modal-content {
    max-width: 650px;
    margin: 0 auto;
    border-radius: 16px;
  }
}

@media (min-width: 1024px) {
}
</style>
