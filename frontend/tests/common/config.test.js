import { describe, it, expect } from 'vitest'

describe('Config Module', () => {
  it('should export host configuration', async () => {
    const config = await import('@/common/config.js')
    expect(config.host).toBeDefined()
    expect(typeof config.host).toBe('string')
  })

  it('should export webSocket configuration', async () => {
    const config = await import('@/common/config.js')
    expect(config.webSocket).toBeDefined()
    expect(typeof config.webSocket).toBe('string')
  })

  it('should export sdkappid configuration', async () => {
    const config = await import('@/common/config.js')
    expect(config.sdkappid).toBeDefined()
    expect(typeof config.sdkappid).toBe('number')
  })

  it('should export uploadUrl configuration', async () => {
    const config = await import('@/common/config.js')
    expect(config.uploadUrl).toBeDefined()
    expect(typeof config.uploadUrl).toBe('string')
  })

  it('should export cosConfig', async () => {
    const config = await import('@/common/config.js')
    expect(config.cosConfig).toBeDefined()
    expect(typeof config.cosConfig).toBe('object')
    expect(config.cosConfig.bucket).toBeDefined()
    expect(config.cosConfig.region).toBeDefined()
  })

  it('should export appName', async () => {
    const config = await import('@/common/config.js')
    expect(config.appName).toBeDefined()
    expect(typeof config.appName).toBe('string')
  })

  it('should export version', async () => {
    const config = await import('@/common/config.js')
    expect(config.version).toBeDefined()
    expect(typeof config.version).toBe('string')
  })

  it('should export isDebug flag', async () => {
    const config = await import('@/common/config.js')
    expect(typeof config.isDebug).toBe('boolean')
  })
})
