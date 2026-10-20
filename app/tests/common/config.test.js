import { describe, it, expect } from 'vitest'

describe('Config Module', () => {
  it('should export api prefix', async () => {
    const config = await import('@/common/config.js')
    expect(config.api).toBe('/api')
  })

  it('should export socketUrl configuration', async () => {
    const config = await import('@/common/config.js')
    expect(config.socketUrl).toBeDefined()
    expect(typeof config.socketUrl).toBe('string')
  })
})
