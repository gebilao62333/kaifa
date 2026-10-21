<template>
  <PageLayout>
    <template #nav>
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">在线客服</text>
      <text class="placeholder"></text>
    </template>

    <view class="content">
      <view class="greeting-card">
        <view class="greeting-icon">👋</view>
        <view class="greeting-text">您好，请问有什么可以帮您的？</view>
      </view>

      <view class="agent-section" v-if="agentList.length > 0">
        <view class="section-title">客服人员</view>
        <view class="agent-list">
          <view class="agent-item" v-for="agent in agentList" :key="agent.id" @click="startChat(agent)">
            <view class="agent-avatar-wrapper">
              <image mode="aspectFill" class="agent-avatar" :src="agent.avatar" :alt="agent.name" />
              <text class="agent-status" :class="{ online: agent.online }"></text>
            </view>
            <view class="agent-info">
              <view class="agent-name-row">
                <text class="agent-name">{{ agent.name }}</text>
                <text class="agent-role" :class="agent.role">{{ agent.role === 'senior' ? '资深客服' : '客服' }}</text>
              </view>
              <view class="agent-desc">{{ agent.online ? '在线 · 随时为您服务' : '离线 · 可留言' }}</view>
            </view>
            <text class="agent-status-text" :class="{ online: agent.online }">{{ agent.online ? '在线' : '离线' }}</text>
          </view>
        </view>
      </view>
      <view class="agent-section" v-else-if="!supportLoading">
        <view class="section-title">客服人员</view>
        <view class="agent-empty">
          <text class="agent-empty-icon">🎧</text>
          <text class="agent-empty-text">在线客服暂未配置，请拨打客服热线或留言反馈</text>
        </view>
      </view>

      <view class="contact-section">
        <view class="section-title">其他渠道</view>
        <view class="contact-list">
          <view class="contact-item" @click="callPhone">
            <view class="contact-icon-wrapper phone">
              <text class="contact-icon">📞</text>
            </view>
            <view class="contact-info">
              <view class="contact-name">客服热线</view>
              <view class="contact-desc">{{ hotline }}</view>
            </view>
            <text class="contact-arrow">›</text>
          </view>
        </view>
      </view>

      <view class="faq-section">
        <view class="section-title">常见问题</view>
        <view class="faq-list">
          <view class="faq-item" v-for="(item, index) in faqList" :key="index" @click="toggleFaq(index)">
            <view class="faq-header">
              <text class="faq-question">{{ item.question }}</text>
              <text class="faq-arrow" :class="{ expanded: item.expanded }">›</text>
            </view>
            <view class="faq-body" v-show="item.expanded">
              <view class="faq-answer">{{ item.answer }}</view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from '@/common/route'
import PageLayout from '../components/PageLayout.vue'
import { toast } from '../composables/useToast'
import { DEFAULT_AVATAR } from '../common/constants'
import homeService from '../services/homeService'

const router = useRouter()

// 客服账号必须来自服务端配置（/api/config/support 读 CUSTOMER_SERVICE_USER_IDS），
// 此前硬编码 1001-1005 是不存在的用户，点进去必然会话加载失败。
const agentList = ref([])
const supportLoading = ref(true)
const hotline = ref('400-888-8888')

const loadSupport = async () => {
  supportLoading.value = true
  try {
    const res = await homeService.getSupport()
    const data = res && res.data
    const agents = data && Array.isArray(data.agents) ? data.agents : []
    agentList.value = agents
      .filter((a) => a && Number(a.userId) > 0)
      .map((a, index) => ({
        id: Number(a.userId) || index,
        userId: Number(a.userId),
        name: a.nickname || '客服',
        avatar: a.avatar || DEFAULT_AVATAR,
        online: true,
        role: index === 0 ? 'senior' : 'normal'
      }))
  } catch (e) {
    agentList.value = []
  } finally {
    supportLoading.value = false
  }
}

const loadPlatformConfig = async () => {
  try {
    const res = await homeService.getConfig()
    const data = res && res.data
    if (data && data.hotline) hotline.value = data.hotline
  } catch (e) { /* 保留默认热线 */ }
}

const faqList = ref([
  {
    question: '如何充值金币？',
    answer: '进入"我的"页面，点击"我的余额"进入钱包，选择充值金额即可完成充值。充值支持微信扫码支付与卡密充值。',
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
  toast.info(`客服热线：${hotline.value}\n服务时间：9:00-22:00`)
}

onMounted(() => {
  loadSupport()
  loadPlatformConfig()
})
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
  padding: 16px;
}

.greeting-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--gradient-primary);
  border-radius: 16px;
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

.agent-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 20px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.agent-empty-icon { font-size: 28px; }
.agent-empty-text { font-size: 13px; color: #999; text-align: center; }

.agent-section {
  margin-bottom: 16px;
}

.agent-list {
  background: white;
  border-radius: 0px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  color: var(--color-primary);
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
  border-radius: 0px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  border-radius: 0px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
