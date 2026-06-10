<template>
  <div class="admin-login">
    <div class="login-container">
      <div class="login-header">
        <div class="login-logo">DK</div>
        <h1>多客陪玩管理后台</h1>
        <p>管理员登录</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form" novalidate>
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            id="username"
            v-model.trim="form.username" 
            type="text"
            name="username"
            autocomplete="username"
            placeholder="请输入用户名"
            maxlength="50"
            class="form-input"
            :class="{ 'input-error': fieldErrors.username }"
            @input="clearFieldError('username')"
          />
          <span v-if="fieldErrors.username" class="field-error">{{ fieldErrors.username }}</span>
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <div class="password-wrapper">
            <input 
              id="password"
              v-model="form.password" 
              :type="showPassword ? 'text' : 'password'"
              name="password"
              autocomplete="current-password"
              placeholder="请输入密码"
              maxlength="128"
              class="form-input"
              :class="{ 'input-error': fieldErrors.password }"
              @input="clearFieldError('password')"
            />
            <button 
              type="button" 
              class="toggle-password" 
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              tabindex="-1"
            >
              {{ showPassword ? '🙈' : '👁' }}
            </button>
          </div>
          <span v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</span>
        </div>
        
        <button 
          type="submit" 
          class="login-btn" 
          :disabled="loading || isLocked"
          :class="{ 'btn-loading': loading }"
        >
          <span v-if="loading" class="loading-spinner"></span>
          <span v-if="isLocked">已锁定 {{ lockoutSeconds }}s</span>
          <span v-else-if="loading">登录中...</span>
          <span v-else>登 录</span>
        </button>
        
        <div class="form-options">
          <label class="remember-me">
            <input type="checkbox" v-model="rememberMe" />
            <span>记住我</span>
          </label>
        </div>

        <div v-if="isLocked" class="error-message lockout-message">
          <span class="error-icon">⏳</span>
          账号已临时锁定，请 {{ lockoutSeconds }} 秒后重试
        </div>
        <div v-else-if="error" class="error-message">
          <span class="error-icon">⚠</span>
          {{ error }}
        </div>
        <div v-else-if="successMsg" class="success-message">
          <span class="success-icon">✓</span>
          {{ successMsg }}
        </div>
      </form>
      
      <div class="login-footer">
        <p class="footer-hint">首次使用请点击初始化</p>
        <a class="init-link" :class="{ 'init-loading': initLoading }" @click.prevent="handleInit">
          {{ initLoading ? '初始化中...' : '初始化管理员账户' }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { host } from '../../common/config';

const router = useRouter();

const form = reactive({
  username: '',
  password: ''
});

const loading = ref(false);
const error = ref('');
const successMsg = ref('');           // 成功消息（toast 替代，因全局 useToast 无 UI 渲染器）
const showPassword = ref(false);
const rememberMe = ref(false);
const initLoading = ref(false);       // 初始化按钮加载状态
const lockoutSeconds = ref(0);        // 锁定剩余秒数
let lockoutTimer = null;              // 倒计时定时器
let successTimer = null;              // 成功消息自动清除定时器
const fieldErrors = reactive({
  username: '',
  password: ''
});

const isLocked = computed(() => lockoutSeconds.value > 0);

// 从429消息中提取锁定秒数
const parseLockoutSeconds = (message) => {
  const match = message?.match(/(\d+)\s*秒/);
  return match ? parseInt(match[1]) : 0;
};

// 启动锁定倒计时
const startLockoutCountdown = (seconds) => {
  lockoutSeconds.value = seconds;
  if (lockoutTimer) clearInterval(lockoutTimer);
  lockoutTimer = setInterval(() => {
    lockoutSeconds.value--;
    if (lockoutSeconds.value <= 0) {
      clearInterval(lockoutTimer);
      lockoutTimer = null;
      error.value = '';
    }
  }, 1000);
};

const validateForm = () => {
  let valid = true;
  fieldErrors.username = '';
  fieldErrors.password = '';

  if (!form.username) {
    fieldErrors.username = '请输入用户名';
    valid = false;
  } else if (form.username.length < 2) {
    fieldErrors.username = '用户名至少2个字符';
    valid = false;
  } else if (!/^[a-zA-Z0-9_@.\u4e00-\u9fa5-]+$/.test(form.username)) {
    fieldErrors.username = '用户名包含非法字符';
    valid = false;
  }

  if (!form.password) {
    fieldErrors.password = '请输入密码';
    valid = false;
  } else if (form.password.length < 6) {
    fieldErrors.password = '密码至少6个字符';
    valid = false;
  }

  return valid;
};

const clearFieldError = (field) => {
  fieldErrors[field] = '';
  error.value = '';
  successMsg.value = '';
};

const handleLogin = async () => {
  error.value = '';

  if (!validateForm()) return;
  
  loading.value = true;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${host}/api/admin-manage/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.username,
        password: form.password
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    // 处理429频率限制
    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      const seconds = parseLockoutSeconds(data.message);
      if (seconds > 0) {
        startLockoutCountdown(seconds);
      } else {
        error.value = '登录过于频繁，请稍后再试';
      }
      form.password = '';
      return;
    }
    
    const data = await response.json();
    
    if (data.code === 200) {
      if (rememberMe.value) {
        // 记住我：存储完整凭据
        localStorage.setItem('admin_token', data.data.token);
        localStorage.setItem('admin_refresh_token', data.data.refreshToken);
        localStorage.setItem('admin_user', JSON.stringify(data.data.user));
        localStorage.setItem('admin_remember', '1');
      } else {
        // 不记住：仅会话存储，浏览器关闭即清
        sessionStorage.setItem('admin_token', data.data.token);
        sessionStorage.setItem('admin_refresh_token', data.data.refreshToken);
        sessionStorage.setItem('admin_user', JSON.stringify(data.data.user));
        localStorage.removeItem('admin_remember');
      }
      // 使用 successMsg 显示成功（全局 useToast 在登录页无 UI 渲染器）
      successMsg.value = '登录成功，即将跳转...';
      setTimeout(() => {
        successMsg.value = '';
        router.push('/admin/dashboard');
      }, 300);
    } else {
      error.value = data.message || '登录失败';
      form.password = '';
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      error.value = '请求超时，请检查网络后重试';
    } else {
      error.value = '网络错误，请稍后重试';
    }
    form.password = '';
  } finally {
    loading.value = false;
  }
};

const handleInit = async () => {
  if (initLoading.value) return;  // 防止重复点击
  initLoading.value = true;
  error.value = '';
  successMsg.value = '';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${host}/api/admin-manage/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeout);
    
    const data = await response.json();
    
    if (data.code === 200) {
      form.username = data.data.username || 'admin';
      form.password = data.data.password || 'admin123';
      successMsg.value = `初始化成功！账号：${form.username}，密码：${form.password}`;
      // 6秒后自动清除（凭据信息较长，给用户更多阅读时间）
      if (successTimer) clearTimeout(successTimer);
      successTimer = setTimeout(() => { successMsg.value = ''; }, 6000);
    } else {
      error.value = data.message || '初始化失败';
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      error.value = '请求超时，请检查网络';
    } else {
      error.value = '网络错误，请稍后重试';
    }
  } finally {
    initLoading.value = false;
  }
};

/**
 * 解码 JWT payload（仅客户端检查 exp，不做签名验证）
 */
const decodeJwtPayload = (token) => {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

/**
 * 检查 token 是否有效（未过期）
 */
const isTokenValid = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return false;
  return payload.exp * 1000 > Date.now();
};

onMounted(() => {
  const adminToken = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
  if (adminToken && isTokenValid(adminToken)) {
    router.replace('/admin/dashboard');
  } else if (adminToken) {
    // Token 存在但已过期，清除后留在登录页
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_refresh_token');
    sessionStorage.removeItem('admin_user');
  }
});

onUnmounted(() => {
  if (lockoutTimer) {
    clearInterval(lockoutTimer);
    lockoutTimer = null;
  }
  if (successTimer) {
    clearTimeout(successTimer);
    successTimer = null;
  }
});
</script>

<style scoped>
.admin-login {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  z-index: 200;
}

.login-container {
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -1px;
}

.login-header h1 {
  font-size: 24px;
  color: #1a1a2e;
  margin: 0 0 8px 0;
  font-weight: 700;
}

.login-header p {
  color: #909399;
  margin: 0;
  font-size: 14px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: #f7f8fa;
  color: #303133;
  outline: none;
}

.password-wrapper {
  position: relative;
  display: flex;
}

.password-wrapper .form-input {
  width: 100%;
  padding-right: 44px;
}

.form-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: #fff;
}

.form-input::placeholder {
  color: #c0c4cc;
}

.form-input.input-error {
  border-color: #f56c6c;
}

.form-input.input-error:focus {
  box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.1);
}

.field-error {
  font-size: 12px;
  color: #f56c6c;
  line-height: 1.2;
}

.toggle-password {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 6px 8px;
  line-height: 1;
  color: #909399;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-password:hover {
  color: #303133;
}

.form-options {
  display: flex;
  align-items: center;
  margin-top: -4px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  user-select: none;
}

.remember-me input[type="checkbox"] {
  width: 15px;
  height: 15px;
  accent-color: #667eea;
  cursor: pointer;
  margin: 0;
}

.remember-me span {
  line-height: 1;
}

.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
}

.login-btn:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
}

.login-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: #f56c6c;
  font-size: 13px;
  text-align: center;
  margin-top: -8px;
  background: #fef0f0;
  padding: 10px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

.error-icon {
  flex-shrink: 0;
}

.lockout-message {
  color: #e6a23c;
  background: #fdf6ec;
}

.success-message {
  color: #67c23a;
  font-size: 13px;
  text-align: center;
  margin-top: -8px;
  background: #f0f9eb;
  padding: 10px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.success-icon {
  flex-shrink: 0;
  font-weight: 700;
}

.login-footer {
  margin-top: 28px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.footer-hint {
  font-size: 12px;
  color: #909399;
  margin: 0 0 10px 0;
}

.init-link {
  display: inline-block;
  color: #667eea;
  cursor: pointer;
  font-size: 13px;
  text-decoration: none;
  transition: color 0.2s;
}

.init-link:hover {
  color: #764ba2;
  text-decoration: underline;
}

.init-link.init-loading {
  color: #909399 !important;
  cursor: not-allowed;
  text-decoration: none;
  pointer-events: none;
}

/* 响应式适配 */
@media (max-width: 480px) {
  .login-container {
    padding: 32px 24px;
    border-radius: 12px;
  }

  .login-header h1 {
    font-size: 20px;
  }

  .login-logo {
    width: 44px;
    height: 44px;
    font-size: 18px;
  }
}
</style>
