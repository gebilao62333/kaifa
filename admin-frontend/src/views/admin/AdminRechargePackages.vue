<template>
  <div>
    <div class="page-actions">
      <button class="btn-primary" @click="openCreate">+ 新增档位</button>
    </div>
    <div v-if="rechargeLoading" class="loading-wrap"><div class="spinner"></div><span>加载中...</span></div>
    <table class="data-table" v-else>
      <thead><tr><th>ID</th><th>名称</th><th>充值金额</th><th>金币数</th><th>赠送金币</th><th>合计</th><th>热门</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="rp in rechargeList" :key="rp.id">
          <td>{{ rp.id }}</td>
          <td>{{ rp.name }}</td>
          <td>¥{{ rp.price }}</td>
          <td>{{ rp.coins }}</td>
          <td>{{ rp.bonusCoins }}</td>
          <td>{{ rp.totalCoins }}</td>
          <td>{{ rp.hot ? '🔥' : '-' }}</td>
          <td><span :class="['status-tag', rp.status === 1 ? 'active' : 'disabled']">{{ rp.status === 1 ? '启用' : '禁用' }}</span></td>
          <td>
            <button class="btn-sm" @click="openEdit(rp)">编辑</button>
            <button class="btn-sm warn" @click="toggle(rp)">{{ rp.status === 1 ? '禁用' : '启用' }}</button>
            <button class="btn-sm danger" @click="remove(rp)">删除</button>
          </td>
        </tr>
        <tr v-if="!rechargeList.length">
          <td colspan="9" class="empty-cell">暂无充值档位，点击上方"新增档位"创建</td>
        </tr>
      </tbody>
    </table>

    <div class="modal-overlay" v-if="showForm">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑档位' : '新增档位' }}</h3>
          <button class="modal-close" @click="showForm = false">&times;</button>
        </div>
        <div class="form-grid">
          <label>名称: <input v-model="form.name" /></label>
          <label>充值金额: <input v-model.number="form.price" type="number" step="0.01" /></label>
          <label>金币数: <input v-model.number="form.coins" type="number" /></label>
          <label>赠送金币: <input v-model.number="form.bonusCoins" type="number" /></label>
          <label>热门: <select v-model.number="form.hot"><option :value="1">是</option><option :value="0">否</option></select></label>
          <label>排序: <input v-model.number="form.sort" type="number" /></label>
          <label>状态: <select v-model.number="form.status"><option :value="1">启用</option><option :value="0">禁用</option></select></label>
        </div>
        <div class="modal-actions">
          <button class="btn-primary" @click="save">保存</button>
          <button @click="showForm = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import adminService from '../../services/adminService'
import { useToast } from '../../composables/useToast'
const toast = useToast()
const rechargeLoading = ref(false)
const rechargeList = ref([])
const showForm = ref(false)
const isEdit = ref(false)
const form = ref({ id: '', name: '', price: 0, coins: 0, bonusCoins: 0, hot: 0, sort: 0, status: 1 })

const loadList = async () => {
  rechargeLoading.value = true
  try {
    const res = await adminService.getRechargePackages({ page: 1, pageSize: 100 })
    if (res.code === 200 || res.code === 0) { rechargeList.value = res.data.list || res.data || [] }
    else { toast.error(res.message || '加载失败') }
  } catch (e) { toast.error('加载失败: ' + (e.message || '网络错误')) }
  finally { rechargeLoading.value = false }
}
const openCreate = () => { isEdit.value = false; form.value = { id: '', name: '', price: 0, coins: 0, bonusCoins: 0, hot: 0, sort: 0, status: 1 }; showForm.value = true }
const openEdit = (p) => { isEdit.value = true; form.value = { id: p.id, name: p.name, price: p.price, coins: p.coins, bonusCoins: p.bonusCoins, hot: p.hot || 0, sort: p.sort || 0, status: p.status }; showForm.value = true }
const save = async () => {
  if (!form.value.name || form.value.price === 0) { toast.error('请填写名称和充值金额'); return }
  try {
    const res = isEdit.value ? await adminService.updateRechargePackage(form.value.id, form.value) : await adminService.createRechargePackage(form.value)
    if (res.code === 200 || res.code === 0) { toast.success('保存成功'); showForm.value = false; loadList() } else { toast.error(res.message || '保存失败') }
  } catch (e) { toast.error('保存失败: ' + (e.message || '网络错误')) }
}
const toggle = async (p) => { try { await adminService.updateRechargePackageStatus(p.id, p.status === 1 ? 0 : 1); toast.success(p.status === 1 ? '已禁用' : '已启用'); loadList() } catch (e) { toast.error('操作失败: ' + (e.message || '网络错误')) } }
const remove = async (p) => { if (!confirm(`确定删除 ${p.name}?`)) return; try { await adminService.deleteRechargePackage(p.id); toast.success('已删除'); loadList() } catch (e) { toast.error('删除失败: ' + (e.message || '网络错误')) } }
onMounted(loadList)
</script>

<style scoped>
.loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: #999; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #f0f0f0; border-top-color: #1890ff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; }
.btn-primary { padding: 8px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.data-table th { text-align: left; padding: 12px; background: #fafafa; color: #666; font-size: 13px; font-weight: 600; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.empty-cell { text-align: center; color: #999; padding: 24px; }
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-tag.active { background: #f6ffed; color: #52c41a; }
.status-tag.disabled { background: #fff1f0; color: #ff4d4f; }
.btn-sm { padding: 4px 10px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px; margin-right: 4px; }
.btn-sm.warn { color: #fa8c16; border-color: #fa8c16; }
.btn-sm.danger { color: #ff4d4f; border-color: #ff4d4f; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { background: #fff; border-radius: 8px; padding: 24px; width: 480px; max-height: 80vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.modal-header h3 { margin: 0; }
.modal-close { width: 28px; height: 28px; border: none; background: transparent; font-size: 22px; color: #999; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 4px; line-height: 1; }
.modal-close:hover { color: #333; background: #f5f5f5; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-grid label { display: flex; flex-direction: column; font-size: 13px; color: #666; gap: 4px; }
.form-grid input, .form-grid select { padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; }
.modal-actions { margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end; }
.modal-actions button { padding: 8px 20px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.modal-actions .btn-primary { background: #1890ff; color: #fff; border: none; }
</style>
