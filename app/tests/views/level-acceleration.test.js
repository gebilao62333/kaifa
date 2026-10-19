import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { level, toast, router } = vi.hoisted(() => ({
  level: { get: vi.fn(), checkIn: vi.fn() },
  toast: { show: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  router: { back: vi.fn(), push: vi.fn() }
}))

vi.mock('@/services/levelService', () => ({ default: level }))
vi.mock('@/composables/useToast', () => ({ toast }))
vi.mock('@/common/route', () => ({ useRouter: () => router, useRoute: () => ({ query: {}, params: {}, path: '/', meta: {} }) }))

import LevelAcceleration from '@/pages/LevelAcceleration.vue'

const benefits = [
  { key: 'signature', name: '解锁个性签名', level: 5, unlocked: true },
  { key: 'priority_matching', name: '解锁优先匹配', level: 30, unlocked: false },
  { key: 'skin_shop', name: '解锁装扮商城', level: 45, unlocked: false }
]

const payload = () => ({
  lv: 12,
  exp: 3000,
  nextLevelExp: 12500,
  remainExp: 9500,
  percent: 24,
  vip: true,
  vipLevel: 3,
  boost: 1.8,
  checkedInToday: false,
  expSources: { order_completed: 50, post_created: 20, daily_check_in: 10, real_name_verified: 100 },
  boostTable: { 0: 1, 1: 1.2, 2: 1.5, 3: 1.8, 4: 2 },
  benefits
})

const mountPage = async (data = payload()) => {
  level.get.mockResolvedValue({ data })
  const wrapper = mount(LevelAcceleration)
  await flushPromises()
  return wrapper
}

describe('LevelAcceleration 等级数据来自服务端', () => {
  beforeEach(() => {
    level.get.mockReset()
    level.checkIn.mockReset()
    toast.show.mockReset()
    toast.success.mockReset()
  })

  it('按服务端进度渲染等级、经验与进度条', async () => {
    const wrapper = await mountPage()

    expect(level.get).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.level-number').text()).toBe('Lv.12')
    expect(wrapper.find('.exp-value').text()).toBe('3000 / 12500')
    expect(wrapper.find('.exp-hint').text()).toContain('还差 9500 经验')
    expect(wrapper.find('.exp-progress').attributes('style')).toContain('width: 24%')
  })

  it('VIP 加速表与经验来源都取服务端数值', async () => {
    const wrapper = await mountPage()

    expect(wrapper.find('.boost-desc').text()).toContain('VIP3')
    expect(wrapper.find('.boost-desc strong').text()).toBe('1.8x')
    expect(wrapper.findAll('.boost-item')).toHaveLength(5)
    expect(wrapper.findAll('.boost-multiplier').map(n => n.text())).toEqual(['1x', '1.2x', '1.5x', '1.8x', '2x'])
    // VIP3 及以下档位点亮
    expect(wrapper.findAll('.boost-bar').filter(n => n.classes('active'))).toHaveLength(3)
    expect(wrapper.findAll('.source-item').map(n => n.text())).toEqual([
      '完成陪玩订单+50', '发布动态+20', '每日签到+10', '完成实名认证+100'
    ])
  })

  it('权益按服务端 unlocked 显示已解锁/未解锁', async () => {
    const wrapper = await mountPage()
    const statuses = wrapper.findAll('.benefit-status')

    expect(statuses.map(s => s.text())).toEqual(['已解锁', '未解锁', '未解锁'])
    expect(statuses[0].classes()).toContain('unlocked')
    expect(statuses[1].classes()).not.toContain('unlocked')
    expect(wrapper.text()).not.toContain('暂未开放')
  })

  it('签到成功后提示经验并按需回读等级', async () => {
    const wrapper = await mountPage()
    level.checkIn.mockResolvedValue({ data: { lv: 12, added: 18, leveledUp: false } })

    await wrapper.find('.check-in-btn').trigger('click')
    await flushPromises()

    expect(level.checkIn).toHaveBeenCalledTimes(1)
    expect(toast.success).toHaveBeenCalledWith('签到成功，经验 +18')
    expect(level.get).toHaveBeenCalledTimes(2)
  })

  it('升级时提示升级文案', async () => {
    const wrapper = await mountPage()
    level.checkIn.mockResolvedValue({ data: { lv: 13, added: 18, leveledUp: true } })

    await wrapper.find('.check-in-btn').trigger('click')
    await flushPromises()

    expect(toast.success).toHaveBeenCalledWith('签到成功，升到 Lv.13！')
  })

  it('当日已签到时按钮禁用且不发起签到', async () => {
    const wrapper = await mountPage({ ...payload(), checkedInToday: true })

    expect(wrapper.find('.check-in-btn').text()).toBe('今日已签到')
    expect(wrapper.find('.check-in-btn').attributes('disabled')).toBeDefined()

    await wrapper.find('.check-in-btn').trigger('click')
    await flushPromises()

    expect(level.checkIn).not.toHaveBeenCalled()
  })

  it('他端已签到时提示服务端原因并同步状态', async () => {
    const wrapper = await mountPage()
    level.checkIn.mockRejectedValue(Object.assign(new Error('今日已签到'), { status: 422 }))

    await wrapper.find('.check-in-btn').trigger('click')
    await flushPromises()

    expect(toast.show).toHaveBeenCalledWith('今日已签到')
    expect(level.get).toHaveBeenCalledTimes(2)
  })

  it('等级接口失败时提示原因而不是展示假数据', async () => {
    level.get.mockRejectedValue(new Error('等级信息加载失败'))
    const wrapper = mount(LevelAcceleration)
    await flushPromises()

    expect(toast.show).toHaveBeenCalledWith('等级信息加载失败')
    expect(wrapper.find('.level-number').text()).toBe('Lv.1')
  })
})
