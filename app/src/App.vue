<script>
import { useUserStore } from './store/user-info'
import noticeService from './services/noticeService'
import { hydrateDecorations } from './services/decorationService'
import { installRouteGuard, checkAuthRedirect, syncFromLocation } from './common/route'
import { loadSplash } from './composables/useSplash'
import { initNativeCall } from './services/nativeCallAdapter'
import { isApp } from './common/platform'
import { clearAllTabState } from './common/tabState'

export default {
  onLaunch() {
    // 主 Tab 状态缓存只在本次会话内有效：清掉上一次会话落盘的快照/滚动位置，
    // 避免冷启动或 H5 刷新后恢复出陈旧列表；storage 异常时静默降级，不影响启动。
    try { clearAllTabState() } catch (e) {}
    // App 自定义基座（VITE_USE_NATIVE_CALL=1）时预热原生 WebRTC 插件；
    // H5 / 默认 App 构建下内部直接返回 false，无副作用
    initNativeCall()
    installRouteGuard()
    // 平台公告是公开接口，先加载；socket 实时监听在登录并连接后注册
    noticeService.load()
    const userStore = useUserStore()
    // App 冷启动首屏固定是 pages/Login（pages.json 顺序），已登录用户会被登录页挡住。
    // 延后一拍等首页页面栈建立后再 reLaunch，避免 onLaunch 阶段页面还没创建导致跳转被丢弃；
    // H5 首屏由 location 决定，不走这里，行为不变。
    if (isApp && userStore.isLogin) {
      setTimeout(() => {
        try {
          uni.reLaunch({
            url: '/pages/Home',
            // 跳转成功后同步路由状态，否则底部 Tab 仍按 Login 计算高亮
            success: () => setTimeout(syncFromLocation, 0)
          })
        } catch (e) {}
      }, 0)
    }
    if (userStore.isLogin) {
      try { userStore.fetchUserInfo().catch(() => {}) } catch (e) {}
      hydrateDecorations()
      // P0：统一由 user store 建立连接并注册 chat store 监听；登录成功后走同一入口。
      userStore.startRealtime()
      noticeService.bindRealtime()
    }
    loadSplash()
  },
  onShow() {
    setTimeout(checkAuthRedirect, 300)
  },
  onPageNotFound(res) {
    try { uni.reLaunch({ url: '/pages/NotFound' }) } catch (e) {}
  }
}
</script>

<style>
@import './styles/variables.css';
@import './styles/global.css';
</style>
