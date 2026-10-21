import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { home, search, auth, toast, router } = vi.hoisted(() => ({
  home: { getHotSearch: vi.fn(), searchCompanions: vi.fn() },
  search: { searchUsers: vi.fn(), searchPosts: vi.fn(), searchGames: vi.fn() },
  auth: { follow: vi.fn(), unfollow: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  router: { back: vi.fn(), push: vi.fn() }
}))

vi.mock('@/services/homeService', () => ({ default: home }))
vi.mock('@/services/searchService', () => ({ default: search }))
vi.mock('@/services/authService', () => ({ default: auth }))
vi.mock('@/common/route', () => ({ useRouter: () => router }))
vi.mock('@/composables/useToast', () => ({ toast }))

import Search from '@/pages/Search.vue'

const ok = (list) => ({ code: 200, data: { list } })

const mountSearch = async () => {
  const wrapper = mount(Search)
  await flushPromises()
  return wrapper
}

const runSearch = async (wrapper, keyword) => {
  await wrapper.find('.search-input').setValue(keyword)
  await vi.advanceTimersByTime(400)
  await flushPromises()
}

describe('Search 普通用户搜索（P2-8）', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    home.getHotSearch.mockResolvedValue(ok([]))
    search.searchUsers.mockResolvedValue(ok([]))
    search.searchPosts.mockResolvedValue(ok([]))
    search.searchGames.mockResolvedValue(ok([]))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('用户分类改调 /api/search/users，不再复用陪玩师列表', async () => {
    search.searchUsers.mockResolvedValue(ok([
      { userId: 11, nickname: '小美', avatar: 'a.png', level: 5, sex: 2, fansCount: 7 },
      { userId: 12, nickname: '小美美', avatar: 'b.png', level: 3, sex: 1, fansCount: 1 }
    ]))
    const wrapper = await mountSearch()

    await runSearch(wrapper, ' 小美 ')

    expect(search.searchUsers).toHaveBeenCalledWith({ keyword: '小美', page: 1, pageSize: 20 })
    expect(home.searchCompanions).not.toHaveBeenCalled()
    expect(wrapper.findAll('.user-item')).toHaveLength(2)
    expect(wrapper.find('.user-name').text()).toBe('小美')
    expect(wrapper.find('.user-level').text()).toBe('Lv.5')

    await wrapper.findAll('.user-item')[0].trigger('click')
    expect(router.push).toHaveBeenCalledWith({ name: 'UserProfile', params: { id: 11 } })
  })

  it('用户为空时保留帖子/游戏结果（空态不误判）', async () => {
    search.searchUsers.mockResolvedValue(ok([]))
    search.searchPosts.mockResolvedValue(ok([
      { postId: 21, content: '今晚开黑', images: [], nickname: '作者', createTime: 1700000000 }
    ]))
    search.searchGames.mockResolvedValue(ok([{ gameId: 31, name: '王者荣耀', icon: 'i.png' }]))
    const wrapper = await mountSearch()

    await runSearch(wrapper, '开黑')

    expect(wrapper.findAll('.user-item')).toHaveLength(0)
    expect(wrapper.findAll('.post-item')).toHaveLength(1)
    expect(wrapper.findAll('.game-item')).toHaveLength(1)
    expect(wrapper.find('.empty').exists()).toBe(false)
  })

  it('三类均为空时展示"未找到相关结果"空态', async () => {
    const wrapper = await mountSearch()
    await runSearch(wrapper, '不存在的关键词')

    expect(wrapper.find('.empty').exists()).toBe(true)
    expect(wrapper.find('.empty').text()).toContain('未找到相关结果')
  })

  it('用户搜索失败不影响帖子/游戏展示（并行请求隔离）', async () => {
    search.searchUsers.mockRejectedValue(new Error('search users down'))
    search.searchPosts.mockResolvedValue(ok([
      { postId: 22, content: '帖子仍在', images: [], nickname: '作者', createTime: 1700000000 }
    ]))
    const wrapper = await mountSearch()

    await runSearch(wrapper, '帖子')

    expect(wrapper.findAll('.user-item')).toHaveLength(0)
    expect(wrapper.findAll('.post-item')).toHaveLength(1)
    expect(wrapper.find('.empty').exists()).toBe(false)
  })
})
