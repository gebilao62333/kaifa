import { defineStore } from 'pinia'
import authService from '../services/authService'
import { DEFAULT_AVATAR, STORAGE_KEYS } from '../common/constants'
import { clearPersistedState } from '../plugins/persistedState'
import storage from '../common/storage'
import socketService from '../services/socketService'
import { socketUrl as configSocketUrl } from '../common/config'
import noticeService from '../services/noticeService'
import { useChatStore } from './chat'

// 数字规范化：对象/NaN/null/undefined 一律兜底为 0，字符串数字转为数字
const toNumber = (value) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    profile: null,
    configInfo: {},
    loading: false,
    ui: {
      statusBarHeight: 0,
      customBarHeight: 0
    }
  }),

  getters: {
    isLogin: (state) => !!state.token,
    isVip: (state) => state.profile?.vip === 1,
    isHomeSearchOpen: (state) => state.configInfo?.isHomeSearchOpen === 1,
    userId: (state) => state.profile?.userId || 0,
    nickName: (state) => state.profile?.nickName || '',
    avatar: (state) => state.profile?.avatar || DEFAULT_AVATAR,
    level: (state) => state.profile?.level || 0,
    vip: (state) => state.profile?.vip || 0,
    vipLevel: (state) => state.profile?.vipLevel || 0,
    balance: (state) => toNumber(state.profile?.balance),
    score: (state) => toNumber(state.profile?.score),
    fansCount: (state) => state.profile?.fansCount || 0,
    followCount: (state) => state.profile?.followCount || 0,
    likeCount: (state) => state.profile?.likeCount || 0,
    gender: (state) => state.profile?.gender || 'unknown',
    region: (state) => state.profile?.region || '',
    signature: (state) => state.profile?.signature || '',
    phone: (state) => state.profile?.phone || ''
  },

  actions: {
    setToken(token) {
      this.token = token
      // 双写 uni.storage 与 localStorage：H5 与 App（WebView + 原生插件）都能读到同一份 token
      if (token) {
        storage.setItem(STORAGE_KEYS.TOKEN, token)
      } else {
        storage.removeItem(STORAGE_KEYS.TOKEN)
      }
    },

    // 审计 B-6：登录/续期响应同时保存 refresh token（供 common.js 401 静默续期消费）
    setAuthTokens(data) {
      if (!data) return
      this.setToken(this.extractToken(data))
      const refreshToken = data.refreshToken || data.refresh_token || ''
      // 存储适配器内部已吞掉两侧 storage 不可用的异常
      if (refreshToken) storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
    },

    setProfile(profile) {
      this.profile = profile
    },

    setUserInfo(userInfo) {
      if (!userInfo) return
      this.profile = {
        userId: userInfo.userId || 0,
        nickName: userInfo.nickName || userInfo.nickname || '',
        avatar: userInfo.avatar || '',
        level: userInfo.level || userInfo.lv || 0,
        vip: userInfo.vip || 0,
        vipLevel: userInfo.vipLevel || userInfo.vip_lv || 0,
        balance: toNumber(userInfo.balance ?? userInfo.money),
        score: toNumber(userInfo.score),
        fansCount: userInfo.fansCount || userInfo.fans_num || 0,
        followCount: userInfo.followCount || userInfo.follow_num || 0,
        likeCount: userInfo.likeCount || userInfo.like_num || 0,
        gender: userInfo.gender || (userInfo.sex === 1 ? 'male' : userInfo.sex === 2 ? 'female' : 'unknown'),
        region: userInfo.region || userInfo.city || '',
        signature: userInfo.signature || userInfo.dec || '',
        phone: userInfo.phone || userInfo.mobile || ''
      }
    },

    extractToken(data) {
      return data.accessToken || data.token || ''
    },

    // P0（2026-10-20 用户端完整度审计）：登录成功后补建实时长连接。
    // 此前只有 App 启动瞬间「已经登录」才会 connect，登录成功回调里没有补建，导致
    // 重新登录后私聊/来电/typing/公告实时全部失效，必须刷新页面才恢复。
    // 统一走 chat store：连接 socket + 注册消息/已读/撤回监听；socketService 内部
    // 保存监听注册表，断线重连/重建 socket 时会自动重挂，无需重复绑定。
    startRealtime() {
      if (!this.token) return
      try {
        const socketUrl = import.meta.env.VITE_SOCKET_URL || configSocketUrl
        useChatStore().initSocketConnection(socketUrl)
        // 公告实时推送同样依赖 socket；bindRealtime 内部有幂等守卫，登录晚于启动时也能补挂。
        noticeService.bindRealtime()
        if (import.meta.env.DEV) console.log('[realtime] Socket 初始化完成')
      } catch (error) {
        console.warn('[realtime] Socket 初始化失败:', error)
      }
    },

    async login(credentials) {
      try {
        this.loading = true
        const result = await authService.login(credentials.phone, credentials.password)
        
        if (result.code === 200 && result.data) {
          this.setAuthTokens(result.data)
          this.setUserInfo(result.data)
          // P0：登录成功即建立实时连接（密码/验证码/第三方三种登录都走这里）
          this.startRealtime()
          return { success: true, data: result.data }
        } else {
          return { success: false, message: result.message || '登录失败' }
        }
      } catch (error) {
        console.error('登录失败:', error)
        const response = { success: false, message: error.message || '网络错误', retryAfterSec: Number(error.retryAfterSec) || 0 }
        // 只有真正携带「按字段错误」时才走字段定位分支；空对象（如登录接口统一后的
        // 通用 422）必须落回 message，否则 Login.vue 会因 fieldErrors 为空对象而不弹任何提示。
        if (error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
          response.error = error
        }
        return response
      } finally {
        this.loading = false
      }
    },

    async loginMobile(phone, code) {
      try {
        this.loading = true
        const result = await authService.loginMobile(phone, code)
        
        if (result.code === 200 && result.data) {
          this.setAuthTokens(result.data)
          this.setUserInfo(result.data)
          // P0：登录成功即建立实时连接（密码/验证码/第三方三种登录都走这里）
          this.startRealtime()
          return { success: true, data: result.data }
        } else {
          return { success: false, message: result.message || '登录失败' }
        }
      } catch (error) {
        console.error('手机登录失败:', error)
        return { success: false, message: error.message || '网络错误', retryAfterSec: Number(error.retryAfterSec) || 0 }
      } finally {
        this.loading = false
      }
    },

    async loginThird(provider, openId, userInfo = {}) {
      try {
        this.loading = true
        const result = await authService.loginThird(provider, openId, userInfo)
        
        if (result.code === 200 && result.data) {
          this.setAuthTokens(result.data)
          this.setUserInfo(result.data)
          // P0：登录成功即建立实时连接（密码/验证码/第三方三种登录都走这里）
          this.startRealtime()
          return { success: true, data: result.data }
        } else {
          return { success: false, message: result.message || '登录失败' }
        }
      } catch (error) {
        console.error('第三方登录失败:', error)
        return { success: false, message: error.message || '网络错误', retryAfterSec: Number(error.retryAfterSec) || 0 }
      } finally {
        this.loading = false
      }
    },

    async sendSms(phone, type = 'login') {
      try {
        const result = await authService.sendSms(phone, type)
        // 安全（F-01）：后端仅在非生产环境回传明文验证码，生产永不返回。
        // 这里把它交回调用方用于自动填入验证码输入框（测试/本地联调路径），
        // 不写入 store、不写入 localStorage。
        if (import.meta.env.DEV && result.data?.code) {
          console.debug('[SMS] 非生产环境验证码:', result.data.code)
        }
        return {
          success: result.code === 200,
          message: result.message,
          devCode: result.data?.code || ''
        }
      } catch (error) {
        console.error('发送短信失败:', error)
        return { success: false, message: error.message || '发送失败', retryAfterSec: Number(error.retryAfterSec) || 0 }
      }
    },

    async register(phone, password, code) {
      try {
        this.loading = true
        const result = await authService.register(phone, password, code)
        
        // 后端注册返回 { userId, accessToken, refreshToken, nickname }，与登录同构；
        // 此前按 { token, userInfo } 解构，导致注册成功后并未真正登录。
        if (result.code === 200 && result.data) {
          this.setAuthTokens(result.data)
          this.setUserInfo(result.data)
          this.startRealtime()
          return { success: true, data: result.data }
        } else {
          return { success: false, message: result.message || '注册失败' }
        }
      } catch (error) {
        console.error('注册失败:', error)
        return { success: false, message: error.message || '网络错误' }
      } finally {
        this.loading = false
      }
    },

    async resetPassword(phone, password, code) {
      try {
        this.loading = true
        const result = await authService.resetPassword(phone, password, code)
        return { success: result.code === 200, message: result.message }
      } catch (error) {
        console.error('重置密码失败:', error)
        return { success: false, message: error.message || '网络错误' }
      } finally {
        this.loading = false
      }
    },

    async fetchUserInfo(userId = '') {
      try {
        const result = await authService.getUserInfo(userId)
        if (result.code === 200 && result.data) {
          this.setUserInfo(result.data.user || result.data)
          return { success: true, data: result.data }
        }
        return { success: false, message: result.message }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        return { success: false, message: error.message }
      }
    },

    async updateProfile(data) {
      try {
        this.loading = true
        const result = await authService.updateProfile(data)
        if (result.code === 200) {
          await this.fetchUserInfo()
          return { success: true, message: '更新成功' }
        }
        return { success: false, message: result.message }
      } catch (error) {
        console.error('更新用户信息失败:', error)
        return { success: false, message: error.message || '网络错误' }
      } finally {
        this.loading = false
      }
    },

    async follow(userId) {
      try {
        const result = await authService.follow(userId)
        if (result.code === 200) {
          if (this.profile) {
            this.profile.followCount = (this.profile.followCount || 0) + 1
          }
          return { success: true, message: '关注成功' }
        }
        return { success: false, message: result.message }
      } catch (error) {
        console.error('关注失败:', error)
        return { success: false, message: error.message || '网络错误' }
      }
    },

    async unfollow(userId) {
      try {
        const result = await authService.unfollow(userId)
        if (result.code === 200) {
          if (this.profile) {
            this.profile.followCount = Math.max(0, (this.profile.followCount || 0) - 1)
          }
          return { success: true, message: '取消关注成功' }
        }
        return { success: false, message: result.message }
      } catch (error) {
        console.error('取消关注失败:', error)
        return { success: false, message: error.message || '网络错误' }
      }
    },

    updateBalance(delta) {
      if (this.profile) {
        this.profile.balance = toNumber(this.profile.balance) + delta
      }
    },

    setBalance(balance) {
      if (!this.profile) {
        this.profile = {}
      }
      this.profile.balance = toNumber(balance)
    },

    setScore(score) {
      if (!this.profile) {
        this.profile = {}
      }
      this.profile.score = toNumber(score)
    },

    setConfigInfo(info) {
      this.configInfo = info
    },

    setStatusBarHeight(height) {
      this.ui.statusBarHeight = height
    },

    logout() {
      // 审计 H-5：先发起服务端登出（这一行同步阶段就把当前令牌写进了请求头），
      // 再清本地态。失败/超时不阻塞退出，但把 promise 返回给调用方，需要时可提示
      // 「服务端未确认登出」——令牌在其剩余有效期内可能仍可用，属后端 fail-closed 时的降级。
      const logoutRequest = authService.logout().catch(() => null)

      this.token = ''
      this.profile = null
      this.configInfo = {}
      this.ui = { statusBarHeight: 0, customBarHeight: 0 }

      // 清理本地登录态与敏感数据：token、用户资料、手机号、余额、历史遗留 userInfo
      storage.removeItem(STORAGE_KEYS.TOKEN)
      storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      storage.removeItem(STORAGE_KEYS.LEGACY_USER_INFO)
      // 清空 pinia 持久化 key（uni.storage 与 localStorage 两侧的 pinia-app-state-* 与 legacy 基准 key）
      clearPersistedState()

      // 断开长连接，避免登出后仍以旧身份保持在线
      try { socketService.disconnect() } catch (e) { /* ignore */ }

      return logoutRequest
    },

    initFromStorage() {
      const rawToken = storage.getItem(STORAGE_KEYS.TOKEN)
      if (rawToken && rawToken !== 'undefined' && rawToken !== 'null') {
        this.token = rawToken
        // 自愈：持久化恢复的 profile.balance/score 可能是历史遗留的对象/脏类型，强制修正为数字
        if (this.profile) {
          if (!Number.isFinite(Number(this.profile.balance))) this.profile.balance = 0
          if (!Number.isFinite(Number(this.profile.score))) this.profile.score = 0
        }
      } else {
        this.token = ''
        this.profile = null
        storage.removeItem(STORAGE_KEYS.TOKEN)
        clearPersistedState()
      }
    },

    async checkAndRefreshUserInfo() {
      if (this.token && !this.profile) {
        await this.fetchUserInfo()
      }
    }
  }
})
