import { request } from '../common/common'
import { validateMobile, validatePassword, validateParams } from '../common/common'

const authService = {
  async getUserInfo(userId = '') {
    const url = userId ? `/api/user/get?userId=${userId}` : `/api/user/get`
    // 缩短超时 + 静默失败：后端偶发慢响应时返回 null，由调用方判空处理，避免页面长时间阻塞
    return request(url, 'GET', {}, {}, 5000, { silentAbort: true })
  },

  async updateUserInfo(data = {}) {
    return request('/api/user/update', 'POST', data)
  },

  // U-22：黑名单
  async blockUser(targetUserId) {
    return request('/api/user/block', 'POST', { targetUserId })
  },

  async unblockUser(targetUserId) {
    return request('/api/user/unblock', 'POST', { targetUserId })
  },

  async getBlockedUsers() {
    return request('/api/user/blocks', 'GET')
  },

  // 个人中心/主页统计：不传 userId 表示当前登录用户
  async getUserStats(userId = '') {
    const params = userId ? { userId } : {}
    return request('/api/user/stats', 'GET', params, {}, 5000, { silentAbort: true })
  },

  // 审计 H-5：服务端登出。必须在清本地令牌之前调用——request() 在同步阶段就用
  // localStorage 里的 token 拼好 Authorization，先清就会发成一个未认证请求。
  // logoutAllDevices：C 端虽然保存 refreshToken 并在 401 时静默续期（B-6），但登出要用
  // 水位线把该账号此刻之前的全部令牌（access + refresh）一次作废，单拉黑 access 会漏掉 refresh。
  // 5 秒超时 + 静默中止：登出失败不该把界面卡在「退出中」。
  async logout() {
    return request('/api/user/logout', 'POST', { logoutAllDevices: true }, {}, 5000, { silentAbort: true })
  },

  async login(phone, password) {
    validateParams({ phone, password }, {
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
      }
    })
    return request('/api/user/login', 'POST', { mobile: phone, password })
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

  // 已登录改密：旧密码由服务端校验，成功后服务端吊销该账号全部会话（需重新登录）。
  // 与 resetPassword（忘记密码，短信验证码）是两条独立入口。
  async changePassword(oldPassword, newPassword) {
    validateParams({ oldPassword, newPassword }, {
      oldPassword: {
        required: true,
        label: '旧密码',
        type: 'string',
        maxLength: 32
      },
      newPassword: {
        required: true,
        label: '新密码',
        type: 'string',
        minLength: 6,
        maxLength: 32
      }
    })
    return request('/api/user/change-password', 'POST', { oldPassword, newPassword })
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
    return request('/api/user/follow', 'POST', { targetUserId: userId, action: 1 })
  },

  async unfollow(userId) {
    validateParams({ userId }, {
      userId: {
        required: true,
        label: '用户ID',
        type: 'number'
      }
    })
    return request('/api/user/follow', 'POST', { targetUserId: userId, action: 0 })
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
  },

  async submitRealName(data = {}) {
    return request('/api/user/real-name', 'POST', data)
  },

  async getRealNameStatus() {
    return request('/api/user/real-name', 'GET')
  },

  async getLikes() {
    return request('/api/user/likes', 'GET')
  },

  async getVisitors() {
    return request('/api/user/visitors', 'GET')
  },

  async visitUser(targetUserId) {
    return request('/api/user/visit', 'POST', { targetUserId })
  }
}

export default authService