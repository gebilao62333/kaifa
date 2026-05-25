import { request } from '../common/common'
import { validateParams } from '../common/common'

const adminService = {
  async login(username, password) {
    validateParams({ username, password }, {
      username: { required: true, label: '用户名', type: 'string' },
      password: { required: true, label: '密码', type: 'string' }
    })
    return request('/api/admin/login', 'POST', { username, password })
  },

  async getStatistics() {
    return request('/api/admin/statistics', 'GET')
  },

  async getUsers(params = {}) {
    const { page = 1, pageSize = 20, keyword, nickname, status } = params
    const data = { page, pageSize }
    if (keyword) data.nickname = keyword
    if (nickname) data.nickname = nickname
    if (status !== undefined) data.status = status
    return request('/api/admin/users', 'GET', data)
  },

  async getUserDetail(userId) {
    return request('/api/admin/users/' + userId, 'GET')
  },

  async createUser(userData) {
    return request('/api/admin/users', 'POST', userData)
  },

  async updateUser(userId, userData) {
    return request('/api/admin/users/' + userId, 'PUT', userData)
  },

  async updateUserStatus(userId, status) {
    return request('/api/admin/users/' + userId + '/status', 'PUT', { status })
  },

  async deleteUser(userId) {
    return request('/api/admin/users/' + userId, 'DELETE')
  },

  async getOrders(params = {}) {
    const { page = 1, pageSize = 20, orderNo, userId, status } = params
    const data = { page, pageSize }
    if (orderNo) data.orderNo = orderNo
    if (userId) data.userId = userId
    if (status !== undefined) data.status = status
    return request('/api/admin/orders', 'GET', data)
  },

  async getOrderDetail(orderId) {
    return request('/api/admin/orders/' + orderId, 'GET')
  },

  async createOrder(orderData) {
    return request('/api/admin/orders', 'POST', orderData)
  },

  async updateOrderStatus(orderId, status) {
    return request('/api/admin/orders/' + orderId + '/status', 'PUT', { status })
  },

  async deleteOrder(orderId) {
    return request('/api/admin/orders/' + orderId, 'DELETE')
  },

  async getWithdraws(params = {}) {
    const { page = 1, pageSize = 20, userId, status } = params
    const data = { page, pageSize }
    if (userId) data.userId = userId
    if (status !== undefined) data.status = status
    return request('/api/admin/withdraws', 'GET', data)
  },

  async getWithdrawDetail(withdrawId) {
    return request('/api/admin/withdraws/' + withdrawId, 'GET')
  },

  async approveWithdraw(withdrawId) {
    return request('/api/admin/withdraws/' + withdrawId + '/approve', 'POST')
  },

  async rejectWithdraw(withdrawId, reason = '') {
    return request('/api/admin/withdraws/' + withdrawId + '/reject', 'POST', { reason })
  },

  async reviewWithdraw(withdrawId, status, reason = '') {
    validateParams({ withdrawId, status }, {
      withdrawId: { required: true, label: '提现ID', type: 'number' },
      status: { required: true, label: '审核状态', type: 'number' }
    })
    // 兼容性支持，内部使用新API
    if (status === 1) {
      return this.approveWithdraw(withdrawId)
    } else {
      return this.rejectWithdraw(withdrawId, reason)
    }
  },

  async deleteWithdraw(withdrawId) {
    return request('/api/admin/withdraws/' + withdrawId, 'DELETE')
  },

  async getPosts(params = {}) {
    const { page = 1, pageSize = 20, keyword } = params
    const data = { page, pageSize }
    if (keyword) data.keyword = keyword
    return request('/api/admin/posts', 'GET', data)
  },

  async getPostDetail(postId) {
    return request('/api/admin/posts/' + postId, 'GET')
  },

  async deletePost(postId) {
    return request('/api/admin/posts/' + postId, 'DELETE')
  },

  async getReports(params = {}) {
    const { page = 1, pageSize = 20, status } = params
    const data = { page, pageSize }
    if (status !== undefined) data.status = status
    return request('/api/admin/reports', 'GET', data)
  },

  async getReportDetail(reportId) {
    return request('/api/admin/reports/' + reportId, 'GET')
  },

  async handleReport(reportId, action, handleNote = '') {
    return request('/api/admin/reports/' + reportId + '/handle', 'POST', { action, handleNote })
  },

  async deleteReport(reportId) {
    return request('/api/admin/reports/' + reportId, 'DELETE')
  },

  async getVipPackages(params = {}) {
    const { page = 1, pageSize = 50 } = params
    return request('/api/admin/vip-packages', 'GET', { page, pageSize })
  },

  async getVipPackageDetail(packageId) {
    return request('/api/admin/vip-packages/' + packageId, 'GET')
  },

  async createVipPackage(packageData) {
    return request('/api/admin/vip-packages', 'POST', packageData)
  },

  async updateVipPackage(packageId, packageData) {
    return request('/api/admin/vip-packages/' + packageId, 'PUT', packageData)
  },

  async updateVipPackageStatus(packageId, status) {
    return request('/api/admin/vip-packages/' + packageId + '/status', 'PUT', { status })
  },

  async deleteVipPackage(packageId) {
    return request('/api/admin/vip-packages/' + packageId, 'DELETE')
  },

  async getGifts(params = {}) {
    const { page = 1, pageSize = 20, keyword, status } = params
    const data = { page, pageSize }
    if (keyword) data.keyword = keyword
    if (status !== undefined) data.status = status
    return request('/api/admin/gifts', 'GET', data)
  },

  async getGiftDetail(giftId) {
    return request('/api/admin/gifts/' + giftId, 'GET')
  },

  async createGift(giftData) {
    return request('/api/admin/gifts', 'POST', giftData)
  },

  async updateGift(giftId, giftData) {
    return request('/api/admin/gifts/' + giftId, 'PUT', giftData)
  },

  async deleteGift(giftId) {
    return request('/api/admin/gifts/' + giftId, 'DELETE')
  },

  async getGiftLogs(params = {}) {
    const { page = 1, pageSize = 20, userId } = params
    const data = { page, pageSize }
    if (userId) data.userId = userId
    return request('/api/admin/gift-logs', 'GET', data)
  },

  async getGiftLogDetail(logId) {
    return request('/api/admin/gift-logs/' + logId, 'GET')
  },

  async getRechargeRecords(params = {}) {
    const { page = 1, pageSize = 20, userId, status } = params
    const data = { page, pageSize }
    if (userId) data.userId = userId
    if (status !== undefined) data.status = status
    return request('/api/admin/recharge-records', 'GET', data)
  },

  async getRechargeRecordDetail(recordId) {
    return request('/api/admin/recharge-records/' + recordId, 'GET')
  },

  async deleteRechargeRecord(recordId) {
    return request('/api/admin/recharge-records/' + recordId, 'DELETE')
  },

  async getGames(params = {}) {
    const { page = 1, pageSize = 20, keyword, serviceType } = params
    const data = { page, pageSize }
    if (keyword) data.keyword = keyword
    if (serviceType) data.serviceType = serviceType
    return request('/api/admin/games', 'GET', data)
  },

  async getGameDetail(gameId) {
    return request('/api/admin/games/' + gameId, 'GET')
  },

  async createGame(gameData) {
    return request('/api/admin/games', 'POST', gameData)
  },

  async updateGame(gameId, gameData) {
    return request('/api/admin/games/' + gameId, 'PUT', gameData)
  },

  async updateGameStatus(gameId, status) {
    return request('/api/admin/games/' + gameId + '/status', 'PUT', { status })
  },

  async deleteGame(gameId) {
    return request('/api/admin/games/' + gameId, 'DELETE')
  },

  async getCompanionApplications(params = {}) {
    const { page = 1, pageSize = 20, status } = params
    const data = { page, pageSize }
    if (status !== undefined) data.status = status
    return request('/api/admin/companion-applications', 'GET', data)
  },

  async getCompanionApplicationDetail(applicationId) {
    return request('/api/admin/companion-applications/' + applicationId, 'GET')
  },

  async approveCompanionApplication(applicationId) {
    return request('/api/admin/companion-applications/' + applicationId + '/approve', 'PUT')
  },

  async rejectCompanionApplication(applicationId) {
    return request('/api/admin/companion-applications/' + applicationId + '/reject', 'PUT')
  },

  async deleteCompanionApplication(applicationId) {
    return request('/api/admin/companion-applications/' + applicationId, 'DELETE')
  },

  async getVirtualUsers(params = {}) {
    const { page = 1, pageSize = 20 } = params
    return request('/api/admin/virtual-users', 'GET', { page, pageSize })
  },

  async getVirtualUserDetail(virtualUserId) {
    return request('/api/admin/virtual-users/' + virtualUserId, 'GET')
  },

  async createVirtualUser(userData) {
    return request('/api/admin/virtual-users', 'POST', userData)
  },

  async updateVirtualUser(virtualUserId, userData) {
    return request('/api/admin/virtual-users/' + virtualUserId, 'PUT', userData)
  },

  async toggleVirtualUserStatus(virtualUserId, status) {
    return request('/api/admin/virtual-users/' + virtualUserId + '/status', 'PUT', { status })
  },

  async deleteVirtualUser(virtualUserId) {
    return request('/api/admin/virtual-users/' + virtualUserId, 'DELETE')
  },

  async getVirtualUserChatHistory(virtualUserId, params = {}) {
    const { page = 1, pageSize = 20, userId } = params
    return request('/api/admin/virtual-users/' + virtualUserId + '/chat-history', 'GET', { page, pageSize, userId })
  },

  async getSystemSettings() {
    return request('/api/admin/settings', 'GET')
  },

  async updateSystemSettings(settings) {
    return request('/api/admin/settings', 'PUT', settings)
  },

  async getDashboardStats() {
    return request('/api/admin/dashboard', 'GET')
  }
}

export default adminService
