import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { order, toast, router } = vi.hoisted(() => ({
  order: { getOrders: vi.fn(), getOrderDetail: vi.fn(), cancelOrder: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
  router: { back: vi.fn(), push: vi.fn(), replace: vi.fn() }
}))

vi.mock('@/services/orderService', () => ({ default: order }))
vi.mock('@/composables/useToast', () => ({ toast }))
vi.mock('@/common/route', () => ({
  useRouter: () => router,
  useRoute: () => ({ query: {}, params: {}, path: '/my-order', meta: {} })
}))

import MyOrder from '@/pages/MyOrder.vue'

const orderRow = (orderId, status, gameName) => ({
  orderId,
  status,
  gameName,
  num: 1,
  totalPrice: 10,
  targetNickName: '陪玩师',
  createTime: 1700000000
})

const listOf = (...rows) => ({ data: { list: rows, total: rows.length } })

describe('MyOrder 状态 Tab', () => {
  beforeEach(() => {
    order.getOrders.mockReset()
    toast.success.mockReset()
    toast.error.mockReset()
  })

  it('补齐「已取消(4)」「申诉中(5)」Tab 并按状态过滤', async () => {
    order.getOrders.mockResolvedValue(listOf(
      orderRow(1, 0, '待接单游戏'),
      orderRow(2, 4, '已取消游戏'),
      orderRow(3, 5, '申诉中游戏')
    ))
    const wrapper = mount(MyOrder)
    await flushPromises()

    const labels = wrapper.findAll('.tab-item').map(t => t.text())
    expect(labels).toContain('已取消')
    expect(labels).toContain('申诉中')

    const cancelledTab = wrapper.findAll('.tab-item').find(t => t.text() === '已取消')
    await cancelledTab.trigger('click')
    let cards = wrapper.findAll('.order-card')
    expect(cards).toHaveLength(1)
    expect(cards[0].text()).toContain('已取消游戏')

    const appealTab = wrapper.findAll('.tab-item').find(t => t.text() === '申诉中')
    await appealTab.trigger('click')
    cards = wrapper.findAll('.order-card')
    expect(cards).toHaveLength(1)
    expect(cards[0].text()).toContain('申诉中游戏')
  })

  it('切到「我接的单」后隐藏待接单 Tab 并回到全部，不出现空页', async () => {
    order.getOrders.mockResolvedValue(listOf(orderRow(1, 0, '王者荣耀')))
    const wrapper = mount(MyOrder)
    await flushPromises()

    // 先停在只对用户可见的「待接单」Tab
    const pendingTab = wrapper.findAll('.tab-item').find(t => t.text() === '待接单')
    await pendingTab.trigger('click')
    expect(wrapper.find('.tab-item.active').text()).toBe('待接单')

    await wrapper.findAll('.role-item')[1].trigger('click')
    await flushPromises()

    const labels = wrapper.findAll('.tab-item').map(t => t.text())
    expect(labels).not.toContain('待接单')
    expect(wrapper.find('.tab-item.active').text()).toBe('全部')
    expect(order.getOrders).toHaveBeenLastCalledWith({ role: 'companion' })
  })
})
