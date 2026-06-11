/**
 * admin-frontend 公共工具函数测试
 */
import { describe, it, expect } from 'vitest'

// 直接从源码导入公共函数
import {
  getLevelName,
  formatTime,
  formatTimeMs,
  formatTimeHMS
} from '../../src/common/common'

describe('getLevelName', () => {
  it('应返回正确的等级名称', () => {
    expect(getLevelName(1)).toBe('新手')
    expect(getLevelName(5)).toBe('精英')
    expect(getLevelName(10)).toBe('王者')
  })

  it('无效等级应返回默认"新手"', () => {
    expect(getLevelName(0)).toBe('新手')
    expect(getLevelName(-1)).toBe('新手')
    expect(getLevelName(999)).toBe('新手')
  })

  it('undefined/null 应返回默认值', () => {
    expect(getLevelName(undefined)).toBe('新手')
    expect(getLevelName(null)).toBe('新手')
  })
})

describe('formatTime', () => {
  it('应正确格式化秒级时间戳', () => {
    const ts = 1609459200 // 2021-01-01 00:00:00 UTC
    const result = formatTime(ts, 'YYYY-MM-DD HH:mm:ss')
    expect(result).toMatch(/2021-01-01 \d{2}:00:00/)
  })

  it('空值应返回空字符串', () => {
    expect(formatTime(0)).toBe('')
    expect(formatTime(null)).toBe('')
    expect(formatTime(undefined)).toBe('')
  })

  it('应支持自定义格式', () => {
    const ts = 1609459200
    expect(formatTime(ts, 'MM-DD')).toMatch(/01-01/)
  })
})

describe('formatTimeMs', () => {
  it('应正确格式化毫秒时间戳', () => {
    const ts = 1609459200000
    const result = formatTimeMs(ts, 'MM-DD HH:mm')
    expect(result).toMatch(/01-01 \d{2}:00/)
  })

  it('空值应返回空字符串', () => {
    expect(formatTimeMs(0)).toBe('')
    expect(formatTimeMs(null)).toBe('')
  })
})

describe('formatTimeHMS', () => {
  it('应返回 HH:mm 格式', () => {
    const ts = 1609459200000
    expect(formatTimeHMS(ts)).toMatch(/^\d{2}:\d{2}$/)
  })

  it('空值应返回空字符串', () => {
    expect(formatTimeHMS(0)).toBe('')
    expect(formatTimeHMS(null)).toBe('')
  })
})
