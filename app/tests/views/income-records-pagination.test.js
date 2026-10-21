import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { wallet, toast, router } = vi.hoisted(() => ({
  wallet: { getIncomeRecords: vi.fn(), getOverview: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
  router: { back: vi.fn(), push: vi.fn(), replace: vi.fn() }
}))

vi.mock('@/services/walletService', () => ({ default: wallet }))
vi.mock('@/composables/useToast', () => ({ toast }))
vi.mock('@/common/route', () => ({ useRouter: () => router }))
vi.mock('@/common/common', () => ({ isLoggedIn: () => true }))

import IncomeRecords from '@/pages/IncomeRecords.vue'

const makeRows = (count, offset = 0) => Array.from({ length: count }, (_, i) => ({
  id: offset + i,
  icon: '💰',
  title: `收入${offset + i}`,
  desc: '',
  time: '10:00',
  amount: 1,
  bgColor: ''
}))

describe('IncomeRecords 分页', () => {
  beforeEach(() => {
    wallet.getIncomeRecords.mockReset()
    wallet.getOverview.mockReset()
    toast.error.mockReset()
  })

  it('首屏只拉 page=1，点击加载更多追加 page=2 并显示没有更多', async () => {
    wallet.getOverview.mockResolvedValue({ data: { grossIncome: 1234.5, todayIncome: 100 } })
    wallet.getIncomeRecords
      .mockResolvedValueOnce({ data: { list: makeRows(20), total: 25 } })
      .mockResolvedValueOnce({ data: { list: makeRows(5, 20), total: 25 } })

    const wrapper = mount(IncomeRecords)
    await flushPromises()

    expect(wallet.getIncomeRecords).toHaveBeenNthCalledWith(1, { page: 1, pageSize: 20 })
    expect(wrapper.findAll('.record-card')).toHaveLength(20)
    // 汇总取钱包总览与后端 total，而不是当前页累加
    const summary = wrapper.findAll('.summary-value').map(el => el.text())
    expect(summary[0]).toContain('1234.50')
    expect(summary[1]).toBe('25 笔')
    expect(wrapper.find('.total').text()).toContain('100.00')

    await wrapper.find('.load-more').trigger('click')
    await flushPromises()

    expect(wallet.getIncomeRecords).toHaveBeenNthCalledWith(2, { page: 2, pageSize: 20 })
    expect(wrapper.findAll('.record-card')).toHaveLength(25)
    expect(wrapper.find('.load-more.no-more').exists()).toBe(true)

    // 已无更多数据时再次点击不会重复请求
    await wrapper.find('.load-more.no-more').trigger('click')
    expect(wallet.getIncomeRecords).toHaveBeenCalledTimes(2)
  })

  it('后端 total 等于当前页长度时不再显示加载更多；汇总失败不影响列表', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    wallet.getOverview.mockRejectedValue(new Error('overview failed'))
    wallet.getIncomeRecords.mockResolvedValue({ data: { list: makeRows(3), total: 3 } })

    const wrapper = mount(IncomeRecords)
    await flushPromises()

    expect(wrapper.findAll('.record-card')).toHaveLength(3)
    expect(wrapper.find('.load-more.no-more').exists()).toBe(true)
    expect(wrapper.find('.load-more').classes()).toContain('no-more')
    errorSpy.mockRestore()
  })
})
