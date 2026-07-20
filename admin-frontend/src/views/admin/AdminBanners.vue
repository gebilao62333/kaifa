<template>
  <div>
    <div class="page-actions">
      <button class="btn-primary" @click="openCreate">+ 新增Banner</button>
    </div>
    <table class="data-table">
      <thead><tr><th>ID</th><th>标题</th><th>图片</th><th>链接</th><th>排序</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="b in list" :key="b.id">
          <td>{{ b.id }}</td>
          <td>{{ b.title }}</td>
          <td><img :src="b.image" class="banner-thumb" /></td>
          <td>{{ b.link || '-' }}</td>
          <td>{{ b.sort || 0 }}</td>
          <td><span :class="['status-tag', b.status === 1 ? 'active' : 'disabled']">{{ b.status === 1 ? '启用' : '禁用' }}</span></td>
          <td>
            <button class="btn-sm" @click="openEdit(b)">编辑</button>
            <button class="btn-sm warn" @click="toggle(b)">{{ b.status === 1 ? '禁用' : '启用' }}</button>
            <button class="btn-sm danger" @click="remove(b)">删除</button>
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
        <h3>{{ isEdit ? '编辑Banner' : '新增Banner' }}</h3>
        <div class="form-grid">
          <label>标题: <input v-model="form.title" /></label>
          <label>图片URL: <input v-model="form.image" /></label>
          <label>链接: <input v-model="form.link" /></label>
          <label>排序: <input v-model.number="form.sort" type="number" /></label>
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
import adminService from '../../services/adminService'
import { useAdminApi } from '../../composables/useAdminApi'
const { page, pageSize, total, totalPages, getHost, getHeaders } = useAdminApi()
const list = ref([])
const showModal = ref(false)
const isEdit = ref(false)
const form = ref({ id: '', title: '', image: '', link: '', sort: 0, status: 1 })
const loadList = async () => {
  try {
    const res = await fetch(`${getHost()}/api/admin/banners?page=${page.value}&pageSize=${pageSize.value}`, { headers: getHeaders() })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) { list.value = result.data.list || result.data || []; total.value = result.data.pagination?.total || list.value.length }
  } catch (e) { console.error(e) }
}
const openCreate = () => { isEdit.value = false; form.value = { id: '', title: '', image: '', link: '', sort: 0, status: 1 }; showModal.value = true }
const openEdit = (b) => { isEdit.value = true; form.value = { id: b.id, title: b.title, image: b.image, link: b.link || '', sort: b.sort || 0, status: b.status }; showModal.value = true }
const save = async () => {
  try {
    const url = isEdit.value ? `${getHost()}/api/admin/banners/${form.value.id}` : `${getHost()}/api/admin/banners`
    const method = isEdit.value ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(form.value) })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) { alert('保存成功'); showModal.value = false; loadList() } else { alert(result.message || '保存失败') }
  } catch (e) { console.error(e) }
}
const toggle = async (b) => {
  const newStatus = b.status === 1 ? 0 : 1
  try {
    const res = await fetch(`${getHost()}/api/admin/banners/${b.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ ...b, status: newStatus }) })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) { b.status = newStatus; alert('状态已更新') }
  } catch (e) { console.error(e) }
}
const remove = async (b) => { if (!confirm(`确定删除Banner ${b.title}?`)) return; try { await fetch(`${getHost()}/api/admin/banners/${b.id}`, { method: 'DELETE', headers: { Authorization: getHeaders().Authorization } }); loadList() } catch (e) { console.error(e) } }
onMounted(loadList)
</script>

<style scoped>
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; }
.btn-primary { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.data-table th { text-align: left; padding: 12px; background: #fafafa; color: #666; font-size: 13px; font-weight: 600; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.banner-thumb { width: 80px; height: 40px; object-fit: cover; border-radius: 4px; }
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-tag.active { background: #f6ffed; color: #52c41a; }
.status-tag.disabled { background: #fff1f0; color: #ff4d4f; }
.btn-sm { padding: 4px 10px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px; margin-right: 4px; }
.btn-sm.warn { color: #fa8c16; border-color: #fa8c16; }
.btn-sm.danger { color: #ff4d4f; border-color: #ff4d4f; }
.pagination { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 16px; font-size: 13px; color: #666; }
.pagination button { padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { background: #fff; border-radius: 8px; padding: 24px; width: 480px; max-height: 80vh; overflow-y: auto; }
.modal h3 { margin-bottom: 16px; }
.form-grid { display: grid; gap: 12px; }
.form-grid label { display: flex; flex-direction: column; font-size: 13px; color: #666; gap: 4px; }
.form-grid input, .form-grid select { padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; }
.modal-actions { margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end; }
.modal-actions button { padding: 8px 20px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
</style>
