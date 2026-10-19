import { createSSRApp, createApp as createVueApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/variables.css'
import './styles/global.css'
import { useUserStore } from './store/user-info'
import lazyLoadDirective from './directives/lazyLoad'
import imgFallback from './directives/imgFallback'
import { createPersistedState } from './plugins/persistedState'
import { setupP2PFetchResponder } from './services/p2pFetchService'
import GlobalUI from './components/GlobalUI.vue'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()

  pinia.use(createPersistedState({
    key: 'app-state',
    storage: localStorage,
    paths: {
      user: ['token', 'profile.userId', 'profile.nickName', 'profile.avatar', 'profile.level', 'profile.vip', 'profile.vipLevel', 'profile.gender', 'profile.region', 'profile.signature'],
      chat: ['currentRoomId', 'unreadMap', 'totalUnread', 'noticeUnread']
    }
  }))

  app.use(pinia)

  app.directive('lazy', lazyLoadDirective)
  app.directive('img-fallback', imgFallback)

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

  return { app }
}
