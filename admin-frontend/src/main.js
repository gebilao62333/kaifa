import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/global.css'

const app = createApp(App)
app.use(router)
app.mount('#app')

// 生产环境全局错误处理（避免崩溃白屏）
if (!import.meta.env.DEV) {
  app.config.errorHandler = (err, instance, info) => {
    console.warn('[Admin] Vue Error:', err, info)
  }

  window.addEventListener('unhandledrejection', (event) => {
    console.warn('[Admin] Unhandled Promise:', event.reason)
    event.preventDefault()
  })
}
