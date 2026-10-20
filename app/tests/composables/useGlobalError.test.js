import { describe, it, expect, beforeEach } from 'vitest'

let mod

describe('composables/useGlobalError - 全局错误兜底', () => {
  beforeEach(async () => {
    const { vi } = await import('vitest')
    vi.resetModules()
    mod = await import('@/composables/useGlobalError')
  })

  it('captureGlobalError 写入可展示的错误信息，clear 后清空', () => {
    expect(mod.useGlobalError().value).toBe(null)
    mod.captureGlobalError(new Error('渲染失败'), 'render')
    expect(mod.useGlobalError().value).toMatchObject({ message: '渲染失败', info: 'render' })
    mod.clearGlobalError()
    expect(mod.useGlobalError().value).toBe(null)
  })

  it('空错误不覆盖已有状态', () => {
    mod.captureGlobalError(null)
    expect(mod.useGlobalError().value).toBe(null)
  })
})
