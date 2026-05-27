<template>
  <div class="vip-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">VIP会员</span>
    </div>
    
    <div class="vip-card">
      <div class="card-background">
        <div class="vip-level">VIP {{ userVipLevel }}</div>
        <div class="expire-time">{{ expireTimeText }}</div>
      </div>
    </div>

    <div class="packages">
      <div class="section-title">套餐选择</div>
      <div class="package-list">
        <div 
          v-for="pkg in packages" 
          :key="pkg.id"
          :class="['package-item', { active: selectedPkgId === pkg.id }]"
          @click="selectPackage(pkg.id)"
        >
          <div class="pkg-top">
            <div class="pkg-icon">{{ pkg.icon }}</div>
            <div class="pkg-info">
              <div class="pkg-level">{{ pkg.name }}</div>
              <div class="pkg-desc">{{ pkg.desc }}</div>
            </div>
            <div class="pkg-price-block">
              <div class="price">
                <span class="price-value">{{ currentPkgPrice(pkg) }}</span>
                <span class="price-unit">金币</span>
              </div>
              <div class="original" v-if="currentPkgOriginal(pkg)"><s>{{ currentPkgOriginal(pkg) }} 金币</s></div>
            </div>
          </div>
          <div class="duration-selector" @click.stop>
            <div 
              v-for="d in pkg.durations" 
              :key="d.months"
              :class="['duration-option', { active: selectedDurations[pkg.id] === d.months }]"
              @click="selectDuration(pkg.id, d.months)"
            >
              {{ d.label }}
            </div>
          </div>
          <div class="pkg-benefits">
            <div class="benefit-line" v-for="b in pkg.benefits" :key="b">{{ b }}</div>
          </div>
          <button class="pkg-buy-btn" :class="{ active: selectedPkgId === pkg.id }" @click.stop="buyPackage(pkg)">
            {{ isLoading && selectedPkgId === pkg.id ? '处理中...' : '立即开通' }}
          </button>
        </div>
      </div>
    </div>

    <div class="privileges">
      <div class="section-title">专属特权</div>
      <div class="privilege-grid">
        <div class="privilege-item" v-for="p in privileges" :key="p.id" @click="goPrivilege(p)">
          <span class="icon">{{ p.icon }}</span>
          <span class="name">{{ p.name }}</span>
          <span class="vip-level-badge" :class="'vip' + p.vipLevel">{{ p.vipLabel }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user-info'
import { toast } from '../composables/useToast'
import { getVipPackages, getUserVipInfo, createVipOrder, completeVipOrder } from '../services/vipService'

const router = useRouter()
const userStore = useUserStore()

const userVipLevel = ref(0)
const vipExpireTime = ref(null)
const selectedPkgId = ref(null)
const selectedDurations = ref({})
const packages = ref([])
const isLoading = ref(false)

const privileges = ref([
  { id: 1, name: '专属头像框', icon: '👑', route: '/avatar-frame', vipLevel: 1, vipLabel: '黄金' },
  { id: 2, name: '身份标识', icon: '⭐', route: '/identity-badge', vipLevel: 1, vipLabel: '黄金' },
  { id: 3, name: '隐身访问', icon: '👻', route: '/stealth-visit', vipLevel: 1, vipLabel: '黄金' },
  { id: 4, name: '等级加速', icon: '🚀', route: '/level-acceleration', vipLevel: 2, vipLabel: '铂金' },
  { id: 5, name: '优先匹配', icon: '⚡', route: '/priority-matching', vipLevel: 2, vipLabel: '铂金' },
  { id: 6, name: '装扮商城', icon: '🎨', route: '/skin-shop', vipLevel: 2, vipLabel: '铂金' },
  { id: 7, name: '专属客服', icon: '🎧', route: '/customer-service', vipLevel: 3, vipLabel: '钻石' },
])

const expireTimeText = computed(() => {
  if (!vipExpireTime.value || vipExpireTime.value === 0) {
    return '尚未开通VIP'
  }
  const date = new Date(vipExpireTime.value * 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `到期时间：${year}-${month}-${day}`
})

const selectPackage = (pkgId) => {
  selectedPkgId.value = pkgId
}

const selectDuration = (pkgId, months) => {
  selectedDurations.value = { ...selectedDurations.value, [pkgId]: months }
}

const currentPkgPrice = (pkg) => {
  const months = selectedDurations.value[pkg.id] || pkg.durations[0].months
  const dur = pkg.durations.find(d => d.months === months)
  return dur ? dur.price : pkg.durations[0].price
}

const currentPkgOriginal = (pkg) => {
  const months = selectedDurations.value[pkg.id] || pkg.durations[0].months
  const dur = pkg.durations.find(d => d.months === months)
  return dur && dur.original ? dur.original : null
}

const buyPackage = (pkg) => {
  selectedPkgId.value = pkg.id
  buyVip()
}

const goBack = () => {
  router.back()
}

const goPrivilege = (p) => {
  if (p.route) {
    router.push(p.route)
  }
}

const loadVipPackages = async () => {
  const defaultPackages = [
    {
      id: 1,
      name: '黄金会员',
      icon: '🥇',
      desc: '入门VIP体验',
      level: 1,
      benefits: ['专属头像框', '身份标识', '隐身访问'],
      durations: [
        { label: '1个月', months: 1, price: '980', original: '1980' },
        { label: '季度', months: 3, price: '2680', original: '4980' },
        { label: '半年', months: 6, price: '4980', original: '8980' },
        { label: '1年', months: 12, price: '8980', original: '15980' },
      ]
    },
    {
      id: 2,
      name: '铂金会员',
      icon: '💎',
      desc: '热门精选 · 性价比最高',
      level: 2,
      benefits: ['含黄金全部权益', '等级加速1.5x', '优先匹配', '装扮商城折扣'],
      durations: [
        { label: '1个月', months: 1, price: '2680', original: '4980' },
        { label: '季度', months: 3, price: '6980', original: '12980' },
        { label: '半年', months: 6, price: '12980', original: '23980' },
        { label: '1年', months: 12, price: '23980', original: '43980' },
      ]
    },
    {
      id: 3,
      name: '钻石会员',
      icon: '👑',
      desc: '尊享全部特权',
      level: 3,
      benefits: ['含铂金全部权益', '等级加速2.0x', '专属客服', '所有装扮免费'],
      durations: [
        { label: '1个月', months: 1, price: '6680', original: '12980' },
        { label: '季度', months: 3, price: '16980', original: '32980' },
        { label: '半年', months: 6, price: '31980', original: '59980' },
        { label: '1年', months: 12, price: '59980', original: '119980' },
      ]
    }
  ]
  try {
    const data = await getVipPackages()
    packages.value = data
    if (data.length > 0) {
      const hotPkg = data.find(p => p.hot)
      selectedPkgId.value = hotPkg ? hotPkg.id : data[0].id
      data.forEach(pkg => {
        selectedDurations.value[pkg.id] = pkg.durations[0].months
      })
    } else {
      packages.value = defaultPackages
      selectedPkgId.value = 2
      defaultPackages.forEach(pkg => {
        selectedDurations.value[pkg.id] = pkg.durations[0].months
      })
    }
  } catch (error) {
    console.error('获取VIP套餐失败:', error)
    packages.value = defaultPackages
    selectedPkgId.value = 2
    defaultPackages.forEach(pkg => {
      selectedDurations.value[pkg.id] = pkg.durations[0].months
    })
  }
}

const loadUserVipInfo = async () => {
  if (!userStore.isLogin) {
    userVipLevel.value = 0
    vipExpireTime.value = null
    return
  }
  
  try {
    const data = await getUserVipInfo()
    userVipLevel.value = data.vipLevel
    vipExpireTime.value = data.expireTime
  } catch (error) {
    console.error('获取VIP信息失败:', error)
    userVipLevel.value = userStore.vipLevel || 2
    vipExpireTime.value = null
  }
}

const buyVip = async () => {
  if (!selectedPkgId.value || isLoading.value) return
  
  isLoading.value = true
  
  const pkg = packages.value.find(p => p.id === selectedPkgId.value)
  const months = selectedDurations.value[pkg?.id] || 1
  const dur = pkg?.durations.find(d => d.months === months)
  
  try {
    const order = await createVipOrder({
      packageId: selectedPkgId.value,
      months: months,
      price: dur?.price || '0'
    })
    console.log('创建订单成功:', order)

    await completeVipOrder(order.orderNo)
    console.log('VIP开通成功')

    await loadUserVipInfo()

    toast.success(`开通成功！${order.packageName || (pkg ? pkg.name + ' ' + (dur ? dur.label : '') : '')}`)
    router.back()
  } catch (error) {
    console.error('开通VIP失败:', error)
    toast.error('开通失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadVipPackages()
  loadUserVipInfo()
})
</script>

<style scoped>
.vip-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: #f5f5f5;
  padding-top: 70px;
  padding-bottom: 80px;
  padding-bottom: calc(80px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  height: 70px;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  background: -webkit-linear-gradient(315deg, #ffd700, #ff8c00);
  color: white;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 650px;
  z-index: 100;
}

.back-btn {
  position: absolute;
  left: 20px;
  font-size: 24px;
  cursor: pointer;
  color: #fff;
  line-height: 1;
  -webkit-tap-highlight-color: transparent;
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  flex: 1;
}

.vip-card {
  margin: 16px auto 20px;
  max-width: 650px;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
}

.card-background {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  background: -webkit-linear-gradient(315deg, #ffd700, #ff8c00);
  padding: 24px;
  padding-top: 8px;
  padding-bottom: 8px;
  text-align: center;
  color: white;
  border-radius: 10px 10px 0 0;
  height: 80px;
}

.vip-level {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.expire-time {
  font-size: 13px;
  opacity: 0.9;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  padding: 16px 12px 12px;
  max-width: 650px;
  margin: 0 auto;
}

.privilege-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  padding: 20px 12px;
  background: white;
  max-width: 650px;
  margin: 0 auto;
  border-radius: 10px;
  gap: 16px 0;
}

.privilege-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  -webkit-tap-highlight-color: transparent;
}

.privilege-item .icon {
  font-size: 32px;
}

.privilege-item .name {
  font-size: 12px;
  color: #666;
}

.vip-level-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
  color: white;
  line-height: 1.5;
}

.vip-level-badge.vip1 {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  background: -webkit-linear-gradient(315deg, #ffd700, #ffaa00);
  color: #7a5a00;
}

.vip-level-badge.vip2 {
  background: linear-gradient(135deg, #c0c0c0, #a0a0c0);
  background: -webkit-linear-gradient(315deg, #c0c0c0, #a0a0c0);
  color: #3a3a5a;
}

.vip-level-badge.vip3 {
  background: linear-gradient(135deg, #00b4d8, #0077b6);
  background: -webkit-linear-gradient(315deg, #00b4d8, #0077b6);
  color: white;
}

.packages {
  margin-bottom: 8px;
  max-width: 650px;
  margin-left: auto;
  margin-right: auto;
}

.package-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 12px;
}

.package-item {
  background: white;
  border-radius: 10px;
  padding: 20px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  -webkit-transition: all 0.3s ease;
  -webkit-tap-highlight-color: transparent;
}

.package-item.active {
  border-color: #ff8c00;
  background: #fffaf0;
  box-shadow: 0 4px 20px rgba(255, 140, 0, 0.15);
}

.pkg-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.pkg-icon {
  font-size: 40px;
  flex-shrink: 0;
}

.pkg-info {
  flex: 1;
  min-width: 0;
}

.pkg-level {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}

.pkg-desc {
  font-size: 13px;
  color: #999;
  line-height: 1.4;
}

.pkg-price-block {
  text-align: right;
  flex-shrink: 0;
}

.package-item .price {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 2px;
}

.price-value {
  font-size: 26px;
  font-weight: bold;
  color: #ff6b6b;
  line-height: 1;
}

.price-unit {
  font-size: 12px;
  color: #ff6b6b;
}

.package-item .original {
  font-size: 12px;
  color: #ccc;
  margin-top: 2px;
}

.duration-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.duration-option {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  padding: 7px 0;
  border-radius: 8px;
  background: #f5f5f5;
  color: #888;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  -webkit-transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.duration-option.active {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  background: -webkit-linear-gradient(315deg, #ffd700, #ff8c00);
  color: white;
  font-weight: 600;
}

.package-item.active .duration-option.active {
  background: linear-gradient(135deg, #ff8c00, #ff6b00);
}

.pkg-benefits {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.benefit-line {
  font-size: 12px;
  color: #666;
  padding: 4px 12px;
  background: #f9f9f9;
  border-radius: 12px;
  line-height: 1.4;
}

.package-item.active .benefit-line {
  background: rgba(255, 140, 0, 0.1);
  color: #8c5a00;
}

.pkg-buy-btn {
  width: 100%;
  padding: 10px 0;
  border: none;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  background: #f0f0f0;
  color: #bbb;
}

.pkg-buy-btn.active {
  background: linear-gradient(135deg, #ff8c00, #ff6b00);
  color: white;
}

.pkg-buy-btn:not(.active):hover {
  background: #e0e0e0;
}
</style>