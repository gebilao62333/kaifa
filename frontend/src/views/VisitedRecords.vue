<template>
  <div class="visitors-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">访客记录</span>
      <span class="total">近30天 {{ visitorsList.length }} 人</span>
    </div>

    <div class="visitors-list" v-if="visitorsList.length > 0">
      <div class="visitor-item" v-for="(item, idx) in visitorsList" :key="idx" @click="viewProfile(item)">
        <img :src="item.avatar" class="item-avatar" />
        <div class="item-info">
          <span class="item-name">{{ item.nickName }}</span>
          <span class="item-time">{{ item.time }}</span>
        </div>
        <span class="item-tag" v-if="item.isFollowed">已关注</span>
        <span class="item-tag follow" v-else @click.stop="followUser(item)">+ 关注</span>
      </div>
    </div>

    <div class="empty-state" v-else>
      <span class="empty-icon">👀</span>
      <span class="empty-text">还没有访客记录</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const visitorsList = ref([
  { id: '4001', avatar: 'https://picsum.photos/200/200?random=10', nickName: '路人甲', time: '5分钟前', isFollowed: false },
  { id: '4002', avatar: 'https://picsum.photos/200/200?random=11', nickName: '游戏高手', time: '30分钟前', isFollowed: true },
  { id: '4003', avatar: 'https://picsum.photos/200/200?random=12', nickName: '小萝莉', time: '1小时前', isFollowed: false },
  { id: '4004', avatar: 'https://picsum.photos/200/200?random=13', nickName: '最强王者', time: '2小时前', isFollowed: true },
  { id: '4005', avatar: 'https://picsum.photos/200/200?random=14', nickName: '打野达人', time: '3小时前', isFollowed: false },
  { id: '4006', avatar: 'https://picsum.photos/200/200?random=15', nickName: '休闲玩家', time: '5小时前', isFollowed: false },
  { id: '4007', avatar: 'https://picsum.photos/200/200?random=16', nickName: '萌妹', time: '昨天', isFollowed: true },
  { id: '4008', avatar: 'https://picsum.photos/200/200?random=17', nickName: '战术大师', time: '昨天', isFollowed: false },
  { id: '4009', avatar: 'https://picsum.photos/200/200?random=18', nickName: '吃鸡达人', time: '2天前', isFollowed: false },
  { id: '4010', avatar: 'https://picsum.photos/200/200?random=19', nickName: '小可爱', time: '3天前', isFollowed: true }
])

const goBack = () => {
  router.back()
}

const followUser = (item) => {
  item.isFollowed = true
}

const viewProfile = (user) => {
  router.push({ name: 'UserProfile', params: { id: user.id || '10001' } })
}
</script>

<style scoped>
.visitors-page {
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
  font-size: 13px;
  color: #999;
}

.visitors-list {
  padding: 12px;
}

.visitor-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
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

.item-tag {
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 10px;
  background: #f5f5f5;
  color: #999;
}

.item-tag.follow {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
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
  .visited-records-page {
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
  .visited-records-page {
    max-width: 720px;
  }
  .header {
    max-width: 720px;
  }
}
</style>
