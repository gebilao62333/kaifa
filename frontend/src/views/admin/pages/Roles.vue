<template>
  <div>
<div class="role-list">
          <div class="page-header">
            <h2>角色列表</h2>
            <button @click="openCreateRoleModal" class="add-btn">添加角色</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>角色名称</th>
                <th>描述</th>
                <th>状态</th>
                <th>排序</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="role in roleList" :key="role.id">
                <td>{{ role.id }}</td>
                <td>
                  <span v-if="role.is_super" style="color: #e74c3c; font-weight: bold;">
                    {{ role.name }} (超级管理员)
                  </span>
                  <span v-else>{{ role.name }}</span>
                </td>
                <td>{{ role.description || '-' }}</td>
                <td>
                  <span :class="['status-badge', role.status === 1 ? 'active' : 'disabled']">
                    {{ role.status === 1 ? '启用' : '禁用' }}
                  </span>
                </td>
                <td>{{ role.sort || 0 }}</td>
                <td>
                  <button @click="editRole(role)" class="action-btn" :disabled="role.is_super">编辑</button>
                  <button v-if="!role.is_super" @click="deleteRole(role)" class="action-btn delete-btn">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 系统设置 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()
</script>
