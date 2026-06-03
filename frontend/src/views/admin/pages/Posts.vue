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

const postList = ref([])
const searchKeyword = ref('')
const currentPost = ref(null)
const showPostDetail = ref(false)

const loadPosts = async () => {
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    const res = await apiGet('/api/admin/posts', params)
    if (res.code === 200) {
      postList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载帖子列表失败:', err)
  }
}

const viewPost = (post) => {
  currentPost.value = { ...post }
  showPostDetail.value = true
}

const deletePost = async (post) => {
  if (!confirm('确定要删除这个帖子吗？')) return
  try {
    const res = await apiDelete('/api/admin/posts/' + post.id)
    if (res.code === 200) {
      loadPosts()
    }
  } catch (err) {
    console.error('删除帖子失败:', err)
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadPosts()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadPosts()
  }
}

onMounted(() => {
  loadPosts()
})
</script>
