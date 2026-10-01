<template>
  <div>
    <div class="tabs">
      <button :class="['tab-btn', { active: activeTab === 'users' }]" @click="activeTab = 'users'">用户列表</button>
      <button :class="['tab-btn', { active: activeTab === 'roles' }]" @click="activeTab = 'roles'">权限管理员</button>
    </div>
    <div v-show="activeTab === 'users'">
    <div class="page-actions">
      <input v-model="searchKeyword" placeholder="搜索用户名/昵称..." class="search-input" @keyup.enter="loadList" />
      <select v-model="filterStatus" class="status-select" @change="loadList">
        <option value="">全部状态</option>
        <option value="1">正常</option>
        <option value="0">禁用</option>
      </select>
      <button class="btn-primary" @click="openCreate">+ 新增用户</button>
    </div>
    <div v-if="loading" class="loading-wrap"><div class="spinner"></div><span>加载中...</span></div>
    <table class="data-table" v-else>
      <thead><tr><th>ID</th><th>头像</th><th>昵称</th><th>手机号</th><th>余额</th><th>VIP</th><th>状态</th><th>注册时间</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="u in list" :key="u.userId || u.id">
          <td>{{ u.userId || u.id }}</td>
          <td><img :src="u.avatar || defaultAvatar" class="user-avatar-small" /></td>
          <td>{{ u.nickName || u.nickname || '-' }}</td>
          <td>{{ u.phone || '-' }}</td>
          <td>¥{{ u.balance || u.money || 0 }}</td>
          <td>{{ u.vipLevel || u.vipLv || 0 }}</td>
          <td><span :class="['status-tag', (u.status === 1 ? 'active' : 'disabled')]">{{ u.status === 1 ? '正常' : '禁用' }}</span></td>
          <td>{{ formatTime(u.createTime || u.createdAt) }}</td>
          <td class="actions-cell">
            <button class="btn-sm" @click="viewDetail(u)">详情</button>
            <button class="btn-sm" @click="openEdit(u)">编辑</button>
            <button class="btn-sm warn" @click="toggleStatus(u)">{{ u.status === 1 ? '禁用' : '启用' }}</button>
            <button class="btn-sm danger" @click="removeUser(u)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <button :disabled="page <= 1" @click="page--; loadList()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页 (共 {{ total }} 条)</span>
      <button :disabled="page >= totalPages" @click="page++; loadList()">下一页</button>
    </div>

    <!-- 用户详情弹窗 -->
    <div class="modal-overlay" v-if="showDetail" @click.self="showDetail = false">
      <div class="detail-modal">
        <div class="detail-header">
          <h3>用户详情</h3>
          <button class="close-btn" @click="showDetail = false">&times;</button>
        </div>
        <div class="detail-body">
          <div class="detail-avatar-row">
            <img :src="detailItem.avatar || defaultAvatar" class="detail-avatar" />
            <div class="detail-name">{{ detailItem.nickname || detailItem.nickName || detailItem.username || '-' }}</div>
          </div>
          <div class="detail-row"><span class="detail-label">用户ID</span><span>{{ detailItem.userId || detailItem.id }}</span></div>
          <div class="detail-row"><span class="detail-label">用户名</span><span>{{ detailItem.username || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">手机号</span><span>{{ detailItem.phone || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">邮箱</span><span>{{ detailItem.email || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">性别</span><span>{{ {0:'女',1:'男',2:'保密'}[detailItem.gender] || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">城市</span><span>{{ detailItem.city || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">VIP等级</span><span>Lv.{{ detailItem.vipLevel || detailItem.vipLv || 0 }}</span></div>
          <div class="detail-row"><span class="detail-label">余额</span><span class="price">¥{{ detailItem.balance || detailItem.money || 0 }}</span></div>
          <div class="detail-row"><span class="detail-label">状态</span><span :class="['status-tag', (detailItem.status === 1 ? 'active' : 'disabled')]">{{ detailItem.status === 1 ? '正常' : '禁用' }}</span></div>
          <div class="detail-row"><span class="detail-label">注册时间</span><span>{{ formatTime(detailItem.createTime || detailItem.createdAt) }}</span></div>
        </div>
        <div class="detail-footer">
          <button class="btn-primary" @click="showDetail = false">关闭</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑用户' : '新增用户' }}</h3>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>
        <div class="form-grid">
          <label>昵称: <input v-model="form.nickname" /></label>
          <label>手机号: <input v-model="form.phone" /></label>
          <label>邮箱: <input v-model="form.email" /></label>
          <label>头像: <input v-model="form.avatar" /></label>
          <label>性别: <select v-model="form.gender"><option :value="0">女</option><option :value="1">男</option><option :value="2">保密</option></select></label>
          <label>城市: <input v-model="form.city" /></label>
          <label>VIP等级: <input v-model.number="form.vipLv" type="number" /></label>
          <label>余额: <input v-model.number="form.money" type="number" /></label>
          <label>状态: <select v-model="form.status"><option :value="1">正常</option><option :value="0">禁用</option></select></label>
        </div>
        <div class="modal-actions">
          <button class="btn-primary" @click="save">保存</button>
          <button @click="showModal = false">取消</button>
        </div>
      </div>
    </div>
    </div>
    <AdminRoles v-show="activeTab === 'roles'" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import adminService from '../../services/adminService'
import { useAdminApi } from '../../composables/useAdminApi'
import { useToast } from '../../composables/useToast'
import AdminRoles from './AdminRoles.vue'
const { page, pageSize, total, totalPages, searchKeyword, filterStatus, formatTime, getHost, prevPage, nextPage } = useAdminApi()
const toast = useToast()
const activeTab = ref('users')
const list = ref([])
const loading = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
const form = ref({ userId: '', nickname: '', phone: '', email: '', avatar: '', gender: 2, city: '', vipLv: 0, money: 0, status: 1 })

const loadList = async () => {
  loading.value = true
  try {
    const res = await adminService.getUsers({ page: page.value, pageSize: pageSize.value, nickname: searchKeyword.value, status: filterStatus.value || undefined })
    if (res.code === 200 || res.code === 0) { list.value = res.data.list || res.data || []; total.value = res.data.pagination?.total || list.value.length }
  } catch (e) { toast.error('加载失败: ' + (e.message || '网络错误')) }
  finally { loading.value = false }
}
const openCreate = () => { isEdit.value = false; form.value = { userId: '', nickname: '', phone: '', email: '', avatar: '', gender: 2, city: '', vipLv: 0, money: 0, status: 1 }; showModal.value = true }
const openEdit = (u) => { isEdit.value = true; form.value = { userId: u.userId || u.id, nickname: u.nickname || u.nickName || '', phone: u.phone || '', email: u.email || '', avatar: u.avatar || '', gender: u.gender || 2, city: u.city || '', vipLv: u.vipLevel || u.vipLv || 0, money: u.balance || u.money || 0, status: u.status }; showModal.value = true }
const save = async () => {
  try {
    const res = isEdit.value ? await adminService.updateUser(form.value.userId, form.value) : await adminService.createUser(form.value)
    if (res.code === 200 || res.code === 0) { toast.success('保存成功'); showModal.value = false; loadList() } else { toast.error(res.message || '保存失败') }
  } catch (e) { toast.error('保存失败: ' + (e.message || '网络错误')) }
}
const showDetail = ref(false)
const detailItem = ref({})
const viewDetail = (u) => { detailItem.value = u; showDetail.value = true }
const toggleStatus = async (u) => { try { const res = await adminService.updateUserStatus(u.userId || u.id, u.status === 1 ? 0 : 1); if (res.code === 200 || res.code === 0) { toast.success(u.status === 1 ? '已禁用' : '已启用'); loadList() } } catch (e) { toast.error('操作失败: ' + (e.message || '网络错误')) } }
const removeUser = async (u) => { if (!confirm(`确定删除用户 ${u.nickname || u.nickName || u.userId}?`)) return; try { await adminService.deleteUser(u.userId || u.id); toast.success('用户已删除'); loadList() } catch (e) { toast.error('删除失败: ' + (e.message || '网络错误')) } }

watch([page, searchKeyword, filterStatus], () => loadList(), { immediate: false })
onMounted(loadList)
</script>

<style scoped>
.loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: #999; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #f0f0f0; border-top-color: #1890ff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #e8e8e8; }
.tab-btn { padding: 8px 20px; border: none; background: transparent; cursor: pointer; font-size: 14px; color: #666; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.tab-btn:hover { color: #1890ff; }
.tab-btn.active { color: #1890ff; border-bottom-color: #1890ff; font-weight: 600; }
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }
.search-input { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; width: 200px; }
.status-select { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; }
.btn-primary { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.btn-sm { padding: 4px 10px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px; margin-right: 4px; }
.btn-sm.warn { color: #fa8c16; border-color: #fa8c16; }
.btn-sm.danger { color: #ff4d4f; border-color: #ff4d4f; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.data-table th { text-align: left; padding: 12px; background: #fafafa; color: #666; font-size: 13px; font-weight: 600; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.user-avatar-small { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-tag.active { background: #f6ffed; color: #52c41a; }
.status-tag.disabled { background: #fff1f0; color: #ff4d4f; }
.actions-cell { white-space: nowrap; }
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
/* 详情弹窗 */
.detail-modal { background: #fff; border-radius: 12px; width: 520px; max-height: 80vh; overflow-y: auto; box-shadow: 0 8px 40px rgba(0,0,0,0.12); }
.detail-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.detail-header h3 { font-size: 18px; font-weight: 600; color: #1a1a1a; margin-bottom: 0; }
.detail-body { padding: 20px 24px; }
.detail-avatar-row { display: flex; align-items: center; gap: 16px; padding: 8px 0 20px; border-bottom: 1px solid #f0f0f0; margin-bottom: 12px; }
.detail-avatar { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; background: #f5f5f5; }
.detail-name { font-size: 18px; font-weight: 600; color: #1a1a1a; }
.detail-row { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.detail-row:last-child { border-bottom: none; }
.detail-label { width: 100px; font-size: 13px; color: #999; flex-shrink: 0; }
.detail-row > span:last-child { font-size: 14px; color: #333; }
.detail-row .price { color: #ff4d4f; font-weight: 600; font-size: 16px; }
.detail-footer { padding: 16px 24px; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; }
.detail-footer .btn-primary { padding: 8px 28px; background: #1890ff; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.close-btn { background: none; border: none; font-size: 24px; color: #999; cursor: pointer; padding: 0; line-height: 1; }
.close-btn:hover { color: #333; }
</style>
