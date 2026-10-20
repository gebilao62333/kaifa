<template>
  <view v-if="notices.length" class="notice-section">
    <view class="notice-bar" @click="openDetail">
      <text class="notice-bar-icon">{{ iconOf(notices[0]) }}</text>
      <text class="notice-bar-title">{{ notices[0].title }}</text>
      <text v-if="unread > 0" class="notice-bar-badge">{{ unread > 99 ? '99+' : unread }}</text>
      <text class="notice-bar-arrow">›</text>
    </view>

    <view v-if="showDetail" class="notice-overlay" @click.self="showDetail = false">
      <view class="notice-modal">
        <view class="notice-modal-head">
          <text class="notice-modal-title">平台公告</text>
          <button class="notice-modal-close" @click="showDetail = false">×</button>
        </view>
        <view class="notice-modal-body">
          <view v-for="item in notices" :key="item.id" class="notice-item">
            <view class="notice-item-head">
              <text class="notice-item-icon">{{ iconOf(item) }}</text>
              <text class="notice-item-title">{{ item.title }}</text>
              <text v-if="item.pinned" class="notice-item-pin">置顶</text>
            </view>
            <view class="notice-item-time">{{ formatTime(item.createTime) }}</view>
            <view class="notice-item-content">{{ item.content }}</view>
          </view>
          <view v-if="!notices.length" class="notice-empty">暂无公告</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import noticeService from '../services/noticeService'

const notices = ref([])
const unread = ref(0)
const showDetail = ref(false)
let unsubscribe = null

const TYPE_ICONS = {
  notice: '📢',
  activity: '🎉',
  system: '🔔'
}

const iconOf = (item) => TYPE_ICONS[(item && item.type) || 'notice'] || '📢'

const pad = (n) => String(n).padStart(2, '0')

const formatTime = (timestamp) => {
  const seconds = Number(timestamp) || 0
  if (!seconds) return ''
  const date = new Date(seconds * 1000)
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
    ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes())
}

const openDetail = () => {
  showDetail.value = true
  noticeService.markAllRead()
}

onMounted(() => {
  unsubscribe = noticeService.onChange((snap) => {
    notices.value = snap.list
    unread.value = snap.unread
  })
  noticeService.load()
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
.notice-section {
  margin: 10px 0 0;
}

.notice-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff7e6;
  border: 1px solid #ffe0a3;
  cursor: pointer;
}

.notice-bar-icon {
  font-size: 16px;
  line-height: 1;
}

.notice-bar-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: #8a5a00;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notice-bar-badge {
  flex: none;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #ff4d4f;
  color: #fff;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
}

.notice-bar-arrow {
  flex: none;
  color: #c99b3f;
  font-size: 16px;
}

.notice-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}

.notice-modal {
  width: 100%;
  max-width: 650px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

.notice-modal-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.notice-modal-title {
  font-size: 15px;
  font-weight: 600;
  color: #222;
}

.notice-modal-close {
  border: none;
  background: none;
  font-size: 22px;
  line-height: 1;
  color: #999;
  cursor: pointer;
}

.notice-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 16px 20px;
}

.notice-item {
  padding: 14px 0;
  border-bottom: 1px solid #f5f5f5;
}

.notice-item:last-child {
  border-bottom: none;
}

.notice-item-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.notice-item-icon {
  font-size: 15px;
}

.notice-item-title {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: #222;
}

.notice-item-pin {
  flex: none;
  padding: 0 6px;
  border-radius: 4px;
  background: #fff1f0;
  color: #ff4d4f;
  font-size: 10px;
  line-height: 16px;
}

.notice-item-time {
  margin-top: 4px;
  font-size: 11px;
  color: #999;
}

.notice-item-content {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #444;
  white-space: pre-wrap;
  word-break: break-word;
}

.notice-empty {
  padding: 32px 0;
  text-align: center;
  font-size: 13px;
  color: #999;
}
</style>
