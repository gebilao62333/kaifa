import { request } from '../common/common'

// 用户偏好/装扮数据：服务端持久化（隐身/优先匹配/已选头像框与标识等设置）
// 审计 H-6：装扮商城的拥有关系与扣款不在此接口内——改用 services/skinService（/api/user/skins/*）。
// 服务端已拒绝非 0 的 spend，也拒绝客户端提交的 skinShop 快照，因此这里不再传 spend。
export const userPrefService = {
  async get() {
    return request('/api/user/pref', 'GET')
  },

  // data: 完整偏好对象（不含 skinShop）
  async save(data) {
    return request('/api/user/pref', 'POST', { data })
  }
}

export default userPrefService
