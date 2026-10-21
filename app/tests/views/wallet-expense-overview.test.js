import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// P2-10：钱包「支出总览」卡片与弹层
const { wallet, toast, router } = vi.hoisted(() => ({
  wallet: { getOverview: vi.fn(), getIncomeBreakdown: vi.fn(), getExpenseOverview: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), show: vi.fn() },
  router: { back: vi.fn(), push: vi.fn(), replace: vi.fn() }
}))

vi.mock('@/services/walletService', () => ({ default: wallet }))
vi.mock('@/common/common', () => ({ isLoggedIn: () => true }))
vi.mock('@/common/route', () => ({ useRouter: () => router }))
vi.mock('@/composables/useToast', () => ({ toast }))

import Wallet from '@/pages/Wallet.vue'

describe('Wallet 支出总览', () => {
  beforeEach(() => {
    wallet.getOverview.mockReset().mockResolvedValue({
      data: { totalAssets: 1000, grossIncome: 500, todayIncome: 20, todayExpense: 5.5, totalWithdraw: 100 }
    })
    wallet.getIncomeBreakdown.mockReset().mockResolvedValue({ data: { list: [] } })
    wallet.getExpenseOverview.mockReset()
    toast.error.mockReset()
  })

  it('渲染支出总额/今日支出，弹层按与服务端金额展示今日与往期占比', async () => {
    wallet.getExpenseOverview.mockResolvedValue({
      data: { totalExpense: 88.5, todayExpense: 5.5, currencyUnit: '金币' }
    })
    const wrapper = mount(Wallet)
    await flushPromises()

    const card = wrapper.find('.expense-overview-card')
    expect(card.exists()).toBe(true)
    expect(card.text()).toContain('88.50')
    expect(card.text()).toContain('5.50')

    await card.trigger('click')
    await flushPromises()

    const sheet = wrapper.find('.breakdown-sheet')
    expect(sheet.text()).toContain('支出总览')
    expect(sheet.text()).toContain('88.50')
    const rows = sheet.findAll('.breakdown-item')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('今日支出')
    expect(rows[1].text()).toContain('往期支出')
    // 5.5 / 88.5 ≈ 6%
    expect(rows[0].text()).toContain('6%')
  })

  it('支出总览失败不影响主数据渲染，也不弹错误提示', async () => {
    wallet.getExpenseOverview.mockRejectedValue(new Error('boom'))
    const wrapper = mount(Wallet)
    await flushPromises()

    // 主数据（总资产）仍按 getOverview 渲染
    expect(wrapper.find('.balance-num').text()).toBe('1000.00')
    expect(wrapper.find('.expense-overview-card').text()).toContain('0.00')
    expect(toast.error).not.toHaveBeenCalled()
  })
})
