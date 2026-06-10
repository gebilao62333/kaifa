<template>
  <div class="admin-card api-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="search-bar">
        <input v-model="searchKeyword" type="text" placeholder="搜索接口路径或描述..." class="search-input" @input="handleSearch" />
        <select v-model="filterMethod" class="search-select">
          <option value="">全部方法</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
        <select v-model="filterModule" class="search-select">
          <option value="">全部模块</option>
          <option v-for="m in modules" :key="m.key" :value="m.key">{{ m.name }}</option>
        </select>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-row">
      <div class="stat-item" @click="filterMethod = ''; filterModule = ''" style="cursor:pointer">
        <span class="stat-num">{{ allEndpoints.length }}</span>
        <span class="stat-label">接口总数</span>
      </div>
      <div class="stat-item" @click="filterMethod = 'GET'" style="cursor:pointer">
        <span class="stat-num get">{{ methodCount.GET }}</span>
        <span class="stat-label">GET</span>
      </div>
      <div class="stat-item" @click="filterMethod = 'POST'" style="cursor:pointer">
        <span class="stat-num post">{{ methodCount.POST }}</span>
        <span class="stat-label">POST</span>
      </div>
      <div class="stat-item" @click="filterMethod = 'PUT'" style="cursor:pointer">
        <span class="stat-num put">{{ methodCount.PUT }}</span>
        <span class="stat-label">PUT</span>
      </div>
      <div class="stat-item" @click="filterMethod = 'DELETE'" style="cursor:pointer">
        <span class="stat-num delete">{{ methodCount.DELETE }}</span>
        <span class="stat-label">DELETE</span>
      </div>
    </div>

    <!-- 接口列表 -->
    <div class="api-list" v-if="filteredModules.length > 0">
      <div v-for="mod in filteredModules" :key="mod.key" class="api-section">
        <div class="api-section-header" @click="toggleSection(mod.key)" style="cursor:pointer">
          <h3 class="api-section-title">
            <span class="section-icon">{{ collapsedSections[mod.key] ? '▶' : '▼' }}</span>
            <span class="section-icon">{{ mod.icon }}</span>
            {{ mod.name }}
          </h3>
          <span class="section-count">{{ getModuleEndpoints(mod.key).length }} 个接口</span>
        </div>
        <table class="data-table" v-if="!collapsedSections[mod.key]">
          <thead>
            <tr>
              <th style="width: 30%">路径</th>
              <th style="width: 10%">方法</th>
              <th>描述</th>
              <th style="width: 8%">认证</th>
              <th style="width: 12%">操作</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(ep, idx) in getModuleEndpoints(mod.key)" :key="idx">
              <tr :class="{ 'api-row-expanded': expandedEp === mod.key + '-' + idx }">
                <td>
                  <code class="api-path">{{ ep.path }}</code>
                </td>
                <td>
                  <span :class="['method-badge', ep.method.toLowerCase()]">{{ ep.method }}</span>
                </td>
                <td>{{ ep.desc }}</td>
                <td>
                  <span v-if="ep.auth" class="auth-badge">🔒</span>
                  <span v-else class="auth-badge public">🌐</span>
                </td>
                <td>
                  <div class="api-actions">
                    <button @click="copyPath(ep.path)" class="action-btn-sm" title="复制路径">📋</button>
                    <button @click="toggleExpand(mod.key, idx)" class="action-btn-sm" title="curl示例">💻</button>
                  </div>
                </td>
              </tr>
              <tr v-if="expandedEp === mod.key + '-' + idx" class="api-curl-row">
                <td colspan="5">
                  <div class="curl-box">
                    <div class="curl-header">
                      <span class="curl-title">cURL 示例</span>
                      <button @click="copyCurl(ep)" class="copy-curl-btn">📋 复制</button>
                    </div>
                    <pre class="curl-code">{{ generateCurl(ep) }}</pre>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>未找到匹配的接口</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { toast } = useAdmin()

const searchKeyword = ref('')
const filterMethod = ref('')
const filterModule = ref('')
const expandedEp = ref('')
const collapsedSections = reactive({})

const toggleSection = (key) => {
  collapsedSections[key] = !collapsedSections[key]
}

const toggleExpand = (modKey, idx) => {
  const epKey = modKey + '-' + idx
  expandedEp.value = expandedEp.value === epKey ? '' : epKey
}

const copyPath = (path) => {
  navigator.clipboard.writeText(path).then(() => {
    toast('路径已复制: ' + path)
  }).catch(() => {
    toast('复制失败', 'error')
  })
}

const generateCurl = (ep) => {
  let curl = `curl -X ${ep.method}`
  if (!ep.auth) {
    curl += ` "${window.location.origin}${ep.path}"`
  } else {
    curl += ` -H "Authorization: Bearer <token>"`
    curl += ` -H "Content-Type: application/json"`
    if (ep.method === 'POST' || ep.method === 'PUT') {
      curl += ` -d '{}'`
    }
    curl += ` "${window.location.origin}${ep.path}"`
  }
  return curl
}

const copyCurl = (ep) => {
  const curl = generateCurl(ep)
  navigator.clipboard.writeText(curl).then(() => {
    toast('cURL命令已复制')
  }).catch(() => {
    toast('复制失败', 'error')
  })
}

// 接口数据定义
const apiData = [
  // ========== 系统接口 ==========
  { module: 'system', path: '/api/', method: 'GET', desc: '服务根信息（名称、版本）', auth: false },
  { module: 'system', path: '/api/health', method: 'GET', desc: '健康检查', auth: false },
  { module: 'system', path: '/api/health/db', method: 'GET', desc: '数据库健康检查', auth: false },
  { module: 'system', path: '/api/test', method: 'GET', desc: 'API 测试端点', auth: false },

  // ========== 用户接口 ==========
  { module: 'user', path: '/api/user/login', method: 'POST', desc: '用户登录', auth: false },
  { module: 'user', path: '/api/user/register', method: 'POST', desc: '用户注册', auth: false },
  { module: 'user', path: '/api/user/reset-password', method: 'POST', desc: '重置密码', auth: false },
  { module: 'user', path: '/api/user/login-mobile', method: 'POST', desc: '手机验证码登录', auth: false },
  { module: 'user', path: '/api/user/login-third', method: 'POST', desc: '第三方登录', auth: false },
  { module: 'user', path: '/api/user/send-sms', method: 'POST', desc: '发送短信验证码', auth: false },
  { module: 'user', path: '/api/user/refresh-token', method: 'POST', desc: '刷新 Token', auth: false },
  { module: 'user', path: '/api/user/get', method: 'GET', desc: '获取用户信息', auth: true },
  { module: 'user', path: '/api/user/update', method: 'POST', desc: '更新用户信息', auth: true },
  { module: 'user', path: '/api/user/follow', method: 'POST', desc: '关注用户', auth: true },
  { module: 'user', path: '/api/user/fans', method: 'GET', desc: '获取粉丝列表', auth: true },
  { module: 'user', path: '/api/user/follows', method: 'GET', desc: '获取关注列表', auth: true },

  // ========== 聊天接口 ==========
  { module: 'chat', path: '/api/chat/list', method: 'GET', desc: '获取聊天列表', auth: true },
  { module: 'chat', path: '/api/chat/messages', method: 'GET', desc: '获取消息记录', auth: true },
  { module: 'chat', path: '/api/chat/send', method: 'POST', desc: '发送消息', auth: true },
  { module: 'chat', path: '/api/chat/revoke', method: 'POST', desc: '撤回消息', auth: true },
  { module: 'chat', path: '/api/chat/mark-read', method: 'POST', desc: '标记已读', auth: true },
  { module: 'chat', path: '/api/chat/room/create', method: 'POST', desc: '创建聊天房间', auth: true },
  { module: 'chat', path: '/api/chat/room/info', method: 'GET', desc: '获取房间信息', auth: true },
  { module: 'chat', path: '/api/chat/rooms', method: 'GET', desc: '获取所有房间列表', auth: false },

  // ========== 礼物接口 ==========
  { module: 'gift', path: '/api/gift/list', method: 'GET', desc: '获取礼物列表', auth: false },
  { module: 'gift', path: '/api/gift/send', method: 'POST', desc: '发送礼物', auth: true },
  { module: 'gift', path: '/api/gift/bag', method: 'GET', desc: '获取礼物背包', auth: true },
  { module: 'gift', path: '/api/gift/withdraw', method: 'POST', desc: '提现', auth: true },
  { module: 'gift', path: '/api/gift/admin/withdraw/list', method: 'GET', desc: '管理员-获取提现列表', auth: true },
  { module: 'gift', path: '/api/gift/admin/withdraw/approve', method: 'POST', desc: '管理员-批准提现', auth: true },
  { module: 'gift', path: '/api/gift/admin/withdraw/reject', method: 'POST', desc: '管理员-拒绝提现', auth: true },
  { module: 'gift', path: '/api/gift/redpacket/send', method: 'POST', desc: '发送红包', auth: true },
  { module: 'gift', path: '/api/gift/redpacket/receive', method: 'POST', desc: '领取红包', auth: true },
  { module: 'gift', path: '/api/gift/redpacket/history', method: 'GET', desc: '红包历史记录', auth: true },

  // ========== 支付接口 ==========
  { module: 'pay', path: '/api/pay/packages', method: 'GET', desc: '获取充值套餐列表', auth: false },
  { module: 'pay', path: '/api/pay/create-order', method: 'POST', desc: '创建充值订单', auth: true },
  { module: 'pay', path: '/api/pay/wx-order', method: 'POST', desc: '创建微信支付订单', auth: true },
  { module: 'pay', path: '/api/pay/wx-notify', method: 'POST', desc: '微信支付通知回调', auth: false },
  { module: 'pay', path: '/api/pay/wx-query', method: 'GET', desc: '查询微信订单', auth: true },
  { module: 'pay', path: '/api/pay/wx-close', method: 'POST', desc: '关闭微信订单', auth: true },
  { module: 'pay', path: '/api/pay/wx-callback', method: 'POST', desc: '微信支付回调', auth: false },
  { module: 'pay', path: '/api/pay/order-status', method: 'GET', desc: '查询订单状态', auth: true },
  { module: 'pay', path: '/api/pay/validate-card', method: 'POST', desc: '验证卡密', auth: false },
  { module: 'pay', path: '/api/pay/use-card', method: 'POST', desc: '使用卡密', auth: true },
  { module: 'pay', path: '/api/pay/recharge/list', method: 'GET', desc: '获取充值记录', auth: false },
  { module: 'pay', path: '/api/pay/wallet/balance', method: 'GET', desc: '获取钱包余额', auth: true },
  { module: 'pay', path: '/api/pay/wallet/recharge', method: 'POST', desc: '钱包充值', auth: true },
  { module: 'pay', path: '/api/pay/payment/history', method: 'GET', desc: '支付历史', auth: true },
  { module: 'pay', path: '/api/pay/pay/create', method: 'POST', desc: '创建支付', auth: true },
  { module: 'pay', path: '/api/pay/pay/notify', method: 'POST', desc: '支付通知回调', auth: false },

  // ========== 游戏陪玩接口 ==========
  { module: 'game', path: '/api/games/categories', method: 'GET', desc: '获取游戏分类', auth: false },
  { module: 'game', path: '/api/games/companions', method: 'GET', desc: '获取陪玩师列表', auth: false },
  { module: 'game', path: '/api/games/companions/:id', method: 'GET', desc: '获取陪玩师详情', auth: false },
  { module: 'game', path: '/api/games/push', method: 'POST', desc: '推送订单', auth: true },
  { module: 'game', path: '/api/games/grab', method: 'POST', desc: '抢单', auth: true },
  { module: 'game', path: '/api/games/start', method: 'POST', desc: '开始服务', auth: true },
  { module: 'game', path: '/api/games/complete', method: 'POST', desc: '完成服务', auth: true },
  { module: 'game', path: '/api/games/cancel', method: 'POST', desc: '取消订单', auth: true },

  // ========== 管理后台接口 ==========
  { module: 'admin', path: '/api/admin/dashboard', method: 'GET', desc: '获取仪表盘统计数据', auth: true },
  // 用户管理
  { module: 'admin', path: '/api/admin/users', method: 'GET', desc: '获取用户列表', auth: true },
  { module: 'admin', path: '/api/admin/users/:id', method: 'GET', desc: '获取用户详情', auth: true },
  { module: 'admin', path: '/api/admin/users', method: 'POST', desc: '创建用户', auth: true },
  { module: 'admin', path: '/api/admin/users/:id', method: 'PUT', desc: '更新用户', auth: true },
  { module: 'admin', path: '/api/admin/users/:id/status', method: 'PUT', desc: '更新用户状态', auth: true },
  { module: 'admin', path: '/api/admin/users/:id', method: 'DELETE', desc: '删除用户', auth: true },
  // Banner管理
  { module: 'admin', path: '/api/admin/banners', method: 'GET', desc: '获取Banner列表', auth: true },
  { module: 'admin', path: '/api/admin/banners/:id', method: 'GET', desc: '获取Banner详情', auth: true },
  { module: 'admin', path: '/api/admin/banners', method: 'POST', desc: '创建Banner', auth: true },
  { module: 'admin', path: '/api/admin/banners/:id', method: 'PUT', desc: '更新Banner', auth: true },
  { module: 'admin', path: '/api/admin/banners/:id/status', method: 'PUT', desc: '更新Banner状态', auth: true },
  { module: 'admin', path: '/api/admin/banners/:id', method: 'DELETE', desc: '删除Banner', auth: true },
  // 帖子管理
  { module: 'admin', path: '/api/admin/posts', method: 'GET', desc: '获取帖子列表', auth: true },
  { module: 'admin', path: '/api/admin/posts/:id', method: 'DELETE', desc: '删除帖子', auth: true },
  // 订单管理
  { module: 'admin', path: '/api/admin/orders', method: 'GET', desc: '获取订单列表', auth: true },
  // 充值管理
  { module: 'admin', path: '/api/admin/recharges', method: 'GET', desc: '获取充值记录列表', auth: true },
  // 礼物管理
  { module: 'admin', path: '/api/admin/gifts', method: 'GET', desc: '获取礼物列表', auth: true },
  { module: 'admin', path: '/api/admin/gifts', method: 'POST', desc: '创建礼物', auth: true },
  { module: 'admin', path: '/api/admin/gifts/:id', method: 'PUT', desc: '更新礼物', auth: true },
  { module: 'admin', path: '/api/admin/gifts/:id', method: 'DELETE', desc: '删除礼物', auth: true },
  { module: 'admin', path: '/api/admin/gift-logs', method: 'GET', desc: '获取礼物记录', auth: true },
  // 游戏管理
  { module: 'admin', path: '/api/admin/games', method: 'GET', desc: '获取游戏分类列表', auth: true },
  { module: 'admin', path: '/api/admin/games', method: 'POST', desc: '创建游戏分类', auth: true },
  { module: 'admin', path: '/api/admin/games/:id', method: 'PUT', desc: '更新游戏分类', auth: true },
  { module: 'admin', path: '/api/admin/games/:id', method: 'DELETE', desc: '删除游戏分类', auth: true },
  // 举报管理
  { module: 'admin', path: '/api/admin/reports', method: 'GET', desc: '获取举报列表', auth: true },
  { module: 'admin', path: '/api/admin/reports/:id', method: 'PUT', desc: '处理举报', auth: true },
  // VIP管理
  { module: 'admin', path: '/api/admin/vip-packages', method: 'GET', desc: '获取VIP套餐列表', auth: true },
  { module: 'admin', path: '/api/admin/vip-packages', method: 'POST', desc: '创建VIP套餐', auth: true },
  { module: 'admin', path: '/api/admin/vip-packages/:id', method: 'PUT', desc: '更新VIP套餐', auth: true },
  { module: 'admin', path: '/api/admin/vip-packages/:id', method: 'DELETE', desc: '删除VIP套餐', auth: true },
  // 虚拟用户
  { module: 'admin', path: '/api/admin/virtual-users', method: 'GET', desc: '获取虚拟用户列表', auth: true },
  { module: 'admin', path: '/api/admin/virtual-users', method: 'POST', desc: '创建虚拟用户', auth: true },
  { module: 'admin', path: '/api/admin/virtual-users/:id', method: 'PUT', desc: '更新虚拟用户', auth: true },
  { module: 'admin', path: '/api/admin/virtual-users/:id', method: 'DELETE', desc: '删除虚拟用户', auth: true },
  // 推荐管理
  { module: 'admin', path: '/api/admin/recommends', method: 'GET', desc: '获取推荐列表', auth: true },
  { module: 'admin', path: '/api/admin/recommends', method: 'POST', desc: '添加推荐', auth: true },
  { module: 'admin', path: '/api/admin/recommends/:id', method: 'DELETE', desc: '删除推荐', auth: true },
  // 客服管理
  { module: 'admin', path: '/api/admin/customer-service', method: 'GET', desc: '获取客服列表', auth: true },
  { module: 'admin', path: '/api/admin/customer-service', method: 'POST', desc: '添加客服', auth: true },
  { module: 'admin', path: '/api/admin/customer-service/:id', method: 'PUT', desc: '更新客服', auth: true },
  { module: 'admin', path: '/api/admin/customer-service/:id', method: 'DELETE', desc: '删除客服', auth: true },
  // 陪玩申请
  { module: 'admin', path: '/api/admin/companion-applications', method: 'GET', desc: '获取陪玩申请列表', auth: true },
  { module: 'admin', path: '/api/admin/companion-applications/:id', method: 'PUT', desc: '审核陪玩申请', auth: true },
  // 提现管理
  { module: 'admin', path: '/api/admin/withdraws', method: 'GET', desc: '获取提现记录列表', auth: true },

  // ========== 管理员管理接口 ==========
  { module: 'adminManage', path: '/api/admin-manage/login', method: 'POST', desc: '管理员登录', auth: false },
  { module: 'adminManage', path: '/api/admin-manage/admins', method: 'GET', desc: '获取管理员列表', auth: true },
  { module: 'adminManage', path: '/api/admin-manage/admins', method: 'POST', desc: '创建管理员', auth: true },
  { module: 'adminManage', path: '/api/admin-manage/admins/:id', method: 'PUT', desc: '更新管理员', auth: true },
  { module: 'adminManage', path: '/api/admin-manage/admins/:id/password', method: 'PUT', desc: '修改管理员密码', auth: true },
  { module: 'adminManage', path: '/api/admin-manage/admins/:id', method: 'DELETE', desc: '删除管理员', auth: true },
  { module: 'adminManage', path: '/api/admin-manage/roles', method: 'GET', desc: '获取角色列表', auth: true },
  { module: 'adminManage', path: '/api/admin-manage/roles', method: 'POST', desc: '创建角色', auth: true },
  { module: 'adminManage', path: '/api/admin-manage/roles/:id', method: 'PUT', desc: '更新角色', auth: true },
  { module: 'adminManage', path: '/api/admin-manage/roles/:id', method: 'DELETE', desc: '删除角色', auth: true },
  { module: 'adminManage', path: '/api/admin-manage/permissions', method: 'GET', desc: '获取权限列表', auth: true }
]

const modules = [
  { key: 'system', name: '系统接口', icon: '⚙️' },
  { key: 'user', name: '用户接口', icon: '👤' },
  { key: 'chat', name: '聊天接口', icon: '💬' },
  { key: 'gift', name: '礼物接口', icon: '🎁' },
  { key: 'pay', name: '支付接口', icon: '💰' },
  { key: 'game', name: '游戏陪玩接口', icon: '🎮' },
  { key: 'admin', name: '管理后台接口', icon: '🛠️' },
  { key: 'adminManage', name: '管理员管理接口', icon: '👨‍💼' }
]

const allEndpoints = reactive(apiData)

// 搜索过滤逻辑
const handleSearch = () => {}

const filteredEndpoints = computed(() => {
  let list = allEndpoints
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(ep =>
      ep.path.toLowerCase().includes(kw) ||
      ep.desc.toLowerCase().includes(kw)
    )
  }
  if (filterMethod.value) {
    list = list.filter(ep => ep.method === filterMethod.value)
  }
  return list
})

const filteredModules = computed(() => {
  return modules.filter(m => {
    if (filterModule.value && m.key !== filterModule.value) return false
    const eps = allEndpoints.filter(ep => {
      if (ep.module !== m.key) return false
      if (filterMethod.value && ep.method !== filterMethod.value) return false
      if (searchKeyword.value) {
        const kw = searchKeyword.value.toLowerCase()
        return ep.path.toLowerCase().includes(kw) || ep.desc.toLowerCase().includes(kw)
      }
      return true
    })
    return eps.length > 0
  })
})

const getModuleEndpoints = (moduleKey) => {
  return allEndpoints.filter(ep => {
    if (ep.module !== moduleKey) return false
    if (filterMethod.value && ep.method !== filterMethod.value) return false
    if (searchKeyword.value) {
      const kw = searchKeyword.value.toLowerCase()
      return ep.path.toLowerCase().includes(kw) || ep.desc.toLowerCase().includes(kw)
    }
    return true
  })
}

const methodCount = computed(() => {
  const counts = { GET: 0, POST: 0, PUT: 0, DELETE: 0 }
  allEndpoints.forEach(ep => {
    if (counts[ep.method] !== undefined) counts[ep.method]++
  })
  return counts
})
</script>

<style scoped>
.api-page {
  min-height: 400px;
}

/* 统计概览 */
.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.stat-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px 24px;
  text-align: center;
  min-width: 100px;
  flex: 1;
}

.stat-num {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}

.stat-num.get { color: #27ae60; }
.stat-num.post { color: #3498db; }
.stat-num.put { color: #f39c12; }
.stat-num.delete { color: #e74c3c; }

.stat-label {
  font-size: 13px;
  color: #999;
}

/* 接口 section */
.api-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.api-section {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eee;
  overflow: hidden;
}

.api-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #fafbfc;
  border-bottom: 1px solid #eee;
}

.api-section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  font-size: 18px;
}

.section-count {
  font-size: 12px;
  color: #999;
  background: #f0f0f0;
  padding: 2px 10px;
  border-radius: 10px;
}

/* 接口路径 */
.api-path {
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #333;
  background: #f5f7fa;
  padding: 3px 8px;
  border-radius: 4px;
  word-break: break-all;
}

/* 方法标签 */
.method-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  min-width: 60px;
  text-align: center;
}

.method-badge.get { background: #27ae60; }
.method-badge.post { background: #3498db; }
.method-badge.put { background: #f39c12; }
.method-badge.delete { background: #e74c3c; }

/* 认证标签 */
.auth-badge {
  font-size: 12px;
  color: #666;
}

.auth-badge.public {
  color: #27ae60;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 15px;
}

/* 表格适配 */
.data-table th, .data-table td {
  vertical-align: middle;
}

.data-table td {
  font-size: 13px;
}

/* 操作按钮 */
.api-actions {
  display: flex;
  gap: 4px;
}
.action-btn-sm {
  padding: 3px 6px;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}
.action-btn-sm:hover {
  background: #e6f7ff;
  border-color: #91d5ff;
}

/* 展开行 */
.api-row-expanded {
  background: #f0f5ff;
}
.api-curl-row td {
  padding: 0 !important;
  border-bottom: none;
}
.curl-box {
  background: #1e1e1e;
  border-radius: 6px;
  margin: 8px 20px 12px;
  overflow: hidden;
}
.curl-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: #2d2d2d;
}
.curl-title {
  font-size: 12px;
  color: #aaa;
}
.copy-curl-btn {
  padding: 2px 8px;
  background: #444;
  color: #ddd;
  border: 1px solid #555;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
}
.copy-curl-btn:hover {
  background: #555;
}
.curl-code {
  margin: 0;
  padding: 14px;
  color: #4ec9b0;
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 统计卡片可点击 */
.stat-item[style*="cursor:pointer"]:hover {
  background: #e6f7ff;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
</style>
