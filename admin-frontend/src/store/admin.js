/**
 * 管理后台全局状态
 * Pinia Store — admin
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAdminStore = defineStore('admin', () => {
  // ====== 管理员信息 ======
  const adminUser = ref(null)
  const adminToken = ref('')

  const isLoggedIn = computed(() => !!adminToken.value)
  const username = computed(() => adminUser.value?.username || '管理员')

  // ====== 暗黑模式 ======
  const DARK_KEY = 'admin_dark_mode'
  const isDark = ref(false)

  const initDarkMode = () => {
    const saved = localStorage.getItem(DARK_KEY)
    if (saved === '1') {
      isDark.value = true
      applyDarkMode(true)
    }
  }

  const applyDarkMode = (dark) => {
    document.documentElement.setAttribute('data-admin-theme', dark ? 'dark' : 'light')
  }

  const toggleDark = () => {
    isDark.value = !isDark.value
    const val = isDark.value ? '1' : '0'
    localStorage.setItem(DARK_KEY, val)
    applyDarkMode(isDark.value)
  }

  // ====== 初始化（从 storage 恢复） ======
  const init = () => {
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') || ''
    if (token) {
      adminToken.value = token
    }
    const userStr = localStorage.getItem('admin_user') || sessionStorage.getItem('admin_user')
    if (userStr) {
      try {
        adminUser.value = JSON.parse(userStr)
      } catch {
        adminUser.value = null
      }
    }
    initDarkMode()
  }

  // ====== 登录 ======
  const setLogin = (token, refreshToken, user, remember = false) => {
    adminToken.value = token
    adminUser.value = user

    if (remember) {
      localStorage.setItem('admin_token', token)
      localStorage.setItem('admin_refresh_token', refreshToken)
      localStorage.setItem('admin_user', JSON.stringify(user))
      localStorage.setItem('admin_remember', '1')
    } else {
      sessionStorage.setItem('admin_token', token)
      sessionStorage.setItem('admin_refresh_token', refreshToken)
      sessionStorage.setItem('admin_user', JSON.stringify(user))
      localStorage.removeItem('admin_remember')
    }
  }

  // ====== 登出 ======
  const logout = () => {
    adminToken.value = ''
    adminUser.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('admin_user')
    localStorage.removeItem('admin_remember')
    sessionStorage.removeItem('admin_token')
    sessionStorage.removeItem('admin_refresh_token')
    sessionStorage.removeItem('admin_user')
  }

  return {
    adminUser,
    adminToken,
    isLoggedIn,
    username,
    isDark,
    init,
    toggleDark,
    setLogin,
    logout
  }
})
