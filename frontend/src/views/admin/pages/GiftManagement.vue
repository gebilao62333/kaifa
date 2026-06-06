<template>
  <div class="gift-list">
    <div class="toolbar">
      <div class="search-bar">
        <input v-model="searchKeyword" type="text" placeholder="搜索礼物名称" class="search-input" />
        <select v-model="filterStatus" class="search-select">
          <option value="">全部状态</option>
          <option value="1">启用</option>
          <option value="0">禁用</option>
        </select>
        <button @click="loadGifts" class="search-btn">搜索</button>
        <button @click="openCreateGiftModal" class="add-btn">添加礼物</button>
        <button @click="openBatchAddModal" class="batch-btn">📦 批量添加</button>
        <button @click="exportData" class="export-btn">📥 导出CSV</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <table v-else-if="giftList.length > 0" class="data-table">
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

    <div v-if="!loading && giftList.length === 0" class="empty-state">
      <div class="empty-icon">🎁</div>
      <div class="empty-text">暂无礼物数据</div>
    </div>

    <div class="pagination">
      <div class="pagination-left">
        <span class="page-size-label">每页</span>
        <select v-model.number="pageSize" @change="page = 1; loadGifts()" class="page-size-select">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span class="page-size-label">条，共 {{ total }} 条</span>
      </div>
      <div class="pagination-right">
        <button @click="page = 1; loadGifts()" class="page-btn" :disabled="page <= 1">首页</button>
        <button @click="page--; loadGifts()" class="page-btn" :disabled="page <= 1">上一页</button>
        <template v-for="p in pageNumbers" :key="p">
          <span v-if="p === '...'" class="page-ellipsis">...</span>
          <button v-else @click="page = p; loadGifts()" :class="['page-btn', { 'page-active': page === p }]">{{ p }}</button>
        </template>
        <button @click="page++; loadGifts()" class="page-btn" :disabled="page >= totalPages">下一页</button>
        <button @click="page = totalPages; loadGifts()" class="page-btn" :disabled="page >= totalPages">末页</button>
      </div>
    </div>

    <!-- 编辑模态框 -->
    <div v-if="showGiftModal" class="modal-overlay gift-overlay" @click.self="showGiftModal = false">
      <div class="modal-content gift-modal">
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
            <div class="image-upload-row">
              <input v-model="currentGift.image" type="text" class="form-input" placeholder="图片URL或上传" />
              <input type="file" accept="image/*" @change="handleSingleImageUpload" ref="singleFileInputRef" class="hidden-file-input" />
              <button type="button" @click="singleFileInputRef?.click()" class="upload-btn" :disabled="singleUploading">
                {{ singleUploading ? '上传中...' : '📷 上传' }}
              </button>
            </div>
            <img v-if="currentGift.image" :src="currentGift.image" class="image-preview" />
          </div>
          <div class="form-group">
            <label>特效动画 (SVGA)</label>
            <div class="image-upload-row">
              <input v-model="currentGift.svga" type="text" class="form-input" placeholder="SVGA动画URL或上传" />
              <input type="file" accept=".svga" @change="handleSingleSvgaUpload" ref="singleSvgaFileInputRef" class="hidden-file-input" />
              <button type="button" @click="singleSvgaFileInputRef?.click()" class="upload-btn svga-upload-btn" :disabled="singleSvgaUploading">
                {{ singleSvgaUploading ? '上传中...' : '🎬 上传SVGA' }}
              </button>
            </div>
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
            <label>有效天数 (0=永久)</label>
            <input v-model.number="currentGift.tian" type="number" class="form-input" placeholder="0" />
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

    <!-- 批量添加模态框 -->
    <div v-if="showBatchModal" class="modal-overlay batch-overlay" @click.self="showBatchModal = false">
      <div class="modal-content batch-modal">
        <div class="modal-header">
          <h3>批量添加礼物</h3>
          <button @click="showBatchModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body batch-body">
          <div class="batch-toolbar">
            <button @click="addBatchRow" class="batch-row-btn">+ 添加一行</button>
            <button @click="clearBatchRows" class="batch-clear-btn">清空全部</button>
            <span class="batch-count">共 {{ batchGifts.length }} 件礼物</span>
          </div>
          <div class="batch-table-wrap">
            <table class="batch-table">
              <thead>
                <tr>
                  <th style="width:40px">#</th>
                  <th style="width:130px">礼物名称</th>
                  <th style="width:110px">图片</th>
                  <th style="width:110px">SVGA</th>
                  <th style="width:80px">价格</th>
                  <th style="width:75px">类型</th>
                  <th style="width:65px">VIP</th>
                  <th style="width:65px">排序</th>
                  <th style="width:65px">天数</th>
                  <th style="width:70px">状态</th>
                  <th style="width:40px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in batchGifts" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td><input v-model="item.title" type="text" class="batch-input" placeholder="名称" /></td>
                  <td>
                    <div v-if="item.image" class="batch-image-cell" :title="item.image">
                      <img :src="item.image" class="batch-thumb" />
                      <button @click="item.image = ''" class="batch-img-del" title="清除图片">&times;</button>
                    </div>
                    <button v-else @click="triggerBatchUpload(index, 'image')" class="batch-upload-btn" :disabled="batchUploadingIdx === index">
                      {{ batchUploadingIdx === index ? '...' : '📷 上传' }}
                    </button>
                  </td>
                  <td>
                    <span v-if="item.svga" class="batch-svga-cell">
                      🎬 <button @click="item.svga = ''" class="batch-img-del" title="清除SVGA">&times;</button>
                    </span>
                    <button v-else @click="triggerBatchUpload(index, 'svga')" class="batch-upload-btn" :disabled="batchUploadingIdx === index">
                      {{ batchUploadingIdx === index ? '...' : 'SVGA' }}
                    </button>
                  </td>
                  <td><input v-model.number="item.money" type="number" class="batch-input" placeholder="0" /></td>
                  <td>
                    <select v-model.number="item.type" class="batch-select">
                      <option :value="0">普通</option>
                      <option :value="1">特殊</option>
                    </select>
                  </td>
                  <td>
                    <select v-model.number="item.is_vip" class="batch-select">
                      <option :value="0">否</option>
                      <option :value="1">是</option>
                    </select>
                  </td>
                  <td><input v-model.number="item.sort" type="number" class="batch-input" placeholder="0" /></td>
                  <td><input v-model.number="item.tian" type="number" class="batch-input" placeholder="0" /></td>
                  <td>
                    <select v-model.number="item.status" class="batch-select">
                      <option :value="1">启用</option>
                      <option :value="0">禁用</option>
                    </select>
                  </td>
                  <td><button @click="removeBatchRow(index)" class="batch-del-btn" title="删除行">&times;</button></td>
                </tr>
                <tr v-if="batchGifts.length === 0">
                  <td colspan="11" class="batch-empty">暂无数据，点击「添加一行」开始</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="batchProgress.total > 0" class="batch-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (batchProgress.done / batchProgress.total * 100) + '%' }"></div>
            </div>
            <span class="progress-text">{{ batchProgress.done }} / {{ batchProgress.total }} 已完成</span>
          </div>
          <input type="file" accept="image/*" @change="handleBatchImageUpload" ref="batchFileInputRef" class="hidden-file-input" />
          <input type="file" accept=".svga" @change="handleBatchSvgaUpload" ref="batchSvgaFileInputRef" class="hidden-file-input" />
        </div>
        <div class="modal-footer">
          <button @click="showBatchModal = false" class="cancel-btn">取消</button>
          <button @click="submitBatchGifts" class="confirm-btn" :disabled="batchSubmitting || batchGifts.length === 0">
            {{ batchSubmitting ? '提交中...' : '确认批量添加' }}
          </button>
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

const giftList = ref([])
const searchKeyword = ref('')
const filterStatus = ref('')
const currentGift = ref(null)
const showGiftModal = ref(false)
const loading = ref(false)
const singleFileInputRef = ref(null)
const singleUploading = ref(false)
const singleSvgaFileInputRef = ref(null)
const singleSvgaUploading = ref(false)

const loadGifts = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) { params.keyword = searchKeyword.value }
    if (filterStatus.value !== '') { params.status = filterStatus.value }
    const res = await apiGet('/api/admin/gifts', params)
    if (res.code === 200) {
      giftList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载礼物列表失败:', err)
    toast('加载礼物列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const openCreateGiftModal = () => {
  currentGift.value = {
    title: '',
    image: '',
    svga: '',
    money: 0,
    type: 0,
    is_vip: 0,
    sort: 0,
    tian: 0,
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

// 单礼物图片上传
const handleSingleImageUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  singleUploading.value = true
  try {
    const formData = new FormData()
    formData.append('image', file)
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    })
    const data = await res.json()
    if (data.code === 200 && data.data?.url) {
      currentGift.value.image = data.data.url
      // 如果名称为空，用文件名自动填充礼物名称
      if (!currentGift.value.title?.trim()) {
        currentGift.value.title = file.name.replace(/\.[^.]+$/, '')
      }
    } else {
      toast(data.message || '上传失败', 'error')
    }
  } catch (err) {
    console.error('上传图片失败:', err)
    toast('上传图片失败', 'error')
  } finally {
    singleUploading.value = false
    event.target.value = ''
  }
}

// 单礼物SVGA上传
const handleSingleSvgaUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  singleSvgaUploading.value = true
  try {
    const formData = new FormData()
    formData.append('image', file)
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    })
    const data = await res.json()
    if (data.code === 200 && data.data?.url) {
      currentGift.value.svga = data.data.url
    } else {
      toast(data.message || '上传失败', 'error')
    }
  } catch (err) {
    console.error('上传SVGA失败:', err)
    toast('上传SVGA失败', 'error')
  } finally {
    singleSvgaUploading.value = false
    event.target.value = ''
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
  if (!(await confirm('确定要删除这个礼物吗？'))) return
  try {
    const res = await apiDelete('/api/admin/gifts/' + gift.id)
    if (res.code === 200) {
      toast('礼物已删除')
      loadGifts()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('删除礼物失败:', err)
    toast('删除礼物失败', 'error')
  }
}

const exportData = () => {
  exportCSV(giftList.value, [
    { label: 'ID', key: 'id' },
    { label: '名称', key: 'title' },
    { label: '价格(金币)', key: 'money' },
    { label: '类型', key: row => row.type === 1 ? '特殊' : '普通' },
    { label: 'VIP专属', key: row => row.is_vip === 1 ? '是' : '否' },
    { label: '排序', key: 'sort' },
    { label: '状态', key: row => row.status === 1 ? '启用' : '禁用' }
  ], 'gifts')
}

// --- 批量添加 ---
const showBatchModal = ref(false)
const batchGifts = ref([])
const batchSubmitting = ref(false)
const batchProgress = reactive({ done: 0, total: 0 })
const batchFileInputRef = ref(null)
const batchSvgaFileInputRef = ref(null)
const batchUploadingIdx = ref(-1)
const batchUploadingField = ref('image')

const triggerBatchUpload = (index, field = 'image') => {
  batchUploadingIdx.value = index
  batchUploadingField.value = field
  if (field === 'svga') {
    batchSvgaFileInputRef.value?.click()
  } else {
    batchFileInputRef.value?.click()
  }
}

const handleBatchImageUpload = async (event) => {
  const file = event.target.files?.[0]
  const idx = batchUploadingIdx.value
  if (!file || idx < 0 || idx >= batchGifts.value.length) {
    batchUploadingIdx.value = -1
    event.target.value = ''
    return
  }
  try {
    const formData = new FormData()
    formData.append('image', file)
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    })
    const data = await res.json()
    if (data.code === 200 && data.data?.url) {
      batchGifts.value[idx].image = data.data.url
      // 如果名称为空，用文件名自动填充礼物名称
      if (!batchGifts.value[idx].title.trim()) {
        batchGifts.value[idx].title = file.name.replace(/\.[^.]+$/, '')
      }
    } else {
      toast(data.message || '上传失败', 'error')
    }
  } catch (err) {
    console.error('上传图片失败:', err)
    toast('上传图片失败', 'error')
  } finally {
    batchUploadingIdx.value = -1
    event.target.value = ''
  }
}

const handleBatchSvgaUpload = async (event) => {
  const file = event.target.files?.[0]
  const idx = batchUploadingIdx.value
  if (!file || idx < 0 || idx >= batchGifts.value.length) {
    batchUploadingIdx.value = -1
    event.target.value = ''
    return
  }
  try {
    const formData = new FormData()
    formData.append('image', file)
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    })
    const data = await res.json()
    if (data.code === 200 && data.data?.url) {
      batchGifts.value[idx].svga = data.data.url
    } else {
      toast(data.message || '上传失败', 'error')
    }
  } catch (err) {
    console.error('上传SVGA失败:', err)
    toast('上传SVGA失败', 'error')
  } finally {
    batchUploadingIdx.value = -1
    event.target.value = ''
  }
}

const openBatchAddModal = () => {
  batchGifts.value = [{
    title: '', image: '', svga: '', money: 0, type: 0, is_vip: 0, sort: 0, tian: 0, status: 1
  }]
  batchProgress.done = 0
  batchProgress.total = 0
  showBatchModal.value = true
}

const addBatchRow = () => {
  batchGifts.value.push({
    title: '', image: '', svga: '', money: 0, type: 0, is_vip: 0, sort: 0, tian: 0, status: 1
  })
}

const removeBatchRow = (index) => {
  batchGifts.value.splice(index, 1)
}

const clearBatchRows = () => {
  batchGifts.value = []
}

const submitBatchGifts = async () => {
  // 过滤掉名称为空的行
  const validGifts = batchGifts.value.filter(g => g.title.trim())
  if (validGifts.length === 0) {
    toast('请至少填写一个礼物名称')
    return
  }

  batchSubmitting.value = true
  batchProgress.total = validGifts.length
  batchProgress.done = 0
  let successCount = 0

  for (const gift of validGifts) {
    try {
      const res = await apiPost('/api/admin/gifts', {
        title: gift.title.trim(),
        image: gift.image.trim(),
        svga: gift.svga?.trim() || '',
        money: gift.money || 0,
        type: gift.type || 0,
        is_vip: gift.is_vip || 0,
        sort: gift.sort || 0,
        tian: gift.tian || 0,
        status: gift.status ?? 1
      })
      if (res.code === 200) {
        successCount++
      }
    } catch (err) {
      console.error('批量添加礼物失败:', gift.title, err)
    }
    batchProgress.done++
  }

  batchSubmitting.value = false
  toast(`批量添加完成：成功 ${successCount} / ${validGifts.length}`)
  showBatchModal.value = false
  loadGifts()
}

onMounted(() => {
  loadGifts()
})
</script>

<style scoped>
.gift-avatar {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
}

/* 图片上传 */
.image-upload-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.image-upload-row .form-input {
  flex: 1;
}

.upload-btn {
  padding: 8px 14px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.svga-upload-btn {
  background: #722ed1;
}

.image-preview {
  margin-top: 8px;
  max-width: 120px;
  max-height: 120px;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  object-fit: cover;
}

.hidden-file-input {
  display: none;
}

/* 批量图片上传 */
.batch-image-cell {
  position: relative;
  display: inline-block;
}

.batch-thumb {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #e8e8e8;
}

.batch-img-del {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 50%;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
  padding: 0;
}

.batch-upload-btn {
  padding: 4px 8px;
  background: #f0f0f0;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}

.batch-upload-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.batch-upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.batch-svga-cell {
  position: relative;
  display: inline-block;
  font-size: 12px;
  padding: 4px 6px;
  background: #f9f0ff;
  border: 1px solid #d3adf7;
  border-radius: 4px;
  color: #722ed1;
}

/* 单个添加/编辑弹窗 */
.gift-overlay {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding-top: 40px;
  padding-left: 240px;
}

.gift-modal {
  width: calc(100vw - 280px);
  max-width: none !important;
}

/* 批量添加样式 */
.batch-overlay {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding-top: 40px;
  padding-left: 240px;
}

.batch-modal {
  width: calc(100vw - 280px);
  max-width: none !important;
}

.batch-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
  font-size: 16px;
  color: #000000;
}

.batch-modal .modal-body {
  max-height: 65vh;
  overflow-y: auto;
  padding: 20px 24px;
}

.batch-modal .modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.batch-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.batch-row-btn {
  padding: 6px 14px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.batch-clear-btn {
  padding: 6px 14px;
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.batch-count {
  color: #666;
  font-size: 13px;
  margin-left: auto;
}

.batch-table-wrap {
  overflow-x: auto;
}

.batch-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.batch-table th {
  background: #fafafa;
  padding: 10px 8px;
  border: 1px solid #e8e8e8;
  text-align: left;
  font-weight: 500;
  white-space: nowrap;
  font-size: 13px;
  color: #555;
}

.batch-table td {
  padding: 6px 8px;
  border: 1px solid #e8e8e8;
  vertical-align: middle;
}

.batch-input {
  width: 100%;
  padding: 7px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  box-sizing: border-box;
  line-height: 1.5;
}

.batch-input:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.batch-select {
  width: 100%;
  padding: 7px 4px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  background: #fff;
  cursor: pointer;
}

.batch-del-btn {
  padding: 2px 8px;
  background: none;
  border: none;
  color: #ff4d4f;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
}

.batch-empty {
  text-align: center;
  padding: 30px;
  color: #999;
}

.batch-btn {
  padding: 6px 14px;
  background: #52c41a;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  margin-left: 6px;
}

.batch-btn:hover {
  opacity: 0.85;
}

.batch-progress {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #1890ff;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}
</style>
