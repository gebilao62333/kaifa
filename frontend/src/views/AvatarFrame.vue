<template>
  <div class="avatar-frame-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">专属头像框</span>
      <span class="placeholder"></span>
    </div>

    <div class="content">
      <div class="preview-card">
        <div class="preview-label">预览效果</div>
        <div class="preview-body">
          <div class="preview-avatar-wrap">
            <div class="frame-preview" :style="selectedFrame.style">
              <img class="preview-avatar" :src="userAvatar" alt="" />
            </div>
            <div class="frame-name-preview">{{ selectedFrame.name }}</div>
          </div>
        </div>
      </div>

      <div class="frame-section" v-for="group in frameGroups" :key="group.name">
        <div class="section-title">{{ group.name }}</div>
        <div class="frame-grid">
          <div
            class="frame-item"
            v-for="frame in group.list"
            :key="frame.id"
            :class="{ active: selectedId === frame.id, locked: frame.locked }"
            @click="selectFrame(frame)"
          >
            <div class="frame-preview" :style="frame.style">
              <img class="frame-avatar" :src="userAvatar" alt="" />
            </div>
            <div class="frame-name">{{ frame.name }}</div>
            <div class="frame-condition" v-if="frame.locked">{{ frame.condition }}</div>
            <div class="frame-check" v-if="!frame.locked && selectedId === frame.id">✓</div>
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

const userAvatar = ref('https://picsum.photos/200/200')
const selectedId = ref('frame1')

const selectedFrame = reactive({
  name: '经典金边',
  style: {
    border: '3px solid #ffd700',
    borderRadius: '50%',
    boxShadow: '0 0 12px rgba(255, 215, 0, 0.5), 0 0 0 4px #fff'
  }
})

const frameGroups = ref([
  {
    name: 'VIP专属',
    list: [
      { id: 'frame1', name: '经典金边', style: { border: '3px solid #ffd700', borderRadius: '50%', boxShadow: '0 0 12px rgba(255, 215, 0, 0.5), 0 0 0 4px #fff' }, locked: false },
      { id: 'frame2', name: '玫瑰金边', style: { border: '3px solid #e84393', borderRadius: '50%', boxShadow: '0 0 12px rgba(232, 67, 147, 0.5), 0 0 0 4px #fff' }, locked: false },
      { id: 'frame3', name: '冰雪蓝边', style: { border: '3px solid #74b9ff', borderRadius: '50%', boxShadow: '0 0 12px rgba(116, 185, 255, 0.5), 0 0 0 4px #fff' }, locked: true, condition: 'VIP2及以上' },
      { id: 'frame4', name: '暗夜紫边', style: { border: '3px solid #6c5ce7', borderRadius: '50%', boxShadow: '0 0 12px rgba(108, 92, 231, 0.5), 0 0 0 4px #fff' }, locked: true, condition: 'VIP3及以上' },
      { id: 'frame5', name: '烈焰红边', style: { border: '3px solid #e74c3c', borderRadius: '50%', boxShadow: '0 0 16px rgba(231, 76, 60, 0.6), 0 0 0 4px #fff' }, locked: true, condition: 'VIP4' },
      { id: 'frame6', name: '流光幻彩', style: { border: '3px solid transparent', borderRadius: '50%', boxShadow: '0 0 16px rgba(102, 126, 234, 0.6), 0 0 0 4px #fff', background: 'linear-gradient(135deg, #667eea, #764ba2, #ffd700, #ff6b6b) padding-box, linear-gradient(135deg, #667eea, #764ba2, #ffd700, #ff6b6b) border-box' }, locked: true, condition: 'VIP4' }
    ]
  },
  {
    name: '等级边框',
    list: [
      { id: 'frame7', name: '青铜边框', style: { border: '3px solid #cd7f32', borderRadius: '50%', boxShadow: '0 0 8px rgba(205, 127, 50, 0.4)' }, locked: false },
      { id: 'frame8', name: '白银边框', style: { border: '3px solid #c0c0c0', borderRadius: '50%', boxShadow: '0 0 8px rgba(192, 192, 192, 0.4)' }, locked: true, condition: '等级达到15级' },
      { id: 'frame9', name: '黄金边框', style: { border: '4px solid #ffd700', borderRadius: '50%', boxShadow: '0 0 12px rgba(255, 215, 0, 0.5)' }, locked: true, condition: '等级达到25级' },
      { id: 'frame10', name: '钻石边框', style: { border: '4px solid #b9f2ff', borderRadius: '50%', boxShadow: '0 0 14px rgba(185, 242, 255, 0.5), inset 0 0 10px rgba(185, 242, 255, 0.2)' }, locked: true, condition: '等级达到35级' },
      { id: 'frame11', name: '王者边框', style: { border: '5px solid #e74c3c', borderRadius: '50%', boxShadow: '0 0 20px rgba(231, 76, 60, 0.5), 0 0 40px rgba(231, 76, 60, 0.2)' }, locked: true, condition: '等级达到50级' }
    ]
  },
  {
    name: '成就边框',
    list: [
      { id: 'frame12', name: '人气边框', style: { border: '3px solid #fd79a8', borderRadius: '50%', boxShadow: '0 0 10px rgba(253, 121, 168, 0.4)' }, locked: false },
      { id: 'frame13', name: '神壕边框', style: { border: '4px solid #ffd700', borderRadius: '50%', boxShadow: '0 0 20px rgba(255, 215, 0, 0.6), 0 0 0 3px #fff' }, locked: true, condition: '累计充值满10000' },
      { id: 'frame14', name: '大神边框', style: { border: '4px solid #00cec9', borderRadius: '50%', boxShadow: '0 0 14px rgba(0, 206, 201, 0.5), 0 0 0 3px #f0f0f0' }, locked: true, condition: '完成100单陪玩' },
      { id: 'frame15', name: '元老边框', style: { border: '4px solid #636e72', borderRadius: '50%', boxShadow: '0 0 10px rgba(99, 110, 114, 0.4), 0 0 0 3px #ffd700' }, locked: true, condition: '注册满365天' }
    ]
  }
])

const goBack = () => {
  router.back()
}

const selectFrame = (frame) => {
  if (frame.locked) {
    alert(`解锁条件：${frame.condition}`)
    return
  }
  selectedId.value = frame.id
  selectedFrame.name = frame.name
  selectedFrame.style = { ...frame.style }
  localStorage.setItem('selectedAvatarFrame', JSON.stringify({ id: frame.id, name: frame.name, style: frame.style }))
}
</script>

<style scoped>
.avatar-frame-page {
  min-height: 100vh;
  background-color: #f5f5f5;
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
  border-radius: 16px;
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
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea08, #764ba208);
  border-radius: 12px;
  padding: 30px;
}

.preview-avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.frame-preview {
  width: 100px;
  height: 100px;
  border-radius: 10px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.preview-avatar {
  width: 94px;
  height: 94px;
  border-radius: 10px;
  object-fit: cover;
}

.frame-avatar {
  width: 94px;
  height: 94px;
  border-radius: 50%;
  object-fit: cover;
}

.frame-name-preview {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.frame-section {
  margin-bottom: 20px;
}

.frame-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.frame-item {
  background: white;
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
  border: 2px solid transparent;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.frame-item.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.03);
}

.frame-item.locked {
  opacity: 0.55;
}

.frame-item:active {
  transform: scale(0.97);
}

.frame-item .frame-preview {
  width: 72px;
  height: 72px;
  margin: 0 auto 10px;
}

.frame-item .frame-avatar {
  width: 66px;
  height: 66px;
  border-radius: 10px;
  object-fit: cover;
}

.frame-name {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.frame-condition {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.frame-check {
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
