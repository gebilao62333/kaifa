<template>
  <div>
<div class="gift-list">
          <div class="page-header">
            <h2>礼物管理</h2>
            <button @click="openCreateGiftModal" class="add-btn">添加礼物</button>
          </div>

          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索礼物名称" class="search-input" />
            <select v-model="filterStatus" class="search-select">
              <option value="">全部状态</option>
              <option value="1">启用</option>
              <option value="0">禁用</option>
            </select>
            <button @click="loadGifts" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>图片</th>
                <th>礼物名称</th>
                <th>价格</th>
                <th>类型</th>
                <th>VIP专属</th>
                <th>排序</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="gift in giftList" :key="gift.id">
                <td>{{ gift.id }}</td>
                <td>
                  <img v-if="gift.image" :src="gift.image" class="gift-avatar" />
                  <span v-else>🎁</span>
                </td>
                <td>{{ gift.title }}</td>
                <td>{{ gift.money }} 金币</td>
                <td>{{ gift.type === 1 ? '特殊' : '普通' }}</td>
                <td>{{ gift.is_vip === 1 ? '是' : '否' }}</td>
                <td>{{ gift.sort }}</td>
                <td>
                  <span :class="['status-badge', gift.status === 1 ? 'active' : 'disabled']">
                    {{ gift.status === 1 ? '启用' : '禁用' }}
                  </span>
                </td>
                <td>
                  <button @click="editGift(gift)" class="action-btn">编辑</button>
                  <button @click="toggleGiftStatus(gift)" class="action-btn">
                    {{ gift.status === 1 ? '禁用' : '启用' }}
                  </button>
                  <button @click="deleteGift(gift)" class="action-btn delete-btn">删除</button>
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

        <!-- 礼物记录 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()
</script>
