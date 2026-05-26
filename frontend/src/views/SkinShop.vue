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
        <div class="skin-card" v-for="item in frameList" :key="item.id" :class="{ owned: item.owned, using: item.using }" @click="actionItem(item, 'frame')">
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
        <div class="skin-card" v-for="item in badgeList" :key="item.id" :class="{ owned: item.owned, using: item.using }" @click="actionItem(item, 'badge')">
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
        <div class="skin-card" v-for="item in bubbleList" :key="item.id" :class="{ owned: item.owned, using: item.using }" @click="actionItem(item, 'bubble')">
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
        <div class="skin-card" v-for="item in themeList" :key="item.id" :class="{ owned: item.owned, using: item.using }" @click="actionItem(item, 'theme')">
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const userBalance = ref(12800)
const demoAvatar = ref('https://picsum.photos/200/200')
const activeTab = ref('frame')

const toast = reactive({ show: false, message: '' })

const showToast = (msg) => {
  toast.message = msg
  toast.show = true
  setTimeout(() => { toast.show = false }, 2000)
}

const frameList = ref([
  { id: 'sf1', name: '简约白边', style: { border: '3px solid #ddd', borderRadius: '10px', boxShadow: '0 0 6px rgba(0,0,0,0.1)' }, price: 0, owned: true, using: true, vipOnly: false },
  { id: 'sf2', name: '清新绿边', style: { border: '3px solid #2ecc71', borderRadius: '10px', boxShadow: '0 0 8px rgba(46,204,113,0.3)' }, price: 500, owned: true, using: false, vipOnly: false },
  { id: 'sf3', name: '活力橙边', style: { border: '3px solid #e67e22', borderRadius: '10px', boxShadow: '0 0 8px rgba(230,126,34,0.3)' }, price: 800, owned: false, using: false, vipOnly: false },
  { id: 'sf4', name: '梦幻粉边', style: { border: '3px solid #e84393', borderRadius: '10px', boxShadow: '0 0 10px rgba(232,67,147,0.4)' }, price: 1200, owned: false, using: false, vipOnly: false },
  { id: 'sf5', name: '深邃蓝边', style: { border: '3px solid #0984e3', borderRadius: '10px', boxShadow: '0 0 10px rgba(9,132,227,0.4)' }, price: 1500, owned: false, using: false, vipOnly: false },
  { id: 'sf6', name: '极光幻彩', style: { border: '3px solid transparent', borderRadius: '10px', boxShadow: '0 0 14px rgba(102,126,234,0.5)', background: 'linear-gradient(135deg, #667eea, #764ba2, #ffd700) padding-box, linear-gradient(135deg, #667eea, #764ba2, #ffd700) border-box' }, price: 3000, owned: false, using: false, vipOnly: false, vipLevel: 2 },
  { id: 'sf7', name: '烈焰金边', style: { border: '4px solid #ffd700', borderRadius: '10px', boxShadow: '0 0 18px rgba(255,215,0,0.5), 0 0 0 3px #fff' }, price: 5000, owned: false, using: false, vipOnly: false, vipLevel: 3 },
  { id: 'sf8', name: '暗夜流光', style: { border: '4px solid #6c5ce7', borderRadius: '10px', boxShadow: '0 0 20px rgba(108,92,231,0.5), 0 0 0 3px rgba(255,255,255,0.3)' }, price: 8888, owned: false, using: false, vipOnly: false, vipLevel: 4 },
])

const badgeList = ref([
  { id: 'sb1', name: '人气新星', icon: '🌟', label: '人气新星', style: { background: 'linear-gradient(135deg, #74b9ff, #0984e3)', color: '#fff', borderRadius: '10px', padding: '6px 14px' }, price: 0, owned: true, using: true, vipOnly: false },
  { id: 'sb2', name: '游戏达人', icon: '🎮', label: '游戏达人', style: { background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)', color: '#fff', borderRadius: '10px', padding: '6px 14px' }, price: 600, owned: false, using: false, vipOnly: false },
  { id: 'sb3', name: '社交达人', icon: '💬', label: '社交达人', style: { background: 'linear-gradient(135deg, #fd79a8, #e84393)', color: '#fff', borderRadius: '10px', padding: '6px 14px' }, price: 1000, owned: false, using: false, vipOnly: false },
  { id: 'sb4', name: '上分高手', icon: '🏆', label: '上分高手', style: { background: 'linear-gradient(135deg, #fdcb6e, #e17055)', color: '#fff', borderRadius: '10px', padding: '6px 14px' }, price: 2000, owned: false, using: false, vipOnly: false },
  { id: 'sb5', name: '神壕', icon: '💰', label: '神壕', style: { background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#fff', borderRadius: '10px', padding: '6px 14px' }, price: 5000, owned: false, using: false, vipOnly: false, vipLevel: 3 },
  { id: 'sb6', name: '全服偶像', icon: '💎', label: '全服偶像', style: { background: 'linear-gradient(135deg, #ff6b6b, #c0392b, #ffd700)', color: '#fff', borderRadius: '10px', padding: '6px 14px' }, price: 9999, owned: false, using: false, vipOnly: false, vipLevel: 4 },
])

const bubbleList = ref([
  { id: 'sbbl1', name: '默认气泡', preview: '你好呀~', style: { background: '#f0f0f0', color: '#333', borderRadius: '12px 12px 12px 4px', padding: '10px 16px' }, price: 0, owned: true, using: true, vipOnly: false },
  { id: 'sbbl2', name: '清新对话', preview: '你好呀~', style: { background: 'linear-gradient(135deg, #dfe6e9, #b2bec3)', color: '#2d3436', borderRadius: '12px 12px 12px 4px', padding: '10px 16px' }, price: 400, owned: false, using: false, vipOnly: false },
  { id: 'sbbl3', name: '可爱粉泡', preview: '你好呀~', style: { background: 'linear-gradient(135deg, #fd79a8, #e84393)', color: '#fff', borderRadius: '18px 18px 18px 4px', padding: '10px 18px' }, price: 800, owned: false, using: false, vipOnly: false },
  { id: 'sbbl4', name: '星空泡泡', preview: '你好呀~', style: { background: 'linear-gradient(135deg, #74b9ff, #0984e3)', color: '#fff', borderRadius: '16px 4px 16px 4px', padding: '10px 16px' }, price: 1200, owned: false, using: false, vipOnly: false },
  { id: 'sbbl5', name: '炫金气泡', preview: '你好呀~', style: { background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#fff', borderRadius: '20px 20px 4px 20px', padding: '10px 20px', boxShadow: '0 4px 12px rgba(255,215,0,0.3)' }, price: 2500, owned: false, using: false, vipOnly: false, vipLevel: 2 },
  { id: 'sbbl6', name: '暗夜贵族', preview: '你好呀~', style: { background: 'linear-gradient(135deg, #2d3436, #636e72)', color: '#ffd700', borderRadius: '12px 12px 4px 12px', padding: '10px 16px', border: '1px solid #ffd700' }, price: 4000, owned: false, using: false, vipOnly: false, vipLevel: 3 },
])

const themeList = ref([
  { id: 'sth1', name: '经典蓝', bg: '#f5f5f5', primary: '#667eea', secondary: '#764ba2', price: 0, owned: true, using: true, vipOnly: false },
  { id: 'sth2', name: '少女粉', bg: '#fff5f5', primary: '#fd79a8', secondary: '#e84393', price: 600, owned: false, using: false, vipOnly: false },
  { id: 'sth3', name: '森林绿', bg: '#f0fff4', primary: '#2ecc71', secondary: '#27ae60', price: 1000, owned: false, using: false, vipOnly: false },
  { id: 'sth4', name: '暗夜黑', bg: '#1a1a2e', primary: '#6c5ce7', secondary: '#a29bfe', price: 2000, owned: false, using: false, vipOnly: false },
  { id: 'sth5', name: '土豪金', bg: '#fff8e1', primary: '#ffd700', secondary: '#ff8c00', price: 3500, owned: false, using: false, vipOnly: false, vipLevel: 2 },
  { id: 'sth6', name: '极光紫', bg: '#f0e6ff', primary: '#a855f7', secondary: '#d946ef', price: 5000, owned: false, using: false, vipOnly: false, vipLevel: 3 },
])

const ownedMap = reactive({})
const usingMap = reactive({})

const loadData = () => {
  try {
    const saved = localStorage.getItem('skinShopData')
    if (saved) {
      const { owned, using, balance } = JSON.parse(saved)
      Object.assign(ownedMap, owned)
      Object.assign(usingMap, using)
      if (balance) userBalance.value = balance
    }
  } catch {}
}

const saveData = () => {
  localStorage.setItem('skinShopData', JSON.stringify({
    owned: { ...ownedMap },
    using: { ...usingMap },
    balance: userBalance.value
  }))
}

const actionItem = (item, type) => {
  const key = `${type}_${item.id}`
  if (usingMap[key]) return

  if (ownedMap[key]) {
    Object.keys(usingMap).forEach(k => { usingMap[k] = false })
    usingMap[key] = true
    saveData()
    showToast(`已切换至「${item.name}」`)
    return
  }

  if (item.price === 0) {
    ownedMap[key] = true
    Object.keys(usingMap).forEach(k => { usingMap[k] = false })
    usingMap[key] = true
    saveData()
    showToast(`已获得「${item.name}」`)
    return
  }

  if (item.vipOnly) {
    showToast(`需要 VIP${item.vipLevel} 及以上才可购买`)
    return
  }

  if (userBalance.value < item.price) {
    showToast('金币不足，请先充值')
    return
  }

  userBalance.value -= item.price
  ownedMap[key] = true
  Object.keys(usingMap).forEach(k => { usingMap[k] = false })
  usingMap[key] = true
  saveData()
  showToast(`购买成功！已切换至「${item.name}」`)
}

const syncData = (list, type) => {
  list.forEach(item => {
    const key = `${type}_${item.id}`
    if (ownedMap[key] === undefined) {
      ownedMap[key] = item.owned
    }
    if (usingMap[key] === undefined) {
      usingMap[key] = item.using
    }
    item.owned = ownedMap[key]
    item.using = usingMap[key]
  })
}

const goBack = () => {
  router.back()
}

loadData()
syncData(frameList.value, 'frame')
syncData(badgeList.value, 'badge')
syncData(bubbleList.value, 'bubble')
syncData(themeList.value, 'theme')
</script>

<style scoped>
.skin-shop-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  border-radius: 10px;
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
  background: linear-gradient(135deg, #667eea, #764ba2);
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
  border-radius: 14px;
  padding: 16px;
  text-align: center;
  border: 2px solid transparent;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
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
