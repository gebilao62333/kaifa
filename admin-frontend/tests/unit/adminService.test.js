/**
 * adminService API 服务层测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import adminService from '../../src/services/adminService'

// Mock common/common 中的 request 和 validateParams
vi.mock('../../src/common/common', () => ({
  request: vi.fn(),
  validateParams: vi.fn((params, rules) => {
    // 模拟参数校验：检查 required 字段
    for (const [key, rule] of Object.entries(rules)) {
      if (rule.required && (params[key] === undefined || params[key] === null || params[key] === '')) {
        throw new Error(`${rule.label}不能为空`)
      }
    }
  })
}))

import { request, validateParams } from '../../src/common/common'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('adminService', () => {
  describe('login', () => {
    it('应调用正确的 API 端点', async () => {
      request.mockResolvedValue({ code: 200, data: { token: 'test-token' } })

      const result = await adminService.login('admin', 'admin123')

      expect(validateParams).toHaveBeenCalled()
      expect(request).toHaveBeenCalledWith('/api/admin/login', 'POST', {
        username: 'admin',
        password: 'admin123'
      })
      expect(result.code).toBe(200)
    })

    it('参数校验失败应抛错', async () => {
      await expect(adminService.login('', '')).rejects.toThrow('用户名不能为空')
    })
  })

  describe('getStatistics', () => {
    it('应调用 GET /api/admin/statistics', async () => {
      request.mockResolvedValue({ code: 200, data: { totalUsers: 100 } })

      const result = await adminService.getStatistics()

      expect(request).toHaveBeenCalledWith('/api/admin/statistics', 'GET')
      expect(result.data.totalUsers).toBe(100)
    })
  })

  describe('getUsers', () => {
    it('应发送默认分页参数', async () => {
      request.mockResolvedValue({ code: 200, data: { rows: [] } })

      await adminService.getUsers()

      expect(request).toHaveBeenCalledWith('/api/admin/users', 'GET', {
        page: 1,
        pageSize: 20
      })
    })

    it('应支持关键词搜索', async () => {
      request.mockResolvedValue({ code: 200, data: { rows: [] } })

      await adminService.getUsers({ keyword: 'test' })

      expect(request).toHaveBeenCalledWith('/api/admin/users', 'GET', {
        page: 1,
        pageSize: 20,
        nickname: 'test'
      })
    })

    it('应支持状态筛选', async () => {
      request.mockResolvedValue({ code: 200, data: { rows: [] } })

      await adminService.getUsers({ status: 1 })

      expect(request).toHaveBeenCalledWith('/api/admin/users', 'GET', {
        page: 1,
        pageSize: 20,
        status: 1
      })
    })
  })

  describe('getUserDetail', () => {
    it('应调用 GET /api/admin/users/:id', async () => {
      request.mockResolvedValue({ code: 200, data: { id: 1, username: 'test' } })

      const result = await adminService.getUserDetail(1)

      expect(request).toHaveBeenCalledWith('/api/admin/users/1', 'GET')
      expect(result.data.username).toBe('test')
    })
  })

  describe('updateUserStatus', () => {
    it('应调用 PUT /api/admin/users/:id/status', async () => {
      request.mockResolvedValue({ code: 200 })

      await adminService.updateUserStatus(1, 'active')

      expect(request).toHaveBeenCalledWith('/api/admin/users/1/status', 'PUT', {
        status: 'active'
      })
    })
  })

  describe('deleteUser', () => {
    it('应调用 DELETE /api/admin/users/:id', async () => {
      request.mockResolvedValue({ code: 200 })

      await adminService.deleteUser(1)

      expect(request).toHaveBeenCalledWith('/api/admin/users/1', 'DELETE')
    })
  })

  describe('getOrders', () => {
    it('应发送默认分页参数', async () => {
      request.mockResolvedValue({ code: 200, data: { rows: [] } })

      await adminService.getOrders()

      expect(request).toHaveBeenCalledWith('/api/admin/orders', 'GET', {
        page: 1,
        pageSize: 20
      })
    })

    it('应支持订单号搜索', async () => {
      request.mockResolvedValue({ code: 200, data: { rows: [] } })

      await adminService.getOrders({ orderNo: 'ORD-001' })

      expect(request).toHaveBeenCalledWith('/api/admin/orders', 'GET', {
        page: 1,
        pageSize: 20,
        orderNo: 'ORD-001'
      })
    })
  })

  describe('approveWithdraw', () => {
    it('应调用 POST /api/admin/withdraws/:id/approve', async () => {
      request.mockResolvedValue({ code: 200 })

      await adminService.approveWithdraw(10)

      expect(request).toHaveBeenCalledWith('/api/admin/withdraws/10/approve', 'POST')
    })
  })

  describe('rejectWithdraw', () => {
    it('应发送拒绝原因', async () => {
      request.mockResolvedValue({ code: 200 })

      await adminService.rejectWithdraw(10, '资料不全')

      expect(request).toHaveBeenCalledWith('/api/admin/withdraws/10/reject', 'POST', {
        reason: '资料不全'
      })
    })

    it('默认原因应为空字符串', async () => {
      request.mockResolvedValue({ code: 200 })

      await adminService.rejectWithdraw(10)

      expect(request).toHaveBeenCalledWith('/api/admin/withdraws/10/reject', 'POST', {
        reason: ''
      })
    })
  })

  describe('reviewWithdraw', () => {
    it('status=1 应调用 approveWithdraw', async () => {
      request.mockResolvedValue({ code: 200 })

      await adminService.reviewWithdraw(10, 1)

      expect(request).toHaveBeenCalledWith('/api/admin/withdraws/10/approve', 'POST')
    })

    it('status≠1 应调用 rejectWithdraw', async () => {
      request.mockResolvedValue({ code: 200 })

      await adminService.reviewWithdraw(10, 2, '拒绝原因')

      expect(request).toHaveBeenCalledWith('/api/admin/withdraws/10/reject', 'POST', {
        reason: '拒绝原因'
      })
    })

    it('参数校验应生效', async () => {
      await expect(adminService.reviewWithdraw(null, 1)).rejects.toThrow('提现ID不能为空')
    })
  })

  describe('getCards', () => {
    it('应支持分类和批次筛选', async () => {
      request.mockResolvedValue({ code: 200, data: { rows: [] } })

      await adminService.getCards({ category: 'gold', batchNo: 'B001' })

      expect(request).toHaveBeenCalledWith('/api/admin/cards', 'GET', {
        page: 1,
        pageSize: 20,
        category: 'gold',
        batchNo: 'B001'
      })
    })

    it('空字符串 status 不应发送', async () => {
      request.mockResolvedValue({ code: 200, data: { rows: [] } })

      await adminService.getCards({ status: '' })

      expect(request).toHaveBeenCalledWith('/api/admin/cards', 'GET', {
        page: 1,
        pageSize: 20
      })
    })
  })

  describe('getSystemSettings', () => {
    it('应调用 GET /api/admin/settings', async () => {
      request.mockResolvedValue({ code: 200, data: { siteName: '多客陪玩' } })

      const result = await adminService.getSystemSettings()

      expect(request).toHaveBeenCalledWith('/api/admin/settings', 'GET')
      expect(result.data.siteName).toBe('多客陪玩')
    })
  })

  describe('getDashboardStats', () => {
    it('应调用 GET /api/admin/dashboard', async () => {
      request.mockResolvedValue({ code: 200, data: { totalUsers: 500 } })

      const result = await adminService.getDashboardStats()

      expect(request).toHaveBeenCalledWith('/api/admin/dashboard', 'GET')
      expect(result.data.totalUsers).toBe(500)
    })
  })

  describe('getNotifications', () => {
    it('应支持类型筛选', async () => {
      request.mockResolvedValue({ code: 200, data: { rows: [] } })

      await adminService.getNotifications({ type: 'system' })

      expect(request).toHaveBeenCalledWith('/api/admin/notifications', 'GET', {
        page: 1,
        pageSize: 15,
        type: 'system'
      })
    })
  })

  describe('pushNotification', () => {
    it('应调用 POST /api/admin/notifications/:id/push', async () => {
      request.mockResolvedValue({ code: 200 })

      await adminService.pushNotification(5)

      expect(request).toHaveBeenCalledWith('/api/admin/notifications/5/push', 'POST')
    })
  })
})
