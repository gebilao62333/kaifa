import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/colors.css'

const app = createApp(App)

// Pinia 状态管理
const pinia = createPinia()
app.use(pinia)

app.use(router)

// Dev mode auto-auth: 仅开发环境下自动注入 admin_token 跳过登录
if (import.meta.env.DEV && !localStorage.getItem('admin_token')) {
  localStorage.setItem('admin_token', 'dev-preview-token')
  console.log('[Admin Dev] 自动注入预览 admin_token，无需登录')
}

app.config.errorHandler = (err, vm, info) => {
  console.error('Admin Vue Error:', err)
  console.error('Component:', vm)
  console.error('Info:', info)
}

window.addEventListener('error', (event) => {
  console.error('Global Error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason)
})

app.mount('#app')
