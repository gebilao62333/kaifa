import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useUserStore } from './store/user-info'
import lazyLoadDirective from './directives/lazyLoad'
import { createPersistedState } from './plugins/persistedState'
import './styles/colors.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(createPersistedState({
  key: 'app-state',
  storage: localStorage
}))

app.use(pinia)
app.use(router)

const userStore = useUserStore()

// Dev mode auto-auth: 仅开发环境下自动注入 token 跳过登录
if (import.meta.env.DEV && !localStorage.getItem('token')) {
  localStorage.setItem('token', 'dev-preview-token')
  console.log('[Dev] 自动注入预览 token，无需登录即可访问所有页面')
}

userStore.initFromStorage()

app.directive('lazy', lazyLoadDirective)

app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
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
