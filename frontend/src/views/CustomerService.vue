<template>
  <div class="customer-service-page">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">在线客服</span>
      <span class="placeholder"></span>
    </div>

    <div class="content">
      <div class="greeting-card">
        <div class="greeting-icon">👋</div>
        <div class="greeting-text">您好，请问有什么可以帮您的？</div>
      </div>

      <div class="agent-section">
        <div class="section-title">客服人员</div>
        <div class="agent-list">
          <div class="agent-item" v-for="agent in agentList" :key="agent.id" @click="startChat(agent)">
            <div class="agent-avatar-wrapper">
              <img class="agent-avatar" :src="agent.avatar" :alt="agent.name" />
              <span class="agent-status" :class="{ online: agent.online }"></span>
            </div>
            <div class="agent-info">
              <div class="agent-name-row">
                <span class="agent-name">{{ agent.name }}</span>
                <span class="agent-role" :class="agent.role">{{ agent.role === 'senior' ? '资深客服' : '客服' }}</span>
              </div>
              <div class="agent-desc">{{ agent.online ? '在线 · 随时为您服务' : '离线 · 可留言' }}</div>
            </div>
            <span class="agent-status-text" :class="{ online: agent.online }">{{ agent.online ? '在线' : '离线' }}</span>
          </div>
        </div>
      </div>

      <div class="contact-section">
        <div class="section-title">其他渠道</div>
        <div class="contact-list">
          <div class="contact-item" @click="callPhone">
            <div class="contact-icon-wrapper phone">
              <span class="contact-icon">📞</span>
            </div>
            <div class="contact-info">
              <div class="contact-name">客服热线</div>
              <div class="contact-desc">400-888-8888</div>
            </div>
            <span class="contact-arrow">›</span>
          </div>
        </div>
      </div>

      <div class="faq-section">
        <div class="section-title">常见问题</div>
        <div class="faq-list">
          <div class="faq-item" v-for="(item, index) in faqList" :key="index" @click="toggleFaq(index)">
            <div class="faq-header">
              <span class="faq-question">{{ item.question }}</span>
              <span class="faq-arrow" :class="{ expanded: item.expanded }">›</span>
            </div>
            <div class="faq-body" v-show="item.expanded">
              <div class="faq-answer">{{ item.answer }}</div>
            </div>
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

const agentList = ref([
  {
    id: 1,
    userId: 1001,
    name: '小雪',
    avatar: '',
    online: true,
    role: 'senior'
  },
  {
    id: 2,
    userId: 1002,
    name: '阿杰',
    avatar: '',
    online: true,
    role: 'normal'
  },
  {
    id: 3,
    userId: 1003,
    name: '小美',
    avatar: '',
    online: false,
    role: 'normal'
  },
  {
    id: 4,
    userId: 1004,
    name: '大飞',
    avatar: '',
    online: true,
    role: 'senior'
  },
  {
    id: 5,
    userId: 1005,
    name: '小鹿',
    avatar: '',
    online: false,
    role: 'normal'
  }
])

const faqList = ref([
  {
    question: '如何充值金币？',
    answer: '进入"我的"页面，点击"我的余额"进入钱包，选择充值金额即可完成充值。支持微信支付、支付宝等多种支付方式。',
    expanded: false
  },
  {
    question: '如何申请退款？',
    answer: '如对服务不满意，可在订单完成后48小时内联系客服申请退款。客服会在1-3个工作日内为您处理。',
    expanded: false
  },
  {
    question: '提现多久到账？',
    answer: '提现申请提交后，平台会在1-3个工作日内处理到账。如遇节假日顺延，请耐心等待。',
    expanded: false
  },
  {
    question: '如何联系陪玩？',
    answer: '下单成功后，在"我的订单"中找到对应订单，点击"联系陪玩"即可与陪玩进行在线沟通。',
    expanded: false
  },
  {
    question: '服务时间是什么时候？',
    answer: '在线客服服务时间为每天 9:00-22:00。非服务时间可留言，客服将在次日优先处理。',
    expanded: false
  }
])

const goBack = () => {
  router.back()
}

const toggleFaq = (index) => {
  faqList.value[index].expanded = !faqList.value[index].expanded
}

const startChat = (agent) => {
  router.push(`/chat-room/${agent.userId}`)
}

const callPhone = () => {
  alert('客服热线：400-888-8888\n服务时间：9:00-22:00')
}
</script>

<style scoped>
.customer-service-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background-color: #f5f5f5;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
  padding-top: 82px;
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
  left: 0;
  right: 0;
  z-index: 100;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
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
  padding: 16px;
  max-width: 650px;
  margin: 0 auto;
}

.greeting-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 16px;
}

.greeting-icon {
  font-size: 32px;
}

.greeting-text {
  font-size: 15px;
  color: white;
  line-height: 1.5;
}

.agent-section {
  margin-bottom: 16px;
}

.agent-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.agent-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.agent-item:last-child {
  border-bottom: none;
}

.agent-item:active {
  background-color: #f9f9f9;
}

.agent-avatar-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  margin-right: 14px;
  flex-shrink: 0;
}

.agent-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.agent-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ccc;
  border: 2.5px solid white;
}

.agent-status.online {
  background: #34c759;
  box-shadow: 0 0 6px rgba(52, 199, 89, 0.5);
}

.agent-info {
  flex: 1;
  min-width: 0;
}

.agent-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.agent-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.agent-role {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #f0f0f0;
  color: #999;
}

.agent-role.senior {
  background: linear-gradient(135deg, #667eea20, #764ba220);
  color: #667eea;
}

.agent-desc {
  font-size: 13px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-status-text {
  font-size: 12px;
  font-weight: 500;
  color: #999;
  flex-shrink: 0;
  margin-left: 12px;
}

.agent-status-text.online {
  color: #34c759;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.contact-section {
  margin-bottom: 16px;
}

.contact-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-item:active {
  background-color: #f9f9f9;
}

.contact-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
}

.contact-icon-wrapper.online {
  background: linear-gradient(135deg, #667eea20, #764ba220);
}

.contact-icon-wrapper.phone {
  background: linear-gradient(135deg, #34c75920, #28a74520);
}

.contact-icon {
  font-size: 22px;
}

.contact-info {
  flex: 1;
}

.contact-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.contact-desc {
  font-size: 13px;
  color: #999;
}

.contact-arrow {
  font-size: 20px;
  color: #ccc;
}

.faq-section {
  margin-bottom: 16px;
}

.faq-list {
  background: white;
  border-radius: 10px;
  overflow: hidden;
}

.faq-item {
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.faq-item:last-child {
  border-bottom: none;
}

.faq-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

.faq-question {
  font-size: 14px;
  color: #333;
  flex: 1;
}

.faq-arrow {
  font-size: 20px;
  color: #ccc;
  transition: transform 0.3s;
  margin-left: 12px;
}

.faq-arrow.expanded {
  transform: rotate(90deg);
}

.faq-body {
  padding: 0 20px 16px;
}

.faq-answer {
  font-size: 13px;
  color: #666;
  line-height: 1.8;
  background: #f9f9f9;
  padding: 12px 16px;
  border-radius: 8px;
}
</style>
