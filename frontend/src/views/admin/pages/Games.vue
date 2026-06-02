<template>
  <div>
<div class="game-list">
          <div class="page-header">
            <h2>服务分类管理</h2>
            <button @click="openCreateGameModal" class="add-btn">添加分类</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>图标</th>
                <th>名称</th>
                <th>描述</th>
                <th>排序</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="game in gameList" :key="game.id">
                <td>{{ game.id }}</td>
                <td>
                  <img v-if="game.icon" :src="game.icon" class="user-avatar-small" />
                  <span v-else>🎮</span>
                </td>
                <td>{{ game.name }}</td>
                <td>{{ game.description }}</td>
                <td>{{ game.sort }}</td>
                <td>
                  <span :class="['status-badge', game.status === 1 ? 'active' : 'disabled']">
                    {{ game.status === 1 ? '启用' : '禁用' }}
                  </span>
                </td>
                <td>{{ formatTime(game.createTime) }}</td>
                <td>
                  <button @click="editGame(game)" class="action-btn">编辑</button>
                  <button @click="toggleGameStatus(game)" class="action-btn">
                    {{ game.status === 1 ? '禁用' : '启用' }}
                  </button>
                  <button @click="deleteGame(game)" class="action-btn delete-btn">删除</button>
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

        <!-- 服务申请管理 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()
</script>
