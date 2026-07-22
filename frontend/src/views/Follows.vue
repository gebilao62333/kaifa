<template>
  <PageLayout>
    <template #nav>
      <span class="back-btn" @click="goBack">←</span>
      <span class="nav-title">我的关注</span>
      <span class="placeholder"></span>
    </template>

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

      <EmptyState v-else icon="👥" text="暂无关注" hint="快去关注感兴趣的人吧" />
    </div>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '../components/PageLayout.vue'
import EmptyState from '../components/EmptyState.vue'

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
.back-btn,
.placeholder {
  width: 40px;
  font-size: 20px;
  color: white;
  cursor: pointer;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.content {
  padding: 12px;
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
  border-radius: 0px;
  padding: 16px 20px;
  margin: 12px 20px 0;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  color: var(--color-primary);
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
  background: var(--gradient-primary);
  color: white;
}
</style>
