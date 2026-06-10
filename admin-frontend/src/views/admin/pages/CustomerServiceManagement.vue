<template>
  <div class="admin-card">
    <!-- Toast 提示 -->
    <div v-if="toast.show" :class="['toast', 'toast-' + toast.type]">{{ toast.message }}</div>

    <div class="toolbar">
      <div class="search-bar">
        <input v-model="searchKeyword" type="text" placeholder="搜索客服名称" class="search-input" @keyup.enter="loadServices" />
        <select v-model="filterStatus" class="filter-select" @change="loadServices">
          <option value="">全部状态</option>
          <option value="1">启用</option>
          <option value="0">禁用</option>
        </select>
        <select v-model="filterRole" class="filter-select" @change="loadServices">
          <option value="">全部角色</option>
          <option value="normal">客服</option>
          <option value="senior">资深客服</option>
        </select>
        <button class="search-btn" @click="loadServices">搜索</button>
      </div>
      <button class="add-btn" @click="openAddModal">添加客服</button>
    </div>

    <div class="stats-grid" style="margin-bottom: 22px;">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ pagination.total }}</div>
          <div class="stat-label">客服总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🟢</div>
        <div class="stat-info">
          <div class="stat-value">{{ onlineCount }}</div>
          <div class="stat-label">在线客服</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💬</div>
        <div class="stat-info">
          <div class="stat-value">{{ todayMessages }}</div>
          <div class="stat-label">今日消息</div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <table v-else-if="services.length > 0" class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>用户ID</th>
          <th>头像</th>
          <th>名称</th>
          <th>角色</th>
          <th>简介</th>
          <th>状态</th>
          <th>在线状态</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="service in services" :key="service.id">
          <td>{{ service.id }}</td>
          <td>{{ service.userId || service.user_id || '-' }}</td>
          <td>
            <img :src="service.avatar || defaultAvatar" class="user-avatar" alt="" />
          </td>
          <td>{{ service.name }}</td>
          <td>
            <span :class="['status-badge', 'role-badge', service.role === 'senior' ? 'senior' : 'normal']">
              {{ service.role === 'senior' ? '资深客服' : '客服' }}
            </span>
          </td>
          <td class="text-ellipsis">{{ service.description || '-' }}</td>
          <td>
            <span :class="['status-badge', service.status === 1 ? 'active' : 'disabled']">
              {{ service.status === 1 ? '启用' : '禁用' }}
            </span>
          </td>
          <td>
            <span :class="['status-badge', service.online ? 'active' : 'disabled']">
              {{ service.online ? '在线' : '离线' }}
            </span>
          </td>
          <td>{{ formatDate(service.create_time) }}</td>
          <td>
            <button class="action-btn" @click="openEditModal(service)">编辑</button>
            <button class="action-btn" @click="toggleOnline(service)">
              {{ service.online ? '下线' : '上线' }}
            </button>
            <button class="action-btn delete-btn" @click="deleteService(service)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && services.length === 0" class="empty-state">
      <div class="empty-icon">💁</div>
      <div class="empty-text">暂无客服数据</div>
    </div>

    <!-- 分页 -->
    <div v-if="pagination.totalPages > 1" class="pagination">
      <button :disabled="page === 1" @click="goPage(page - 1)" class="pg-btn">上一页</button>
      <template v-for="p in pageNumbers" :key="p">
        <button v-if="p === '...'" class="pg-btn pg-ellipsis" disabled>...</button>
        <button v-else :class="['pg-btn', { 'pg-active': p === page }]" @click="goPage(p)">{{ p }}</button>
      </template>
      <button :disabled="page >= pagination.totalPages" @click="goPage(page + 1)" class="pg-btn">下一页</button>
      <span class="pg-info">共 {{ pagination.total }} 条</span>
    </div>

    <!-- 添加/编辑弹窗 -->
    <div class="modal-overlay cs-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal-content cs-modal">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑客服' : '添加客服' }}</h3>
          <button class="close-btn" @click="showModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>用户ID <span class="label-hint">（{{ isEdit ? '仅在编辑时显示' : '自动生成' }}）</span></label>
            <div class="id-input-row">
              <input type="text" v-model="form.userId" placeholder="输入用户ID后自动匹配" class="form-input" @blur="lookupUser" @keyup.enter="lookupUser" />
              <span v-if="userHint.text" :class="['user-hint', userHint.type]">{{ userHint.text }}</span>
            </div>
          </div>
          <div class="form-group">
            <label>名称</label>
            <input type="text" v-model="form.name" placeholder="请输入客服名称" class="form-input" />
          </div>
          <div class="form-group">
            <label>头像URL</label>
            <input type="text" v-model="form.avatar" placeholder="请输入头像URL" class="form-input" />
          </div>
          <div class="form-group">
            <label>角色</label>
            <select v-model="form.role" class="form-input">
              <option value="normal">客服</option>
              <option value="senior">资深客服</option>
            </select>
          </div>
          <div class="form-group">
            <label>简介</label>
            <textarea v-model="form.description" placeholder="请输入客服简介" class="form-input"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showModal = false">取消</button>
          <button class="confirm-btn" @click="saveService">{{ isEdit ? '保存' : '确认添加' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { apiGet, apiPost, apiPut, apiDelete, confirm } = useAdmin()

const services = ref([])
const showModal = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const searchKeyword = ref('')
const filterStatus = ref('')
const filterRole = ref('')
const userHint = reactive({ text: '', type: '' })
const page = ref(1)
const pageSize = ref(20)
const todayMessages = ref(0)
const loading = ref(false)
const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'

const toast = reactive({ show: false, message: '', type: 'success' })

const pagination = reactive({ total: 0, totalPages: 1 })

const form = reactive({
  id: null,
  userId: null,
  name: '',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  role: 'normal',
  description: ''
})

const onlineCount = computed(() => services.value.filter(s => s.online).length)

const pageNumbers = computed(() => {
  const total = pagination.totalPages
  const current = page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  if (current <= 3) {
    for (let i = 1; i <= 4; i++) pages.push(i)
    pages.push('...')
    pages.push(total)
  } else if (current >= total - 2) {
    pages.push(1)
    pages.push('...')
    for (let i = total - 3; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    pages.push('...')
    for (let i = current - 1; i <= current + 1; i++) pages.push(i)
    pages.push('...')
    pages.push(total)
  }
  return pages
})

const showToast = (message, type = 'success') => {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => { toast.show = false }, 3000)
}

const loadServices = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterStatus.value) params.status = filterStatus.value
    if (filterRole.value) params.role = filterRole.value
    const res = await apiGet('/api/admin/customer-services', params)
    if (res.code === 200) {
      const data = res.data
      services.value = data?.list || data || []
      if (data?.pagination) {
        pagination.total = data.pagination.total
        pagination.totalPages = data.pagination.totalPages
      } else {
        pagination.total = services.value.length
        pagination.totalPages = 1
      }
    }
  } catch (error) {
    showToast('加载客服列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const goPage = (p) => {
  page.value = p
  loadServices()
}

const lookupUser = async () => {
  if (isEdit.value) return
  const uid = form.userId ? String(form.userId).trim() : ''
  if (!uid) {
    userHint.text = ''
    return
  }
  try {
    const res = await apiGet('/api/admin/users/' + uid)
    if (res.code === 200 && res.data) {
      const user = res.data
      form.name = user.nickname || user.username || user.name || ''
      form.avatar = user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
      userHint.text = `已匹配：${user.nickname || user.username || '用户' + uid}`
      userHint.type = 'success'
    } else {
      userHint.text = '用户不存在'
      userHint.type = 'error'
    }
  } catch {
    userHint.text = '查询失败'
    userHint.type = 'error'
  }
}

const openAddModal = () => {
  isEdit.value = false
  editId.value = null
  Object.assign(form, { id: null, userId: null, name: '', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default', role: 'normal', description: '' })
  userHint.text = ''
  userHint.type = ''
  showModal.value = true
}

const openEditModal = (service) => {
  isEdit.value = true
  editId.value = service.userId || service.user_id
  Object.assign(form, {
    id: service.id || null,
    userId: service.userId || service.user_id || null,
    name: service.name || '',
    avatar: service.avatar || '',
    role: service.role || 'normal',
    description: service.description || ''
  })
  userHint.text = ''
  userHint.type = ''
  showModal.value = true
}

const saveService = async () => {
  if (!form.name.trim()) {
    showToast('请输入客服名称', 'warning')
    return
  }
  try {
    const payload = {
      name: form.name,
      avatar: form.avatar,
      role: form.role,
      description: form.description
    }
    // 添加模式：留空自动分配
    if (!isEdit.value && form.userId) {
      payload.userId = form.userId
    }
    // 编辑模式：传递新ID
    if (isEdit.value && form.userId) {
      payload.userId = form.userId
    }
    let res
    if (isEdit.value) {
      res = await apiPut('/api/admin/customer-services/' + editId.value, payload)
    } else {
      res = await apiPost('/api/admin/customer-services', payload)
    }
    if (res.code === 200) {
      showToast(isEdit.value ? '保存成功' : '添加成功')
      showModal.value = false
      await loadServices()
    } else {
      showToast(res.message || '操作失败', 'error')
    }
  } catch (error) {
    showToast('操作失败: ' + error.message, 'error')
  }
}

const toggleOnline = async (service) => {
  try {
    const uid = service.userId || service.user_id
    const res = await apiPut('/api/admin/customer-services/' + uid, {
      online: !service.online
    })
    if (res.code === 200) {
      await loadServices()
    } else {
      showToast(res.message || '更新失败', 'error')
    }
  } catch (error) {
    showToast('更新失败', 'error')
  }
}

const deleteService = async (service) => {
  if (!(await confirm(`确定要删除客服"${service.name}"吗？`))) return
  try {
    const uid = service.userId || service.user_id
    const res = await apiDelete('/api/admin/customer-services/' + uid)
    if (res.code === 200) {
      showToast('删除成功')
      await loadServices()
    } else {
      showToast(res.message || '删除失败', 'error')
    }
  } catch (error) {
    showToast('删除失败', 'error')
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const d = new Date(typeof timestamp === 'number' && timestamp > 1e12 ? timestamp : timestamp * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  loadServices()
})
</script>

<style scoped>
/* Toast */
.toast {
  position: fixed; top: 24px; right: 24px; padding: 12px 24px;
  border-radius: 8px; font-size: 14px; color: #fff; z-index: 9999;
  animation: slideIn 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.toast-success { background: #00b894; }
.toast-error { background: #d63031; }
.toast-warning { background: #fdcb6e; color: #333; }

.toolbar {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
}
.search-bar {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.search-input {
  padding: 8px 14px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 14px; width: 200px;
}
.filter-select {
  padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 14px; background: #fff; cursor: pointer;
}
.filter-select:focus { outline: none; border-color: #6c5ce7; }
.search-input:focus { outline: none; border-color: #6c5ce7; }
.search-btn {
  padding: 8px 18px; background: #f0f0f0; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;
}
.search-btn:hover { background: #e0e0e0; }
.add-btn {
  padding: 8px 20px; background: #6c5ce7; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;
}
.add-btn:hover { background: #5a4bd1; }

.stats-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
}
.stat-card {
  background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #f0f0f0;
  display: flex; align-items: center; gap: 14px;
}
.stat-icon { font-size: 32px; }
.stat-value { font-size: 22px; font-weight: 700; color: #1a1a1a; }
.stat-label { font-size: 13px; color: #888; }

.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; }
.data-table th { background: #fafafa; padding: 14px 12px; text-align: left; font-size: 13px; color: #888; font-weight: 600; }
.data-table td { padding: 14px 12px; border-top: 1px solid #f5f5f5; font-size: 14px; }
.text-ellipsis { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.user-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }

.status-badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; }
.status-badge.active { background: #e6f7ec; color: #00b894; }
.status-badge.disabled { background: #f5f5f5; color: #999; }
.role-badge.senior { background: #fff3e0; color: #e17055; }
.role-badge.normal { background: #f0f0ff; color: #6c5ce7; }

.action-btn {
  padding: 4px 12px; border: 1px solid #e0e0e0; background: #fff; border-radius: 6px;
  margin-right: 6px; cursor: pointer; font-size: 13px; color: #555;
}
.action-btn:hover { border-color: #6c5ce7; color: #6c5ce7; }
.delete-btn:hover { border-color: #d63031; color: #d63031; }

/* Pagination */
.pagination { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 20px; }
.pg-btn {
  padding: 6px 12px; border: 1px solid #e0e0e0; background: #fff; border-radius: 6px;
  cursor: pointer; font-size: 13px; color: #555;
}
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-btn:hover:not(:disabled) { border-color: #6c5ce7; color: #6c5ce7; }
.pg-active { background: #6c5ce7; color: #fff; border-color: #6c5ce7; }
.pg-ellipsis { border: none; cursor: default; }
.pg-info { margin-left: 12px; font-size: 13px; color: #999; }

/* Modal */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-content { background: #fff; border-radius: 12px; width: 460px; max-height: 80vh; overflow-y: auto; }
.cs-overlay { align-items: flex-start; justify-content: flex-start; padding-top: 40px; padding-left: 240px; }
.cs-modal { width: calc(100vw - 280px); max-width: none !important; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 1px solid #f0f0f0; }
.modal-header h3 { margin: 0; font-size: 16px; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #999; }
.modal-body { padding: 24px; }
.modal-footer { padding: 14px 24px; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; gap: 10px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 14px; color: #555; margin-bottom: 6px; }
.label-hint { font-weight: 400; color: #9ca3af; font-size: 12px; }
.id-input-row { display: flex; align-items: center; gap: 10px; }
.user-hint { font-size: 12px; white-space: nowrap; }
.user-hint.success { color: #00b894; }
.user-hint.error { color: #d63031; }
.form-input { width: 100%; padding: 9px 12px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
.form-input:focus { outline: none; border-color: #6c5ce7; }
textarea.form-input { min-height: 70px; resize: vertical; }
.cancel-btn { padding: 8px 20px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; cursor: pointer; }
.confirm-btn { padding: 8px 20px; background: #6c5ce7; color: #fff; border: none; border-radius: 8px; cursor: pointer; }
.confirm-btn:hover { background: #5a4bd1; }
</style>
