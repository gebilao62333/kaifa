<template>
  <Teleport to="body">
    <transition name="login-modal">
      <div v-if="visible" class="login-modal-overlay" @click.self="handleOverlayClick">
        <div class="login-modal-wrapper" :class="{ 'slide-up': visible }">
          <div class="login-modal-container">
            <!-- 关闭按钮 -->
            <button class="login-modal-close" @click="handleClose">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>

            <!-- 头部 -->
            <div class="login-modal-header">
              <div class="login-modal-icon">🎮</div>
              <h2 class="login-modal-title">{{ title }}</h2>
              <p class="login-modal-subtitle">{{ subtitle }}</p>
            </div>

            <!-- 登录方式切换 -->
            <div class="login-tabs">
              <button 
                v-for="tab in tabs" 
                :key="tab.key"
                class="login-tab"
                :class="{ active: activeTab === tab.key }"
                @click="activeTab = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>

            <!-- 表单内容 -->
            <div class="login-form-content">
              <!-- 账号密码登录 -->
              <div v-if="activeTab === 'password'" class="login-form">
                <div class="form-group">
                  <label class="form-label">用户名</label>
                  <input 
                    v-model="formData.username" 
                    type="text" 
                    class="form-input" 
                    placeholder="请输入用户名"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">密码</label>
                  <input 
                    v-model="formData.password" 
                    type="password" 
                    class="form-input" 
                    placeholder="请输入密码"
                  />
                </div>
                <div class="form-actions">
                  <label class="form-checkbox">
                    <input type="checkbox" v-model="rememberMe" />
                    <span class="checkmark"></span>
                    记住我
                  </label>
                  <span class="form-link" @click="showForgotPassword = true">忘记密码?</span>
                </div>
              </div>

              <!-- 手机验证码登录 -->
              <div v-else-if="activeTab === 'mobile'" class="login-form">
                <div class="form-group">
                  <label class="form-label">手机号</label>
                  <input 
                    v-model="formData.phone" 
                    type="tel" 
                    class="form-input" 
                    placeholder="请输入手机号"
                    maxlength="11"
                  />
                </div>
                <div class="form-group code-group">
                  <label class="form-label">验证码</label>
                  <div class="code-input-wrapper">
                    <input 
                      v-model="formData.code" 
                      type="text" 
                      class="form-input code-input" 
                      placeholder="请输入验证码"
                      maxlength="6"
                    />
                    <button 
                      class="code-btn" 
                      :disabled="countdown > 0 || !formData.phone"
                      @click="sendCode"
                    >
                      {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- 第三方登录 -->
              <div v-else-if="activeTab === 'third'" class="third-party-login">
                <button class="third-party-btn wechat" @click="handleThirdLogin('wechat')">
                  <svg class="third-party-icon" viewBox="0 0 24 24" fill="#07C160">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c4.801 0 8.692-3.287 8.692-7.342 0-4.054-3.891-7.339-8.692-7.339zm-3.11 4.213a.96.96 0 1 1 0-1.92.96.96 0 0 1 0 1.92zm2.123 0a.96.96 0 1 1 0-1.92.96.96 0 0 1 0 1.92zm4.05 2.653c-.317 0-.575-.26-.575-.58a.572.572 0 0 1 .575-.58c.316 0 .575.262.575.58a.572.572 0 0 1-.575.58zm-2.025 1.325a.96.96 0 1 1 0-1.92.96.96 0 0 1 0 1.92zm4.05 0a.96.96 0 1 1 0-1.92.96.96 0 0 1 0 1.92z"/>
                  </svg>
                  <span>微信登录</span>
                </button>
                <button class="third-party-btn qq" @click="handleThirdLogin('qq')">
                  <svg class="third-party-icon" viewBox="0 0 24 24" fill="#12B7F5">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.643 6.267l-1.75 8.261c-.074.345-.272.51-.641.51-.125 0-.25-.025-.375-.075l-2.5-1.5c-.2-.125-.275-.375-.2-.575.075-.2.325-.3.525-.2l1.958 1.175 1.5-7.05c.037-.175-.025-.35-.175-.45-.15-.1-.325-.1-.5-.075l-3.5 1.5c-.4.175-.725.5-.725.925 0 .625.525 1.125 1.15 1.125.175 0 .35-.05.5-.15l2.083-1.25 1.333 6.217 2.667-1.5c.5-.275.833-.775.833-1.325V6.767c0-.442-.358-.8-.8-.801z"/>
                  </svg>
                  <span>QQ登录</span>
                </button>
                <button class="third-party-btn weibo" @click="handleThirdLogin('weibo')">
                  <svg class="third-party-icon" viewBox="0 0 24 24" fill="#E6162D">
                    <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zM9.05 17.219c-.384.219-.79.338-1.209.338-.857 0-1.556-.698-1.556-1.556 0-.418.119-.824.338-1.208.219-.384.537-.698.932-.856.395-.158.824-.119 1.17.119.345.238.548.616.548 1.061 0 .857-.698 1.556-1.555 1.556zm1.048-3.211c-1.793-.448-3.247-1.9-3.696-3.693-.449-1.793.449-3.457 2.242-3.906 1.793-.449 3.457.449 3.906 2.242.449 1.793-.449 3.247-2.242 3.697-.356.089-.721.134-1.079.134-.358 0-.723-.045-1.081-.134zm6.505.524c-.321.193-.667.293-1.018.293-.72 0-1.307-.587-1.307-1.308 0-.351.101-.697.293-1.018.193-.321.488-.575.841-.719.353-.144.749-.109 1.079.085.33.193.525.51.525.862 0 .72-.586 1.307-1.306 1.307zm-.967-2.927c-1.498-.375-2.712-1.589-3.087-3.087-.375-1.498.375-2.812 1.873-3.187 1.498-.375 2.812.375 3.187 1.873.375 1.498-.375 2.712-1.873 3.087-.297.074-.606.112-.913.112-.307 0-.616-.038-.914-.113z"/>
                  </svg>
                  <span>微博登录</span>
                </button>
              </div>
            </div>

            <!-- 登录按钮 -->
            <button 
              v-if="activeTab !== 'third'"
              class="login-submit-btn" 
              :disabled="isLoading || !canSubmit"
              @click="handleSubmit"
            >
              {{ isLoading ? '登录中...' : '登 录' }}
            </button>

            <!-- 注册链接 -->
            <div class="login-footer">
              <span>还没有账号?</span>
              <span class="footer-link" @click="handleRegister">立即注册</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '../store/user-info'
import { toast } from '../composables/useToast'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '欢迎回来'
  },
  subtitle: {
    type: String,
    default: '登录后体验更多精彩功能'
  },
  callback: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['close', 'login-success'])

const userStore = useUserStore()

const activeTab = ref('password')
const rememberMe = ref(false)
const countdown = ref(0)
const isLoading = ref(false)
const showForgotPassword = ref(false)

const formData = ref({
  username: '',
  password: '',
  phone: '',
  code: ''
})

const tabs = [
  { key: 'password', label: '账号密码' },
  { key: 'mobile', label: '手机验证码' },
  { key: 'third', label: '第三方登录' }
]

const canSubmit = computed(() => {
  if (activeTab.value === 'password') {
    return formData.value.username && formData.value.password
  } else if (activeTab.value === 'mobile') {
    return formData.value.phone && formData.value.code
  }
  return false
})

watch(() => props.visible, (val) => {
  if (val) {
    formData.value = {
      username: rememberMe.value ? localStorage.getItem('rememberedUsername') || '' : '',
      password: '',
      phone: '',
      code: ''
    }
  }
})

const handleOverlayClick = () => {
  emit('close')
}

const handleClose = () => {
  emit('close')
}

const sendCode = async () => {
  if (!/^1[3-9]\d{9}$/.test(formData.value.phone)) {
    toast.warning('请输入正确的手机号')
    return
  }
  
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)

  try {
    const result = await userStore.sendSms(formData.value.phone, 'login')
    if (!result.success) {
      toast.error(result.message)
      countdown.value = 0
    } else {
      toast.success('验证码发送成功')
    }
  } catch (error) {
    toast.error('发送失败')
    countdown.value = 0
  }
}

const handleSubmit = async () => {
  isLoading.value = true
  
  try {
    let result
    if (activeTab.value === 'password') {
      result = await userStore.login({
        username: formData.value.username,
        password: formData.value.password
      })
    } else if (activeTab.value === 'mobile') {
      result = await userStore.loginMobile(formData.value.phone, formData.value.code)
    }

    if (result.success) {
      toast.success('登录成功')
      
      if (rememberMe.value) {
        localStorage.setItem('rememberedUsername', formData.value.username)
      } else {
        localStorage.removeItem('rememberedUsername')
      }

      emit('login-success')
      
      if (props.callback) {
        props.callback()
      }
      
      emit('close')
    } else {
      toast.error(result.message)
    }
  } catch (error) {
    toast.error('登录失败，请重试')
  } finally {
    isLoading.value = false
  }
}

const handleThirdLogin = async (provider) => {
  toast.info(`即将跳转到${provider === 'wechat' ? '微信' : provider === 'qq' ? 'QQ' : '微博'}登录`)
}

const handleRegister = () => {
  toast.info('注册功能开发中')
}
</script>

<style lang="scss" scoped>
.login-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.login-modal-wrapper {
  width: 90%;
  max-width: 420px;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  transform: translateY(20px);
  opacity: 0;
  transition: all 0.3s ease;
  
  &.slide-up {
    transform: translateY(0);
    opacity: 1;
  }
}

.login-modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #333;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
}

.login-modal-container {
  padding: 32px;
  position: relative;
}

.login-modal-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-modal-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.login-modal-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.login-modal-subtitle {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.login-tabs {
  display: flex;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;
}

.login-tab {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  
  &.active {
    background: #fff;
    color: #1a1a1a;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
}

.login-form-content {
  margin-bottom: 24px;
}

.login-form {
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-label {
    display: block;
    font-size: 14px;
    color: #333;
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .form-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    font-size: 14px;
    transition: all 0.2s;
    box-sizing: border-box;
    
    &:focus {
      outline: none;
      border-color: #4a90d9;
      box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.1);
    }
    
    &::placeholder {
      color: #ccc;
    }
  }
  
  .code-group {
    .code-input-wrapper {
      display: flex;
      gap: 12px;
    }
    
    .code-input {
      flex: 1;
    }
    
    .code-btn {
      padding: 12px 20px;
      border: none;
      background: linear-gradient(135deg, #4a90d9, #357abd);
      color: #fff;
      border-radius: 10px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      
      &:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
      
      &:hover:not(:disabled) {
        opacity: 0.9;
      }
    }
  }
  
  .form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
  }
  
  .form-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #666;
    cursor: pointer;
    
    input {
      display: none;
    }
    
    .checkmark {
      width: 18px;
      height: 18px;
      border: 1px solid #ddd;
      border-radius: 4px;
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        left: 6px;
        top: 2px;
        width: 5px;
        height: 10px;
        border: solid #4a90d9;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        opacity: 0;
        transition: opacity 0.2s;
      }
    }
    
    input:checked + .checkmark {
      background: #4a90d9;
      border-color: #4a90d9;
      
      &::after {
        opacity: 1;
      }
    }
  }
  
  .form-link {
    font-size: 13px;
    color: #4a90d9;
    cursor: pointer;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.third-party-login {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.third-party-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #333;
  
  &:hover {
    background: #fafafa;
    border-color: #ccc;
  }
  
  .third-party-icon {
    width: 24px;
    height: 24px;
  }
  
  &.wechat:hover {
    border-color: #07C160;
    background: rgba(7, 193, 96, 0.05);
  }
  
  &.qq:hover {
    border-color: #12B7F5;
    background: rgba(18, 183, 245, 0.05);
  }
  
  &.weibo:hover {
    border-color: #E6162D;
    background: rgba(230, 22, 45, 0.05);
  }
}

.login-submit-btn {
  width: 100%;
  padding: 14px;
  border: none;
  background: linear-gradient(135deg, #4a90d9, #357abd);
  color: #fff;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 144, 217, 0.3);
  }
}

.login-footer {
  text-align: center;
  font-size: 14px;
  color: #999;
  
  .footer-link {
    color: #4a90d9;
    margin-left: 8px;
    cursor: pointer;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.login-modal-enter-active,
.login-modal-leave-active {
  transition: opacity 0.3s ease;
}

.login-modal-enter-from,
.login-modal-leave-to {
  opacity: 0;
}
</style>