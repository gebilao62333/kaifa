<template>
  <div>
<div class="role-list">
          <div class="page-header">
            <h2>角色列表</h2>
            <button @click="openCreateRoleModal" class="add-btn">添加角色</button>
          </div>

          <table class="data-table">
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
                  <span v-if="role.is_super" style="color: #e74c3c; font-weight: bold;">
                    {{ role.name }} (超级管理员)
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
        </div>

        <!-- 系统设置 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()

const roleList = ref([])
const currentRole = ref(null)
const showRoleModal = ref(false)

const loadRoles = async () => {
  try {
    const res = await apiGet('/api/admin/roles')
    if (res.code === 200) {
      roleList.value = res.data?.list || []
    }
  } catch (err) {
    console.error('加载角色列表失败:', err)
  }
}

const openCreateRoleModal = () => {
  currentRole.value = {
    name: '',
    description: '',
    status: 1,
    sort: 0
  }
  showRoleModal.value = true
}

const editRole = (role) => {
  currentRole.value = { ...role }
  showRoleModal.value = true
}

const saveRole = async () => {
  try {
    let res
    if (currentRole.value.id) {
      res = await apiPut('/api/admin/roles/' + currentRole.value.id, currentRole.value)
    } else {
      res = await apiPost('/api/admin/roles', currentRole.value)
    }
    if (res.code === 200) {
      showRoleModal.value = false
      loadRoles()
    }
  } catch (err) {
    console.error('保存角色失败:', err)
  }
}

const deleteRole = async (role) => {
  if (!confirm('确定要删除这个角色吗？')) return
  try {
    const res = await apiDelete('/api/admin/roles/' + role.id)
    if (res.code === 200) {
      loadRoles()
    }
  } catch (err) {
    console.error('删除角色失败:', err)
  }
}

onMounted(() => {
  loadRoles()
})
</script>
