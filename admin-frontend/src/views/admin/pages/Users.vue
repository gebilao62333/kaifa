<template>
  <div class="user-list">
    <div class="toolbar">
      <div class="search-bar">
        <input v-model="searchKeyword" type="text" placeholder="搜索用户昵称或手机号" class="search-input" />
        <select v-model="filterStatus" class="search-select">
          <option value="">全部状态</option>
          <option value="0">正常</option>
          <option value="1">禁用</option>
        </select>
        <button @click="loadUsers" class="search-btn">搜索</button>
        <button @click="openCreateUserAccountModal" class="add-btn">添加用户</button>
        <button @click="exportUsers" class="export-btn">📥 导出</button>
      </div>
      <div class="batch-bar" v-if="selectedIds.length > 0">
        <span>已选 {{ selectedIds.length }} 项</span>
        <button @click="batchToggleStatus(0)" class="batch-btn">批量启用</button>
        <button @click="batchToggleStatus(1)" class="batch-btn batch-danger">批量禁用</button>
        <button @click="selectedIds = []" class="batch-btn">取消选择</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <table v-else-if="userList.length > 0" class="data-table">
      <thead>
        <tr>
          <th style="width:40px">
            <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
          </th>
          <th>ID</th>
          <th>头像</th>
          <th>昵称</th>
          <th>手机号</th>
          <th>邮箱</th>
          <th>性别</th>
          <th>等级</th>
          <th>VIP等级</th>
          <th>金币</th>
          <th>城市</th>
          <th>状态</th>
          <th>注册时间</th>
          <th>最后登录</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in userList" :key="user.id">
          <td>
            <input type="checkbox" :checked="selectedIds.includes(user.id)" @change="toggleSelect(user.id)" />
          </td>
          <td>{{ user.id }}</td>
          <td>
            <img v-if="user.avatar" :src="user.avatar" class="user-avatar" />
            <span v-else class="avatar-placeholder">👤</span>
          </td>
          <td>{{ user.nickname }}</td>
          <td>{{ user.phone || '-' }}</td>
          <td>{{ user.email || '-' }}</td>
          <td>{{ user.sex === 1 ? '男' : user.sex === 2 ? '女' : '未知' }}</td>
          <td>Lv.{{ user.lv || 1 }}</td>
          <td>{{ user.vip ? 'VIP'+user.vipLv : '-' }}</td>
          <td>{{ user.money || 0 }} 金币</td>
          <td>{{ user.city || '-' }}</td>
          <td>
            <span :class="['status-badge', user.status === 0 ? 'active' : 'disabled']">
              {{ user.status === 0 ? '正常' : '禁用' }}
            </span>
          </td>
          <td>{{ formatTime(user.createTime) }}</td>
          <td>{{ user.lastLoginTime ? formatTime(user.lastLoginTime) : '-' }}</td>
          <td>
            <button @click="viewUser(user)" class="action-btn">查看</button>
            <button @click="editUserAccount(user)" class="action-btn">编辑</button>
            <button @click="toggleUserStatus(user)" class="action-btn">
              {{ user.status === 0 ? '禁用' : '启用' }}
            </button>
            <button @click="deleteUserAccount(user)" class="action-btn delete-btn">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else class="empty-state">
      <div class="empty-icon">👥</div>
      <div class="empty-text">暂无用户数据</div>
    </div>

    <div class="pagination">
      <select v-model.number="pageSize" @change="loadUsers" class="page-size-select">
        <option :value="10">10条/页</option>
        <option :value="20">20条/页</option>
        <option :value="50">50条/页</option>
        <option :value="100">100条/页</option>
      </select>
      <button @click="goPage(1)" :disabled="page <= 1" class="page-btn">首页</button>
      <button @click="goPage(page - 1)" :disabled="page <= 1" class="page-btn">上一页</button>
      <template v-for="p in pageNumbers" :key="p">
        <button v-if="p === '...'" class="page-btn page-ellipsis" disabled>...</button>
        <button v-else :class="['page-btn', { 'page-active': p === page }]" @click="goPage(p)">{{ p }}</button>
      </template>
      <button @click="goPage(page + 1)" :disabled="page >= totalPages" class="page-btn">下一页</button>
      <button @click="goPage(totalPages)" :disabled="page >= totalPages" class="page-btn">末页</button>
      <span class="page-info">共 {{ total }} 条</span>
    </div>

    <!-- 用户详情模态框 -->
    <div v-if="showUserDetail" class="modal-overlay user-overlay" @click.self="showUserDetail = false">
      <div class="modal-content user-modal">
        <div class="modal-header">
          <h3>用户详情</h3>
          <button @click="showUserDetail = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">头像:</span>
            <img v-if="currentUser.avatar" :src="currentUser.avatar" class="user-avatar" />
            <span v-else class="avatar-placeholder">👤</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">昵称:</span>
            <span>{{ currentUser.nickname }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">手机号:</span>
            <span>{{ currentUser.phone || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">邮箱:</span>
            <span>{{ currentUser.email || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">性别:</span>
            <span>{{ currentUser.sex === 1 ? '男' : currentUser.sex === 2 ? '女' : '未知' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">等级:</span>
            <span>Lv.{{ currentUser.lv || 1 }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">VIP等级:</span>
            <span>{{ currentUser.vip ? 'VIP'+currentUser.vipLv : '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">金币:</span>
            <span>{{ currentUser.money || 0 }} 金币</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">城市:</span>
            <span>{{ currentUser.city || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">注册时间:</span>
            <span>{{ formatTime(currentUser.createTime) }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showUserDetail = false" class="cancel-btn">关闭</button>
        </div>
      </div>
    </div>

    <!-- 编辑用户模态框 -->
    <div v-if="showUserModal" class="modal-overlay user-overlay" @click.self="showUserModal = false">
      <div class="modal-content user-modal">
        <div class="modal-header">
          <h3>{{ currentUser.id ? '编辑用户' : '添加用户' }}</h3>
          <button @click="showUserModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>用户ID</label>
            <input v-model="currentUser.id" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>昵称</label>
            <input v-model="currentUser.nickname" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>手机号</label>
            <input v-model="currentUser.phone" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="currentUser.email" type="text" class="form-input" />
          </div>
          <div class="form-group" v-if="!currentUser.id">
            <label>密码</label>
            <input v-model="currentUser.password" type="password" class="form-input" />
          </div>
          <div class="form-group">
            <label>性别</label>
            <select v-model.number="currentUser.sex" class="form-input">
              <option :value="0">未知</option>
              <option :value="1">男</option>
              <option :value="2">女</option>
            </select>
          </div>
          <div class="form-group">
            <label>城市</label>
            <input v-model="currentUser.city" type="text" class="form-input" />
          </div>
          <div class="form-group" v-if="currentUser.id">
            <label>等级 (Lv)</label>
            <input v-model.number="currentUser.lv" type="number" min="1" max="99" class="form-input" />
          </div>
          <div class="form-group">
            <label>VIP等级</label>
            <input v-model.number="currentUser.vipLv" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group">
            <label>金币</label>
            <input v-model.number="currentUser.money" type="number" min="0" step="0.01" class="form-input" />
          </div>
          <div class="form-group">
            <label>头像URL</label>
            <input v-model="currentUser.avatar" type="text" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showUserModal = false" class="cancel-btn">取消</button>
          <button @click="saveUserAccount" class="confirm-btn">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, pageNumbers, formatTime, apiGet, apiPost, apiPut, apiDelete, exportCSV, toast, confirm } = useAdmin()

const userList = ref([])
const searchKeyword = ref('')
const filterStatus = ref('')
const currentUser = reactive({
  id: null,
  nickname: '',
  username: '',
  phone: '',
  email: '',
  sex: 0,
  city: '',
  lv: 1,
  vipLv: 0,
  money: 0,
  avatar: '',
  password: '',
})
const showUserModal = ref(false)
const showUserDetail = ref(false)
const selectedIds = ref([])
const loading = ref(false)

const isAllSelected = computed(() => userList.value.length > 0 && userList.value.every(u => selectedIds.value.includes(u.id)))

const loadUsers = () => {
  page.value = 1; _loadUsers()
}
const goPage = (p) => { page.value = p; _loadUsers() }
const _loadUsers = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    if (filterStatus.value !== '') {
      params.status = filterStatus.value
    }
    const res = await apiGet('/api/admin/users', params)
    if (res.code === 200) {
      userList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载用户列表失败:', err)
    toast('加载用户列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const openCreateUserAccountModal = () => {
  Object.assign(currentUser, {
    id: null,
    nickname: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    sex: 0,
    city: '',
    lv: 1,
    vipLv: 0,
    money: 0,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
    status: 0
  })
  showUserModal.value = true
}

const editUserAccount = (user) => {
  Object.assign(currentUser, user)
  showUserModal.value = true
}

const viewUser = (user) => {
  Object.assign(currentUser, user)
  showUserDetail.value = true
}

const saveUserAccount = async () => {
  try {
    let res
    if (currentUser.id) {
      res = await apiPut('/api/admin/users/' + currentUser.id, currentUser)
    } else {
      res = await apiPost('/api/admin/users', currentUser)
    }
    if (res.code === 200) {
      showUserModal.value = false
      toast(currentUser.id ? '用户已更新' : '用户已创建')
      _loadUsers()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('保存用户失败:', err)
    toast('保存用户失败', 'error')
  }
}

onMounted(() => {
  _loadUsers()
})

const toggleSelect = (id) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

const toggleSelectAll = () => {
  if (isAllSelected.value) selectedIds.value = []
  else selectedIds.value = userList.value.map(u => u.id)
}

const batchToggleStatus = async (status) => {
  if (!(await confirm(`确定要${status === 1 ? '禁用' : '启用'}选中的 ${selectedIds.value.length} 个用户吗？`))) return
  for (const id of selectedIds.value) {
    try { await apiPut('/api/admin/users/' + id + '/status', { status }) } catch (e) {}
  }
  toast('批量操作完成')
  selectedIds.value = []
  _loadUsers()
}

const exportUsers = () => {
  exportCSV(userList.value, [
    { label: 'ID', key: 'id' },
    { label: '昵称', key: 'nickname' },
    { label: '手机号', key: 'phone' },
    { label: '邮箱', key: 'email' },
    { label: '性别', key: (r) => r.sex === 1 ? '男' : r.sex === 2 ? '女' : '未知' },
    { label: '等级', key: 'lv' },
    { label: '金币', key: 'money' },
    { label: '城市', key: 'city' },
    { label: '状态', key: (r) => r.status === 0 ? '正常' : '禁用' },
    { label: '注册时间', key: (r) => formatTime(r.createTime) }
  ], '用户列表')
  toast('导出成功')
}

const toggleUserStatus = async (user) => {
  try {
    const res = await apiPut('/api/admin/users/' + user.id + '/status', {
      status: user.status === 0 ? 1 : 0
    })
    if (res.code === 200) _loadUsers()
  } catch (err) { console.error('切换用户状态失败:', err) }
}

const deleteUserAccount = async (user) => {
  if (!(await confirm('确定要删除这个用户吗？'))) return
  try {
    const res = await apiDelete('/api/admin/users/' + user.id)
    if (res.code === 200) {
      toast('用户已删除')
      _loadUsers()
    }
  } catch (err) {
    console.error('删除用户失败:', err)
    toast('删除用户失败', 'error')
  }
}

</script>

<style scoped>
.user-list {
  padding: 20px;
  background: white;
  border-radius: 8px;
}

.toolbar {
  display: flex;
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  gap: 10px;
  flex: 1;
  align-items: center;
}

.search-input, .search-select, .search-btn, .add-btn {
  height: 36px;
  box-sizing: border-box;
  margin: 0;
  font-size: 14px;
  border-radius: 4px;
}

.search-input {
  flex: 1;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  background: #fff;
}

.search-select {
  padding: 0 24px 0 12px;
  border: 1px solid #d9d9d9;
  background: #fff;
  appearance: none;
}

.search-btn, .add-btn {
  padding: 0 16px;
  background: #1890ff;
  color: white;
  border: 1px solid #1890ff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.export-btn {
  padding: 0 16px;
  background: #52c41a;
  color: white;
  border: 1px solid #52c41a;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  height: 36px;
  border-radius: 4px;
  font-size: 14px;
}

.batch-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 8px 14px;
  background: #e6f7ff;
  border-radius: 6px;
  font-size: 13px;
  color: #1890ff;
}

.batch-btn {
  padding: 4px 12px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.batch-danger {
  background: #ff4d4f;
}

.toolbar {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}

.data-table th {
  background: #fafafa;
  font-weight: 600;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: #f0f0f0;
  border-radius: 50%;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge.active {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status-badge.disabled {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

.action-btn {
  padding: 4px 8px;
  margin-right: 5px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.action-btn.delete-btn {
  background: #ff4d4f;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

.page-btn {
  padding: 6px 10px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  min-width: 34px;
  text-align: center;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn:not(:disabled):hover {
  border-color: #1890ff;
  color: #1890ff;
}

.page-active {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.page-active:hover {
  color: #fff !important;
}

.page-ellipsis {
  border: none;
  cursor: default;
}

.page-size-select {
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  margin-right: 8px;
}

.page-info {
  color: #999;
  font-size: 13px;
  margin-left: 10px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.user-overlay {
  align-items: flex-start;
  justify-content: flex-start;
  padding-top: 40px;
  padding-left: 240px;
}

.user-modal {
  width: calc(100vw - 280px);
  max-width: none !important;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.detail-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  width: 100px;
  color: #666;
  flex-shrink: 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-input:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e8e8e8;
}

.cancel-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
