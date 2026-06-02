<template>
  <div>
<div class="banner-list">
          <div class="page-header">
            <h2>Banner管理</h2>
            <button @click="openCreateBannerModal" class="add-btn">添加Banner</button>
          </div>

          <div class="search-bar">
            <select v-model="filterStatus" class="search-select">
              <option value="">全部状态</option>
              <option value="1">启用</option>
              <option value="0">禁用</option>
            </select>
            <button @click="loadBanners" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>图片</th>
                <th>标题</th>
                <th>链接</th>
                <th>排序</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="banner in bannerList" :key="banner.id">
                <td>{{ banner.id }}</td>
                <td>
                  <img v-if="banner.image" :src="banner.image" class="user-avatar-small" style="width: 100px; height: 50px; object-fit: cover;" />
                  <span v-else>-</span>
                </td>
                <td>{{ banner.title }}</td>
                <td>{{ banner.link || '-' }}</td>
                <td>{{ banner.sort }}</td>
                <td>
                  <span :class="['status-badge', banner.status === 1 ? 'active' : 'disabled']">
                    {{ banner.status === 1 ? '启用' : '禁用' }}
                  </span>
                </td>
                <td>{{ formatTime(banner.createTime) }}</td>
                <td>
                  <button @click="editBanner(banner)" class="action-btn">编辑</button>
                  <button @click="toggleBannerStatus(banner)" class="action-btn">
                    {{ banner.status === 1 ? '禁用' : '启用' }}
                  </button>
                  <button @click="deleteBanner(banner)" class="action-btn delete-btn">删除</button>
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

        <!-- VIP套餐管理 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()
</script>
