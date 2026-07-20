<template>
  <div>
    <div class="page-actions">
      <button class="btn-primary" @click="openCreate">+ 生成卡密</button>
      <span class="hint">生成后可复制卡号密码供用户充值</span>
    </div>
    <table class="data-table">
      <thead><tr><th>ID</th><th>卡号</th><th>面值</th><th>金币</th><th>状态</th><th>创建时间</th><th>使用时间</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="c in list" :key="c.id">
          <td>{{ c.id }}</td>
          <td class="mono">{{ c.cardNo || c.id }}</td>
          <td>¥{{ c.faceValue || 0 }}</td>
          <td>{{ c.coinAmount || 0 }}</td>
          <td><span :class="['status-tag', c.status === 0 ? 'active' : (c.status === 1 ? 'disabled' : 'expired')]">{{ cardStatusText(c.status) }}</span></td>
          <td>{{ formatTime(c.createTime) }}</td>
          <td>{{ c.useTime ? formatTime(c.useTime) : '-' }}</td>
          <td>
            <button class="btn-sm" @click="copyCard(c)" v-if="c.status === 0">复制</button>
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

    <div class="modal-overlay" v-if="showModal">
      <div class="modal">
        <h3>生成卡密</h3>
        <div class="form-grid">
          <label>面值(元): <input v-model.number="form.faceValue" type="number" /></label>
          <label>金币数: <input v-model.number="form.coinAmount" type="number" /></label>
          <label>生成数量: <input v-model.number="form.count" type="number" /></label>
        </div>
        <div class="modal-actions">
          <button class="btn-primary" @click="generate">生成</button>
          <button @click="showModal = false">取消</button>
        </div>
        <div class="generated-list" v-if="generatedCards.length">
          <h4>已生成卡密 (请保存):</h4>
          <div class="card-list">
            <div v-for="(c, idx) in generatedCards" :key="idx" class="generated-item">
              <span>卡号: {{ c.cardNo }}</span>
              <span>密码: {{ c.cardPwd }}</span>
            </div>
          </div>
          <button class="btn-primary" @click="copyAll">一键复制</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi'
const { page, pageSize, total, totalPages, formatTime, getHost, getHeaders } = useAdminApi()
const list = ref([])
const showModal = ref(false)
const form = ref({ faceValue: 100, coinAmount: 100, count: 1 })
const generatedCards = ref([])

const cardStatusText = (s) => ({ 0: '未使用', 1: '已使用', 2: '已过期' }[s] || '未知')

const loadList = async () => {
  try {
    const res = await fetch(`${getHost()}/api/admin/cards?page=${page.value}&pageSize=${pageSize.value}`, { headers: getHeaders() })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) { list.value = result.data.list || result.data || []; total.value = result.data.pagination?.total || list.value.length }
  } catch (e) { console.error(e) }
}

const openCreate = () => { form.value = { faceValue: 100, coinAmount: 100, count: 1 }; generatedCards.value = []; showModal.value = true }

const generate = async () => {
  try {
    const res = await fetch(`${getHost()}/api/admin/cards`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ faceValue: form.value.faceValue, coinAmount: form.value.coinAmount || form.value.faceValue, count: form.value.count || 1 })
    })
    const result = await res.json()
    if (result.code === 200 || result.code === 0) {
      generatedCards.value = result.data.list || result.data || []
      alert('生成成功')
      loadList()
    } else { alert(result.message || '生成失败') }
  } catch (e) { console.error(e) }
}

const copyCard = (c) => {
  const text = `卡号: ${c.cardNo}\n密码: ${c.cardPwd}`
  navigator.clipboard?.writeText(text).then(() => alert('已复制')).catch(() => alert(text))
}

const copyAll = () => {
  const text = generatedCards.value.map(c => `卡号: ${c.cardNo}  密码: ${c.cardPwd}`).join('\n')
  navigator.clipboard?.writeText(text).then(() => alert('已全部复制')).catch(() => alert(text))
}

const remove = async (c) => { if (!confirm('确定删除该卡密?')) return; try { await fetch(`${getHost()}/api/admin/cards/${c.id}`, { method: 'DELETE', headers: { Authorization: getHeaders().Authorization } }); loadList() } catch (e) { console.error(e) } }

onMounted(loadList)
</script>

<style scoped>
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; }
.btn-primary { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
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
.modal h3 { margin-bottom: 16px; }
.form-grid { display: grid; gap: 12px; }
.form-grid label { display: flex; flex-direction: column; font-size: 13px; color: #666; gap: 4px; }
.form-grid input { padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; }
.modal-actions { margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end; }
.modal-actions button { padding: 8px 20px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.generated-list { margin-top: 20px; border-top: 1px solid #f0f0f0; padding-top: 16px; }
.generated-list h4 { font-size: 14px; color: #333; margin-bottom: 12px; }
.card-list { max-height: 200px; overflow-y: auto; margin-bottom: 12px; }
.generated-item { display: flex; gap: 12px; padding: 6px 0; font-family: monospace; font-size: 13px; border-bottom: 1px dashed #f0f0f0; }
</style>
