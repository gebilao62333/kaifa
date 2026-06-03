<template>
  <div>
<div class="report-list">
          <div class="search-bar">
            <select v-model="filterStatus" class="search-select">
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="resolved">已处理</option>
              <option value="rejected">已驳回</option>
            </select>
            <button @click="loadReports" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>举报人</th>
                <th>举报类型</th>
                <th>举报内容</th>
                <th>原因</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="report in reportList" :key="report.id">
                <td>{{ report.id }}</td>
                <td>{{ report.reporterName || '用户' + report.reporterId }}</td>
                <td>{{ report.targetType === 'post' ? '帖子' : report.targetType === 'user' ? '用户' : '评论' }}</td>
                <td>{{ report.targetContent?.substring(0, 30) }}...</td>
                <td>{{ report.reason }}</td>
                <td>
                  <span :class="['status-badge', 
                    report.status === 'pending' ? 'pending' : 
                    report.status === 'resolved' ? 'approved' : 'rejected']">
                    {{ report.status === 'pending' ? '待处理' : 
                       report.status === 'resolved' ? '已处理' : '已驳回' }}
                  </span>
                </td>
                <td>{{ formatTime(report.createTime) }}</td>
                <td>
                  <button @click="viewReport(report)" class="action-btn">查看</button>
                  <button @click="handleReport(report, 'resolved')" class="action-btn">处理</button>
                  <button @click="handleReport(report, 'rejected')" class="action-btn delete-btn">驳回</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" class="page-btn" :disabled="page <= 1">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" class="page-btn" :disabled="page >= totalPages">下一页</button>
          </div>
        </div>

        <!-- Banner管理 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()

const reportList = ref([])
const filterStatus = ref('')
const currentReport = ref(null)
const showReportDetail = ref(false)

const loadReports = async () => {
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (filterStatus.value !== '') {
      params.status = filterStatus.value
    }
    const res = await apiGet('/api/admin/reports', params)
    if (res.code === 200) {
      reportList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载举报记录失败:', err)
  }
}

const viewReport = (report) => {
  currentReport.value = { ...report }
  showReportDetail.value = true
}

const handleReport = async (report, status) => {
  try {
    const res = await apiPut('/api/admin/reports/' + report.id, { status })
    if (res.code === 200) {
      loadReports()
    }
  } catch (err) {
    console.error('处理举报失败:', err)
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadReports()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadReports()
  }
}

onMounted(() => {
  loadReports()
})
</script>
