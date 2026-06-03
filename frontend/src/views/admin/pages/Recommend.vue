<template>
  <div>
<div class="recommend-page">
          <div class="page-header">
            <h2>热门推荐</h2>
            <button @click="syncRecommendToApi" class="add-btn">保存到服务器</button>
          </div>

          <div class="recommend-tabs">
            <div :class="['recommend-tab', { active: recommendTab === 'system' }]" @click="recommendTab = 'system'">系统推荐</div>
            <div :class="['recommend-tab', { active: recommendTab === 'manual' }]" @click="recommendTab = 'manual'">手动管理</div>
            <div :class="['recommend-tab', { active: recommendTab === 'preview' }]" @click="recommendTab = 'preview'">推荐预览</div>
          </div>

          <!-- 系统推荐 -->
          <div v-if="recommendTab === 'system'" class="recommend-section">
            <h3 class="section-title">系统推荐用户</h3>
            <p class="section-desc">根据用户活跃度、点赞数和关注度自动推荐，点击"推荐"一键加入手动推荐列表</p>
            <table class="data-table">
              <thead>
                <tr>
                  <th>排序</th>
                  <th>ID</th>
                  <th>头像</th>
                  <th>昵称</th>
                  <th>综合评分</th>
                  <th>点赞数</th>
                  <th>粉丝数</th>
                  <th>活跃度</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(user, idx) in recommendList" :key="user.userId">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ user.userId }}</td>
                  <td>
                    <img v-if="user.avatar" :src="user.avatar" class="user-avatar" />
                    <span v-else class="avatar-placeholder">👤</span>
                  </td>
                  <td>{{ user.nickname }}</td>
                  <td>
                    <span class="score-badge">{{ getRecommendScore(user) }}</span>
                  </td>
                  <td>{{ user.likeCount || user.likes || 0 }}</td>
                  <td>{{ user.followerCount || user.followers || 0 }}</td>
                  <td>{{ user.activityScore || user.score || '-' }}</td>
                  <td>
                    <span :class="['status-badge', user.vip ? 'approved' : '']">
                      {{ user.vip ? 'VIP' : '-' }}
                    </span>
                  </td>
                  <td>
                    <button @click="addToManualRecommend(user)" class="action-btn" :disabled="isAlreadyRecommended(user.userId)" :title="isAlreadyRecommended(user.userId) ? '已添加' : '加入推荐'">
                      {{ isAlreadyRecommended(user.userId) ? '已添加' : '推荐' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="recommendList.length === 0" class="empty-hint">
              <p>暂无系统推荐用户数据</p>
            </div>
          </div>

          <!-- 手动管理 -->
          <div v-if="recommendTab === 'manual'" class="recommend-section">
            <h3 class="section-title">手动设置推荐</h3>
            <p class="section-desc">通过用户ID手动添加推荐用户，可拖拽排序</p>
            <div class="add-recommend-form">
              <input v-model="newRecommendUserId" type="number" placeholder="请输入要推荐的用户ID" class="form-input" />
              <button @click="addManualRecommendUser" class="add-btn" :disabled="!newRecommendUserId">添加推荐</button>
              <span class="form-hint">输入已注册的用户ID，系统自动获取昵称和头像</span>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width:50px">排序</th>
                  <th style="width:50px">置顶</th>
                  <th>头像</th>
                  <th>昵称</th>
                  <th>用户ID</th>
                  <th>添加时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(user, idx) in manualRecommendList" :key="user.userId || idx">
                  <td>
                    <div class="sort-controls">
                      <button @click="moveRecommendUp(idx)" :disabled="idx === 0" class="sort-btn" title="上移">↑</button>
                      <span class="sort-num">{{ idx + 1 }}</span>
                      <button @click="moveRecommendDown(idx)" :disabled="idx === manualRecommendList.length - 1" class="sort-btn" title="下移">↓</button>
                    </div>
                  </td>
                  <td>
                    <button @click="toggleRecommendTop(user)" :class="['top-btn', { active: user.isTop }]" :title="user.isTop ? '取消置顶' : '置顶'">
                      {{ user.isTop ? '📌' : '📍' }}
                    </button>
                  </td>
                  <td>
                    <img v-if="user.avatar" :src="user.avatar" class="user-avatar" />
                    <span v-else class="avatar-placeholder">👤</span>
                  </td>
                  <td>{{ user.nickname || '用户' + user.userId }}</td>
                  <td>{{ user.userId }}</td>
                  <td>{{ formatTime(user.createTime) }}</td>
                  <td>
                    <button @click="removeManualRecommend(user, idx)" class="action-btn delete-btn">移除</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="manualRecommendList.length === 0" class="empty-hint">
              <p>暂无手动设置的推荐用户，请在"系统推荐"中一键添加或使用"添加推荐"输入用户ID</p>
            </div>
          </div>

          <!-- 推荐预览 -->
          <div v-if="recommendTab === 'preview'" class="recommend-section">
            <h3 class="section-title">推荐预览</h3>
            <p class="section-desc">已在推荐列表中的用户，将在首页推荐位展示</p>
            <div class="preview-list">
              <div v-for="(user, idx) in mergedRecommendList" :key="user.userId" class="preview-card">
                <div class="preview-rank">{{ idx + 1 }}</div>
                <img :src="user.avatar" class="preview-avatar" />
                <div class="preview-info">
                  <div class="preview-name">
                    {{ user.nickname }}
                    <span v-if="user.isTop" class="top-badge">置顶</span>
                  </div>
                  <div class="preview-meta">ID: {{ user.userId }}</div>
                </div>
                <span v-if="idx < 3" class="hot-badge">🔥 热门</span>
              </div>
            </div>
            <div v-if="mergedRecommendList.length === 0" class="empty-hint">
              <p>暂无推荐用户，请先在"系统推荐"或"手动管理"中添加</p>
            </div>
          </div>
        </div>

        <!-- 订单管理 -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { regionData } from '../../../common/regionData'
import { useAdmin } from '../composables/useAdmin'

const { token, page, pageSize, total, totalPages, getHost, formatTime, handleLogout, apiGet, apiPost, apiPut, apiDelete } = useAdmin()

const recommendTab = ref('system')
const recommendList = ref([])
const manualRecommendList = ref([])
const newRecommendUserId = ref('')

const mergedRecommendList = computed(() => {
  const topList = manualRecommendList.filter(u => u.isTop).sort((a, b) => a.sort - b.sort)
  const normalList = manualRecommendList.filter(u => !u.isTop).sort((a, b) => a.sort - b.sort)
  return [...topList, ...normalList]
})

const getRecommendScore = (user) => {
  return Math.round(((user.likeCount || user.likes || 0) * 0.4 + (user.followerCount || user.followers || 0) * 0.3 + 100) * 0.01 * 100)
}

const isAlreadyRecommended = (userId) => {
  return manualRecommendList.some(u => u.userId === userId)
}

const loadRecommendList = async () => {
  try {
    const res = await apiGet('/api/admin/recommend-system', { page: 1, pageSize: 50 })
    if (res.code === 200) {
      recommendList.value = res.data?.list || []
    }
  } catch (err) {
    console.error('加载推荐用户失败:', err)
  }
}

const loadManualRecommendList = async () => {
  try {
    const res = await apiGet('/api/admin/recommend-manual')
    if (res.code === 200) {
      manualRecommendList.value = res.data?.list || []
    }
  } catch (err) {
    console.error('加载手动推荐列表失败:', err)
  }
}

const addToManualRecommend = async (user) => {
  try {
    const res = await apiPost('/api/admin/recommend-manual', {
      userId: user.userId,
      nickname: user.nickname,
      avatar: user.avatar
    })
    if (res.code === 200) {
      loadManualRecommendList()
    }
  } catch (err) {
    console.error('添加推荐用户失败:', err)
  }
}

const addManualRecommendUser = async () => {
  if (!newRecommendUserId.value) return
  try {
    const res = await apiPost('/api/admin/recommend-manual', {
      userId: parseInt(newRecommendUserId.value)
    })
    if (res.code === 200) {
      newRecommendUserId.value = ''
      loadManualRecommendList()
    }
  } catch (err) {
    console.error('添加推荐用户失败:', err)
  }
}

const removeManualRecommend = async (user, idx) => {
  if (!confirm('确定要移除这个推荐用户吗？')) return
  try {
    const res = await apiDelete('/api/admin/recommend-manual/' + user.userId)
    if (res.code === 200) {
      loadManualRecommendList()
    }
  } catch (err) {
    console.error('移除推荐用户失败:', err)
  }
}

const moveRecommendUp = async (idx) => {
  if (idx === 0) return
  const newList = [...manualRecommendList.value]
  const temp = newList[idx - 1]
  newList[idx - 1] = newList[idx]
  newList[idx] = temp
  manualRecommendList.value = newList
  await syncRecommendToApi()
}

const moveRecommendDown = async (idx) => {
  if (idx === manualRecommendList.value.length - 1) return
  const newList = [...manualRecommendList.value]
  const temp = newList[idx + 1]
  newList[idx + 1] = newList[idx]
  newList[idx] = temp
  manualRecommendList.value = newList
  await syncRecommendToApi()
}

const toggleRecommendTop = async (user) => {
  try {
    const res = await apiPut('/api/admin/recommend-manual/' + user.userId, {
      isTop: !user.isTop
    })
    if (res.code === 200) {
      loadManualRecommendList()
    }
  } catch (err) {
    console.error('切换置顶状态失败:', err)
  }
}

const syncRecommendToApi = async () => {
  try {
    const sortedList = manualRecommendList.value.map((u, idx) => ({
      ...u,
      sort: idx
    }))
    const res = await apiPut('/api/admin/recommend-manual/batch', { list: sortedList })
    if (res.code === 200) {
      loadManualRecommendList()
    }
  } catch (err) {
    console.error('同步推荐列表失败:', err)
  }
}

onMounted(() => {
  loadRecommendList()
  loadManualRecommendList()
})
</script>
