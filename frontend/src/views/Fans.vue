<template>
  <PageLayout>
    <template #nav>
      <span class="back-btn" @click="goBack">←</span>
      <span class="nav-title">我的粉丝</span>
      <span class="count">{{ fans.length }}人</span>
    </template>

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

      <EmptyState v-else icon="👥" text="暂无粉丝" hint="努力提升自己，粉丝会越来越多哦" />
    </div>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '../components/PageLayout.vue'
import EmptyState from '../components/EmptyState.vue'
import { toast } from '../composables/useToast'

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
    toast.success(`已关注 ${user.name}`)
  } else {
    toast.info(`已取消关注 ${user.name}`)
  }
}

const viewProfile = (user) => {
  router.push({ name: 'UserProfile', params: { id: user.id || '10001' } })
}
</script>

<style scoped>
.back-btn {
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

.count {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
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
  background: var(--gradient-primary);
  color: white;
}

.follow-btn:not(.followed) {
  background: #f5f5f5;
  color: #333;
}
</style>
