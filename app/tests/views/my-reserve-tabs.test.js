import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { reserve, toast, router } = vi.hoisted(() => ({
  reserve: { getReserveList: vi.fn(), getSlots: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
  router: { back: vi.fn(), push: vi.fn() }
}))

vi.mock('@/services/reserveService', () => ({ default: reserve }))
vi.mock('@/composables/useToast', () => ({ toast }))
vi.mock('@/common/route', () => ({ useRouter: () => router }))
vi.mock('@/store/user-info', () => ({ useUserStore: () => ({ userId: 0 }) }))

import MyReserve from '@/pages/MyReserve.vue'

const mountOptions = { global: { stubs: { SafeImage: true, picker: true } } }

describe('MyReserve 状态 Tab', () => {
  beforeEach(() => {
    reserve.getReserveList.mockReset().mockResolvedValue({ data: { list: [] } })
    reserve.getSlots.mockReset()
    toast.success.mockReset()
    toast.error.mockReset()
  })

  it('补齐「已拒绝(2)」Tab，切换后按 status=2 查询', async () => {
    const wrapper = mount(MyReserve, mountOptions)
    await flushPromises()

    const labels = wrapper.findAll('.tab-item').map(t => t.text())
    expect(labels).toEqual(['待确认', '已确认', '已拒绝', '已完成', '已取消'])

    const rejectedTab = wrapper.findAll('.tab-item').find(t => t.text() === '已拒绝')
    await rejectedTab.trigger('click')
    await flushPromises()

    expect(reserve.getReserveList).toHaveBeenLastCalledWith(expect.objectContaining({
      status: 2,
      role: 'user',
      page: 1,
      pageSize: 50
    }))
  })

  it('切换「我收到的」视角时回到待确认 Tab，不会停在不可见状态', async () => {
    const wrapper = mount(MyReserve, mountOptions)
    await flushPromises()

    const rejectedTab = wrapper.findAll('.tab-item').find(t => t.text() === '已拒绝')
    await rejectedTab.trigger('click')
    await flushPromises()

    await wrapper.findAll('.role-btn')[1].trigger('click')
    await flushPromises()

    expect(wrapper.find('.tab-item.active').text()).toBe('待确认')
    expect(reserve.getReserveList).toHaveBeenLastCalledWith(expect.objectContaining({
      status: 0,
      role: 'companion'
    }))
  })
})
