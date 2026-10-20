<template>
  <div>
    <div class="page-actions">
      <input v-model="searchKeyword" placeholder="搜索公告标题..." class="search-input" @keyup.enter="reload" />
      <select v-model="filterStatus" class="status-select" @change="reload">
        <option value="">全部状态</option>
        <option value="1">已发布</option>
        <option value="0">已下线</option>
      </select>
      <button class="btn-primary" v-if="canWrite" @click="openCreate">+ 新增公告</button>
    </div>

    <div v-if="loading" class="loading-wrap"><div class="spinner"></div><span>加载中...</span></div>
    <table class="data-table" v-else>
      <thead>
        <tr><th>ID</th><th>标题</th><th>类型</th><th>状态</th><th>置顶</th><th>生效时间</th><th>操作</th></tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.id">
          <td>{{ item.id }}</td>
          <td class="title-cell">{{ item.title }}</td>
          <td>{{ typeText(item.type) }}</td>
          <td><span :class="['status-tag', item.status === 1 ? 'active' : 'disabled']">{{ item.status === 1 ? '已发布' : '已下线' }}</span></td>
          <td>{{ item.pinned ? '是' : '否' }}</td>
          <td>{{ timeRange(item) }}</td>
          <td class="actions-cell" v-if="canWrite">
            <button class="btn-sm" @click="openEdit(item)">编辑</button>
            <button class="btn-sm" @click="toggleStatus(item)">{{ item.status === 1 ? '下线' : '发布' }}</button>
            <button class="btn-sm danger" @click="remove(item)">删除</button>
          </td>
          <td class="actions-cell" v-else>—</td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button :disabled="page <= 1" @click="page--; loadList()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页 (共 {{ total }} 条)</span>
      <button :disabled="page >= totalPages" @click="page++; loadList()">下一页</button>
    </div>

    <div class="modal-overlay" v-if="showModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑公告' : '新增公告' }}</h3>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>
        <div class="form-grid">
          <label>标题: <input v-model="form.title" maxlength="120" placeholder="不超过120字" /></label>
          <label>类型:
            <select v-model="form.type">
              <option value="notice">公告</option>
              <option value="activity">活动</option>
              <option value="system">系统</option>
            </select>
          </label>
          <label>正文: <textarea v-model="form.content" rows="5" maxlength="5000" placeholder="公告正文"></textarea></label>
          <label class="inline-row">
            <span>置顶</span>
            <input type="checkbox" v-model="form.pinned" />
            <span class="hint">置顶公告在 C 端列表优先展示</span>
          </label>
          <label>状态:
            <select v-model.number="form.status">
              <option :value="1">发布（C 端可见）</option>
              <option :value="0">下线</option>
            </select>
          </label>
          <label>生效时间（留空=立即）: <input v-model="form.startTime" type="datetime-local" /></label>
          <label>失效时间（留空=长期）: <input v-model="form.endTime" type="datetime-local" /></label>
        </div>
        <div class="modal-actions">
          <button class="btn-primary" :disabled="saving" @click="save">{{ saving ? '保存中...' : '保存' }}</button>
          <button @click="showModal = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import adminService from '../../services/adminService'
import { useAdminApi } from '../../composables/useAdminApi'
import { useToast } from '../../composables/useToast'
import { hasPermission, readStoredAdmin } from '../../common/adminPermission'

const { page, pageSize, total, totalPages, searchKeyword, filterStatus, formatTime } = useAdminApi()
const toast = useToast()

const list = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const form = ref(emptyForm())

// A-2：本地权限预判（UI 前置），服务端 splash:write 仍是最终边界
const canWrite = computed(() => hasPermission((readStoredAdmin() || {}).permissions, 'splash:write'))

function emptyForm() {
  return { id: '', title: '', content: '', type: 'notice', status: 1, pinned: false, startTime: '', endTime: '' }
}

const TYPE_TEXT = { notice: '公告', activity: '活动', system: '系统' }
const typeText = (t) => TYPE_TEXT[t] || '公告'

// 后端时间戳是秒；datetime-local 需要本地 "YYYY-MM-DDTHH:mm"
const toLocalInput = (ts) => {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const fromLocalInput = (value) => {
  if (!value) return 0
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0
}
const timeRange = (item) => {
  if (!item.startTime && !item.endTime) return '立即 / 长期'
  const start = item.startTime ? formatTime(item.startTime * 1000) : '立即'
  const end = item.endTime ? formatTime(item.endTime * 1000) : '长期'
  return start + ' ~ ' + end
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await adminService.getNoticeList({
      page: page.value,
      pageSize: pageSize.value,
      status: filterStatus.value,
      keyword: searchKeyword.value
    })
    if (res.code === 200 || res.code === 0) {
      list.value = (res.data && res.data.list) || []
      total.value = (res.data && res.data.pagination && res.data.pagination.total) || list.value.length
    }
  } catch (e) {
    toast.error('加载失败: ' + (e.message || '网络错误'))
  } finally {
    loading.value = false
  }
}

const reload = () => {
  if (page.value !== 1) page.value = 1
  else loadList()
}

const openCreate = () => {
  isEdit.value = false
  form.value = emptyForm()
  showModal.value = true
}

const openEdit = (item) => {
  isEdit.value = true
  form.value = {
    id: item.id,
    title: item.title,
    content: item.content,
    type: item.type,
    status: item.status,
    pinned: !!item.pinned,
    startTime: toLocalInput(item.startTime),
    endTime: toLocalInput(item.endTime)
  }
  showModal.value = true
}

const buildPayload = () => ({
  title: form.value.title.trim(),
  content: form.value.content.trim(),
  type: form.value.type,
  status: Number(form.value.status),
  pinned: form.value.pinned ? 1 : 0,
  startTime: fromLocalInput(form.value.startTime),
  endTime: fromLocalInput(form.value.endTime)
})

const save = async () => {
  if (saving.value) return
  const payload = buildPayload()
  if (!payload.title) return toast.error('请填写公告标题')
  if (!payload.content) return toast.error('请填写公告正文')
  if (payload.startTime && payload.endTime && payload.endTime < payload.startTime) {
    return toast.error('失效时间不能早于生效时间')
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await adminService.updateNotice(form.value.id, payload)
      toast.success('公告已更新')
    } else {
      await adminService.createNotice(payload)
      toast.success('公告已保存')
    }
    showModal.value = false
    loadList()
  } catch (e) {
    toast.error('保存失败: ' + (e.message || '网络错误'))
  } finally {
    saving.value = false
  }
}

const toggleStatus = async (item) => {
  const next = item.status === 1 ? 0 : 1
  if (!confirm(next === 1 ? '确定发布该公告？' : '确定下线该公告？')) return
  try {
    await adminService.updateNotice(item.id, { status: next })
    toast.success(next === 1 ? '已发布' : '已下线')
    loadList()
  } catch (e) {
    toast.error('操作失败: ' + (e.message || '网络错误'))
  }
}

const remove = async (item) => {
  if (!confirm(`确定删除公告「${item.title}」吗？`)) return
  try {
    await adminService.deleteNotice(item.id)
    toast.success('公告已删除')
    loadList()
  } catch (e) {
    toast.error('删除失败: ' + (e.message || '网络错误'))
  }
}

onMounted(loadList)
</script>

<style scoped>
.loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: #999; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #f0f0f0; border-top-color: #1890ff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }
.search-input { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; width: 220px; }
.status-select { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; }
.btn-primary { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-sm { padding: 4px 10px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px; margin-right: 4px; }
.btn-sm.danger { color: #ff4d4f; border-color: #ff4d4f; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.data-table th { text-align: left; padding: 12px; background: #fafafa; color: #666; font-size: 13px; font-weight: 600; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.title-cell { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-tag.active { background: #f6ffed; color: #52c41a; }
.status-tag.disabled { background: #f5f5f5; color: #999; }
.actions-cell { white-space: nowrap; }
.pagination { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 16px; font-size: 13px; color: #666; }
.pagination button { padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { background: #fff; border-radius: 8px; padding: 24px; width: 560px; max-height: 85vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.modal-header h3 { margin: 0; }
.modal-close { width: 28px; height: 28px; border: none; background: transparent; font-size: 22px; color: #999; cursor: pointer; }
.form-grid { display: grid; gap: 12px; }
.form-grid label { display: flex; flex-direction: column; font-size: 13px; color: #666; gap: 4px; }
.form-grid input, .form-grid select, .form-grid textarea { padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; font-family: inherit; }
.inline-row { flex-direction: row !important; align-items: center; gap: 8px; }
.hint { color: #aaa; font-size: 12px; }
.modal-actions { margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end; }
.modal-actions button { padding: 8px 20px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
</style>
