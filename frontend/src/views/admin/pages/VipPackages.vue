<template>
  <div class="vip-package-list">
    <div class="page-header">
      <h2>VIP套餐管理</h2>
      <button @click="openCreateVipModal" class="add-btn">添加套餐</button>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>套餐名称</th>
          <th>价格</th>
          <th>原价</th>
          <th>时长(天)</th>
          <th>等级</th>
          <th>热门</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="pkg in vipPackageList" :key="pkg.id">
          <td>{{ pkg.id }}</td>
          <td>{{ pkg.name }}</td>
          <td>{{ pkg.price }} 金币</td>
          <td>{{ pkg.originalPrice ? pkg.originalPrice + ' 金币' : '-' }}</td>
          <td>{{ pkg.duration }}</td>
          <td>LV{{ pkg.level }}</td>
          <td>{{ pkg.hot === 1 ? '是' : '否' }}</td>
          <td>
            <span :class="['status-badge', pkg.status === 1 ? 'active' : 'disabled']">
              {{ pkg.status === 1 ? '启用' : '禁用' }}
            </span>
          </td>
          <td>
            <button @click="editVipPackage(pkg)" class="action-btn">编辑</button>
            <button @click="toggleVipPackageStatus(pkg)" class="action-btn">
              {{ pkg.status === 1 ? '禁用' : '启用' }}
            </button>
            <button @click="deleteVipPackage(pkg)" class="action-btn delete-btn">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
    </div>

    <!-- 编辑套餐模态框 -->
    <div v-if="showVipModal" class="modal-overlay" @click.self="showVipModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ currentVipPackage.id ? '编辑套餐' : '添加套餐' }}</h3>
          <button @click="showVipModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>套餐名称</label>
            <input v-model="currentVipPackage.name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>价格(金币)</label>
            <input v-model.number="currentVipPackage.price" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>原价(金币)</label>
            <input v-model.number="currentVipPackage.originalPrice" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>时长(天)</label>
            <input v-model.number="currentVipPackage.duration" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>等级</label>
            <input v-model.number="currentVipPackage.level" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>热门</label>
            <select v-model.number="currentVipPackage.hot" class="form-input">
              <option :value="0">否</option>
              <option :value="1">是</option>
            </select>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model.number="currentVipPackage.status" class="form-input">
              <option :value="0">禁用</option>
              <option :value="1">启用</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showVipModal = false" class="cancel-btn">取消</button>
          <button @click="saveVipPackage" class="confirm-btn">确认</button>
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

const vipPackageList = ref([])
const currentVipPackage = ref(null)
const showVipModal = ref(false)

const loadVipPackages = async () => {
  try {
    const res = await apiGet('/api/admin/vip-packages', { page: page.value, pageSize: pageSize.value })
    if (res.code === 200) {
      vipPackageList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载VIP套餐失败:', err)
  }
}

const openCreateVipModal = () => {
  currentVipPackage.value = {
    name: '',
    price: 0,
    originalPrice: 0,
    duration: 30,
    level: 1,
    hot: 0,
    status: 1
  }
  showVipModal.value = true
}

const editVipPackage = (pkg) => {
  currentVipPackage.value = { ...pkg }
  showVipModal.value = true
}

const saveVipPackage = async () => {
  try {
    let res
    if (currentVipPackage.value.id) {
      res = await apiPut('/api/admin/vip-packages/' + currentVipPackage.value.id, currentVipPackage.value)
    } else {
      res = await apiPost('/api/admin/vip-packages', currentVipPackage.value)
    }
    if (res.code === 200) {
      showVipModal.value = false
      loadVipPackages()
    }
  } catch (err) {
    console.error('保存VIP套餐失败:', err)
  }
}

const toggleVipPackageStatus = async (pkg) => {
  try {
    const res = await apiPut('/api/admin/vip-packages/' + pkg.id, {
      ...pkg,
      status: pkg.status === 1 ? 0 : 1
    })
    if (res.code === 200) {
      loadVipPackages()
    }
  } catch (err) {
    console.error('切换VIP套餐状态失败:', err)
  }
}

const deleteVipPackage = async (pkg) => {
  if (!confirm('确定要删除这个VIP套餐吗？')) return
  try {
    const res = await apiDelete('/api/admin/vip-packages/' + pkg.id)
    if (res.code === 200) {
      loadVipPackages()
    }
  } catch (err) {
    console.error('删除VIP套餐失败:', err)
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadVipPackages()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadVipPackages()
  }
}

onMounted(() => {
  loadVipPackages()
})
</script>

<style scoped>
.vip-package-list {
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
