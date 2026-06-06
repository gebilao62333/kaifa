<template>
  <div class="admin-card">
    <div class="toolbar">
      <div class="search-bar">
        <input v-model="searchKeyword" type="text" placeholder="搜索用户名/昵称" class="search-input" />
        <select v-model="filterStatus" class="search-select">
          <option value="">全部状态</option>
          <option value="1">正常</option>
          <option value="0">禁用</option>
        </select>
        <button @click="loadAdmins" class="search-btn">搜索</button>
        <button @click="openCreateAdminModal" class="add-btn">添加管理员</button>
        <button @click="exportData" class="export-btn">📥 导出CSV</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <table v-else-if="adminList.length > 0" class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>用户名</th>
          <th>昵称</th>
          <th>邮箱</th>
          <th>手机</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="admin in adminList" :key="admin.id">
          <td>{{ admin.id }}</td>
          <td>{{ admin.username }}</td>
          <td>{{ admin.nickname }}</td>
          <td>{{ admin.email || '-' }}</td>
          <td>{{ admin.phone || '-' }}</td>
          <td>
            <span :class="['status-badge', admin.status === 1 ? 'active' : 'disabled']">
              {{ admin.status === 1 ? '正常' : '禁用' }}
            </span>
          </td>
          <td>{{ formatTime(admin.create_time) }}</td>
          <td>
            <button @click="editAdmin(admin)" class="action-btn">编辑</button>
            <button @click="openPasswordModal(admin)" class="action-btn">修改密码</button>
            <button v-if="admin.id !== 1" @click="deleteAdmin(admin)" class="action-btn delete-btn">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && adminList.length === 0" class="empty-state">
      <div class="empty-icon">🛡️</div>
      <div class="empty-text">暂无管理员数据</div>
    </div>

    <div class="pagination">
      <div class="pagination-left">
        <span class="page-size-label">每页</span>
        <select v-model.number="pageSize" @change="page = 1; loadAdmins()" class="page-size-select">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span class="page-size-label">条，共 {{ total }} 条</span>
      </div>
      <div class="pagination-right">
        <button @click="page = 1; loadAdmins()" class="page-btn" :disabled="page <= 1">首页</button>
        <button @click="page--; loadAdmins()" class="page-btn" :disabled="page <= 1">上一页</button>
        <template v-for="p in pageNumbers" :key="p">
          <span v-if="p === '...'" class="page-ellipsis">...</span>
          <button v-else @click="page = p; loadAdmins()" :class="['page-btn', { 'page-active': page === p }]">{{ p }}</button>
        </template>
        <button @click="page++; loadAdmins()" class="page-btn" :disabled="page >= totalPages">下一页</button>
        <button @click="page = totalPages; loadAdmins()" class="page-btn" :disabled="page >= totalPages">末页</button>
      </div>
    </div>

    <!-- 添加/编辑管理员模态框 -->
    <div v-if="showAdminModal" class="modal-overlay" @click.self="showAdminModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ currentAdmin.id ? '编辑管理员' : '添加管理员' }}</h3>
          <button @click="showAdminModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="currentAdmin.username" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>昵称</label>
            <input v-model="currentAdmin.nickname" type="text" class="form-input" />
          </div>
          <div class="form-group" v-if="!currentAdmin.id">
            <label>密码</label>
            <input v-model="currentAdmin.password" type="password" class="form-input" />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="currentAdmin.email" type="email" class="form-input" />
          </div>
          <div class="form-group">
            <label>手机</label>
            <input v-model="currentAdmin.phone" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model.number="currentAdmin.status" class="form-input">
              <option :value="1">正常</option>
              <option :value="0">禁用</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showAdminModal = false" class="cancel-btn">取消</button>
          <button @click="saveAdmin" class="confirm-btn">确认</button>
        </div>
      </div>
    </div>

    <!-- 修改密码模态框 -->
    <div v-if="showPasswordModal" class="modal-overlay" @click.self="showPasswordModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>修改密码 - {{ currentAdmin.username }}</h3>
          <button @click="showPasswordModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>新密码</label>
            <input v-model="currentAdmin.newPassword" type="password" class="form-input" placeholder="请输入新密码" />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showPasswordModal = false" class="cancel-btn">取消</button>
          <button @click="savePassword" class="confirm-btn">确认修改</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { page, pageSize, total, totalPages, pageNumbers, formatTime, apiGet, apiPost, apiPut, apiDelete, exportCSV, toast, confirm } = useAdmin()

const adminList = ref([])
const searchKeyword = ref('')
const filterStatus = ref('')
const currentAdmin = ref(null)
const showAdminModal = ref(false)
const showPasswordModal = ref(false)
const loading = ref(false)

const loadAdmins = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) { params.keyword = searchKeyword.value }
    if (filterStatus.value !== '') { params.status = filterStatus.value }
    const res = await apiGet('/api/admin-manage/admins', params)
    if (res.code === 200) {
      adminList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载管理员列表失败:', err)
    toast('加载管理员列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const openCreateAdminModal = () => {
  currentAdmin.value = {
    username: '',
    nickname: '',
    password: '',
    email: '',
    phone: '',
    status: 1
  }
  showAdminModal.value = true
}

const editAdmin = (admin) => {
  currentAdmin.value = { ...admin }
  showAdminModal.value = true
}

const saveAdmin = async () => {
  try {
    let res
    if (currentAdmin.value.id) {
      res = await apiPut('/api/admin-manage/admins/' + currentAdmin.value.id, currentAdmin.value)
    } else {
      res = await apiPost('/api/admin-manage/admins', currentAdmin.value)
    }
    if (res.code === 200) {
      showAdminModal.value = false
      loadAdmins()
    }
  } catch (err) {
    console.error('保存管理员失败:', err)
  }
}

const openPasswordModal = (admin) => {
  currentAdmin.value = { ...admin, newPassword: '' }
  showPasswordModal.value = true
}

const savePassword = async () => {
  try {
    const res = await apiPut('/api/admin-manage/admins/' + currentAdmin.value.id + '/password', {
      password: currentAdmin.value.newPassword
    })
    if (res.code === 200) {
      showPasswordModal.value = false
    }
  } catch (err) {
    console.error('修改密码失败:', err)
  }
}

const deleteAdmin = async (admin) => {
  if (!(await confirm('确定要删除这个管理员吗？'))) return
  try {
    const res = await apiDelete('/api/admin-manage/admins/' + admin.id)
    if (res.code === 200) {
      toast('管理员已删除')
      loadAdmins()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('删除管理员失败:', err)
    toast('删除管理员失败', 'error')
  }
}

const exportData = () => {
  exportCSV(adminList.value, [
    { label: 'ID', key: 'id' },
    { label: '用户名', key: 'username' },
    { label: '昵称', key: 'nickname' },
    { label: '邮箱', key: 'email' },
    { label: '手机', key: 'phone' },
    { label: '状态', key: row => row.status === 1 ? '正常' : '禁用' },
    { label: '创建时间', key: row => formatTime(row.create_time) }
  ], 'admins')
}

onMounted(() => {
  loadAdmins()
})
</script>
