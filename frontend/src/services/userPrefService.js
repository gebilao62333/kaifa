import { request } from '../common/common'

// 用户偏好/装扮数据：服务端持久化（已购与在用装扮、隐身/优先匹配等设置）
export const userPrefService = {
  async get() {
    return request('/api/user/pref', 'GET')
  },

  // data: 完整偏好对象；spend: 本次需扣除的金币（服务端校验余额后扣减）
  async save(data, spend = 0) {
    return request('/api/user/pref', 'POST', { data, spend })
  }
}

export default userPrefService
