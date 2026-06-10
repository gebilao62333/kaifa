<template>
  <div class="admin-card">
    <div class="toolbar">
      <div class="search-bar"></div>
      <button @click="openCreateRoleModal" class="add-btn">添加角色</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <table v-else-if="roleList.length > 0" class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>角色名称</th>
          <th>描述</th>
          <th>状态</th>
          <th>排序</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="role in roleList" :key="role.id">
          <td>{{ role.id }}</td>
          <td>
            <span v-if="role.is_super" style="color: #e74c3c; font-weight: 700;">
              {{ role.name }} <small>(超级管理员)</small>
            </span>
            <span v-else>{{ role.name }}</span>
          </td>
          <td>{{ role.description || '-' }}</td>
          <td>
            <span :class="['status-badge', role.status === 1 ? 'active' : 'disabled']">
              {{ role.status === 1 ? '启用' : '禁用' }}
            </span>
          </td>
          <td>{{ role.sort || 0 }}</td>
          <td>
            <button @click="editRole(role)" class="action-btn" :disabled="role.is_super">编辑</button>
            <button v-if="!role.is_super" @click="deleteRole(role)" class="action-btn delete-btn">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && roleList.length === 0" class="empty-state">
      <div class="empty-icon">🔐</div>
      <div class="empty-text">暂无角色数据</div>
    </div>

    <!-- 角色编辑弹窗 -->
    <div class="modal-overlay" v-if="showRoleModal" @click.self="showRoleModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ currentRole?.id ? '编辑角色' : '添加角色' }}</h3>
          <button class="close-btn" @click="showRoleModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>角色名称 <span style="color:#e74c3c;">*</span></label>
            <input type="text" v-model="currentRole.name" placeholder="请输入角色名称" class="form-input" />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="currentRole.description" placeholder="请输入角色描述" class="form-input" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="currentRole.status" class="form-input">
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </div>
          <div class="form-group">
            <label>排序</label>
            <input type="number" v-model="currentRole.sort" placeholder="排序值" class="form-input" />
          </div>
          <div class="form-group" v-if="!currentRole.is_super">
            <label>权限设置</label>
            <div class="permission-grid">
              <label v-for="perm in availablePermissions" :key="perm.id" class="permission-item">
                <input type="checkbox" :value="perm.id" v-model="currentRole.permissions" />
                <span class="perm-icon">{{ perm.icon }}</span>
                <span class="perm-name">{{ perm.name }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showRoleModal = false">取消</button>
          <button class="confirm-btn" @click="saveRole">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { apiGet, apiPost, apiPut, apiDelete, toast, confirm } = useAdmin()

const roleList = ref([])
const currentRole = ref(null)
const showRoleModal = ref(false)
const availablePermissions = ref([])
const loading = ref(false)

const loadPermissions = async () => {
  try {
    const res = await apiGet('/api/admin-manage/permissions')
    if (res.code === 200) {
      availablePermissions.value = res.data || []
    }
  } catch (err) {
    console.error('加载权限列表失败:', err)
  }
}

const loadRoles = async () => {
  loading.value = true
  try {
    const res = await apiGet('/api/admin-manage/roles')
    if (res.code === 200) {
      roleList.value = Array.isArray(res.data) ? res.data : (res.data?.list || [])
    }
  } catch (err) {
    console.error('加载角色列表失败:', err)
    toast('加载角色列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const openCreateRoleModal = () => {
  currentRole.value = {
    name: '',
    description: '',
    status: 1,
    sort: 0,
    permissions: []
  }
  showRoleModal.value = true
}

const editRole = (role) => {
  currentRole.value = { ...role, permissions: [...(role.permissions || [])] }
  showRoleModal.value = true
}

const saveRole = async () => {
  if (!currentRole.value.name?.trim()) {
    toast('请输入角色名称', 'warning')
    return
  }
  try {
    let res
    if (currentRole.value.id) {
      res = await apiPut('/api/admin-manage/roles/' + currentRole.value.id, currentRole.value)
    } else {
      res = await apiPost('/api/admin-manage/roles', currentRole.value)
    }
    if (res.code === 200) {
      showRoleModal.value = false
      toast(currentRole.value.id ? '角色更新成功' : '角色创建成功')
      loadRoles()
    } else {
      toast('保存失败: ' + (res.message || '未知错误'), 'error')
    }
  } catch (err) {
    console.error('保存角色失败:', err)
    toast('保存失败: ' + err.message, 'error')
  }
}

const deleteRole = async (role) => {
  if (!(await confirm('确定要删除这个角色吗？'))) return
  try {
    const res = await apiDelete('/api/admin-manage/roles/' + role.id)
    if (res.code === 200) {
      toast('角色已删除')
      loadRoles()
    } else {
      toast('删除失败: ' + (res.message || '未知错误'), 'error')
    }
  } catch (err) {
    console.error('删除角色失败:', err)
    toast('删除失败: ' + err.message, 'error')
  }
}

onMounted(() => {
  loadRoles()
  loadPermissions()
})
</script>

<style scoped>
.permission-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 8px;
}
.permission-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.permission-item:hover {
  background: #f5f7fa;
  border-color: #d9d9d9;
}
.perm-icon { font-size: 16px; }
.perm-name { color: #555; }
</style>
