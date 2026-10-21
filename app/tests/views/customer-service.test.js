import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { home, toast, router } = vi.hoisted(() => ({
  home: { getSupport: vi.fn(), getConfig: vi.fn() },
  toast: { info: vi.fn(), show: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  router: { back: vi.fn(), push: vi.fn() }
}))

vi.mock('@/services/homeService', () => ({ default: home }))
vi.mock('@/composables/useToast', () => ({ toast }))
vi.mock('@/common/route', () => ({ useRouter: () => router }))

import CustomerService from '@/pages/CustomerService.vue'

const support = (agents) => ({ data: { configured: agents.length > 0, agents } })
const config = { data: { hotline: '400-100-2000' } }

describe('CustomerService 客服账号来自服务端配置', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    home.getSupport.mockReset()
    home.getConfig.mockReset().mockResolvedValue(config)
    toast.info.mockReset()
    router.push.mockReset()
  })

  it('渲染 /api/config/support 返回的真实客服，不再出现硬编码 1001-1005', async () => {
    home.getSupport.mockResolvedValue(support([
      { userId: 200001, nickname: '真客服甲', avatar: 'a.png' },
      { userId: 200002, nickname: '真客服乙', avatar: 'b.png' }
    ]))
    const wrapper = mount(CustomerService)
    await flushPromises()

    expect(wrapper.findAll('.agent-item')).toHaveLength(2)
    expect(wrapper.text()).toContain('真客服甲')
    expect(wrapper.text()).not.toContain('小雪')
    expect(wrapper.text()).not.toContain('1001')

    await wrapper.findAll('.agent-item')[0].trigger('click')
    expect(router.push).toHaveBeenCalledWith('/chat-room/200001')
  })

  it('客服未配置时显示空态与配置热线，不展示假名单', async () => {
    home.getSupport.mockResolvedValue(support([]))
    const wrapper = mount(CustomerService)
    await flushPromises()

    expect(wrapper.findAll('.agent-item')).toHaveLength(0)
    expect(wrapper.find('.agent-empty-text').text()).toContain('暂未配置')
    expect(wrapper.text()).toContain('400-100-2000')
  })
})
