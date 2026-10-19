import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validateNickname,
  validateRequired,
  validateNumber,
  validateStringLength,
  validateParams,
  RequestError
} from '@/common/common.js'

// 这些校验器是前端表单/接口参数的核心业务规则（与 common.test.js 的格式化类测试不重叠）。
describe('输入与参数校验器', () => {
  describe('validateEmail', () => {
    it('合法邮箱应通过', () => {
      expect(validateEmail('a@b.com')).toBe(true)
      expect(validateEmail('x.y+z@sub.domain.cn')).toBe(true)
    })
    it('非法邮箱应拒绝', () => {
      expect(validateEmail('a@b')).toBe(false)
      expect(validateEmail('ab.com')).toBe(false)
      expect(validateEmail('a b@c.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('6-32 位合法', () => {
      expect(validatePassword('123456')).toBe(true)
      expect(validatePassword('a'.repeat(32))).toBe(true)
    })
    it('过短/过长/空应拒绝', () => {
      expect(validatePassword('12345')).toBe(false)
      expect(validatePassword('a'.repeat(33))).toBe(false)
      expect(validatePassword('')).toBe(false)
      expect(validatePassword(null)).toBe(false)
    })
  })

  describe('validateNickname', () => {
    it('2-20 位合法', () => {
      expect(validateNickname('小明')).toBe(true)
      expect(validateNickname('a'.repeat(20))).toBe(true)
    })
    it('过短/过长/空应拒绝', () => {
      expect(validateNickname('a')).toBe(false)
      expect(validateNickname('a'.repeat(21))).toBe(false)
      expect(validateNickname('')).toBe(false)
    })
  })

  describe('validateRequired', () => {
    it('非空（含 0/false）应通过', () => {
      expect(validateRequired('x', '字段')).toBe(true)
      expect(validateRequired(0, '字段')).toBe(true)
      expect(validateRequired(false, '字段')).toBe(true)
    })
    it('空值应抛错', () => {
      expect(() => validateRequired('', '名字')).toThrow('名字不能为空')
      expect(() => validateRequired(null, '名字')).toThrow('名字不能为空')
      expect(() => validateRequired(undefined, '名字')).toThrow('名字不能为空')
    })
  })

  describe('validateNumber', () => {
    it('合法数字通过', () => {
      expect(validateNumber('10', '年龄', 1, 120)).toBe(true)
      expect(validateNumber(50, '年龄', 1, 120)).toBe(true)
    })
    it('非数字抛错', () => {
      expect(() => validateNumber('abc', '年龄')).toThrow('年龄必须是数字')
    })
    it('越界抛错', () => {
      expect(() => validateNumber('0', '年龄', 1, 120)).toThrow('年龄不能小于1')
      expect(() => validateNumber('200', '年龄', 1, 120)).toThrow('年龄不能大于120')
    })
  })

  describe('validateStringLength', () => {
    it('空值放行', () => {
      expect(validateStringLength('', '备注', 1, 10)).toBe(true)
    })
    it('越界抛错', () => {
      expect(() => validateStringLength('a', '备注', 2, 10)).toThrow('备注长度不能小于2')
      expect(() => validateStringLength('a'.repeat(11), '备注', 2, 10)).toThrow('备注长度不能大于10')
    })
  })

  describe('validateParams', () => {
    it('全部合法返回 true', () => {
      const rules = {
        name: { required: true, type: 'string', minLength: 2, maxLength: 20 },
        age: { required: true, type: 'number', min: 1, max: 120 },
        email: { required: false, pattern: /^[^@]+@[^@]+\.[^@]+$/ }
      }
      expect(validateParams({ name: '小明', age: '25', email: 'a@b.com' }, rules)).toBe(true)
    })
    it('多错误合并抛出', () => {
      const rules = {
        name: { required: true, type: 'string', minLength: 2 },
        age: { required: true, type: 'number', min: 1 }
      }
      expect(() => validateParams({ name: '', age: 'abc' }, rules)).toThrow(/name不能为空/)
      expect(() => validateParams({ name: '', age: 'abc' }, rules)).toThrow(/age必须是数字/)
    })
    it('正则 pattern 失败', () => {
      const rules = { phone: { required: true, pattern: /^1[3-9]\d{9}$/ } }
      expect(() => validateParams({ phone: '123' }, rules)).toThrow('phone格式不正确')
    })
  })

  describe('RequestError', () => {
    it('携带 code/status/fieldErrors', () => {
      const e = new RequestError('错误', 500, 400, { name: '必填' })
      expect(e).toBeInstanceOf(Error)
      expect(e.message).toBe('错误')
      expect(e.code).toBe(500)
      expect(e.status).toBe(400)
      expect(e.fieldErrors).toEqual({ name: '必填' })
    })
  })
})
