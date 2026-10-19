import { describe, it, expect, vi, beforeEach } from 'vitest'

// 隔离网络层：webrtcConfig 通过 request() 拉取后端下发的 ICE 配置
const requestMock = vi.fn()
vi.mock('@/common/common.js', () => ({
  request: (...args) => requestMock(...args)
}))

describe('WebRTC 配置（getRtcConfiguration）', () => {
  beforeEach(async () => {
    requestMock.mockReset()
    const mod = await import('@/common/webrtcConfig.js')
    mod.resetRtcConfiguration()
  })

  it('后端下发 ICE 服务器时优先使用（含临时 TURN 凭据）', async () => {
    requestMock.mockResolvedValue({
      code: 200,
      data: {
        channel: 'webrtc',
        turnEnabled: true,
        ttl: 600,
        iceServers: [
          { urls: 'stun:stun.example.com:19302' },
          { urls: 'turn:turn.example.com:3478', username: '123:1001', credential: 'abc' }
        ]
      }
    })

    const { getRtcConfiguration } = await import('@/common/webrtcConfig.js')
    const cfg = await getRtcConfiguration()

    expect(requestMock).toHaveBeenCalledWith('/api/config/call', 'GET')
    expect(cfg.iceServers).toHaveLength(2)
    expect(cfg.iceServers[1].urls).toBe('turn:turn.example.com:3478')
    expect(cfg.iceServers[1].username).toBe('123:1001')
  })

  it('后端不可用时回落到静态 STUN，不抛错', async () => {
    requestMock.mockRejectedValue(new Error('network down'))

    const { getRtcConfiguration, RTC_CONFIGURATION } = await import('@/common/webrtcConfig.js')
    const cfg = await getRtcConfiguration()

    expect(cfg).toEqual(RTC_CONFIGURATION)
    expect(cfg.iceServers.length).toBeGreaterThan(0)
    expect(cfg.iceServers.every((s) => s.urls.startsWith('stun:'))).toBe(true)
  })

  it('缓存生效：TTL 内重复调用只请求一次', async () => {
    requestMock.mockResolvedValue({ code: 200, data: { ttl: 3600, iceServers: [{ urls: 'stun:a' }] } })

    const { getRtcConfiguration } = await import('@/common/webrtcConfig.js')
    await getRtcConfiguration()
    await getRtcConfiguration()

    expect(requestMock).toHaveBeenCalledTimes(1)
  })

  it('resetRtcConfiguration 后重新拉取', async () => {
    requestMock.mockResolvedValue({ code: 200, data: { ttl: 3600, iceServers: [{ urls: 'stun:a' }] } })

    const mod = await import('@/common/webrtcConfig.js')
    await mod.getRtcConfiguration()
    mod.resetRtcConfiguration()
    await mod.getRtcConfiguration()

    expect(requestMock).toHaveBeenCalledTimes(2)
  })

  it('后端返回空 iceServers 时回落静态 STUN', async () => {
    requestMock.mockResolvedValue({ code: 200, data: { iceServers: [] } })

    const { getRtcConfiguration, RTC_CONFIGURATION } = await import('@/common/webrtcConfig.js')
    const cfg = await getRtcConfiguration()

    expect(cfg).toEqual(RTC_CONFIGURATION)
  })
})
