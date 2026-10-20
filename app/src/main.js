import { createSSRApp, createApp as createVueApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/variables.css'
import './styles/global.css'
import { useUserStore } from './store/user-info'
import { createPersistedState } from './plugins/persistedState'
import storage from './common/storage'
import { setupP2PFetchResponder } from './services/p2pFetchService'
import GlobalUI from './components/GlobalUI.vue'
import { captureGlobalError } from './composables/useGlobalError'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()

  pinia.use(createPersistedState({
    key: 'app-state',
    // 统一存储适配器：uni.storage 与 localStorage 双写，App 端持久化状态不再丢
    storage,
    paths: {
      user: ['token', 'profile.userId', 'profile.nickName', 'profile.avatar', 'profile.level', 'profile.vip', 'profile.vipLevel', 'profile.gender', 'profile.region', 'profile.signature'],
      chat: ['currentRoomId', 'unreadMap', 'totalUnread', 'noticeUnread']
    }
  }))

  app.use(pinia)

  // 全局错误兜底（旧版 main.js 同款）：
  // 页面内错误优先被 PageLayout 的 ErrorBoundary 捕获；漏到应用层的错误
  // 交给 GlobalUI 的兜底层展示「重新加载」，避免整页白屏
  app.config.errorHandler = (err, vm, info) => {
    console.error('Vue Error:', err)
    console.error('Component:', vm)
    console.error('Info:', info)
    captureGlobalError(err, info)
  }

  const userStore = useUserStore()
  userStore.initFromStorage()

  setupP2PFetchResponder()

  // 全局 UI（底部导航/Toast/来电弹窗/网络状态/开屏弹窗）挂在 #app 之外，避免每个页面重复引入
  if (typeof document !== 'undefined') {
    setTimeout(() => {
      try {
        const host = document.createElement('div')
        host.id = '__global_ui__'
        document.body.appendChild(host)
        const ui = createVueApp(GlobalUI)
        ui.use(pinia)
        ui.mount(host)
      } catch (e) { console.error('[global-ui] mount failed', e) }
    }, 0)
  }

  // H5 / App WebView 全局错误拦截（旧版 main.js 同款）：
  // 只静默浏览器扩展/WebView 注入脚本产生的噪音错误，其余照常打印。
  if (typeof window !== 'undefined') {
    const SUPPRESS_PATTERNS = ['Script error.', 'getBoundingClientRect', 'Cannot read properties of null']
    const shouldSuppress = (msg) => {
      const text = (msg || '').toString()
      return SUPPRESS_PATTERNS.some((p) => text.indexOf(p) !== -1)
    }
    const suppressExternalErrors = (event) => {
      // 资源加载失败（img/video/audio 等没有后端资源时很常见）不是 JS 崩溃：
      // 这类 error 事件 target 是元素、没有 error 对象，不记全局异常、不刷控制台
      if (event.target && event.target !== window && event.target !== document) return false
      const errorMsg = (event.message || (event.error && event.error.message) || '').toString()
      const isCrossOriginScriptError = errorMsg === 'Script error.' || errorMsg === 'Script error'
      const isExternalDomError =
        (errorMsg.includes('getBoundingClientRect') || errorMsg.includes('Cannot read properties of null')) &&
        (event.filename === '' || event.filename == null || !String(event.filename).includes('/src/'))
      if (isCrossOriginScriptError || isExternalDomError) {
        event.preventDefault?.()
        event.stopPropagation?.()
        event.stopImmediatePropagation?.()
        return true
      }
      console.error('Global Error:', event.error)
      return false
    }
    window.addEventListener('error', suppressExternalErrors, true)
    window.addEventListener('error', suppressExternalErrors, false)
    const originalOnerror = window.onerror
    window.onerror = (message, source, lineno, colno, error) => {
      if (shouldSuppress(message || (error && error.message))) return true
      if (typeof originalOnerror === 'function') return originalOnerror.apply(window, arguments)
    }
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason
      const reasonMsg = (reason && (reason.message || String(reason))) || ''
      if (shouldSuppress(reasonMsg)) {
        event.preventDefault?.()
        event.stopImmediatePropagation?.()
        return
      }
      console.error('Unhandled Promise Rejection:', reason)
    }, true)
  }

  return { app }
}
