<template>
  <div class="banner-list">
    <div class="page-header">
      <h2>Banner管理</h2>
      <button @click="openCreateBannerModal" class="add-btn">添加Banner</button>
    </div>

    <div class="search-bar">
      <select v-model="filterStatus" class="search-select">
        <option value="">全部状态</option>
        <option value="1">启用</option>
        <option value="0">禁用</option>
      </select>
      <button @click="loadBanners" class="search-btn">搜索</button>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>图片</th>
          <th>标题</th>
          <th>链接</th>
          <th>排序</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="banner in bannerList" :key="banner.id">
          <td>{{ banner.id }}</td>
          <td>
            <img v-if="banner.image" :src="banner.image" class="user-avatar-small" style="width: 100px; height: 50px; object-fit: cover;" />
            <span v-else>-</span>
          </td>
          <td>{{ banner.title }}</td>
          <td>{{ banner.link || '-' }}</td>
          <td>{{ banner.sort }}</td>
          <td>
            <span :class="['status-badge', banner.status === 1 ? 'active' : 'disabled']">
              {{ banner.status === 1 ? '启用' : '禁用' }}
            </span>
          </td>
          <td>{{ formatTime(banner.createTime) }}</td>
          <td>
            <button @click="editBanner(banner)" class="action-btn">编辑</button>
            <button @click="toggleBannerStatus(banner)" class="action-btn">
              {{ banner.status === 1 ? '禁用' : '启用' }}
            </button>
            <button @click="deleteBanner(banner)" class="action-btn delete-btn">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
    </div>

    <!-- 模态框 -->
    <div v-if="showBannerModal" class="modal-overlay" @click.self="showBannerModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ currentBanner.id ? '编辑Banner' : '添加Banner' }}</h3>
          <button @click="showBannerModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>标题</label>
            <input v-model="currentBanner.title" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>图片URL</label>
            <input v-model="currentBanner.image" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>链接</label>
            <input v-model="currentBanner.link" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>排序</label>
            <input v-model.number="currentBanner.sort" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model.number="currentBanner.status" class="form-input">
              <option value="1">启用</option>
              <option value="0">禁用</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showBannerModal = false" class="cancel-btn">取消</button>
          <button @click="saveBanner" class="confirm-btn">确认</button>
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

const bannerList = ref([])
const filterStatus = ref('')
const currentBanner = ref(null)
const showBannerModal = ref(false)

const loadBanners = async () => {
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (filterStatus.value !== '') {
      params.status = filterStatus.value
    }
    const res = await apiGet('/api/admin/banners', params)
    if (res.code === 200) {
      bannerList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载Banner列表失败:', err)
  }
}

const openCreateBannerModal = () => {
  currentBanner.value = {
    title: '',
    image: '',
    link: '',
    sort: 0,
    status: 1
  }
  showBannerModal.value = true
}

const editBanner = (banner) => {
  currentBanner.value = { ...banner }
  showBannerModal.value = true
}

const saveBanner = async () => {
  try {
    let res
    if (currentBanner.value.id) {
      res = await apiPut('/api/admin/banners/' + currentBanner.value.id, currentBanner.value)
    } else {
      res = await apiPost('/api/admin/banners', currentBanner.value)
    }
    if (res.code === 200) {
      showBannerModal.value = false
      loadBanners()
    }
  } catch (err) {
    console.error('保存Banner失败:', err)
  }
}

const toggleBannerStatus = async (banner) => {
  try {
    const res = await apiPut('/api/admin/banners/' + banner.id, {
      ...banner,
      status: banner.status === 1 ? 0 : 1
    })
    if (res.code === 200) {
      loadBanners()
    }
  } catch (err) {
    console.error('切换Banner状态失败:', err)
  }
}

const deleteBanner = async (banner) => {
  if (!confirm('确定要删除这个Banner吗？')) return
  try {
    const res = await apiDelete('/api/admin/banners/' + banner.id)
    if (res.code === 200) {
      loadBanners()
    }
  } catch (err) {
    console.error('删除Banner失败:', err)
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadBanners()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadBanners()
  }
}

onMounted(() => {
  loadBanners()
})
</script>

<style scoped>
.banner-list {
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
