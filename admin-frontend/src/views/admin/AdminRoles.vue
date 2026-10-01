<template>
  <div>
    <div class="page-actions">
      <button class="btn-primary" @click="openCreate">+ 新增角色</button>
    </div>
    <div v-if="loading" class="loading-wrap"><div class="spinner"></div><span>加载中...</span></div>
    <div class="cards-grid" v-else>
      <div v-for="r in list" :key="r.id" class="role-card">
        <h3>{{ r.name }}</h3>
        <p class="role-desc">{{ r.description || '无描述' }}</p>
        <p v-if="r.username" class="role-login">登录账号：{{ r.username }}</p>
        <div class="permission-tags">
          <span v-for="p in parsePerms(r.permissions)" :key="p" class="perm-tag">{{ permLabel(p) }}</span>
        </div>
        <div class="card-actions">
          <button class="btn-sm" @click="openEdit(r)">编辑</button>
          <button v-if="!r.is_super" class="btn-sm danger" @click="remove(r)">删除</button>
        </div>
      </div>
    </div>
    <div class="pagination">
      <button :disabled="page <= 1" @click="page--; loadList()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页 (共 {{ total }} 条)</span>
      <button :disabled="page >= totalPages" @click="page++; loadList()">下一页</button>
    </div>

    <div class="modal-overlay" v-if="showModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑角色' : '新增角色' }}</h3>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>
        <div class="form-grid">
          <label>角色名: <input v-model="form.name" :disabled="isSuper" /></label>
          <label>描述: <input v-model="form.description" :disabled="isSuper" /></label>
          <label>登录账号: <input v-model="form.username" :placeholder="isEdit ? '留空表示清空账号' : '可选：填了则必须设密码，可用来登录管理端'" /></label>
          <label>登录密码: <input type="password" v-model="form.password" :placeholder="isEdit ? '留空表示不修改密码' : '可选'" /></label>
          <p v-if="isSuper" class="super-hint">超级管理员权限固定为「全部权限」，仅可设置登录账号/密码</p>
          <label>权限:
            <div class="perm-checkboxes">
              <label v-for="p in allPermissions" :key="p.key" class="perm-check">
                <input type="checkbox" :value="p.key" v-model="form.permissions" :disabled="isSuper" /> {{ p.label }}
              </label>
            </div>
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn-primary" @click="save">保存</button>
          <button @click="showModal = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi'
import { useToast } from '../../composables/useToast'
const { page, pageSize, total, totalPages, formatTime, getHost, getHeaders } = useAdminApi()
const toast = useToast()
const list = ref([])
const loading = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const isSuper = ref(false)
const form = ref({ id: '', name: '', username: '', password: '', description: '', permissions: [] })
const allPermissions = [
  { key: 'dashboard:read', label: '查看控制台' },
  { key: 'user:read', label: '查看用户' }, { key: 'user:write', label: '管理用户' },
  { key: 'order:read', label: '查看订单' }, { key: 'order:write', label: '管理订单' },
  { key: 'finance:read', label: '查看财务' },
  { key: 'withdraw:read', label: '查看提现' }, { key: 'withdraw:write', label: '审核提现' },
  { key: 'post:read', label: '查看帖子' }, { key: 'post:write', label: '管理帖子' },
  { key: 'report:read', label: '查看举报' }, { key: 'report:write', label: '处理举报' },
  { key: 'splash:read', label: '查看开屏&轮播' }, { key: 'splash:write', label: '管理开屏&轮播' },
  { key: 'download:read', label: '查看下载管理' }, { key: 'download:write', label: '管理下载管理' },
  { key: 'vip:read', label: '查看VIP套餐' }, { key: 'vip:write', label: '管理VIP套餐' },
  { key: 'gift:read', label: '查看礼物' }, { key: 'gift:write', label: '管理礼物' },
  { key: 'recharge:read', label: '查看充值记录' }, { key: 'recharge:write', label: '管理充值记录' },
  { key: 'card:read', label: '查看卡密' }, { key: 'card:write', label: '管理卡密' },
  { key: 'game:read', label: '查看服务分类' }, { key: 'game:write', label: '管理服务分类' },
  { key: 'recommend:read', label: '查看热门推荐' }, { key: 'recommend:write', label: '管理热门推荐' },
  { key: 'companion:read', label: '查看服务申请' }, { key: 'companion:write', label: '管理服务申请' },
  { key: 'virtual:read', label: '查看虚拟机器人' }, { key: 'virtual:write', label: '管理虚拟机器人' },
  { key: 'admin:write', label: '管理管理员与角色' },
  { key: 'settings:read', label: '查看系统设置' }, { key: 'settings:write', label: '修改系统设置' },
  { key: 'api:read', label: '查看接口管理' }
]
const loadList = async () => {
  loading.value = true
  try {
    const res = await fetch(`${getHost()}/api/admin-manage/roles?page=${page.value}&pageSize=${pageSize.value}`, { headers: getHeaders() })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) { list.value = result.data.list || result.data || []; total.value = result.data.pagination?.total || list.value.length }
  } catch (e) { toast.error('加载失败: ' + (e.message || '网络错误')) }
  finally { loading.value = false }
}
const openCreate = () => { isEdit.value = false; isSuper.value = false; form.value = { id: '', name: '', username: '', password: '', description: '', permissions: [] }; showModal.value = true }
const openEdit = (r) => {
  isEdit.value = true; isSuper.value = !!r.is_super
  form.value = { id: r.id, name: r.name, username: r.username || '', password: '', description: r.description || '', permissions: parsePerms(r.permissions) }; showModal.value = true
}
const parsePerms = (p) => {
  if (Array.isArray(p)) return p
  if (typeof p === 'string') {
    try { const arr = JSON.parse(p); return Array.isArray(arr) ? arr : [] } catch { return p.split(',').map(s => s.trim()).filter(Boolean) }
  }
  return []
}
const permLabel = (key) => { if (key === 'all') return '全部权限'; const f = allPermissions.find(p => p.key === key); return f ? f.label : key }
const save = async () => {
  try {
    const url = isEdit.value ? `${getHost()}/api/admin-manage/roles/${form.value.id}` : `${getHost()}/api/admin-manage/roles`
    const method = isEdit.value ? 'PUT' : 'POST'
    const payload = { ...form.value }
    // 超级管理员：名称/描述/权限等锁定，只提交登录账号/密码
    if (isSuper.value) { delete payload.name; delete payload.description; delete payload.permissions; delete payload.status; delete payload.sort }
    const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) { toast.success('保存成功'); showModal.value = false; loadList() } else { toast.error(result.message || '保存失败') }
  } catch (e) { toast.error('保存失败: ' + (e.message || '网络错误')) }
}
const remove = async (r) => { if (!confirm(`确定删除角色 ${r.name}?`)) return; try { await fetch(`${getHost()}/api/admin-manage/roles/${r.id}`, { method: 'DELETE', headers: { Authorization: getHeaders().Authorization } }); toast.success('角色已删除'); loadList() } catch (e) { toast.error('删除失败: ' + (e.message || '网络错误')) } }
onMounted(loadList)
</script>

<style scoped>
.loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: #999; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #f0f0f0; border-top-color: #1890ff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; }
.btn-primary { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.role-card { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.role-card h3 { font-size: 16px; margin-bottom: 8px; color: #333; }
.role-desc { font-size: 13px; color: #999; margin-bottom: 12px; }
.role-login { font-size: 12px; color: #52c41a; margin-bottom: 8px; }
.permission-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.perm-tag { padding: 2px 8px; background: #e6f7ff; color: #1890ff; border-radius: 4px; font-size: 12px; }
.card-actions { display: flex; gap: 8px; }
.btn-sm { padding: 4px 10px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px; }
.btn-sm.danger { color: #ff4d4f; border-color: #ff4d4f; }
.pagination { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 16px; font-size: 13px; color: #666; }
.pagination button { padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { background: #fff; border-radius: 8px; padding: 24px; width: 480px; max-height: 80vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.modal-header h3 { margin: 0; }
.modal-close { width: 28px; height: 28px; border: none; background: transparent; font-size: 22px; color: #999; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 4px; line-height: 1; }
.modal-close:hover { color: #333; background: #f5f5f5; }
.form-grid { display: grid; gap: 12px; }
.form-grid label { display: flex; flex-direction: column; font-size: 13px; color: #666; gap: 4px; }
.form-grid input { padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; }
.form-grid input:disabled { background: #f5f5f5; color: #999; cursor: not-allowed; }
.super-hint { font-size: 12px; color: #faad14; margin: 0; }
.perm-checkboxes { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.perm-check { display: flex; align-items: center; gap: 4px; font-size: 13px; }
.modal-actions { margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end; }
.modal-actions button { padding: 8px 20px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.modal-actions .btn-primary { background: #1890ff; color: #fff; border: none; }
</style>
