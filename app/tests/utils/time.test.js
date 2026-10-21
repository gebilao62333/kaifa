import { describe, it, expect, vi } from 'vitest'
import { toMs, formatTimeAgo, formatDateTime, formatClock } from '@/common/time'

const NOW = Date.UTC(2026, 9, 21, 12, 0, 0) // 2026-10-21 12:00:00 UTC

describe('common/time 时间戳归一', () => {
  it('秒级时间戳转毫秒，不出现 1970', () => {
    expect(toMs(1792405999)).toBe(1792405999000)
    expect(new Date(toMs(1792405999)).getUTCFullYear()).toBe(2026)
  })

  it('毫秒级时间戳原样返回', () => {
    expect(toMs(1792405999000)).toBe(1792405999000)
  })

  it('ISO 字符串与 Date 兼容', () => {
    expect(toMs('2026-10-21T12:00:00Z')).toBe(NOW)
    expect(toMs(new Date(NOW))).toBe(NOW)
  })

  it('空值/非法值返回 0', () => {
    expect(toMs(null)).toBe(0)
    expect(toMs('')).toBe(0)
    expect(toMs('not-a-date')).toBe(0)
    expect(toMs(0)).toBe(0)
  })
})

describe('common/time 格式化', () => {
  it('相对时间分桶（秒级输入）', () => {
    expect(formatTimeAgo(Math.floor((NOW - 30 * 1000) / 1000), { now: NOW })).toBe('刚刚')
    expect(formatTimeAgo(Math.floor((NOW - 5 * 60 * 1000) / 1000), { now: NOW })).toBe('5分钟前')
    expect(formatTimeAgo(Math.floor((NOW - 3 * 3600 * 1000) / 1000), { now: NOW })).toBe('3小时前')
    expect(formatTimeAgo(Math.floor((NOW - 2 * 86400 * 1000) / 1000), { now: NOW })).toBe('2天前')
  })

  it('fallback 支持 slash/cn/days/locale', () => {
    const old = Math.floor((NOW - 30 * 86400 * 1000) / 1000)
    expect(formatTimeAgo(old, { now: NOW, fallback: 'slash' })).toMatch(/^\d+-\d+$/)
    expect(formatTimeAgo(old, { now: NOW, fallback: 'cn' })).toMatch(/^\d+月\d+日$/)
    expect(formatTimeAgo(old, { now: NOW, fallback: 'days' })).toBe('30天前')
    expect(formatTimeAgo(old, { now: NOW })).toBeTruthy()
  })

  it('formatDateTime / formatClock 走毫秒归一', () => {
    const sec = Math.floor(NOW / 1000)
    expect(formatDateTime(sec)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    expect(formatClock(sec)).toMatch(/^\d{2}:\d{2}$/)
    expect(formatDateTime(0)).toBe('')
  })
})
