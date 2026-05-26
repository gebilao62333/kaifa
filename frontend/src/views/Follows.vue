<template>
  <div class="follows-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">我的关注</span>
      <span class="placeholder"></span>
    </div>

    <div class="content">
      <div class="user-list" v-if="follows.length > 0">
        <div class="user-card" v-for="(user, index) in follows" :key="index" @click="viewProfile(user)">
          <img class="user-avatar" :src="user.avatar" alt="" />
          <div class="user-info">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-desc">{{ user.desc }}</div>
            <div class="user-tags">
              <span class="tag" v-for="tag in user.tags" :key="tag">{{ tag }}</span>
            </div>
          </div>
          <button class="follow-btn followed" @click.stop="unfollow(user)">已关注</button>
        </div>
      </div>

      <div class="empty-state" v-else>
        <div class="empty-icon">👥</div>
        <div class="empty-text">暂无关注</div>
        <div class="empty-hint">快去关注感兴趣的人吧</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const follows = ref([
  {
    id: '2001',
    avatar: 'https://picsum.photos/100/100?random=201',
    name: '游戏大神',
    desc: '专注王者荣耀，段位王者',
    tags: ['王者荣耀', '王者']
  },
  {
    id: '2002',
    avatar: 'https://picsum.photos/100/100?random=202',
    name: '吃鸡女王',
    desc: '和平精英女主播',
    tags: ['和平精英', '女主播']
  },
  {
    id: '2003',
    avatar: 'https://picsum.photos/100/100?random=203',
    name: '陪玩小哥',
    desc: 'LOL专业陪玩',
    tags: ['英雄联盟', '新手友好']
  },
  {
    id: '2004',
    avatar: 'https://picsum.photos/100/100?random=204',
    name: '声优小姐姐',
    desc: '萝莉音御姐音都能驾驭',
    tags: ['声音好听', '性格好']
  }
])

const goBack = () => {
  router.back()
}

const unfollow = (user) => {
  if (confirm(`确定取消关注 ${user.name} 吗？`)) {
    const index = follows.value.findIndex(u => u.name === user.name)
    if (index > -1) {
      follows.value.splice(index, 1)
    }
  }
}

const viewProfile = (user) => {
  router.push({ name: 'UserProfile', params: { id: user.id || '10001' } })
}
</script>

<style scoped>
.follows-page {
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
  left: 0;
  right: 0;
  z-index: 100;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.back-btn,
.placeholder {
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
  background: #f5f5f5;
  color: #999;
}

.follow-btn.not-followed {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
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
