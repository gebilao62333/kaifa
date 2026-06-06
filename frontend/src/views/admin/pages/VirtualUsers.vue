<template>
  <div class="admin-card">
    <div class="toolbar">
      <div class="search-bar">
        <input v-model="searchKeyword" type="text" placeholder="搜索昵称" class="search-input" />
        <button @click="loadVirtualUsers" class="search-btn">搜索</button>
        <button @click="openCreateModal" class="add-btn">添加机器人</button>
        <button @click="openBatchModal" class="add-btn batch-btn">📦 批量添加</button>
        <button @click="exportData" class="export-btn">📥 导出CSV</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <table v-else-if="virtualUserList.length > 0" class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>头像</th>
          <th>昵称</th>
          <th>角色</th>
          <th>对话风格</th>
          <th>状态</th>
          <th>在线状态</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in virtualUserList" :key="user.id">
          <td>{{ user.id }}</td>
          <td>
            <img v-if="user.avatar" :src="user.avatar" class="user-avatar" style="width:32px;height:32px;" />
            <span v-else class="avatar-placeholder" style="width:32px;height:32px;font-size:16px;">🤖</span>
          </td>
          <td>{{ user.nickname }}</td>
          <td>{{ getRoleName(user.role) }}</td>
          <td>{{ getStyleName(user.dialogueStyle) }}</td>
          <td>
            <span :class="['status-badge', user.status === 1 ? 'active' : 'disabled']">
              {{ user.status === 1 ? '启用' : '禁用' }}
            </span>
          </td>
          <td>
            <span :class="['status-badge', user.isOnline === 1 ? 'active' : 'disabled']">
              {{ user.isOnline === 1 ? '在线' : '离线' }}
            </span>
          </td>
          <td>{{ formatTime(user.createTime) }}</td>
          <td>
            <button @click="editUser(user)" class="action-btn">编辑</button>
            <button @click="toggleStatus(user)" class="action-btn">
              {{ user.status === 1 ? '禁用' : '启用' }}
            </button>
            <button @click="deleteUser(user)" class="action-btn delete-btn">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && virtualUserList.length === 0" class="empty-state">
      <div class="empty-icon">🤖</div>
      <div class="empty-text">暂无虚拟用户数据</div>
    </div>

    <div class="pagination">
      <div class="pagination-left">
        <span class="page-size-label">每页</span>
        <select v-model.number="pageSize" @change="page = 1; loadVirtualUsers()" class="page-size-select">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span class="page-size-label">条，共 {{ total }} 条</span>
      </div>
      <div class="pagination-right">
        <button @click="page = 1; loadVirtualUsers()" class="page-btn" :disabled="page <= 1">首页</button>
        <button @click="page--; loadVirtualUsers()" class="page-btn" :disabled="page <= 1">上一页</button>
        <template v-for="p in pageNumbers" :key="p">
          <span v-if="p === '...'" class="page-ellipsis">...</span>
          <button v-else @click="page = p; loadVirtualUsers()" :class="['page-btn', { 'page-active': page === p }]">{{ p }}</button>
        </template>
        <button @click="page++; loadVirtualUsers()" class="page-btn" :disabled="page >= totalPages">下一页</button>
        <button @click="page = totalPages; loadVirtualUsers()" class="page-btn" :disabled="page >= totalPages">末页</button>
      </div>
    </div>

    <!-- 添加/编辑机器人模态框 -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ currentVirtualUser.id ? '编辑机器人' : '添加机器人' }}</h3>
          <button @click="showModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>昵称</label>
            <div class="input-with-random">
              <input v-model="currentVirtualUser.nickname" type="text" class="form-input" />
              <button type="button" class="random-btn" @click="currentVirtualUser.nickname = randomNickname()" title="随机生成">🎲</button>
            </div>
          </div>
          <div class="form-group">
            <label>头像URL</label>
            <input v-model="currentVirtualUser.avatar" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>角色</label>
            <select v-model="currentVirtualUser.role" class="form-input">
              <option value="companion">陪玩师</option>
              <option value="normal">普通用户</option>
              <option value="robot">机器人</option>
            </select>
          </div>
          <div class="form-group">
            <label>对话风格 <span class="tag-limit">(多选，最多5个)</span></label>
            <div class="style-tags">
              <span
                v-for="opt in styleOptions"
                :key="opt.value"
                :class="['style-tag', { active: selectedStyles.includes(opt.value) }]"
                @click="toggleStyle(opt.value)"
              >
                {{ opt.label }}
              </span>
            </div>
            <div v-if="selectedStyles.length >= 5" class="hint">已选满5个风格</div>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model.number="currentVirtualUser.status" class="form-input">
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </div>
          <div class="form-group">
            <label>在线状态</label>
            <select v-model.number="currentVirtualUser.isOnline" class="form-input">
              <option :value="1">在线</option>
              <option :value="0">离线</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showModal = false" class="cancel-btn">取消</button>
          <button @click="saveUser" class="confirm-btn">确认</button>
        </div>
      </div>
    </div>

    <!-- 批量添加机器人模态框 -->
    <div v-if="showBatchModal" class="modal-overlay" @click.self="showBatchModal = false">
      <div class="modal-content batch-modal">
        <div class="modal-header">
          <h3>📦 批量添加机器人</h3>
          <button @click="showBatchModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>添加数量</label>
              <input v-model.number="batchCount" type="number" min="1" max="100" class="form-input" />
            </div>
            <div class="form-group">
              <label>角色</label>
              <select v-model="batchRole" class="form-input">
                <option value="companion">陪玩师</option>
                <option value="normal">普通用户</option>
                <option value="robot">机器人</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>状态</label>
              <select v-model.number="batchStatus" class="form-input">
                <option :value="1">启用</option>
                <option :value="0">禁用</option>
              </select>
            </div>
            <div class="form-group">
              <label>在线状态</label>
              <select v-model.number="batchOnline" class="form-input">
                <option :value="1">在线</option>
                <option :value="0">离线</option>
              </select>
            </div>
          </div>
          <div class="batch-preview" v-if="batchPreview.length > 0">
            <label>预览 (随机昵称 + 随机5个风格)：</label>
            <div class="batch-list">
              <div v-for="(item, idx) in batchPreview" :key="idx" class="batch-item">
                <span class="batch-index">{{ idx + 1 }}</span>
                <span class="batch-name">{{ item.nickname }}</span>
                <span class="batch-styles">{{ item.styles }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <span class="batch-progress" v-if="batchCreating">{{ batchProgress }}</span>
          <button @click="showBatchModal = false" class="cancel-btn" :disabled="batchCreating">取消</button>
          <button @click="batchCreate" class="confirm-btn" :disabled="batchCreating">
            {{ batchCreating ? '创建中...' : '批量创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { page, pageSize, total, totalPages, pageNumbers, formatTime, apiGet, apiPost, apiPut, apiDelete, exportCSV, toast, confirm } = useAdmin()

const virtualUserList = ref([])
const searchKeyword = ref('')
const currentVirtualUser = ref(null)
const showModal = ref(false)
const loading = ref(false)

// 对话风格多选
const styleOptions = [
  { value: 'friendly', label: '友好亲切' },
  { value: 'professional', label: '专业严谨' },
  { value: 'humorous', label: '幽默风趣' },
  { value: 'cute', label: '可爱俏皮' },
  { value: 'warm', label: '温柔体贴' },
  { value: 'passionate', label: '热情开朗' },
  { value: 'mature', label: '成熟稳重' },
  { value: 'lively', label: '活泼阳光' },
  { value: 'elegant', label: '优雅大方' },
  { value: 'cool', label: '高冷酷拽' },
  { value: 'caring', label: '暖心关怀' },
  { value: 'witty', label: '机智健谈' },
  { value: 'calm', label: '沉稳内敛' },
  { value: 'easygoing', label: '风趣随和' },
  { value: 'intellectual', label: '知性优雅' },
  { value: 'bold', label: '豪爽直率' },
  { value: 'artistic', label: '文艺清新' },
  { value: 'bossy', label: '霸道总裁' },
  { value: 'brotherly', label: '邻家大哥' },
  { value: 'sweetheart', label: '软萌甜心' },
  { value: 'tsundere', label: '腹黑傲娇' },
  { value: 'free', label: '潇洒不羁' },
  { value: 'gentle', label: '温文尔雅' },
  { value: 'sunny', label: '阳光开朗' },
  { value: 'mysterious', label: '神秘莫测' },
  { value: 'sincere', label: '真诚朴实' },
  { value: 'chatty', label: '话痨社牛' },
  { value: 'composed', label: '淡定从容' },
  { value: 'kind', label: '热心肠' },
  { value: 'sarcastic', label: '毒舌吐槽' },
  { value: 'devoted', label: '痴情专一' },
  { value: 'carefree', label: '洒脱自由' },
]
const selectedStyles = ref([])

// 随机选5个风格标签
const randomStyles = () => {
  const shuffled = [...styleOptions].sort(() => Math.random() - 0.5)
  selectedStyles.value = shuffled.slice(0, 5).map(s => s.value)
}

// 生成随机风格字符串（用于批量预览）
const genRandomStyleLabel = () => {
  const shuffled = [...styleOptions].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 5).map(s => s.label).join('、')
}

// 生成随机风格值字符串（用于批量提交）
const genRandomStyleValue = () => {
  const shuffled = [...styleOptions].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 5).map(s => s.value).join(',')
}

// 批量添加
const showBatchModal = ref(false)
const batchCount = ref(10)
const batchRole = ref('companion')
const batchStatus = ref(1)
const batchOnline = ref(0)
const batchPreview = ref([])
const batchCreating = ref(false)
const batchProgress = ref('')

const openBatchModal = () => {
  batchCount.value = 10
  batchRole.value = 'companion'
  batchStatus.value = 1
  batchOnline.value = 0
  batchPreview.value = []
  batchCreating.value = false
  batchProgress.value = ''
  refreshBatchPreview()
  showBatchModal.value = true
}

// 监听数量变化，刷新预览
const refreshBatchPreview = () => {
  const count = Math.min(Math.max(parseInt(batchCount.value) || 1, 1), 100)
  batchCount.value = count
  batchPreview.value = Array.from({ length: count }, () => ({
    nickname: randomNickname(),
    styles: genRandomStyleLabel()
  }))
}

const batchCreate = async () => {
  const count = Math.min(Math.max(parseInt(batchCount.value) || 1, 1), 100)
  batchCount.value = count
  batchCreating.value = true
  let success = 0
  let fail = 0

  for (let i = 0; i < count; i++) {
    batchProgress.value = `正在创建 ${i + 1}/${count}...`
    try {
      const data = {
        nickname: randomNickname(),
        avatar: '',
        role: batchRole.value,
        dialogueStyle: genRandomStyleValue(),
        status: batchStatus.value,
        isOnline: batchOnline.value
      }
      const res = await apiPost('/api/admin/virtual-users', data)
      if (res.code === 200) {
        success++
      } else {
        fail++
      }
    } catch (err) {
      fail++
      console.error('批量创建失败:', err)
    }
  }

  batchCreating.value = false
  batchProgress.value = ''
  toast(`批量创建完成！成功 ${success} 个，失败 ${fail} 个`)
  showBatchModal.value = false
  loadVirtualUsers()
}

const toggleStyle = (value) => {
  const idx = selectedStyles.value.indexOf(value)
  if (idx > -1) {
    selectedStyles.value.splice(idx, 1)
  } else if (selectedStyles.value.length < 5) {
    selectedStyles.value.push(value)
  }
}

// 随机昵称生成
const familyNames = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨', '朱', '秦', '尤', '许', '何', '吕', '施', '张', '孔', '曹', '严', '华', '金', '魏', '陶', '姜', '谢', '苏', '潘', '葛', '范', '彭', '鲁', '马', '柳', '黄', '萧', '狄', '宋', '乔', '谭', '钟', '徐', '邱', '高', '林', '蔡', '田', '樊', '胡', '凌', '霍', '万', '柯']
const maleNames = ['伟', '强', '磊', '军', '勇', '杰', '涛', '明', '辉', '鹏', '彬', '宇', '浩', '然', '博', '文', '刚', '超', '飞', '龙', '峰', '亮', '洋', '威', '健', '鑫', '安', '帅', '杰', '宇', '博', '毅', '恒', '霖', '彦', '宸', '诺', '誉', '豪', '瑞']
const femaleNames = ['芳', '敏', '静', '丽', '婷', '雪', '娟', '艳', '洁', '琳', '倩', '怡', '慧', '颖', '瑶', '晓', '彤', '月', '梦', '萱', '娜', '莉', '欣', '雨', '悦', '莹', '雅', '云', '佳', '宁', '菲', '妍', '莎', '丹', '茜', '媛', '蕾', '柳', '霜', '婉']
const nickPrefixes = ['快乐的', '安静的', '懒懒的', '可爱的', '酷酷的', '温柔的', '阳光的', '甜甜的', '努力的', '佛系的', '呆萌的', '热心的', '幸运的', '治愈的', '优雅的', '元气', '软萌', '高冷', '暖心的', '浪漫的']
const nickAnimals = ['小猫', '小兔', '小熊', '小鹿', '小鱼', '小鸟', '小熊猫', '小柯基', '小柴犬', '小海豚', '小仓鼠', '小奶猫', '布偶猫', '金毛', '柴犬', '橘猫', '狸花', '企鹅', '考拉', '树懒']

const randomInt = (max) => Math.floor(Math.random() * max)

const randomNickname = () => {
  const useRealName = Math.random() > 0.5
  if (useRealName) {
    const family = familyNames[randomInt(familyNames.length)]
    const pool = Math.random() > 0.5 ? maleNames : femaleNames
    const given = pool[randomInt(pool.length)] + (Math.random() > 0.7 ? pool[randomInt(pool.length)] : '')
    return family + given
  } else {
    const prefix = nickPrefixes[randomInt(nickPrefixes.length)]
    const animal = nickAnimals[randomInt(nickAnimals.length)]
    return prefix + animal
  }
}

const getRoleName = (role) => {
  const map = {
    'companion': '陪玩师',
    'normal': '普通用户',
    'robot': '机器人'
  }
  return map[role] || '普通用户'
}

const getStyleName = (style) => {
  const map = {
    'friendly': '友好亲切',
    'cold': '高冷淡漠',
    'humorous': '幽默风趣',
    'cute': '可爱俏皮',
    'professional': '专业严谨',
    'warm': '温柔体贴',
    'passionate': '热情开朗',
    'mature': '成熟稳重',
    'lively': '活泼阳光',
    'elegant': '优雅大方',
    'cool': '高冷酷拽',
    'caring': '暖心关怀',
    'witty': '机智健谈',
  }
  if (!style) return ''
  const arr = Array.isArray(style) ? style : String(style).split(',').filter(Boolean)
  return arr.map(s => map[s] || s).join('、')
}

const loadVirtualUsers = async () => {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (searchKeyword.value) { params.keyword = searchKeyword.value }
    const res = await apiGet('/api/admin/virtual-users', params)
    if (res.code === 200) {
      virtualUserList.value = res.data?.list || []
      total.value = res.data?.pagination?.total || 0
    }
  } catch (err) {
    console.error('加载虚拟用户失败:', err)
    toast('加载虚拟用户失败', 'error')
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  currentVirtualUser.value = {
    nickname: randomNickname(),
    avatar: '',
    role: 'companion',
    dialogueStyle: '',
    status: 1,
    isOnline: 0
  }
  randomStyles()
  showModal.value = true
}

const editUser = (user) => {
  currentVirtualUser.value = { ...user }
  selectedStyles.value = user.dialogueStyle ? String(user.dialogueStyle).split(',').filter(Boolean) : []
  showModal.value = true
}

const saveUser = async () => {
  // 同步多选风格到字段
  currentVirtualUser.value.dialogueStyle = selectedStyles.value.join(',')
  try {
    let res
    if (currentVirtualUser.value.id) {
      res = await apiPut('/api/admin/virtual-users/' + currentVirtualUser.value.id, currentVirtualUser.value)
    } else {
      res = await apiPost('/api/admin/virtual-users', currentVirtualUser.value)
    }
    if (res.code === 200) {
      showModal.value = false
      loadVirtualUsers()
    }
  } catch (err) {
    console.error('保存虚拟用户失败:', err)
  }
}

const toggleStatus = async (user) => {
  try {
    const res = await apiPut('/api/admin/virtual-users/' + user.id, {
      ...user,
      status: user.status === 1 ? 0 : 1
    })
    if (res.code === 200) {
      loadVirtualUsers()
    }
  } catch (err) {
    console.error('切换状态失败:', err)
  }
}

const deleteUser = async (user) => {
  if (!(await confirm('确定要删除这个用户吗？'))) return
  try {
    const res = await apiDelete('/api/admin/virtual-users/' + user.id)
    if (res.code === 200) {
      toast('用户已删除')
      loadVirtualUsers()
    } else {
      toast(res.message || '操作失败', 'error')
    }
  } catch (err) {
    console.error('删除用户失败:', err)
    toast('删除用户失败', 'error')
  }
}

const exportData = () => {
  exportCSV(virtualUserList.value, [
    { label: 'ID', key: 'id' },
    { label: '昵称', key: 'nickname' },
    { label: '角色', key: row => getRoleName(row.role) },
    { label: '对话风格', key: row => getStyleName(row.dialogueStyle) },
    { label: '状态', key: row => row.status === 1 ? '启用' : '禁用' },
    { label: '在线状态', key: row => row.isOnline === 1 ? '在线' : '离线' },
    { label: '创建时间', key: row => formatTime(row.createTime) }
  ], 'virtual_users')
}

watch(batchCount, () => {
  if (showBatchModal.value) refreshBatchPreview()
})

onMounted(() => {
  loadVirtualUsers()
})
</script>

<style scoped>
.tag-limit {
  font-weight: 400;
  font-size: 12px;
  color: #999;
}

.style-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.style-tag {
  display: inline-block;
  padding: 6px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  background: #fafafa;
  color: #666;
}

.style-tag:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.style-tag.active {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.hint {
  margin-top: 6px;
  font-size: 12px;
  color: #ff9800;
}

.input-with-random {
  display: flex;
  gap: 6px;
  align-items: center;
}

.input-with-random .form-input {
  flex: 1;
}

.random-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.random-btn:hover {
  border-color: #1890ff;
  background: #e6f7ff;
  transform: rotate(15deg);
}

.batch-btn {
  background: #52c41a !important;
  border-color: #52c41a !important;
}
.batch-btn:hover {
  background: #73d13d !important;
}

.batch-modal .modal-content {
  max-height: 90vh;
}

.form-row {
  display: flex;
  gap: 12px;
}
.form-row .form-group {
  flex: 1;
}

.batch-preview {
  margin-top: 16px;
}
.batch-preview > label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.batch-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 4px;
}

.batch-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 13px;
}
.batch-item:nth-child(even) {
  background: #fafafa;
}

.batch-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #1890ff;
  color: #fff;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.batch-name {
  font-weight: 600;
  min-width: 80px;
  color: #333;
}

.batch-styles {
  color: #888;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batch-progress {
  font-size: 13px;
  color: #1890ff;
  margin-right: auto;
}
</style>
