<template>
  <div>
    <div class="page-actions">
      <input v-model="searchKeyword" placeholder="搜索帖子内容..." class="search-input" @keyup.enter="loadList" />
    </div>
    <table class="data-table">
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
    <div class="pagination">
      <button :disabled="page <= 1" @click="page--; loadList()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页 (共 {{ total }} 条)</span>
      <button :disabled="page >= totalPages" @click="page++; loadList()">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import adminService from '../../services/adminService'
import { useAdminApi } from '../../composables/useAdminApi'
const { page, pageSize, total, totalPages, searchKeyword, formatTime } = useAdminApi()
const list = ref([])
const truncate = (s, n) => s ? (s.length > n ? s.substring(0, n) + '...' : s) : ''
const loadList = async () => {
  try {
    const res = await adminService.getPosts({ page: page.value, pageSize: pageSize.value, keyword: searchKeyword.value || undefined })
    if (res.code === 200 || res.code === 0) { list.value = res.data.list || res.data || []; total.value = res.data.pagination?.total || list.value.length }
  } catch (e) { console.error(e) }
}
const viewPost = (p) => { alert(`帖子详情:\nID: ${p.id}\n用户: ${p.userId}\n内容: ${p.content?.substring(0, 100)}`) }
const deletePost = async (p) => { if (!confirm('确定删除该帖子?')) return; try { await adminService.deletePost(p.id); loadList() } catch (e) { console.error(e) } }
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
</style>
