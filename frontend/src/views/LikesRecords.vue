<template>
  <div class="likes-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">获赞记录</span>
      <span class="total">总计 {{ totalLikes }}</span>
    </div>

    <div class="likes-list" v-if="likesList.length > 0">
      <div class="like-item" v-for="(item, idx) in likesList" :key="idx" @click="viewProfile(item)">
        <img :src="item.avatar" class="item-avatar" />
        <div class="item-info">
          <span class="item-name">{{ item.nickName }}</span>
          <span class="item-time">{{ item.time }}</span>
        </div>
        <span class="item-content">{{ item.content }}</span>
      </div>
    </div>

    <div class="empty-state" v-else>
      <span class="empty-icon">❤️</span>
      <span class="empty-text">还没有人赞过你</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const totalLikes = ref(1024)

const likesList = ref([
  { id: '2001', avatar: 'https://picsum.photos/200/200?random=1', nickName: '游戏达人', time: '2026-05-18 14:30', content: '赞了你的帖子' },
  { id: '2002', avatar: 'https://picsum.photos/200/200?random=2', nickName: '小猫咪', time: '2026-05-18 12:15', content: '赞了你的相册' },
  { id: '2003', avatar: 'https://picsum.photos/200/200?random=3', nickName: '电竞王者', time: '2026-05-17 22:00', content: '赞了你的帖子「上分心得分享」' },
  { id: '2004', avatar: 'https://picsum.photos/200/200?random=4', nickName: '快乐肥宅', time: '2026-05-17 18:45', content: '赞了你的评论' },
  { id: '2005', avatar: 'https://picsum.photos/200/200?random=5', nickName: '午夜战神', time: '2026-05-16 09:20', content: '赞了你的帖子「五杀时刻」' },
  { id: '2006', avatar: 'https://picsum.photos/200/200?random=6', nickName: '小甜心', time: '2026-05-15 20:10', content: '赞了你的相册' },
  { id: '2007', avatar: 'https://picsum.photos/200/200?random=7', nickName: '技术流', time: '2026-05-14 16:30', content: '赞了你的帖子「新赛季上分攻略」' },
  { id: '2008', avatar: 'https://picsum.photos/200/200?random=8', nickName: '萌新求带', time: '2026-05-13 11:00', content: '赞了你的评论' }
])

const goBack = () => {
  router.back()
}

const viewProfile = (user) => {
  router.push({ name: 'UserProfile', params: { id: user.id || '10001' } })
}
</script>

<style scoped>
.likes-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  padding-top: 82px;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
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
  font-size: 24px;
  color: #fff;
  cursor: pointer;
  width: 40px;
  -webkit-tap-highlight-color: transparent;
}

.header .title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.total {
  font-size: 14px;
  color: #999;
  width: 80px;
  text-align: right;
}

.likes-list {
  padding: 12px;
}

.like-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 10px;
  margin-bottom: 10px;
}

.item-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 2px;
}

.item-time {
  font-size: 12px;
  color: #999;
}

.item-content {
  font-size: 13px;
  color: #666;
  text-align: right;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 0;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 15px;
  color: #999;
}

@media (min-width: 768px) {
  .likes-records-page {
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
  .likes-records-page {
    max-width: 720px;
  }
  .header {
    max-width: 720px;
  }
}
</style>
