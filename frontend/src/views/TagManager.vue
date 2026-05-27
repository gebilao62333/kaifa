<template>
  <div class="tag-manager-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">标签管理</span>
      <span class="add-btn" @click="showAddDialog">+</span>
    </div>

    <div class="category-tabs">
      <div
        v-for="tab in categoryTabs"
        :key="tab.key"
        :class="['tab-item', { active: activeTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </div>
    </div>

    <div class="tag-list">
      <div v-for="tag in filteredTags" :key="tag.id" class="tag-item">
        <div class="tag-info">
          <span class="tag-name">{{ tag.name }}</span>
          <span class="tag-category">{{ getCategoryName(tag.category) }}</span>
          <span class="tag-desc" v-if="tag.description">{{ tag.description }}</span>
        </div>
        <div class="tag-actions">
          <span class="action-btn edit" @click="editTag(tag)">编辑</span>
          <span class="action-btn delete" @click="deleteTag(tag)">删除</span>
        </div>
      </div>

      <div class="loading-state" v-if="loading">
        <div class="loading-text">加载中...</div>
      </div>

      <div class="empty-state" v-if="!loading && filteredTags.length === 0">
        <div class="empty-icon">🏷️</div>
        <div class="empty-text">暂无标签</div>
        <div class="empty-hint">点击右上角 + 创建标签</div>
      </div>
    </div>

    <div class="bottom-tip" v-if="!loading && filteredTags.length > 0">
      共 {{ filteredTags.length }} 个标签
    </div>

    <div class="dialog-overlay" v-if="showDialog" @click="closeDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <span>{{ isEditing ? '编辑标签' : '创建标签' }}</span>
          <span class="close-btn" @click="closeDialog">×</span>
        </div>
        <div class="dialog-body">
          <div class="form-item">
            <label>标签名称</label>
            <input v-model="formData.name" placeholder="请输入标签名称" />
          </div>
          <div class="form-item">
            <label>分类</label>
            <select v-model="formData.category">
              <option value="">请选择分类</option>
              <option value="personality">性格类</option>
              <option value="expertise">专业领域类</option>
              <option value="style">风格类</option>
              <option value="scenario">场景类</option>
            </select>
          </div>
          <div class="form-item">
            <label>描述</label>
            <textarea v-model="formData.description" placeholder="请输入标签描述" rows="3"></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn cancel" @click="closeDialog">取消</button>
          <button class="btn confirm" @click="submitForm" :disabled="!formData.name || !formData.category">
            确定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginManager } from '../composables/useLoginManager'
import { tagService } from '../services/tagService'

const router = useRouter()
const { requireLogin } = useLoginManager()
const activeTab = ref('all')
const loading = ref(false)
const showDialog = ref(false)
const isEditing = ref(false)
const allTags = ref([])
const formData = ref({
  id: null,
  name: '',
  category: '',
  description: ''
})

const categoryTabs = [
  { key: 'all', label: '全部' },
  { key: 'personality', label: '性格' },
  { key: 'expertise', label: '专业' },
  { key: 'style', label: '风格' },
  { key: 'scenario', label: '场景' }
]

const getCategoryName = (category) => {
  const map = {
    'personality': '性格类',
    'expertise': '专业领域类',
    'style': '风格类',
    'scenario': '场景类'
  }
  return map[category] || category
}

const filteredTags = computed(() => {
  if (activeTab.value === 'all') {
    return allTags.value
  }
  return allTags.value.filter(tag => tag.category === activeTab.value)
})

const loadTags = async () => {
  loading.value = true
  try {
    const res = await tagService.getTags()
    if (res.data && res.data.list) {
      allTags.value = res.data.list
    } else if (Array.isArray(res.data)) {
      allTags.value = res.data
    }
  } catch (error) {
    console.error('加载标签失败:', error)
  } finally {
    loading.value = false
  }
}

const switchTab = (key) => {
  activeTab.value = key
}

const showAddDialog = () => {
  isEditing.value = false
  formData.value = { id: null, name: '', category: '', description: '' }
  showDialog.value = true
}

const editTag = (tag) => {
  isEditing.value = true
  formData.value = { ...tag }
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
}

const submitForm = async () => {
  const loginResult = await requireLogin()
  if (!loginResult.loggedIn) {
    return
  }

  try {
    if (isEditing.value) {
      await tagService.updateTag(formData.value.id, {
        name: formData.value.name,
        category: formData.value.category,
        description: formData.value.description
      })
    } else {
      await tagService.createTag({
        name: formData.value.name,
        category: formData.value.category,
        description: formData.value.description
      })
    }
    closeDialog()
    loadTags()
  } catch (error) {
    console.error('保存标签失败:', error)
  }
}

const deleteTag = async (tag) => {
  if (!confirm(`确定删除标签"${tag.name}"吗？`)) return
  try {
    await tagService.deleteTag(tag.id)
    loadTags()
  } catch (error) {
    console.error('删除标签失败:', error)
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadTags()
})
</script>

<style scoped>
.tag-manager-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: #f5f5f5;
  padding-top: 70px;
  padding-bottom: 80px;
  padding-bottom: calc(80px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 70px;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 650px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  z-index: 100;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.back-btn {
  -webkit-tap-highlight-color: transparent;
  font-size: 20px;
  cursor: pointer;
  width: 40px;
  color: white;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.add-btn {
  font-size: 24px;
  color: white;
  cursor: pointer;
  width: 40px;
  text-align: right;
}

.category-tabs {
  display: flex;
  padding: 12px;
  background: #fff;
  gap: 12px;
  overflow-x: auto;
  max-width: 650px;
  margin: 0 auto;
}

.tab-item {
  padding: 6px 14px;
  border-radius: 10px;
  background: #f0f0f0;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
}

.tab-item.active {
  background: #007aff;
  color: #fff;
}

.tag-list {
  background: #fff;
  margin: 8px auto 0;
  max-width: 650px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.tag-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tag-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.tag-category {
  font-size: 11px;
  color: #007aff;
  background: #e8f5e9;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
}

.tag-desc {
  font-size: 12px;
  color: #999;
}

.tag-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  font-size: 13px;
  cursor: pointer;
}

.action-btn.edit {
  color: #007aff;
}

.action-btn.delete {
  color: #ff3b30;
}

.loading-state,
.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.loading-text,
.empty-text {
  font-size: 14px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-hint {
  font-size: 12px;
  color: #bbb;
  margin-top: 8px;
}

.bottom-tip {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: #999;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  width: 85%;
  max-width: 340px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid #eee;
}

.close-btn {
  font-size: 24px;
  color: #999;
  cursor: pointer;
}

.dialog-body {
  padding: 16px;
}

.form-item {
  margin-bottom: 16px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-item label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.form-item input,
.form-item select,
.form-item textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-item textarea {
  resize: none;
}

.dialog-footer {
  display: flex;
  border-top: 1px solid #eee;
}

.dialog-footer .btn {
  flex: 1;
  padding: 14px;
  border: none;
  font-size: 15px;
  cursor: pointer;
}

.dialog-footer .btn.cancel {
  background: #fff;
  color: #666;
  border-right: 1px solid #eee;
}

.dialog-footer .btn.confirm {
  background: #fff;
  color: #007aff;
}

.dialog-footer .btn:disabled {
  color: #ccc;
}
</style>