<template>
  <div class="paidan-page" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
    <div class="header">
      <div class="header-back" @click="goBack">‹</div>
      <div class="title">派单大厅</div>
    </div>

    <div class="tabs">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'all' }"
        @click="setTab('all')">
        全部
        <span class="tab-count">{{ orderList.filter(o => o.status === 'active').length }}</span>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'new' }"
        @click="setTab('new')">
        最新
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'hot' }"
        @click="setTab('hot')">
        热门
      </div>
    </div>

    <div class="pull-tip" v-if="pullTipVisible">
      {{ pullTipText }}
    </div>

    <div class="order-list">
      <div 
        class="order-card" 
        v-for="(item, idx) in filteredOrders" 
        :key="idx"
        @click="goOrderDetail(item)">
        <div class="order-header">
          <div class="user-info" @click.stop="goUserProfile(item)">
            <img class="user-avatar" :src="item.avatar" alt="" />
            <div class="info">
              <div class="nickname-row">
                <span class="nickname">{{ item.nickname }}</span>
                <span class="level" v-if="item.level">Lv.{{ item.level }}</span>
              </div>
              <span class="time">{{ formatTime(item.createTime) }}</span>
            </div>
          </div>
          <span class="status" :class="item.status">{{ getStatusText(item.status) }}</span>
        </div>

        <div class="order-content">
          <h3 class="order-title">{{ item.title }}</h3>
          <p class="order-desc">{{ item.desc }}</p>
        </div>

        <div class="order-tags">
          <span class="tag" v-for="(tag, tIdx) in item.tags" :key="tIdx">{{ tag }}</span>
        </div>

        <div class="order-footer">
          <div class="price">{{ item.price }} 金币/{{ item.unit }}</div>
          <div class="stats">
            <span>👥 {{ item.applyCount }}人已接单</span>
          </div>
          <button class="apply-btn" v-if="item.status === 'active'" @click.stop="applyOrder(item)">立即接单</button>
        </div>
      </div>

      <div class="loading-more" v-if="loading">
        <span>加载中...</span>
      </div>
      <div class="empty-state" v-else-if="filteredOrders.length === 0">
        <div class="empty-icon">📋</div>
        <div class="empty-text">暂无订单</div>
        <div class="empty-hint">下拉刷新试试</div>
      </div>
      <div class="no-more" v-else-if="!hasMore && orderList.length">
        <span>没有更多了</span>
      </div>
    </div>

    <div class="order-detail-modal" v-if="showOrderDetail" @click="closeOrderDetail">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <span class="modal-title">订单详情</span>
          <span class="close-btn" @click="closeOrderDetail">×</span>
        </div>
        <div class="modal-body" v-if="currentOrder">
          <div class="detail-user">
            <img class="detail-avatar" :src="currentOrder.avatar" alt="" />
            <div class="detail-user-info">
              <div class="detail-nickname">{{ currentOrder.nickname }}</div>
              <div class="detail-level">Lv.{{ currentOrder.level }}</div>
            </div>
          </div>
          <div class="detail-status" :class="currentOrder.status">
            {{ getStatusText(currentOrder.status) }}
          </div>
          <div class="detail-section">
            <div class="detail-label">需求标题</div>
            <div class="detail-value">{{ currentOrder.title }}</div>
          </div>
          <div class="detail-section">
            <div class="detail-label">需求描述</div>
            <div class="detail-value">{{ currentOrder.desc }}</div>
          </div>
          <div class="detail-section">
            <div class="detail-label">服务标签</div>
            <div class="detail-tags">
              <span class="tag" v-for="(tag, idx) in currentOrder.tags" :key="idx">{{ tag }}</span>
            </div>
          </div>
          <div class="detail-row">
            <div class="detail-section">
              <div class="detail-label">价格</div>
              <div class="detail-value price">¥{{ currentOrder.price }}/{{ currentOrder.unit }}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">已接单</div>
              <div class="detail-value">{{ currentOrder.applyCount }}人</div>
            </div>
          </div>
          <div class="detail-section">
            <div class="detail-label">发布时间</div>
            <div class="detail-value">{{ formatTime(currentOrder.createTime) }}</div>
          </div>
          <div class="detail-actions" v-if="currentOrder.status === 'active'">
            <button class="action-btn primary" @click="applyOrder(currentOrder)">立即接单</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginManager } from '../composables/useLoginManager'

const router = useRouter()
const { requireLogin } = useLoginManager()

const activeTab = ref('all')
const loading = ref(false)
const hasMore = ref(true)
const showOrderDetail = ref(false)
const currentOrder = ref(null)
const pullTipVisible = ref(false)
const pullTipText = ref('下拉刷新')

let touchStartY = 0
let scrollStartY = 0

const orderList = ref([])

const filteredOrders = computed(() => {
  const activeOrders = orderList.value.filter(o => o.status === 'active')
  if (activeTab.value === 'new') {
    return [...activeOrders].sort((a, b) => b.createTime - a.createTime)
  } else if (activeTab.value === 'hot') {
    return [...activeOrders].sort((a, b) => b.applyCount - a.applyCount)
  }
  return activeOrders
})

const setTab = (tab) => {
  activeTab.value = tab
}

const onTouchStart = (e) => {
  touchStartY = e.touches[0].clientY
  scrollStartY = window.scrollY
}

const onTouchMove = (e) => {
  const currentY = e.touches[0].clientY
  const diff = touchStartY - currentY
  if (diff > 50 && window.scrollY === 0) {
    pullTipVisible.value = true
    pullTipText.value = '释放刷新...'
  }
}

const onTouchEnd = (e) => {
  const currentY = e.changedTouches[0].clientY
  const diff = touchStartY - currentY
  if (diff > 50 && window.scrollY === 0) {
    pullTipText.value = '刷新中...'
    setTimeout(() => {
      loadOrders()
      pullTipVisible.value = false
    }, 500)
  } else {
    pullTipVisible.value = false
  }
}

const formatTime = (timestamp) => {
  const now = new Date()
  const date = new Date(timestamp)
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const getStatusText = (status) => {
  const statusMap = {
    active: '进行中',
    closed: '已结束',
    finished: '已完成'
  }
  return statusMap[status] || status
}

const loadOrders = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  
  orderList.value = [
    {
      id: 1,
      avatar: '',
      nickname: '玩家小李',
      level: 18,
      title: '王者荣耀排位上分',
      desc: '需要一个打野陪玩，能带我飞的，钻石到星耀段位',
      tags: ['王者荣耀', '排位赛', '打野'],
      price: 35,
      unit: '小时',
      applyCount: 8,
      status: 'active',
      createTime: Date.now() - 1800000
    },
    {
      id: 2,
      avatar: '',
      nickname: '菜鸟玩家',
      level: 12,
      title: '和平精英娱乐局',
      desc: '找个会聊天的陪玩，一起打打娱乐局，开心最重要',
      tags: ['和平精英', '娱乐', '聊天'],
      price: 25,
      unit: '小时',
      applyCount: 15,
      status: 'active',
      createTime: Date.now() - 3600000
    },
    {
      id: 3,
      avatar: '',
      nickname: '原神玩家',
      level: 30,
      title: '原神刷本组队',
      desc: '需要一个熟悉原神的陪玩，一起刷圣遗物和材料',
      tags: ['原神', '刷本', '材料'],
      price: 30,
      unit: '小时',
      applyCount: 5,
      status: 'active',
      createTime: Date.now() - 7200000
    },
    {
      id: 4,
      avatar: '',
      nickname: '电竞小王子',
      level: 45,
      title: 'LOL灵活组排',
      desc: '找个辅助或打野一起打灵活组排，白银到黄金',
      tags: ['英雄联盟', '灵活组排', '辅助'],
      price: 40,
      unit: '小时',
      applyCount: 12,
      status: 'closed',
      createTime: Date.now() - 86400000
    }
  ]
  
  loading.value = false
  hasMore.value = false
}

const goOrderDetail = (item) => {
  console.log('订单详情:', item.id)
  currentOrder.value = item
  showOrderDetail.value = true
}

const closeOrderDetail = () => {
  showOrderDetail.value = false
  currentOrder.value = null
}

const goUserProfile = (item) => {
  console.log('查看用户资料:', item.nickname)
  router.push({ name: 'UserProfile', params: { id: item.id } })
}

const applyOrder = async (item) => {
  const loginResult = await requireLogin()
  if (!loginResult.loggedIn) {
    return
  }
  
  console.log('接单:', item.id)
  item.status = 'closed'
  item.applyCount++
  closeOrderDetail()
  alert(`成功申请 "${item.title}" 的订单！`)
}

const goBack = () => {
  window.history.back()
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.paidan-page {
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
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  height: 70px;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 650px;
  z-index: 100;
}

.header-back {
  position: absolute;
  left: 20px;
  font-size: 28px;
  color: white;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: white;
}

.tabs {
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  max-width: 650px;
  margin: 0 auto;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tab-count {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
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
  color: #667eea;
  font-size: 14px;
  background: linear-gradient(135deg, #f0f0ff 0%, #fff 100%);
}

.order-list {
  padding: 16px;
  max-width: 650px;
  margin: 0 auto;
}

.order-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  cursor: pointer;
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
  color: #667eea;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

@media (min-width: 768px) {
  .paidan-page {
    max-width: 650px;
    margin: 0 auto;
  }
  .header {
    max-width: 650px;
  }
}
@media (min-width: 1024px) {
  .paidan-page {
    max-width: 720px;
  }
  .header {
    max-width: 720px;
  }
}
</style>
