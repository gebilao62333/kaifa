<template>
  <div class="admin-card">
    <!-- Toast 提示 -->
    <div v-if="toast.show" :class="['toast', 'toast-' + toast.type]">
      {{ toast.message }}
    </div>

    <!-- ==================== 基础设置 ==================== -->
    <div class="settings-section">
      <h3>基础设置</h3>
      <div class="form-group">
        <label>网站名称</label>
        <input v-model="systemSettings.siteName" type="text" class="form-input" />
      </div>
      <div class="form-group">
        <label>网站描述</label>
        <input v-model="systemSettings.siteDescription" type="text" class="form-input" />
      </div>
      <div class="form-group">
        <label>关键词</label>
        <input v-model="systemSettings.siteKeywords" type="text" class="form-input" placeholder="用逗号分隔多个关键词" />
      </div>
      <div class="form-group">
        <label>网站Logo URL</label>
        <input v-model="systemSettings.siteLogo" type="text" class="form-input" />
      </div>
      <div class="form-group">
        <label>备案号</label>
        <input v-model="systemSettings.recordNumber" type="text" class="form-input" />
      </div>
      <div class="form-group">
        <label>联系方式</label>
        <input v-model="systemSettings.contactPhone" type="text" class="form-input" />
      </div>
      <div class="form-group">
        <label>联系邮箱</label>
        <input v-model="systemSettings.contactEmail" type="email" class="form-input" />
      </div>
    </div>

    <!-- ==================== 用户设置 ==================== -->
    <div class="settings-section">
      <h3>用户设置</h3>
      <div class="form-group">
        <label>用户初始余额（金币）</label>
        <input v-model.number="systemSettings.userInitBalance" type="number" class="form-input" />
      </div>
      <div class="form-group">
        <label>用户初始积分</label>
        <input v-model.number="systemSettings.userInitScore" type="number" class="form-input" />
      </div>
      <div class="form-group">
        <label>默认头像 URL</label>
        <input v-model="systemSettings.userDefaultAvatar" type="text" class="form-input" />
      </div>
      <div class="form-group">
        <label>最低提现金额</label>
        <input v-model.number="systemSettings.withdrawMinAmount" type="number" class="form-input" />
      </div>
      <div class="form-group">
        <label>提现手续费率</label>
        <input v-model.number="systemSettings.withdrawFeeRate" type="number" step="0.01" class="form-input" />
      </div>
      <div class="form-group">
        <label>平台抽成比例（陪玩师分成）</label>
        <input v-model.number="systemSettings.platformCommissionRate" type="number" step="0.01" min="0" max="1" class="form-input" />
        <small class="form-hint">例如 0.7 表示陪玩师获得 70%，平台抽成 30%</small>
      </div>
      <div class="form-group flex-group">
        <label>
          <input type="checkbox" v-model="systemSettings.withdrawAutoApprove" />
          自动审核提现
        </label>
        <small class="form-hint">开启后提现将自动通过审核</small>
      </div>
    </div>

    <!-- ==================== 注册设置 ==================== -->
    <div class="settings-section">
      <h3>注册设置</h3>
      <div class="form-group flex-group">
        <label>
          <input type="checkbox" v-model="systemSettings.registerEnabled" />
          允许用户注册
        </label>
      </div>
      <div class="form-group flex-group">
        <label>
          <input type="checkbox" v-model="systemSettings.registerNeedPhone" />
          注册需绑定手机号
        </label>
      </div>
      <div class="form-group flex-group">
        <label>
          <input type="checkbox" v-model="systemSettings.registerNeedRealName" />
          注册需实名认证
        </label>
      </div>
    </div>

    <!-- ==================== 功能开关 ==================== -->
    <div class="settings-section">
      <h3>功能开关</h3>
      <div class="form-group flex-group">
        <label>
          <input type="checkbox" v-model="systemSettings.giftEnabled" />
          启用礼物功能
        </label>
      </div>
      <div class="form-group flex-group">
        <label>
          <input type="checkbox" v-model="systemSettings.voiceChatEnabled" />
          启用语音聊天
        </label>
      </div>
      <div class="form-group flex-group">
        <label>
          <input type="checkbox" v-model="systemSettings.videoChatEnabled" />
          启用视频聊天
        </label>
      </div>
      <div class="form-group flex-group">
        <label>
          <input type="checkbox" v-model="systemSettings.reviewContentEnabled" />
          启用内容审核
        </label>
        <small class="form-hint">开启后用户发布内容需审核通过才能展示</small>
      </div>
      <div class="form-group flex-group">
        <label>
          <input type="checkbox" v-model="systemSettings.thirdPartyLoginEnabled" />
          启用第三方登录
        </label>
        <small class="form-hint">关闭后前端登录弹窗将隐藏微信/QQ/微博登录选项</small>
      </div>
    </div>

    <!-- ==================== ☁️ 存储配置 ==================== -->
    <div class="settings-section infra-section">
      <h3><span class="section-icon">☁️</span> 存储配置</h3>
      <p class="section-desc">配置云端文件存储服务，用于上传图片、音频、视频等资源</p>

      <div class="form-group">
        <label>存储提供商</label>
        <select v-model="systemSettings.storageProvider" class="form-input">
          <option value="local">本地存储</option>
          <option value="cos">腾讯云COS</option>
          <option value="qiniu">七牛云Kodo</option>
        </select>
      </div>

      <!-- 腾讯云COS -->
      <template v-if="systemSettings.storageProvider === 'cos'">
        <div class="sub-section">
          <h4>腾讯云COS</h4>
          <div class="form-group">
            <label>SecretId <span class="label-hint">（密钥仅显示后4位）</span></label>
            <input v-model="systemSettings.cosSecretId" type="text" class="form-input" readonly />
          </div>
          <div class="form-group">
            <label>SecretKey</label>
            <input v-model="systemSettings.cosSecretKey" type="password" class="form-input" readonly placeholder="****" />
          </div>
          <div class="form-row">
            <div class="form-group form-col">
              <label>Bucket</label>
              <input v-model="systemSettings.cosBucket" type="text" class="form-input" readonly />
            </div>
            <div class="form-group form-col">
              <label>Region</label>
              <input v-model="systemSettings.cosRegion" type="text" class="form-input" readonly />
            </div>
          </div>
        </div>
      </template>

      <!-- 七牛云Kodo -->
      <template v-if="systemSettings.storageProvider === 'qiniu'">
        <div class="sub-section">
          <h4>七牛云Kodo</h4>
          <div class="form-group">
            <label>AccessKey <span class="label-hint">（密钥仅显示后4位）</span></label>
            <input v-model="systemSettings.qiniuAccessKey" type="text" class="form-input" readonly />
          </div>
          <div class="form-group">
            <label>SecretKey</label>
            <input v-model="systemSettings.qiniuSecretKey" type="password" class="form-input" readonly placeholder="****" />
          </div>
          <div class="form-row">
            <div class="form-group form-col">
              <label>Bucket</label>
              <input v-model="systemSettings.qiniuBucket" type="text" class="form-input" readonly />
            </div>
            <div class="form-group form-col">
              <label>区域</label>
              <select v-model="systemSettings.qiniuZone" class="form-input" disabled>
                <option value="z0">华东 (z0)</option>
                <option value="z1">华北 (z1)</option>
                <option value="z2">华南 (z2)</option>
                <option value="na0">北美 (na0)</option>
                <option value="as0">东南亚 (as0)</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>CDN域名</label>
            <input v-model="systemSettings.qiniuDomain" type="text" class="form-input" readonly />
          </div>
        </div>
      </template>

      <template v-if="systemSettings.storageProvider === 'local'">
        <div class="info-banner">📂 文件将存储在服务器本地 <code>public/uploads/</code> 目录下，适合开发和小规模部署。</div>
      </template>

      <div class="env-hint">
        <span>🔒 密钥等敏感配置请通过环境变量设置：</span>
        <code v-if="systemSettings.storageProvider === 'cos'">COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET / COS_REGION</code>
        <code v-if="systemSettings.storageProvider === 'qiniu'">QINIU_ACCESS_KEY / QINIU_SECRET_KEY / QINIU_BUCKET / QINIU_DOMAIN / QINIU_ZONE</code>
      </div>
    </div>

    <!-- ==================== 🗺️ 地图配置 ==================== -->
    <div class="settings-section infra-section">
      <h3><span class="section-icon">🗺️</span> 地图配置</h3>
      <p class="section-desc">配置地图服务，用于地理编码、位置搜索、距离计算等</p>

      <div class="form-group">
        <label>地图提供商</label>
        <select v-model="systemSettings.mapProvider" class="form-input">
          <option value="tencent">腾讯地图</option>
          <option value="amap" disabled>高德地图（待支持）</option>
        </select>
      </div>

      <div class="form-group">
        <label>腾讯地图 Key <span class="label-hint">（密钥仅显示后4位）</span></label>
        <input v-model="systemSettings.tencentMapKey" type="text" class="form-input" readonly />
      </div>

      <div v-if="!systemSettings.tencentMapKey" class="info-banner warning">
        ⚠️ 腾讯地图 Key 未配置。当前为 <strong>开发Mock模式</strong>，返回模拟数据。上线前请配置 <code>TENCENT_MAP_KEY</code> 环境变量。
      </div>

      <div class="api-preview">
        <div class="api-title">可用接口预览</div>
        <div class="api-grid">
          <div class="api-item"><code>GET /api/map/geocoder</code><span>地理编码</span></div>
          <div class="api-item"><code>GET /api/map/reverse-geocoder</code><span>逆地理编码</span></div>
          <div class="api-item"><code>GET /api/map/place-search</code><span>地点搜索</span></div>
          <div class="api-item"><code>GET /api/map/suggestion</code><span>输入提示</span></div>
          <div class="api-item"><code>GET /api/map/distance</code><span>距离计算</span></div>
          <div class="api-item"><code>GET /api/map/ip-location</code><span>IP定位</span></div>
          <div class="api-item"><code>GET /api/map/translate-coord</code><span>坐标转换</span></div>
        </div>
      </div>

      <div class="env-hint">
        <span>🔒 环境变量：</span>
        <code>TENCENT_MAP_KEY</code>
      </div>
    </div>

    <!-- ==================== 💳 支付配置 ==================== -->
    <div class="settings-section infra-section">
      <h3><span class="section-icon">💳</span> 支付配置</h3>
      <p class="section-desc">管理微信支付和支付宝支付参数</p>

      <!-- 微信支付 -->
      <div class="sub-section">
        <h4>微信支付</h4>
        <div class="form-row">
          <div class="form-group form-col">
            <label>AppID <span class="label-hint">（后4位）</span></label>
            <input v-model="systemSettings.wechatAppId" type="text" class="form-input" readonly />
          </div>
          <div class="form-group form-col">
            <label>商户号 MchID <span class="label-hint">（后4位）</span></label>
            <input v-model="systemSettings.wechatMchId" type="text" class="form-input" readonly />
          </div>
        </div>
        <div class="form-group">
          <label>API密钥</label>
          <input v-model="systemSettings.wechatApiKey" type="password" class="form-input" readonly placeholder="****" />
        </div>
        <div class="api-preview small">
          <div class="api-title">微信支付接口</div>
          <div class="api-grid">
            <div class="api-item"><code>POST /api/pay/wx-order</code><span>创建订单</span></div>
            <div class="api-item"><code>POST /api/pay/wx-notify</code><span>支付回调</span></div>
            <div class="api-item"><code>GET /api/pay/wx-query</code><span>订单查询</span></div>
            <div class="api-item"><code>POST /api/pay/wx-close</code><span>关闭订单</span></div>
          </div>
        </div>
        <div class="env-hint"><span>🔒 环境变量：</span><code>WECHAT_APPID / WECHAT_MCHID / WECHAT_API_KEY</code></div>
      </div>

      <!-- 支付宝 -->
      <div class="sub-section">
        <h4>支付宝支付</h4>
        <div class="form-group">
          <label>应用 AppID <span class="label-hint">（后4位）</span></label>
          <input v-model="systemSettings.alipayAppId" type="text" class="form-input" readonly />
        </div>
        <div class="form-group">
          <label>应用私钥</label>
          <input v-model="systemSettings.alipayPrivateKey" type="password" class="form-input" readonly placeholder="****" />
        </div>
        <div class="form-group">
          <label>支付宝公钥</label>
          <input v-model="systemSettings.alipayPublicKey" type="password" class="form-input" readonly placeholder="****" />
        </div>
        <div class="api-preview small">
          <div class="api-title">支付宝接口</div>
          <div class="api-grid">
            <div class="api-item"><code>POST /api/pay/alipay-order</code><span>创建订单</span></div>
            <div class="api-item"><code>POST /api/pay/alipay-notify</code><span>支付回调</span></div>
            <div class="api-item"><code>GET /api/pay/alipay-query</code><span>订单查询</span></div>
            <div class="api-item"><code>POST /api/pay/alipay-close</code><span>关闭订单</span></div>
          </div>
        </div>
        <div class="env-hint"><span>🔒 环境变量：</span><code>ALIPAY_APP_ID / ALIPAY_PRIVATE_KEY / ALIPAY_PUBLIC_KEY</code></div>
      </div>
    </div>

    <!-- ==================== 🤖 大模型AI配置 ==================== -->
    <div class="settings-section infra-section">
      <h3><span class="section-icon">🤖</span> 大模型AI配置</h3>
      <p class="section-desc">配置AI大模型接入，为机器人聊天提供智能回复能力。支持任何兼容 OpenAI 接口的服务（OpenAI / DeepSeek / Moonshot / 本地模型等）</p>

      <div class="form-group flex-group">
        <label>
          <input type="checkbox" v-model="systemSettings.llmEnabled" />
          启用大模型功能
        </label>
        <small class="form-hint">开启后系统机器人将调用大模型API进行智能对话</small>
      </div>

      <template v-if="systemSettings.llmEnabled">
        <div class="form-group">
          <label>AI 提供商</label>
          <select v-model="systemSettings.llmProvider" class="form-input">
            <option value="openai">OpenAI</option>
            <option value="deepseek">DeepSeek</option>
            <option value="moonshot">Moonshot（月之暗面）</option>
            <option value="zhipu">智谱AI（GLM）</option>
            <option value="qwen">通义千问</option>
            <option value="custom">自定义（兼容OpenAI接口）</option>
          </select>
        </div>

        <div class="form-group">
          <label>API Key <span class="label-hint">（仅显示后4位，输入新值覆盖）</span></label>
          <input v-model="systemSettings.llmApiKey" type="password" class="form-input" placeholder="sk-****" />
        </div>

        <div class="form-group">
          <label>API 端点地址</label>
          <input v-model="systemSettings.llmApiEndpoint" type="text" class="form-input" placeholder="https://api.openai.com/v1" />
        </div>

        <div class="form-row">
          <div class="form-group form-col">
            <label>模型名称</label>
            <input v-model="systemSettings.llmModel" type="text" class="form-input" placeholder="gpt-3.5-turbo" />
          </div>
          <div class="form-group form-col">
            <label>最大Token数</label>
            <input v-model.number="systemSettings.llmMaxTokens" type="number" class="form-input" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group form-col">
            <label>温度 (Temperature)</label>
            <input v-model.number="systemSettings.llmTemperature" type="number" step="0.1" min="0" max="2" class="form-input" />
            <small class="form-hint">0=精确确定，1=更有创意</small>
          </div>
        </div>

        <div class="form-group">
          <label>系统提示词 (System Prompt)</label>
          <textarea v-model="systemSettings.llmSystemPrompt" class="form-textarea" rows="3" placeholder="定义AI助手的角色和行为..."></textarea>
          <small class="form-hint">角色设定，例如："你是一个友好、专业的陪玩助手..."</small>
        </div>

        <div class="sub-section">
          <h4>常用API端点参考</h4>
          <table class="ref-table">
            <thead><tr><th>提供商</th><th>API地址</th><th>推荐模型</th></tr></thead>
            <tbody>
              <tr><td>OpenAI</td><td>https://api.openai.com/v1</td><td>gpt-4o-mini / gpt-3.5-turbo</td></tr>
              <tr><td>DeepSeek</td><td>https://api.deepseek.com/v1</td><td>deepseek-v4-pro / deepseek-v4-flash</td></tr>
              <tr><td>Moonshot</td><td>https://api.moonshot.cn/v1</td><td>moonshot-v1-8k</td></tr>
              <tr><td>智谱GLM</td><td>https://open.bigmodel.cn/api/paas/v4</td><td>glm-4-flash</td></tr>
              <tr><td>通义千问</td><td>https://dashscope.aliyuncs.com/compatible-mode/v1</td><td>qwen-turbo</td></tr>
            </tbody>
          </table>
        </div>

        <div class="api-preview">
          <div class="api-title">机器人聊天接口</div>
          <div class="api-grid">
            <div class="api-item"><code>POST /api/llm/chat</code><span>发送消息</span></div>
            <div class="api-item"><code>GET /api/llm/config</code><span>查询配置</span></div>
          </div>
        </div>
      </template>

      <div class="env-hint">
        <span>🔒 环境变量（优先级高于页面配置）：</span>
        <code>LLM_ENABLED / LLM_API_KEY / LLM_API_ENDPOINT / LLM_MODEL / LLM_SYSTEM_PROMPT</code>
      </div>
    </div>

    <!-- ==================== 保存按钮 ==================== -->
    <div class="settings-actions">
      <button @click="resetSettings" class="btn-reset">恢复默认</button>
      <button @click="saveSettings" :disabled="saving" class="btn-save">
        {{ saving ? '保存中...' : '保存设置' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin'

const { apiGet, apiPut } = useAdmin()

const defaults = {
  // 基础
  siteName: '多客陪玩',
  siteDescription: '多客陪玩 - 专业游戏陪玩平台',
  siteKeywords: '陪玩,游戏陪玩,陪玩平台',
  siteLogo: '',
  recordNumber: '',
  contactPhone: '400-888-8888',
  contactEmail: 'admin@duoke.com',
  // 用户
  userDefaultAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  userInitBalance: 0,
  userInitScore: 0,
  withdrawMinAmount: 50,
  withdrawFeeRate: 0.02,
  withdrawAutoApprove: false,
  platformCommissionRate: 0.7,
  // 注册
  registerEnabled: true,
  registerNeedPhone: true,
  registerNeedRealName: false,
  // 功能
  reviewContentEnabled: true,
  giftEnabled: true,
  voiceChatEnabled: true,
  videoChatEnabled: true,
  thirdPartyLoginEnabled: true,
  // 存储
  storageProvider: 'local',
  cosSecretId: '',
  cosSecretKey: '',
  cosBucket: '',
  cosRegion: '',
  qiniuAccessKey: '',
  qiniuSecretKey: '',
  qiniuBucket: '',
  qiniuDomain: '',
  qiniuZone: 'z0',
  // 地图
  mapProvider: 'tencent',
  tencentMapKey: '',
  // 微信支付
  wechatAppId: '',
  wechatMchId: '',
  wechatApiKey: '',
  // 支付宝
  alipayAppId: '',
  alipayPrivateKey: '',
  alipayPublicKey: '',
  // 大模型AI
  llmEnabled: false,
  llmProvider: 'deepseek',
  llmApiKey: '',
  llmApiEndpoint: 'https://api.deepseek.com/v1',
  llmModel: 'deepseek-v4-flash',
  llmMaxTokens: 8192,
  llmTemperature: 0.7,
  llmSystemPrompt: '你是一个友好、专业的陪玩助手，帮助用户解答问题、提供陪伴和娱乐服务。请用热情亲切的语气回复。',
}

const systemSettings = ref({ ...defaults })
const saving = ref(false)
const toast = reactive({ show: false, message: '', type: 'success' })

const showToast = (message, type = 'success') => {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => { toast.show = false }, 3000)
}

const loadSettings = async () => {
  try {
    const res = await apiGet('/api/admin/settings')
    if (res.code === 200 && res.data) {
      Object.assign(systemSettings.value, res.data)
    }
  } catch (e) {
    showToast('加载设置失败', 'error')
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const res = await apiPut('/api/admin/settings', systemSettings.value)
    if (res.code === 200) {
      showToast('设置保存成功')
    } else {
      showToast(res.message || '保存失败', 'error')
    }
  } catch (e) {
    showToast('保存失败，请检查网络', 'error')
  } finally {
    saving.value = false
  }
}

const resetSettings = () => {
  Object.assign(systemSettings.value, defaults)
  showToast('已恢复默认设置，请点击保存')
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
/* Toast */
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  color: #fff;
  z-index: 9999;
  animation: slideIn 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.toast-success { background: #00b894; }
.toast-error { background: #d63031; }
.toast-warning { background: #fdcb6e; color: #333; }

.settings-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.infra-section {
  border-left: 3px solid #6c5ce7;
}

.settings-section h3 {
  margin: 0 0 20px;
  font-size: 16px;
  color: #1a1a1a;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.section-icon {
  font-size: 20px;
  margin-right: 4px;
}

.section-desc {
  margin: -12px 0 16px;
  font-size: 13px;
  color: #999;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #555;
  margin-bottom: 6px;
}

.label-hint {
  font-weight: 400;
  color: #9ca3af;
  font-size: 12px;
}

.form-input {
  width: 100%;
  max-width: 420px;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
  background: #fafafa;
}

.form-input:focus {
  outline: none;
  border-color: #6c5ce7;
  box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1);
  background: #fff;
}

.form-input[readonly], .form-input[disabled] {
  background: #f5f5f5;
  color: #888;
  cursor: not-allowed;
}

.flex-group {
  display: flex;
  flex-direction: column;
}

.flex-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  margin-bottom: 4px;
}

.flex-group input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #6c5ce7;
  cursor: pointer;
}

.form-hint {
  color: #aaa;
  font-size: 12px;
  margin-left: 24px;
}

/* 双列布局 */
.form-row {
  display: flex;
  gap: 16px;
}

.form-col {
  flex: 1;
}

/* 子区块 */
.sub-section {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.sub-section h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #444;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

/* 信息提示 */
.info-banner {
  padding: 12px 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  font-size: 13px;
  color: #0369a1;
  margin-bottom: 12px;
  line-height: 1.6;
}

.info-banner.warning {
  background: #fffbeb;
  border-color: #fcd34d;
  color: #92400e;
}

.info-banner code {
  background: rgba(0,0,0,0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

/* 环境变量提示 */
.env-hint {
  padding: 8px 12px;
  background: #f5f3ff;
  border-radius: 8px;
  font-size: 12px;
  color: #6d28d9;
  margin-top: 8px;
}

.env-hint code {
  background: rgba(109,40,217,0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  display: inline-block;
  margin-top: 4px;
}

/* API 接口预览 */
.api-preview {
  margin-top: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #eee;
}

.api-preview.small {
  padding: 8px 12px;
}

.api-title {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.api-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 6px;
}

.api-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 4px 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.api-item code {
  font-size: 11px;
  color: #6c5ce7;
}

.api-item span {
  color: #999;
  font-size: 11px;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 8px 0;
}

.btn-save {
  padding: 12px 32px;
  background: #6c5ce7;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-save:hover { background: #5a4bd1; }
.btn-save:disabled { background: #b2a8f0; cursor: not-allowed; }

.btn-reset {
  padding: 12px 24px;
  background: #fff;
  color: #666;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset:hover { border-color: #d63031; color: #d63031; }

.form-textarea {
  width: 100%;
  max-width: 540px;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
  background: #fafafa;
  font-family: inherit;
  line-height: 1.6;
}

.form-textarea:focus {
  outline: none;
  border-color: #6c5ce7;
  box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1);
  background: #fff;
}

/* 参考表格 */
.ref-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-top: 8px;
}

.ref-table th {
  background: #f5f3ff;
  color: #6d28d9;
  font-weight: 600;
  padding: 8px 12px;
  text-align: left;
  border-bottom: 2px solid #e9d5ff;
}

.ref-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  color: #555;
}

.ref-table tr:hover td {
  background: #faf9ff;
}

.ref-table code {
  background: rgba(108, 92, 231, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #6c5ce7;
}
</style>
