<template>
  <div class="vip-package-list">
    <div class="toolbar">
      <div class="search-bar"></div>
      <button @click="openCreateVipModal" class="add-btn">添加套餐</button>
      <button @click="exportData" class="export-btn">📥 导出CSV</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <table v-else-if="vipPackageList.length > 0" class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>图标</th>
          <th>套餐名称</th>
          <th>描述</th>
          <th>等级</th>
          <th>热门</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="pkg in vipPackageList" :key="pkg.id">
          <td>{{ pkg.id }}</td>
          <td><span style="font-size:24px">{{ pkg.icon || '👑' }}</span></td>
          <td>{{ pkg.name }}</td>
          <td>{{ pkg.desc || '-' }}</td>
          <td>LV{{ pkg.level }}</td>
          <td>{{ pkg.hot === 1 ? '🔥 是' : '否' }}</td>
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

    <div v-if="!loading && vipPackageList.length === 0" class="empty-state">
      <div class="empty-icon">👑</div>
      <div class="empty-text">暂无VIP套餐数据</div>
    </div>

    <div class="pagination">
      <div class="pagination-left">
        <span class="page-size-label">每页</span>
        <select v-model.number="pageSize" @change="page = 1; loadVipPackages()" class="page-size-select">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span class="page-size-label">条，共 {{ total }} 条</span>
      </div>
      <div class="pagination-right">
        <button @click="page = 1; loadVipPackages()" class="page-btn" :disabled="page <= 1">首页</button>
        <button @click="page--; loadVipPackages()" class="page-btn" :disabled="page <= 1">上一页</button>
        <template v-for="p in pageNumbers" :key="p">
          <span v-if="p === '...'" class="page-ellipsis">...</span>
          <button v-else @click="page = p; loadVipPackages()" :class="['page-btn', { 'page-active': page === p }]">{{ p }}</button>
        </template>
        <button @click="page++; loadVipPackages()" class="page-btn" :disabled="page >= totalPages">下一页</button>
        <button @click="page = totalPages; loadVipPackages()" class="page-btn" :disabled="page >= totalPages">末页</button>
      </div>
    </div>

    <!-- 编辑套餐模态框 -->
    <div v-if="showVipModal" class="modal-overlay" @click.self="showVipModal = false">
      <div class="modal-content modal-wide">
        <div class="modal-header">
          <h3>{{ currentVipPackage.id ? '编辑套餐' : '添加套餐' }}</h3>
          <button @click="showVipModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group" style="flex:1">
              <label>套餐名称</label>
              <input v-model="currentVipPackage.name" type="text" class="form-input" placeholder="如：黄金会员" />
            </div>
            <div class="form-group" style="width:80px">
              <label>图标</label>
              <input v-model="currentVipPackage.icon" type="text" class="form-input" placeholder="🥇" maxlength="4" />
            </div>
          </div>
          <div class="form-group">
            <label>描述语</label>
            <input v-model="currentVipPackage.desc" type="text" class="form-input" placeholder="如：入门VIP体验" />
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1">
              <label>等级</label>
              <input v-model.number="currentVipPackage.level" type="number" class="form-input" min="1" />
            </div>
            <div class="form-group" style="width:100px">
              <label>热门</label>
              <select v-model.number="currentVipPackage.hot" class="form-input">
                <option :value="0">否</option>
                <option :value="1">是</option>
              </select>
            </div>
            <div class="form-group" style="width:100px">
              <label>状态</label>
              <select v-model.number="currentVipPackage.status" class="form-input">
                <option :value="0">禁用</option>
                <option :value="1">启用</option>
              </select>
            </div>
          </div>

          <!-- 多档时长定价 -->
          <div class="form-group">
            <label>时长定价 <span class="label-hint">（多档位）</span></label>
            <div class="duration-editor">
              <div v-for="(d, idx) in currentVipPackage.durations" :key="idx" class="duration-row">
                <input v-model="d.label" class="form-input" placeholder="如：1个月" style="width:100px" />
                <input v-model.number="d.months" type="number" class="form-input" placeholder="月数" style="width:80px" min="1" />
                <input v-model.number="d.price" type="number" class="form-input" placeholder="价格" style="width:120px" />
                <input v-model.number="d.originalPrice" type="number" class="form-input" placeholder="原价" style="width:120px" />
                <button @click="removeDuration(idx)" class="btn-remove-sm" :disabled="currentVipPackage.durations.length <= 1">✕</button>
              </div>
              <button @click="addDuration" class="btn-add-sm">+ 添加档位</button>
            </div>
          </div>

          <!-- 权益标签 -->
          <div class="form-group">
            <label>权益列表 <span class="label-hint">（标签）</span></label>
            <div class="benefits-editor">
              <div class="benefit-tags">
                <span v-for="(b, idx) in currentVipPackage.benefits" :key="idx" class="benefit-tag">
                  {{ b }}
                  <button @click="removeBenefit(idx)" class="tag-close">✕</button>
                </span>
              </div>
              <div class="benefit-input-row">
                <input v-model="newBenefit" type="text" class="form-input" placeholder="输入权益，回车添加" @keydown.enter.prevent="addBenefit" />
                <button @click="addBenefit" class="btn-add-sm">添加</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showVipModal = false" class="cancel-btn" :disabled="saving">取消</button>
          <button @click="saveVipPackage" class="confirm-btn" :disabled="saving">{{ saving ? '保存中...' : '确认' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { page, pageSize, total, totalPages, pageNumbers, formatTime, apiGet, apiPost, apiPut, apiDelete, exportCSV, toast, confirm } = useAdmin()

const vipPackageList = ref([])
const currentVipPackage = ref(null)
const showVipModal = ref(false)
const loading = ref(false)
const saving = ref(false)
const newBenefit = ref('')

const loadVipPackages = async () => {
  loading.value = true
  try {
    const res = await apiGet('/api/admin/vip-packages', { page: page.value, pageSize: pageSize.value })
    if (res.code === 200) {
      vipPackageList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载VIP套餐失败:', err)
    toast('加载VIP套餐失败', 'error')
  } finally {
    loading.value = false
  }
}

const openCreateVipModal = () => {
  currentVipPackage.value = {
    name: '',
    icon: '',
    desc: '',
    level: 1,
    hot: 0,
    status: 1,
    benefits: [],
    durations: [{ label: '1个月', months: 1, price: 0, originalPrice: 0 }]
  }
  newBenefit.value = ''
  showVipModal.value = true
}

const editVipPackage = (pkg) => {
  currentVipPackage.value = {
    ...pkg,
    benefits: [...(pkg.benefits || [])],
    durations: [...(pkg.durations || [{ label: '1个月', months: 1, price: 0, originalPrice: 0 }])]
  }
  newBenefit.value = ''
  showVipModal.value = true
}

// 时长档位操作
const addDuration = () => {
  if (!currentVipPackage.value) return
  if (!currentVipPackage.value.durations) currentVipPackage.value.durations = []
  currentVipPackage.value.durations.push({ label: '', months: 1, price: 0, originalPrice: 0 })
}

const removeDuration = (idx) => {
  if (!currentVipPackage.value || currentVipPackage.value.durations.length <= 1) return
  currentVipPackage.value.durations.splice(idx, 1)
}

// 权益标签操作
const addBenefit = () => {
  const val = newBenefit.value.trim()
  if (!val) return
  if (!currentVipPackage.value.benefits) currentVipPackage.value.benefits = []
  if (currentVipPackage.value.benefits.includes(val)) {
    toast('该权益已存在', 'error')
    return
  }
  currentVipPackage.value.benefits.push(val)
  newBenefit.value = ''
}

const removeBenefit = (idx) => {
  if (!currentVipPackage.value) return
  currentVipPackage.value.benefits.splice(idx, 1)
}

const saveVipPackage = async () => {
  if (!currentVipPackage.value.name?.trim()) {
    toast('请填写套餐名称', 'error')
    return
  }
  saving.value = true
  try {
    // 过滤掉空的时长档位
    currentVipPackage.value.durations = (currentVipPackage.value.durations || []).filter(d => d.months && d.months > 0 && d.label?.trim())
    if (currentVipPackage.value.durations.length === 0) {
      currentVipPackage.value.durations = [{ label: '1个月', months: 1, price: 0, originalPrice: 0 }]
    }

    let res
    if (currentVipPackage.value.id) {
      res = await apiPut('/api/admin/vip-packages/' + currentVipPackage.value.id, currentVipPackage.value)
    } else {
      res = await apiPost('/api/admin/vip-packages', currentVipPackage.value)
    }
    if (res.code === 200) {
      showVipModal.value = false
      toast(res.message || '保存成功')
      loadVipPackages()
    } else {
      toast(res.message || '保存失败', 'error')
    }
  } catch (err) {
    console.error('保存VIP套餐失败:', err)
    toast('保存VIP套餐失败', 'error')
  } finally {
    saving.value = false
  }
}

const toggleVipPackageStatus = async (pkg) => {
  try {
    const newStatus = pkg.status === 1 ? 0 : 1
    const res = await apiPut('/api/admin/vip-packages/' + pkg.id + '/status', { status: newStatus })
    if (res.code === 200) {
      toast(res.message || (newStatus === 1 ? '已启用' : '已禁用'))
      loadVipPackages()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('切换VIP套餐状态失败:', err)
    toast('切换状态失败', 'error')
  }
}

const deleteVipPackage = async (pkg) => {
  if (!(await confirm('确定要删除这个VIP套餐吗？'))) return
  try {
    const res = await apiDelete('/api/admin/vip-packages/' + pkg.id)
    if (res.code === 200) {
      toast('VIP套餐已删除')
      loadVipPackages()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('删除VIP套餐失败:', err)
    toast('删除VIP套餐失败', 'error')
  }
}

const exportData = () => {
  exportCSV(vipPackageList.value, [
    { label: 'ID', key: 'id' },
    { label: '图标', key: 'icon' },
    { label: '套餐名称', key: 'name' },
    { label: '描述', key: 'desc' },
    { label: '等级', key: row => 'LV' + row.level },
    { label: '热门', key: row => row.hot === 1 ? '是' : '否' },
    { label: '状态', key: row => row.status === 1 ? '启用' : '禁用' }
  ], 'vip_packages')
}

onMounted(() => {
  loadVipPackages()
})
</script>

<style scoped>
.modal-wide {
  max-width: 640px;
}
.form-row {
  display: flex;
  gap: 12px;
}
.label-hint {
  font-weight: 400;
  color: #9ca3af;
  font-size: 12px;
}
/* 时长编辑器 */
.duration-editor {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px;
}
.duration-row {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
  align-items: center;
}
.duration-row:last-of-type {
  margin-bottom: 8px;
}
.duration-row .form-input {
  font-size: 13px;
  padding: 6px 8px;
}
.btn-remove-sm {
  width: 28px; height: 28px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  color: #ef4444;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.btn-remove-sm:hover { background: #fef2f2; }
.btn-remove-sm:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-add-sm {
  padding: 5px 14px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  background: #f9fafb;
  font-size: 12px;
  cursor: pointer;
  color: #6b7280;
}
.btn-add-sm:hover { border-color: #1677ff; color: #1677ff; background: #eff6ff; }
/* 权益标签 */
.benefits-editor {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px;
}
.benefit-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.benefit-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  background: #eff6ff;
  border: 1px solid #91d5ff;
  border-radius: 12px;
  color: #1677ff;
  font-size: 12px;
}
.tag-close {
  background: none;
  border: none;
  color: #1677ff;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  line-height: 1;
}
.tag-close:hover { color: #ef4444; }
.benefit-input-row {
  display: flex;
  gap: 6px;
}
.benefit-input-row .form-input {
  flex: 1;
  font-size: 13px;
}
</style>
