<template>
  <div>
<div class="user-list">
          <div class="page-header">
            <h2>用户管理</h2>
            <button @click="openCreateUserAccountModal" class="add-btn">添加用户</button>
          </div>
          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索用户昵称或手机号" class="search-input" />
            <select v-model="filterStatus" class="search-select">
              <option value="">全部状态</option>
              <option value="0">正常</option>
              <option value="1">禁用</option>
            </select>
            <button @click="loadUsers" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>头像</th>
                <th>昵称</th>
                <th>手机号</th>
                <th>邮箱</th>
                <th>性别</th>
                <th>等级</th>
                <th>VIP等级</th>
                <th>金币</th>
                <th>城市</th>
                <th>状态</th>
                <th>注册时间</th>
                <th>最后登录</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in userList" :key="user.userId">
                <td>{{ user.userId }}</td>
                <td>
                  <img v-if="user.avatar" :src="user.avatar" class="user-avatar" />
                  <span v-else class="avatar-placeholder">👤</span>
                </td>
                <td>{{ user.nickname }}</td>
                <td>{{ user.phone || '-' }}</td>
                <td>{{ user.email || '-' }}</td>
                <td>{{ user.sex === 1 ? '男' : user.sex === 2 ? '女' : '未知' }}</td>
                <td>Lv.{{ user.lv || 1 }}</td>
                <td>{{ user.vip ? 'VIP'+user.vipLv : '-' }}</td>
                <td>{{ user.money || 0 }} 金币</td>
                <td>{{ user.city || '-' }}</td>
                <td>
                  <span :class="['status-badge', user.status === 0 ? 'active' : 'disabled']">
                    {{ user.status === 0 ? '正常' : '禁用' }}
                  </span>
                </td>
                <td>{{ formatTime(user.createTime) }}</td>
                <td>{{ user.lastLoginTime ? formatTime(user.lastLoginTime) : '-' }}</td>
                <td>
                  <button @click="viewUser(user)" class="action-btn">查看</button>
                  <button @click="editUserAccount(user)" class="action-btn">编辑</button>
                  <button @click="toggleUserStatus(user)" class="action-btn">
                    {{ user.status === 0 ? '禁用' : '启用' }}
                  </button>
                  <button @click="deleteUserAccount(user)" class="action-btn delete-btn">删除</button>
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

        <!-- 热门推荐 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()
</script>
