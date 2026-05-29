<template>
  <div class="team-index">
    <div class="header">
      <div class="header-left" @click="goBack">
        <i class="iconfont icon-back"></i>
      </div>
      <div class="header-title">公会中心</div>
      <div class="header-right"></div>
    </div>

    <div class="content">
      <div class="team-info-card">
        <div class="team-avatar">
          <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=game%20team%20logo%20esports%20professional&image_size=square" alt="公会头像">
        </div>
        <div class="team-details">
          <h3>王者荣耀公会</h3>
          <p class="team-id">公会ID: 888666</p>
          <div class="team-stats">
            <div class="stat-item">
              <span class="stat-value">156</span>
              <span class="stat-label">成员</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">23</span>
              <span class="stat-label">在线</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">4.8</span>
              <span class="stat-label">评分</span>
            </div>
          </div>
        </div>
      </div>

      <div class="menu-grid">
        <div class="menu-item" @click="goTo('member-manage')">
          <div class="menu-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
            <i class="iconfont icon-users"></i>
          </div>
          <span class="menu-text">成员管理</span>
        </div>
        <div class="menu-item" @click="goTo('team-orders')">
          <div class="menu-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
            <i class="iconfont icon-order"></i>
          </div>
          <span class="menu-text">公会订单</span>
        </div>
        <div class="menu-item" @click="goTo('finance')">
          <div class="menu-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">
            <i class="iconfont icon-wallet"></i>
          </div>
          <span class="menu-text">财务中心</span>
        </div>
        <div class="menu-item" @click="goTo('recruit')">
          <div class="menu-icon" style="background: linear-gradient(135deg, #43e97b, #38f9d7);">
            <i class="iconfont icon-add"></i>
          </div>
          <span class="menu-text">招募成员</span>
        </div>
        <div class="menu-item" @click="goTo('team-settings')">
          <div class="menu-icon" style="background: linear-gradient(135deg, #fa709a, #fee140);">
            <i class="iconfont icon-setting"></i>
          </div>
          <span class="menu-text">公会设置</span>
        </div>
        <div class="menu-item" @click="goTo('team-data')">
          <div class="menu-icon" style="background: linear-gradient(135deg, #a8edea, #fed6e3);">
            <i class="iconfont icon-chart"></i>
          </div>
          <span class="menu-text">数据统计</span>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h4>公会公告</h4>
          <span class="more" @click="goTo('notices')">更多</span>
        </div>
        <div class="notice-list">
          <div class="notice-item" v-for="(notice, index) in notices" :key="index">
            <div class="notice-title">{{ notice.title }}</div>
            <div class="notice-time">{{ notice.time }}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h4>今日活跃成员</h4>
          <span class="more" @click="goTo('active-members')">更多</span>
        </div>
        <div class="member-list">
          <div class="member-item" v-for="(member, index) in activeMembers" :key="index">
            <img :src="member.avatar" :alt="member.name" class="member-avatar">
            <div class="member-info">
              <div class="member-name">{{ member.name }}</div>
              <div class="member-role">{{ member.role }}</div>
            </div>
            <div class="member-status">
              <span class="status-dot" :class="member.online ? 'online' : 'offline'"></span>
              <span>{{ member.online ? '在线' : '离线' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const notices = ref([
  { title: '公会新成员招募中，欢迎加入！', time: '2小时前' },
  { title: '本周公会活动奖励已发放', time: '1天前' },
  { title: '公会规则更新，请仔细阅读', time: '3天前' }
])

const activeMembers = ref([
  {
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20anime%20girl%20avatar&image_size=square',
    name: '小萌',
    role: '会长',
    online: true
  },
  {
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handsome%20boy%20avatar&image_size=square',
    name: '阿杰',
    role: '副会长',
    online: true
  },
  {
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=game%20player%20avatar%20female&image_size=square',
    name: '甜甜',
    role: '精英',
    online: true
  },
  {
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=game%20player%20avatar%20male&image_size=square',
    name: '大雄',
    role: '成员',
    online: false
  }
])

const goBack = () => {
  router.back()
}

const goTo = (path) => {
  console.log('跳转到:', path)
}
</script>

<style scoped>
.team-index {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: #f5f5f5;
  padding-top: 50px;
  padding-bottom: 80px;
  padding-bottom: calc(80px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 0 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 650px;
  z-index: 100;
}

.header-left,
.header-right {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.content {
  padding: 12px;
  max-width: 650px;
  margin: 0 auto;
}

.team-info-card {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.team-avatar img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.3);
}

.team-details {
  flex: 1;
  color: #fff;
}

.team-details h3 {
  font-size: 20px;
  margin: 0 0 5px 0;
}

.team-id {
  font-size: 13px;
  opacity: 0.9;
  margin: 0 0 10px 0;
}

.team-stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 15px;
}

.menu-item {
  background: #fff;
  border-radius: 12px;
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.menu-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
}

.menu-text {
  font-size: 13px;
  color: #333;
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h4 {
  font-size: 16px;
  color: #333;
  margin: 0;
}

.more {
  font-size: 13px;
  color: #999;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notice-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.notice-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.notice-title {
  font-size: 14px;
  color: #333;
  flex: 1;
}

.notice-time {
  font-size: 12px;
  color: #999;
  margin-left: 10px;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 3px;
}

.member-role {
  font-size: 12px;
  color: #999;
}

.member-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #999;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
}

.status-dot.online {
  background: #43e97b;
}

@media (min-width: 768px) {
  .team-index-page {
    max-width: 650px;
    margin: 0 auto;
  }
  .header {
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
  }
}
@media (min-width: 1024px) {
  .team-index-page {
    max-width: 720px;
  }
  .header {
    max-width: 720px;
  }
}
</style>
