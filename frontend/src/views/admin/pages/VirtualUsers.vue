<template>
  <div>
<div class="virtual-user-list">
          <div class="page-header">
            <h2>虚拟机器人管理</h2>
            <button @click="openCreateModal" class="add-btn">添加机器人</button>
          </div>

          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索用户名/昵称" class="search-input" />
            <button @click="loadVirtualUsers" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>头像</th>
                <th>用户名</th>
                <th>昵称</th>
                <th>角色</th>
                <th>对话风格</th>
                <th>状态</th>
                <th>在线状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in virtualUserList" :key="user.id">
                <td>{{ user.id }}</td>
                <td>
                  <img v-if="user.avatar" :src="user.avatar" class="user-avatar-small" />
                  <span v-else>🤖</span>
                </td>
                <td>{{ user.username }}</td>
                <td>{{ user.nickname }}</td>
                <td>{{ getRoleName(user.role) }}</td>
                <td>{{ getStyleName(user.dialogueStyle) }}</td>
                <td>
                  <span :class="['status-badge', user.status === 1 ? 'active' : 'disabled']">
                    {{ user.status === 1 ? '启用' : '禁用' }}
                  </span>
                </td>
                <td>
                  <span :class="['status-badge', user.isOnline === 1 ? 'active' : 'disabled']">
                    {{ user.isOnline === 1 ? '在线' : '离线' }}
                  </span>
                </td>
                <td>{{ formatTime(user.createTime) }}</td>
                <td>
                  <button @click="editUser(user)" class="action-btn">编辑</button>
                  <button @click="toggleStatus(user)" class="action-btn">
                    {{ user.status === 1 ? '禁用' : '启用' }}
                  </button>
                  <button @click="deleteUser(user)" class="action-btn delete-btn">删除</button>
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

        <!-- 礼物管理 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()
</script>
