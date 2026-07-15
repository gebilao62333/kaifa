<template>
  <div>
    <div class="page-actions">
      <button class="btn-primary" @click="openCreate">+ 新增虚拟用户</button>
    </div>
    <table class="data-table">
      <thead><tr><th>ID</th><th>头像</th><th>昵称</th><th>角色</th><th>对话风格</th><th>在线</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="v in list" :key="v.id">
          <td>{{ v.id }}</td>
          <td><img :src="v.avatar || defaultAvatar" class="user-avatar-small" /></td>
          <td>{{ v.nickname || v.nickName || '-' }}</td>
          <td>{{ roleText(v.role) }}</td>
          <td>{{ styleText(v.dialogueStyle) }}</td>
          <td><span :class="['status-tag', v.isOnline === 1 ? 'active' : 'disabled']">{{ v.isOnline === 1 ? '在线' : '离线' }}</span></td>
          <td><span :class="['status-tag', v.status === 1 ? 'active' : 'disabled']">{{ v.status === 1 ? '启用' : '禁用' }}</span></td>
          <td>
            <button class="btn-sm" @click="openEdit(v)">编辑</button>
            <button class="btn-sm warn" @click="toggle(v)">{{ v.status === 1 ? '禁用' : '启用' }}</button>
            <button class="btn-sm danger" @click="remove(v)">删除</button>
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
        <h3>{{ isEdit ? '编辑虚拟用户' : '新增虚拟用户' }}</h3>
        <div class="form-grid">
          <label>昵称: <input v-model="form.nickname" /></label>
          <label>头像: <input v-model="form.avatar" /></label>
          <label>角色: <select v-model="form.role"><option value="default">默认</option><option value="companion">陪玩师</option><option value="guide">向导</option><option value="assistant">助手</option></select></label>
          <label>对话风格: <select v-model="form.dialogueStyle"><option value="friendly">友好亲切</option><option value="professional">专业严谨</option><option value="humorous">幽默风趣</option><option value="cute">可爱俏皮</option></select></label>
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
const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=virtual'
const form = ref({ id: '', nickname: '', avatar: '', role: 'default', dialogueStyle: 'friendly', status: 1, isOnline: 1 })

const roleMap = { default: '默认', companion: '陪玩师', guide: '向导', assistant: '助手' }
const styleMap = { friendly: '友好亲切', professional: '专业严谨', humorous: '幽默风趣', cute: '可爱俏皮' }
const roleText = (r) => roleMap[r] || '默认'
const styleText = (s) => styleMap[s] || '友好亲切'

const loadList = async () => {
  try {
    const res = await adminService.getVirtualUsers({ page: page.value, pageSize: pageSize.value })
    if (res.code === 200 || res.code === 0) { list.value = res.data.list || res.data || []; total.value = res.data.pagination?.total || list.value.length }
  } catch (e) { console.error(e) }
}
const openCreate = () => { isEdit.value = false; form.value = { id: '', nickname: '', avatar: '', role: 'default', dialogueStyle: 'friendly', status: 1, isOnline: 1 }; showModal.value = true }
const openEdit = (v) => { isEdit.value = true; form.value = { id: v.id, nickname: v.nickname, avatar: v.avatar || '', role: v.role || 'default', dialogueStyle: v.dialogueStyle || 'friendly', status: v.status, isOnline: v.isOnline }; showModal.value = true }
const save = async () => {
  try {
    const res = isEdit.value ? await adminService.updateVirtualUser(form.value.id, form.value) : await adminService.createVirtualUser(form.value)
    if (res.code === 200 || res.code === 0) { alert('保存成功'); showModal.value = false; loadList() } else { alert(res.message || '保存失败') }
  } catch (e) { console.error(e) }
}
const toggle = async (v) => { try { await adminService.toggleVirtualUserStatus(v.id, v.status === 1 ? 0 : 1); loadList() } catch (e) { console.error(e) } }
const remove = async (v) => { if (!confirm(`确定删除 ${v.nickname}?`)) return; try { await adminService.deleteVirtualUser(v.id); loadList() } catch (e) { console.error(e) } }
onMounted(loadList)
</script>

<style scoped>
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; }
.btn-primary { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.data-table th { text-align: left; padding: 12px; background: #fafafa; color: #666; font-size: 13px; font-weight: 600; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.user-avatar-small { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
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
