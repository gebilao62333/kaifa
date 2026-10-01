<template>
  <PageLayout>
    <template #nav>
      <span class="back-btn" @click="goBack">←</span>
      <span class="nav-title">访客记录</span>
      <span class="total">近30天 {{ visitorsList.length }} 人</span>
    </template>

    <div class="visitors-list" v-if="visitorsList.length > 0">
      <div class="visitor-item" v-for="(item, idx) in visitorsList" :key="idx" @click="viewProfile(item)">
        <img :src="item.avatar" class="item-avatar" v-img-fallback="item.nickName" />
        <div class="item-info">
          <span class="item-name">{{ item.nickName }}</span>
          <span class="item-time">{{ item.time }}</span>
        </div>
        <span class="item-tag" v-if="item.isFollowed">已关注</span>
        <span class="item-tag follow" v-else @click.stop="followUser(item)">+ 关注</span>
      </div>
    </div>

    <EmptyState v-else icon="👀" text="还没有访客记录" />
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PageLayout from '../components/PageLayout.vue'
import EmptyState from '../components/EmptyState.vue'

const router = useRouter()

const visitorsList = ref([])

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
.back-btn {
  font-size: 24px;
  color: #fff;
  cursor: pointer;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.total {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.visitors-list {
  padding: 12px;
}

.visitor-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-radius: 0px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  border-radius: 16px;
  background: #f5f5f5;
  color: #999;
}

.item-tag.follow {
  background: var(--gradient-primary);
  color: white;
  cursor: pointer;
}
</style>
