<template>
  <view class="login-page">
    <view class="login-container">
      <view class="login-header">
        <view class="logo">🎮</view>
        <view class="title">eu搭子</view>
        <view class="subtitle">连接游戏玩家与陪玩师</view>
      </view>

      <view class="login-tabs">
        <text :class="['login-tab', { active: loginMode === 'password' }]" @click="loginMode = 'password'">密码登录</text>
        <text :class="['login-tab', { active: loginMode === 'code' }]" @click="loginMode = 'code'">验证码登录</text>
      </view>

      <view v-show="loginMode === 'password'" class="login-form">
        <view class="form-group">
          <label class="form-label">手机号</label>
          <input 
            v-model="phone" 
            type="tel" 
            class="form-input" 
            placeholder="请输入手机号"
          />
        </view>

        <view class="form-group">
          <label class="form-label">密码</label>
          <input 
            v-model="password" 
            type="password" 
            class="form-input" 
            placeholder="请输入密码"
          />
        </view>

        <button type="button" @click="handleLogin" class="login-btn" :disabled="isLoading || retryCooldown > 0">
          {{ retryCooldown > 0 ? retryCooldown + 's 后可重试' : (isLoading ? '登录中...' : '登 录') }}
        </button>
      </view>

      <view v-show="loginMode === 'code'" class="login-form">
        <view class="form-group">
          <label class="form-label">手机号</label>
          <input v-model="codePhone" type="tel" class="form-input" placeholder="请输入手机号" />
        </view>

        <view class="form-group">
          <label class="form-label">验证码</label>
          <view class="code-row">
            <input v-model="codeValue" type="text" class="form-input" placeholder="请输入验证码" />
            <button type="button" class="code-btn" :disabled="loginCodeSending" @click="sendLoginCode">
              {{ loginCodeSending ? loginCountdown + 's' : '获取验证码' }}
            </button>
          </view>
        </view>

        <button type="button" @click="handleCodeLogin" class="login-btn" :disabled="isLoading">
          {{ isLoading ? '登录中...' : '登 录' }}
        </button>
      </view>

      <view class="third-login">
        <view class="third-divider"><text>其他登录方式</text></view>
        <view class="third-btns">
          <button type="button" class="third-btn wechat" :disabled="isLoading" @click="handleThirdLogin('wechat')">微信登录</button>
          <button type="button" class="third-btn qq" :disabled="isLoading" @click="handleThirdLogin('qq')">QQ 登录</button>
        </view>
      </view>

      <view class="login-links">
        <text class="link" @click="showRegister = true">注册账号</text>
        <text class="link" @click="showForgot = true">忘记密码</text>
      </view>
    </view>

    <Teleport to="body">
      <transition name="modal">
        <view v-if="showRegister" class="modal-overlay" @click.self="showRegister = false">
          <view class="modal-box">
            <view class="modal-header">
              <text class="modal-title">注册账号</text>
              <text class="modal-close" @click="showRegister = false">✕</text>
            </view>
            <view class="modal-body">
              <view class="form-group">
                <label class="form-label">手机号</label>
                <input v-model="regPhone" type="text" class="form-input" placeholder="请输入手机号" />
              </view>
              <view class="form-group">
                <label class="form-label">验证码</label>
                <view class="code-row">
                  <input v-model="regCode" type="text" class="form-input" placeholder="请输入验证码" />
                  <button class="code-btn" :disabled="codeSending" @click="sendCode">{{ codeCountdown > 0 ? codeCountdown + 's' : (codeSending ? '发送中' : '获取验证码') }}</button>
                </view>
              </view>
              <view class="form-group">
                <label class="form-label">设置密码</label>
                <input v-model="regPwd" type="password" class="form-input" placeholder="请设置6-16位密码" />
              </view>
              <button class="submit-btn" @click="handleRegister">注册</button>
            </view>
          </view>
        </view>
      </transition>

      <transition name="modal">
        <view v-if="showForgot" class="modal-overlay" @click.self="showForgot = false">
          <view class="modal-box">
            <view class="modal-header">
              <text class="modal-title">找回密码</text>
              <text class="modal-close" @click="showForgot = false">✕</text>
            </view>
            <view class="modal-body">
              <view class="form-group">
                <label class="form-label">手机号</label>
                <input v-model="forgotPhone" type="text" class="form-input" placeholder="请输入注册手机号" />
              </view>
              <view class="form-group">
                <label class="form-label">验证码</label>
                <view class="code-row">
                  <input v-model="forgotCode" type="text" class="form-input" placeholder="请输入验证码" />
                  <button class="code-btn" :disabled="codeSending" @click="sendCode">{{ codeCountdown > 0 ? codeCountdown + 's' : (codeSending ? '发送中' : '获取验证码') }}</button>
                </view>
              </view>
              <view class="form-group">
                <label class="form-label">新密码</label>
                <input v-model="forgotPwd" type="password" class="form-input" placeholder="请设置新密码" />
              </view>
              <button class="submit-btn" @click="handleResetPwd">重置密码</button>
            </view>
          </view>
        </view>
      </transition>
    </Teleport>
  </view>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRouter, canResolve } from '@/common/route'
import { isApp } from '../common/platform'
import { useUserStore } from '../store/user-info'
import { toast } from '../composables/useToast'
import { RequestError } from '../common/common'

const router = useRouter()

const readLoginRedirect = () => {
  try {
    const q = router.currentRoute.value.query.redirect
    if (q) return q
  } catch (e) {}
  try {
    const saved = uni.getStorageSync('__kaifa_login_redirect__')
    if (saved) { uni.removeStorageSync('__kaifa_login_redirect__'); return saved }
  } catch (e) {}
  return '/home'
}

const userStore = useUserStore()

const phone = ref('')
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
const codeCountdown = ref(0)
// C-7：429（IP 限流/账号锁定）后的冷却倒计时，禁用登录按钮并显示剩余秒数
const retryCooldown = ref(0)
let retryTimer = null

const startRetryCooldown = (seconds) => {
  const safe = Math.max(1, Math.min(Number(seconds) || 0, 3600))
  if (!safe) return
  retryCooldown.value = safe
  if (retryTimer) clearInterval(retryTimer)
  retryTimer = setInterval(() => {
    retryCooldown.value -= 1
    if (retryCooldown.value <= 0) {
      clearInterval(retryTimer)
      retryTimer = null
      retryCooldown.value = 0
    }
  }, 1000)
}

// C-7：发送验证码被 429 限流时用服务端 retryAfterSec 锁住按钮
const startCodeCooldown = (seconds) => {
  const safe = Math.max(1, Math.min(Number(seconds) || 0, 300))
  if (!safe) return
  codeSending.value = true
  codeCountdown.value = safe
  const timer = setInterval(() => {
    codeCountdown.value -= 1
    if (codeCountdown.value <= 0) {
      clearInterval(timer)
      codeSending.value = false
    }
  }, 1000)
}

const loginMode = ref('password')
const codePhone = ref('')
const codeValue = ref('')
const loginCodeSending = ref(false)
const loginCountdown = ref(0)
let loginTimer = null

const redirectAfterLogin = async () => {
  let redirect = readLoginRedirect()
  try {
    const decoded = decodeURIComponent(redirect)
    // 用 canResolve 而不是 getRoutes 严格等值：动态路由（/post-detail/:id）也能回跳
    redirect = canResolve(decoded) ? decoded : '/home'
  } catch (e) {
    redirect = '/home'
  }
  await nextTick()
  try {
    await router.push(redirect)
  } catch (error) {
    await router.push('/home')
  }
}

const sendLoginCode = async () => {
  if (!codePhone.value.trim()) { toast.warning('请输入手机号'); return }
  if (!/^1[3-9]\d{9}$/.test(codePhone.value.trim())) { toast.warning('手机号格式不正确'); return }
  loginCodeSending.value = true
  try {
    const result = await userStore.sendSms(codePhone.value.trim(), 'login')
    if (result.success) {
      // 非生产环境后端会回传验证码，自动填入以便联调；生产恒为空
      if (result.devCode) codeValue.value = result.devCode
      toast.success('验证码已发送', 5000)
      let countdown = 60
      loginCountdown.value = countdown
      loginTimer = setInterval(() => {
        countdown--
        loginCountdown.value = countdown
        if (countdown <= 0) {
          clearInterval(loginTimer)
          loginTimer = null
          loginCodeSending.value = false
        }
      }, 1000)
    } else {
      toast.error(result.message || '发送失败')
      loginCodeSending.value = false
    }
  } catch (error) {
    console.error('发送登录验证码失败:', error)
    toast.error('发送失败，请重试')
    loginCodeSending.value = false
  }
}

const handleCodeLogin = async () => {
  if (!codePhone.value.trim()) { toast.warning('请输入手机号'); return }
  if (!/^1[3-9]\d{9}$/.test(codePhone.value.trim())) { toast.warning('手机号格式不正确'); return }
  if (!codeValue.value.trim()) { toast.warning('请输入验证码'); return }
  isLoading.value = true
  try {
    const result = await userStore.loginMobile(codePhone.value.trim(), codeValue.value.trim())
    if (result.success) {
      toast.success('登录成功')
      await redirectAfterLogin()
    } else {
      toast.error(result.message || '登录失败')
    }
  } catch (error) {
    if (error instanceof RequestError && error.status === 422) {
      toast.error('验证码错误或已过期')
      return
    }
    toast.error(error.message || '登录失败，请重试')
  } finally {
    isLoading.value = false
  }
}

// App 端拉起对应平台的授权 SDK，只有拿到 openid/uid 才说明授权链路可用；
// 未配置平台 SDK 的基座里 uni.login 会直接 fail，这里统一回落空串交给调用方提示。
const requestAppAuth = (provider) => new Promise((resolve) => {
  // 直接调 uni.login（不要取出方法引用），保留 uni API 方法内的 this 绑定
  if (typeof uni === 'undefined' || !uni || typeof uni.login !== 'function') { resolve(''); return }
  const providerMap = { wechat: 'weixin', qq: 'qq' }
  try {
    uni.login({
      provider: providerMap[provider] || provider,
      success: (res) => {
        const authResult = (res && (res.authResult || res.auth_result)) || res || {}
        resolve(authResult.openid || authResult.openId || authResult.uid || '')
      },
      fail: () => resolve('')
    })
  } catch (e) {
    resolve('')
  }
})

// 第三方登录：H5 依赖平台授权回调带回的 openId（?provider=wechat&openId=xxx），
// App 端先尝试拉起平台授权。拿不到授权信息时只提示、不伪造登录。
const handleThirdLogin = async (provider) => {
  if (isLoading.value) return
  const q = router.currentRoute.value.query || {}
  const fromProvider = q.provider
  let openId = q.openId || q.openid || ''
  const userInfo = { nickname: q.nickname || '', avatar: q.avatar || '' }

  if (!isApp) {
    // 与旧站同款提示：H5 没有授权回调参数时不能发起第三方登录
    if (!openId || (fromProvider && fromProvider !== provider)) {
      toast.info('第三方登录需经对应平台授权后回调，当前未接入')
      return
    }
  } else {
    if (!openId) openId = await requestAppAuth(provider)
    if (!openId) {
      toast.info('第三方登录需在对应平台授权后接入，当前未接入')
      return
    }
  }

  isLoading.value = true
  try {
    const result = await userStore.loginThird(provider, openId, userInfo)
    if (result.success) {
      toast.success('登录成功')
      await redirectAfterLogin()
    } else {
      toast.error(result.message || '登录失败')
    }
  } catch (error) {
    toast.error(error.message || '登录失败')
  } finally {
    isLoading.value = false
  }
}

const handleFieldErrors = (error) => {
  if (error.fieldErrors && typeof error.fieldErrors === 'object') {
    const errorMessages = []
    for (const [field, messages] of Object.entries(error.fieldErrors)) {
      const fieldNames = {
        phone: '手机号',
        password: '密码',
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
  // 增强表单验证
  if (!phone.value.trim()) {
    toast.warning('请输入手机号')
    return
  }

  // 手机号格式验证
  if (!/^1[3-9]\d{9}$/.test(phone.value.trim())) {
    toast.warning('手机号格式不正确')
    return
  }

  if (!password.value) {
    toast.warning('请输入密码')
    return
  }

  if (password.value.length < 6) {
    toast.warning('密码至少6位')
    return
  }

  if (password.value.length > 16) {
    toast.warning('密码最多16位')
    return
  }

  isLoading.value = true

  try {
    const result = await userStore.login({
      phone: phone.value.trim(),
      password: password.value
    })

    if (result.success) {
      toast.success('登录成功')
      let redirect = readLoginRedirect()

      if (redirect) {
        try {
          const decoded = decodeURIComponent(redirect)
          if (canResolve(decoded)) {
            redirect = decoded
          } else {
            console.warn('无效的重定向路径:', decoded, '，将跳转到首页')
            redirect = '/home'
          }
        } catch (e) {
          console.warn('重定向路径解码失败:', redirect, '，将跳转到首页')
          redirect = '/home'
        }
      }

      // 使用 nextTick 替代 setTimeout，确保 DOM 更新后立即跳转
      await nextTick()
      try {
        await router.push(redirect)
        if (import.meta.env.DEV) console.log('跳转成功:', redirect)
      } catch (error) {
        console.error('跳转失败:', error)
        await router.push('/home')
      }
    } else {
      if (result.error && result.error.fieldErrors) {
        handleFieldErrors(result.error)
      } else {
        toast.error(result.message || '登录失败')
        if (result.retryAfterSec) startRetryCooldown(result.retryAfterSec)
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    if (error.retryAfterSec) startRetryCooldown(error.retryAfterSec)
    if (error instanceof RequestError) {
      if (error.status === 422 && handleFieldErrors(error)) {
        return
      }
      if (error.status === 422) {
        toast.error('登录信息验证失败，请检查手机号和密码格式')
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
      // 非生产环境后端会回传验证码，自动填入对应输入框；生产恒为空
      if (result.devCode) {
        if (showRegister.value) regCode.value = result.devCode
        else forgotCode.value = result.devCode
      }
      toast.success('验证码已发送', 5000)
      
      let countdown = 60
      codeCountdown.value = countdown
      const timer = setInterval(() => {
        countdown--
        codeCountdown.value = countdown
        if (countdown <= 0) {
          clearInterval(timer)
          codeSending.value = false
        }
      }, 1000)
    } else {
      toast.error(result.message || '发送失败')
      codeSending.value = false
      if (result.retryAfterSec) startCodeCooldown(result.retryAfterSec)
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    toast.error(error.message || '发送失败，请重试')
    codeSending.value = false
    if (error.retryAfterSec) startCodeCooldown(error.retryAfterSec)
  }
}

const handleRegister = async () => {
  // 增强注册表单验证
  if (!regPhone.value.trim()) {
    toast.warning('请输入手机号')
    return
  }

  if (!/^1[3-9]\d{9}$/.test(regPhone.value.trim())) {
    toast.warning('手机号格式不正确')
    return
  }

  if (!regCode.value.trim()) {
    toast.warning('请输入验证码')
    return
  }

  if (regCode.value.length < 4 || regCode.value.length > 6) {
    toast.warning('验证码格式不正确（4-6位）')
    return
  }

  if (!regPwd.value) {
    toast.warning('请设置密码')
    return
  }

  if (regPwd.value.length < 6) {
    toast.warning('密码至少6位')
    return
  }

  if (regPwd.value.length > 16) {
    toast.warning('密码最多16位')
    return
  }

  // 密码强度提示（可选）
  const hasNumber = /\d/.test(regPwd.value)
  const hasLetter = /[a-zA-Z]/.test(regPwd.value)
  if (!(hasNumber && hasLetter)) {
    toast.info('建议使用字母+数字组合的密码更安全')
  }

  try {
    const result = await userStore.register(regPhone.value, regPwd.value, regCode.value)
    
    if (result.success) {
      toast.success('注册成功')
      showRegister.value = false
      
      let redirect = readLoginRedirect()
      try {
        const decoded = decodeURIComponent(redirect)
        redirect = canResolve(decoded) ? decoded : '/home'
      } catch (e) {
        redirect = '/home'
      }
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
  // 增强重置密码表单验证
  if (!forgotPhone.value.trim()) {
    toast.warning('请输入手机号')
    return
  }

  if (!/^1[3-9]\d{9}$/.test(forgotPhone.value.trim())) {
    toast.warning('手机号格式不正确')
    return
  }

  if (!forgotCode.value.trim()) {
    toast.warning('请输入验证码')
    return
  }

  if (forgotCode.value.length < 4 || forgotCode.value.length > 6) {
    toast.warning('验证码格式不正确（4-6位）')
    return
  }

  if (!forgotPwd.value) {
    toast.warning('请设置新密码')
    return
  }

  if (forgotPwd.value.length < 6) {
    toast.warning('密码至少6位')
    return
  }

  if (forgotPwd.value.length > 16) {
    toast.warning('密码最多16位')
    return
  }

  try {
    const result = await userStore.resetPassword(forgotPhone.value, forgotPwd.value, forgotCode.value)
    
    if (result.success) {
      toast.success('密码重置成功，请登录')
      showForgot.value = false
      phone.value = forgotPhone.value
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
  min-height: 100dvh;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 360px;
  background-color: #fff;
  border-radius: 0px;
  padding: 40px 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input::placeholder {
  color: #ccc;
}

.login-btn {
  width: 100%;
  height: 50px;
  background: var(--gradient-primary);
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
  color: var(--color-primary);
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

.code-tip {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  font-size: 13px;
  color: #166534;
  display: flex;
  align-items: center;
  gap: 8px;
}

.code-tip strong {
  font-size: 16px;
  letter-spacing: 2px;
  color: #15803d;
}

.code-tip-action {
  margin-left: auto;
  font-size: 12px;
  color: #2563eb;
  cursor: pointer;
  text-decoration: underline;
}

.code-tip-action:hover {
  color: #1d4ed8;
}

.submit-btn {
  width: 100%;
  height: 48px;
  background: var(--gradient-primary);
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
.login-tabs { display: flex; gap: 20px; margin-bottom: 20px; justify-content: center; }
.login-tab { font-size: 15px; color: #999; padding-bottom: 6px; cursor: pointer; border-bottom: 2px solid transparent; transition: all .2s; }
.login-tab.active { color: var(--color-primary, #667eea); border-bottom-color: var(--color-primary, #667eea); font-weight: 600; }
.third-login { margin-top: 20px; }
.third-divider { display: flex; align-items: center; color: #bbb; font-size: 12px; margin: 12px 0; }
.third-divider::before, .third-divider::after { content: ''; flex: 1; height: 1px; background: #eee; }
.third-divider text { padding: 0 12px; }
.third-btns { display: flex; gap: 12px; }
.third-btn { flex: 1; height: 44px; line-height: 44px; padding: 0; margin: 0; border-radius: 10px; border: 1px solid #eee; background: #fff; font-size: 14px; cursor: pointer; transition: all .2s; }
.third-btn::after { border: none; }
.third-btn:active { transform: scale(0.98); }
.third-btn:disabled { opacity: 0.6; }
.third-btn.wechat { color: #07c160; border-color: #07c160; }
.third-btn.qq { color: #12b7f5; border-color: #12b7f5; }
</style>