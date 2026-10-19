import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { auth, router } = vi.hoisted(() => ({
  auth: { getVisitors: vi.fn(), follow: vi.fn() },
  router: { back: vi.fn(), push: vi.fn() }
}))

vi.mock('@/services/authService', () => ({ default: auth }))
vi.mock('@/common/route', () => ({ useRouter: () => router, useRoute: () => ({ query: {}, params: {}, path: '/', meta: {} }) }))

import VisitedRecords from '@/pages/VisitedRecords.vue'

const rows = (list) => ({ data: { list, total: list.length } })

const mountOptions = { global: { directives: { 'img-fallback': {} } } }

describe('VisitedRecords 关注状态', () => {
  beforeEach(() => {
    auth.getVisitors.mockReset()
    auth.follow.mockReset().mockResolvedValue({ data: { code: 200 } })
    router.push.mockReset()
  })

  it('关注态取自服务端，不再恒为未关注', async () => {
    auth.getVisitors.mockResolvedValue(rows([
      { userId: 200002, nickname: '已关注的人', avatar: 'a', time: 1700000000, isFollowed: true },
      { userId: 200003, nickname: '陌生人', avatar: 'b', time: 1700000001 }
    ]))
    const wrapper = mount(VisitedRecords, mountOptions)
    await flushPromises()

    const tags = wrapper.findAll('.item-tag')
    expect(tags[0].text()).toBe('已关注')
    expect(tags[1].text()).toContain('关注')
  })

  it('点击关注调用服务端并立即置为已关注', async () => {
    auth.getVisitors.mockResolvedValue(rows([
      { userId: 200003, nickname: '陌生人', avatar: 'b', time: 1700000001, isFollowed: false }
    ]))
    const wrapper = mount(VisitedRecords, mountOptions)
    await flushPromises()

    await wrapper.find('.item-tag.follow').trigger('click')
    await flushPromises()

    expect(auth.follow).toHaveBeenCalledWith(200003)
    expect(wrapper.find('.item-tag').text()).toBe('已关注')
  })

  it('缺少 userId 的行不会跳到假主页', async () => {
    auth.getVisitors.mockResolvedValue(rows([{ nickname: '无 ID', avatar: 'c', time: 1700000002 }]))
    const wrapper = mount(VisitedRecords, mountOptions)
    await flushPromises()

    await wrapper.find('.visitor-item').trigger('click')
    expect(router.push).not.toHaveBeenCalled()

    auth.getVisitors.mockResolvedValue(rows([{ userId: 200009, nickname: '正常', avatar: 'd', time: 1700000002 }]))
    const wrapper2 = mount(VisitedRecords, mountOptions)
    await flushPromises()
    await wrapper2.find('.visitor-item').trigger('click')
    expect(router.push).toHaveBeenCalledWith({ name: 'UserProfile', params: { id: 200009 } })
  })
})
