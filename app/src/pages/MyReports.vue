<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">我的举报</text>
      <text class="placeholder"></text>
    </template>

    <view class="filter-tabs">
      <text
        v-for="tab in statusTabs"
        :key="String(tab.value)"
        :class="['filter-tab', { active: status === tab.value }]"
        @click="changeStatus(tab.value)"
      >
        {{ tab.label }}
      </text>
    </view>

    <view class="list">
      <view
        v-for="item in list"
        :key="item.reportId"
        class="report-card"
        @click="openDetail(item.reportId)"
      >
        <view class="card-top">
          <text class="target-type">{{ targetTypeText(item.targetType) }}</text>
          <text class="status-tag" :class="'status-' + item.status">
            {{ statusText(item.status) }}
          </text>
        </view>
        <view class="card-reason">{{ item.reason }}</view>
        <view class="card-meta">
          <text>被举报人：{{ item.targetUserName || '—' }}</text>
          <text>{{ formatTime(item.createTime) }}</text>
        </view>
        <view class="card-result" v-if="item.handleResult">
          处理结果：{{ item.handleResult }}
        </view>
      </view>

      <EmptyState v-if="!loading && list.length === 0" text="暂无举报记录" />

      <view class="list-footer" v-if="list.length">
        <text v-if="loading" class="footer-text">加载中...</text>
        <text v-else-if="hasMore" class="footer-text loading" @click="loadList(true)">加载更多</text>
        <text v-else class="footer-text">没有更多了</text>
      </view>
    </view>

    <view v-if="detailVisible" class="detail-mask" @click.self="detailVisible = false">
      <view class="detail-modal">
        <view class="detail-header">
          <text class="detail-title">举报详情</text>
          <text class="detail-close" @click="detailVisible = false">✕</text>
        </view>
        <view class="detail-body" v-if="detail">
          <view class="detail-row">
            <text class="detail-label">举报类型</text>
            <text>{{ targetTypeText(detail.targetType) }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">举报原因</text>
            <text>{{ detail.reason }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">被举报人</text>
            <text>{{ detail.targetUser?.nickname || '—' }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">处理状态</text>
            <text>{{ statusText(detail.status) }}</text>
          </view>
          <view class="detail-row" v-if="detail.handleResult">
            <text class="detail-label">处理结果</text>
            <text>{{ detail.handleResult }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">提交时间</text>
            <text>{{ formatTime(detail.createTime) }}</text>
          </view>
          <view class="detail-images" v-if="detail.images && detail.images.length">
            <image mode="aspectFill"
              v-for="(img, index) in detail.images"
              :key="index"
              class="detail-image"
              :src="img"
              alt="证据"
            />
          </view>
        </view>
        <view class="detail-body" v-else>
          <text class="detail-loading">加载中...</text>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import EmptyState from '../components/EmptyState.vue'
import reportService from '../services/reportService'
import { toast } from '../composables/useToast'

const router = useRouter()

const PAGE_SIZE = 20

const statusTabs = [
  { label: '全部', value: '' },
  { label: '待处理', value: 0 },
  { label: '已处理', value: 2 }
]

const status = ref('')
const list = ref([])
const page = ref(1)
const total = ref(0)
const loading = ref(false)
// 静默刷新单独占位，既避免与「加载更多」争用 loading 展示，也保持并发锁
const refreshing = ref(false)
const detailVisible = ref(false)
const detail = ref(null)

const hasMore = ref(false)

const targetTypeText = (type) => ({ 1: '用户', 2: '动态', 3: '评论', 4: '聊天消息' }[type] || '其他')
const statusText = (s) => ({ 0: '待处理', 2: '已处理' }[s] || '处理中')

const formatTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const loadList = async (append = false, silent = false) => {
  if (loading.value || refreshing.value) return
  if (silent) refreshing.value = true
  else loading.value = true
  try {
    const params = { page: page.value, pageSize: PAGE_SIZE }
    if (status.value !== '') params.status = status.value
    const res = await reportService.getReportList(params)
    const data = res.data || {}
    const rows = data.list || []
    list.value = append ? list.value.concat(rows) : rows
    total.value = data.total || 0
    hasMore.value = list.value.length < total.value
    if (rows.length) page.value += 1
  } catch (err) {
    if (!silent) toast.error(err.message || '加载举报记录失败')
  } finally {
    if (silent) refreshing.value = false
    else loading.value = false
  }
}

const changeStatus = (value) => {
  if (status.value === value) return
  status.value = value
  page.value = 1
  list.value = []
  loadList()
}

const openDetail = async (reportId) => {
  detail.value = null
  detailVisible.value = true
  try {
    const res = await reportService.getReportDetail(reportId)
    detail.value = res.data || res
  } catch (err) {
    toast.error(err.message || '加载举报详情失败')
    detailVisible.value = false
  }
}

const goBack = () => router.back()

// 返回本页时从第一页静默刷新，不闪 loading、不重复首载
const refreshOnShow = () => {
  page.value = 1
  loadList(false, true)
}

onMounted(() => {
  loadList()
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
.back-btn, .placeholder {
  width: 40px;
  font-size: 20px;
  color: var(--color-primary);
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 600;
}

.filter-tabs {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
}

.filter-tab {
  padding: 6px 16px;
  border-radius: 16px;
  background: #f5f5f5;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.filter-tab.active {
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-primary);
  font-weight: 600;
}

.list {
  padding: 0 16px 24px;
}

.report-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.target-type {
  font-size: 12px;
  color: #fff;
  background: var(--color-primary);
  border-radius: 4px;
  padding: 2px 8px;
}

.status-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-0 {
  color: #faad14;
  background: rgba(250, 173, 20, 0.12);
}

.status-2 {
  color: #52c41a;
  background: rgba(82, 196, 26, 0.12);
}

.card-reason {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 8px;
  word-break: break-all;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.card-result {
  margin-top: 8px;
  font-size: 12px;
  color: #52c41a;
  background: rgba(82, 196, 26, 0.08);
  border-radius: 6px;
  padding: 6px 10px;
}

.list-footer {
  text-align: center;
  padding: 12px 0;
}

.footer-text {
  font-size: 13px;
  color: #999;
}

.footer-text.loading {
  color: var(--color-primary);
  cursor: pointer;
}

.detail-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.detail-modal {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
}

.detail-close {
  color: #999;
  cursor: pointer;
}

.detail-body {
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.detail-row {
  display: flex;
  font-size: 14px;
  margin-bottom: 12px;
  line-height: 1.5;
}

.detail-label {
  width: 72px;
  flex-shrink: 0;
  color: #999;
}

.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.detail-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}

.detail-loading {
  display: block;
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 20px 0;
}
</style>
