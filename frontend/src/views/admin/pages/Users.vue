<template>
  <div class="user-list">
    <div class="page-header">
      <h2>用户管理</h2>
      <button @click="openCreateUserAccountModal" class="add-btn">添加用户</button>
    </div>
    <div class="search-bar">
      <input v-model="searchKeyword" type="text" placeholder="搜索用户昵称或手机号" class="search-input" />
      <select v-model="filterStatus" class="search-select">
        <option value="">全部状态</option>
        <option value="0">正常</option>
        <option value="1">禁用</option>
      </select>
      <button @click="loadUsers" class="search-btn">搜索</button>
    </div>

    <table class="data-table">
      <thead>
        <tr>
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

    <div class="pagination">
      <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
    </div>

    <!-- 用户详情模态框 -->
    <div v-if="showUserDetail" class="modal-overlay" @click.self="showUserDetail = false">
      <div class="modal-content">
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
    <div v-if="showUserModal" class="modal-overlay" @click.self="showUserModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ currentUser.id ? '编辑用户' : '添加用户' }}</h3>
          <button @click="showUserModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>昵称</label>
            <input v-model="currentUser.nickname" type="text" class="form-input" />
          </div>
          <div class="form-group" v-if="!currentUser.id">
            <label>手机号</label>
            <input v-model="currentUser.phone" type="text" class="form-input" />
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

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()

const userList = ref([])
const searchKeyword = ref('')
const filterStatus = ref('')
const currentUser = ref(null)
const showUserModal = ref(false)
const showUserDetail = ref(false)

const loadUsers = async () => {
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
  }
}

const openCreateUserAccountModal = () => {
  currentUser.value = {
    nickname: '',
    phone: '',
    password: '',
    sex: 0,
    city: '',
    avatar: '',
    status: 0
  }
  showUserModal.value = true
}

const editUserAccount = (user) => {
  currentUser.value = { ...user }
  showUserModal.value = true
}

const viewUser = (user) => {
  currentUser.value = { ...user }
  showUserDetail.value = true
}

const saveUserAccount = async () => {
  try {
    let res
    if (currentUser.value.id) {
      res = await apiPut('/api/admin/users/' + currentUser.value.id, currentUser.value)
    } else {
      res = await apiPost('/api/admin/users', currentUser.value)
    }
    if (res.code === 200) {
      showUserModal.value = false
      loadUsers()
    }
  } catch (err) {
    console.error('保存用户失败:', err)
  }
}

const toggleUserStatus = async (user) => {
  try {
    const res = await apiPut('/api/admin/users/' + user.id, {
      ...user,
      status: user.status === 0 ? 1 : 0
    })
    if (res.code === 200) {
      loadUsers()
    }
  } catch (err) {
    console.error('切换用户状态失败:', err)
  }
}

const deleteUserAccount = async (user) => {
  if (!confirm('确定要删除这个用户吗？')) return
  try {
    const res = await apiDelete('/api/admin/users/' + user.id)
    if (res.code === 200) {
      loadUsers()
    }
  } catch (err) {
    console.error('删除用户失败:', err)
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadUsers()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadUsers()
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-list {
  padding: 20px;
  background: white;
  border-radius: 8px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.add-btn {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.search-select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.search-btn {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
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
  padding: 8px 16px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
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
