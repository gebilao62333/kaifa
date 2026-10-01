<template>
  <div class="page-container">
    <h2>开屏 & 轮播管理</h2>

    <div class="tab-bar">
      <button :class="['tab-btn', { active: activeTab === 'splash' }]" @click="activeTab = 'splash'">开屏弹窗</button>
      <button :class="['tab-btn', { active: activeTab === 'carousel' }]" @click="activeTab = 'carousel'">轮播展示</button>
    </div>

    <!-- ======================== 开屏弹窗 ======================== -->
    <section v-if="activeTab === 'splash'">
      <div class="toolbar">
        <button class="btn-primary" @click="openSplashModal()">+ 新增开屏弹窗</button>
      </div>

      <table class="data-table" v-if="splashList.length">
        <thead>
          <tr><th>ID</th><th>标题</th><th>图片</th><th>频率</th><th>有效期</th><th>排序</th><th>状态</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="s in splashList" :key="s.id">
            <td>{{ s.id }}</td>
            <td>{{ s.title }}</td>
            <td><img :src="s.image" class="thumb" @error="e => e.target.style.display='none'" /></td>
            <td>{{ freqLabel(s.frequency) }}</td>
            <td>{{ timeLabel(s) }}</td>
            <td>{{ s.sort }}</td>
            <td>
              <select :value="s.status" @change="toggleSplash(s, $event.target.value)">
                <option :value="1">启用</option><option :value="0">禁用</option>
              </select>
            </td>
            <td class="actions">
              <button class="btn-edit" @click="openSplashModal(s)">修改</button>
              <button class="btn-del" @click="deleteSplash(s.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">暂无开屏弹窗数据</div>

      <!-- 开屏弹窗弹窗 -->
      <div class="modal-overlay" v-if="splashModal">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ splashEdit ? '修改开屏弹窗' : '新增开屏弹窗' }}</h3>
            <button class="modal-close" @click="splashModal = false">&times;</button>
          </div>
          <div class="form-grid">
            <label>标题: <input v-model="splashForm.title" placeholder="弹窗标题（可选）" /></label>
            <div class="image-upload-group">
              <label>图片URL: <input v-model="splashForm.image" placeholder="输入URL或点击下方上传" /></label>
              <div class="upload-row">
                <input type="file" accept="image/*" @change="handleSplashUpload" :disabled="splashUploading" />
                <span v-if="splashUploading" class="upload-progress">上传中...</span>
              </div>
              <img v-if="splashForm.image" :src="splashForm.image" class="image-preview" />
            </div>
            <label>跳转链接: <input v-model="splashForm.link" placeholder="点击弹窗跳转地址（可选）" /></label>
            <label>展示频率:
              <select v-model.number="splashForm.frequency">
                <option :value="1">每次打开</option>
                <option :value="2">每天一次</option>
                <option :value="3">每周一次</option>
                <option :value="4">仅一次</option>
              </select>
            </label>
            <label>开始时间: <input type="datetime-local" :value="splashForm._startLocal" @change="splashForm._startLocal = $event.target.value; updateSplashTime()" /></label>
            <label>结束时间: <input type="datetime-local" :value="splashForm._endLocal" @change="splashForm._endLocal = $event.target.value; updateSplashTime()" /></label>
            <label>排序: <input v-model.number="splashForm.sort" type="number" /></label>
            <label>状态:
              <select v-model.number="splashForm.status">
                <option :value="1">启用</option><option :value="0">禁用</option>
              </select>
            </label>
          </div>
          <div class="modal-actions">
            <button @click="splashModal = false">取消</button>
            <button class="btn-primary" @click="saveSplash">保存</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================== 轮播展示（Banner） ======================== -->
    <section v-if="activeTab === 'carousel'">
      <div class="toolbar">
        <button class="btn-primary" @click="openCarouselModal()">+ 新增轮播图</button>
      </div>

      <table class="data-table" v-if="carouselList.length">
        <thead>
          <tr><th>ID</th><th>标题</th><th>图片</th><th>链接</th><th>排序</th><th>状态</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="c in carouselList" :key="c.id">
            <td>{{ c.id }}</td>
            <td>{{ c.title }}</td>
            <td><img :src="c.image" class="thumb" @error="e => e.target.style.display='none'" /></td>
            <td>{{ c.link }}</td>
            <td>{{ c.sort }}</td>
            <td>
              <select :value="c.status" @change="toggleCarousel(c, $event.target.value)">
                <option :value="1">启用</option><option :value="0">禁用</option>
              </select>
            </td>
            <td class="actions">
              <button class="btn-edit" @click="openCarouselModal(c)">修改</button>
              <button class="btn-del" @click="deleteCarousel(c.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">暂无轮播图数据</div>

      <!-- 轮播图弹窗 -->
      <div class="modal-overlay" v-if="carouselModal">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ carouselEdit ? '修改轮播图' : '新增轮播图' }}</h3>
            <button class="modal-close" @click="carouselModal = false">&times;</button>
          </div>
          <div class="form-grid">
            <label>标题: <input v-model="carouselForm.title" placeholder="轮播图标题（可选）" /></label>
            <div class="image-upload-group">
              <label>图片URL: <input v-model="carouselForm.image" placeholder="输入URL或点击下方上传" /></label>
              <div class="upload-row">
                <input type="file" accept="image/*" @change="handleCarouselUpload" :disabled="carouselUploading" />
                <span v-if="carouselUploading" class="upload-progress">上传中...</span>
              </div>
              <img v-if="carouselForm.image" :src="carouselForm.image" class="image-preview" />
            </div>
            <label>跳转链接: <input v-model="carouselForm.link" placeholder="点击跳转地址（可选）" /></label>
            <label>排序: <input v-model.number="carouselForm.sort" type="number" /></label>
            <label>状态:
              <select v-model.number="carouselForm.status">
                <option :value="1">启用</option><option :value="0">禁用</option>
              </select>
            </label>
          </div>
          <div class="modal-actions">
            <button @click="carouselModal = false">取消</button>
            <button class="btn-primary" @click="saveCarousel">保存</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import adminService from '../../services/adminService'
import { useAdminApi } from '../../composables/useAdminApi'
import { useToast } from '../../composables/useToast'
const { getHost, getHeaders } = useAdminApi()
const toast = useToast()

const activeTab = ref('splash')

// ==================== 开屏弹窗 ====================
const splashList = ref([])
const splashModal = ref(false)
const splashEdit = ref(null)
const splashUploading = ref(false)
const splashForm = ref({ title: '', image: '', link: '', frequency: 1, sort: 0, status: 1, _startLocal: '', _endLocal: '' })

const freqLabel = (f) => ({ 1: '每次打开', 2: '每天一次', 3: '每周一次', 4: '仅一次' }[f] || '未知')

const timeLabel = (s) => {
  const parts = []
  if (s.start_time) parts.push('从 ' + new Date(s.start_time * 1000).toLocaleDateString())
  if (s.end_time) parts.push('到 ' + new Date(s.end_time * 1000).toLocaleDateString())
  return parts.length ? parts.join(' ') : '不限'
}

const toLocal = (ts) => ts ? new Date(ts * 1000).toISOString().slice(0, 16) : ''
const toUnix = (s) => s ? Math.floor(new Date(s).getTime() / 1000) : 0

const updateSplashTime = () => {
  splashForm.value.start_time = toUnix(splashForm.value._startLocal)
  splashForm.value.end_time = toUnix(splashForm.value._endLocal)
}

const fetchSplashes = async () => {
  try {
    const r = await adminService.getSplashes()
    if (r.code === 200 || r.code === 0) {
      splashList.value = r.data.list || []
    }
  } catch (e) { toast.error('加载开屏弹窗失败: ' + (e.message || '网络错误')) }
}

const openSplashModal = (data) => {
  if (data) {
    splashEdit.value = data
    splashForm.value = {
      title: data.title || '', image: data.image || '', link: data.link || '',
      frequency: data.frequency || 1, sort: data.sort || 0, status: data.status,
      _startLocal: toLocal(data.start_time), _endLocal: toLocal(data.end_time),
      start_time: data.start_time || 0, end_time: data.end_time || 0
    }
  } else {
    splashEdit.value = null
    splashForm.value = { title: '', image: '', link: '', frequency: 1, sort: 0, status: 1, _startLocal: '', _endLocal: '', start_time: 0, end_time: 0 }
  }
  splashModal.value = true
}

const saveSplash = async () => {
  if (!splashForm.value.image) return toast.error('请上传或输入弹窗图片')
  try {
    const payload = {
      title: splashForm.value.title, image: splashForm.value.image, link: splashForm.value.link,
      frequency: splashForm.value.frequency, sort: splashForm.value.sort, status: splashForm.value.status,
      start_time: toUnix(splashForm.value._startLocal), end_time: toUnix(splashForm.value._endLocal)
    }
    let r
    if (splashEdit.value) {
      r = await adminService.updateSplash(splashEdit.value.id, payload)
    } else {
      r = await adminService.createSplash(payload)
    }
    if (r.code === 200 || r.code === 0 || r.code === 201) {
      toast.success(splashEdit.value ? '修改成功' : '创建成功')
      splashModal.value = false
      fetchSplashes()
    } else { toast.error(r.message || '操作失败') }
  } catch (e) { toast.error('操作失败: ' + (e.message || '网络错误')) }
}

const toggleSplash = async (item, val) => {
  try {
    await adminService.updateSplash(item.id, { status: parseInt(val) })
    toast.success('状态已更新')
    fetchSplashes()
  } catch (e) { toast.error('更新失败: ' + (e.message || '网络错误')) }
}

const deleteSplash = async (id) => {
  if (!confirm('确定删除该开屏弹窗？')) return
  try {
    await adminService.deleteSplash(id)
    toast.success('已删除')
    fetchSplashes()
  } catch (e) { toast.error('删除失败: ' + (e.message || '网络错误')) }
}

const handleSplashUpload = async (e) => {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  splashUploading.value = true
  try {
    const fd = new FormData(); fd.append('image', file)
    const res = await fetch(`${getHost()}/api/upload/image`, { method: 'POST', headers: { Authorization: getHeaders().Authorization }, body: fd })
    const r = await res.json()
    if (r.code === 200 || r.code === 0) { splashForm.value.image = r.data.url; toast.success('上传成功') }
    else { toast.error(r.message || '上传失败') }
  } catch (err) { toast.error('上传失败: ' + (err.message || '网络错误')) }
  finally { splashUploading.value = false; e.target.value = '' }
}

// ==================== 轮播展示（Banner） ====================
const carouselList = ref([])
const carouselModal = ref(false)
const carouselEdit = ref(null)
const carouselUploading = ref(false)
const carouselForm = ref({ title: '', image: '', link: '', sort: 0, status: 1 })

const fetchCarousels = async () => {
  try {
    const r = await adminService.getBanners()
    if (r.code === 200 || r.code === 0) {
      carouselList.value = r.data.list || []
    }
  } catch (e) { toast.error('加载轮播图失败: ' + (e.message || '网络错误')) }
}

const openCarouselModal = (data) => {
  if (data) {
    carouselEdit.value = data
    carouselForm.value = { title: data.title || '', image: data.image || '', link: data.link || '', sort: data.sort || 0, status: data.status }
  } else {
    carouselEdit.value = null
    carouselForm.value = { title: '', image: '', link: '', sort: 0, status: 1 }
  }
  carouselModal.value = true
}

const saveCarousel = async () => {
  if (!carouselForm.value.image) return toast.error('请上传或输入轮播图片')
  try {
    const payload = { title: carouselForm.value.title, image: carouselForm.value.image, link: carouselForm.value.link, sort: carouselForm.value.sort, status: carouselForm.value.status }
    let r
    if (carouselEdit.value) {
      r = await adminService.updateBanner(carouselEdit.value.id, payload)
    } else {
      r = await adminService.createBanner(payload)
    }
    if (r.code === 200 || r.code === 0 || r.code === 201) {
      toast.success(carouselEdit.value ? '修改成功' : '创建成功')
      carouselModal.value = false
      fetchCarousels()
    } else { toast.error(r.message || '操作失败') }
  } catch (e) { toast.error('操作失败: ' + (e.message || '网络错误')) }
}

const toggleCarousel = async (item, val) => {
  try {
    await adminService.updateBanner(item.id, { status: parseInt(val) })
    toast.success('状态已更新')
    fetchCarousels()
  } catch (e) { toast.error('更新失败: ' + (e.message || '网络错误')) }
}

const deleteCarousel = async (id) => {
  if (!confirm('确定删除该轮播图？')) return
  try {
    await adminService.deleteBanner(id)
    toast.success('已删除')
    fetchCarousels()
  } catch (e) { toast.error('删除失败: ' + (e.message || '网络错误')) }
}

const handleCarouselUpload = async (e) => {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  carouselUploading.value = true
  try {
    const fd = new FormData(); fd.append('image', file)
    const res = await fetch(`${getHost()}/api/upload/image`, { method: 'POST', headers: { Authorization: getHeaders().Authorization }, body: fd })
    const r = await res.json()
    if (r.code === 200 || r.code === 0) { carouselForm.value.image = r.data.url; toast.success('上传成功') }
    else { toast.error(r.message || '上传失败') }
  } catch (err) { toast.error('上传失败: ' + (err.message || '网络错误')) }
  finally { carouselUploading.value = false; e.target.value = '' }
}

onMounted(() => { fetchSplashes(); fetchCarousels() })
</script>

<style scoped>
.page-container { padding: 16px; max-width: 1100px; margin: 0 auto; }
h2 { font-size: 20px; margin-bottom: 12px; }
.tab-bar { display: flex; gap: 0; margin-bottom: 16px; border-bottom: 2px solid #e8e8e8; }
.tab-btn { padding: 8px 24px; border: none; background: transparent; cursor: pointer; font-size: 14px; color: #666; border-bottom: 2px solid transparent; margin-bottom: -2px; }
.tab-btn.active { color: #1890ff; border-bottom-color: #1890ff; }
.toolbar { margin-bottom: 12px; }
.btn-primary { padding: 6px 16px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { padding: 8px; border-bottom: 1px solid #f0f0f0; text-align: left; }
.data-table th { background: #fafafa; font-weight: 600; }
.thumb { width: 60px; height: 36px; object-fit: cover; border-radius: 3px; }
.actions { white-space: nowrap; }
.btn-edit, .btn-del { padding: 3px 10px; border: 1px solid #d9d9d9; border-radius: 3px; background: #fff; cursor: pointer; font-size: 12px; margin-right: 4px; }
.btn-del { color: #ff4d4f; border-color: #ff4d4f; }
.empty { text-align: center; color: #999; padding: 40px 0; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: #fff; border-radius: 6px; padding: 20px 24px; min-width: 480px; max-width: 560px; max-height: 80vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.modal-header h3 { margin: 0; font-size: 16px; }
.modal-close { width: 28px; height: 28px; border: none; background: transparent; font-size: 22px; color: #999; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 4px; line-height: 1; }
.modal-close:hover { color: #333; background: #f5f5f5; }
.form-grid { display: flex; flex-direction: column; gap: 10px; }
.form-grid label { font-size: 13px; color: #333; display: flex; flex-direction: column; gap: 3px; }
.form-grid input, .form-grid select { padding: 7px 10px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 13px; }
.image-upload-group { display: flex; flex-direction: column; gap: 4px; }
.image-upload-group label { font-size: 13px; color: #333; }
.upload-row { display: flex; align-items: center; gap: 8px; }
.upload-row input[type=file] { font-size: 12px; }
.upload-progress { font-size: 12px; color: #1890ff; }
.image-preview { width: 100%; max-height: 120px; object-fit: contain; border-radius: 4px; border: 1px solid #e8e8e8; margin-top: 4px; }
.modal-actions { margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end; }
.modal-actions button { padding: 7px 18px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; }
.modal-actions .btn-primary { background: #1890ff; color: #fff; border: none; }
</style>
