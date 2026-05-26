<template>
  <div class="identity-badge-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">身份标识</span>
      <span class="placeholder"></span>
    </div>

    <div class="content">
      <div class="preview-card">
        <div class="preview-label">预览效果</div>
        <div class="preview-body">
          <img class="preview-avatar" :src="userAvatar" alt="" />
          <div class="preview-info">
            <div class="preview-name-row">
              <span class="preview-name">{{ userName }}</span>
              <span class="preview-level">Lv.15</span>
              <span class="preview-badge" :style="selectedBadge.style">{{ selectedBadge.label }}</span>
            </div>
            <div class="preview-desc">昵称旁显示的标识效果</div>
          </div>
        </div>
      </div>

      <div class="current-badge">
        <div class="badge-label">当前使用</div>
        <div class="badge-display">
          <span class="badge-tag" :style="selectedBadge.style">
            <span class="badge-tag-icon">{{ selectedBadge.icon }}</span>
            {{ selectedBadge.label }}
          </span>
          <span class="badge-hint">点击下方标识可切换</span>
        </div>
      </div>

      <div class="badge-section" v-for="group in badgeGroups" :key="group.name">
        <div class="section-title">{{ group.name }}</div>
        <div class="badge-grid">
          <div
            class="badge-item"
            v-for="badge in group.list"
            :key="badge.id"
            :class="{ active: selectedId === badge.id, locked: badge.locked }"
            @click="selectBadge(badge)"
          >
            <div class="badge-preview">
              <span class="badge-tag" :style="badge.style">
                <span class="badge-tag-icon">{{ badge.icon }}</span>
                {{ badge.label }}
              </span>
            </div>
            <div class="badge-name">{{ badge.name }}</div>
            <div class="badge-condition" v-if="badge.locked">{{ badge.condition }}</div>
            <div class="badge-check" v-if="!badge.locked && selectedId === badge.id">✓</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const userName = ref('多客用户')
const userAvatar = ref('https://picsum.photos/200/200')
const selectedId = ref('vip2')

const selectedBadge = reactive({
  label: 'VIP2',
  icon: '👑',
  style: { background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#fff' }
})

const badgeGroups = ref([
  {
    name: 'VIP标识',
    list: [
      { id: 'vip1', name: 'VIP1', label: 'VIP1', icon: '👑', style: { background: 'linear-gradient(135deg, #a8e063, #56ab2f)', color: '#fff' }, locked: false },
      { id: 'vip2', name: 'VIP2', label: 'VIP2', icon: '👑', style: { background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#fff' }, locked: false },
      { id: 'vip3', name: 'VIP3', label: 'VIP3', icon: '👑', style: { background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)', color: '#fff' }, locked: true, condition: 'VIP3及以上' },
      { id: 'vip4', name: 'VIP4', label: 'VIP4', icon: '👑', style: { background: 'linear-gradient(135deg, #e74c3c, #c0392b)', color: '#fff' }, locked: true, condition: 'VIP4及以上' }
    ]
  },
  {
    name: '等级标识',
    list: [
      { id: 'lv10', name: '10级达人', label: 'Lv.10', icon: '⭐', style: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff' }, locked: false },
      { id: 'lv20', name: '20级达人', label: 'Lv.20', icon: '⭐', style: { background: 'linear-gradient(135deg, #f093fb, #f5576c)', color: '#fff' }, locked: true, condition: '等级达到20级' },
      { id: 'lv30', name: '30级达人', label: 'Lv.30', icon: '🔥', style: { background: 'linear-gradient(135deg, #4facfe, #00f2fe)', color: '#fff' }, locked: true, condition: '等级达到30级' },
      { id: 'lv50', name: '50级大神', label: 'Lv.50', icon: '💎', style: { background: 'linear-gradient(135deg, #fccb90, #d57eeb)', color: '#fff' }, locked: true, condition: '等级达到50级' }
    ]
  },
  {
    name: '身份标识',
    list: [
      { id: 'renqi', name: '人气达人', label: '人气达人', icon: '🌟', style: { background: 'linear-gradient(135deg, #fa709a, #fee140)', color: '#fff' }, locked: false },
      { id: 'shengou', name: '神壕', label: '神壕', icon: '💰', style: { background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#fff' }, locked: true, condition: '累计充值满10000' },
      { id: 'xianzhi', name: '资深玩家', label: '资深玩家', icon: '🎮', style: { background: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', color: '#fff' }, locked: false },
      { id: 'kaiche', name: '开车老司机', label: '老司机', icon: '🚗', style: { background: 'linear-gradient(135deg, #ffecd2, #fcb69f)', color: '#fff' }, locked: true, condition: '在线时长满1000小时' }
    ]
  },
  {
    name: '成就标识',
    list: [
      { id: 'cheng1', name: '社交达人', label: '社交达人', icon: '💬', style: { background: 'linear-gradient(135deg, #89f7fe, #66a6ff)', color: '#fff' }, locked: false },
      { id: 'cheng2', name: '上分高手', label: '上分高手', icon: '🏆', style: { background: 'linear-gradient(135deg, #fddb92, #d1fdff)', color: '#fff' }, locked: true, condition: '完成50单陪玩' },
      { id: 'cheng3', name: '全能陪玩', label: '全能陪玩', icon: '🎯', style: { background: 'linear-gradient(135deg, #c1f1c6, #8ed1fc)', color: '#fff' }, locked: true, condition: '开通3个以上服务' },
      { id: 'cheng4', name: '人气主播', label: '人气主播', icon: '🎤', style: { background: 'linear-gradient(135deg, #f6d365, #fda085)', color: '#fff' }, locked: true, condition: '获赞超过10000' }
    ]
  }
])

const goBack = () => {
  router.back()
}

const selectBadge = (badge) => {
  if (badge.locked) {
    alert(`解锁条件：${badge.condition}`)
    return
  }
  selectedId.value = badge.id
  selectedBadge.label = badge.label
  selectedBadge.icon = badge.icon
  selectedBadge.style = badge.style
  localStorage.setItem('selectedBadge', JSON.stringify({ id: badge.id, label: badge.label, icon: badge.icon, style: badge.style }))
}
</script>

<style scoped>
.identity-badge-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.back-btn,
.placeholder {
  width: 40px;
  font-size: 20px;
  color: white;
  cursor: pointer;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.content {
  padding: 16px;
}

.preview-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
}

.preview-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.preview-body {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
}

.preview-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}

.preview-info {
  flex: 1;
}

.preview-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.preview-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.preview-level {
  font-size: 11px;
  font-weight: 600;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
}

.preview-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 10px;
  transition: all 0.3s;
}

.preview-desc {
  font-size: 12px;
  color: #999;
}

.current-badge {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.badge-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.badge-tag {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.badge-tag-icon {
  font-size: 14px;
}

.badge-hint {
  font-size: 11px;
  color: #ccc;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.badge-section {
  margin-bottom: 20px;
}

.badge-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.badge-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border: 2px solid transparent;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.badge-item.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.03);
}

.badge-item.locked {
  opacity: 0.6;
}

.badge-item:active {
  transform: scale(0.97);
}

.badge-preview {
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
}

.badge-name {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.badge-condition {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.badge-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: bold;
}
</style>
