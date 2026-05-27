<template>
  <div class="fans-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">我的粉丝</span>
      <span class="count">{{ fans.length }}人</span>
    </div>

    <div class="content">
      <div class="user-list" v-if="fans.length > 0">
        <div class="user-card" v-for="(user, index) in fans" :key="index" @click="viewProfile(user)">
          <img class="user-avatar" :src="user.avatar" alt="" />
          <div class="user-info">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-desc">{{ user.desc }}</div>
            <div class="user-tags">
              <span class="tag" v-for="tag in user.tags" :key="tag">{{ tag }}</span>
            </div>
          </div>
          <button class="follow-btn" :class="{ followed: user.isFollow }" @click.stop="toggleFollow(user)">
            {{ user.isFollow ? '已互关注' : '+ 关注' }}
          </button>
        </div>
      </div>

      <div class="empty-state" v-else>
        <div class="empty-icon">👥</div>
        <div class="empty-text">暂无粉丝</div>
        <div class="empty-hint">努力提升自己，粉丝会越来越多哦</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const fans = ref([
  {
    id: '3001',
    avatar: 'https://picsum.photos/100/100?random=301',
    name: '小粉丝01',
    desc: '你的作品很棒！',
    tags: ['活跃粉丝'],
    isFollow: true
  },
  {
    id: '3002',
    avatar: 'https://picsum.photos/100/100?random=302',
    name: '游戏玩家',
    desc: '求带飞',
    tags: ['游戏达人'],
    isFollow: false
  },
  {
    id: '3003',
    avatar: 'https://picsum.photos/100/100?random=303',
    name: '陪玩爱好者',
    desc: '期待合作',
    tags: ['新手友好'],
    isFollow: true
  },
  {
    id: '3004',
    avatar: 'https://picsum.photos/100/100?random=304',
    name: '王者粉丝',
    desc: '大神666',
    tags: ['段位高'],
    isFollow: false
  },
  {
    id: '3005',
    avatar: 'https://picsum.photos/100/100?random=305',
    name: '颜值控',
    desc: '声音好好听',
    tags: ['声音好听'],
    isFollow: false
  }
])

const goBack = () => {
  router.back()
}

const toggleFollow = (user) => {
  user.isFollow = !user.isFollow
  if (user.isFollow) {
    alert(`已关注 ${user.name}`)
  } else {
    alert(`已取消关注 ${user.name}`)
  }
}

const viewProfile = (user) => {
  router.push({ name: 'UserProfile', params: { id: user.id || '10001' } })
}
</script>

<style scoped>
.fans-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
  padding-top: 82px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: -webkit-linear-gradient(315deg, #667eea 0%, #764ba2 100%);
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 650px;
  z-index: 100;
}

.back-btn {
  width: 40px;
  font-size: 20px;
  color: white;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.count {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
}

.content {
  padding: 12px;
  max-width: 650px;
  margin: 0 auto;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-card {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 10px;
  padding: 16px;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.user-desc {
  font-size: 13px;
  color: #999;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  font-size: 11px;
  color: #667eea;
  background: rgba(102,126,234,0.1);
  padding: 3px 8px;
  border-radius: 10px;
}

.follow-btn {
  padding: 8px 20px;
  font-size: 13px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
}

.follow-btn.followed {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.follow-btn:not(.followed) {
  background: #f5f5f5;
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-text {
  font-size: 16px;
  color: #999;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: #ccc;
}
</style>
