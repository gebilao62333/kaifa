<template>
  <div class="about-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">关于我们</span>
      <span class="placeholder"></span>
    </div>

    <div class="content">
      <div class="logo-card">
        <div class="logo-icon">🎮</div>
        <div class="app-name">多客陪玩</div>
        <div class="app-version">版本 1.0.0</div>
      </div>

      <div class="menu-list">
        <div class="menu-item" @click="showPage('user')">
          <span class="menu-text">用户协议</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="showPage('privacy')">
          <span class="menu-text">隐私政策</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item">
          <span class="menu-text">版本更新</span>
          <span class="menu-tag">已是最新</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item">
          <span class="menu-text">给我们评分</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="showContact">
          <span class="menu-text">联系客服</span>
          <span class="menu-arrow">›</span>
        </div>
      </div>

      <div class="info-card">
        <div class="info-title">公司信息</div>
        <div class="info-item">
          <span class="info-label">公司名称</span>
          <span class="info-value">北京多客科技有限公司</span>
        </div>
        <div class="info-item">
          <span class="info-label">成立时间</span>
          <span class="info-value">2023年</span>
        </div>
        <div class="info-item">
          <span class="info-label">官方网站</span>
          <span class="info-value">www.duoke.com</span>
        </div>
      </div>

      <div class="copyright">
        Copyright © 2023-2024 多客科技
        <br />
        All Rights Reserved
      </div>
    </div>

    <div class="modal" v-if="showModal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <span class="modal-title">{{ modalTitle }}</span>
          <span class="modal-close" @click="closeModal">×</span>
        </div>
        <div class="modal-body">
          <div class="modal-text" v-if="modalType === 'contact'">
            <p>客服热线：400-888-8888</p>
            <p>服务时间：9:00-21:00</p>
            <p>客服邮箱：service@duoke.com</p>
          </div>
          <div class="modal-text" v-else>
            <p>欢迎使用多客陪玩平台！</p>
            <p>在使用我们的服务前，请仔细阅读并理解本协议的全部内容。</p>
            <p>我们将严格保护用户的个人信息安全。</p>
            <p>更多详细内容请查看完整协议文档。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

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
.about-page {
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
  padding: 20px;
  padding-bottom: calc(20px + constant(safe-area-inset-bottom, 0px));
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  max-width: 650px;
  margin: 0 auto;
}

.logo-card {
  background: white;
  border-radius: 10px;
  padding: 30px 20px;
  text-align: center;
  margin-bottom: 20px;
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
  border-radius: 10px;
  margin-bottom: 20px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
  -webkit-transition: background-color 0.2s;
  -webkit-tap-highlight-color: transparent;
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
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
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
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.modal-content {
  width: 85%;
  max-width: 360px;
  background: white;
  border-radius: 10px;
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
  -webkit-tap-highlight-color: transparent;
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.modal-text p {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  margin-bottom: 12px;
}
</style>
