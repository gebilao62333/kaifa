import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/variables.css'
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

  // 外部脚本（浏览器扩展 / 注入脚本）读写 DOM 时偶发的 null 引用错误，
  // 典型为 getBoundingClientRect(null)。这类错误 filename 为空或被屏蔽、不属于本项目代码，
  // 无论 filename 是否为空均静默吞掉，避免污染控制台与预览 WebView 报错。
  const isExternalDomError =
    (errorMsg.includes('getBoundingClientRect') ||
      errorMsg.includes('Cannot read properties of null')) &&
    (event.filename === '' || event.filename == null || !event.filename.includes('/src/'))

  if (isCrossOriginScriptError || isExternalDomError) {
    // 阻止该错误继续传播到后续监听器 / 预览 WebView 报错捕获
    event.preventDefault?.()
    event.stopImmediatePropagation?.()
    return
  }

  console.error('Global Error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  const reasonMsg = (reason?.message || reason?.toString?.() || '').toString()
  // 同源策略屏蔽的跨域/扩展脚本 rejection，直接忽略
  if (
    reasonMsg === 'Script error.' ||
    reasonMsg.includes('getBoundingClientRect') ||
    reasonMsg.includes('Cannot read properties of null')
  ) {
    event.preventDefault?.()
    event.stopImmediatePropagation?.()
    return
  }
  console.error('Unhandled Promise Rejection:', reason)
})

app.mount('#app')
