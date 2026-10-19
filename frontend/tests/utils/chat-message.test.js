import { describe, it, expect } from 'vitest'
import { applyRevokedState, isRevokedMessage, isChatMessageExpired, REVOKED_PLACEHOLDER } from '@/utils/chatMessage'

describe('chatMessage 撤回态映射', () => {
  it('识别服务端 isRevoked 标记', () => {
    expect(isRevokedMessage({ isRevoked: true })).toBe(true)
    expect(isRevokedMessage({ isRevoked: 1 })).toBe(true)
    expect(isRevokedMessage({ isRevoked: false })).toBe(false)
    expect(isRevokedMessage({})).toBe(false)
    expect(isRevokedMessage(null)).toBe(false)
    expect(isRevokedMessage(undefined)).toBe(false)
  })

  it('撤回态覆盖原文，刷新后不复活原文', () => {
    const base = { id: 12, isOwn: true, type: 'text', content: '不能泄露的原文', status: 'read', duration: 0 }
    const out = applyRevokedState(base)

    expect(out.content).toBe(REVOKED_PLACEHOLDER)
    expect(out.content).not.toContain('不能泄露')
    expect(out.type).toBe('system')
    expect(out.status).toBe('recalled')
    // 其余字段保留，气泡位置/时间仍可正确渲染
    expect(out.id).toBe(12)
    expect(out.isOwn).toBe(true)
  })

  it('即使服务端仍带回原文也强制覆盖', () => {
    const out = applyRevokedState({ id: 1, content: '残留原文', type: 'image' })
    expect(out.content).toBe(REVOKED_PLACEHOLDER)
    expect(out.type).toBe('system')
  })

  it('空值安全', () => {
    expect(applyRevokedState(null)).toBeNull()
    expect(applyRevokedState(undefined)).toBeUndefined()
  })
})

describe('时间自动撤回的到期判定', () => {
  const now = 1700000000000 // 毫秒

  it('未到期 / 关闭（0）都不算到期', () => {
    expect(isChatMessageExpired(0, now)).toBe(false)
    expect(isChatMessageExpired(now / 1000 + 30, now)).toBe(false)
  })

  it('到点与已过期都算到期', () => {
    expect(isChatMessageExpired(now / 1000, now)).toBe(true)
    expect(isChatMessageExpired(now / 1000 - 1, now)).toBe(true)
  })

  it('脏值安全（null / undefined / 非数字）', () => {
    expect(isChatMessageExpired(null, now)).toBe(false)
    expect(isChatMessageExpired(undefined, now)).toBe(false)
    expect(isChatMessageExpired('abc', now)).toBe(false)
  })
})
