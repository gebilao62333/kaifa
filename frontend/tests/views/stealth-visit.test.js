import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { pref, toast } = vi.hoisted(() => ({
  pref: { get: vi.fn(), save: vi.fn() },
  toast: { show: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
}))

vi.mock('@/services/userPrefService', () => ({ default: pref }))
vi.mock('@/composables/useToast', () => ({ toast }))
vi.mock('vue-router', () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }))

import StealthVisit from '@/views/StealthVisit.vue'

describe('StealthVisit 设置持久化', () => {
  beforeEach(() => {
    pref.get.mockReset()
    pref.save.mockReset().mockResolvedValue({ data: { code: 200 } })
    toast.show.mockReset()
    localStorage.clear()
  })

  it('服务端按等级门槛拒绝时把原因提示给用户', async () => {
    pref.get.mockResolvedValue({ data: { data: {} } })
    const wrapper = mount(StealthVisit)
    await flushPromises()
    pref.save.mockRejectedValue(Object.assign(
      new Error('等级不足：解锁在线状态隐身需要 Lv.10（当前 Lv.3）'),
      { status: 422 }
    ))

    await wrapper.findAll('.switch')[0].trigger('click')
    await flushPromises()

    expect(toast.show).toHaveBeenCalledWith('等级不足：解锁在线状态隐身需要 Lv.10（当前 Lv.3）')
  })

  it('网络类失败保持静默，不打扰用户', async () => {
    pref.get.mockResolvedValue({ data: { data: {} } })
    const wrapper = mount(StealthVisit)
    await flushPromises()
    pref.save.mockRejectedValue(Object.assign(new Error('网络连接失败'), { status: 0 }))

    await wrapper.findAll('.switch')[0].trigger('click')
    await flushPromises()

    expect(toast.show).not.toHaveBeenCalled()
  })

  it('服务端回填不会触发写回（只发一次 GET）', async () => {
    localStorage.setItem('stealthSettings', JSON.stringify({ stealth: false }))
    pref.get.mockResolvedValue({
      data: { data: { stealthSettings: { stealth: true, hideOnline: true } } }
    })

    const wrapper = mount(StealthVisit)
    await flushPromises()

    expect(pref.get).toHaveBeenCalledTimes(1)
    expect(pref.save).not.toHaveBeenCalled()
    const switches = wrapper.findAll('.switch')
    expect(switches[0].classes()).toContain('active')
    expect(switches[1].classes()).toContain('active')
  })

  it('单次切换只提交一次（显式保存与 watch 不再并存）', async () => {
    pref.get.mockResolvedValue({ data: { data: {} } })
    const wrapper = mount(StealthVisit)
    await flushPromises()
    pref.save.mockClear()

    await wrapper.findAll('.switch')[0].trigger('click')
    await flushPromises()

    expect(pref.save).toHaveBeenCalledTimes(1)
    expect(pref.save).toHaveBeenCalledWith({
      stealthSettings: { stealth: true, hideOnline: false, stealthBrowse: false, muteNotify: false }
    }, 0)
  })

  it('关闭隐身时联动的子开关合并为一次提交', async () => {
    pref.get.mockResolvedValue({
      data: { data: { stealthSettings: { stealth: true, hideOnline: true, stealthBrowse: true, muteNotify: true } } }
    })
    const wrapper = mount(StealthVisit)
    await flushPromises()
    pref.save.mockClear()

    await wrapper.findAll('.switch')[0].trigger('click')
    await flushPromises()

    expect(pref.save).toHaveBeenCalledTimes(1)
    expect(pref.save.mock.calls[0][0].stealthSettings).toEqual({
      stealth: false, hideOnline: false, stealthBrowse: false, muteNotify: false
    })
  })

  it('未开启隐身时子开关不产生写入', async () => {
    pref.get.mockResolvedValue({ data: { data: {} } })
    const wrapper = mount(StealthVisit)
    await flushPromises()
    pref.save.mockClear()

    await wrapper.findAll('.switch')[1].trigger('click')
    await flushPromises()

    expect(pref.save).not.toHaveBeenCalled()
  })
})
