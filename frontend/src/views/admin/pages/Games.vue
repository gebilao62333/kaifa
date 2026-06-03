<template>
  <div class="game-list">
    <div class="page-header">
      <h2>服务分类管理</h2>
      <button @click="openCreateGameModal" class="add-btn">添加分类</button>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>图标</th>
          <th>名称</th>
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

    <div class="pagination">
      <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
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
            <input v-model="currentGame.icon" type="text" class="form-input" placeholder="图片URL" />
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
          <button @click="showGameModal = false" class="cancel-btn">取消</button>
          <button @click="saveGame" class="confirm-btn">确认</button>
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

const gameList = ref([])
const currentGame = ref(null)
const showGameModal = ref(false)

const loadGames = async () => {
  try {
    const res = await apiGet('/api/admin/games', { page: page.value, pageSize: pageSize.value })
    if (res.code === 200) {
      gameList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载服务分类失败:', err)
  }
}

const openCreateGameModal = () => {
  currentGame.value = {
    name: '',
    icon: '',
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
  try {
    let res
    if (currentGame.value.id) {
      res = await apiPut('/api/admin/games/' + currentGame.value.id, currentGame.value)
    } else {
      res = await apiPost('/api/admin/games', currentGame.value)
    }
    if (res.code === 200) {
      showGameModal.value = false
      loadGames()
    }
  } catch (err) {
    console.error('保存服务分类失败:', err)
  }
}

const toggleGameStatus = async (game) => {
  try {
    const res = await apiPut('/api/admin/games/' + game.id, {
      ...game,
      status: game.status === 1 ? 0 : 1
    })
    if (res.code === 200) {
      loadGames()
    }
  } catch (err) {
    console.error('切换服务分类状态失败:', err)
  }
}

const deleteGame = async (game) => {
  if (!confirm('确定要删除这个服务分类吗？')) return
  try {
    const res = await apiDelete('/api/admin/games/' + game.id)
    if (res.code === 200) {
      loadGames()
    }
  } catch (err) {
    console.error('删除服务分类失败:', err)
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadGames()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadGames()
  }
}

onMounted(() => {
  loadGames()
})
</script>

<style scoped>
.game-list {
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

.user-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
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
  background: #f5f5f5;
  color: #999;
  border: 1px solid #d9d9d9;
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

.delete-btn {
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

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
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
