<template>
  <div>
<div class="application-list">
          <div class="search-bar">
            <select v-model="filterStatus" class="search-select">
              <option value="">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
            <button @click="loadApplications" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>用户</th>
                <th>服务类型</th>
                <th>申请时间</th>
                <th>状态</th>
                <th>处理时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="app in applicationList" :key="app.id">
                <td>{{ app.id }}</td>
                <td>{{ app.userId }}</td>
                <td>{{ app.gameName || '游戏陪玩' }}</td>
                <td>{{ formatTime(app.createTime) }}</td>
                <td>
                  <span :class="['status-badge', 
                    app.status === 'approved' ? 'approved' : 
                    app.status === 'pending' ? 'pending' : 'rejected']">
                    {{ app.status === 'approved' ? '已通过' : 
                       app.status === 'pending' ? '待审核' : '已拒绝' }}
                  </span>
                </td>
                <td>{{ app.handleTime ? formatTime(app.handleTime) : '-' }}</td>
                <td>
                  <button @click="viewApplication(app)" class="action-btn">查看</button>
                  <button @click="approveApplication(app)" class="action-btn" :disabled="app.status !== 'pending'">通过</button>
                  <button @click="rejectApplication(app)" class="action-btn delete-btn" :disabled="app.status !== 'pending'">拒绝</button>
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

        <!-- 管理员管理 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()
</script>
