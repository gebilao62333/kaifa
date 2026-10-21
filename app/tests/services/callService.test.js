import { describe, it, expect, vi, beforeEach } from 'vitest'

// 通话服务是纯门面：HTTP 走 common/request，信令走 socketService，媒体走 webrtcCallService。
// 这里只 mock 边界，直接断言「发给了后端什么」与「发了哪个 socket 事件」。
const { requestMock, socketMock, webrtcMock, trtcMock, trtcRoomMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  socketMock: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
  webrtcMock: {
    localStream: null,
    initiateCall: vi.fn(),
    handleIncomingCall: vi.fn(),
    hangup: vi.fn(),
    cleanup: vi.fn(),
    toggleAudio: vi.fn(),
    toggleVideo: vi.fn()
  },
  trtcMock: {
    startCall: vi.fn(),
    cancelCall: vi.fn(),
    rejectCall: vi.fn(),
    acceptCall: vi.fn(),
    endCall: vi.fn(),
    getAuth: vi.fn(),
    getCallHistory: vi.fn()
  },
  trtcRoomMock: { join: vi.fn(), leave: vi.fn(), setRemoteView: vi.fn() }
}))

vi.mock('@/common/common', () => ({ request: requestMock }))
vi.mock('@/services/trtcService', () => ({ trtcService: trtcMock }))
vi.mock('@/services/webrtcCallService', () => ({ webrtcCallService: webrtcMock }))
vi.mock('@/services/socketService', () => ({ socketService: socketMock }))
vi.mock('@/services/trtcRoomService', () => ({
  isTrtcSdkLoaded: () => false,
  loadTrtcSdk: vi.fn(),
  trtcRoomService: trtcRoomMock
}))

import { callService } from '@/services/callService'

// 单例在用例间共享，必须手工复位（保持与 constructor 初始值一致）
const resetCallService = () => {
  callService._trtcAvailable = null
  callService._channel = null
  callService.currentMode = null
  callService.currentCallId = null
  callService.currentCallType = 1
  callService.remoteUserId = null
  callService.durationTimer = null
  callService.callDuration = 0
  callService.onDurationTick = null
  callService.onCallEnd = null
}

const emittedEvents = () => socketMock.emit.mock.calls.map((call) => call[0])

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  resetCallService()
  webrtcMock.initiateCall.mockResolvedValue(undefined)
})

describe('callService 默认 WebRTC 通道透传计费参数（P1-6）', () => {
  it('陪玩呼叫把 isCompanionCall/orderId 原样带到 /api/trtc/start', async () => {
    callService._channel = 'webrtc'
    requestMock.mockResolvedValue({ code: 200, data: { callId: 66, trtcRoomId: 123456 } })

    const result = await callService.startCall(9, 2, true, 321)

    expect(requestMock).toHaveBeenCalledWith('/api/trtc/start', 'POST', {
      calleeId: 9,
      callType: 2,
      isCompanionCall: true,
      orderId: 321
    })
    expect(webrtcMock.initiateCall).toHaveBeenCalledWith(9, 2, 66)
    expect(result).toEqual({ callId: 66, mode: 'webrtc' })
  })

  it('普通呼叫传 false/0，保持原语义', async () => {
    callService._channel = 'webrtc'
    requestMock.mockResolvedValue({ code: 200, data: { callId: 67 } })

    await callService.startCall(9, 1)

    expect(requestMock).toHaveBeenCalledWith('/api/trtc/start', 'POST', {
      calleeId: 9,
      callType: 1,
      isCompanionCall: false,
      orderId: 0
    })
  })

  it('TRTC 不可用回退 webrtc 时同样透传参数', async () => {
    callService._channel = 'trtc'
    trtcMock.getAuth.mockRejectedValue(new Error('TRTC未配置'))
    requestMock.mockResolvedValue({ code: 200, data: { callId: 68 } })

    const result = await callService.startCall(9, 1, true, 456)

    expect(result.mode).toBe('webrtc')
    expect(requestMock).toHaveBeenCalledWith('/api/trtc/start', 'POST', {
      calleeId: 9,
      callType: 1,
      isCompanionCall: true,
      orderId: 456
    })
  })
})

describe('callService.cancelCall 未接通取消语义（P1-7）', () => {
  it('webrtc 未接通：调取消接口、发 call_cancel、清本地媒体，不发 call_end', async () => {
    callService.currentMode = 'webrtc'
    callService.currentCallId = 66
    callService.remoteUserId = 9
    trtcMock.cancelCall.mockResolvedValue({})

    await callService.cancelCall(66)

    expect(trtcMock.cancelCall).toHaveBeenCalledWith(66)
    expect(socketMock.emit).toHaveBeenCalledWith('call_cancel', { toId: 9 })
    // 不能同时发 call_end：webrtcCallService.hangup() 内部会发 call_end，
    // 所以取消走 cleanup()，对端只会收到一个 call_cancel。
    expect(emittedEvents()).not.toContain('call_end')
    expect(webrtcMock.cleanup).toHaveBeenCalledTimes(1)
    expect(webrtcMock.hangup).not.toHaveBeenCalled()
    expect(callService.currentMode).toBeNull()
    expect(callService.currentCallId).toBeNull()
  })

  it('取消接口失败（如状态已变）也仍做本地收尾并通知对端', async () => {
    callService.currentMode = 'webrtc'
    callService.currentCallId = 66
    callService.remoteUserId = 9
    trtcMock.cancelCall.mockRejectedValue(new Error('通话状态不正确'))

    await expect(callService.cancelCall(66)).resolves.toBeUndefined()

    expect(webrtcMock.cleanup).toHaveBeenCalledTimes(1)
    expect(socketMock.emit).toHaveBeenCalledWith('call_cancel', { toId: 9 })
  })

  it('trtc 通道取消：离开房间，同样只发 call_cancel', async () => {
    callService.currentMode = 'trtc'
    callService.currentCallId = 66
    callService.remoteUserId = 9
    trtcMock.cancelCall.mockResolvedValue({})

    await callService.cancelCall(66)

    expect(trtcRoomMock.leave).toHaveBeenCalled()
    expect(webrtcMock.cleanup).not.toHaveBeenCalled()
    expect(emittedEvents()).not.toContain('call_end')
    expect(socketMock.emit).toHaveBeenCalledWith('call_cancel', { toId: 9 })
  })
})

describe('callService.endCall 已接通挂断语义保持不变', () => {
  it('webrtc 已接通：hangup + /api/trtc/end + call_end + onCallEnd', async () => {
    callService.currentMode = 'webrtc'
    callService.currentCallId = 66
    callService.remoteUserId = 9
    trtcMock.endCall.mockResolvedValue({})
    const onCallEnd = vi.fn()
    callService.setCallbacks({ onCallEnd })

    await callService.endCall(120)

    expect(webrtcMock.hangup).toHaveBeenCalledWith(120)
    expect(webrtcMock.cleanup).not.toHaveBeenCalled()
    expect(trtcMock.cancelCall).not.toHaveBeenCalled()
    expect(trtcMock.endCall).toHaveBeenCalledWith(66)
    expect(socketMock.emit).toHaveBeenCalledWith('call_end', { toId: 9, duration: 120 })
    expect(onCallEnd).toHaveBeenCalledWith(120)
  })
})
