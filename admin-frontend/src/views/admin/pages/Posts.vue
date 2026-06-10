<template>
  <div class="admin-card">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-num">{{ stats.total }}</div>
        <div class="stat-label">帖子总数</div>
      </div>
      <div class="stat-card stat-active">
        <div class="stat-num">{{ stats.active }}</div>
        <div class="stat-label">已启用</div>
      </div>
      <div class="stat-card stat-banned">
        <div class="stat-num">{{ stats.banned }}</div>
        <div class="stat-label">已禁用</div>
      </div>
      <div class="stat-card stat-today">
        <div class="stat-num">{{ stats.today }}</div>
        <div class="stat-label">今日新增</div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button
          v-if="selectedIds.length > 0"
          @click="batchDelete"
          class="batch-btn batch-delete-btn"
        >🗑 批量删除({{ selectedIds.length }})</button>
        <button
          v-if="selectedIds.length > 0"
          @click="batchEnable(true)"
          class="batch-btn batch-enable-btn"
        >✓ 批量启用({{ selectedIds.length }})</button>
        <button
          v-if="selectedIds.length > 0"
          @click="batchEnable(false)"
          class="batch-btn batch-disable-btn"
        >✕ 批量禁用({{ selectedIds.length }})</button>
      </div>
      <div class="toolbar-right">
        <button @click="loadPosts" class="refresh-btn">🔄 刷新</button>
        <button @click="exportPosts" class="export-btn">📥 导出</button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-row">
        <input
          v-model="filters.keyword"
          type="text"
          placeholder="搜索帖子内容..."
          class="filter-input"
          @keyup.enter="searchPosts"
        />
        <input
          v-model="filters.userKeyword"
          type="text"
          placeholder="搜索用户昵称..."
          class="filter-input filter-input-sm"
          @keyup.enter="searchPosts"
        />
        <select v-model="filters.status" class="filter-select" @change="searchPosts">
          <option value="">全部状态</option>
          <option value="1">已启用</option>
          <option value="0">已禁用</option>
        </select>
        <select v-model="filters.type" class="filter-select" @change="searchPosts">
          <option value="">全部类型</option>
          <option value="0">普通帖子</option>
          <option value="1">精华帖子</option>
          <option value="2">公告帖子</option>
        </select>
        <input
          v-model="filters.dateFrom"
          type="date"
          class="filter-input filter-date"
          @change="searchPosts"
          title="开始日期"
        />
        <span class="date-sep">至</span>
        <input
          v-model="filters.dateTo"
          type="date"
          class="filter-input filter-date"
          @change="searchPosts"
          title="结束日期"
        />
        <select v-model="filters.sortField" class="filter-select" @change="searchPosts">
          <option value="create_time">按时间排序</option>
          <option value="thumb_num">按点赞数排序</option>
          <option value="comment_num">按评论数排序</option>
          <option value="share_num">按分享数排序</option>
        </select>
        <select v-model="filters.sortOrder" class="filter-select filter-select-sm" @change="searchPosts">
          <option value="desc">降序</option>
          <option value="asc">升序</option>
        </select>
        <button @click="searchPosts" class="search-btn">搜索</button>
        <button @click="clearFilters" class="clear-btn">重置</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 表格 -->
    <div v-else-if="postList.length > 0" class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:40px">
              <input type="checkbox" :checked="allSelected" @change="toggleAll" title="全选" />
            </th>
            <th>ID</th>
            <th>用户</th>
            <th>内容</th>
            <th style="width:80px">类型</th>
            <th style="width:70px">点赞</th>
            <th style="width:70px">评论</th>
            <th style="width:70px">分享</th>
            <th style="width:80px">状态</th>
            <th style="width:110px">创建时间</th>
            <th style="width:180px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="post in postList"
            :key="post.id"
            :class="{ 'row-selected': selectedIds.includes(post.id), 'row-banned': post.status === 0 }"
          >
            <td>
              <input type="checkbox" :checked="selectedIds.includes(post.id)" @change="toggleSelect(post.id)" />
            </td>
            <td>{{ post.id }}</td>
            <td>
              <div class="user-cell">
                <img
                  v-if="post.userAvatar"
                  :src="post.userAvatar"
                  class="user-avatar-xs"
                  @error="$event.target.style.display='none'"
                  />
                <span class="user-placeholder" v-else>👤</span>
                <span class="user-name">{{ post.userNickname || '用户'+post.userId }}</span>
              </div>
            </td>
            <td class="content-cell">
              <div class="content-preview" @click="viewPost(post)" title="点击查看详情">
                {{ post.content?.substring(0, 60) }}{{ (post.content || '').length > 60 ? '...' : '' }}
              </div>
              <div v-if="post.images && post.images.length > 0" class="image-dots">
                <img
                  v-for="(img, i) in post.images.slice(0, 3)"
                  :key="i"
                  :src="img"
                  class="thumb-xs"
                  @error="$event.target.style.display='none'"
                  />
                <span v-if="post.images.length > 3" class="more-img">+{{ post.images.length - 3 }}</span>
              </div>
            </td>
            <td>
              <span :class="['type-tag', typeClass(post.type)]">{{ typeText(post.type) }}</span>
            </td>
            <td>{{ post.likeCount }}</td>
            <td>{{ post.commentCount }}</td>
            <td>{{ post.shareCount }}</td>
            <td>
              <span :class="['status-tag', post.status === 1 ? 'status-on' : 'status-off']">
                {{ post.status === 1 ? '启用' : '禁用' }}
              </span>
            </td>
            <td class="time-cell">{{ formatDisplayTime(post.createTime) }}</td>
            <td>
              <div class="action-group">
                <button @click="viewPost(post)" class="action-btn">查看</button>
                <button @click="toggleStatus(post)" class="action-btn action-warn">
                  {{ post.status === 1 ? '禁用' : '启用' }}
                </button>
                <button @click="deletePost(post)" class="action-btn delete-btn">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">📝</div>
      <div class="empty-text">暂无帖子数据</div>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="postList.length > 0">
      <select v-model.number="pageSize" @change="goPage(1)" class="page-size-select">
        <option :value="10">10条/页</option>
        <option :value="20">20条/页</option>
        <option :value="50">50条/页</option>
        <option :value="100">100条/页</option>
      </select>
      <button @click="goPage(1)" :disabled="page <= 1" class="page-btn">首页</button>
      <button @click="goPage(page - 1)" :disabled="page <= 1" class="page-btn">上一页</button>
      <template v-for="p in pageNumbers" :key="p">
        <button v-if="p === '...'" class="page-btn page-ellipsis" disabled>...</button>
        <button v-else :class="['page-btn', { 'page-active': p === page }]" @click="goPage(p)">{{ p }}</button>
      </template>
      <button @click="goPage(page + 1)" :disabled="page >= totalPages" class="page-btn">下一页</button>
      <button @click="goPage(totalPages)" :disabled="page >= totalPages" class="page-btn">末页</button>
      <span class="page-info">共 {{ total }} 条</span>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="showDetail" class="modal-overlay" @click.self="showDetail = false">
      <div class="modal-content detail-modal">
        <div class="modal-header">
          <h3>帖子详情 #{{ currentPost.id }}</h3>
          <button @click="showDetail = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">发布者</span>
              <span class="detail-val">
                <img v-if="currentPost.userAvatar" :src="currentPost.userAvatar" class="detail-avatar" />
                {{ currentPost.userNickname || '用户'+currentPost.userId }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">用户ID</span>
              <span class="detail-val">{{ currentPost.userId }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">帖子类型</span>
              <span :class="['type-tag', typeClass(currentPost.type)]">{{ typeText(currentPost.type) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">状态</span>
              <span :class="['status-tag', currentPost.status === 1 ? 'status-on' : 'status-off']">
                {{ currentPost.status === 1 ? '已启用' : '已禁用' }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">创建时间</span>
              <span class="detail-val">{{ formatTime(currentPost.createTime) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">是否私密</span>
              <span class="detail-val">{{ currentPost.isPrivate ? '是' : '否' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">点赞数</span>
              <span class="detail-val highlight">{{ currentPost.likeCount || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">评论数</span>
              <span class="detail-val highlight">{{ currentPost.commentCount || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">分享数</span>
              <span class="detail-val highlight">{{ currentPost.shareCount || 0 }}</span>
            </div>
          </div>
          <div class="detail-section">
            <span class="detail-label">帖子内容</span>
            <div class="content-box">{{ currentPost.content }}</div>
          </div>
          <div class="detail-section" v-if="currentPost.images && currentPost.images.length > 0">
            <span class="detail-label">图片 ({{ currentPost.images.length }})</span>
            <div class="image-grid">
              <img
                v-for="(img, i) in currentPost.images"
                :key="i"
                :src="img"
                class="detail-img"
                @error="$event.target.style.display='none'"
                @click="previewImg = img"
                />
            </div>
          </div>
          <div class="detail-section" v-if="currentPost.videos">
            <span class="detail-label">视频</span>
            <div class="content-box">{{ currentPost.videos }}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            @click="toggleStatus(currentPost); showDetail = false"
            class="action-warn-btn"
          >{{ currentPost.status === 1 ? '禁用帖子' : '启用帖子' }}</button>
          <button @click="deletePost(currentPost); showDetail = false" class="action-del-btn">删除帖子</button>
          <button @click="showDetail = false" class="cancel-btn">关闭</button>
        </div>
      </div>
    </div>

    <!-- 图片预览 -->
    <div v-if="previewImg" class="img-preview-overlay" @click="previewImg = null">
      <img :src="previewImg" class="img-preview" @click.stop />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { page, pageSize, total, totalPages, pageNumbers, formatTime, apiGet, apiPost, apiPut, apiDelete, exportCSV, toast, confirm } = useAdmin()

const postList = ref([])
const loading = ref(false)
const selectedIds = ref([])
const currentPost = ref({})
const showDetail = ref(false)
const previewImg = ref(null)

const stats = reactive({ total: 0, active: 0, banned: 0, today: 0 })

const filters = reactive({
  keyword: '',
  userKeyword: '',
  status: '',
  type: '',
  dateFrom: '',
  dateTo: '',
  sortField: 'create_time',
  sortOrder: 'desc'
})

// 计算全选
const allSelected = computed(() => {
  return postList.value.length > 0 && selectedIds.value.length === postList.value.length
})

// 切换全选
const toggleAll = (e) => {
  if (e.target.checked) {
    selectedIds.value = postList.value.map(p => p.id)
  } else {
    selectedIds.value = []
  }
}

// 切换单选
const toggleSelect = (id) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

// 类型映射
const typeText = (t) => {
  const map = { 0: '普通', 1: '精华', 2: '公告' }
  return map[t] || '普通'
}
const typeClass = (t) => {
  const map = { 0: 'type-normal', 1: 'type-good', 2: 'type-notice' }
  return map[t] || 'type-normal'
}

// 格式化展示时间（短格式）
const formatDisplayTime = (ts) => {
  if (!ts) return '-'
  const d = new Date(ts)
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const hm = pad(d.getHours()) + ':' + pad(d.getMinutes())
  if (d.toDateString() === now.toDateString()) return '今天 ' + hm
  const yday = new Date(now)
  yday.setDate(yday.getDate() - 1)
  if (d.toDateString() === yday.toDateString()) return '昨天 ' + hm
  return (d.getMonth()+1) + '/' + d.getDate() + ' ' + hm
}

// 加载统计
const loadStats = async () => {
  try {
    const res = await apiGet('/api/admin/posts/stats')
    if (res.code === 200) {
      Object.assign(stats, res.data)
    }
  } catch (e) {
    console.error('获取统计失败:', e)
  }
}

// 构建查询参数
const buildParams = () => {
  const p = { page: page.value, pageSize: pageSize.value }
  if (filters.keyword) p.keyword = filters.keyword
  if (filters.userKeyword) p.userKeyword = filters.userKeyword
  if (filters.status !== '') p.status = filters.status
  if (filters.type !== '') p.type = filters.type
  if (filters.dateFrom) p.dateFrom = filters.dateFrom
  if (filters.dateTo) p.dateTo = filters.dateTo
  if (filters.sortField) p.sortField = filters.sortField
  if (filters.sortOrder) p.sortOrder = filters.sortOrder
  return p
}

// 加载帖子列表
const _loadPosts = async () => {
  loading.value = true
  try {
    const res = await apiGet('/api/admin/posts', buildParams())
    if (res.code === 200) {
      postList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载帖子列表失败:', err)
    toast('加载帖子列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const loadPosts = () => { page.value = 1; selectedIds.value = []; _loadPosts() }
const goPage = (p) => { page.value = p; selectedIds.value = []; _loadPosts() }
const searchPosts = () => { page.value = 1; selectedIds.value = []; _loadPosts() }

const clearFilters = () => {
  Object.assign(filters, {
    keyword: '', userKeyword: '', status: '', type: '',
    dateFrom: '', dateTo: '', sortField: 'create_time', sortOrder: 'desc'
  })
  searchPosts()
}

// 导出
const exportPosts = () => {
  exportCSV(postList.value, [
    { label: 'ID', key: 'id' },
    { label: '用户昵称', key: 'userNickname' },
    { label: '用户ID', key: 'userId' },
    { label: '内容', key: 'content' },
    { label: '类型', key: (r) => typeText(r.type) },
    { label: '点赞数', key: 'likeCount' },
    { label: '评论数', key: 'commentCount' },
    { label: '分享数', key: 'shareCount' },
    { label: '状态', key: (r) => r.status === 1 ? '启用' : '禁用' },
    { label: '创建时间', key: (r) => formatTime(r.createTime) }
  ], '帖子列表')
  toast('导出成功')
}

// 查看详情
const viewPost = (post) => {
  currentPost.value = { ...post }
  showDetail.value = true
  previewImg.value = null
}

// 切换状态
const toggleStatus = async (post) => {
  const newStatus = post.status === 1 ? 0 : 1
  const action = newStatus === 1 ? '启用' : '禁用'
  if (!(await confirm(`确定要${action}该帖子吗？`))) return
  try {
    const res = await apiPut(`/api/admin/posts/${post.id}/status`, { status: newStatus })
    if (res.code === 200) {
      post.status = newStatus
      toast(res.message || `帖子已${action}`)
      loadStats()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('更新状态失败:', err)
    toast('操作失败', 'error')
  }
}

// 删除
const deletePost = async (post) => {
  if (!(await confirm('确定要删除该帖子吗？删除后不可恢复！'))) return
  try {
    const res = await apiDelete('/api/admin/posts/' + post.id)
    if (res.code === 200) {
      toast('帖子已删除')
      selectedIds.value = selectedIds.value.filter(id => id !== post.id)
      _loadPosts()
      loadStats()
    } else {
      toast(res.message || '删除失败', 'error')
    }
  } catch (err) {
    console.error('删除失败:', err)
    toast('删除失败', 'error')
  }
}

// 批量删除
const batchDelete = async () => {
  if (!(await confirm(`确定要删除选中的 ${selectedIds.value.length} 个帖子吗？删除后不可恢复！`))) return
  try {
    const res = await apiPost('/api/admin/posts/batch-delete', { ids: [...selectedIds.value] })
    if (res.code === 200) {
      toast(res.message || '批量删除成功')
      selectedIds.value = []
      _loadPosts()
      loadStats()
    } else {
      toast(res.message || '批量删除失败', 'error')
    }
  } catch (err) {
    console.error('批量删除失败:', err)
    toast('批量删除失败', 'error')
  }
}

// 批量启用/禁用
const batchEnable = async (enable) => {
  const action = enable ? '启用' : '禁用'
  if (!(await confirm(`确定要批量${action}选中的 ${selectedIds.value.length} 个帖子吗？`))) return
  try {
    const res = await apiPost('/api/admin/posts/batch-status', {
      ids: [...selectedIds.value],
      status: enable ? 1 : 0
    })
    if (res.code === 200) {
      toast(res.message || `批量${action}成功`)
      selectedIds.value = []
      _loadPosts()
      loadStats()
    } else {
      toast(res.message || `批量${action}失败`, 'error')
    }
  } catch (err) {
    console.error(`批量${action}失败:`, err)
    toast(`批量${action}失败`, 'error')
  }
}

onMounted(() => {
  _loadPosts()
  loadStats()
})
</script>

<style scoped>
/* ---- 统计卡片 ---- */
.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 10px;
  padding: 18px 20px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  text-align: center;
  border-left: 4px solid #1890ff;
}
.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #1890ff;
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: #888;
  margin-top: 4px;
}
.stat-active { border-left-color: #52c41a; }
.stat-active .stat-num { color: #52c41a; }
.stat-banned { border-left-color: #ff4d4f; }
.stat-banned .stat-num { color: #ff4d4f; }
.stat-today { border-left-color: #fa8c16; }
.stat-today .stat-num { color: #fa8c16; }

/* ---- 工具栏 ---- */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 10px;
}
.toolbar-left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.toolbar-right {
  display: flex;
  gap: 8px;
}
.batch-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}
.batch-delete-btn { background: #fff1f0; color: #ff4d4f; border: 1px solid #ffa39e; }
.batch-delete-btn:hover { background: #ff4d4f; color: #fff; }
.batch-enable-btn { background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; }
.batch-enable-btn:hover { background: #52c41a; color: #fff; }
.batch-disable-btn { background: #fffbe6; color: #faad14; border: 1px solid #ffe58f; }
.batch-disable-btn:hover { background: #faad14; color: #fff; }
.refresh-btn, .export-btn {
  padding: 6px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.refresh-btn:hover, .export-btn:hover { border-color: #1890ff; color: #1890ff; }

/* ---- 筛选栏 ---- */
.filter-bar {
  margin-bottom: 16px;
}
.filter-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.filter-input {
  padding: 7px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  width: 180px;
  transition: border-color 0.2s;
}
.filter-input:focus { border-color: #1890ff; }
.filter-input-sm { width: 140px; }
.filter-date { width: 130px; }
.date-sep { color: #999; font-size: 13px; }
.filter-select {
  padding: 7px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: #fff;
  cursor: pointer;
}
.filter-select-sm { width: 80px; }
.search-btn {
  padding: 7px 16px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}
.search-btn:hover { background: #40a9ff; }
.clear-btn {
  padding: 7px 12px;
  background: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}
.clear-btn:hover { border-color: #1890ff; color: #1890ff; }

/* ---- 表格 ---- */
.table-wrap { overflow-x: auto; }
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.data-table th {
  background: #fafafa;
  padding: 10px 8px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e8e8e8;
  white-space: nowrap;
}
.data-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}
.data-table tbody tr:hover { background: #f5f5f5; }
.row-selected { background: #e6f7ff !important; }
.row-banned { background: #fafafa; }
.row-banned .content-preview { color: #bbb; }

/* 用户 */
.user-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}
.user-avatar-xs {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
}
.user-placeholder {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.user-name {
  font-weight: 500;
  white-space: nowrap;
}

/* 内容 */
.content-cell { max-width: 260px; }
.content-preview {
  cursor: pointer;
  color: #333;
  line-height: 1.4;
  transition: color 0.2s;
}
.content-preview:hover { color: #1890ff; }
.image-dots {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  align-items: center;
}
.thumb-xs {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #eee;
}
.more-img {
  font-size: 11px;
  color: #999;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 标签 */
.type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.type-normal { background: #f0f0f0; color: #666; }
.type-good { background: #fff7e6; color: #fa8c16; }
.type-notice { background: #e6f7ff; color: #1890ff; }

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.status-on { background: #f6ffed; color: #52c41a; }
.status-off { background: #fff1f0; color: #ff4d4f; }

.time-cell { white-space: nowrap; font-size: 12px; color: #888; }

/* 操作 */
.action-group { display: flex; gap: 4px; }
.action-btn {
  padding: 4px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.action-btn:hover { border-color: #1890ff; color: #1890ff; }
.action-warn { color: #fa8c16; }
.action-warn:hover { border-color: #fa8c16; color: #fa8c16; }
.delete-btn { color: #ff4d4f; }
.delete-btn:hover { border-color: #ff4d4f; color: #fff; background: #ff4d4f; }

/* 详情弹窗 */
.detail-modal .modal-content { max-width: 640px; }
.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-label {
  font-size: 12px;
  color: #999;
}
.detail-val {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
}
.detail-val.highlight { color: #1890ff; font-size: 16px; }
.detail-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}
.detail-section {
  margin-bottom: 16px;
}
.detail-section > .detail-label {
  display: block;
  margin-bottom: 8px;
}
.content-box {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: #333;
}
.image-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.detail-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid #eee;
  transition: transform 0.2s;
}
.detail-img:hover { transform: scale(1.05); }

/* 弹窗footer按钮 */
.action-warn-btn {
  padding: 8px 16px;
  border: 1px solid #fa8c16;
  border-radius: 6px;
  background: #fff;
  color: #fa8c16;
  font-size: 13px;
  cursor: pointer;
}
.action-warn-btn:hover { background: #fa8c16; color: #fff; }
.action-del-btn {
  padding: 8px 16px;
  border: 1px solid #ff4d4f;
  border-radius: 6px;
  background: #fff;
  color: #ff4d4f;
  font-size: 13px;
  cursor: pointer;
}
.action-del-btn:hover { background: #ff4d4f; color: #fff; }

/* 图片预览 */
.img-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}
.img-preview {
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 8px;
  cursor: default;
}

/* 加载/空状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
  color: #999;
  gap: 12px;
}
.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e8e8e8;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #bbb;
}
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-text { font-size: 14px; }

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  flex-wrap: wrap;
}
.page-size-select {
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  margin-right: 12px;
}
.page-btn {
  padding: 6px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  min-width: 32px;
  text-align: center;
}
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-active { background: #1890ff; color: #fff; border-color: #1890ff; }
.page-ellipsis { border: none; background: transparent; cursor: default; }
.page-info { margin-left: 16px; font-size: 13px; color: #888; }

/* 模态框复用 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-content {
  background: #fff;
  border-radius: 12px;
  width: 560px;
  max-width: 95vw;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 8px 40px rgba(0,0,0,0.2);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}
.modal-header h3 { margin: 0; font-size: 16px; }
.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  font-size: 22px;
  cursor: pointer;
  color: #999;
  line-height: 1;
}
.close-btn:hover { color: #333; }
.modal-body { padding: 24px; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}
.cancel-btn {
  padding: 8px 20px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
}
</style>
