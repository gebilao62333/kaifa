import { defineStore } from 'pinia'
import authService from '../services/authService'
import { DEFAULT_AVATAR, STORAGE_KEYS } from '../common/constants'

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
      if (token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token)
      } else {
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
      }
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

    async login(credentials) {
      try {
        this.loading = true
        const result = await authService.login(credentials.phone, credentials.password)
        
        if (result.code === 200 && result.data) {
          const token = this.extractToken(result.data)
          this.setToken(token)
          this.setUserInfo(result.data)
          return { success: true, data: result.data }
        } else {
          return { success: false, message: result.message || '登录失败' }
        }
      } catch (error) {
        console.error('登录失败:', error)
        const response = { success: false, message: error.message || '网络错误' }
        if (error.fieldErrors) {
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
          const token = this.extractToken(result.data)
          this.setToken(token)
          this.setUserInfo(result.data)
          return { success: true, data: result.data }
        } else {
          return { success: false, message: result.message || '登录失败' }
        }
      } catch (error) {
        console.error('手机登录失败:', error)
        return { success: false, message: error.message || '网络错误' }
      } finally {
        this.loading = false
      }
    },

    async loginThird(provider, openId, userInfo = {}) {
      try {
        this.loading = true
        const result = await authService.loginThird(provider, openId, userInfo)
        
        if (result.code === 200 && result.data) {
          const token = this.extractToken(result.data)
          this.setToken(token)
          this.setUserInfo(result.data)
          return { success: true, data: result.data }
        } else {
          return { success: false, message: result.message || '登录失败' }
        }
      } catch (error) {
        console.error('第三方登录失败:', error)
        return { success: false, message: error.message || '网络错误' }
      } finally {
        this.loading = false
      }
    },

    async sendSms(phone, type = 'login') {
      try {
        const result = await authService.sendSms(phone, type)
        return { success: result.code === 200, message: result.message, code: result.data?.code }
      } catch (error) {
        console.error('发送短信失败:', error)
        return { success: false, message: error.message || '发送失败' }
      }
    },

    async register(phone, password, code) {
      try {
        this.loading = true
        const result = await authService.register(phone, password, code)
        
        if (result.code === 200 && result.data) {
          const { token, userInfo } = result.data
          this.setToken(token)
          this.setUserInfo(userInfo)
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
      this.token = ''
      this.profile = null
      this.configInfo = {}
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
    },

    initFromStorage() {
      const rawToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
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
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.PINIA_STATE)
      }
    },

    async checkAndRefreshUserInfo() {
      if (this.token && !this.profile) {
        await this.fetchUserInfo()
      }
    }
  }
})
