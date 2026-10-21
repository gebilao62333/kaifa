import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { wallet, toast, router } = vi.hoisted(() => ({
  wallet: { getExpenseRecords: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
  router: { back: vi.fn(), push: vi.fn(), replace: vi.fn() }
}))

vi.mock('@/services/walletService', () => ({ default: wallet }))
vi.mock('@/composables/useToast', () => ({ toast }))
vi.mock('@/common/route', () => ({ useRouter: () => router }))
vi.mock('@/common/common', () => ({ isLoggedIn: () => true }))

import ExpenseRecords from '@/pages/ExpenseRecords.vue'

const makeRows = (count, offset = 0) => Array.from({ length: count }, (_, i) => ({
  id: offset + i,
  icon: '💸',
  title: `支出${offset + i}`,
  desc: '',
  time: '09:00',
  amount: 1,
  bgColor: ''
}))

describe('ExpenseRecords 分页', () => {
  beforeEach(() => {
    wallet.getExpenseRecords.mockReset()
    toast.error.mockReset()
  })

  it('分页拉取并追加记录，支出总额/今日支出口径保持全量', async () => {
    wallet.getExpenseRecords
      .mockResolvedValueOnce({ data: { list: makeRows(20), total: 25, totalExpense: 99.9, todayExpense: 9.9 } })
      .mockResolvedValueOnce({ data: { list: makeRows(5, 20), total: 25, totalExpense: 99.9, todayExpense: 9.9 } })

    const wrapper = mount(ExpenseRecords)
    await flushPromises()

    expect(wallet.getExpenseRecords).toHaveBeenNthCalledWith(1, { page: 1, pageSize: 20 })
    const summary = wrapper.findAll('.summary-value').map(el => el.text())
    expect(summary[0]).toContain('99.90')
    expect(summary[1]).toBe('25 笔')
    expect(wrapper.find('.total').text()).toContain('9.90')

    await wrapper.find('.load-more').trigger('click')
    await flushPromises()

    expect(wallet.getExpenseRecords).toHaveBeenNthCalledWith(2, { page: 2, pageSize: 20 })
    expect(wrapper.findAll('.record-card')).toHaveLength(25)
    expect(wrapper.find('.load-more.no-more').exists()).toBe(true)
  })
})
