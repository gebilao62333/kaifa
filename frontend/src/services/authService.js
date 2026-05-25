import { request } from '../common/common'
import { validateMobile, validatePassword, validateParams } from '../common/common'

const authService = {
  async getUserInfo(userId = '') {
    const url = userId ? `/api/user/get?userId=${userId}` : `/api/user/get`
    return request(url, 'GET')
  },

  async login(username, password) {
    validateParams({ username, password }, {
      username: {
        required: true,
        label: '用户名',
        type: 'string',
        minLength: 1,
        maxLength: 50
      },
      password: {
        required: true,
        label: '密码',
        type: 'string',
        minLength: 6,
        maxLength: 32
      }
    })
    return request('/api/user/login', 'POST', { username, password })
  },

  async loginMobile(phone, code) {
    validateParams({ phone, code }, {
      phone: {
        required: true,
        label: '手机号',
        type: 'string',
        pattern: /^1[3-9]\d{9}$/
      },
      code: {
        required: true,
        label: '验证码',
        type: 'string',
        minLength: 4,
        maxLength: 6
      }
    })
    return request('/api/user/login-mobile', 'POST', { phone, code })
  },

  async loginThird(provider, openId, userInfo = {}) {
    validateParams({ provider, openId }, {
      provider: {
        required: true,
        label: '登录方式',
        type: 'string'
      },
      openId: {
        required: true,
        label: 'OpenID',
        type: 'string'
      }
    })
    return request('/api/user/login-third', 'POST', { provider, openId, ...userInfo })
  },

  async sendSms(phone, type = 'login') {
    validateParams({ phone }, {
      phone: {
        required: true,
        label: '手机号',
        type: 'string',
        pattern: /^1[3-9]\d{9}$/
      }
    })
    return request('/api/user/send-sms', 'POST', { phone, type })
  },

  async register(phone, password, code) {
    validateParams({ phone, password, code }, {
      phone: {
        required: true,
        label: '手机号',
        type: 'string',
        pattern: /^1[3-9]\d{9}$/
      },
      password: {
        required: true,
        label: '密码',
        type: 'string',
        minLength: 6,
        maxLength: 32
      },
      code: {
        required: true,
        label: '验证码',
        type: 'string',
        minLength: 4,
        maxLength: 6
      }
    })
    return request('/api/user/register', 'POST', { phone, password, code })
  },

  async resetPassword(phone, password, code) {
    validateParams({ phone, password, code }, {
      phone: {
        required: true,
        label: '手机号',
        validator: (value) => {
          if (!validateMobile(value)) {
            throw new Error('手机号格式不正确')
          }
        }
      },
      password: {
        required: true,
        label: '密码',
        validator: (value) => {
          if (!validatePassword(value)) {
            throw new Error('密码长度必须在6-32位之间')
          }
        }
      },
      code: {
        required: true,
        label: '验证码',
        type: 'string',
        minLength: 4,
        maxLength: 6
      }
    })
    return request('/api/user/reset-password', 'POST', { phone, password, code })
  },

  async updateProfile(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('用户数据必须是对象')
    }
    return request('/api/user/update', 'POST', data)
  },

  async follow(userId) {
    validateParams({ userId }, {
      userId: {
        required: true,
        label: '用户ID',
        type: 'number'
      }
    })
    return request('/api/user/follow', 'POST', { userId })
  },

  async unfollow(userId) {
    validateParams({ userId }, {
      userId: {
        required: true,
        label: '用户ID',
        type: 'number'
      }
    })
    return request('/api/user/unfollow', 'POST', { userId })
  },

  async getFans(params = {}) {
    const { page = 1, pageSize = 20 } = params
    return request('/api/user/fans', 'GET', { page, pageSize })
  },

  async getFollows(params = {}) {
    const { page = 1, pageSize = 20 } = params
    return request('/api/user/follows', 'GET', { page, pageSize })
  },

  async checkFollowStatus(userId) {
    validateParams({ userId }, {
      userId: {
        required: true,
        label: '用户ID',
        type: 'number'
      }
    })
    return request(`/api/user/check-follow?userId=${userId}`, 'GET')
  }
}

export default authService