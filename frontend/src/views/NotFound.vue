<template>
  <div class="not-found">
    <div class="code">404</div>
    <p class="text">页面不存在或已被移除</p>
    <button class="btn" type="button" @click="goHome">返回首页</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const goHome = () => router.replace('/home')
</script>

<style scoped>
.not-found {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #f5f5f7;
  text-align: center;
}
.code {
  font-size: 64px;
  font-weight: 700;
  color: #ff6b81;
}
.text {
  margin: 12px 0 24px;
  font-size: 15px;
  color: #666;
}
.btn {
  padding: 10px 28px;
  border: none;
  border-radius: 20px;
  background: #ff6b81;
  color: #fff;
  font-size: 15px;
  cursor: pointer;
}
</style>
