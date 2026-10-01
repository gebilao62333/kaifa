<template>
  <div>
    <div class="page-actions">
      <input v-model="searchKeyword" placeholder="搜索帖子内容..." class="search-input" @keyup.enter="loadList" />
    </div>

    <div v-if="loading" class="loading-wrap"><div class="spinner"></div><span>加载中...</span></div>

    <table class="data-table" v-else>
      <thead><tr><th>ID</th><th>用户</th><th>内容</th><th>图片</th><th>点赞</th><th>评论</th><th>类型</th><th>时间</th><th>操作</th></tr></thead>
      <tbody>
        <tr v-for="p in list" :key="p.id">
          <td>{{ p.id }}</td>
          <td>{{ p.nickName || p.userId }}</td>
          <td class="content-cell">{{ truncate(p.content, 50) }}</td>
          <td>{{ (p.images || []).length || 0 }}张</td>
          <td>{{ p.likes || 0 }}</td>
          <td>{{ p.comments || 0 }}</td>
          <td><span :class="['status-tag', p.isPrivate ? 'private' : 'public']">{{ p.isPrivate ? '私密' : '公开' }}</span></td>
          <td>{{ formatTime(p.createTime) }}</td>
          <td>
            <button class="btn-sm" @click="viewPost(p)">查看</button>
            <button class="btn-sm danger" @click="deletePost(p)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination" v-if="!loading">
      <button :disabled="page <= 1" @click="page--; loadList()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页 (共 {{ total }} 条)</span>
      <button :disabled="page >= totalPages" @click="page++; loadList()">下一页</button>
    </div>

    <!-- 帖子详情弹窗 -->
    <div class="modal-overlay" v-if="showDetail" @click.self="showDetail = false">
      <div class="detail-modal">
        <div class="detail-header">
          <h3>帖子详情</h3>
          <button class="close-btn" @click="showDetail = false">&times;</button>
        </div>
        <div class="detail-body">
          <div class="detail-row"><span class="detail-label">帖子ID</span><span>{{ detailItem.id }}</span></div>
          <div class="detail-row"><span class="detail-label">用户</span><span>{{ detailItem.nickName || detailItem.userId }}</span></div>
          <div class="detail-row"><span class="detail-label">类型</span><span :class="['status-tag', detailItem.isPrivate ? 'private' : 'public']">{{ detailItem.isPrivate ? '私密' : '公开' }}</span></div>
          <div class="detail-row"><span class="detail-label">点赞</span><span>{{ detailItem.likes || 0 }}</span></div>
          <div class="detail-row"><span class="detail-label">评论</span><span>{{ detailItem.comments || 0 }}</span></div>
          <div class="detail-row detail-content"><span class="detail-label">内容</span><span>{{ detailItem.content || '-' }}</span></div>
          <div class="detail-row" v-if="(detailItem.images || []).length">
            <span class="detail-label">图片</span>
            <div class="image-list">
              <img v-for="(img, i) in detailItem.images" :key="i" :src="img" class="post-image" />
            </div>
          </div>
          <div class="detail-row"><span class="detail-label">发布时间</span><span>{{ formatTime(detailItem.createTime) }}</span></div>
        </div>
        <div class="detail-footer">
          <button class="btn-primary" @click="showDetail = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import adminService from '../../services/adminService'
import { useAdminApi } from '../../composables/useAdminApi'
import { useToast } from '../../composables/useToast'
const { page, pageSize, total, totalPages, searchKeyword, formatTime } = useAdminApi()
const toast = useToast()
const list = ref([])
const loading = ref(false)
const showDetail = ref(false)
const detailItem = ref({})
const truncate = (s, n) => s ? (s.length > n ? s.substring(0, n) + '...' : s) : ''
const loadList = async () => {
  loading.value = true
  try {
    const res = await adminService.getPosts({ page: page.value, pageSize: pageSize.value, keyword: searchKeyword.value || undefined })
    if (res.code === 200 || res.code === 0) { list.value = res.data.list || res.data || []; total.value = res.data.pagination?.total || list.value.length }
  } catch (e) { toast.error('加载失败: ' + (e.message || '网络错误')) }
  finally { loading.value = false }
}
const viewPost = (p) => { detailItem.value = p; showDetail.value = true }
const deletePost = async (p) => {
  if (!confirm('确定删除该帖子?')) return
  try {
    await adminService.deletePost(p.id)
    toast.success('帖子已删除')
    loadList()
  } catch (e) { toast.error('删除失败: ' + (e.message || '网络错误')) }
}
onMounted(loadList)
</script>

<style scoped>
.page-actions { display: flex; gap: 12px; margin-bottom: 16px; }
.search-input { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; width: 250px; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.data-table th { text-align: left; padding: 12px; background: #fafafa; color: #666; font-size: 13px; font-weight: 600; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.content-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-tag.public { background: #f6ffed; color: #52c41a; }
.status-tag.private { background: #fff7e6; color: #fa8c16; }
.btn-sm { padding: 4px 10px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px; margin-right: 4px; }
.btn-sm.danger { color: #ff4d4f; border-color: #ff4d4f; }
.pagination { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 16px; font-size: 13px; color: #666; }
.pagination button { padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: #999; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #f0f0f0; border-top-color: #1890ff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.detail-modal { background: #fff; border-radius: 12px; width: 560px; max-height: 80vh; overflow-y: auto; box-shadow: 0 8px 40px rgba(0,0,0,0.12); }
.detail-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.detail-header h3 { font-size: 18px; font-weight: 600; color: #1a1a1a; }
.detail-body { padding: 20px 24px; }
.detail-row { display: flex; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.detail-row:last-child { border-bottom: none; }
.detail-content span:last-child { white-space: pre-wrap; line-height: 1.6; }
.detail-label { width: 80px; font-size: 13px; color: #999; flex-shrink: 0; }
.detail-row > span:last-child { font-size: 14px; color: #333; }
.image-list { display: flex; flex-wrap: wrap; gap: 8px; }
.post-image { width: 100px; height: 100px; object-fit: cover; border-radius: 6px; }
.detail-footer { padding: 16px 24px; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; }
.detail-footer .btn-primary { padding: 8px 28px; background: #1890ff; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.close-btn { background: none; border: none; font-size: 24px; color: #999; cursor: pointer; padding: 0; line-height: 1; }
.close-btn:hover { color: #333; }
</style>
