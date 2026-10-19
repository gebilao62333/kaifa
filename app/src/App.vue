<script>
import { useUserStore } from './store/user-info'
import { socketService } from './services/socketService'
import { socketUrl as configSocketUrl } from './common/config'
import { installRouteGuard, checkAuthRedirect } from './common/route'
import { loadSplash } from './composables/useSplash'

export default {
  onLaunch() {
    installRouteGuard()
    const userStore = useUserStore()
    if (userStore.isLogin) {
      try { userStore.fetchUserInfo().catch(() => {}) } catch (e) {}
      const url = import.meta.env.VITE_SOCKET_URL || configSocketUrl
      socketService.connect(url)
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
