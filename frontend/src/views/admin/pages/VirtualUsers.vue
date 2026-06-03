<template>
  <div>
<div class="virtual-user-list">
          <div class="page-header">
            <h2>虚拟机器人管理</h2>
            <button @click="openCreateModal" class="add-btn">添加机器人</button>
          </div>

          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索用户名/昵称" class="search-input" />
            <button @click="loadVirtualUsers" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>头像</th>
                <th>用户名</th>
                <th>昵称</th>
                <th>角色</th>
                <th>对话风格</th>
                <th>状态</th>
                <th>在线状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in virtualUserList" :key="user.id">
                <td>{{ user.id }}</td>
                <td>
                  <img v-if="user.avatar" :src="user.avatar" class="user-avatar-small" />
                  <span v-else>🤖</span>
                </td>
                <td>{{ user.username }}</td>
                <td>{{ user.nickname }}</td>
                <td>{{ getRoleName(user.role) }}</td>
                <td>{{ getStyleName(user.dialogueStyle) }}</td>
                <td>
                  <span :class="['status-badge', user.status === 1 ? 'active' : 'disabled']">
                    {{ user.status === 1 ? '启用' : '禁用' }}
                  </span>
                </td>
                <td>
                  <span :class="['status-badge', user.isOnline === 1 ? 'active' : 'disabled']">
                    {{ user.isOnline === 1 ? '在线' : '离线' }}
                  </span>
                </td>
                <td>{{ formatTime(user.createTime) }}</td>
                <td>
                  <button @click="editUser(user)" class="action-btn">编辑</button>
                  <button @click="toggleStatus(user)" class="action-btn">
                    {{ user.status === 1 ? '禁用' : '启用' }}
                  </button>
                  <button @click="deleteUser(user)" class="action-btn delete-btn">删除</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
          </div>
        </div>

        <!-- 礼物管理 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()

const virtualUserList = ref([])
const searchKeyword = ref('')
const currentVirtualUser = ref(null)
const showModal = ref(false)

const getRoleName = (role) => {
  const map = {
    'companion': '陪玩师',
    'normal': '普通用户',
    'robot': '机器人'
  }
  return map[role] || '普通用户'
}

const getStyleName = (style) => {
  const map = {
    'friendly': '友好',
    'cold': '高冷',
    'humorous': '幽默',
    'cute': '可爱'
  }
  return map[style] || '友好'
}

const loadVirtualUsers = async () => {
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    const res = await apiGet('/api/admin/virtual-users', params)
    if (res.code === 200) {
      virtualUserList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载虚拟用户失败:', err)
  }
}

const openCreateModal = () => {
  currentVirtualUser.value = {
    username: '',
    nickname: '',
    avatar: '',
    role: 'companion',
    dialogueStyle: 'friendly',
    status: 1,
    isOnline: 0
  }
  showModal.value = true
}

const editUser = (user) => {
  currentVirtualUser.value = { ...user }
  showModal.value = true
}

const saveUser = async () => {
  try {
    let res
    if (currentVirtualUser.value.id) {
      res = await apiPut('/api/admin/virtual-users/' + currentVirtualUser.value.id, currentVirtualUser.value)
    } else {
      res = await apiPost('/api/admin/virtual-users', currentVirtualUser.value)
    }
    if (res.code === 200) {
      showModal.value = false
      loadVirtualUsers()
    }
  } catch (err) {
    console.error('保存用户失败:', err)
  }
}

const toggleStatus = async (user) => {
  try {
    const res = await apiPut('/api/admin/virtual-users/' + user.id, {
      ...user,
      status: user.status === 1 ? 0 : 1
    })
    if (res.code === 200) {
      loadVirtualUsers()
    }
  } catch (err) {
    console.error('切换状态失败:', err)
  }
}

const deleteUser = async (user) => {
  if (!confirm('确定要删除这个用户吗？')) return
  try {
    const res = await apiDelete('/api/admin/virtual-users/' + user.id)
    if (res.code === 200) {
      loadVirtualUsers()
    }
  } catch (err) {
    console.error('删除用户失败:', err)
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadVirtualUsers()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadVirtualUsers()
  }
}

onMounted(() => {
  loadVirtualUsers()
})
</script>
