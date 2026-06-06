<template>
  <div class="banner-list">
    <div class="toolbar">
      <div class="search-bar">
        <select v-model="filterStatus" class="search-select">
          <option value="">全部状态</option>
          <option value="1">启用</option>
          <option value="0">禁用</option>
        </select>
        <button @click="loadBanners" class="search-btn">搜索</button>
        <button @click="openCreateBannerModal" class="add-btn">添加Banner</button>
        <button @click="exportData" class="export-btn">📥 导出CSV</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <table v-else-if="bannerList.length > 0" class="data-table">
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

    <div v-if="!loading && bannerList.length === 0" class="empty-state">
      <div class="empty-icon">🖼️</div>
      <div class="empty-text">暂无Banner数据</div>
    </div>

    <div class="pagination">
      <div class="pagination-left">
        <span class="page-size-label">每页</span>
        <select v-model.number="pageSize" @change="page = 1; loadBanners()" class="page-size-select">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span class="page-size-label">条，共 {{ total }} 条</span>
      </div>
      <div class="pagination-right">
        <button @click="page = 1; loadBanners()" class="page-btn" :disabled="page <= 1">首页</button>
        <button @click="page--; loadBanners()" class="page-btn" :disabled="page <= 1">上一页</button>
        <template v-for="p in pageNumbers" :key="p">
          <span v-if="p === '...'" class="page-ellipsis">...</span>
          <button v-else @click="page = p; loadBanners()" :class="['page-btn', { 'page-active': page === p }]">{{ p }}</button>
        </template>
        <button @click="page++; loadBanners()" class="page-btn" :disabled="page >= totalPages">下一页</button>
        <button @click="page = totalPages; loadBanners()" class="page-btn" :disabled="page >= totalPages">末页</button>
      </div>
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
            <label>图片</label>
            <div class="image-upload-row">
              <input v-model="currentBanner.image" type="text" class="form-input" placeholder="图片URL或上传" />
              <input type="file" accept="image/*" @change="handleImageUpload" ref="fileInputRef" class="hidden-file-input" />
              <button type="button" @click="fileInputRef?.click()" class="upload-btn" :disabled="uploading">
                {{ uploading ? '上传中...' : '📷 上传' }}
              </button>
            </div>
            <img v-if="currentBanner.image" :src="currentBanner.image" class="image-preview" />
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

const { token, page, pageSize, total, totalPages, pageNumbers, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete, exportCSV, toast, confirm } = useAdmin()

const bannerList = ref([])
const filterStatus = ref('')
const currentBanner = ref(null)
const showBannerModal = ref(false)
const loading = ref(false)
const fileInputRef = ref(null)
const uploading = ref(false)

const loadBanners = async () => {
  loading.value = true
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
    toast('加载Banner列表失败', 'error')
  } finally {
    loading.value = false
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
  if (!(await confirm('确定要删除这个Banner吗？'))) return
  try {
    const res = await apiDelete('/api/admin/banners/' + banner.id)
    if (res.code === 200) {
      toast('Banner已删除')
      loadBanners()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('删除Banner失败:', err)
    toast('删除Banner失败', 'error')
  }
}

// Banner图片上传
const handleImageUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('image', file)
    const adminToken = localStorage.getItem('admin_token')
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {},
      body: formData
    })
    const data = await res.json()
    if (data.code === 200 && data.data?.url) {
      currentBanner.value.image = data.data.url
    } else {
      toast(data.message || '上传失败', 'error')
    }
  } catch (err) {
    console.error('上传图片失败:', err)
    toast('上传图片失败', 'error')
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

const exportData = () => {
  exportCSV(bannerList.value, [
    { label: 'ID', key: 'id' },
    { label: '标题', key: 'title' },
    { label: '链接', key: 'link' },
    { label: '排序', key: 'sort' },
    { label: '状态', key: row => row.status === 1 ? '启用' : '禁用' },
    { label: '创建时间', key: row => formatTime(row.createTime) }
  ], 'banners')
}

onMounted(() => {
  loadBanners()
})
</script>

<style scoped>
/* Banner特有样式 */
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
