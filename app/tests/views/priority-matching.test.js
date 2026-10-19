import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { pref, toast } = vi.hoisted(() => ({
  pref: { get: vi.fn(), save: vi.fn() },
  toast: { show: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
}))

vi.mock('@/services/userPrefService', () => ({ default: pref }))
vi.mock('@/composables/useToast', () => ({ toast }))
vi.mock('vue-router', () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }))

import PriorityMatching from '@/pages/PriorityMatching.vue'

describe('PriorityMatching 设置持久化', () => {
  beforeEach(() => {
    pref.get.mockReset()
    pref.save.mockReset().mockResolvedValue({ data: { code: 200 } })
    toast.show.mockReset()
    localStorage.clear()
  })

  it('优先匹配是 Lv.30 权益，被服务端拒绝时提示原因', async () => {
    pref.get.mockResolvedValue({ data: { data: {} } })
    const wrapper = mount(PriorityMatching)
    await flushPromises()
    pref.save.mockRejectedValue(Object.assign(
      new Error('等级不足：解锁优先匹配需要 Lv.30（当前 Lv.8）'),
      { status: 422 }
    ))

    await wrapper.findAll('.switch')[0].trigger('click')
    await flushPromises()

    expect(toast.show).toHaveBeenCalledWith('等级不足：解锁优先匹配需要 Lv.30（当前 Lv.8）')
  })

  it('服务端回填不会触发写回（只发一次 GET）', async () => {
    localStorage.setItem('priorityMatchingSettings', JSON.stringify({ priorityPush: false }))
    pref.get.mockResolvedValue({
      data: { data: { priorityMatchingSettings: { priorityPush: true, autoAccept: true } } }
    })

    const wrapper = mount(PriorityMatching)
    await flushPromises()

    expect(pref.get).toHaveBeenCalledTimes(1)
    expect(pref.save).not.toHaveBeenCalled()
    const switches = wrapper.findAll('.switch')
    expect(switches[0].classes()).toContain('active')
    expect(switches[2].classes()).toContain('active')
  })

  it('单次切换只提交一次（显式保存与 watch 不再并存）', async () => {
    pref.get.mockResolvedValue({ data: { data: {} } })
    const wrapper = mount(PriorityMatching)
    await flushPromises()
    pref.save.mockClear()

    await wrapper.findAll('.switch')[0].trigger('click')
    await flushPromises()

    expect(pref.save).toHaveBeenCalledTimes(1)
    expect(pref.save).toHaveBeenCalledWith({
      priorityMatchingSettings: {
        priorityPush: false, smartRecommend: true, autoAccept: false, sameCity: true
      }
    })
  })
})
