<template>
  <div>
    <div class="page-actions">
      <input v-model="searchKeyword" placeholder="搜索分类名称..." class="search-input" @keyup.enter="loadList" />
      <select v-model="filterStatus" class="status-select" @change="loadList">
        <option value="">全部</option>
        <option value="online">线上</option>
        <option value="offline">线下</option>
        <option value="both">全部类型</option>
      </select>
      <button class="btn-primary" @click="openCreate">+ 新增分类</button>
    </div>
    <div v-if="loading" class="loading-wrap"><div class="spinner"></div><span>加载中...</span></div>
    <table class="data-table" v-else>
      <thead><tr><th>ID</th><th>图标</th><th>名称</th><th>描述</th><th>排序</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="g in list" :key="g.id">
          <td>{{ g.id }}</td>
          <td><img :src="g.icon || defaultIcon" class="game-icon" /></td>
          <td>{{ g.name || g.gameName }}</td>
          <td>{{ g.description || '-' }}</td>
          <td>{{ g.sort || 0 }}</td>
          <td><span :class="['status-tag', g.status === 1 ? 'active' : 'disabled']">{{ g.status === 1 ? '启用' : '禁用' }}</span></td>
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
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑分类' : '新增分类' }}</h3>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>
        <div class="form-grid">
          <label>名称: <input v-model="form.name" /></label>
          <label>图标URL: <input v-model="form.icon" /></label>
          <label>描述: <input v-model="form.description" /></label>
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
import { useToast } from '../../composables/useToast'
const { page, pageSize, total, totalPages, searchKeyword, filterStatus, getHost, getHeaders } = useAdminApi()
const toast = useToast()
const list = ref([])
const loading = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const defaultIcon = 'https://api.dicebear.com/7.x/icons/svg?seed=game'
const form = ref({ id: '', name: '', icon: '', description: '', sort: 0, status: 1 })
const loadList = async () => {
  loading.value = true
  try {
    const res = await adminService.getGames({ page: page.value, pageSize: pageSize.value, keyword: searchKeyword.value || undefined, serviceType: filterStatus.value || undefined })
    if (res.code === 200 || res.code === 0) { list.value = res.data.list || res.data || []; total.value = res.data.pagination?.total || list.value.length }
  } catch (e) { toast.error('加载失败: ' + (e.message || '网络错误')) }
  finally { loading.value = false }
}
const openCreate = () => { isEdit.value = false; form.value = { id: '', name: '', icon: '', description: '', sort: 0, status: 1 }; showModal.value = true }
const openEdit = (g) => { isEdit.value = true; form.value = { id: g.id, name: g.name || g.gameName, icon: g.icon || '', description: g.description || '', sort: g.sort || 0, status: g.status }; showModal.value = true }
const save = async () => {
  try {
    const res = isEdit.value ? await adminService.updateGame(form.value.id, form.value) : await adminService.createGame(form.value)
    if (res.code === 200 || res.code === 0) { toast.success('保存成功'); showModal.value = false; loadList() } else { toast.error(res.message || '保存失败') }
  } catch (e) { toast.error('保存失败: ' + (e.message || '网络错误')) }
}
const toggle = async (g) => { try { await adminService.updateGameStatus(g.id, g.status === 1 ? 0 : 1); toast.success(g.status === 1 ? '已禁用' : '已启用'); loadList() } catch (e) { toast.error('操作失败: ' + (e.message || '网络错误')) } }
const remove = async (g) => { if (!confirm(`确定删除 ${g.name}?`)) return; try { await adminService.deleteGame(g.id); toast.success('已删除'); loadList() } catch (e) { toast.error('删除失败: ' + (e.message || '网络错误')) } }
onMounted(loadList)
</script>

<style scoped>
.loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: #999; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #f0f0f0; border-top-color: #1890ff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.search-input { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; width: 200px; }
.status-select { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; }
.btn-primary { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.game-icon { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.data-table th { text-align: left; padding: 12px; background: #fafafa; color: #666; font-size: 13px; font-weight: 600; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
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
