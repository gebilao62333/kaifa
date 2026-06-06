<template>
  <div class="admin-card">
    <div class="toolbar">
      <div class="search-bar"></div>
      <button @click="syncRecommendToApi" class="add-btn">保存排序到服务器</button>
      <button @click="checkExpired" class="btn-outline-sm">检查过期补位</button>
    </div>

    <!-- Tab 切换 -->
    <div class="recommend-tabs">
      <div :class="['recommend-tab', { active: currentTab === 'home' }]" @click="switchTab('home')">首页推荐</div>
      <div :class="['recommend-tab', { active: currentTab === 'square' }]" @click="switchTab('square')">广场推荐</div>
    </div>

    <!-- 首页推荐 -->
    <div v-if="currentTab === 'home'" class="recommend-section">
      <h3 class="section-title">首页推荐管理</h3>
      <p class="section-desc">手动添加用户到首页推荐位，可设置推荐时间段。时间到期后系统自动随机补位。</p>

      <!-- 添加表单 -->
      <div class="add-recommend-form">
        <input v-model="addForm.userId" type="number" placeholder="输入用户ID" class="form-input" style="max-width:140px;" />
        <div class="time-group">
          <label class="time-label">开始</label>
          <input v-model="addForm.startTime" type="datetime-local" class="form-input form-time" />
        </div>
        <div class="time-group">
          <label class="time-label">结束</label>
          <input v-model="addForm.endTime" type="datetime-local" class="form-input form-time" />
        </div>
        <button @click="addRecommend('home')" class="add-btn" :disabled="!addForm.userId">添加推荐</button>
        <span class="form-hint">设置结束时间后，到期自动更换用户；不设结束时间则长期推荐</span>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width:80px">排序</th>
            <th style="width:50px">置顶</th>
            <th>头像</th>
            <th>昵称</th>
            <th>用户ID</th>
            <th>推荐时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in homeList" :key="item.id" :class="{ 'row-expired': item.expired }">
            <td>
              <div class="sort-controls">
                <button @click="moveUp(idx)" :disabled="idx === 0" class="sort-btn" title="上移">↑</button>
                <span class="sort-num">{{ idx + 1 }}</span>
                <button @click="moveDown(idx)" :disabled="idx === homeList.length - 1" class="sort-btn" title="下移">↓</button>
              </div>
            </td>
            <td>
              <button @click="toggleTop(item)" :class="['top-btn', { active: item.isTop }]" :title="item.isTop ? '取消置顶' : '置顶'">
                {{ item.isTop ? '📌' : '📍' }}
              </button>
            </td>
            <td>
              <img v-if="item.avatar" :src="item.avatar" class="user-avatar" />
              <span v-else class="avatar-placeholder">👤</span>
            </td>
            <td>{{ item.nickname || '用户' + item.userId }}</td>
            <td class="w-id">{{ item.userId }}</td>
            <td class="w-time">
              <span v-if="item.startTime">{{ formatDate(item.startTime) }}</span>
              <span v-else class="no-time">—</span>
              <span class="time-sep"> ~ </span>
              <span v-if="item.endTime">{{ formatDate(item.endTime) }}</span>
              <span v-else class="no-time">长期</span>
            </td>
            <td>
              <span :class="['badge', item.expired ? 'badge-expired' : 'badge-active']">
                {{ item.expired ? '已过期' : '进行中' }}
              </span>
            </td>
            <td>
              <button @click="removeRecommend(item)" class="action-btn delete-btn">移除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="homeList.length === 0" class="empty-hint">
        <p>暂无首页推荐用户，请在上方添加</p>
      </div>
    </div>

    <!-- 广场推荐 -->
    <div v-if="currentTab === 'square'" class="recommend-section">
      <h3 class="section-title">广场推荐管理</h3>
      <p class="section-desc">手动添加用户到广场推荐位，可设置推荐时间段。时间到期后系统自动随机补位。</p>

      <div class="add-recommend-form">
        <input v-model="addFormSquare.userId" type="number" placeholder="输入用户ID" class="form-input" style="max-width:140px;" />
        <div class="time-group">
          <label class="time-label">开始</label>
          <input v-model="addFormSquare.startTime" type="datetime-local" class="form-input form-time" />
        </div>
        <div class="time-group">
          <label class="time-label">结束</label>
          <input v-model="addFormSquare.endTime" type="datetime-local" class="form-input form-time" />
        </div>
        <button @click="addRecommend('square')" class="add-btn" :disabled="!addFormSquare.userId">添加推荐</button>
        <span class="form-hint">设置结束时间后，到期自动更换用户；不设结束时间则长期推荐</span>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width:80px">排序</th>
            <th style="width:50px">置顶</th>
            <th>头像</th>
            <th>昵称</th>
            <th>用户ID</th>
            <th>推荐时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in squareList" :key="item.id" :class="{ 'row-expired': item.expired }">
            <td>
              <div class="sort-controls">
                <button @click="moveUp(idx)" :disabled="idx === 0" class="sort-btn" title="上移">↑</button>
                <span class="sort-num">{{ idx + 1 }}</span>
                <button @click="moveDown(idx)" :disabled="idx === squareList.length - 1" class="sort-btn" title="下移">↓</button>
              </div>
            </td>
            <td>
              <button @click="toggleTop(item)" :class="['top-btn', { active: item.isTop }]" :title="item.isTop ? '取消置顶' : '置顶'">
                {{ item.isTop ? '📌' : '📍' }}
              </button>
            </td>
            <td>
              <img v-if="item.avatar" :src="item.avatar" class="user-avatar" />
              <span v-else class="avatar-placeholder">👤</span>
            </td>
            <td>{{ item.nickname || '用户' + item.userId }}</td>
            <td class="w-id">{{ item.userId }}</td>
            <td class="w-time">
              <span v-if="item.startTime">{{ formatDate(item.startTime) }}</span>
              <span v-else class="no-time">—</span>
              <span class="time-sep"> ~ </span>
              <span v-if="item.endTime">{{ formatDate(item.endTime) }}</span>
              <span v-else class="no-time">长期</span>
            </td>
            <td>
              <span :class="['badge', item.expired ? 'badge-expired' : 'badge-active']">
                {{ item.expired ? '已过期' : '进行中' }}
              </span>
            </td>
            <td>
              <button @click="removeRecommend(item)" class="action-btn delete-btn">移除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="squareList.length === 0" class="empty-hint">
        <p>暂无广场推荐用户，请在上方添加</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { formatTime, apiGet, apiPost, apiPut, apiDelete, toast, confirm } = useAdmin()

const currentTab = ref('home')
const homeList = ref([])
const squareList = ref([])
const loading = ref(false)

const addForm = reactive({ userId: '', startTime: '', endTime: '' })
const addFormSquare = reactive({ userId: '', startTime: '', endTime: '' })

const currentList = computed(() => {
  return currentTab.value === 'home' ? homeList.value : squareList.value
})

const formatDate = (ts) => {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const toTimestamp = (datetimeLocal) => {
  if (!datetimeLocal) return 0
  return Math.floor(new Date(datetimeLocal).getTime() / 1000)
}

const toDatetimeLocal = (ts) => {
  if (!ts) return ''
  return new Date(ts * 1000).toISOString().slice(0, 16)
}

const switchTab = (tab) => {
  currentTab.value = tab
}

const loadList = async (type) => {
  try {
    const res = await apiGet(`/api/admin/recommend-list/${type}`)
    if (res.code === 200) {
      const list = res.data?.list || []
      const sorted = list.sort((a, b) => {
        if (a.isTop && !b.isTop) return -1
        if (!a.isTop && b.isTop) return 1
        return a.sortOrder - b.sortOrder
      })
      if (type === 'home') homeList.value = sorted
      else squareList.value = sorted
    }
  } catch (err) {
    console.error('加载推荐列表失败:', err)
  }
}

const addRecommend = async (type) => {
  const form = type === 'home' ? addForm : addFormSquare
  if (!form.userId) return

  const startTime = toTimestamp(form.startTime)
  const endTime = toTimestamp(form.endTime)

  if (endTime > 0 && startTime > 0 && endTime <= startTime) {
    toast('结束时间必须晚于开始时间', 'error')
    return
  }

  loading.value = true
  try {
    const res = await apiPost('/api/admin/recommend', {
      userId: parseInt(form.userId),
      recommendType: type,
      startTime,
      endTime
    })
    if (res.code === 200) {
      form.userId = ''
      form.startTime = ''
      form.endTime = ''
      toast('添加成功')
      await loadList(type)
    } else {
      toast(res.message || '添加失败', 'error')
    }
  } catch (err) {
    console.error('添加推荐失败:', err)
    toast('添加推荐失败', 'error')
  } finally {
    loading.value = false
  }
}

const removeRecommend = async (item) => {
  if (!(await confirm('确定要移除此推荐用户吗？'))) return

  try {
    const res = await apiDelete(`/api/admin/recommend/${item.id}`)
    if (res.code === 200) {
      toast('已移除')
      await loadList(currentTab.value)
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('移除推荐失败:', err)
    toast('移除推荐失败', 'error')
  }
}

const toggleTop = async (item) => {
  try {
    const res = await apiPut(`/api/admin/recommend/${item.id}`, {
      isTop: !item.isTop
    })
    if (res.code === 200) {
      await loadList(currentTab.value)
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('切换置顶失败:', err)
    toast('操作失败', 'error')
  }
}

const moveUp = (idx) => {
  if (idx === 0) return
  const list = currentTab.value === 'home' ? homeList.value : squareList.value
  const temp = list[idx - 1]
  list[idx - 1] = list[idx]
  list[idx] = temp
}

const moveDown = (idx) => {
  const list = currentTab.value === 'home' ? homeList.value : squareList.value
  if (idx === list.length - 1) return
  const temp = list[idx + 1]
  list[idx + 1] = list[idx]
  list[idx] = temp
}

const syncRecommendToApi = async () => {
  const list = currentList.value.map((item, idx) => ({
    id: item.id,
    isTop: item.isTop
  }))
  try {
    const res = await apiPut('/api/admin/recommend/batch', {
      list,
      recommendType: currentTab.value
    })
    if (res.code === 200) {
      toast('排序同步成功')
      await loadList(currentTab.value)
    } else {
      toast(res.message || '同步失败', 'error')
    }
  } catch (err) {
    console.error('同步排序失败:', err)
    toast('同步失败', 'error')
  }
}

const checkExpired = async () => {
  try {
    const res = await apiPost('/api/admin/recommend/check-expired')
    if (res.code === 200) {
      toast(res.message || '检查完成')
      await loadList('home')
      await loadList('square')
    } else {
      toast(res.message || '检查失败', 'error')
    }
  } catch (err) {
    console.error('检查过期失败:', err)
    toast('检查失败', 'error')
  }
}

watch(currentTab, (tab) => {
  loadList(tab)
})

onMounted(() => {
  loadList('home')
  loadList('square')
})
</script>

<style scoped>
/* Tab 导航 */
.recommend-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 24px;
}
.recommend-tab {
  padding: 10px 24px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}
.recommend-tab:hover { color: #1890ff; }
.recommend-tab.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
}

/* 区域 */
.recommend-section { margin-bottom: 28px; }
.section-title { font-size: 16px; font-weight: 600; color: #1a1a2e; margin: 0 0 6px; }
.section-desc { font-size: 13px; color: #999; margin: 0 0 16px; }

/* 添加表单 */
.add-recommend-form {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  padding: 14px 18px;
  background: #f9fafb;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  flex-wrap: wrap;
}
.time-group { display: flex; align-items: center; gap: 6px; }
.time-label { font-size: 12px; color: #8c8c8c; flex-shrink: 0; }
.form-time { width: 180px; }
.form-hint { font-size: 12px; color: #bbb; margin-left: auto; }

/* 排序 */
.sort-controls { display: flex; align-items: center; gap: 4px; }
.sort-btn {
  width: 24px; height: 24px;
  border: 1px solid #d9d9d9; background: #fff;
  border-radius: 4px; cursor: pointer;
  font-size: 12px; color: #666;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.sort-btn:hover:not(:disabled) { border-color: #1890ff; color: #1890ff; }
.sort-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.sort-num { font-size: 13px; font-weight: 500; color: #333; min-width: 20px; text-align: center; }

/* 置顶 */
.top-btn {
  background: none; border: 1px solid #d9d9d9;
  border-radius: 4px; cursor: pointer;
  padding: 2px 6px; font-size: 14px; transition: all 0.2s;
}
.top-btn.active { border-color: #faad14; background: #fffbe6; }

/* 表格 */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}
.data-table th {
  background: #f9fafb;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e8e8e8;
  font-size: 12px;
}
.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}
.data-table tbody tr:hover { background: #f9fafb; }
.row-expired { opacity: 0.55; }
.row-expired:hover { opacity: 0.75; }

.user-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
.avatar-placeholder { font-size: 20px; }

.w-id { font-family: monospace; font-size: 12px; color: #9ca3af; }
.w-time { font-size: 12px; color: #6b7280; white-space: nowrap; }
.no-time { color: #bfbfbf; }
.time-sep { color: #d9d9d9; margin: 0 4px; }

/* 状态标签 */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
}
.badge-active { background: #f0fdf4; color: #15803d; }
.badge-expired { background: #f9fafb; color: #9ca3af; }

/* 按钮 */
.action-btn {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}
.action-btn:hover { border-color: #1677ff; color: #1677ff; }
.delete-btn { color: #dc2626; font-weight: 600; transition: none; }
.delete-btn:hover { color: #dc2626; background: #fff; border-color: #d9d9d9; }

/* 空状态 */
.empty-hint { text-align: center; padding: 40px 20px; color: #999; font-size: 14px; }

/* 通用 */
.toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.search-bar { flex: 1; }
.add-btn {
  padding: 7px 16px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}
.add-btn:hover { background: #2563eb; }
.add-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.form-input {
  padding: 7px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}
.form-input:focus { border-color: #1677ff; }
.btn-outline-sm {
  padding: 7px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  color: #4b5563;
  transition: all 0.2s;
}
.btn-outline-sm:hover { border-color: #1677ff; color: #1677ff; }
</style>
