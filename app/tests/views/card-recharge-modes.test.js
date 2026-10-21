import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// P2-10：卡密充值新增「卡号+密码」模式，原 25 位密钥流程保持不变
const { pay, userStore, router } = vi.hoisted(() => ({
  pay: { validateCard: vi.fn(), useCard: vi.fn(), redeemCardByKey: vi.fn() },
  userStore: { fetchUserInfo: vi.fn() },
  router: { back: vi.fn(), push: vi.fn() }
}))

vi.mock('@/services/payService', () => ({ default: pay }))
vi.mock('@/store/user-info', () => ({ useUserStore: () => userStore }))
vi.mock('@/common/route', () => ({ useRouter: () => router }))

import CardRecharge from '@/pages/CardRecharge.vue'

const switchToCardMode = async (wrapper) => {
  await wrapper.findAll('.mode-item')[1].trigger('click')
  await flushPromises()
}

const fillCard = async (wrapper, cardNo, password) => {
  const inputs = wrapper.findAll('.credential-input')
  await inputs[0].setValue(cardNo)
  await inputs[1].setValue(password)
  await flushPromises()
  return inputs
}

describe('CardRecharge 双模式', () => {
  beforeEach(() => {
    pay.validateCard.mockReset()
    pay.useCard.mockReset()
    pay.redeemCardByKey.mockReset()
    userStore.fetchUserInfo.mockReset().mockResolvedValue({ success: true })
  })

  it('默认仍是 25 位密钥模式，原一键充值流程不变', async () => {
    pay.redeemCardByKey.mockResolvedValue(500)
    const wrapper = mount(CardRecharge)
    expect(wrapper.find('.mode-item.active').text()).toBe('25位密钥')

    const input = wrapper.find('.key-input')
    input.element.value = '1234567890123456789012345'
    await input.trigger('input')
    await flushPromises()

    await wrapper.find('.submit-btn').trigger('click')
    await flushPromises()

    expect(pay.redeemCardByKey).toHaveBeenCalledWith('1234567890123456789012345')
    expect(wrapper.find('.result-content').text()).toContain('500')
    expect(pay.validateCard).not.toHaveBeenCalled()
  })

  it('卡号+密码模式：先校验再核销，成功后刷新余额并按服务端金额提示', async () => {
    pay.validateCard.mockResolvedValue({ code: 200, data: { cardId: 1, coinAmount: 1000 } })
    pay.useCard.mockResolvedValue({ code: 200, data: { amount: 1000 } })

    const wrapper = mount(CardRecharge)
    await switchToCardMode(wrapper)
    expect(wrapper.find('.mode-item.active').text()).toBe('卡号+密码')

    const inputs = await fillCard(wrapper, 'DKABCDEFGHJKLMN', 'PWD123456789')
    await wrapper.find('.submit-btn').trigger('click')
    await flushPromises()

    expect(pay.validateCard).toHaveBeenCalledWith('DKABCDEFGHJKLMN', 'PWD123456789')
    expect(pay.useCard).toHaveBeenCalledWith('DKABCDEFGHJKLMN', 'PWD123456789')
    expect(wrapper.find('.result-content').text()).toContain('1000')
    expect(userStore.fetchUserInfo).toHaveBeenCalled()
    expect(inputs[0].element.value).toBe('')
    expect(pay.redeemCardByKey).not.toHaveBeenCalled()
  })

  it('卡号+密码失败时展示服务端 message，不刷新余额也不核销', async () => {
    pay.validateCard.mockRejectedValue(new Error('卡号或密码错误'))

    const wrapper = mount(CardRecharge)
    await switchToCardMode(wrapper)
    await fillCard(wrapper, 'DKBADBADBADBADB', 'WRONGPWD')
    await wrapper.find('.submit-btn').trigger('click')
    await flushPromises()

    expect(wrapper.find('.result-content').text()).toContain('卡号或密码错误')
    expect(pay.useCard).not.toHaveBeenCalled()
    expect(userStore.fetchUserInfo).not.toHaveBeenCalled()
  })
})
