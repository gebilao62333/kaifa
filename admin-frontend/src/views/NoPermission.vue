<template>
  <div class="no-permission">
    <div class="box">
      <div class="code">403</div>
      <h2>无权限访问</h2>
      <p>当前账号没有访问该页面的权限，请联系超级管理员分配对应角色权限。</p>
      <router-link v-if="homePath !== '/403'" :to="homePath" class="btn">返回首页</router-link>
      <button v-else class="btn" @click="logout">退出登录</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getFirstAccessiblePath } from '@/router'

const router = useRouter()

// 跳到当前账号第一个有权限的页面；若一个都没有则显示退出登录
const homePath = computed(() => getFirstAccessiblePath())

const logout = () => {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_refresh_token')
  localStorage.removeItem('admin_user')
  router.push('/login')
}
</script>

<style scoped>
.no-permission {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}
.box {
  text-align: center;
  background: #fff;
  padding: 48px 64px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.code {
  font-size: 72px;
  font-weight: 700;
  color: #1890ff;
  line-height: 1;
}
h2 {
  margin: 16px 0 8px;
  color: #333;
}
p {
  color: #999;
  font-size: 14px;
  margin-bottom: 24px;
}
.btn {
  display: inline-block;
  padding: 8px 24px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  text-decoration: none;
  font-size: 14px;
  cursor: pointer;
}
.btn:hover {
  opacity: 0.85;
}
</style>
