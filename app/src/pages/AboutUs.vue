<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">关于我们</text>
      <text class="placeholder"></text>
    </template>

    <view class="content">
      <view class="logo-card">
        <view class="logo-icon">🎮</view>
        <view class="app-name">eu搭子</view>
        <view class="app-version">版本 1.0.0</view>
      </view>

      <view class="menu-list">
        <view class="menu-item" @click="showPage('user')">
          <text class="menu-text">用户协议</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="showPage('privacy')">
          <text class="menu-text">隐私政策</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item">
          <text class="menu-text">版本更新</text>
          <text class="menu-tag">已是最新</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item">
          <text class="menu-text">给我们评分</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="showContact">
          <text class="menu-text">联系客服</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="info-card">
        <view class="info-title">公司信息</view>
        <view class="info-item">
          <text class="info-label">公司名称</text>
          <text class="info-value">北京多客科技有限公司</text>
        </view>
        <view class="info-item">
          <text class="info-label">成立时间</text>
          <text class="info-value">2023年</text>
        </view>
        <view class="info-item">
          <text class="info-label">官方网站</text>
          <text class="info-value">www.eudazi.com</text>
        </view>
      </view>

      <view class="copyright">
        Copyright © 2023-2024 多客科技
        <br />
        All Rights Reserved
      </view>
    </view>

    <view class="modal" v-if="showModal" @click.self="closeModal">
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">{{ modalTitle }}</text>
          <text class="modal-close" @click="closeModal">×</text>
        </view>
        <view class="modal-body">
          <view class="modal-text" v-if="modalType === 'contact'">
            <view>客服热线：400-888-8888</view>
            <view>服务时间：9:00-21:00</view>
            <view>客服邮箱：service@eudazi.com</view>
          </view>
          <view class="modal-text" v-else>
            <view>欢迎使用eu搭子平台！</view>
            <view>在使用我们的服务前，请仔细阅读并理解本协议的全部内容。</view>
            <view>我们将严格保护用户的个人信息安全。</view>
            <view>更多详细内容请查看完整协议文档。</view>
          </view>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'

const router = useRouter()

const showModal = ref(false)
const modalTitle = ref('')
const modalType = ref('')

const goBack = () => {
  router.back()
}

const showPage = (type) => {
  modalType.value = type
  modalTitle.value = type === 'user' ? '用户协议' : '隐私政策'
  showModal.value = true
}

const showContact = () => {
  modalType.value = 'contact'
  modalTitle.value = '联系客服'
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
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
  padding: 20px;
}

.logo-card {
  background: white;
  border-radius: 0px;
  padding: 30px 20px;
  text-align: center;
  margin: 12px 0 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.logo-icon {
  font-size: 64px;
  margin-bottom: 12px;
}

.app-name {
  font-size: 22px;
  font-weight: bold;
  color: #333;
  margin-bottom: 6px;
}

.app-version {
  font-size: 13px;
  color: #999;
}

.menu-list {
  background: white;
  border-radius: 0px;
  margin: 12px 0 0;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: #f9f9f9;
}

.menu-text {
  font-size: 15px;
  color: #333;
}

.menu-tag {
  font-size: 13px;
  color: #34c759;
  background: rgba(52,199,89,0.1);
  padding: 4px 10px;
  border-radius: 12px;
  margin-right: 8px;
}

.menu-arrow {
  font-size: 18px;
  color: #ccc;
}

.info-card {
  background: white;
  border-radius: 0px;
  padding: 20px;
  margin: 12px 0 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.info-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 14px;
  color: #333;
}

.copyright {
  text-align: center;
  font-size: 12px;
  color: #ccc;
  line-height: 1.8;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 85%;
  max-width: 360px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  max-height: 80vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
}

.modal-title {
  font-size: 17px;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 24px;
  color: #999;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-text view {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  margin-bottom: 12px;
}
</style>
