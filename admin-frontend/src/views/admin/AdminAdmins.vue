<template>
  <div>
    <!-- A-2：无「管理员管理」权限时隐藏新增入口（服务端 403 仍是最终边界） -->
    <div class="page-actions" v-if="canWriteAdmins">
      <button class="btn-primary" @click="openCreate">+ 新增管理员</button>
    </div>
    <div v-if="loading" class="loading-wrap"><div class="spinner"></div><span>加载中...</span></div>
    <table class="data-table" v-else>
      <thead><tr><th>ID</th><th>用户名</th><th>角色</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="a in list" :key="a.id">
          <td>{{ a.id }}</td>
          <td>{{ a.username || a.name || '-' }}</td>
          <td>{{ roleName(a.role_id) || a.role || '-' }}</td>
          <td><span :class="['status-tag', a.status === 1 ? 'active' : 'disabled']">{{ a.status === 1 ? '正常' : '禁用' }}</span></td>
          <td>{{ formatTime(a.createTime) }}</td>
          <td>
            <template v-if="canEditRow(a)">
              <button class="btn-sm" @click="openEdit(a)">编辑</button>
              <button class="btn-sm danger" @click="remove(a)">删除</button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <button :disabled="page <= 1" @click="page--; loadList()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页 (共 {{ total }} 条)</span>
      <button :disabled="page >= totalPages" @click="page++; loadList()">下一页</button>
    </div>

    <div class="modal-overlay" v-if="showModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑管理员' : '新增管理员' }}</h3>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>
        <div class="form-grid">
          <label>用户名: <input v-model="form.username" /></label>
          <label v-if="!isEdit">密码: <input v-model="form.password" type="password" /></label>
          <!-- A-1：不默认超管角色，必须显式选择；下拉只给当前管理员有权分配的角色 -->
          <label>角色: <select v-model.number="form.role_id">
            <option value="" disabled>请选择角色</option>
            <option v-for="r in assignableRoles" :key="r.id" :value="r.id">{{ r.name }}{{ r.is_super ? '（超级）' : '' }}</option>
          </select></label>
          <label>状态: <select v-model.number="form.status"><option :value="1">启用</option><option :value="0">禁用</option></select></label>
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
import { ref, computed, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi'
import { useToast } from '../../composables/useToast'
import { canManageAdmin, filterAssignableRoles, hasPermission, readStoredAdmin } from '../../common/adminPermission'
const { page, pageSize, total, totalPages, formatTime, getHost, getHeaders } = useAdminApi()
const toast = useToast()
const list = ref([])
const roles = ref([])
const currentAdmin = ref(null)
const loading = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
// A-1：角色默认为空（不再默认 role_id: 1 超管），保存时必选
const form = ref({ id: '', username: '', password: '', role_id: '', status: 1 })

// 当前管理员主体：优先用 /api/admin-manage/current 的实时结果，拿不到时退回登录时的本地快照
const actor = computed(() => currentAdmin.value || readStoredAdmin())
// A-2：按钮级权限预判，只做 UI 前置；越权仍由服务端 403 兜底
const canWriteAdmins = computed(() => hasPermission(actor.value && actor.value.permissions, 'admin:write'))
// A-1：角色下拉只列出当前管理员有权分配的角色；权限信息未知时保守地只给非超管角色
const assignableRoles = computed(() => filterAssignableRoles(actor.value, roles.value))
const roleById = (id) => roles.value.find(r => Number(r.id) === Number(id)) || null
const canEditRow = (a) => canWriteAdmins.value && canManageAdmin(actor.value, a, roleById(a.role_id))
const loadList = async () => {
  loading.value = true
  try {
    const res = await fetch(`${getHost()}/api/admin-manage/admins?page=${page.value}&pageSize=${pageSize.value}`, { headers: getHeaders() })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) { list.value = result.data.list || result.data || []; total.value = result.data.pagination?.total || list.value.length }
  } catch (e) { toast.error('加载失败: ' + (e.message || '网络错误')) }
  finally { loading.value = false }
}
const loadRoles = async () => {
  try {
    const res = await fetch(`${getHost()}/api/admin-manage/roles?pageSize=100`, { headers: getHeaders() })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) { roles.value = result.data.list || result.data || [] }
  } catch (e) { /* 角色加载失败不阻塞页面 */ }
}
const loadCurrentAdmin = async () => {
  try {
    const res = await fetch(`${getHost()}/api/admin-manage/current`, { headers: getHeaders() })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) { currentAdmin.value = result.data || null }
  } catch (e) { /* 权限信息拿不到时按保守策略渲染（角色下拉仅非超管角色） */ }
}
const roleName = (id) => { const r = roleById(id); return r ? r.name : '' }
const openCreate = () => {
  if (!canWriteAdmins.value) { toast.error('无权管理管理员'); return }
  isEdit.value = false; form.value = { id: '', username: '', password: '', role_id: '', status: 1 }; showModal.value = true
}
const openEdit = (a) => {
  if (!canEditRow(a)) { toast.error('无权修改该管理员'); return }
  isEdit.value = true; form.value = { id: a.id, username: a.username, password: '', role_id: a.role_id ?? '', status: a.status }; showModal.value = true
}
const save = async () => {
  if (!canWriteAdmins.value) { toast.error('无权管理管理员'); return }
  // A-1：未选角色时前端直接拦截，避免把空/默认超管角色提交给服务端
  if (!form.value.role_id) { toast.error('请选择角色'); return }
  try {
    const url = isEdit.value ? `${getHost()}/api/admin-manage/admins/${form.value.id}` : `${getHost()}/api/admin-manage/admins`
    const method = isEdit.value ? 'PUT' : 'POST'
    const payload = { ...form.value, role_id: Number(form.value.role_id) }
    const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) { toast.success('保存成功'); showModal.value = false; loadList() } else { toast.error(result.message || '保存失败') }
  } catch (e) { toast.error('保存失败: ' + (e.message || '网络错误')) }
}
const remove = async (a) => { if (!canEditRow(a)) { toast.error('无权删除该管理员'); return } if (!confirm(`确定删除管理员 ${a.username}?`)) return; try { await fetch(`${getHost()}/api/admin-manage/admins/${a.id}`, { method: 'DELETE', headers: { Authorization: getHeaders().Authorization } }); toast.success('管理员已删除'); loadList() } catch (e) { toast.error('删除失败: ' + (e.message || '网络错误')) } }
onMounted(() => { loadCurrentAdmin(); loadList(); loadRoles() })
</script>

<style scoped>
.loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: #999; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #f0f0f0; border-top-color: #1890ff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; }
.btn-primary { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.data-table th { text-align: left; padding: 12px; background: #fafafa; color: #666; font-size: 13px; font-weight: 600; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-tag.active { background: #f6ffed; color: #52c41a; }
.status-tag.disabled { background: #fff1f0; color: #ff4d4f; }
.btn-sm { padding: 4px 10px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px; margin-right: 4px; }
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
.form-grid input, .form-grid select { padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; }
.modal-actions { margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end; }
.modal-actions button { padding: 8px 20px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.modal-actions .btn-primary { background: #1890ff; color: #fff; border: none; }
</style>
