<template>
  <div>
    <h2 style="margin-bottom:16px">接口管理</h2>
    <div class="api-section" v-for="section in apiSections" :key="section.title">
      <h3 class="api-section-title">{{ section.icon }} {{ section.title }}</h3>
      <table class="data-table">
        <thead><tr><th>路径</th><th>方法</th><th>描述</th><th>状态</th></tr></thead>
        <tbody>
          <tr v-for="api in section.apis" :key="api.path + api.method">
            <td>{{ api.path }}</td>
            <td><span :class="['method-badge', api.method.toLowerCase()]">{{ api.method }}</span></td>
            <td>{{ api.desc }}</td>
            <td><span class="status-badge active">正常</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const apiSections = [
  {
    title: '仪表盘', icon: '📊',
    apis: [{ path: '/api/admin/dashboard', method: 'GET', desc: '获取仪表盘统计数据' }]
  },
  {
    title: '用户管理', icon: '👥',
    apis: [
      { path: '/api/admin/users', method: 'GET', desc: '获取用户列表' },
      { path: '/api/admin/users/:id', method: 'GET', desc: '获取用户详情' },
      { path: '/api/admin/users', method: 'POST', desc: '创建用户' },
      { path: '/api/admin/users/:id', method: 'PUT', desc: '更新用户' },
      { path: '/api/admin/users/:id/status', method: 'PUT', desc: '更新用户状态' },
      { path: '/api/admin/users/:id', method: 'DELETE', desc: '删除用户' }
    ]
  },
  {
    title: '订单管理', icon: '📦',
    apis: [
      { path: '/api/admin/orders', method: 'GET', desc: '获取订单列表' },
      { path: '/api/admin/orders/:id', method: 'GET', desc: '获取订单详情' },
      { path: '/api/admin/orders/:id/status', method: 'PUT', desc: '更新订单状态' },
      { path: '/api/admin/orders/:id', method: 'DELETE', desc: '删除订单' }
    ]
  },
  {
    title: '提现管理', icon: '💰',
    apis: [
      { path: '/api/admin/withdraws', method: 'GET', desc: '获取提现列表' },
      { path: '/api/admin/withdraws/:id/approve', method: 'POST', desc: '通过提现' },
      { path: '/api/admin/withdraws/:id/reject', method: 'POST', desc: '拒绝提现' }
    ]
  },
  {
    title: '帖子管理', icon: '📝',
    apis: [
      { path: '/api/admin/posts', method: 'GET', desc: '获取帖子列表' },
      { path: '/api/admin/posts/:id', method: 'DELETE', desc: '删除帖子' }
    ]
  },
  {
    title: 'Banner管理', icon: '🎪',
    apis: [
      { path: '/api/admin/banners', method: 'GET', desc: '获取Banner列表' },
      { path: '/api/admin/banners', method: 'POST', desc: '创建Banner' },
      { path: '/api/admin/banners/:id', method: 'PUT', desc: '更新Banner' },
      { path: '/api/admin/banners/:id', method: 'DELETE', desc: '删除Banner' }
    ]
  },
  {
    title: 'VIP套餐', icon: '⭐',
    apis: [
      { path: '/api/admin/vip-packages', method: 'GET', desc: '获取VIP套餐列表' },
      { path: '/api/admin/vip-packages', method: 'POST', desc: '创建VIP套餐' },
      { path: '/api/admin/vip-packages/:id', method: 'PUT', desc: '更新VIP套餐' },
      { path: '/api/admin/vip-packages/:id', method: 'DELETE', desc: '删除VIP套餐' }
    ]
  },
  {
    title: '礼物管理', icon: '🎁',
    apis: [
      { path: '/api/admin/gifts', method: 'GET', desc: '获取礼物列表' },
      { path: '/api/admin/gifts', method: 'POST', desc: '创建礼物' },
      { path: '/api/admin/gifts/:id', method: 'PUT', desc: '更新礼物' },
      { path: '/api/admin/gifts/:id', method: 'DELETE', desc: '删除礼物' }
    ]
  },
  {
    title: '虚拟用户', icon: '🤖',
    apis: [
      { path: '/api/admin/virtual-users', method: 'GET', desc: '获取虚拟用户列表' },
      { path: '/api/admin/virtual-users', method: 'POST', desc: '创建虚拟用户' },
      { path: '/api/admin/virtual-users/:id', method: 'PUT', desc: '更新虚拟用户' },
      { path: '/api/admin/virtual-users/:id', method: 'DELETE', desc: '删除虚拟用户' }
    ]
  }
]
</script>

<style scoped>
.api-section { background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.api-section-title { font-size: 15px; color: #333; margin-bottom: 12px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { text-align: left; padding: 8px 12px; background: #fafafa; color: #666; font-size: 13px; font-weight: 600; }
.data-table td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.method-badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; color: #fff; }
.method-badge.get { background: #52c41a; }
.method-badge.post { background: #1890ff; }
.method-badge.put { background: #fa8c16; }
.method-badge.delete { background: #ff4d4f; }
.status-badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-badge.active { background: #f6ffed; color: #52c41a; }
</style>
