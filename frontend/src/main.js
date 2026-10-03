import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/variables.css'
import './styles/global.css'
import { useUserStore } from './store/user-info'
import lazyLoadDirective from './directives/lazyLoad'
import imgFallback from './directives/imgFallback'
import { createPersistedState } from './plugins/persistedState'
import { setupP2PFetchResponder } from './services/p2pFetchService'

const app = createApp(App)
const pinia = createPinia()
pinia.use(createPersistedState({
  key: 'app-state',
  storage: localStorage,
  // 字段白名单：只持久化登录态与基础展示资料，
  // 手机号/余额/积分/身份证等敏感字段不落 localStorage（F-03/F-12）
  paths: {
    user: [
      'token',
      'profile.userId',
      'profile.nickName',
      'profile.avatar',
      'profile.level',
      'profile.vip',
      'profile.vipLevel',
      'profile.gender',
      'profile.region',
      'profile.signature'
    ],
    chat: ['currentRoomId', 'unreadMap', 'totalUnread', 'noticeUnread']
  }
}))

app.use(pinia)
app.use(router)

const userStore = useUserStore()
userStore.initFromStorage()

app.directive('lazy', lazyLoadDirective)
app.directive('img-fallback', imgFallback)

// 注册 P2P 取回流响应方（仅一次），用于热内容在点对点之间直传，减轻服务器带宽
setupP2PFetchResponder()

app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', vm)
  console.error('Info:', info)
}

// 增强版全局错误拦截：同时注册捕获阶段（优先触发）和冒泡阶段，
// 确保在 WebView 内置错误捕获器之前拦截外部脚本/扩展注入产生的噪音错误。
const suppressExternalErrors = (event) => {
  const errorMsg = (event.message || event.error?.message || '').toString()

  // 浏览器扩展 / 跨域注入脚本产生的 "Script error."：因同源策略被屏蔽、无可用堆栈
  const isCrossOriginScriptError = errorMsg === 'Script error.' || errorMsg === 'Script error'

  // 外部脚本（浏览器扩展 / 注入脚本）读写 DOM 时偶发的 null 引用错误，
  // 典型为 getBoundingClientRect(null)
  const isExternalDomError =
    (errorMsg.includes('getBoundingClientRect') ||
      errorMsg.includes('Cannot read properties of null')) &&
    (event.filename === '' || event.filename == null || !event.filename?.includes('/src/'))

  if (isCrossOriginScriptError || isExternalDomError) {
    event.preventDefault?.()
    event.stopPropagation?.()
    event.stopImmediatePropagation?.()
    // 返回 true 配合 window.onerror 阻止浏览器默认报错
    return true
  }

  console.error('Global Error:', event.error)
  return false
}

// 捕获阶段优先拦截（在 WebView 内置处理器之前触发）
window.addEventListener('error', suppressExternalErrors, true)
// 冒泡阶段兜底
window.addEventListener('error', suppressExternalErrors, false)
// window.onerror 兜底（部分 WebView 通过此 API 捕获错误）
// 返回 true 可阻止浏览器默认报错行为（控制台仍可能显示，但 WebView 注入的错误会被抑制）
window.onerror = (message, source, lineno, colno, error) => {
  const msg = (message || error?.message || '').toString()
  if (
    msg === 'Script error.' ||
    msg === 'Script error' ||
    msg.includes('getBoundingClientRect') ||
    msg.includes('Cannot read properties of null')
  ) {
    return true
  }
}

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  const reasonMsg = (reason?.message || reason?.toString?.() || '').toString()
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
}, true) // 捕获阶段优先

app.mount('#app')
