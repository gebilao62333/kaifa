<template>
  <div>
    <div class="page-actions">
      <button class="btn-primary" @click="openCreate">+ 新增礼物</button>
    </div>
    <table class="data-table">
      <thead><tr><th>ID</th><th>图片</th><th>名称</th><th>价格</th><th>类型</th><th>VIP</th><th>排序</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="g in list" :key="g.id">
          <td>{{ g.id }}</td>
          <td><img :src="g.image || g.icon" class="gift-thumb" /></td>
          <td>{{ g.title || g.name }}</td>
          <td>¥{{ g.money || g.price || 0 }}</td>
          <td>{{ giftTypeText(g.type) }}</td>
          <td>{{ g.is_vip || g.isVip ? '✅' : '-' }}</td>
          <td>{{ g.sort || 0 }}</td>
          <td><span :class="['status-tag', (g.status === 1 ? 'active' : 'disabled')]">{{ g.status === 1 ? '启用' : '禁用' }}</span></td>
          <td>
            <button class="btn-sm" @click="openEdit(g)">编辑</button>
            <button class="btn-sm warn" @click="toggle(g)">{{ g.status === 1 ? '禁用' : '启用' }}</button>
            <button class="btn-sm danger" @click="remove(g)">删除</button>
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
        <h3>{{ isEdit ? '编辑礼物' : '新增礼物' }}</h3>
        <div class="form-grid">
          <label>名称: <input v-model="form.title" /></label>
          <label>图片URL: <input v-model="form.image" /></label>
          <label>价格: <input v-model.number="form.money" type="number" /></label>
          <label>类型: <select v-model.number="form.type"><option :value="0">普通礼物</option><option :value="1">豪华礼物</option></select></label>
          <label>VIP专属: <select v-model.number="form.is_vip"><option :value="1">是</option><option :value="0">否</option></select></label>
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
const form = ref({ id: '', title: '', image: '', money: 0, type: 0, is_vip: 0, tian: 0, sort: 0, status: 1 })
const giftTypeText = (t) => ({ 0: '普通', 1: '豪华' }[t] || '普通')
const loadList = async () => {
  try {
    const res = await adminService.getGifts({ page: page.value, pageSize: pageSize.value })
    if (res.code === 200 || res.code === 0) { list.value = res.data.list || res.data || []; total.value = res.data.pagination?.total || list.value.length }
  } catch (e) { console.error(e) }
}
const openCreate = () => { isEdit.value = false; form.value = { id: '', title: '', image: '', money: 0, type: 0, is_vip: 0, tian: 0, sort: 0, status: 1 }; showModal.value = true }
const openEdit = (g) => { isEdit.value = true; form.value = { id: g.id, title: g.title || g.name, image: g.image || g.icon, money: g.money || g.price || 0, type: g.type || 0, is_vip: g.is_vip || g.isVip || 0, tian: g.tian || 0, sort: g.sort || 0, status: g.status }; showModal.value = true }
const save = async () => {
  try {
    const res = isEdit.value ? await adminService.updateGift(form.value.id, form.value) : await adminService.createGift(form.value)
    if (res.code === 200 || res.code === 0) { alert('保存成功'); showModal.value = false; loadList() } else { alert(res.message || '保存失败') }
  } catch (e) { console.error(e) }
}
const toggle = async (g) => { try { await adminService.updateGift(g.id, { ...g, status: g.status === 1 ? 0 : 1 }); loadList() } catch (e) { console.error(e) } }
const remove = async (g) => { if (!confirm(`确定删除 ${g.title || g.name}?`)) return; try { await adminService.deleteGift(g.id); loadList() } catch (e) { console.error(e) } }
onMounted(loadList)
</script>

<style scoped>
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; }
.btn-primary { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.data-table th { text-align: left; padding: 12px; background: #fafafa; color: #666; font-size: 13px; font-weight: 600; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.gift-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
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
