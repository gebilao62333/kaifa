<template>
  <div>
    <div class="page-actions">
      <button class="btn-primary" @click="openCreate">+ 新增角色</button>
    </div>
    <div class="cards-grid">
      <div v-for="r in list" :key="r.id" class="role-card">
        <h3>{{ r.name }}</h3>
        <p class="role-desc">{{ r.description || '无描述' }}</p>
        <div class="permission-tags">
          <span v-for="p in (r.permissions || [])" :key="p" class="perm-tag">{{ p }}</span>
        </div>
        <div class="card-actions">
          <button class="btn-sm" @click="openEdit(r)">编辑</button>
          <button class="btn-sm danger" @click="remove(r)">删除</button>
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
        <h3>{{ isEdit ? '编辑角色' : '新增角色' }}</h3>
        <div class="form-grid">
          <label>角色名: <input v-model="form.name" /></label>
          <label>描述: <input v-model="form.description" /></label>
          <label>权限:
            <div class="perm-checkboxes">
              <label v-for="p in allPermissions" :key="p.key" class="perm-check">
                <input type="checkbox" :value="p.key" v-model="form.permissions" /> {{ p.label }}
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
const { page, pageSize, total, totalPages, formatTime, getHost, getHeaders } = useAdminApi()
const list = ref([])
const showModal = ref(false)
const isEdit = ref(false)
const form = ref({ id: '', name: '', description: '', permissions: [] })
const allPermissions = [
  { key: 'user:read', label: '查看用户' }, { key: 'user:write', label: '管理用户' },
  { key: 'order:read', label: '查看订单' }, { key: 'order:write', label: '管理订单' },
  { key: 'post:read', label: '查看帖子' }, { key: 'post:write', label: '管理帖子' },
  { key: 'report:read', label: '查看举报' }, { key: 'report:write', label: '处理举报' },
  { key: 'gift:read', label: '查看礼物' }, { key: 'gift:write', label: '管理礼物' },
  { key: 'withdraw:read', label: '查看提现' }, { key: 'withdraw:write', label: '审核提现' },
  { key: 'settings:write', label: '系统设置' }, { key: 'admin:write', label: '管理管理员' }
]
const loadList = async () => {
  try {
    const res = await fetch(`${getHost()}/api/admin-manage/roles?page=${page.value}&pageSize=${pageSize.value}`, { headers: getHeaders() })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) { list.value = result.data.list || result.data || []; total.value = result.data.pagination?.total || list.value.length }
  } catch (e) { console.error(e) }
}
const openCreate = () => { isEdit.value = false; form.value = { id: '', name: '', description: '', permissions: [] }; showModal.value = true }
const openEdit = (r) => { isEdit.value = true; form.value = { id: r.id, name: r.name, description: r.description || '', permissions: r.permissions || [] }; showModal.value = true }
const save = async () => {
  try {
    const url = isEdit.value ? `${getHost()}/api/admin-manage/roles/${form.value.id}` : `${getHost()}/api/admin-manage/roles`
    const method = isEdit.value ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(form.value) })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) { alert('保存成功'); showModal.value = false; loadList() } else { alert(result.message || '保存失败') }
  } catch (e) { console.error(e) }
}
const remove = async (r) => { if (!confirm(`确定删除角色 ${r.name}?`)) return; try { await fetch(`${getHost()}/api/admin-manage/roles/${r.id}`, { method: 'DELETE', headers: { Authorization: getHeaders().Authorization } }); loadList() } catch (e) { console.error(e) } }
onMounted(loadList)
</script>

<style scoped>
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; }
.btn-primary { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.role-card { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.role-card h3 { font-size: 16px; margin-bottom: 8px; color: #333; }
.role-desc { font-size: 13px; color: #999; margin-bottom: 12px; }
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
.modal h3 { margin-bottom: 16px; }
.form-grid { display: grid; gap: 12px; }
.form-grid label { display: flex; flex-direction: column; font-size: 13px; color: #666; gap: 4px; }
.form-grid input { padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; }
.perm-checkboxes { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.perm-check { display: flex; align-items: center; gap: 4px; font-size: 13px; }
.modal-actions { margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end; }
.modal-actions button { padding: 8px 20px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
</style>
