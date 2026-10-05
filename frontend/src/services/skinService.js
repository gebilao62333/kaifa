import { request } from '../common/common'

// 装扮商城（审计 H-6）：目录、价格、所有权、扣款金额都由服务端决定，
// 客户端只提交 skinId；不要再把 owned/using 快照或 spend 发给 /api/user/pref。
export const skinService = {
  async list() {
    return request('/api/user/skins', 'GET')
  },

  async purchase(skinId) {
    return request('/api/user/skins/purchase', 'POST', { skinId })
  },

  async use(skinId) {
    return request('/api/user/skins/use', 'POST', { skinId })
  }
}

export default skinService
