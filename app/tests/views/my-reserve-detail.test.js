import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// P2-10：预约详情弹层消费 /api/reserve/detail，失败回退列表行
const { reserve, toast, router } = vi.hoisted(() => ({
  reserve: {
    getReserveList: vi.fn(),
    getReserveDetail: vi.fn(),
    getSlots: vi.fn(),
    confirmReserve: vi.fn(),
    rejectReserve: vi.fn(),
    cancelReserve: vi.fn(),
    completeReserve: vi.fn()
  },
  toast: { success: vi.fn(), error: vi.fn() },
  router: { back: vi.fn(), push: vi.fn() }
}))

vi.mock('@/services/reserveService', () => ({ default: reserve }))
vi.mock('@/composables/useToast', () => ({ toast }))
vi.mock('@/common/route', () => ({ useRouter: () => router }))
vi.mock('@/store/user-info', () => ({ useUserStore: () => ({ userId: 0 }) }))

import MyReserve from '@/pages/MyReserve.vue'

const mountOptions = { global: { stubs: { SafeImage: true, picker: true } } }

const listRow = {
  reserveId: 1001,
  userId: 7,
  companionId: 9,
  companionName: '列表陪玩师',
  companionAvatar: 'avatar-a.png',
  gameId: 3,
  gameName: '列表游戏',
  date: '2026-10-22',
  time: '20:00',
  status: 0,
  createTime: 1700000000
}

describe('MyReserve 详情弹层', () => {
  beforeEach(() => {
    reserve.getReserveList.mockReset().mockResolvedValue({ data: { list: [listRow] } })
    reserve.getReserveDetail.mockReset()
    reserve.getSlots.mockReset()
    reserve.cancelReserve.mockReset().mockResolvedValue({ data: true })
    reserve.confirmReserve.mockReset()
    reserve.completeReserve.mockReset()
    reserve.rejectReserve.mockReset()
    toast.success.mockReset()
    toast.error.mockReset()
    uni.showModal.mockReset()
  })

  it('点击订单先拉真实详情，弹层用详情数据覆盖列表行', async () => {
    reserve.getReserveDetail.mockResolvedValue({
      data: {
        reserveId: 1001,
        user: { userId: 7, nickname: '下单用户', avatar: 'u.png' },
        companion: { userId: 9, nickname: '详情陪玩师', avatar: 'c.png' },
        gameId: 5,
        gameName: '详情游戏',
        date: '2026-10-23',
        time: '21:00',
        status: 1,
        createTime: 1700000000,
        updateTime: 1700000500
      }
    })
    const wrapper = mount(MyReserve, mountOptions)
    await flushPromises()

    await wrapper.find('.order-card').trigger('click')
    await flushPromises()

    expect(reserve.getReserveDetail).toHaveBeenCalledWith(1001)
    const modal = wrapper.find('.detail-modal')
    expect(modal.find('.detail-name').text()).toBe('详情陪玩师')
    expect(modal.text()).toContain('已确认')
    expect(modal.text()).toContain('详情游戏')
    expect(modal.text()).toContain('2026-10-23 21:00')
  })

  it('详情接口失败时回退列表行字段，静默不弹错误', async () => {
    reserve.getReserveDetail.mockRejectedValue(new Error('预约不存在'))
    const wrapper = mount(MyReserve, mountOptions)
    await flushPromises()

    await wrapper.find('.order-card').trigger('click')
    await flushPromises()

    const modal = wrapper.find('.detail-modal')
    expect(modal.text()).toContain('列表陪玩师')
    expect(modal.text()).toContain('待确认')
    expect(modal.text()).toContain('列表游戏')
    expect(modal.text()).toContain('2026-10-22 20:00')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('详情改造不影响原有取消预约按钮逻辑', async () => {
    uni.showModal.mockImplementation(({ success }) => success && success({ confirm: true }))
    const wrapper = mount(MyReserve, mountOptions)
    await flushPromises()

    const cancelBtn = wrapper.findAll('.action-btn').find(btn => btn.text() === '取消预约')
    await cancelBtn.trigger('click')
    await flushPromises()

    expect(reserve.cancelReserve).toHaveBeenCalledWith(1001)
    expect(toast.success).toHaveBeenCalledWith('预约已取消')
  })
})
