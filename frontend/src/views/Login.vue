<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="logo">🎮</div>
        <div class="title">多客陪玩</div>
        <div class="subtitle">连接游戏玩家与陪玩师</div>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input 
            v-model="username" 
            type="text" 
            class="form-input" 
            placeholder="请输入用户名"
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <input 
            v-model="password" 
            type="password" 
            class="form-input" 
            placeholder="请输入密码"
          />
        </div>

        <button type="submit" class="login-btn" :disabled="isLoading">
          {{ isLoading ? '登录中...' : '登 录' }}
        </button>
      </form>

      <div class="login-links">
        <span class="link" @click="showRegister = true">注册账号</span>
        <span class="link" @click="showForgot = true">忘记密码</span>
      </div>
    </div>

    <Teleport to="body">
      <transition name="modal">
        <div v-if="showRegister" class="modal-overlay" @click.self="showRegister = false">
          <div class="modal-box">
            <div class="modal-header">
              <span class="modal-title">注册账号</span>
              <span class="modal-close" @click="showRegister = false">✕</span>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">手机号</label>
                <input v-model="regPhone" type="text" class="form-input" placeholder="请输入手机号" />
              </div>
              <div class="form-group">
                <label class="form-label">验证码</label>
                <div class="code-row">
                  <input v-model="regCode" type="text" class="form-input" placeholder="请输入验证码" />
                  <button class="code-btn" :disabled="codeSending" @click="sendCode">{{ codeSending ? '发送中' : '获取验证码' }}</button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">设置密码</label>
                <input v-model="regPwd" type="password" class="form-input" placeholder="请设置6-16位密码" />
              </div>
              <button class="submit-btn" @click="handleRegister">注册</button>
            </div>
          </div>
        </div>
      </transition>

      <transition name="modal">
        <div v-if="showForgot" class="modal-overlay" @click.self="showForgot = false">
          <div class="modal-box">
            <div class="modal-header">
              <span class="modal-title">找回密码</span>
              <span class="modal-close" @click="showForgot = false">✕</span>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">手机号</label>
                <input v-model="forgotPhone" type="text" class="form-input" placeholder="请输入注册手机号" />
              </div>
              <div class="form-group">
                <label class="form-label">验证码</label>
                <div class="code-row">
                  <input v-model="forgotCode" type="text" class="form-input" placeholder="请输入验证码" />
                  <button class="code-btn" :disabled="codeSending" @click="sendCode">{{ codeSending ? '发送中' : '获取验证码' }}</button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">新密码</label>
                <input v-model="forgotPwd" type="password" class="form-input" placeholder="请设置新密码" />
              </div>
              <button class="submit-btn" @click="handleResetPwd">重置密码</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user-info'
import { toast } from '../composables/useToast'
import { RequestError } from '../common/common'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const showRegister = ref(false)
const showForgot = ref(false)
const regPhone = ref('')
const regCode = ref('')
const regPwd = ref('')
const forgotPhone = ref('')
const forgotCode = ref('')
const forgotPwd = ref('')
const codeSending = ref(false)

const handleFieldErrors = (error) => {
  if (error.fieldErrors && typeof error.fieldErrors === 'object') {
    const errorMessages = []
    for (const [field, messages] of Object.entries(error.fieldErrors)) {
      const fieldNames = {
        username: '用户名',
        password: '密码',
        phone: '手机号',
        code: '验证码',
        email: '邮箱'
      }
      const fieldName = fieldNames[field] || field
      if (Array.isArray(messages)) {
        messages.forEach(msg => {
          errorMessages.push(`${fieldName}${msg}`)
        })
      } else {
        errorMessages.push(`${fieldName}${messages}`)
      }
    }
    if (errorMessages.length > 0) {
      toast.error(errorMessages.join('；'))
      return true
    }
  }
  return false
}

const handleLogin = async () => {
  if (!username.value || !password.value) {
    toast.warning('请输入用户名和密码')
    return
  }
  if (password.value.length < 6) {
    toast.warning('密码至少6位')
    return
  }

  isLoading.value = true

  try {
    const result = await userStore.login({
      username: username.value,
      password: password.value
    })

    if (result.success) {
      toast.success('登录成功')
      let redirect = router.currentRoute.value.query.redirect || '/home'
      
      if (redirect) {
        try {
          const decoded = decodeURIComponent(redirect)
          const validRoutes = router.getRoutes().map(r => r.path)
          if (!validRoutes.includes(decoded)) {
            console.warn('无效的重定向路径:', decoded, '，将跳转到首页')
            redirect = '/home'
          }
        } catch (e) {
          console.warn('重定向路径解码失败:', redirect, '，将跳转到首页')
          redirect = '/home'
        }
      }
      
      setTimeout(async () => {
        try {
          await router.push(redirect)
          console.log('跳转成功:', redirect)
        } catch (error) {
          console.error('跳转失败:', error)
          await router.push('/home')
        }
      }, 500)
    } else {
      if (result.error && result.error.fieldErrors) {
        handleFieldErrors(result.error)
      } else {
        toast.error(result.message || '登录失败')
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    if (error instanceof RequestError) {
      if (error.status === 422 && handleFieldErrors(error)) {
        return
      }
      if (error.status === 422) {
        toast.error('登录信息验证失败，请检查用户名和密码格式')
        return
      }
    }
    toast.error(error.message || '登录失败，请重试')
  } finally {
    isLoading.value = false
  }
}

const sendCode = async () => {
  const phone = showRegister.value ? regPhone.value : forgotPhone.value
  
  if (!phone) {
    toast.warning('请输入手机号')
    return
  }

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    toast.warning('手机号格式不正确')
    return
  }

  codeSending.value = true
  
  try {
    const type = showRegister.value ? 'register' : 'reset'
    const result = await userStore.sendSms(phone, type)
    
    if (result.success) {
      toast.success('验证码已发送')
      
      let countdown = 60
      const timer = setInterval(() => {
        countdown--
        if (countdown <= 0) {
          clearInterval(timer)
          codeSending.value = false
        }
      }, 1000)
    } else {
      toast.error(result.message || '发送失败')
      codeSending.value = false
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    toast.error('发送失败，请重试')
    codeSending.value = false
  }
}

const handleRegister = async () => {
  if (!regPhone.value || !regCode.value || !regPwd.value) {
    toast.warning('请填写完整信息')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(regPhone.value)) {
    toast.warning('手机号格式不正确')
    return
  }
  
  if (regPwd.value.length < 6) {
    toast.warning('密码至少6位')
    return
  }
  
  if (regCode.value.length < 4) {
    toast.warning('验证码格式不正确')
    return
  }

  try {
    const result = await userStore.register(regPhone.value, regPwd.value, regCode.value)
    
    if (result.success) {
      toast.success('注册成功')
      showRegister.value = false
      
      const redirect = router.currentRoute.value.query.redirect || '/home'
      router.push(redirect)
    } else {
      toast.error(result.message || '注册失败')
    }
  } catch (error) {
    console.error('注册失败:', error)
    toast.error('注册失败，请重试')
  }
}

const handleResetPwd = async () => {
  if (!forgotPhone.value || !forgotCode.value || !forgotPwd.value) {
    toast.warning('请填写完整信息')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(forgotPhone.value)) {
    toast.warning('手机号格式不正确')
    return
  }
  
  if (forgotPwd.value.length < 6) {
    toast.warning('密码至少6位')
    return
  }

  try {
    const result = await userStore.resetPassword(forgotPhone.value, forgotPwd.value, forgotCode.value)
    
    if (result.success) {
      toast.success('密码重置成功，请登录')
      showForgot.value = false
      username.value = forgotPhone.value
    } else {
      toast.error(result.message || '重置失败')
    }
  } catch (error) {
    console.error('重置密码失败:', error)
    toast.error('重置失败，请重试')
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: -webkit-linear-gradient(315deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.login-container {
  width: 100%;
  max-width: 360px;
  background-color: #fff;
  border-radius: 10px;
  padding: 40px 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  font-size: 60px;
  margin-bottom: 15px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #999;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.form-input {
  width: 100%;
  height: 48px;
  padding: 0 15px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input::placeholder {
  color: #ccc;
}

.login-btn {
  width: 100%;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-links {
  display: flex;
  justify-content: space-between;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.link {
  font-size: 14px;
  color: #667eea;
  cursor: pointer;
}

.link:hover {
  text-decoration: underline;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 380px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.modal-close {
  font-size: 20px;
  color: #999;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.code-row {
  display: flex;
  gap: 10px;
}

.code-row .form-input {
  flex: 1;
}

.code-btn {
  flex-shrink: 0;
  height: 48px;
  padding: 0 16px;
  background: #f0f0f0;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.code-btn:hover:not(:disabled) {
  background: #e8e8e8;
}

.code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 4px;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .modal-box,
.modal-leave-active .modal-box {
  transition: transform 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* PC端登录页面优化 */
@media (min-width: 768px) {
  .login-page {
    padding: 40px 20px;
  }
  
  .login-container {
    max-width: 400px;
    padding: 36px 32px;
    border-radius: 24px;
  }
  
  .logo {
    font-size: 52px;
  }
  
  .title {
    font-size: 24px;
  }
  
  .login-form {
    gap: 18px;
  }
  
  .form-input {
    height: 46px;
    font-size: 14px;
  }
  
  .login-btn {
    height: 48px;
    font-size: 15px;
    border-radius: 14px;
  }
  
  .login-links {
    margin-top: 20px;
    padding-top: 16px;
  }
  
  .modal-box {
    max-width: 400px;
  }
}

.modal-enter-from .modal-box {
  transform: scale(0.9);
}

.modal-leave-to .modal-box {
  transform: scale(0.9);
}
</style>