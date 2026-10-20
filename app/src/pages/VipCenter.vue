<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">VIP会员</text>
    </template>
    
    <view class="vip-card">
      <view class="card-background">
        <view class="vip-level">VIP {{ userVipLevel }}</view>
        <view class="expire-time">{{ expireTimeText }}</view>
      </view>
    </view>

    <view class="packages">
      <view class="section-title">套餐选择</view>
      <view class="package-list">
        <view 
          v-for="pkg in packages" 
          :key="pkg.id"
          :class="['package-item', { active: selectedPkgId === pkg.id }]"
          @click="selectPackage(pkg.id)"
        >
          <view class="pkg-top">
            <view class="pkg-icon">{{ pkg.icon }}</view>
            <view class="pkg-info">
              <view class="pkg-level">{{ pkg.name }}</view>
              <view class="pkg-desc">{{ pkg.desc }}</view>
            </view>
            <view class="pkg-price-block">
              <view class="price">
                <text class="price-value">{{ currentPkgPrice(pkg) }}</text>
                <text class="price-unit">金币</text>
              </view>
              <view class="original" v-if="currentPkgOriginal(pkg)"><s>{{ currentPkgOriginal(pkg) }} 金币</s></view>
            </view>
          </view>
          <view class="duration-selector" @click.stop>
            <view 
              v-for="d in pkg.durations" 
              :key="d.months"
              :class="['duration-option', { active: selectedDurations[pkg.id] === d.months }]"
              @click="selectDuration(pkg.id, d.months)"
            >
              {{ d.label }}
            </view>
          </view>
          <view class="pkg-benefits">
            <view class="benefit-line" v-for="b in pkg.benefits" :key="b">{{ b }}</view>
          </view>
          <button class="pkg-buy-btn" :class="{ active: selectedPkgId === pkg.id }" @click.stop="buyPackage(pkg)">
            {{ isLoading && selectedPkgId === pkg.id ? '处理中...' : '立即开通' }}
          </button>
        </view>
      </view>
    </view>

    <view class="privileges">
      <view class="section-title">专属特权</view>
      <view class="privilege-grid">
        <view class="privilege-item" v-for="p in privileges" :key="p.id" @click="goPrivilege(p)">
          <text class="icon">{{ p.icon }}</text>
          <text class="name">{{ p.name }}</text>
          <text class="vip-level-badge" :class="'vip' + p.vipLevel">{{ p.vipLabel }}</text>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from '@/common/route'
import { useUserStore } from '../store/user-info'
import { toast } from '../composables/useToast'
import { getVipPackages, getUserVipInfo, createVipOrder, completeVipOrder } from '../services/vipService'
import PageLayout from '../components/PageLayout.vue'

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

// onShow 返回本页会重新拉套餐；若直接套默认热门套餐，会把用户刚选中的套餐/时长重置。
// 刷新前记住当前选择，刷新后该套餐仍存在就恢复，否则才回退默认。
const restoreSelection = (prevPkgId, prevDurations, fallbackId) => {
  const list = packages.value
  if (!list.length) return
  const keptPkg = list.find(p => p.id === prevPkgId)
  const hotPkg = list.find(p => p.hot)
  const fallbackPkg = fallbackId ? list.find(p => p.id === fallbackId) : null
  selectedPkgId.value = keptPkg ? keptPkg.id : (hotPkg ? hotPkg.id : (fallbackPkg ? fallbackPkg.id : list[0].id))
  list.forEach(pkg => {
    const prevMonths = prevDurations[pkg.id]
    const canKeep = prevMonths && pkg.durations.some(d => d.months === prevMonths)
    selectedDurations.value[pkg.id] = canKeep ? prevMonths : pkg.durations[0].months
  })
}

const loadVipPackages = async () => {
  // 快照当前选择：本函数会被 onShow 反复调用，刷新不能重置用户选择
  const prevPkgId = selectedPkgId.value
  const prevDurations = { ...selectedDurations.value }
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
    // 套餐的价格、时长、等级由后端（管理端维护）下发；icon/desc/benefits 为展示文案，
    // 库表暂无对应列，缺失时按等级回退到内置文案。
    const metaByLevel = {}
    defaultPackages.forEach(p => { metaByLevel[p.level] = p })
    // request() 返回完整响应 { code, data }，套餐数组在 data 中；此前虽然解了一层 list，
    // 但 data 仍是响应壳，list 恒为空并静默回退到下面的硬编码套餐。
    const res = await getVipPackages()
    const data = res && res.data !== undefined ? res.data : res
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.list) ? data.list : [])
    packages.value = list.map(pkg => {
      const meta = metaByLevel[pkg.level] || {}
      return {
        ...pkg,
        icon: pkg.icon || meta.icon || '👑',
        desc: pkg.desc || meta.desc || `VIP${pkg.level} · ${pkg.duration}天`,
        benefits: pkg.benefits || meta.benefits || [],
        durations: (pkg.durations && pkg.durations.length)
          ? pkg.durations
          : [{ label: `${pkg.duration}天`, months: 1, price: String(pkg.price), original: pkg.original ? String(pkg.original) : null }]
      }
    })
    if (packages.value.length === 0) {
      packages.value = defaultPackages
    }
    // 默认回退套餐沿用原来的「铂金(id=2)」选择，避免首次加载失败时行为变化
    restoreSelection(prevPkgId, prevDurations, 2)
  } catch (error) {
    console.error('获取VIP套餐失败:', error)
    packages.value = defaultPackages
    restoreSelection(prevPkgId, prevDurations, 2)
  }
}

const loadUserVipInfo = async () => {
  if (!userStore.isLogin) {
    userVipLevel.value = 0
    vipExpireTime.value = null
    return
  }
  
  try {
    // request() 返回完整响应，会员信息在 data 中；此前取响应壳导致等级/到期时间恒 undefined。
    const res = await getUserVipInfo()
    const data = (res && res.data) || res || {}
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

  const pkg = packages.value.find(p => p.id === selectedPkgId.value)
  const months = selectedDurations.value[pkg?.id] || 1
  const dur = pkg?.durations.find(d => d.months === months)
  const price = Number(dur?.price || 0)
  if (price > 0 && userStore.balance < price) {
    toast.error('金币不足，请先充值')
    router.push('/recharge')
    return
  }

  isLoading.value = true

  try {
    // request() 返回完整响应，订单号在 data.orderNo；此前 order.orderNo 恒 undefined，
    // 会在 complete 时被后端 400「订单号不能为空」，VIP 开通 100% 失败。
    const res = await createVipOrder(selectedPkgId.value)
    const order = (res && res.data) || res || {}
    if (import.meta.env.DEV) console.log('创建订单成功:', order)

    await completeVipOrder(order.orderNo)
    if (import.meta.env.DEV) console.log('VIP开通成功')

    await loadUserVipInfo()
    // 服务端已完成扣币，刷新本地余额
    await userStore.fetchUserInfo()

    toast.success(`开通成功！${order.packageName || (pkg ? pkg.name : '')}`)
    router.back()
  } catch (error) {
    console.error('开通VIP失败:', error)
    if (String(error.message).includes('余额不足')) {
      toast.error('金币不足，请先充值')
      router.push('/recharge')
      return
    }
    toast.error(error.message || '开通失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

// 从充值页返回时余额可能已补足，静默刷新套餐与当前 VIP 等级/到期时间
const refreshOnShow = () => {
  loadVipPackages()
  loadUserVipInfo()
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

onMounted(() => {
  loadVipPackages()
  loadUserVipInfo()
})
</script>

<style scoped>
.back-btn {
  font-size: 24px;
  cursor: pointer;
  color: #fff;
  line-height: 1;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.vip-card {
  margin: 12px 0 0;
  background: white;
  border-radius: 0px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 1;
}

.card-background {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  padding: 24px;
  padding-top: 8px;
  padding-bottom: 8px;
  text-align: center;
  color: #FFFFFF;
  border-radius: 0px;
  width: 650px;
  max-width: 100%;
  box-sizing: border-box;
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
  padding: 16px 20px 12px;
}

.privilege-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  padding: 20px;
  background: white;
  /* 负 margin 抵消外层 padding，水平铺满页面限制框 */
  margin: 0;
  border-radius: 0px;
  gap: 16px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.privilege-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
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
  color: #7a5a00;
}

.vip-level-badge.vip2 {
  background: linear-gradient(135deg, #c0c0c0, #a0a0c0);
  color: #3a3a5a;
}

.vip-level-badge.vip3 {
  background: linear-gradient(135deg, #00b4d8, #0077b6);
  color: white;
}

.packages {
  margin-bottom: 8px;
}

.package-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 20px;
}

.package-item {
  background: white;
  border-radius: 0px;
  padding: 20px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  /* 负 margin 抵消 .package-list 的 20px padding，水平铺满页面限制框 */
  margin: 0 -20px;
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
}

.duration-option.active {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
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