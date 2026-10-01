<template>
  <div>
    <div class="page-actions">
      <button class="btn-primary" @click="openCreate">+ 新增虚拟用户</button>
    </div>
    <div v-if="loading" class="loading-wrap"><div class="spinner"></div><span>加载中...</span></div>
    <table class="data-table" v-else>
      <thead><tr><th>ID</th><th>头像</th><th>姓名</th><th>性别</th><th>年龄</th><th>地区</th><th>标签</th><th>价格</th><th>在线</th><th>随机在线</th><th>推荐</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="v in list" :key="v.id">
          <td>{{ v.id }}</td>
          <td><img :src="v.avatar || defaultAvatar" class="user-avatar-small" /></td>
          <td>{{ v.name || '-' }}</td>
          <td>{{ genderText(v.gender) }}</td>
          <td>{{ v.age }}</td>
          <td>{{ v.region || '-' }}</td>
          <td>{{ tagText(v) }}</td>
          <td>{{ v.price_per_hour ? '¥' + v.price_per_hour + '/小时' : '-' }}</td>
          <td><span :class="['status-tag', v.online_status === 1 ? 'active' : 'disabled']">{{ v.online_status === 1 ? '在线' : '离线' }}</span></td>
          <td>
            <span :class="['status-tag', v.random_online === 1 ? 'active' : 'disabled']">{{ v.random_online === 1 ? '开启' : '关闭' }}</span>
            <span v-if="v.random_online === 1" class="random-online-detail">{{ v.online_time_start }}-{{ v.online_time_end }} · {{ v.online_duration_min }}-{{ v.online_duration_max }}分钟</span>
          </td>
          <td><span :class="['status-tag', v.is_recommend === 1 ? 'active' : 'disabled']">{{ v.is_recommend === 1 ? '推荐' : '否' }}</span></td>
          <td><span :class="['status-tag', v.status === 1 ? 'active' : 'disabled']">{{ v.status === 1 ? '启用' : '禁用' }}</span></td>
          <td>
            <button class="btn-sm" @click="openEdit(v)">编辑</button>
            <button class="btn-sm" @click="toggleRecommend(v)">{{ v.is_recommend === 1 ? '取消推荐' : '推荐' }}</button>
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
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑虚拟用户' : '新增虚拟用户' }}</h3>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>
        <div class="form-grid">
          <label>姓名: <input v-model="form.name" required /></label>
          <label>头像: <input v-model="form.avatar" placeholder="头像图片URL" /></label>
          <label>性别: <select v-model.number="form.gender"><option :value="0">保密</option><option :value="1">男</option><option :value="2">女</option></select></label>
          <label>年龄: <input type="number" v-model.number="form.age" /></label>
          <label>地区: <input v-model="form.region" placeholder="如：上海" /></label>
          <label>标签: <input v-model="form.tagInput" placeholder="逗号分隔，如：游戏陪玩,情感咨询" /></label>
          <label>简介: <textarea v-model="form.intro" rows="3" placeholder="虚拟用户简介"></textarea></label>
          <label>每小时价格: <input type="number" step="0.01" v-model.number="form.price_per_hour" /></label>
          <label>在线状态: <select v-model.number="form.online_status" :disabled="form.random_online === 1"><option :value="0">离线</option><option :value="1">在线</option></select></label>
          <label>随机在线: <select v-model.number="form.random_online"><option :value="0">关闭（手动管理在线）</option><option :value="1">开启（按时段随机上下线）</option></select></label>
          <template v-if="form.random_online === 1">
            <label>在线时段开始: <input type="time" v-model="form.online_time_start" step="60" /></label>
            <label>在线时段结束: <input type="time" v-model="form.online_time_end" step="60" /><small class="form-tip">可跨天，如 22:00 - 02:00</small></label>
            <label>最短在线时长(分钟): <input type="number" min="1" v-model.number="form.online_duration_min" /></label>
            <label>最长在线时长(分钟): <input type="number" min="1" v-model.number="form.online_duration_max" /></label>
          </template>
          <label>是否推荐: <select v-model.number="form.is_recommend"><option :value="0">否</option><option :value="1">是</option></select></label>
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
const { page, pageSize, total, totalPages, getHost, getHeaders } = useAdminApi()
const toast = useToast()
const list = ref([])
const loading = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=virtual'
const form = ref(emptyForm())

const genderMap = { 0: '保密', 1: '男', 2: '女' }
const genderText = (g) => genderMap[g] || '保密'
const tagText = (v) => {
  if (v.tags) {
    try { return Array.isArray(v.tags) ? v.tags.join(', ') : v.tags } catch (e) { return v.tags }
  }
  return '-'
}

function emptyForm() {
  return {
    id: '', name: '', avatar: '', gender: 0, age: 0, region: '', tagInput: '',
    intro: '', price_per_hour: 0, online_status: 0,
    random_online: 0, online_time_start: '09:00', online_time_end: '23:00',
    online_duration_min: 30, online_duration_max: 90,
    is_recommend: 0, status: 1
  }
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await adminService.getVirtualUsers({ page: page.value, pageSize: pageSize.value })
    if (res.code === 200 || res.code === 0) { list.value = res.data.list || res.data || []; total.value = res.data.pagination?.total || list.value.length }
  } catch (e) { toast.error('加载失败: ' + (e.message || '网络错误')) }
  finally { loading.value = false }
}
const openCreate = () => { isEdit.value = false; form.value = emptyForm(); showModal.value = true }
const openEdit = (v) => {
  isEdit.value = true
  let tagsArr = []
  if (v.tags) { try { tagsArr = Array.isArray(v.tags) ? v.tags : JSON.parse(v.tags) } catch (e) { tagsArr = String(v.tags).split(',') } }
  form.value = {
    id: v.id, name: v.name, avatar: v.avatar || '', gender: v.gender || 0, age: v.age || 0,
    region: v.region || '', tagInput: (Array.isArray(tagsArr) ? tagsArr : []).join(','),
    intro: v.intro || '', price_per_hour: v.price_per_hour || 0,
    online_status: v.online_status || 0,
    random_online: v.random_online || 0,
    online_time_start: v.online_time_start || '09:00', online_time_end: v.online_time_end || '23:00',
    online_duration_min: v.online_duration_min || 30, online_duration_max: v.online_duration_max || 90,
    is_recommend: v.is_recommend || 0, status: v.status
  }
  showModal.value = true
}
const save = async () => {
  if (!form.value.name) { toast.error('姓名不能为空'); return }
  const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
  if (form.value.random_online === 1) {
    if (!TIME_PATTERN.test(form.value.online_time_start)) { toast.error('在线时段开始时间格式应为 HH:mm'); return }
    if (!TIME_PATTERN.test(form.value.online_time_end)) { toast.error('在线时段结束时间格式应为 HH:mm'); return }
    if (!(form.value.online_duration_min >= 1) || !(form.value.online_duration_max >= 1)) { toast.error('在线时长应为不小于 1 的整数（分钟）'); return }
    if (form.value.online_duration_min > form.value.online_duration_max) { toast.error('最短在线时长不能大于最长时长'); return }
  }
  try {
    const payload = { ...form.value }
    delete payload.id
    delete payload.tagInput
    payload.tags = form.value.tagInput ? form.value.tagInput.split(/[,，]/).map(s => s.trim()).filter(Boolean) : ''
    payload.price_per_hour = Number(payload.price_per_hour) || 0
    // 开启随机在线后，在线状态交由调度器管理，避免手动状态与调度逻辑冲突
    if (payload.random_online === 1 && !isEdit.value) {
      payload.online_status = 0
    }
    const res = isEdit.value ? await adminService.updateVirtualUser(form.value.id, payload) : await adminService.createVirtualUser(payload)
    if (res.code === 200 || res.code === 0) { toast.success('保存成功'); showModal.value = false; loadList() } else { toast.error(res.message || '保存失败') }
  } catch (e) { toast.error('保存失败: ' + (e.message || '网络错误')) }
}
const toggle = async (v) => { try { await adminService.toggleVirtualUserStatus(v.id, v.status === 1 ? 0 : 1); toast.success(v.status === 1 ? '已禁用' : '已启用'); loadList() } catch (e) { toast.error('操作失败: ' + (e.message || '网络错误')) } }
const toggleRecommend = async (v) => { try { await adminService.updateVirtualUser(v.id, { is_recommend: v.is_recommend === 1 ? 0 : 1 }); toast.success(v.is_recommend === 1 ? '已取消推荐' : '已推荐'); loadList() } catch (e) { toast.error('操作失败: ' + (e.message || '网络错误')) } }
const remove = async (v) => { if (!confirm(`确定删除 ${v.name}?`)) return; try { await adminService.deleteVirtualUser(v.id); toast.success('虚拟用户已删除'); loadList() } catch (e) { toast.error('删除失败: ' + (e.message || '网络错误')) } }
onMounted(loadList)
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
.user-avatar-small { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-tag.active { background: #f6ffed; color: #52c41a; }
.status-tag.disabled { background: #fff1f0; color: #ff4d4f; }
.random-online-detail { display: block; margin-top: 4px; font-size: 12px; color: #999; }
.form-tip { font-size: 12px; color: #999; }
.btn-sm { padding: 4px 10px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px; margin-right: 4px; }
.btn-sm.warn { color: #fa8c16; border-color: #fa8c16; }
.btn-sm.danger { color: #ff4d4f; border-color: #ff4d4f; }
.pagination { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 16px; font-size: 13px; color: #666; }
.pagination button { padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { background: #fff; border-radius: 8px; padding: 24px; width: 520px; max-height: 80vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.modal-header h3 { margin: 0; }
.modal-close { width: 28px; height: 28px; border: none; background: transparent; font-size: 22px; color: #999; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 4px; line-height: 1; }
.modal-close:hover { color: #333; background: #f5f5f5; }
.form-grid { display: grid; gap: 12px; }
.form-grid label { display: flex; flex-direction: column; font-size: 13px; color: #666; gap: 4px; }
.form-grid input, .form-grid select, .form-grid textarea { padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; font-family: inherit; }
.modal-actions { margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end; }
.modal-actions button { padding: 8px 20px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.modal-actions .btn-primary { background: #1890ff; color: #fff; border: none; }
</style>
