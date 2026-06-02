<template>
  <div>
<div class="post-list">
          <div class="search-bar">
            <input v-model="searchKeyword" type="text" placeholder="搜索帖子内容" class="search-input" />
            <button @click="loadPosts" class="search-btn">搜索</button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>用户</th>
                <th>内容</th>
                <th>点赞数</th>
                <th>评论数</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="post in postList" :key="post.id">
                <td>{{ post.id }}</td>
                <td>{{ post.userId }}</td>
                <td>{{ post.content?.substring(0, 50) }}...</td>
                <td>{{ post.likeCount || 0 }}</td>
                <td>{{ post.commentCount || 0 }}</td>
                <td>{{ formatTime(post.createTime) }}</td>
                <td>
                  <button @click="viewPost(post)" class="action-btn">查看</button>
                  <button @click="deletePost(post)" class="action-btn delete-btn">删除</button>
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

        <!-- 举报管理 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()
</script>
