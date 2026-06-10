<template>
  <div class="game-list">
    <div class="toolbar">
      <div class="search-bar">
        <select v-model="filterServiceType" class="search-select">
          <option value="">全部类型</option>
          <option value="online">线上服务</option>
          <option value="offline">线下服务</option>
        </select>
        <button @click="loadGames" class="search-btn">搜索</button>
      </div>
      <button @click="openCreateGameModal" class="add-btn">添加分类</button>
      <button @click="exportData" class="export-btn">📥 导出CSV</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <table v-else-if="gameList.length > 0" class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>图标</th>
          <th>名称</th>
          <th>服务类型</th>
          <th>描述</th>
          <th>排序</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="game in gameList" :key="game.id">
          <td>{{ game.id }}</td>
          <td>
            <img v-if="game.icon" :src="game.icon" class="user-avatar-small" />
            <span v-else>🎮</span>
          </td>
          <td>{{ game.name }}</td>
          <td>
            <span :class="['service-type-badge', game.serviceType === 'offline' ? 'offline' : 'online']">
              {{ game.serviceType === 'offline' ? '线下服务' : '线上服务' }}
            </span>
          </td>
          <td>{{ game.description }}</td>
          <td>{{ game.sort }}</td>
          <td>
            <span :class="['status-badge', game.status === 1 ? 'active' : 'disabled']">
              {{ game.status === 1 ? '启用' : '禁用' }}
            </span>
          </td>
          <td>{{ formatTime(game.createTime) }}</td>
          <td>
            <button @click="editGame(game)" class="action-btn">编辑</button>
            <button @click="toggleGameStatus(game)" class="action-btn">
              {{ game.status === 1 ? '禁用' : '启用' }}
            </button>
            <button @click="deleteGame(game)" class="action-btn delete-btn">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && gameList.length === 0" class="empty-state">
      <div class="empty-icon">🎮</div>
      <div class="empty-text">暂无服务分类数据</div>
    </div>

    <div class="pagination">
      <div class="pagination-left">
        <span class="page-size-label">每页</span>
        <select v-model.number="pageSize" @change="page = 1; loadGames()" class="page-size-select">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span class="page-size-label">条，共 {{ total }} 条</span>
      </div>
      <div class="pagination-right">
        <button @click="page = 1; loadGames()" class="page-btn" :disabled="page <= 1">首页</button>
        <button @click="page--; loadGames()" class="page-btn" :disabled="page <= 1">上一页</button>
        <template v-for="p in pageNumbers" :key="p">
          <span v-if="p === '...'" class="page-ellipsis">...</span>
          <button v-else @click="page = p; loadGames()" :class="['page-btn', { 'page-active': page === p }]">{{ p }}</button>
        </template>
        <button @click="page++; loadGames()" class="page-btn" :disabled="page >= totalPages">下一页</button>
        <button @click="page = totalPages; loadGames()" class="page-btn" :disabled="page >= totalPages">末页</button>
      </div>
    </div>

    <!-- 编辑模态框 -->
    <div v-if="showGameModal" class="modal-overlay" @click.self="showGameModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ currentGame?.id ? '编辑分类' : '添加分类' }}</h3>
          <button @click="showGameModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>名称</label>
            <input v-model="currentGame.name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>图标</label>
            <div class="image-upload-row">
              <input v-model="currentGame.icon" type="text" class="form-input" placeholder="图片URL或上传" />
              <input type="file" accept="image/*" @change="handleImageUpload" ref="fileInputRef" class="hidden-file-input" />
              <button type="button" @click="fileInputRef?.click()" class="upload-btn" :disabled="uploading">
                {{ uploading ? '上传中...' : '📷 上传' }}
              </button>
            </div>
            <img v-if="currentGame.icon" :src="currentGame.icon" class="image-preview" />
          </div>
          <div class="form-group">
            <label>服务类型</label>
            <select v-model="currentGame.serviceType" class="form-input">
              <option value="online">线上服务</option>
              <option value="offline">线下服务</option>
            </select>
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="currentGame.description" class="form-input" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>排序</label>
            <input v-model.number="currentGame.sort" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model.number="currentGame.status" class="form-input">
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showGameModal = false" class="cancel-btn" :disabled="saving">取消</button>
          <button @click="saveGame" class="confirm-btn" :disabled="saving">{{ saving ? '保存中...' : '确认' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { page, pageSize, total, totalPages, pageNumbers, formatTime, apiGet, apiPost, apiPut, apiDelete, exportCSV, toast, confirm } = useAdmin()

const gameList = ref([])
const currentGame = ref(null)
const showGameModal = ref(false)
const filterServiceType = ref('')
const loading = ref(false)
const saving = ref(false)
const fileInputRef = ref(null)
const uploading = ref(false)

const loadGames = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (filterServiceType.value !== '') {
      params.serviceType = filterServiceType.value
    }
    const res = await apiGet('/api/admin/games', params)
    if (res.code === 200) {
      gameList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载服务分类失败:', err)
    toast('加载服务分类失败', 'error')
  } finally {
    loading.value = false
  }
}

const openCreateGameModal = () => {
  currentGame.value = {
    name: '',
    icon: '',
    serviceType: 'online',
    description: '',
    sort: 0,
    status: 1
  }
  showGameModal.value = true
}

const editGame = (game) => {
  currentGame.value = { ...game }
  showGameModal.value = true
}

const saveGame = async () => {
  if (!currentGame.value.name?.trim()) {
    toast('请填写服务名称', 'error')
    return
  }
  saving.value = true
  try {
    let res
    if (currentGame.value.id) {
      res = await apiPut('/api/admin/games/' + currentGame.value.id, currentGame.value)
    } else {
      res = await apiPost('/api/admin/games', currentGame.value)
    }
    if (res.code === 200) {
      showGameModal.value = false
      toast(res.message || '保存成功')
      loadGames()
    } else {
      toast(res.message || '保存失败', 'error')
    }
  } catch (err) {
    console.error('保存服务分类失败:', err)
    toast('保存服务分类失败', 'error')
  } finally {
    saving.value = false
  }
}

const toggleGameStatus = async (game) => {
  try {
    const newStatus = game.status === 1 ? 0 : 1
    const res = await apiPut('/api/admin/games/' + game.id + '/status', { status: newStatus })
    if (res.code === 200) {
      toast(res.message || (newStatus === 1 ? '已启用' : '已禁用'))
      loadGames()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('切换服务分类状态失败:', err)
    toast('切换状态失败', 'error')
  }
}

const deleteGame = async (game) => {
  if (!(await confirm('确定要删除这个服务分类吗？'))) return
  try {
    const res = await apiDelete('/api/admin/games/' + game.id)
    if (res.code === 200) {
      toast('服务分类已删除')
      loadGames()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('删除服务分类失败:', err)
    toast('删除服务分类失败', 'error')
  }
}

// 图标本地上传
const handleImageUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('image', file)
    const adminToken = (localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token'))
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {},
      body: formData
    })
    const data = await res.json()
    if (data.code === 200 && data.data?.url) {
      currentGame.value.icon = data.data.url
    } else {
      toast(data.message || '上传失败', 'error')
    }
  } catch (err) {
    console.error('上传图标失败:', err)
    toast('上传图标失败', 'error')
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

const exportData = () => {
  exportCSV(gameList.value, [
    { label: 'ID', key: 'id' },
    { label: '名称', key: 'name' },
    { label: '服务类型', key: row => row.serviceType === 'offline' ? '线下服务' : '线上服务' },
    { label: '描述', key: 'description' },
    { label: '排序', key: 'sort' },
    { label: '状态', key: row => row.status === 1 ? '启用' : '禁用' },
    { label: '创建时间', key: row => formatTime(row.createTime) }
  ], 'games')
}

onMounted(() => {
  loadGames()
})
</script>

<style scoped>
.user-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
}

.service-type-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.service-type-badge.online {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.service-type-badge.offline {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.hidden-file-input { display: none; }
.image-upload-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.image-upload-row .form-input {
  flex: 1;
}
.upload-btn {
  padding: 7px 14px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  background: #f9fafb;
  font-size: 12px;
  cursor: pointer;
  color: #6b7280;
  white-space: nowrap;
  transition: all 0.2s;
}
.upload-btn:hover:not(:disabled) {
  border-color: #1677ff;
  color: #1677ff;
  background: #eff6ff;
}
.upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.image-preview {
  margin-top: 8px;
  max-width: 200px;
  max-height: 120px;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  object-fit: cover;
}
</style>
