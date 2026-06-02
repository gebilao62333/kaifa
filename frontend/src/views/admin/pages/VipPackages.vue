<template>
  <div>
<div class="vip-package-list">
          <div class="page-header">
            <h2>VIP套餐管理</h2>
            <button @click="openCreateVipModal" class="add-btn">添加套餐</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>套餐名称</th>
                <th>价格</th>
                <th>原价</th>
                <th>时长(天)</th>
                <th>等级</th>
                <th>热门</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pkg in vipPackageList" :key="pkg.id">
                <td>{{ pkg.id }}</td>
                <td>{{ pkg.name }}</td>
                <td>{{ pkg.price }} 金币</td>
                <td>{{ pkg.originalPrice ? pkg.originalPrice + ' 金币' : '-' }}</td>
                <td>{{ pkg.duration }}</td>
                <td>LV{{ pkg.level }}</td>
                <td>{{ pkg.hot === 1 ? '是' : '否' }}</td>
                <td>
                  <span :class="['status-badge', pkg.status === 1 ? 'active' : 'disabled']">
                    {{ pkg.status === 1 ? '启用' : '禁用' }}
                  </span>
                </td>
                <td>
                  <button @click="editVipPackage(pkg)" class="action-btn">编辑</button>
                  <button @click="toggleVipPackageStatus(pkg)" class="action-btn">
                    {{ pkg.status === 1 ? '禁用' : '启用' }}
                  </button>
                  <button @click="deleteVipPackage(pkg)" class="action-btn delete-btn">删除</button>
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

        <!-- 充值记录 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()
</script>
