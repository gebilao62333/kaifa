<template>
  <div class="page-container">
    <div class="page-header">
      <h2>系统通知</h2>
      <div class="header-actions">
        <button class="add-btn" @click="openCreate">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新建通知
        </button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-grid" style="margin-bottom: 20px;">
      <div class="stat-card" v-for="s in statCards" :key="s.label">
        <div class="stat-icon" :style="{ color: s.color }">{{ s.icon }}</div>
        <div class="stat-info">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="search-bar">
        <input v-model="searchKeyword" class="search-input" placeholder="搜索通知标题..." @keyup.enter="loadList" />
        <button class="search-btn" @click="loadList">搜索</button>
        <button class="search-btn" style="background:#999" @click="searchKeyword=''; loadList()">重置</button>
      </div>
    </div>

    <!-- 表格 -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:60px">ID</th>
          <th style="width:180px">标题</th>
          <th>内容</th>
          <th style="width:80px">类型</th>
          <th style="width:70px">状态</th>
          <th style="width:160px">创建时间</th>
          <th style="width:200px">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="list.length === 0">
          <td colspan="7" class="empty-cell">暂无通知数据</td>
        </tr>
        <tr v-for="item in list" :key="item.id">
          <td>{{ item.id }}</td>
          <td class="cell-ellipsis" :title="item.title">{{ item.title }}</td>
          <td class="cell-ellipsis" :title="item.content">{{ item.content }}</td>
          <td><span class="status-badge" :class="typeClass(item.type)">{{ typeName(item.type) }}</span></td>
          <td><span class="status-badge" :class="item.isRead ? 'active' : 'pending'">{{ item.isRead ? '已读' : '未读' }}</span></td>
          <td>{{ formatAdminTime(item.createTime) }}</td>
          <td>
            <button class="action-btn" @click="handlePush(item)" :disabled="item._pushing">推送</button>
            <button class="action-btn" @click="handleEdit(item)">编辑</button>
            <button class="action-btn delete-btn" @click="handleDelete(item)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 分页 -->
    <AdminPagination
      :page="page" :page-size="pageSize" :total="total"
      @update:page="page=$event; loadList()"
      @update:page-size="pageSize=$event"
      @change="loadList"
    />

    <!-- 新建/编辑弹窗 -->
    <AdminModal v-model:visible="showCreateDialog" :title="editingItem ? '编辑通知' : '新建系统通知'" width="560px" @close="onDialogClose">
      <div class="form-group">
        <label>通知标题 <span class="required">*</span></label>
        <input v-model="form.title" class="form-input" placeholder="请输入通知标题" maxlength="100" />
      </div>
      <div class="form-group">
        <label>通知内容 <span class="required">*</span></label>
        <textarea v-model="form.content" class="form-input" rows="5" placeholder="请输入通知内容" maxlength="2000"></textarea>
      </div>
      <div class="form-group">
        <label>通知类型</label>
        <select v-model="form.type" class="search-select" style="width:100%">
          <option :value="3">系统通知</option>
          <option :value="4">活动提醒</option>
          <option :value="5">安全提醒</option>
        </select>
      </div>
      <template #footer>
        <button class="cancel-btn" @click="showCreateDialog = false">取消</button>
        <button class="confirm-btn" @click="handleSave" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
      </template>
    </AdminModal>
  </div>
</template>

<script>
import adminService from '../../../services/adminService'
import { formatAdminTime } from '../../../common/common'
import AdminPagination from '../components/Pagination.vue'
import AdminModal from '../components/AdminModal.vue'

export default {
  components: { AdminPagination, AdminModal },
  data() {
    return {
      list: [], total: 0, page: 1, pageSize: 15, searchKeyword: '',
      stats: {}, showCreateDialog: false, editingItem: null, saving: false,
      form: { title: '', content: '', type: 3 }
    }
  },
  computed: {
    statCards() {
      const s = this.stats
      return [
        { icon: '📢', color: '#1890ff', label: '通知总数', value: s.totalCount || 0 },
        { icon: '📖', color: '#52c41a', label: '已读', value: s.readCount || 0 },
        { icon: '📫', color: '#faad14', label: '未读', value: s.unreadCount || 0 },
        { icon: '📊', color: '#722ed1', label: '已读率', value: (s.readRate || 0) + '%' }
      ]
    }
  },
  mounted() {
    this.loadStats()
    this.loadList()
  },
  methods: {
    formatAdminTime,
    async loadList() {
      try {
        const res = await adminService.getNotifications({
          page: this.page, pageSize: this.pageSize, keyword: this.searchKeyword
        })
        if (res.code === 200) {
          this.list = res.data.list || []
          this.total = res.data.total || 0
        }
      } catch (e) { console.error('加载通知列表失败', e) }
    },
    async loadStats() {
      try {
        const res = await adminService.getNotificationStats()
        if (res.code === 200) this.stats = res.data || {}
      } catch (e) { console.error('加载通知统计失败', e) }
    },
    typeName(t) { return ({ 3: '系统通知', 4: '活动提醒', 5: '安全提醒' })[t] || '其他' },
    typeClass(t) { return ({ 3: 'active', 4: 'pending', 5: 'rejected' })[t] || '' },
    openCreate() {
      this.editingItem = null
      this.form = { title: '', content: '', type: 3 }
      this.showCreateDialog = true
    },
    handleEdit(item) {
      this.editingItem = item
      this.form = { title: item.title || '', content: item.content || '', type: item.type || 3 }
      this.showCreateDialog = true
    },
    onDialogClose() {
      this.editingItem = null
      this.form = { title: '', content: '', type: 3 }
    },
    async handleSave() {
      if (!this.form.title.trim()) return alert('请输入通知标题')
      if (!this.form.content.trim()) return alert('请输入通知内容')
      this.saving = true
      try {
        const res = this.editingItem
          ? await adminService.updateNotification(this.editingItem.id, this.form)
          : await adminService.createNotification(this.form)
        if (res.code === 200) {
          alert(this.editingItem ? '更新成功' : '创建成功')
          this.showCreateDialog = false
          this.loadList()
          if (!this.editingItem) this.loadStats()
        }
      } catch (e) { alert('操作失败')
      } finally { this.saving = false }
    },
    async handlePush(item) {
      if (!confirm('确认推送此通知给所有用户？')) return
      item._pushing = true
      try {
        const res = await adminService.pushNotification(item.id)
        if (res.code === 200) alert(res.message || '推送成功')
      } catch (e) { alert('推送失败')
      } finally { item._pushing = false }
    },
    async handleDelete(item) {
      if (!confirm('确认删除此通知？')) return
      try {
        const res = await adminService.deleteNotification(item.id)
        if (res.code === 200) { alert('删除成功'); this.loadList(); this.loadStats() }
      } catch (e) { alert('删除失败') }
    }
  }
}
</script>

<style scoped>
.header-actions { display: flex; gap: 10px; align-items: center; }
.cell-ellipsis { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty-cell { text-align: center; padding: 40px; color: #999; }
.required { color: #ff4d4f; }
</style>
