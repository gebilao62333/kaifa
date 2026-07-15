<template>
  <div>
    <div class="tabs">
      <button :class="['tab', { active: tab === 'system' }]" @click="tab = 'system'">系统推荐</button>
      <button :class="['tab', { active: tab === 'manual' }]" @click="tab = 'manual'">手动推荐</button>
    </div>
    <div v-if="tab === 'manual'" class="page-actions">
      <input v-model="newUserId" placeholder="输入用户ID添加推荐..." class="search-input" />
      <button class="btn-primary" @click="addManual">添加推荐</button>
      <button class="btn-primary" style="background:#52c41a" @click="saveToFrontend">保存到前端</button>
    </div>
    <table class="data-table">
      <thead><tr><th>头像</th><th>昵称</th><th>等级</th><th>标签</th><th>价格</th><th v-if="tab === 'manual'">置顶</th><th v-if="tab === 'manual'">操作</th></tr></thead>
      <tbody>
        <tr v-for="u in displayList" :key="u.userId">
          <td><img :src="u.avatar || defaultAvatar" class="user-avatar-small" /></td>
          <td>{{ u.nickName || u.nickname }}</td>
          <td>{{ u.level || 1 }}</td>
          <td>{{ (u.tags || []).join(', ') }}</td>
          <td>¥{{ u.price || u.servicePrice || 0 }}</td>
          <td v-if="tab === 'manual'">
            <button class="btn-sm" @click="toggleTop(u)">{{ u.isTop ? '取消置顶' : '置顶' }}</button>
          </td>
          <td v-if="tab === 'manual'">
            <button class="btn-sm danger" @click="removeManual(u)">移除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination" v-if="tab === 'system'">
      <button :disabled="page <= 1" @click="page--; loadSystem()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页 (共 {{ total }} 条)</span>
      <button :disabled="page >= totalPages" @click="page++; loadSystem()">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi'
const { page, pageSize, total, totalPages, getHost, getHeaders, formatTime } = useAdminApi()
const tab = ref('system')
const newUserId = ref('')
const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
const systemList = ref([])
const manualList = ref([])

const displayList = computed(() => tab.value === 'system' ? systemList.value : manualList.value)

const getManualStorage = () => {
  try { return JSON.parse(localStorage.getItem('admin_recommend_users') || '[]') } catch { return [] }
}
const setManualStorage = (list) => {
  localStorage.setItem('admin_recommend_users', JSON.stringify(list))
}

const loadSystem = async () => {
  try {
    const res = await fetch(`${getHost()}/api/admin/users?page=${page.value}&pageSize=${pageSize.value}`, { headers: getHeaders() })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) { systemList.value = result.data.list || result.data || []; total.value = result.data.pagination?.total || systemList.value.length }
  } catch (e) { console.error(e) }
}

const addManual = async () => {
  const uid = newUserId.value.trim()
  if (!uid) return
  let userInfo = { userId: uid, nickname: '用户' + uid, avatar: defaultAvatar, tags: ['推荐'], price: 50 }
  try {
    const res = await fetch(`${getHost()}/api/admin/users/${uid}`, { headers: getHeaders() })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      const u = result.data
      userInfo = { userId: u.userId || uid, nickname: u.nickname || u.nickName || '用户' + uid, avatar: u.avatar || defaultAvatar, level: u.level || 1, tags: u.tags || ['推荐'], price: u.servicePrice || u.price || 50, isTop: false }
    }
  } catch (e) { console.error(e) }
  const existing = getManualStorage()
  if (!existing.find(u => u.userId === userInfo.userId)) {
    existing.push(userInfo)
    setManualStorage(existing)
    manualList.value = existing
    newUserId.value = ''
    alert('添加成功')
  }
}

const removeManual = (u) => {
  if (!confirm('确定移除此推荐?')) return
  const list = getManualStorage().filter(x => x.userId !== u.userId)
  setManualStorage(list)
  manualList.value = list
}

const toggleTop = (u) => {
  u.isTop = !u.isTop
  const list = getManualStorage()
  const idx = list.findIndex(x => x.userId === u.userId)
  if (idx !== -1) { list[idx].isTop = u.isTop; setManualStorage(list); manualList.value = list }
}

const saveToFrontend = () => {
  const list = manualList.value.map(u => ({
    userId: u.userId, nickname: u.nickname || u.nickName, avatar: u.avatar,
    level: u.level || 1, tags: u.tags || [], price: u.price || 50, vip: u.vip || false, vipLevel: u.vipLevel || 0
  }))
  setManualStorage(list)
  alert('已保存到前端，推荐将在首页显示')
}

onMounted(() => {
  manualList.value = getManualStorage()
  loadSystem()
})
</script>

<style scoped>
.tabs { display: flex; gap: 0; margin-bottom: 16px; }
.tab { padding: 8px 20px; border: 1px solid #d9d9d9; background: #fff; cursor: pointer; font-size: 14px; }
.tab:first-child { border-radius: 4px 0 0 4px; }
.tab:last-child { border-radius: 0 4px 4px 0; }
.tab.active { background: #1890ff; color: #fff; border-color: #1890ff; }
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; }
.search-input { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; width: 200px; }
.btn-primary { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.data-table th { text-align: left; padding: 12px; background: #fafafa; color: #666; font-size: 13px; font-weight: 600; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.user-avatar-small { width: 36px; height: 36px; border-radius: 50%; }
.btn-sm { padding: 4px 10px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px; margin-right: 4px; }
.btn-sm.danger { color: #ff4d4f; border-color: #ff4d4f; }
.pagination { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 16px; font-size: 13px; color: #666; }
.pagination button { padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
