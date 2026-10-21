import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { home, router } = vi.hoisted(() => ({
  home: { getRecommendCompanions: vi.fn() },
  router: { back: vi.fn(), push: vi.fn(), replace: vi.fn() }
}))

vi.mock('@/services/homeService', () => ({ default: home }))
vi.mock('@/common/route', () => ({ useRouter: () => router }))

import ChatUsers from '@/pages/ChatUsers.vue'

const payload = (list) => ({ code: 200, data: { total: list.length, list } })

describe('ChatUsers 交友列表', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    localStorage.setItem('token', 'test-token')
    home.getRecommendCompanions.mockReset()
    router.push.mockReset()
  })

  it('默认「全部」Tab 渲染用户，不再因 online 字段缺失恒空', async () => {
    home.getRecommendCompanions.mockResolvedValue(payload([
      { userId: 300001, nickname: '男陪玩', sex: 1, level: 8, city: '重庆', tags: ['王者'] },
      { userId: 300002, nickname: '女陪玩', sex: 2, level: 12, city: '成都', tags: ['和平'] }
    ]))
    const wrapper = mount(ChatUsers)
    await flushPromises()

    expect(wrapper.findAll('.user-item')).toHaveLength(2)
    expect(wrapper.text()).toContain('男陪玩')
    expect(wrapper.find('.tab-item.active').text()).toContain('全部')
    // 没有 online 字段时不再对所有人显示「离线」
    expect(wrapper.text()).not.toContain('离线')
    expect(wrapper.text()).toContain('陪玩师')
  })

  it('性别 Tab 使用后端 sex 字段过滤', async () => {
    home.getRecommendCompanions.mockResolvedValue(payload([
      { userId: 300001, nickname: '男陪玩', sex: 1, level: 8, tags: [] },
      { userId: 300002, nickname: '女陪玩', sex: 2, level: 12, tags: [] }
    ]))
    const wrapper = mount(ChatUsers)
    await flushPromises()

    const tabs = wrapper.findAll('.tab-item')
    const femaleTab = tabs.find((t) => t.text().includes('女用户'))
    await femaleTab.trigger('click')
    await flushPromises()

    const items = wrapper.findAll('.user-item')
    expect(items).toHaveLength(1)
    expect(items[0].text()).toContain('女陪玩')
  })
})
