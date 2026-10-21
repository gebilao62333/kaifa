import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// P2-10：VIP 订单记录（P2-10 缺页补齐）
const { vip, toast, router, userStore } = vi.hoisted(() => ({
  vip: {
    getVipPackages: vi.fn(),
    getUserVipInfo: vi.fn(),
    createVipOrder: vi.fn(),
    completeVipOrder: vi.fn(),
    getVipOrders: vi.fn(),
    getVipOrderStatus: vi.fn()
  },
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), show: vi.fn() },
  router: { back: vi.fn(), push: vi.fn(), replace: vi.fn() },
  userStore: { isLogin: true, vipLevel: 0, balance: 9999, fetchUserInfo: vi.fn() }
}))

vi.mock('@/services/vipService', () => ({
  default: vip,
  ...vip
}))
vi.mock('@/composables/useToast', () => ({ toast }))
vi.mock('@/common/route', () => ({ useRouter: () => router }))
vi.mock('@/store/user-info', () => ({ useUserStore: () => userStore }))

import VipCenter from '@/pages/VipCenter.vue'

const vipOrder = (orderNo, status, packageName = '铂金会员', amount = 2680) => ({
  orderNo,
  packageName,
  amount,
  duration: 30,
  status,
  createTime: 1700000000,
  payTime: status === 1 ? 1700000100 : 0
})

describe('VipCenter VIP 订单记录', () => {
  beforeEach(() => {
    vip.getVipPackages.mockReset().mockResolvedValue({ data: [] })
    vip.getUserVipInfo.mockReset().mockResolvedValue({ data: { isVip: false, vipLevel: 0, expireTime: null } })
    vip.getVipOrders.mockReset()
    vip.getVipOrderStatus.mockReset()
    userStore.fetchUserInfo.mockReset().mockResolvedValue({ success: true })
    toast.success.mockReset()
    toast.error.mockReset()
  })

  it('从 VIP 页进入订单弹层，按 page/pageSize 拉取并渲染状态文案', async () => {
    vip.getVipOrders.mockResolvedValue({
      data: {
        list: [vipOrder('VIP0001', 0), vipOrder('VIP0002', 1, '黄金会员', 980)],
        total: 2,
        page: 1,
        pageSize: 10
      }
    })
    const wrapper = mount(VipCenter)
    await flushPromises()

    expect(wrapper.find('.orders-entry').exists()).toBe(true)
    await wrapper.find('.orders-entry').trigger('click')
    await flushPromises()

    expect(vip.getVipOrders).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
    const items = wrapper.findAll('.order-item')
    expect(items).toHaveLength(2)
    expect(items[0].text()).toContain('VIP0001')
    expect(items[0].text()).toContain('待支付')
    expect(items[1].text()).toContain('已支付')
  })

  it('待支付订单可主动刷新状态，成功后同步会员信息与本地资料', async () => {
    vip.getVipOrders.mockResolvedValue({
      data: { list: [vipOrder('VIP0003', 0, '钻石会员', 6680)], total: 1 }
    })
    vip.getVipOrderStatus.mockResolvedValue({
      data: { orderNo: 'VIP0003', status: 1, payTime: 1700000200, amount: 6680 }
    })
    const wrapper = mount(VipCenter)
    await flushPromises()
    await wrapper.find('.orders-entry').trigger('click')
    await flushPromises()

    const refresh = wrapper.find('.order-refresh')
    expect(refresh.exists()).toBe(true)
    await refresh.trigger('click')
    await flushPromises()

    expect(vip.getVipOrderStatus).toHaveBeenCalledWith('VIP0003')
    expect(wrapper.find('.order-item').text()).toContain('已支付')
    expect(wrapper.find('.order-refresh').exists()).toBe(false)
    expect(toast.success).toHaveBeenCalled()
    expect(userStore.fetchUserInfo).toHaveBeenCalled()
  })

  it('订单列表失败静默：弹层回落空态且不弹错误提示', async () => {
    vip.getVipOrders.mockRejectedValue(new Error('network error'))
    const wrapper = mount(VipCenter)
    await flushPromises()
    await wrapper.find('.orders-entry').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('暂无 VIP 订单')
    expect(toast.error).not.toHaveBeenCalled()
  })
})
