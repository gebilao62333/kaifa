import { request } from '../common/common'

// 等级/经验体系：升级曲线、VIP 倍率、经验来源与权益清单全部由服务端下发，
// 前端不再自带曲线，避免两端口径分叉。
export const levelService = {
  async get() {
    return request('/api/user/level', 'GET')
  },

  async checkIn() {
    return request('/api/user/level/check-in', 'POST')
  }
}

export default levelService
