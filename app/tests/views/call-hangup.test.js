import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 通话页只负责：调哪个 callService 方法 + 注册哪些 socket 监听。
// 这里 mock 掉服务层与路由，直接验证「挂断按钮」在不同接通状态下的分支选择。
const { callServiceMock, webrtcMock, socketMock, trtcRoomMock, routeMock, routerMock } = vi.hoisted(() => {
  const handlers = {}
  const socketMock = {
    handlers,
    on: vi.fn((event, cb) => {
      handlers[event] = handlers[event] || []
      handlers[event].push(cb)
    }),
    off: vi.fn(),
    emit: vi.fn(),
    resetHandlers: () => {
      Object.keys(handlers).forEach((key) => delete handlers[key])
    }
  }
  const callServiceMock = {
    currentMode: 'webrtc',
    startCall: vi.fn(),
    cancelCall: vi.fn(),
    endCall: vi.fn(),
    setCallbacks: vi.fn(),
    startDurationTimer: vi.fn(),
    toggleAudio: vi.fn(),
    toggleVideo: vi.fn(),
    toggleSpeaker: vi.fn(),
    switchCamera: vi.fn(),
    cleanup: vi.fn()
  }
  const webrtcMock = { localStream: null, setCallbacks: vi.fn(), cleanup: vi.fn() }
  const trtcRoomMock = { join: vi.fn(), setRemoteView: vi.fn(), leave: vi.fn() }
  const routeMock = { params: { id: '9' }, query: {} }
  const routerMock = {
    options: { history: { state: { back: false } } },
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  }
  return { callServiceMock, webrtcMock, socketMock, trtcRoomMock, routeMock, routerMock }
})

vi.mock('@/common/route', () => ({
  useRoute: () => routeMock,
  useRouter: () => routerMock
}))
vi.mock('@/services/callService', () => ({ callService: callServiceMock }))
vi.mock('@/services/webrtcCallService', () => ({ webrtcCallService: webrtcMock }))
vi.mock('@/services/socketService', () => ({ socketService: socketMock }))
vi.mock('@/services/trtcRoomService', () => ({ trtcRoomService: trtcRoomMock }))
vi.mock('@/services/nativeCallAdapter', () => ({ isNativeCallAvailable: () => false }))

import AudioCall from '@/pages/AudioCall.vue'
import VideoCall from '@/pages/VideoCall.vue'

let wrapper = null
const mounted = []

const mountPage = async (component) => {
  wrapper = mount(component)
  mounted.push(wrapper)
  await flushPromises()
  return wrapper
}

const clickHangup = async () => {
  await wrapper.find('.hangup-btn').trigger('click')
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  socketMock.resetHandlers()
  routeMock.params = { id: '9' }
  routeMock.query = {}
  callServiceMock.currentMode = 'webrtc'
  callServiceMock.startCall.mockResolvedValue({ mode: 'webrtc', callId: 66 })
  callServiceMock.cancelCall.mockResolvedValue(undefined)
  callServiceMock.endCall.mockResolvedValue(undefined)
})

afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  wrapper = null
})

for (const page of [{ name: 'AudioCall', component: AudioCall, callType: 1 }, { name: 'VideoCall', component: VideoCall, callType: 2 }]) {
  describe(`${page.name} 挂断分支（P1-7）`, () => {
    it('主叫未接通挂断走 cancelCall（发 call_cancel），不调 endCall', async () => {
      await mountPage(page.component)

      expect(callServiceMock.startCall).toHaveBeenCalledWith('9', page.callType, false, 0)

      await clickHangup()

      expect(callServiceMock.cancelCall).toHaveBeenCalledWith(66)
      expect(callServiceMock.endCall).not.toHaveBeenCalled()
    })

    it('主叫已收到 call_accept 但媒体未连上，挂断仍走 endCall（发 call_end）', async () => {
      await mountPage(page.component)

      expect(socketMock.handlers.call_accept).toHaveLength(1)
      socketMock.handlers.call_accept.forEach((cb) => cb({ fromId: '9' }))
      await flushPromises()

      await clickHangup()

      expect(callServiceMock.endCall).toHaveBeenCalledWith(0)
      expect(callServiceMock.cancelCall).not.toHaveBeenCalled()
    })

    it('已接通挂断走 endCall，保持原计费/挂断逻辑', async () => {
      await mountPage(page.component)

      // 模拟 webrtcCallService 回调回灌「已连接」
      const callbacks = webrtcMock.setCallbacks.mock.calls[webrtcMock.setCallbacks.mock.calls.length - 1][0]
      callbacks.onCallStateChange('connected')
      await flushPromises()

      await clickHangup()

      expect(callServiceMock.endCall).toHaveBeenCalledWith(0)
      expect(callServiceMock.cancelCall).not.toHaveBeenCalled()
    })

    it('被叫页（已接听但未连上）挂断走 endCall，而不是取消主叫的通话', async () => {
      routeMock.query = { incoming: '1', mode: 'webrtc' }
      await mountPage(page.component)

      await clickHangup()

      expect(callServiceMock.endCall).toHaveBeenCalledWith(0)
      expect(callServiceMock.cancelCall).not.toHaveBeenCalled()
    })
  })
}
