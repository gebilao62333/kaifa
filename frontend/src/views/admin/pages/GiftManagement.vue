<template>
  <div class="gift-list">
    <div class="page-header">
      <h2>礼物管理</h2>
      <button @click="openCreateGiftModal" class="add-btn">添加礼物</button>
    </div>

    <div class="search-bar">
      <input v-model="searchKeyword" type="text" placeholder="搜索礼物名称" class="search-input" />
      <select v-model="filterStatus" class="search-select">
        <option value="">全部状态</option>
        <option value="1">启用</option>
        <option value="0">禁用</option>
      </select>
      <button @click="loadGifts" class="search-btn">搜索</button>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>图片</th>
          <th>礼物名称</th>
          <th>价格</th>
          <th>类型</th>
          <th>VIP专属</th>
          <th>排序</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="gift in giftList" :key="gift.id">
          <td>{{ gift.id }}</td>
          <td>
            <img v-if="gift.image" :src="gift.image" class="gift-avatar" />
            <span v-else>🎁</span>
          </td>
          <td>{{ gift.title }}</td>
          <td>{{ gift.money }} 金币</td>
          <td>{{ gift.type === 1 ? '特殊' : '普通' }}</td>
          <td>{{ gift.is_vip === 1 ? '是' : '否' }}</td>
          <td>{{ gift.sort }}</td>
          <td>
            <span :class="['status-badge', gift.status === 1 ? 'active' : 'disabled']">
              {{ gift.status === 1 ? '启用' : '禁用' }}
            </span>
          </td>
          <td>
            <button @click="editGift(gift)" class="action-btn">编辑</button>
            <button @click="toggleGiftStatus(gift)" class="action-btn">
              {{ gift.status === 1 ? '禁用' : '启用' }}
            </button>
            <button @click="deleteGift(gift)" class="action-btn delete-btn">删除</button>
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
    <div v-if="showGiftModal" class="modal-overlay" @click.self="showGiftModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ currentGift?.id ? '编辑礼物' : '添加礼物' }}</h3>
          <button @click="showGiftModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>礼物名称</label>
            <input v-model="currentGift.title" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>图片</label>
            <input v-model="currentGift.image" type="text" class="form-input" placeholder="图片URL" />
          </div>
          <div class="form-group">
            <label>价格</label>
            <input v-model.number="currentGift.money" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>类型</label>
            <select v-model.number="currentGift.type" class="form-input">
              <option :value="0">普通</option>
              <option :value="1">特殊</option>
            </select>
          </div>
          <div class="form-group">
            <label>VIP专属</label>
            <select v-model.number="currentGift.is_vip" class="form-input">
              <option :value="0">否</option>
              <option :value="1">是</option>
            </select>
          </div>
          <div class="form-group">
            <label>排序</label>
            <input v-model.number="currentGift.sort" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model.number="currentGift.status" class="form-input">
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showGiftModal = false" class="cancel-btn">取消</button>
          <button @click="saveGift" class="confirm-btn">确认</button>
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

const giftList = ref([])
const searchKeyword = ref('')
const filterStatus = ref('')
const currentGift = ref(null)
const showGiftModal = ref(false)

const loadGifts = async () => {
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    if (filterStatus.value !== '') {
      params.status = filterStatus.value
    }
    const res = await apiGet('/api/admin/gifts', params)
    if (res.code === 200) {
      giftList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载礼物列表失败:', err)
  }
}

const openCreateGiftModal = () => {
  currentGift.value = {
    title: '',
    image: '',
    money: 0,
    type: 0,
    is_vip: 0,
    sort: 0,
    status: 1
  }
  showGiftModal.value = true
}

const editGift = (gift) => {
  currentGift.value = { ...gift }
  showGiftModal.value = true
}

const saveGift = async () => {
  try {
    let res
    if (currentGift.value.id) {
      res = await apiPut('/api/admin/gifts/' + currentGift.value.id, currentGift.value)
    } else {
      res = await apiPost('/api/admin/gifts', currentGift.value)
    }
    if (res.code === 200) {
      showGiftModal.value = false
      loadGifts()
    }
  } catch (err) {
    console.error('保存礼物失败:', err)
  }
}

const toggleGiftStatus = async (gift) => {
  try {
    const res = await apiPut('/api/admin/gifts/' + gift.id, {
      ...gift,
      status: gift.status === 1 ? 0 : 1
    })
    if (res.code === 200) {
      loadGifts()
    }
  } catch (err) {
    console.error('切换礼物状态失败:', err)
  }
}

const deleteGift = async (gift) => {
  if (!confirm('确定要删除这个礼物吗？')) return
  try {
    const res = await apiDelete('/api/admin/gifts/' + gift.id)
    if (res.code === 200) {
      loadGifts()
    }
  } catch (err) {
    console.error('删除礼物失败:', err)
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadGifts()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadGifts()
  }
}

onMounted(() => {
  loadGifts()
})
</script>

<style scoped>
.gift-list {
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
  min-width: 120px;
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

.gift-avatar {
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
