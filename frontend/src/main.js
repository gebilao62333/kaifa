import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useUserStore } from './store/user-info'
import lazyLoadDirective from './directives/lazyLoad'
import imgFallback from './directives/imgFallback'
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
app.directive('img-fallback', imgFallback)

app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', vm)
  console.error('Info:', info)
}

window.addEventListener('error', (event) => {
  const errorMsg = (event.message || event.error?.message || '').toString()

  // 浏览器扩展 / 跨域注入脚本产生的 "Script error."：因同源策略被屏蔽、无可用堆栈，
  // 既不是本项目代码、也无法在业务内修复，直接忽略，避免污染控制台与预览 WebView 报错。
  const isCrossOriginScriptError = errorMsg === 'Script error.' || errorMsg === 'Script error'

  // 外部脚本读写 DOM 时偶发的 getBoundingClientRect(null) 错误（filename 为空或被屏蔽）
  const isExternalDomError =
    errorMsg.includes('getBoundingClientRect') &&
    (event.filename === '' || event.filename == null || !event.filename.includes('/src/'))

  if (isCrossOriginScriptError || isExternalDomError) {
    console.warn('[Global Error Filter] Ignored external/extension script error:', errorMsg || event.error)
    // 阻止该错误继续传播到后续监听器 / 预览 WebView 报错捕获
    event.preventDefault?.()
    event.stopImmediatePropagation?.()
    return
  }

  console.error('Global Error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason)
})

app.mount('#app')
