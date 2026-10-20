<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">我的记录</text>
      <text class="placeholder"></text>
    </template>

    <view class="tabs">
      <view v-for="item in tabs" :key="item.id" class="tab" :class="{ active: tab === item.id }" @click="switchTab(item.id)">
        {{ item.name }}
      </view>
    </view>

    <view class="content">
      <view class="loading" v-if="loading">加载中...</view>

      <template v-else>
        <view class="empty" v-if="tab === 'gift' && giftList.length === 0">背包里还没有礼物</view>
        <view class="record" v-for="item in giftList" :key="item.id" v-show="tab === 'gift'">
          <image mode="aspectFill" class="record-avatar" :src="item.giftImage || DEFAULT_AVATAR" alt="" />
          <view class="record-main">
            <view class="record-title">{{ item.giftName || '礼物' }}</view>
            <view class="record-desc">数量 {{ item.count || 0 }}</view>
          </view>
        </view>

        <view class="empty" v-if="tab === 'redpacket' && redPacketList.length === 0">暂无红包记录</view>
        <view class="record" v-for="item in redPacketList" :key="item.id + item.type" v-show="tab === 'redpacket'">
          <view class="record-icon">{{ item.type === 'sent' ? '🧧' : '💰' }}</view>
          <view class="record-main">
            <view class="record-title">{{ item.desc || (item.type === 'sent' ? '发出红包' : '收到红包') }}</view>
            <view class="record-desc">{{ formatTime(item.createTime) }}</view>
          </view>
          <text class="record-amount">{{ item.type === 'sent' ? '-' : '+' }}{{ formatAmount(item.amount) }}</text>
        </view>

        <view class="empty" v-if="tab === 'payment' && paymentList.length === 0">暂无支付记录</view>
        <view class="record" v-for="item in paymentList" :key="item.orderId || item.orderNo" v-show="tab === 'payment'">
          <view class="record-icon">💳</view>
          <view class="record-main">
            <view class="record-title">{{ payTypeText(item.payType) }} · {{ item.orderNo }}</view>
            <view class="record-desc">{{ formatTime(item.createTime) }}</view>
          </view>
          <text class="record-amount">{{ statusText(item.status) }} {{ formatAmount(item.amount) }}</text>
        </view>

        <view class="empty" v-if="tab === 'call' && callList.length === 0">暂无通话记录</view>
        <view class="record" v-for="item in callList" :key="item.callId" v-show="tab === 'call'">
          <view class="record-icon">{{ item.callType === 2 ? '📹' : '📞' }}</view>
          <view class="record-main">
            <view class="record-title">{{ item.otherName || '用户' }}</view>
            <view class="record-desc">{{ formatTime(item.createTime) }} · 时长 {{ item.duration || 0 }}s</view>
          </view>
          <text class="record-amount">{{ callStatusText(item.status) }}</text>
        </view>

        <view class="empty" v-if="tab === 'blocked' && blockedList.length === 0">黑名单为空</view>
        <view class="record" v-for="item in blockedList" :key="'block-' + item.userId" v-show="tab === 'blocked'">
          <image mode="aspectFill" class="record-avatar" :src="item.avatar || DEFAULT_AVATAR" alt="" />
          <view class="record-main">
            <view class="record-title">{{ item.nickname || '用户' }}</view>
            <view class="record-desc">已拉黑</view>
          </view>
          <button class="unblock-btn" @click="unblock(item)">解除</button>
        </view>

        <view class="stats-grid" v-if="tab === 'stats'">
          <view class="stat-card"><view class="stat-num">{{ stats.totalOrders || 0 }}</view><view class="stat-label">累计订单</view></view>
          <view class="stat-card"><view class="stat-num">{{ stats.completedOrders || 0 }}</view><view class="stat-label">已完成</view></view>
          <view class="stat-card"><view class="stat-num">{{ formatAmount(stats.totalSpent) }}</view><view class="stat-label">累计消费</view></view>
          <view class="stat-card"><view class="stat-num">{{ stats.avgRating || 0 }}</view><view class="stat-label">平均评分</view></view>
        </view>
      </template>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import giftService from '../services/giftService'
import payService from '../services/payService'
import trtcService from '../services/trtcService'
import gamesService from '../services/gamesService'
import authService from '../services/authService'
import { DEFAULT_AVATAR } from '../common/constants'

const router = useRouter()
const tabs = [
  { id: 'gift', name: '礼物背包' },
  { id: 'redpacket', name: '红包记录' },
  { id: 'payment', name: '支付记录' },
  { id: 'call', name: '通话记录' },
  { id: 'stats', name: '订单统计' },
  { id: 'blocked', name: '黑名单' }
]
const tab = ref('gift')
const loading = ref(false)
const giftList = ref([])
const redPacketList = ref([])
const paymentList = ref([])
const callList = ref([])
const stats = ref({})
const blockedList = ref([])

const pickData = (res) => (res && res.data !== undefined ? res.data : res)

const loadTab = async (id, silent = false) => {
  if (!silent) loading.value = true
  try {
    if (id === 'gift') {
      const data = pickData(await giftService.getGiftBag())
      giftList.value = Array.isArray(data) ? data : (data.list || [])
    } else if (id === 'redpacket') {
      const data = pickData(await giftService.getRedPacketHistory('all'))
      redPacketList.value = Array.isArray(data) ? data : (data.list || [])
    } else if (id === 'payment') {
      const data = pickData(await payService.getPaymentHistory())
      paymentList.value = Array.isArray(data) ? data : (data.list || [])
    } else if (id === 'call') {
      const data = pickData(await trtcService.getCallHistory())
      callList.value = Array.isArray(data) ? data : (data.list || [])
    } else if (id === 'stats') {
      stats.value = pickData(await gamesService.getStatistics()) || {}
    } else if (id === 'blocked') {
      const data = pickData(await authService.getBlockedUsers())
      blockedList.value = Array.isArray(data) ? data : (data.list || [])
    }
  } catch (error) {
    console.error('加载记录失败:', error)
  } finally {
    if (!silent) loading.value = false
  }
}

const switchTab = (id) => {
  if (tab.value === id) return
  tab.value = id
  loadTab(id)
}

const formatTime = (timestamp) => {
  const seconds = Number(timestamp) || 0
  if (!seconds) return ''
  const date = new Date(seconds < 1e12 ? seconds * 1000 : seconds)
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`
}

const formatAmount = (value) => Number(value || 0).toFixed(2)

const payTypeText = (type) => ({ 1: '支付宝', 2: '微信', 3: '卡密' }[Number(type)] || '充值')
const statusText = (status) => (Number(status) === 1 ? '已支付' : '待支付')
const callStatusText = (status) => ({ 1: '通话中', 2: '已完成', 3: '已取消', 4: '已拒绝' }[Number(status)] || '已结束')

const unblock = async (item) => {
  try {
    await authService.unblockUser(item.userId)
    blockedList.value = blockedList.value.filter(row => row.userId !== item.userId)
  } catch (error) {
    console.error('解除拉黑失败:', error)
  }
}

const goBack = () => router.back()

// 返回记录中心时静默刷新当前 tab，不闪 loading、不重复首载
const refreshOnShow = () => {
  loadTab(tab.value, true)
}

onMounted(() => loadTab('gift'))
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
.back-btn, .placeholder { width: 40px; font-size: 20px; color: #fff; cursor: pointer; }
.nav-title { flex: 1; text-align: center; font-size: 18px; font-weight: bold; color: #fff; }
.tabs { display: flex; gap: 8px; padding: 12px 16px; overflow-x: auto; background: #fff; }
.tab { flex-shrink: 0; padding: 6px 14px; border-radius: 16px; background: #f2f3f5; color: #666; font-size: 13px; cursor: pointer; }
.tab.active { background: var(--gradient-primary, linear-gradient(135deg, #667eea, #764ba2)); color: #fff; }
.content { padding: 12px 16px 24px; }
.loading, .empty { padding: 40px 0; text-align: center; color: #999; font-size: 14px; }
.record { display: flex; align-items: center; gap: 12px; padding: 14px; margin-bottom: 10px; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
.record-avatar { width: 42px; height: 42px; border-radius: 10px; object-fit: cover; }
.record-icon { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; font-size: 22px; background: #f7f8fa; border-radius: 10px; }
.record-main { flex: 1; min-width: 0; }
.record-title { font-size: 14px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.record-desc { margin-top: 4px; font-size: 12px; color: #999; }
.record-amount { font-size: 13px; color: #666; }
.unblock-btn {
  padding: 6px 14px;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  background: #fff;
  color: #666;
  font-size: 12px;
  cursor: pointer;
}
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.stat-card { padding: 20px; background: #fff; border-radius: 12px; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
.stat-num { font-size: 22px; font-weight: 600; color: #333; }
.stat-label { margin-top: 6px; font-size: 12px; color: #999; }
</style>
