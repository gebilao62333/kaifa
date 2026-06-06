import { request } from '../common/common'

const adminManageService = {
  // 管理员
  async getAdmins(params = {}) {
    const { page = 1, pageSize = 20, keyword, status } = params
    const data = { page, pageSize }
    if (keyword) data.keyword = keyword
    if (status !== undefined) data.status = status
    return request('/api/admin-manage/admins', 'GET', data)
  },
  async createAdmin(data) {
    return request('/api/admin-manage/admins', 'POST', data)
  },
  async updateAdmin(adminId, data) {
    return request('/api/admin-manage/admins/' + adminId, 'PUT', data)
  },
  async deleteAdmin(adminId) {
    return request('/api/admin-manage/admins/' + adminId, 'DELETE')
  },
  async updateAdminPassword(adminId, data) {
    return request('/api/admin-manage/admins/' + adminId + '/password', 'PUT', data)
  },

  // 角色
  async getRoles() {
    return request('/api/admin-manage/roles', 'GET')
  },
  async createRole(data) {
    return request('/api/admin-manage/roles', 'POST', data)
  },
  async updateRole(roleId, data) {
    return request('/api/admin-manage/roles/' + roleId, 'PUT', data)
  },
  async deleteRole(roleId) {
    return request('/api/admin-manage/roles/' + roleId, 'DELETE')
  },

  // 权限
  async getPermissions() {
    return request('/api/admin-manage/permissions', 'GET')
  }
}

export default adminManageService
