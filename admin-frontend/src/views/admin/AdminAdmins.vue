<template>
  <div>
    <div class="page-actions">
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
            <button class="btn-sm" @click="openEdit(a)">编辑</button>
            <button class="btn-sm danger" @click="remove(a)">删除</button>
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
          <label>角色: <select v-model.number="form.role_id">
            <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}{{ r.is_super ? '（超级）' : '' }}</option>
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
import { ref, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi'
import { useToast } from '../../composables/useToast'
const { page, pageSize, total, totalPages, formatTime, getHost, getHeaders } = useAdminApi()
const toast = useToast()
const list = ref([])
const roles = ref([])
const loading = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const form = ref({ id: '', username: '', password: '', role_id: 1, status: 1 })
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
const roleName = (id) => { const r = roles.value.find(x => x.id === id); return r ? r.name : '' }
const openCreate = () => { isEdit.value = false; form.value = { id: '', username: '', password: '', role_id: 1, status: 1 }; showModal.value = true }
const openEdit = (a) => { isEdit.value = true; form.value = { id: a.id, username: a.username, password: '', role_id: a.role_id ?? (a.role === 'super_admin' ? 1 : 2), status: a.status }; showModal.value = true }
const save = async () => {
  try {
    const url = isEdit.value ? `${getHost()}/api/admin-manage/admins/${form.value.id}` : `${getHost()}/api/admin-manage/admins`
    const method = isEdit.value ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(form.value) })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) { toast.success('保存成功'); showModal.value = false; loadList() } else { toast.error(result.message || '保存失败') }
  } catch (e) { toast.error('保存失败: ' + (e.message || '网络错误')) }
}
const remove = async (a) => { if (!confirm(`确定删除管理员 ${a.username}?`)) return; try { await fetch(`${getHost()}/api/admin-manage/admins/${a.id}`, { method: 'DELETE', headers: { Authorization: getHeaders().Authorization } }); toast.success('管理员已删除'); loadList() } catch (e) { toast.error('删除失败: ' + (e.message || '网络错误')) } }
onMounted(() => { loadList(); loadRoles() })
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
