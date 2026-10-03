import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('common/payMethods', () => {
  let mod

  beforeEach(async () => {
    vi.resetModules()
    mod = await import('@/common/payMethods')
  })

  it('payMethods 覆盖 5 种支付方式且字段完整', () => {
    const keys = Object.keys(mod.payMethods)
    expect(keys).toEqual(['coin', 'alipay', 'wechat', 'card', 'balance'])
    keys.forEach((k) => {
      const m = mod.payMethods[k]
      expect(m.id).toBe(k)
      expect(typeof m.name).toBe('string')
      expect(typeof m.icon).toBe('string')
      expect(typeof m.desc).toBe('string')
      expect(typeof m.bg).toBe('string')
    })
  })

  it('getRechargeMethods 返回 4 种充值方式且不含金币', () => {
    const list = mod.getRechargeMethods()
    expect(list).toHaveLength(4)
    expect(list.map((x) => x.id)).toEqual(['alipay', 'wechat', 'card', 'balance'])
  })

  it('getWithdrawMethods 使用默认银行描述并定制微信/银行卡文案', () => {
    const list = mod.getWithdrawMethods()
    expect(list).toHaveLength(3)
    expect(list[0].id).toBe('alipay')
    expect(list[1].name).toBe('微信零钱')
    expect(list[1].desc).toBe('实时到账')
    expect(list[2].desc).toBe('支持各大银行')
    // 派生的对象不应污染原始 payMethods
    expect(mod.payMethods.wechat.name).toBe('微信支付')
  })

  it('getWithdrawMethods 支持自定义银行描述', () => {
    const list = mod.getWithdrawMethods('仅支持工行')
    expect(list[2].desc).toBe('仅支持工行')
  })

  it('getOrderPayMethods 仅返回金币支付', () => {
    const list = mod.getOrderPayMethods()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe('coin')
  })
})

describe('common/webrtcConfig', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('未配置 TURN 时仅有两个公共 STUN', async () => {
    const mod = await import('@/common/webrtcConfig')
    expect(mod.ICE_SERVERS).toHaveLength(2)
    expect(mod.ICE_SERVERS[0].urls).toContain('stun:')
    expect(mod.ICE_SERVERS[1].urls).toContain('stun:')
    expect(mod.ICE_SERVERS.some((s) => String(s.urls).startsWith('turn:'))).toBe(false)
  })

  it('配置 TURN 时追加带凭据的中继服务器', async () => {
    vi.stubEnv('VITE_TURN_URL', 'turn:turn.example.com:3478')
    vi.stubEnv('VITE_TURN_USERNAME', 'user1')
    vi.stubEnv('VITE_TURN_CREDENTIAL', 'pass1')
    const mod = await import('@/common/webrtcConfig')
    const turn = mod.ICE_SERVERS.find((s) => String(s.urls).startsWith('turn:'))
    expect(turn).toBeTruthy()
    expect(turn.username).toBe('user1')
    expect(turn.credential).toBe('pass1')
  })

  it('只配置 TURN URL 时追加匿名中继', async () => {
    vi.stubEnv('VITE_TURN_URL', 'turn:only-url:3478')
    vi.stubEnv('VITE_TURN_USERNAME', '')
    vi.stubEnv('VITE_TURN_CREDENTIAL', '')
    const mod = await import('@/common/webrtcConfig')
    const turn = mod.ICE_SERVERS.find((s) => String(s.urls).startsWith('turn:'))
    expect(turn).toBeTruthy()
    expect(turn.username).toBeUndefined()
    expect(turn.credential).toBeUndefined()
  })

  it('RTC_CONFIGURATION 与默认导出结构一致', async () => {
    const mod = await import('@/common/webrtcConfig')
    expect(mod.RTC_CONFIGURATION.iceServers).toBe(mod.ICE_SERVERS)
    expect(mod.default).toBe(mod.RTC_CONFIGURATION)
  })
})
