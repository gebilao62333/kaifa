<template>
  <div class="admin-card">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">举报总数</div>
        <div class="stat-num">{{ stats.total }}</div>
      </div>
      <div class="stat-card stat-warn">
        <div class="stat-label">待处理</div>
        <div class="stat-num">{{ stats.pending }}</div>
      </div>
      <div class="stat-card stat-ok">
        <div class="stat-label">已处理</div>
        <div class="stat-num">{{ stats.resolved }}</div>
      </div>
      <div class="stat-card stat-muted">
        <div class="stat-label">已驳回</div>
        <div class="stat-num">{{ stats.rejected }}</div>
      </div>
      <div class="stat-card stat-info">
        <div class="stat-label">今日新增</div>
        <div class="stat-num">{{ stats.today }}</div>
      </div>
    </div>

    <!-- 批量操作工具栏 -->
    <div v-if="selectedIds.length > 0" class="batch-bar">
      <span>已选 <strong>{{ selectedIds.length }}</strong> 条</span>
      <button @click="showBatchDialog('resolved')" class="batch-btn batch-ok">批量处理</button>
      <button @click="showBatchDialog('rejected')" class="batch-btn batch-no">批量驳回</button>
      <button @click="batchDeleteRecords" class="batch-btn batch-del">批量删除</button>
      <button @click="selectedIds = []" class="batch-cancel">取消选择</button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <input
        v-model="filters.keyword"
        placeholder="搜索举报人 / 被举报人 / 内容关键词..."
        class="filter-input"
        @keyup.enter="searchReports"
      />
      <select v-model="filters.status" class="filter-select" @change="searchReports">
        <option value="">全部状态</option>
        <option value="pending">待处理</option>
        <option value="resolved">已处理</option>
        <option value="rejected">已驳回</option>
      </select>
      <select v-model="filters.reason" class="filter-select" @change="searchReports">
        <option value="">全部原因</option>
        <option value="垃圾广告">垃圾广告</option>
        <option value="恶意骚扰">恶意骚扰</option>
        <option value="侮辱谩骂">侮辱谩骂</option>
        <option value="虚假信息">虚假信息</option>
        <option value="欺诈行为">欺诈行为</option>
        <option value="色情低俗">色情低俗</option>
        <option value="政治敏感">政治敏感</option>
        <option value="恶意差评">恶意差评</option>
        <option value="刷屏灌水">刷屏灌水</option>
        <option value="侵犯隐私">侵犯隐私</option>
      </select>
      <button @click="searchReports" class="btn-primary-sm">搜索</button>
      <button @click="clearFilters" class="btn-outline-sm">重置</button>
      <span class="filter-divider"></span>
      <input type="date" v-model="filters.dateFrom" class="filter-date" @change="searchReports" />
      <span class="filter-sep">至</span>
      <input type="date" v-model="filters.dateTo" class="filter-date" @change="searchReports" />
      <span class="filter-spacer"></span>
      <button @click="loadReports" class="btn-outline-sm">刷新</button>
      <button @click="exportData" class="btn-primary-sm">导出</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-box">
      <span class="spinner"></span>
      <span>加载中...</span>
    </div>

    <!-- 表格 -->
    <div v-else-if="reportList.length > 0" class="table-wrap">
      <table class="r-table">
        <thead>
          <tr>
            <th class="w-check"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th>
            <th class="w-id">ID</th>
            <th class="w-user">举报人</th>
            <th class="w-user">被举报</th>
            <th class="w-cat">类型 / 原因</th>
            <th class="w-status">状态</th>
            <th class="w-result">处理说明</th>
            <th class="w-time">时间</th>
            <th class="w-action">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in reportList"
            :key="r.id"
            :class="{ 'row-sel': selectedIds.includes(r.id) }"
          >
            <td class="w-check">
              <input type="checkbox" :checked="selectedIds.includes(r.id)" @change="toggleSelect(r.id)" :disabled="r.status !== 'pending'" />
            </td>
            <td class="w-id">{{ r.id }}</td>
            <td class="w-user">{{ r.reporterName }}</td>
            <td class="w-user">
              <span :class="['dot', 'dot-' + r.targetTypeName]"></span>
              {{ r.targetUserNickname || (r.targetUser?.nickname) || '用户' + (r.targetUserId || r.targetUser?.id || '—') }}
            </td>
            <td class="w-cat">
              <span class="tag tag-type">{{ r.targetTypeName }}</span>
              <span class="tag tag-reason">{{ r.reason }}</span>
            </td>
            <td class="w-status">
              <span :class="['badge', 'badge-' + r.status]">{{ statusText(r.status) }}</span>
            </td>
            <td class="w-result">
              <template v-if="r.status === 'resolved' && r.handleResult">
                <span class="result-line" :title="r.handleResult">{{ r.handleResult }}</span>
              </template>
              <template v-else-if="r.status === 'rejected' && r.rejectReason">
                <span class="result-line result-no" :title="r.rejectReason">{{ r.rejectReason }}</span>
              </template>
              <span v-else class="result-empty">-</span>
            </td>
            <td class="w-time">{{ formatDisplayTime(r.createTime) }}</td>
            <td class="w-action">
              <button @click="viewReport(r)" class="link-btn">查看</button>
              <button v-if="r.status === 'pending'" @click="handleAction(r, 'resolved')" class="link-btn link-ok">处理</button>
              <button v-if="r.status === 'pending'" @click="handleAction(r, 'rejected')" class="link-btn link-no">驳回</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="!loading" class="empty-box">暂无举报记录</div>

    <!-- 分页 -->
    <div class="pager" v-if="reportList.length > 0">
      <div class="pager-left">
        <select v-model.number="pageSize" @change="page = 1; loadReports()" class="pager-size">
          <option :value="10">10条/页</option>
          <option :value="20">20条/页</option>
          <option :value="50">50条/页</option>
          <option :value="100">100条/页</option>
        </select>
        <span class="pager-total">共 {{ total }} 条</span>
      </div>
      <div class="pager-right">
        <button @click="page = 1; loadReports()" :disabled="page <= 1" class="pager-btn">首页</button>
        <button @click="page--; loadReports()" :disabled="page <= 1" class="pager-btn">上一页</button>
        <template v-for="p in pageNumbers" :key="p">
          <span v-if="p === '...'" class="pager-dots">...</span>
          <button v-else @click="page = p; loadReports()" :class="['pager-btn', { 'pager-on': page === p }]">{{ p }}</button>
        </template>
        <button @click="page++; loadReports()" :disabled="page >= totalPages" class="pager-btn">下一页</button>
        <button @click="page = totalPages; loadReports()" :disabled="page >= totalPages" class="pager-btn">末页</button>
      </div>
    </div>

    <!-- 处理/驳回弹窗 -->
    <div v-if="showActionDialog" class="modal-overlay" @click.self="showActionDialog = false">
      <div class="modal-box">
        <div class="modal-head">
          <h3>{{ dialogAction === 'resolved' ? '处理举报' : '驳回举报' }}</h3>
          <button @click="showActionDialog = false" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-info">
            <div class="info-line"><span class="info-k">举报ID</span><span class="info-v">#{{ dialogReport?.id }}</span></div>
            <div class="info-line"><span class="info-k">举报人</span><span class="info-v">{{ dialogReport?.reporterName }}</span></div>
            <div class="info-line"><span class="info-k">被举报</span><span class="info-v">{{ dialogReport?.targetUserNickname || '用户' + dialogReport?.targetUserId }}</span></div>
            <div class="info-line"><span class="info-k">原因</span><span class="info-v">{{ dialogReport?.reason }}</span></div>
          </div>
          <label class="field-label">
            {{ dialogAction === 'resolved' ? '处理说明' : '驳回原因' }}
            <span class="field-req">*</span>
          </label>
          <textarea
            v-model="dialogInput"
            class="field-textarea"
            :placeholder="dialogAction === 'resolved' ? '请描述处理措施...' : '请说明驳回理由...'"
            rows="4"
            maxlength="500"
          ></textarea>
          <div class="field-count">{{ dialogInput.length }}/500</div>
        </div>
        <div class="modal-foot">
          <button @click="showActionDialog = false" class="btn-outline-sm">取消</button>
          <button
            @click="confirmAction"
            :class="['btn-sm', dialogAction === 'resolved' ? 'btn-primary-sm' : 'btn-danger-sm']"
            :disabled="!dialogInput.trim()"
          >{{ dialogAction === 'resolved' ? '确认处理' : '确认驳回' }}</button>
        </div>
      </div>
    </div>

    <!-- 批量弹窗 -->
    <div v-if="showBatchDialogFlag" class="modal-overlay" @click.self="showBatchDialogFlag = false">
      <div class="modal-box">
        <div class="modal-head">
          <h3>{{ batchAction === 'resolved' ? '批量处理' : '批量驳回' }} {{ selectedIds.length }} 条举报</h3>
          <button @click="showBatchDialogFlag = false" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="batch-tip">
            将统一{{ batchAction === 'resolved' ? '处理' : '驳回' }} <strong>{{ selectedIds.length }}</strong> 条待处理举报
          </div>
          <label class="field-label">
            {{ batchAction === 'resolved' ? '统一处理说明' : '统一驳回原因' }}
            <span class="field-req">*</span>
          </label>
          <textarea
            v-model="batchInput"
            class="field-textarea"
            :placeholder="batchAction === 'resolved' ? '批量处理的统一说明...' : '批量驳回的统一理由...'"
            rows="4"
            maxlength="500"
          ></textarea>
          <div class="field-count">{{ batchInput.length }}/500</div>
        </div>
        <div class="modal-foot">
          <button @click="showBatchDialogFlag = false" class="btn-outline-sm">取消</button>
          <button
            @click="confirmBatchAction"
            :class="['btn-sm', batchAction === 'resolved' ? 'btn-primary-sm' : 'btn-danger-sm']"
            :disabled="!batchInput.trim()"
          >确认{{ batchAction === 'resolved' ? '处理' : '驳回' }}</button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="showDetail" class="modal-overlay" @click.self="showDetail = false">
      <div class="modal-box modal-wide">
        <div class="modal-head">
          <h3>举报详情 #{{ currentReport.id }}</h3>
          <button @click="showDetail = false" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div class="dg-item"><span class="dg-k">举报人</span><span class="dg-v">{{ currentReport.reporterName }}</span><span class="dg-sub">ID: {{ currentReport.reporterId }}</span></div>
            <div class="dg-item"><span class="dg-k">被举报对象</span><span class="dg-v">{{ currentReport.targetUserNickname || '用户' + currentReport.targetUserId }}</span><span class="dg-sub">ID: {{ currentReport.targetUserId }}</span></div>
            <div class="dg-item"><span class="dg-k">举报类型</span><span class="tag tag-type">{{ currentReport.targetTypeName }}</span></div>
            <div class="dg-item"><span class="dg-k">举报原因</span><span class="tag tag-reason">{{ currentReport.reason }}</span></div>
            <div class="dg-item"><span class="dg-k">状态</span><span :class="['badge', 'badge-' + currentReport.status]">{{ statusText(currentReport.status) }}</span></div>
            <div class="dg-item"><span class="dg-k">目标ID</span><span class="dg-v">{{ currentReport.targetId }}</span></div>
            <div class="dg-item"><span class="dg-k">提交时间</span><span class="dg-v">{{ formatTime(currentReport.createTime) }}</span></div>
            <div class="dg-item"><span class="dg-k">处理时间</span><span class="dg-v">{{ currentReport.handleTime ? formatTime(currentReport.handleTime) : '-' }}</span></div>
            <div class="dg-item" v-if="currentReport.handlerName"><span class="dg-k">处理人</span><span class="dg-v">{{ currentReport.handlerName }}</span></div>
          </div>

          <div v-if="currentReport.status === 'resolved' && currentReport.handleResult" class="detail-block detail-ok">
            <div class="block-title">处理结果</div>
            <div class="block-text">{{ currentReport.handleResult }}</div>
          </div>
          <div v-if="currentReport.status === 'rejected' && currentReport.rejectReason" class="detail-block detail-no">
            <div class="block-title">驳回原因</div>
            <div class="block-text">{{ currentReport.rejectReason }}</div>
          </div>

          <div class="detail-block">
            <div class="block-title">被举报内容</div>
            <div class="block-text">{{ currentReport.targetContent }}</div>
          </div>

          <div class="detail-block" v-if="currentReport.images && currentReport.images.length > 0">
            <div class="block-title">举报截图 ({{ currentReport.images.length }})</div>
            <div class="img-row">
              <img
                v-for="(img, i) in currentReport.images"
                :key="i"
                :src="img"
                class="thumb"
                @error="$event.target.style.display='none'"
              />
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <template v-if="currentReport.status === 'pending'">
            <button @click="handleFromDetail('resolved')" class="btn-outline-primary-sm">处理</button>
            <button @click="handleFromDetail('rejected')" class="btn-outline-danger-sm">驳回</button>
          </template>
          <button @click="showDetail = false" class="btn-outline-sm">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { page, pageSize, total, totalPages, pageNumbers, formatTime, apiGet, apiPost, exportCSV, toast, confirm } = useAdmin()

const reportList = ref([])
const loading = ref(false)
const selectedIds = ref([])
const currentReport = ref(null)
const showDetail = ref(false)

const filters = reactive({
  keyword: '',
  status: '',
  reason: '',
  dateFrom: '',
  dateTo: ''
})

const stats = reactive({ total: 0, pending: 0, resolved: 0, rejected: 0, today: 0 })

const showActionDialog = ref(false)
const dialogAction = ref('')
const dialogReport = ref(null)
const dialogInput = ref('')

const showBatchDialogFlag = ref(false)
const batchAction = ref('')
const batchInput = ref('')

const allSelected = computed(() => {
  const pendingList = reportList.value.filter(r => r.status === 'pending')
  return pendingList.length > 0 && pendingList.every(r => selectedIds.value.includes(r.id))
})

const toggleAll = (e) => {
  if (e.target.checked) {
    reportList.value.filter(r => r.status === 'pending').forEach(r => {
      if (!selectedIds.value.includes(r.id)) selectedIds.value.push(r.id)
    })
  } else {
    selectedIds.value = []
  }
}

const toggleSelect = (id) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

const statusText = (s) => ({ pending: '待处理', resolved: '已处理', rejected: '已驳回' }[s] || s)

const formatDisplayTime = (ts) => {
  if (!ts) return '-'
  const d = new Date(ts)
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const hm = pad(d.getHours()) + ':' + pad(d.getMinutes())
  if (d.toDateString() === now.toDateString()) return '今天 ' + hm
  const yday = new Date(now); yday.setDate(yday.getDate() - 1)
  if (d.toDateString() === yday.toDateString()) return '昨天 ' + hm
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + hm
}

const loadStats = async () => {
  try {
    const res = await apiGet('/api/admin/reports/stats')
    if (res.code === 200) Object.assign(stats, res.data)
  } catch (e) { console.error('获取举报统计失败:', e) }
}

const buildParams = () => {
  const p = { page: page.value, pageSize: pageSize.value }
  if (filters.status !== '') p.status = filters.status
  if (filters.reason !== '') p.reason = filters.reason
  if (filters.keyword) p.keyword = filters.keyword
  if (filters.dateFrom) p.dateFrom = filters.dateFrom
  if (filters.dateTo) p.dateTo = filters.dateTo
  return p
}

const loadReports = async () => {
  loading.value = true
  try {
    const res = await apiGet('/api/admin/reports', buildParams())
    if (res.code === 200) {
      reportList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载举报记录失败:', err)
    toast('加载举报列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const searchReports = () => { page.value = 1; selectedIds.value = []; loadReports() }

const clearFilters = () => {
  Object.assign(filters, { keyword: '', status: '', reason: '', dateFrom: '', dateTo: '' })
  searchReports()
}

const viewReport = (report) => { currentReport.value = { ...report }; showDetail.value = true }

const handleAction = (report, action) => {
  dialogReport.value = report
  dialogAction.value = action
  dialogInput.value = ''
  showActionDialog.value = true
}

const handleFromDetail = (action) => { showDetail.value = false; handleAction(currentReport.value, action) }

const confirmAction = async () => {
  if (!dialogInput.value.trim()) return
  const report = dialogReport.value
  const action = dialogAction.value
  try {
    const body = { action }
    if (action === 'resolved') body.handleResult = dialogInput.value.trim()
    else body.rejectReason = dialogInput.value.trim()
    const res = await apiPost('/api/admin/reports/' + report.id + '/handle', body)
    if (res.code === 200) {
      toast(res.message || '操作成功')
      showActionDialog.value = false
      selectedIds.value = []
      loadStats(); loadReports()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('处理举报失败:', err)
    toast('操作失败', 'error')
  }
}

const showBatchDialog = (action) => { batchAction.value = action; batchInput.value = ''; showBatchDialogFlag.value = true }

const confirmBatchAction = async () => {
  if (!batchInput.value.trim()) return
  try {
    const body = { ids: [...selectedIds.value], action: batchAction.value }
    if (batchAction.value === 'resolved') body.handleResult = batchInput.value.trim()
    else body.rejectReason = batchInput.value.trim()
    const res = await apiPost('/api/admin/reports/batch-handle', body)
    if (res.code === 200) {
      toast(res.message)
      showBatchDialogFlag.value = false
      selectedIds.value = []
      loadStats(); loadReports()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('批量处理失败:', err)
    toast('操作失败', 'error')
  }
}

const batchDeleteRecords = async () => {
  const ok = await confirm(`确定要删除选中的 ${selectedIds.value.length} 条举报记录吗？此操作不可撤销。`, '批量删除确认')
  if (!ok) return
  try {
    const res = await apiPost('/api/admin/reports/batch-delete', { ids: [...selectedIds.value] })
    if (res.code === 200) {
      toast(res.message)
      selectedIds.value = []
      loadStats(); loadReports()
    } else {
      toast(res.message || '删除失败', 'error')
    }
  } catch (err) {
    console.error('批量删除失败:', err)
    toast('删除失败', 'error')
  }
}

const exportData = () => {
  exportCSV(reportList.value, [
    { label: 'ID', key: 'id' },
    { label: '举报人', key: row => row.reporterName || '用户' + row.reporterId },
    { label: '被举报对象', key: row => row.targetUserNickname || '用户' + row.targetUserId },
    { label: '举报类型', key: 'targetTypeName' },
    { label: '举报原因', key: 'reason' },
    { label: '被举报内容', key: 'targetContent' },
    { label: '状态', key: row => statusText(row.status) },
    { label: '处理说明', key: row => row.handleResult || row.rejectReason || '' },
    { label: '创建时间', key: row => formatTime(row.createTime) },
    { label: '处理时间', key: row => row.handleTime ? formatTime(row.handleTime) : '' }
  ], 'reports')
}

onMounted(() => { loadStats(); loadReports() })
</script>

<style scoped>
/* ========== 通用按钮 ========== */
.btn-outline-sm {
  padding: 7px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  color: #4b5563;
  transition: all .2s;
}
.btn-outline-sm:hover { border-color: #1677ff; color: #1677ff; }
.btn-primary-sm {
  padding: 7px 16px;
  border: 1px solid #1677ff;
  border-radius: 6px;
  background: #1677ff;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all .2s;
}
.btn-primary-sm:hover { background: #2563eb; border-color: #2563eb; }
.btn-danger-sm {
  padding: 7px 16px;
  border: 1px solid #ef4444;
  border-radius: 6px;
  background: #ef4444;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all .2s;
}
.btn-danger-sm:hover { background: #dc2626; border-color: #dc2626; }
.btn-outline-primary-sm {
  padding: 7px 16px;
  border: 1px solid #1677ff;
  border-radius: 6px;
  background: #fff;
  color: #1677ff;
  font-size: 13px;
  cursor: pointer;
  transition: all .2s;
}
.btn-outline-primary-sm:hover { background: #1677ff; color: #fff; }
.btn-outline-danger-sm {
  padding: 7px 16px;
  border: 1px solid #ef4444;
  border-radius: 6px;
  background: #fff;
  color: #ef4444;
  font-size: 13px;
  cursor: pointer;
  transition: all .2s;
}
.btn-outline-danger-sm:hover { background: #ef4444; color: #fff; }

/* ========== 统计卡片 ========== */
.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.stat-card {
  flex: 1 1 140px;
  min-width: 120px;
  padding: 18px 20px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  border-top: 2px solid #d9d9d9;
}
.stat-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
.stat-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 8px;
}
.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.1;
}
.stat-warn { border-top-color: #faad14; }
.stat-warn .stat-num { color: #d48806; }
.stat-ok { border-top-color: #52c41a; }
.stat-ok .stat-num { color: #389e0d; }
.stat-muted { border-top-color: #bfbfbf; }
.stat-muted .stat-num { color: #8c8c8c; }
.stat-info { border-top-color: #1677ff; }
.stat-info .stat-num { color: #1677ff; }

/* ========== 批量栏 ========== */
.batch-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #1d4ed8;
  flex-wrap: wrap;
  animation: fadeIn .2s;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
.batch-btn {
  padding: 5px 14px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  color: #fff;
  font-weight: 500;
  transition: all .15s;
}
.batch-ok { background: #22c55e; }
.batch-ok:hover { background: #16a34a; }
.batch-no { background: #ef4444; }
.batch-no:hover { background: #dc2626; }
.batch-del { background: #f59e0b; }
.batch-del:hover { background: #d97706; }
.batch-cancel {
  margin-left: auto;
  padding: 5px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  color: #6b7280;
  transition: all .15s;
}
.batch-cancel:hover { border-color: #1677ff; color: #1677ff; }

/* ========== 筛选栏 ========== */
.filter-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 16px;
}
.filter-input {
  flex: 1 1 220px;
  min-width: 180px;
  padding: 7px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color .2s;
}
.filter-input:focus { border-color: #1677ff; }
.filter-select {
  padding: 7px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: #fff;
  min-width: 100px;
  transition: border-color .2s;
}
.filter-select:focus { border-color: #1677ff; }
.filter-date {
  padding: 7px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  width: 130px;
  transition: border-color .2s;
}
.filter-date:focus { border-color: #1677ff; }
.filter-sep { font-size: 13px; color: #bfbfbf; }
.filter-divider { width: 1px; height: 22px; background: #f0f0f0; margin: 0 4px; }
.filter-spacer { margin-left: auto; }

/* ========== 表格 ========== */
.table-wrap {
  overflow-x: auto;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}
.r-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.r-table th {
  background: #f9fafb;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e8e8e8;
  white-space: nowrap;
  font-size: 12px;
}
.r-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}
.r-table tbody tr:hover { background: #f9fafb; }
.row-sel { background: #eff6ff !important; }
.row-sel:hover { background: #dbeafe !important; }

.w-check { width: 40px; text-align: center; }
.w-id { width: 50px; color: #d1d5db; font-family: monospace; font-size: 12px; }
.w-user { min-width: 100px; }
.w-cat { min-width: 130px; }
.w-status { width: 80px; }
.w-result { min-width: 140px; max-width: 200px; }
.w-time { width: 100px; font-size: 12px; color: #9ca3af; white-space: nowrap; }
.w-action { width: 150px; white-space: nowrap; }

.dot {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  margin-right: 5px;
  vertical-align: middle;
}
.dot-帖子 { background: #1677ff; }
.dot-用户 { background: #722ed1; }
.dot-评论 { background: #13c2c2; }

.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  margin-right: 4px;
}
.tag-type { background: #f3f4f6; color: #6b7280; }
.tag-reason { background: #fff7ed; color: #c2410c; }

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
}
.badge-pending { background: #fffbeb; color: #b45309; }
.badge-resolved { background: #f0fdf4; color: #15803d; }
.badge-rejected { background: #f9fafb; color: #6b7280; }

.result-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
  display: block;
  font-size: 12px;
  color: #333;
}
.result-no { color: #999; }
.result-empty { color: #ddd; }

.link-btn {
  padding: 4px 8px;
  border: none;
  background: none;
  font-size: 12px;
  cursor: pointer;
  color: #6b7280;
  margin-right: 2px;
  transition: all .15s;
  border-radius: 4px;
}
.link-btn:hover { color: #1677ff; background: #eff6ff; }
.link-ok { color: #15803d; }
.link-ok:hover { color: #16a34a; background: #f0fdf4; }
.link-no { color: #dc2626; }
.link-no:hover { color: #ef4444; background: #fef2f2; }

/* ========== 分页 ========== */
.pager {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  flex-wrap: wrap;
  gap: 10px;
}
.pager-left { display: flex; align-items: center; gap: 10px; }
.pager-right { display: flex; align-items: center; gap: 4px; }
.pager-size {
  padding: 5px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 12px;
  background: #fff;
  outline: none;
}
.pager-total { font-size: 12px; color: #9ca3af; }
.pager-btn {
  padding: 5px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  min-width: 32px;
  text-align: center;
  transition: all .15s;
  color: #4b5563;
}
.pager-btn:hover:not(:disabled) { border-color: #1677ff; color: #1677ff; }
.pager-btn:disabled { opacity: .4; cursor: not-allowed; color: #d1d5db; }
.pager-on { background: #1677ff; color: #fff; border-color: #1677ff; }
.pager-dots { padding: 5px 4px; font-size: 12px; color: #9ca3af; }

/* ========== 弹窗 ========== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn .15s;
}
.modal-box {
  background: #fff;
  border-radius: 12px;
  width: 480px;
  max-width: 95vw;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 8px 40px rgba(0,0,0,.2);
}
.modal-wide { width: 640px; }
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #f3f4f6;
}
.modal-head h3 { margin: 0; font-size: 15px; font-weight: 600; color: #111827; }
.modal-close {
  width: 28px; height: 28px;
  border: none; background: none;
  font-size: 20px; cursor: pointer;
  color: #9ca3af; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
}
.modal-close:hover { color: #374151; background: #f3f4f6; }
.modal-body { padding: 24px; }
.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
}

/* 处理/驳回弹窗 */
.modal-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 24px;
  padding: 14px 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 18px;
}
.info-line { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.info-k { color: #9ca3af; font-size: 12px; flex-shrink: 0; }
.info-v { font-weight: 500; color: #1f2937; }
.field-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; }
.field-req { color: #ef4444; }
.field-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  transition: border-color .2s;
}
.field-textarea:focus { border-color: #1677ff; box-shadow: 0 0 0 3px rgba(22,119,255,.08); }
.field-count { text-align: right; font-size: 12px; color: #d1d5db; margin-top: 6px; }
.batch-tip {
  padding: 12px 16px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  font-size: 13px;
  color: #92400e;
  margin-bottom: 18px;
}

/* 详情弹窗 */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px 20px;
  margin-bottom: 20px;
}
.dg-item { display: flex; flex-direction: column; gap: 4px; }
.dg-k { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.3px; }
.dg-v { font-size: 13px; font-weight: 500; color: #1f2937; }
.dg-sub { font-size: 11px; color: #d1d5db; }
.detail-block { margin-bottom: 18px; }
.block-title { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; }
.block-text {
  padding: 12px 14px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
}
.detail-ok .block-text { background: #f0fdf4; border-left: 3px solid #22c55e; }
.detail-no .block-text { background: #fef2f2; border-left: 3px solid #ef4444; }
.img-row { display: flex; gap: 8px; flex-wrap: wrap; }
.thumb {
  width: 80px; height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: transform .15s;
}
.thumb:hover { transform: scale(1.03); }

/* ========== 加载/空态 ========== */
.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 0;
  color: #999;
  gap: 10px;
  font-size: 13px;
}
.spinner {
  width: 28px; height: 28px;
  border: 3px solid #f0f0f0;
  border-top-color: #1677ff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-box {
  text-align: center;
  padding: 56px 0;
  color: #ccc;
  font-size: 14px;
}
</style>
