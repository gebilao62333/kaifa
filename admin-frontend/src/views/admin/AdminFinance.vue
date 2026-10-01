<template>
  <div>
    <div v-if="loading" class="loading-wrap"><div class="spinner"></div><span>加载中...</span></div>
    <template v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">累计充值</div>
          <div class="stat-value">¥{{ fmt(stats.totalRecharge) }}</div>
          <div class="stat-sub">今日 ¥{{ fmt(stats.todayRecharge) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">充值笔数</div>
          <div class="stat-value">{{ stats.rechargeCount || 0 }}</div>
          <div class="stat-sub">已支付订单</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">累计提现</div>
          <div class="stat-value">¥{{ fmt(stats.totalWithdraw) }}</div>
          <div class="stat-sub">{{ stats.withdrawCount || 0 }} 笔已通过</div>
        </div>
        <div class="stat-card warn">
          <div class="stat-label">待处理提现</div>
          <div class="stat-value">{{ stats.pendingWithdraw || 0 }}</div>
          <div class="stat-sub">需要审核</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">礼物收入</div>
          <div class="stat-value">¥{{ fmt(stats.totalGift) }}</div>
          <div class="stat-sub">礼物消费总额</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">服务订单收入</div>
          <div class="stat-value">¥{{ fmt(stats.totalOrder) }}</div>
          <div class="stat-sub">下单总额</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">VIP订单收入</div>
          <div class="stat-value">¥{{ fmt(stats.totalVip) }}</div>
          <div class="stat-sub">已支付VIP</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">卡密销售收入</div>
          <div class="stat-value">¥{{ fmt(stats.totalCard) }}</div>
          <div class="stat-sub">已使用卡密</div>
        </div>
      </div>

      <div class="tabs">
        <button :class="['tab-btn', { active: activeTab === 'recharges' }]" @click="activeTab = 'recharges'">充值记录</button>
        <button :class="['tab-btn', { active: activeTab === 'withdraws' }]" @click="activeTab = 'withdraws'">提现记录</button>
        <button :class="['tab-btn', { active: activeTab === 'gifts' }]" @click="activeTab = 'gifts'">礼物记录</button>
        <button :class="['tab-btn', { active: activeTab === 'vip' }]" @click="activeTab = 'vip'">VIP套餐管理</button>
        <button :class="['tab-btn', { active: activeTab === 'recharge' }]" @click="activeTab = 'recharge'">充值金额</button>
      </div>
      <AdminRecharges v-show="activeTab === 'recharges'" />
      <AdminWithdraws v-show="activeTab === 'withdraws'" />
      <AdminGiftLogs v-show="activeTab === 'gifts'" />
      <AdminVipPackages v-show="activeTab === 'vip'" />
      <AdminRechargePackages v-show="activeTab === 'recharge'" />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import adminService from '../../services/adminService'
import { useToast } from '../../composables/useToast'
import AdminRecharges from './AdminRecharges.vue'
import AdminWithdraws from './AdminWithdraws.vue'
import AdminGiftLogs from './AdminGiftLogs.vue'
import AdminVipPackages from './AdminVipPackages.vue'
import AdminRechargePackages from './AdminRechargePackages.vue'
const toast = useToast()
const loading = ref(true)
const stats = ref({})
const activeTab = ref('recharges')
const fmt = (n) => (Number(n) || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const loadStats = async () => {
  loading.value = true
  try {
    const res = await adminService.getFinanceStats()
    if (res.code === 200 || res.code === 0) stats.value = res.data || {}
    else toast.error('加载财务数据失败')
  } catch (e) { toast.error('加载失败: ' + (e.message || '网络错误')) }
  finally { loading.value = false }
}
onMounted(loadStats)
</script>

<style scoped>
.loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: #999; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #f0f0f0; border-top-color: #1890ff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.stat-card { background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-top: 3px solid #1890ff; }
.stat-card.warn { border-top-color: #fa8c16; }
.stat-label { font-size: 13px; color: #666; margin-bottom: 8px; }
.stat-value { font-size: 22px; font-weight: 700; color: #333; }
.stat-sub { font-size: 12px; color: #999; margin-top: 6px; }
.tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #e8e8e8; }
.tab-btn { padding: 8px 20px; border: none; background: transparent; cursor: pointer; font-size: 14px; color: #666; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.tab-btn:hover { color: #1890ff; }
.tab-btn.active { color: #1890ff; border-bottom-color: #1890ff; font-weight: 600; }
</style>
