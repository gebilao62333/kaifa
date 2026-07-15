import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useUserStore } from './store/user-info'
import lazyLoadDirective from './directives/lazyLoad'
import { createPersistedState } from './plugins/persistedState'

const app = createApp(App)
const pinia = createPinia()
pinia.use(createPersistedState({
  key: 'app-state',
  storage: localStorage
}))

app.use(pinia)
app.use(router)

const userStore = useUserStore()
userStore.initFromStorage()

app.directive('lazy', lazyLoadDirective)

app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', vm)
  console.error('Info:', info)
}

window.addEventListener('error', (event) => {
  // 过滤浏览器扩展或外部脚本引起的非关键错误
  const errorMsg = event.message || event.error?.message || ''

  // 忽略 getBoundingClientRect 相关的外部脚本错误（通常是浏览器扩展导致）
  if (
    (errorMsg.includes('getBoundingClientRect') && event.error?.message === 'Script error') ||
    (errorMsg.includes('null') && errorMsg.includes('reading') && !event.filename?.includes('/src/'))
  ) {
    console.warn('[Global Error Filter] Ignored external script error:', errorMsg)
    return true  // 阻止错误传播到控制台
  }

  console.error('Global Error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason)
})

app.mount('#app')
