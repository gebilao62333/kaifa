import { describe, it, expect } from 'vitest'
import {
  validateRequired,
  validateNumber,
  validateStringLength,
  validateParams,
  formatBalance,
  formatTime,
  RequestError
} from '../src/common/common.js'

// 管理后台业务规则测试（与 smoke.test.js 的框架可用性测试不重叠）。
describe('管理后台 校验器与格式化', () => {
  describe('formatBalance', () => {
    it('null/undefined → 0.00', () => {
      expect(formatBalance(null)).toBe('0.00')
      expect(formatBalance(undefined)).toBe('0.00')
    })
    it('保留两位小数', () => {
      expect(formatBalance(8.5)).toBe('8.50')
      expect(formatBalance(100)).toBe('100.00')
    })
  })

  describe('formatTime', () => {
    it('秒级时间戳(10 位)自动 ×1000', () => {
      const r = formatTime(1704067200)
      expect(r).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })
    it('毫秒级时间戳原样', () => {
      const r = formatTime(1704067200000)
      expect(r).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })
    it('空值返回空串', () => {
      expect(formatTime(null)).toBe('')
      expect(formatTime(0)).toBe('')
    })
  })

  describe('validateRequired', () => {
    it('0/false 视为有值', () => {
      expect(validateRequired(0, 'x')).toBe(true)
      expect(validateRequired(false, 'x')).toBe(true)
    })
    it('空值抛错', () => {
      expect(() => validateRequired('', '名称')).toThrow('名称不能为空')
    })
  })

  describe('validateNumber', () => {
    it('越界抛错', () => {
      expect(() => validateNumber('0', '数量', 1, 10)).toThrow('数量不能小于1')
      expect(() => validateNumber('20', '数量', 1, 10)).toThrow('数量不能大于10')
      expect(() => validateNumber('x', '数量')).toThrow('数量必须是数字')
    })
  })

  describe('validateParams', () => {
    it('合法通过', () => {
      const rules = { name: { required: true, type: 'string', minLength: 1, maxLength: 50 } }
      expect(validateParams({ name: '管理员' }, rules)).toBe(true)
    })
    it('缺失必填字段抛错', () => {
      const rules = { name: { required: true } }
      expect(() => validateParams({}, rules)).toThrow('name不能为空')
    })
  })

  describe('RequestError', () => {
    it('实例属性正确', () => {
      const e = new RequestError('失败', 401, 401, { token: '过期' })
      expect(e).toBeInstanceOf(Error)
      expect(e.name).toBe('RequestError')
      expect(e.code).toBe(401)
      expect(e.fieldErrors).toEqual({ token: '过期' })
    })
  })
})
