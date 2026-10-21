<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">我的需求</text>
      <text class="nav-action" @click="goPublish">发布</text>
    </template>

    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: activeTab === tab.value }"
        @click="switchTab(tab.value)"
      >{{ tab.label }}</view>
    </view>

    <view class="demand-list">
      <view class="list-summary" v-if="list.length > 0">共 {{ totalCount }} 条需求</view>
      <view class="loading-tip" v-if="loading && list.length === 0">加载中...</view>

      <view class="load-failed" v-else-if="loadFailed && list.length === 0">
        <text class="failed-text">加载失败，请检查网络后重试</text>
        <button class="retry-btn" @click="loadList(true)">重新加载</button>
      </view>

      <view
        class="demand-card"
        v-for="item in filteredList"
        :key="item.demandId"
        @click="openDetail(item)">
        <view class="demand-header">
          <view class="game-info">
            <text class="game-icon">🎮</text>
            <text class="game-name">{{ item.game || '陪玩需求' }}</text>
          </view>
          <text class="status" :class="getStatusClass(item.status)">{{ statusText(item.status) }}</text>
        </view>

        <view class="demand-meta">
          <text class="demand-type">{{ item.serviceType === 'offline' ? '线下服务' : '线上服务' }}</text>
          <text class="demand-time">{{ formatTime(item.createTime) }}</text>
        </view>

        <view class="demand-main">
          <view class="demand-row">📅 {{ item.date }} {{ item.startTime }} - {{ item.endTime }}</view>
          <view class="demand-row">⏱️ {{ item.duration }} 小时</view>
          <view class="demand-row demand-budget">💰 预算 {{ formatAmount(item.budget) }} 金币</view>
          <view class="demand-row demand-remark" v-if="item.remark">📝 {{ item.remark }}</view>
        </view>

        <view class="demand-footer" @click.stop>
          <text class="demand-no">需求号 {{ item.demandId }}</text>
          <button
            class="action-btn secondary"
            v-if="item.status === 'active'"
            @click="cancelDemand(item)">取消需求</button>
        </view>
      </view>

      <EmptyState
        v-if="!loading && !loadFailed && filteredList.length === 0"
        icon="📌"
        :text="emptyText"
        :hint="emptyHint"
        action-text="发布需求"
        @action="goPublish" />

      <template v-if="list.length > 0">
        <view class="load-more" v-if="loadingMore">加载中...</view>
        <view class="load-more" v-else-if="hasMore" @click="loadMore">加载更多</view>
        <view class="load-more no-more" v-else>没有更多了</view>
      </template>
    </view>

    <view class="modal-overlay" v-if="showDetail" @click.self="closeDetail">
      <view class="detail-modal">
        <view class="modal-header">
          <text class="modal-title">需求详情</text>
          <text class="modal-close" @click="closeDetail">×</text>
        </view>
        <view class="modal-body">
          <text class="detail-loading" v-if="detailLoading">加载中...</text>
          <template v-else-if="detail">
            <view class="detail-row">
              <text class="detail-label">需求号</text>
              <text class="detail-value">{{ detail.demandId }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">需求状态</text>
              <text class="status" :class="getStatusClass(detail.status)">{{ statusText(detail.status) }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">服务类型</text>
              <text class="detail-value">{{ detail.serviceType === 'offline' ? '线下服务' : '线上服务' }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">游戏</text>
              <text class="detail-value">{{ detail.game || '-' }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">预约日期</text>
              <text class="detail-value">{{ detail.date || '-' }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">服务时段</text>
              <text class="detail-value">{{ detail.startTime }} - {{ detail.endTime }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">服务时长</text>
              <text class="detail-value">{{ detail.duration }} 小时</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">预算</text>
              <text class="detail-value detail-price">{{ formatAmount(detail.budget) }} 金币</text>
            </view>
            <view class="detail-row" v-if="detail.offlineLocation">
              <text class="detail-label">线下地点</text>
              <text class="detail-value">{{ detail.offlineLocation }}</text>
            </view>
            <view class="detail-row" v-if="detail.remark">
              <text class="detail-label">备注</text>
              <text class="detail-value">{{ detail.remark }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">发布时间</text>
              <text class="detail-value">{{ formatTime(detail.createTime) }}</text>
            </view>
          </template>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="closeDetail">关闭</button>
          <button
            class="btn-submit"
            v-if="detail && detail.status === 'active'"
            :disabled="cancelling"
            @click="cancelDemand(detail)">{{ cancelling ? '取消中...' : '取消需求' }}</button>
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
import EmptyState from '../components/EmptyState.vue'
import { demandService } from '../services/demandService'
import { toast } from '../composables/useToast'

const router = useRouter()

// 与后端 services/demandService.js 对齐：xn_demand.status 为字符串
// active/matched/completed/cancelled，其中用户可取消的只有 active。
const STATUS_TEXT = { active: '进行中', matched: '已匹配', completed: '已完成', cancelled: '已取消' }
const STATUS_CLASS = { active: 'active', matched: 'matched', completed: 'completed', cancelled: 'cancelled' }

// 列表接口只按用户分页，不接收 status，因此状态 Tab 在已加载数据上过滤
const tabs = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'active' },
  { label: '已取消', value: 'cancelled' }
]

const PAGE_SIZE = 10

const activeTab = ref('all')
const list = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const loadFailed = ref(false)
const hasMore = ref(false)
const totalCount = ref(0)
const currentPage = ref(1)
const showDetail = ref(false)
const detailLoading = ref(false)
const detail = ref(null)
const cancelling = ref(false)

const filteredList = computed(() => {
  if (activeTab.value === 'all') return list.value
  return list.value.filter(item => item && item.status === activeTab.value)
})

const emptyText = computed(() => {
  if (list.value.length > 0) return '暂无该状态的需求'
  return '暂无需求'
})

const emptyHint = computed(() => {
  if (list.value.length > 0) return '切换到「全部」查看其他需求'
  return '发布需求后，可在这里查看进度并取消'
})

const statusText = (status) => STATUS_TEXT[status] || '未知状态'
const getStatusClass = (status) => STATUS_CLASS[status] || ''

const formatAmount = (val) => Number(val || 0).toFixed(2)

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const value = Number(timestamp)
  if (!Number.isFinite(value) || value <= 0) return ''
  // 后端 create_time 为秒级时间戳，兼容毫秒值
  const date = new Date(value < 1e12 ? value * 1000 : value)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

const loadList = async (reset = false, silent = false) => {
  const targetPage = reset ? 1 : currentPage.value
  if (reset) {
    if (loading.value) return
    loading.value = true
  } else {
    if (loadingMore.value || !hasMore.value) return
    loadingMore.value = true
  }
  try {
    const res = await demandService.getDemandList(targetPage, PAGE_SIZE)
    const data = res.data || res || {}
    const rows = Array.isArray(data.list) ? data.list.filter(Boolean) : []
    list.value = reset ? rows : list.value.concat(rows)

    const pagination = data.pagination || {}
    const total = Number(pagination.total)
    totalCount.value = Number.isFinite(total) ? total : list.value.length
    const totalPages = Number(pagination.totalPages)
    hasMore.value = Number.isFinite(totalPages)
      ? targetPage < totalPages
      : rows.length >= PAGE_SIZE
    currentPage.value = targetPage + 1
    loadFailed.value = false
  } catch (err) {
    // 首屏失败才展示整页重试；静默刷新失败保留旧列表，不打断用户
    if (reset && !silent && list.value.length === 0) loadFailed.value = true
    if (!silent) toast.error(err && err.message ? err.message : '加载需求失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  loadList()
}

const switchTab = (value) => {
  if (activeTab.value === value) return
  activeTab.value = value
  // 当前 Tab 没有数据但后端还有更多页时，直接补拉一页，避免出现「假空态」
  if (filteredList.value.length === 0 && hasMore.value) loadMore()
}

const openDetail = async (item) => {
  if (!item || !item.demandId) return
  detail.value = item
  showDetail.value = true
  detailLoading.value = true
  try {
    const res = await demandService.getDemandDetail(item.demandId)
    if (res && res.data) detail.value = res.data
  } catch (err) {
    toast.error(err && err.message ? err.message : '加载需求详情失败')
    closeDetail()
  } finally {
    detailLoading.value = false
  }
}

const closeDetail = () => {
  showDetail.value = false
  detail.value = null
}

// 与 MyReserve 一致：优先 uni.showModal，非 uni 环境回退浏览器 confirm
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

const cancelDemand = async (item) => {
  if (!item || !item.demandId || cancelling.value) return
  if (!(await confirmAction('确定取消该需求吗？'))) return
  cancelling.value = true
  try {
    await demandService.cancelDemand(item.demandId)
    toast.success('需求已取消')
    closeDetail()
    await loadList(true, true)
  } catch (err) {
    toast.error(err && err.message ? err.message : '取消失败，请重试')
  } finally {
    cancelling.value = false
  }
}

const goBack = () => router.back()
const goPublish = () => router.push('/publish-demand')

onMounted(() => {
  loadList(true)
})

// 从发布页返回时静默刷新，首屏不重复请求
let __firstShow = true
onShow(() => {
  if (__firstShow) {
    __firstShow = false
    return
  }
  loadList(true, true)
})
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

.nav-action {
  width: 40px;
  text-align: right;
  font-size: 14px;
  color: white;
  cursor: pointer;
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

.demand-list {
  padding: 4px 16px 16px;
}

.list-summary {
  padding: 12px 4px 0;
  font-size: 12px;
  color: #999;
}

.loading-tip {
  text-align: center;
  padding: 32px 0;
  color: #999;
  font-size: 14px;
}

.load-failed {
  text-align: center;
  padding: 60px 20px;
}

.failed-text {
  display: block;
  font-size: 14px;
  color: #999;
  margin-bottom: 16px;
}

.retry-btn {
  display: inline-block;
  padding: 8px 24px;
  border: none;
  border-radius: 20px;
  background: var(--gradient-primary);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.demand-card {
  background: white;
  border-radius: 0px;
  padding: 16px 20px;
  margin: 12px 4px 0;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.demand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
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
  background: #f5f5f5;
  color: #999;
}

.status.active {
  background: rgba(76, 217, 100, 0.1);
  color: #4cd964;
}

.status.matched {
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
}

.status.completed {
  background: #f5f5f5;
  color: #999;
}

.status.cancelled {
  background: #f5f5f5;
  color: #999;
}

.demand-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #f0f0f0;
}

.demand-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #555;
}

.demand-budget {
  color: #ff9500;
  font-weight: 600;
}

.demand-remark {
  color: #999;
  word-break: break-all;
}

.demand-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed #f0f0f0;
}

.demand-no {
  font-size: 12px;
  color: #999;
}

.action-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 18px;
  font-size: 13px;
  cursor: pointer;
}

.action-btn.secondary {
  background: #f5f5f5;
  color: #666;
}

.load-more {
  text-align: center;
  padding: 16px;
  color: var(--color-primary);
  font-size: 14px;
  cursor: pointer;
}

.load-more.no-more {
  color: #ccc;
  cursor: default;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-modal {
  width: 86%;
  max-width: 520px;
  max-height: 80vh;
  background: #fff;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.modal-close {
  font-size: 24px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 8px 20px;
  overflow-y: auto;
}

.detail-loading {
  display: block;
  text-align: center;
  padding: 24px 0;
  color: #999;
  font-size: 13px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f7f7f7;
  gap: 12px;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  flex-shrink: 0;
  font-size: 13px;
  color: #999;
}

.detail-value {
  font-size: 13px;
  color: #333;
  text-align: right;
  word-break: break-all;
}

.detail-price {
  color: #ff9500;
  font-weight: 600;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel,
.btn-submit {
  flex: 1;
  padding: 10px 0;
  border: none;
  border-radius: 22px;
  font-size: 14px;
  cursor: pointer;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-submit {
  background: var(--gradient-primary);
  color: #fff;
}

.btn-submit[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
