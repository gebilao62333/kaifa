<template>
  <div>
<div class="admin-list">
          <div class="page-header">
            <h2>管理员列表</h2>
            <button @click="openCreateAdminModal" class="add-btn">添加管理员</button>
          </div>

          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索用户名/昵称" class="search-input" />
            <select v-model="filterStatus" class="search-select">
              <option value="">全部状态</option>
              <option value="1">正常</option>
              <option value="0">禁用</option>
            </select>
            <button @click="loadAdmins" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>用户名</th>
                <th>昵称</th>
                <th>邮箱</th>
                <th>手机</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="admin in adminList" :key="admin.id">
                <td>{{ admin.id }}</td>
                <td>{{ admin.username }}</td>
                <td>{{ admin.nickname }}</td>
                <td>{{ admin.email || '-' }}</td>
                <td>{{ admin.phone || '-' }}</td>
                <td>
                  <span :class="['status-badge', admin.status === 1 ? 'active' : 'disabled']">
                    {{ admin.status === 1 ? '正常' : '禁用' }}
                  </span>
                </td>
                <td>{{ formatTime(admin.create_time) }}</td>
                <td>
                  <button @click="editAdmin(admin)" class="action-btn">编辑</button>
                  <button @click="openPasswordModal(admin)" class="action-btn">修改密码</button>
                  <button v-if="admin.id !== 1" @click="deleteAdmin(admin)" class="action-btn delete-btn">删除</button>
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

        <!-- 角色管理 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()
</script>
