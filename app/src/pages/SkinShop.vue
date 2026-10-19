<template>
  <div class="skin-shop-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">装扮商城</span>
      <span class="balance-display">
        <span class="balance-icon">💰</span>
        <span class="balance-value">{{ userBalance }}</span>
      </span>
    </div>

    <div class="tabs">
      <div class="tab-item" :class="{ active: activeTab === 'frame' }" @click="activeTab = 'frame'">头像框</div>
      <div class="tab-item" :class="{ active: activeTab === 'badge' }" @click="activeTab = 'badge'">身份标识</div>
      <div class="tab-item" :class="{ active: activeTab === 'bubble' }" @click="activeTab = 'bubble'">聊天气泡</div>
      <div class="tab-item" :class="{ active: activeTab === 'theme' }" @click="activeTab = 'theme'">主题皮肤</div>
    </div>

    <div class="content">
      <div class="skin-grid" v-if="activeTab === 'frame'">
        <div class="skin-card" v-for="item in frameList" :key="item.id" :class="{ owned: item.owned, using: item.using }" @click="actionItem(item)">
          <div class="skin-preview" :style="item.style">
            <img class="skin-avatar" :src="demoAvatar" alt="" />
          </div>
          <div class="skin-name">{{ item.name }}</div>
          <div class="skin-tag" v-if="item.using">使用中</div>
          <div class="skin-tag owned-tag" v-else-if="item.owned">已拥有</div>
          <div class="skin-price" v-else-if="!item.vipOnly">
            <span class="price-icon">💰</span>
            <span>{{ item.price }}</span>
          </div>
          <div class="skin-price vip-price" v-else>
            <span>VIP{{ item.vipLevel }}+</span>
          </div>
        </div>
      </div>

      <div class="skin-grid" v-if="activeTab === 'badge'">
        <div class="skin-card" v-for="item in badgeList" :key="item.id" :class="{ owned: item.owned, using: item.using }" @click="actionItem(item)">
          <div class="badge-preview" :style="item.style">
            <span class="badge-preview-icon">{{ item.icon }}</span>
            <span class="badge-preview-label">{{ item.label }}</span>
          </div>
          <div class="skin-name">{{ item.name }}</div>
          <div class="skin-tag" v-if="item.using">使用中</div>
          <div class="skin-tag owned-tag" v-else-if="item.owned">已拥有</div>
          <div class="skin-price" v-else-if="!item.vipOnly">
            <span class="price-icon">💰</span>
            <span>{{ item.price }}</span>
          </div>
          <div class="skin-price vip-price" v-else>
            <span>VIP{{ item.vipLevel }}+</span>
          </div>
        </div>
      </div>

      <div class="skin-grid" v-if="activeTab === 'bubble'">
        <div class="skin-card" v-for="item in bubbleList" :key="item.id" :class="{ owned: item.owned, using: item.using }" @click="actionItem(item)">
          <div class="bubble-preview" :style="item.style">
            <span class="bubble-text">{{ item.preview }}</span>
          </div>
          <div class="skin-name">{{ item.name }}</div>
          <div class="skin-tag" v-if="item.using">使用中</div>
          <div class="skin-tag owned-tag" v-else-if="item.owned">已拥有</div>
          <div class="skin-price" v-else-if="!item.vipOnly">
            <span class="price-icon">💰</span>
            <span>{{ item.price }}</span>
          </div>
          <div class="skin-price vip-price" v-else>
            <span>VIP{{ item.vipLevel }}+</span>
          </div>
        </div>
      </div>

      <div class="skin-grid" v-if="activeTab === 'theme'">
        <div class="skin-card" v-for="item in themeList" :key="item.id" :class="{ owned: item.owned, using: item.using }" @click="actionItem(item)">
          <div class="theme-preview" :style="{ background: item.bg }">
            <div class="theme-preview-item" :style="{ background: item.primary }"></div>
            <div class="theme-preview-item sm" :style="{ background: item.secondary }"></div>
          </div>
          <div class="skin-name">{{ item.name }}</div>
          <div class="skin-tag" v-if="item.using">使用中</div>
          <div class="skin-tag owned-tag" v-else-if="item.owned">已拥有</div>
          <div class="skin-price" v-else-if="!item.vipOnly">
            <span class="price-icon">💰</span>
            <span>{{ item.price }}</span>
          </div>
          <div class="skin-price vip-price" v-else>
            <span>VIP{{ item.vipLevel }}+</span>
          </div>
        </div>
      </div>
    </div>

    <div class="toast" v-if="toast.show">{{ toast.message }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from '@/common/route'
import { DEFAULT_AVATAR } from '@/common/constants'
import skinService from '../services/skinService'

const router = useRouter()

const userBalance = ref(0)
const demoAvatar = ref(DEFAULT_AVATAR)
const activeTab = ref('frame')
const busy = ref(false)

const toast = reactive({ show: false, message: '' })

const showToast = (msg) => {
  toast.message = msg
  toast.show = true
  setTimeout(() => { toast.show = false }, 2000)
}

// 审计 H-6：装扮目录、价格、VIP 门槛、所有权与扣款金额全部由服务端决定。
// 此前这里硬编码四个目录、把 owned/using 快照连同客户端自报的 spend 发给 /api/user/pref，
// 抓包改 spend=0 即可白拿任意装扮；现在组件只认 GET /api/user/skins 的返回，也不再写本地所有权缓存。
const frameList = ref([])
const badgeList = ref([])
const bubbleList = ref([])
const themeList = ref([])

const LISTS = { frame: frameList, badge: badgeList, bubble: bubbleList, theme: themeList }

const renderGroups = (payload) => {
  const groups = { frame: [], badge: [], bubble: [], theme: [] }
  const items = Array.isArray(payload.items) ? payload.items : []
  items.forEach((item) => {
    const group = groups[item.type]
    if (!group) return
    // 展示资源（style / icon / preview / bg 等）随目录一起下发，摊平后模板无需变化
    group.push({ ...item.assets, ...item })
  })
  Object.keys(groups).forEach((type) => { LISTS[type].value = groups[type] })
  if (payload.balance != null) userBalance.value = Number(payload.balance) || 0
}

const loadSkins = async () => {
  try {
    const res = await skinService.list()
    const payload = (res && res.data) || {}
    renderGroups(payload)
    if (payload.unlocked === false) showToast(`装扮商城需 Lv.${payload.needLevel} 解锁`)
  } catch (e) {
    showToast(e.message || '装扮列表加载失败')
  }
}

onMounted(loadSkins)

// 服务端是唯一事实来源：四类共用一个「使用中」位，成功后按回传刷新视图，
// 下次进页面仍以 GET /api/user/skins 为准。
const markUsed = (skinId) => {
  Object.keys(LISTS).forEach((type) => {
    LISTS[type].value.forEach((item) => {
      item.using = item.id === skinId
      if (item.id === skinId) item.owned = true
    })
  })
}

// 余额与 VIP 都不做本地预判：本地值可能已过期，判定权交给服务端，
// 用户看到的是服务端给出的真实原因（等级不足 / 需要 VIP / 金币不足）。
const actionItem = async (item) => {
  if (busy.value || item.using) return
  const wasOwned = !!item.owned
  busy.value = true
  try {
    const res = wasOwned
      ? await skinService.use(item.id)
      : await skinService.purchase(item.id)
    const payload = (res && res.data) || {}
    markUsed(payload.skin && payload.skin.id ? payload.skin.id : item.id)
    if (payload.balance != null) userBalance.value = Number(payload.balance) || 0
    if (payload.charged > 0) showToast(`购买成功，已切换至「${item.name}」`)
    else if (!wasOwned) showToast(`已获得「${item.name}」`)
    else showToast(`已切换至「${item.name}」`)
  } catch (e) {
    showToast(e.message || '操作失败')
  } finally {
    busy.value = false
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.skin-shop-page {
  min-height: 100dvh;
  background-color: #f5f5f5;
  padding-bottom: 80px;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;

  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--gradient-primary);
}

.back-btn {
  font-size: 20px;
  color: white;
  cursor: pointer;
  width: 40px;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.balance-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 14px;
  border-radius: 16px;
}

.balance-icon {
  font-size: 16px;
}

.balance-value {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.tabs {
  display: flex;
  background: white;
  padding: 0 12px;
  border-bottom: 1px solid #f0f0f0;
  overflow-x: auto;
  gap: 0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 14px 8px;
  font-size: 14px;
  color: #666;
  position: relative;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-item.active {
  color: #667eea;
  font-weight: 600;
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
  padding: 16px;
}

.skin-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.skin-card {
  background: white;
  border-radius: 0px;
  padding: 16px;
  text-align: center;
  border: 2px solid transparent;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.skin-card:active {
  transform: scale(0.97);
}

.skin-card.owned {
  border-color: transparent;
}

.skin-card.using {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.03);
}

.skin-preview {
  width: 80px;
  height: 80px;
  margin: 0 auto 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.skin-avatar {
  width: 74px;
  height: 74px;
  border-radius: 8px;
  object-fit: cover;
}

.skin-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 6px;
}

.skin-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 12px;
  border-radius: 10px;
  background: #667eea;
  color: white;
}

.skin-tag.owned-tag {
  background: #e5e5e5;
  color: #999;
}

.skin-price {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #ff6b6b;
}

.price-icon {
  font-size: 14px;
}

.skin-price.vip-price {
  color: #ff8c00;
}

.badge-preview {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 10px;
}

.badge-preview-icon {
  font-size: 16px;
}

.badge-preview-label {
  font-size: 12px;
}

.bubble-preview {
  display: inline-block;
  font-size: 13px;
  margin-bottom: 10px;
  max-width: 100%;
}

.bubble-text {
  font-size: 13px;
}

.theme-preview {
  width: 80px;
  height: 56px;
  border-radius: 10px;
  margin: 0 auto 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
}

.theme-preview-item {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

.theme-preview-item.sm {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.toast {
  position: fixed;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: white;
  font-size: 14px;
  padding: 12px 24px;
  border-radius: 10px;
  z-index: 1000;
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
