<template>
  <div class="admin-login">
    <div class="login-container">
      <div class="login-header">
        <h1>多客陪玩管理后台</h1>
        <p>管理员登录</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>用户名</label>
          <input 
            v-model="form.username" 
            type="text" 
            placeholder="请输入用户名"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码"
            class="form-input"
          />
        </div>
        
        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading">登录中...</span>
          <span v-else>登录</span>
        </button>
        
        <div v-if="error" class="error-message">{{ error }}</div>
      </form>
      
      <div class="login-footer">
      <p>默认用户名: admin</p>
      <p>默认密码: admin123</p>
      <p class="init-hint" @click="handleInit">首次使用? 点击初始化</p>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

const form = reactive({
  username: '',
  password: ''
});

const loading = ref(false);
const error = ref('');
const showInitBtn = ref(false);

const getHost = () => {
  return window.globalData?.host || 'http://localhost:3000';
};

const handleLogin = async () => {
  if (!form.username || !form.password) {
    error.value = '请输入用户名和密码';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const response = await fetch(`${getHost()}/api/admin-manage/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form)
    });
    
    const data = await response.json();
    
    if (data.code === 200) {
      localStorage.setItem('admin_token', data.data.token);
      localStorage.setItem('admin_refresh_token', data.data.refreshToken);
      localStorage.setItem('admin_user', JSON.stringify(data.data.user));
      window.location.href = '/admin/dashboard';
    } else {
      error.value = data.message || '登录失败';
    }
  } catch (err) {
    error.value = '网络错误，请稍后重试';
  } finally {
    loading.value = false;
  }
};

const handleInit = async () => {
  try {
    const response = await fetch(`${getHost()}/api/admin-manage/init`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.code === 200) {
      alert('初始化成功！\n用户名：admin\n密码：admin123');
      showInitBtn.value = false;
    } else {
      alert(data.message || '初始化失败');
    }
  } catch (err) {
    alert('网络错误，请稍后重试');
  }
};

onMounted(() => {
  const adminToken = localStorage.getItem('admin_token');
  if (adminToken) {
    window.location.href = '/admin/dashboard';
  }
});
</script>

<style scoped>
.admin-login {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: -webkit-linear-gradient(315deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
}

.login-container {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 28px;
  color: #333;
  margin: 0 0 8px 0;
}

.login-header p {
  color: #666;
  margin: 0;
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

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.3s;
}

.login-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #ff4757;
  font-size: 13px;
  text-align: center;
  margin-top: -10px;
}

.login-footer {
  margin-top: 24px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.login-footer p {
  font-size: 12px;
  color: #999;
  margin: 4px 0;
}

.init-hint {
  margin-top: 12px !important;
  color: #667eea !important;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.3s;
}

.init-hint:hover {
  color: #764ba2 !important;
}
</style>