import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// 审计 H-6：装扮目录、价格、所有权与扣款全部来自服务端，
// 组件既不再自带目录，也不再向 /api/user/pref 提交 owned 快照或 spend。
const { skins } = vi.hoisted(() => ({ skins: { list: vi.fn(), purchase: vi.fn(), use: vi.fn() } }))

vi.mock('@/services/skinService', () => ({ default: skins }))
vi.mock('vue-router', () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }))

import SkinShop from '@/views/SkinShop.vue'

const makeItem = (id, name, price, extra = {}) => ({
  id,
  type: 'frame',
  name,
  price,
  vipLevel: extra.vipLevel || 0,
  vipOnly: !!extra.vipLevel,
  owned: !!extra.owned,
  using: !!extra.using,
  assets: { style: { border: '3px solid #ddd' } }
})

const listPayload = (items, extra = {}) => ({
  data: {
    balance: 5000,
    lv: 50,
    vipLevel: 0,
    needLevel: 45,
    unlocked: true,
    types: ['frame', 'badge', 'bubble', 'theme'],
    items,
    ...extra
  }
})

const mountShop = async (payload) => {
  skins.list.mockResolvedValue(payload)
  const wrapper = mount(SkinShop)
  await flushPromises()
  return wrapper
}

const frameCards = (wrapper) => wrapper.findAll('.skin-grid')[0].findAll('.skin-card')

describe('SkinShop（装扮商城服务端化）', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
  })

  it('卡片完全由服务端目录渲染，不再自带装扮列表', async () => {
    const wrapper = await mountShop(listPayload([
      makeItem('sf1', '简约白边', 0, { owned: true }),
      makeItem('sf3', '活力橙边', 800),
      makeItem('sf8', '暗夜流光', 8888, { vipLevel: 4 })
    ]))
    const cards = frameCards(wrapper)
    // 改造前这里有 8 张硬编码卡片；现在服务端给 3 项就只渲染 3 项
    expect(cards.length).toBe(3)
    expect(cards[1].text()).toContain('800')
    expect(cards[2].text()).toContain('VIP4+')
    expect(wrapper.find('.balance-value').text()).toBe('5000')
  })

  it('已拥有的装扮点击走 /skins/use，不再提交所有权快照', async () => {
    const wrapper = await mountShop(listPayload([
      makeItem('sf2', '清新绿边', 500, { owned: true }),
      makeItem('sf3', '活力橙边', 800, { owned: true, using: true })
    ]))
    const cards = frameCards(wrapper)
    expect(cards[0].text()).toContain('已拥有')

    await skins.use.mockResolvedValue({ data: { skin: { id: 'sf2' }, charged: 0, balance: 5000 } })
    await cards[0].trigger('click')
    await flushPromises()

    expect(skins.use).toHaveBeenCalledWith('sf2')
    expect(skins.purchase).not.toHaveBeenCalled()
    expect(cards[0].classes()).toContain('using')
    expect(cards[1].classes()).not.toContain('using')
    expect(wrapper.find('.toast').text()).toContain('已切换至「清新绿边」')
  })

  it('购买只提交 skinId，扣款金额与余额都以服务端回传为准', async () => {
    const wrapper = await mountShop(listPayload([makeItem('sf8', '暗夜流光', 8888, { vipLevel: 4 })]))
    await skins.purchase.mockResolvedValue({
      data: { skin: { id: 'sf8' }, charged: 8888, alreadyOwned: false, balance: 112 }
    })

    await frameCards(wrapper)[0].trigger('click')
    await flushPromises()

    expect(skins.purchase).toHaveBeenCalledWith('sf8')
    expect(skins.purchase.mock.calls[0][1]).toBeUndefined()
    expect(wrapper.find('.balance-value').text()).toBe('112')
    expect(wrapper.find('.toast').text()).toContain('购买成功，已切换至「暗夜流光」')
    expect(frameCards(wrapper)[0].classes()).toContain('using')
  })

  it('服务端拒绝（等级不足）时提示服务端原因，卡片状态不变', async () => {
    const wrapper = await mountShop(listPayload([makeItem('sf3', '活力橙边', 800)]))
    const error = new Error('等级不足：解锁装扮商城需要 Lv.45（当前 Lv.3）')
    error.status = 422
    await skins.purchase.mockRejectedValue(error)

    await frameCards(wrapper)[0].trigger('click')
    await flushPromises()

    expect(wrapper.find('.toast').text()).toContain('Lv.45')
    expect(frameCards(wrapper)[0].classes()).not.toContain('using')
    expect(frameCards(wrapper)[0].text()).toContain('800')
  })

  it('余额不足不再由本地预判拦截，交给服务端判定', async () => {
    const wrapper = await mountShop(listPayload([makeItem('sf3', '活力橙边', 800)], { balance: 100 }))
    const error = new Error('金币不足，请先充值')
    error.status = 422
    await skins.purchase.mockRejectedValue(error)

    await frameCards(wrapper)[0].trigger('click')
    await flushPromises()

    expect(skins.purchase).toHaveBeenCalled()
    expect(wrapper.find('.toast').text()).toContain('金币不足')
  })

  it('等级未解锁时给出解锁提示', async () => {
    const wrapper = await mountShop(listPayload([makeItem('sf1', '简约白边', 0)], { unlocked: false, lv: 12 }))
    expect(wrapper.find('.toast').text()).toContain('装扮商城需 Lv.45 解锁')
  })

  it('不再把拥有关系写进 localStorage', async () => {
    const wrapper = await mountShop(listPayload([makeItem('sf2', '清新绿边', 500, { owned: true })]))
    await skins.use.mockResolvedValue({ data: { skin: { id: 'sf2' }, charged: 0, balance: 5000 } })
    await frameCards(wrapper)[0].trigger('click')
    await flushPromises()

    expect(localStorage.getItem('skinShopData')).toBeNull()
  })
})
