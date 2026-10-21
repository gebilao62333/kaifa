import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 来电弹窗的关闭事件：call_cancel/call_reject 是原有路径，call_end 是本次新增的兜底（P1-7）。
const { callServiceMock, socketMock, routerMock } = vi.hoisted(() => {
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
  const callServiceMock = { acceptCall: vi.fn(), rejectCall: vi.fn() }
  const routerMock = { push: vi.fn() }
  return { callServiceMock, socketMock, routerMock }
})

vi.mock('@/common/route', () => ({ useRouter: () => routerMock }))
vi.mock('@/services/callService', () => ({ callService: callServiceMock }))
vi.mock('@/services/socketService', () => ({ socketService: socketMock }))

import IncomingCall from '@/components/IncomingCall.vue'

// 组件用 <Teleport to="body"> 渲染弹窗，必须在 document.body 上查
const overlay = () => document.body.querySelector('.incoming-call-overlay')

let wrapper = null

const showIncoming = async () => {
  wrapper.vm.showIncomingCall({
    fromId: 5,
    fromName: '用户5',
    callType: 1,
    callId: 77,
    useWebRTC: true
  })
  await flushPromises()
  expect(overlay()).not.toBeNull()
}

const emitFromPeer = async (event, payload = {}) => {
  expect(socketMock.handlers[event] && socketMock.handlers[event].length).toBeGreaterThan(0)
  socketMock.handlers[event].forEach((cb) => cb(payload))
  await flushPromises()
}

beforeEach(async () => {
  vi.clearAllMocks()
  socketMock.resetHandlers()
  localStorage.clear()
  document.body.innerHTML = ''
  wrapper = mount(IncomingCall)
  await flushPromises()
})

afterEach(() => {
  if (wrapper) {
    wrapper.unmount()
    wrapper = null
  }
  document.body.innerHTML = ''
})

describe('IncomingCall 关闭来电弹窗（P1-7）', () => {
  it('call_end 也会关闭弹窗（对端直接挂断的兜底）', async () => {
    await showIncoming()

    expect(socketMock.handlers.call_end).toHaveLength(1)
    await emitFromPeer('call_end')

    expect(overlay()).toBeNull()
    // 关闭后解绑，避免下一通来电被旧监听影响
    expect(socketMock.off).toHaveBeenCalledWith('call_end', expect.any(Function))
  })

  it('call_cancel 仍然关闭弹窗', async () => {
    await showIncoming()
    await emitFromPeer('call_cancel')
    expect(overlay()).toBeNull()
  })

  it('call_reject 仍然关闭弹窗', async () => {
    await showIncoming()
    await emitFromPeer('call_reject')
    expect(overlay()).toBeNull()
  })
})
