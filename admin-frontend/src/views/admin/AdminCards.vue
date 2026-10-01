<template>
  <div>
    <div class="page-actions">
      <button class="btn-primary" @click="openCreate">+ 生成卡密</button>
      <button class="btn-danger" @click="openClear">清除卡密</button>
      <span class="hint">生成后可复制25位密钥供用户充值</span>
    </div>
    <div class="stats-section">
      <div class="stats-title">密卡管理员<span class="hint">（仅显示有密卡的管理员，点击名称可展开密卡类型详情）</span><button class="btn-sm" @click="exportAll" style="float: right;">导出全部CSV</button></div>
      <div v-if="statsLoading" class="loading-wrap"><div class="spinner"></div><span>加载中...</span></div>
      <div v-else-if="!statsList.length" class="empty-cell">暂无有密卡的管理员</div>
      <div v-else class="stats-list">
        <div v-for="a in statsList" :key="a.adminId" class="stats-item">
          <div class="stats-head" @click="a.expanded = !a.expanded">
            <span class="stats-name">{{ a.username || a.adminName || ('管理员#' + a.adminId) }}<template v-if="a.username && a.nickname">（{{ a.nickname }}）</template></span>
            <span class="stats-badges">
              <span class="badge">共 {{ a.total }} 张</span>
              <span class="badge ok">未用 {{ a.unused }}</span>
              <span class="badge gray">已用 {{ a.used }}</span>
              <span class="badge red">过期 {{ a.expired }}</span>
            </span>
            <span class="stats-arrow">{{ a.expanded ? '▾' : '▸' }}</span>
          </div>
          <div v-if="a.expanded" class="stats-detail">
            <div class="stats-detail-head">
              <span>{{ a.username || a.adminName || ('管理员#' + a.adminId) }} 密卡类型明细</span>
              <button class="btn-sm" @click="exportAdmin(a)">导出CSV</button>
            </div>
            <table class="data-table">
              <thead><tr><th>面值</th><th>金币数</th><th>总数</th><th>未使用</th><th>已使用</th><th>已过期</th></tr></thead>
              <tbody>
                <tr v-for="(t, i) in a.types" :key="i">
                  <td>¥{{ t.faceValue }}</td>
                  <td>{{ t.coinAmount }}</td>
                  <td>{{ t.total }}</td>
                  <td>{{ t.unused }}</td>
                  <td>{{ t.used }}</td>
                  <td>{{ t.expired }}</td>
                </tr>
                <tr v-if="!a.types.length"><td colspan="6" class="empty-cell">暂无类型明细</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div v-if="loading" class="loading-wrap"><div class="spinner"></div><span>加载中...</span></div>
    <table class="data-table" v-else>
      <thead><tr><th>ID</th><th>密钥</th><th>面值</th><th>金币</th><th>状态</th><th>管理员</th><th>创建时间</th><th>使用时间</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="c in list" :key="c.id">
          <td>{{ c.id }}</td>
          <td class="mono">{{ c.cardKey || '' }}</td>
          <td>¥{{ c.faceValue || 0 }}</td>
          <td>{{ c.coinAmount || 0 }}</td>
          <td><span :class="['status-tag', c.status === 0 ? 'active' : (c.status === 1 ? 'disabled' : 'expired')]">{{ cardStatusText(c.status) }}</span></td>
          <td>{{ c.adminName || '-' }}</td>
          <td>{{ formatTime(c.createTime) }}</td>
          <td>{{ c.useTime ? formatTime(c.useTime) : '-' }}</td>
          <td>
            <button class="btn-sm" @click="copyCard(c)" v-if="c.status === 0">复制密钥</button>
            <button class="btn-sm danger" @click="remove(c)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <button :disabled="page <= 1" @click="page--; loadList()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页 (共 {{ total }} 条)</span>
      <button :disabled="page >= totalPages" @click="page++; loadList()">下一页</button>
    </div>

    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>生成卡密</h3>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>
        <div class="form-grid">
          <label>充值档位:
            <select v-model.number="form.packageId" @change="onSelectPackage">
              <option :value="0">不指定（手动填写）</option>
              <option v-for="p in rechargePackages" :key="p.id" :value="p.id">{{ p.name }}（¥{{ p.price }} / {{ p.totalCoins }}金币）</option>
            </select>
          </label>
          <label>面值(元): <input v-model.number="form.faceValue" type="number" /></label>
          <label>金币数: <input v-model.number="form.coinAmount" type="number" /></label>
          <label>生成数量: <input v-model.number="form.count" type="number" /></label>
          <label>负责管理员:
            <select v-model.number="form.adminId">
              <option :value="0">不指定</option>
              <option v-for="a in adminOptions" :key="a.id" :value="a.id">{{ a.name }} ({{ a.username }})</option>
            </select>
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn-primary" @click="generate">生成</button>
          <button @click="showModal = false">取消</button>
        </div>
        <div class="generated-list" v-if="generatedCards.length">
          <h4>已生成卡密 (请保存密钥):</h4>
          <div class="card-list">
            <div v-for="(c, idx) in generatedCards" :key="idx" class="generated-item">
              <span>密钥: {{ c.cardKey }}</span>
            </div>
          </div>
          <button class="btn-primary" @click="copyAll">一键复制密钥</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showClearModal" @click.self="showClearModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>清除卡密</h3>
          <button class="modal-close" @click="showClearModal = false">&times;</button>
        </div>
        <div class="form-grid">
          <label>清除范围:
            <select v-model.number="clearForm.status">
              <option :value="-1">全部卡密</option>
              <option :value="0">仅未使用</option>
              <option :value="1">仅已使用</option>
              <option :value="2">仅已过期</option>
            </select>
          </label>
          <label>负责管理员:
            <select v-model.number="clearForm.adminId">
              <option :value="0">全部管理员</option>
              <option v-for="a in adminOptions" :key="a.id" :value="a.id">{{ a.name }} ({{ a.username }})</option>
            </select>
          </label>
        </div>
        <div class="clear-tip">清除后不可恢复，请谨慎操作！</div>
        <div class="modal-actions">
          <button class="btn-danger" :disabled="clearLoading" @click="doClear">{{ clearLoading ? '清除中...' : '确认清除' }}</button>
          <button @click="showClearModal = false">取消</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showConfirm" @click.self="closeConfirm">
      <div class="modal">
        <div class="modal-header">
          <h3>确认操作</h3>
          <button class="modal-close" @click="closeConfirm">&times;</button>
        </div>
        <div class="confirm-body">{{ confirmText }}</div>
        <div class="modal-actions">
          <button class="btn-danger" @click="confirmYes">确认</button>
          <button @click="closeConfirm">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi'
import { useToast } from '../../composables/useToast'
const { page, pageSize, total, totalPages, formatTime, getHost, getHeaders } = useAdminApi()
const toast = useToast()
const list = ref([])
const loading = ref(false)
const showModal = ref(false)
const form = ref({ packageId: 0, faceValue: 100, coinAmount: 100, count: 1, adminId: 0 })
const generatedCards = ref([])
const adminOptions = ref([])
const rechargePackages = ref([])
const statsLoading = ref(false)
const statsList = ref([])
const showClearModal = ref(false)
const clearForm = ref({ status: -1, adminId: 0 })
const clearLoading = ref(false)
const showConfirm = ref(false)
const confirmText = ref('')
let confirmYesFn = null
const askConfirm = (text, fn) => {
  confirmText.value = text
  confirmYesFn = fn
  showConfirm.value = true
}
const closeConfirm = () => { showConfirm.value = false; confirmYesFn = null }
const confirmYes = () => {
  const fn = confirmYesFn
  closeConfirm()
  if (fn) fn()
}

const cardStatusText = (s) => ({ 0: '未使用', 1: '已使用', 2: '已过期' }[s] || '未知')

const loadAdminOptions = async () => {
  try {
    const res = await fetch(`${getHost()}/api/admin/card-admins`, { headers: getHeaders() })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) adminOptions.value = result.data.list || result.data || []
  } catch (e) { /* 静默失败，下拉为空不影响使用 */ }
}

const loadRechargePackages = async () => {
  try {
    const res = await fetch(`${getHost()}/api/admin/recharge-packages?page=1&pageSize=100`, { headers: getHeaders() })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      rechargePackages.value = (result.data.list || result.data || []).filter(p => p.status === 1)
    }
  } catch (e) { /* 静默失败，下拉为空不影响使用 */ }
}

const onSelectPackage = () => {
  const pkg = rechargePackages.value.find(p => p.id === form.value.packageId)
  if (pkg) {
    form.value.faceValue = pkg.price
    form.value.coinAmount = pkg.totalCoins || pkg.coins || 0
  }
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await fetch(`${getHost()}/api/admin/cards?page=${page.value}&pageSize=${pageSize.value}`, { headers: getHeaders() })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) { list.value = result.data.list || result.data || []; total.value = result.data.pagination?.total || list.value.length }
  } catch (e) { toast.error('加载失败: ' + (e.message || '网络错误')) }
  finally { loading.value = false }
}

const openCreate = () => { form.value = { packageId: 0, faceValue: 100, coinAmount: 100, count: 1, adminId: 0 }; generatedCards.value = []; showModal.value = true; loadAdminOptions(); loadRechargePackages() }

const generate = async () => {
  try {
    const selAdmin = adminOptions.value.find(a => a.id === form.value.adminId)
    const res = await fetch(`${getHost()}/api/admin/cards`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ faceValue: form.value.faceValue, coinAmount: form.value.coinAmount || form.value.faceValue, count: form.value.count || 1, adminId: form.value.adminId || 0, adminName: selAdmin ? selAdmin.name : '' })
    })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      generatedCards.value = result.data.list || result.data || []
      toast.success('生成成功')
      loadList()
    } else { toast.error(result.message || '生成失败') }
  } catch (e) { toast.error('生成失败: ' + (e.message || '网络错误')) }
}

const copyCard = (c) => {
  const text = c.cardKey || ''
  navigator.clipboard?.writeText(text).then(() => toast.success('密钥已复制')).catch(() => toast.info(text))
}

const copyAll = () => {
  const text = generatedCards.value.map(c => c.cardKey).join('\n')
  navigator.clipboard?.writeText(text).then(() => toast.success('密钥已全部复制')).catch(() => toast.info(text))
}

const fetchStats = async () => {
  statsLoading.value = true
  try {
    const res = await fetch(`${getHost()}/api/admin/card-admin-stats`, { headers: getHeaders() })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      statsList.value = (result.data.list || result.data || []).map(a => ({ ...a, expanded: false }))
    } else { toast.error(result.message || '加载失败') }
  } catch (e) { toast.error('加载失败: ' + (e.message || '网络错误')) }
  finally { statsLoading.value = false }
}

const remove = (c) => {
  askConfirm('确定删除该卡密?', async () => {
    try {
      const res = await fetch(`${getHost()}/api/admin/cards/${c.id}`, { method: 'DELETE', headers: getHeaders() })
      const result = await res.json().catch(() => ({}))
      if (result.code === 200 || result.code === 0) {
        toast.success('卡密已删除')
        loadList(); fetchStats()
      } else {
        toast.error(result.message || ('删除失败（' + res.status + '）'))
      }
    } catch (e) { toast.error('删除失败: ' + (e.message || '网络错误')) }
  })
}

const openClear = () => {
  clearForm.value = { status: -1, adminId: 0 }
  showClearModal.value = true
  loadAdminOptions()
}

const doClear = () => {
  const scopeText = { '-1': '全部', '0': '未使用', '1': '已使用', '2': '已过期' }[clearForm.value.status]
  const admin = adminOptions.value.find(a => a.id === clearForm.value.adminId)
  const scope = (scopeText || '全部') + (admin ? '（' + admin.name + '）' : '')
  askConfirm(`确定清除${scope}卡密？此操作不可恢复！`, () => doClearExec())
}

const doClearExec = async () => {
  clearLoading.value = true
  try {
    const res = await fetch(`${getHost()}/api/admin/cards/clear`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ status: clearForm.value.status, adminId: clearForm.value.adminId || 0 })
    })
    const result = await res.json().catch(() => ({}))
    if (result.code === 200 || result.code === 0) {
      toast.success(result.message || '清除成功')
      showClearModal.value = false
      loadList(); fetchStats()
    } else {
      toast.error(result.message || ('清除失败（' + res.status + '）'))
    }
  } catch (e) { toast.error('清除失败: ' + (e.message || '网络错误')) }
  finally { clearLoading.value = false }
}

const toCSV = (headers, rows) => {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  return '\uFEFF' + [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\r\n')
}
const downloadCSV = (filename, content) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
const adminLabel = (a) => a.username ? (a.username + (a.nickname ? '（' + a.nickname + '）' : '')) : (a.adminName || ('管理员#' + a.adminId))
const exportRows = (a) => (a.types || []).map(t => [adminLabel(a), a.adminId, t.faceValue, t.coinAmount, t.total, t.unused, t.used, t.expired])
const exportAdmin = (a) => {
  if (!a.types.length) return toast.info('该管理员暂无类型明细')
  downloadCSV(`密卡明细_${adminLabel(a)}.csv`, toCSV(['管理员', '管理员ID', '面值', '金币数', '总数', '未使用', '已使用', '已过期'], exportRows(a)))
  toast.success('导出成功')
}
const exportAll = () => {
  const rows = statsList.value.flatMap(exportRows)
  if (!rows.length) return toast.info('暂无可导出的数据')
  downloadCSV(`密卡管理员统计_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`, toCSV(['管理员', '管理员ID', '面值', '金币数', '总数', '未使用', '已使用', '已过期'], rows))
  toast.success('导出成功')
}

onMounted(() => { loadList(); fetchStats() })
</script>

<style scoped>
.loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: #999; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #f0f0f0; border-top-color: #1890ff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; }
.btn-primary { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.btn-danger { padding: 8px 16px; background: #ff4d4f; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }
.clear-tip { margin-top: 12px; font-size: 13px; color: #ff4d4f; }
.confirm-body { padding: 8px 4px 4px; color: #333; font-size: 14px; line-height: 1.6; }
.hint { font-size: 13px; color: #999; }
.mono { font-family: monospace; font-size: 13px; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.data-table th { text-align: left; padding: 12px; background: #fafafa; color: #666; font-size: 13px; font-weight: 600; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-tag.active { background: #f6ffed; color: #52c41a; }
.status-tag.disabled { background: #f0f0f0; color: #999; }
.status-tag.expired { background: #fff1f0; color: #ff4d4f; }
.btn-sm { padding: 4px 10px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px; margin-right: 4px; }
.btn-sm.danger { color: #ff4d4f; border-color: #ff4d4f; }
.pagination { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 16px; font-size: 13px; color: #666; }
.pagination button { padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { background: #fff; border-radius: 8px; padding: 24px; width: 520px; max-height: 80vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.modal-header h3 { margin: 0; }
.modal-close { width: 28px; height: 28px; border: none; background: transparent; font-size: 22px; color: #999; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 4px; line-height: 1; }
.modal-close:hover { color: #333; background: #f5f5f5; }
.form-grid { display: grid; gap: 12px; }
.form-grid label { display: flex; flex-direction: column; font-size: 13px; color: #666; gap: 4px; }
.form-grid input, .form-grid select { padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; }
.modal-actions { margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end; }
.modal-actions button { padding: 8px 20px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.modal-actions .btn-primary { background: #1890ff; color: #fff; border: none; }
.modal-actions .btn-danger { background: #ff4d4f; color: #fff; border: none; }
.modal-actions .btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }
.generated-list { margin-top: 20px; border-top: 1px solid #f0f0f0; padding-top: 16px; }
.generated-list h4 { font-size: 14px; color: #333; margin-bottom: 12px; }
.card-list { max-height: 200px; overflow-y: auto; margin-bottom: 12px; }
.generated-item { display: flex; gap: 12px; padding: 6px 0; font-family: monospace; font-size: 13px; border-bottom: 1px dashed #f0f0f0; }
.empty-cell { text-align: center; padding: 24px; color: #999; font-size: 13px; }
.stats-section { background: #fff; border: 1px solid #f0f0f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.stats-title { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 12px; }
.stats-title .hint { font-weight: 400; margin-left: 8px; }
.stats-list { display: flex; flex-direction: column; gap: 8px; }
.stats-item { border: 1px solid #f0f0f0; border-radius: 6px; overflow: hidden; }
.stats-head { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; transition: background 0.2s ease; }
.stats-head:hover { background: #f5f8ff; }
.stats-name { flex: 1; font-weight: 600; color: #333; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stats-badges { display: flex; gap: 6px; flex-shrink: 0; }
.badge { padding: 2px 8px; border-radius: 10px; font-size: 12px; background: #f0f0f0; color: #666; white-space: nowrap; }
.badge.ok { background: #f6ffed; color: #52c41a; }
.badge.gray { background: #f0f0f0; color: #999; }
.badge.red { background: #fff1f0; color: #ff4d4f; }
.stats-arrow { flex-shrink: 0; color: #999; font-size: 12px; }
.stats-detail { border-top: 1px dashed #e8e8e8; padding: 12px; background: #fafbfc; }
.stats-detail .data-table { box-shadow: none; }
.stats-detail-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #666; font-weight: 600; }
</style>
