import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { demand, toast, router } = vi.hoisted(() => ({
  demand: { getDemandList: vi.fn(), getDemandDetail: vi.fn(), cancelDemand: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
  router: { back: vi.fn(), push: vi.fn(), replace: vi.fn() }
}))

vi.mock('@/services/demandService', () => ({ default: demand, demandService: demand }))
vi.mock('@/composables/useToast', () => ({ toast }))
vi.mock('@/common/route', () => ({
  useRouter: () => router,
  useRoute: () => ({ query: {}, params: {}, path: '/my-demand', meta: {} })
}))

import MyDemand from '@/pages/MyDemand.vue'
import { ROUTE_BY_NAME } from '@/common/routes'

const activeDemand = {
  demandId: 11,
  serviceType: 'online',
  game: '王者荣耀',
  date: '2026-10-22',
  startTime: '20:00:00',
  endTime: '22:00:00',
  duration: 2,
  budget: '60.00',
  remark: '带飞上分',
  status: 'active',
  createTime: 1700000000
}

const cancelledDemand = {
  ...activeDemand,
  demandId: 12,
  game: '英雄联盟',
  status: 'cancelled'
}

const pageResult = (list, total = list.length, totalPages = 1) => ({
  data: { list, pagination: { page: 1, pageSize: 10, total, totalPages } }
})

describe('MyDemand 我的需求页', () => {
  beforeEach(() => {
    demand.getDemandList.mockReset()
    demand.getDemandDetail.mockReset()
    demand.cancelDemand.mockReset()
    toast.success.mockReset()
    toast.error.mockReset()
    router.push.mockReset()
    router.back.mockReset()
    uni.showModal.mockReset()
  })

  it('路由已注册，列表按用户分页拉取并展示需求字段', async () => {
    expect(ROUTE_BY_NAME.MyDemand).toMatchObject({
      path: '/my-demand',
      view: 'MyDemand',
      page: '/pages/MyDemand',
      requiresAuth: true
    })

    demand.getDemandList.mockResolvedValue(pageResult([activeDemand]))
    const wrapper = mount(MyDemand)
    await flushPromises()

    expect(demand.getDemandList).toHaveBeenCalledWith(1, 10)
    expect(wrapper.findAll('.demand-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('王者荣耀')
    expect(wrapper.text()).toContain('预算 60.00 金币')
    expect(wrapper.text()).toContain('进行中')
  })

  it('状态 Tab 在已加载数据上过滤：已取消只显示 cancelled', async () => {
    demand.getDemandList.mockResolvedValue(pageResult([activeDemand, cancelledDemand], 2))
    const wrapper = mount(MyDemand)
    await flushPromises()

    expect(wrapper.findAll('.demand-card')).toHaveLength(2)
    const cancelledTab = wrapper.findAll('.tab-item').find(t => t.text() === '已取消')
    await cancelledTab.trigger('click')

    const cards = wrapper.findAll('.demand-card')
    expect(cards).toHaveLength(1)
    expect(cards[0].text()).toContain('英雄联盟')
  })

  it('点卡片加载详情并可在详情弹层取消需求', async () => {
    demand.getDemandList.mockResolvedValue(pageResult([activeDemand]))
    demand.getDemandDetail.mockResolvedValue({ data: { ...activeDemand, offlineLocation: '' } })
    demand.cancelDemand.mockResolvedValue({ data: {} })
    uni.showModal.mockImplementationOnce(({ success }) => success({ confirm: true }))

    const wrapper = mount(MyDemand)
    await flushPromises()

    await wrapper.find('.demand-card').trigger('click')
    await flushPromises()

    expect(demand.getDemandDetail).toHaveBeenCalledWith(11)
    expect(wrapper.find('.detail-modal').exists()).toBe(true)
    expect(wrapper.find('.detail-modal').text()).toContain('需求详情')
    expect(wrapper.find('.detail-modal').text()).toContain('60.00')

    await wrapper.find('.detail-modal .btn-submit').trigger('click')
    await flushPromises()

    expect(uni.showModal).toHaveBeenCalledTimes(1)
    expect(demand.cancelDemand).toHaveBeenCalledWith(11)
    expect(toast.success).toHaveBeenCalledWith('需求已取消')
    // 取消后静默刷新列表
    expect(demand.getDemandList).toHaveBeenCalledTimes(2)
    expect(wrapper.find('.detail-modal').exists()).toBe(false)
  })

  it('首屏失败展示失败提示，空列表展示空态', async () => {
    demand.getDemandList.mockRejectedValueOnce(new Error('网络错误'))
    const failed = mount(MyDemand)
    await flushPromises()
    expect(failed.find('.load-failed').exists()).toBe(true)
    expect(toast.error).toHaveBeenCalled()

    demand.getDemandList.mockResolvedValue(pageResult([]))
    const empty = mount(MyDemand)
    await flushPromises()
    expect(empty.find('.empty-state').exists()).toBe(true)
    expect(empty.text()).toContain('暂无需求')
  })
})
