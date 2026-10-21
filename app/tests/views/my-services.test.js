import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { games, upload, toast, router } = vi.hoisted(() => ({
  games: { getMyServices: vi.fn(), applyCompanion: vi.fn(), toggleServiceStatus: vi.fn(), getApplyStatus: vi.fn() },
  upload: { uploadFile: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
  router: { back: vi.fn(), push: vi.fn() }
}))

vi.mock('@/services/gamesService', () => ({ default: games }))
vi.mock('@/services/uploadService', () => ({ uploadFile: upload.uploadFile }))
vi.mock('@/composables/useToast', () => ({ toast }))
vi.mock('@/composables/usePermissions', () => ({
  usePermissions: () => ({
    requestCameraPermission: vi.fn(),
    requestMicrophonePermission: vi.fn(),
    getPermissionGuideSteps: () => []
  })
}))
vi.mock('@/common/route', () => ({ useRouter: () => router, useRoute: () => ({ query: {}, params: {}, path: '/', meta: {} }) }))

import MyServices from '@/pages/MyServices.vue'

const offlineService = {
  serviceId: 7,
  gameId: 2,
  gameName: '王者荣耀',
  image: 'https://cdn/game.png',
  price: 30,
  serviceType: 'offline',
  voiceIntro: 'https://cos.example.com/v.webm',
  voiceTime: 18,
  tags: ['线下陪伴'],
  status: 2,
  orderCount: 3,
  rating: 4.8,
  incomeTotal: 90
}

const openEditModal = async () => {
  const wrapper = mount(MyServices)
  await flushPromises()
  await wrapper.findAll('.action-btn')[0].trigger('click')
  return wrapper
}

describe('MyServices 编辑沿用服务自身类型与语音时长', () => {
  beforeEach(() => {
    games.getMyServices.mockReset().mockResolvedValue({ data: { list: [offlineService] } })
    games.applyCompanion.mockReset().mockResolvedValue({ data: {} })
    games.getApplyStatus.mockReset().mockResolvedValue({ data: { status: 2, gameId: 2 } })
    upload.uploadFile.mockReset()
    toast.success.mockReset()
    toast.error.mockReset()
  })

  it('线下服务的编辑弹窗使用「币/次」单位', async () => {
    const wrapper = await openEditModal()
    const labels = wrapper.findAll('.form-label').map(l => l.text())
    expect(labels.some(t => t.includes('设置价格(币/次)'))).toBe(true)
    expect(labels.some(t => t.includes('技能等级'))).toBe(false)
  })

  it('提交时沿用服务端 serviceType，不再固定 online', async () => {
    const wrapper = await openEditModal()
    await wrapper.find('.submit-btn').trigger('click')
    await flushPromises()

    expect(games.applyCompanion).toHaveBeenCalledTimes(1)
    const payload = games.applyCompanion.mock.calls[0][0]
    expect(payload.serviceType).toBe('offline')
    expect(payload.voiceIntro).toBe('https://cos.example.com/v.webm')
    expect(payload.voiceTime).toBe(18)
  })

  it('线上服务仍提交 online 且保留原有语音介绍', async () => {
    games.getMyServices.mockResolvedValue({
      data: { list: [{ ...offlineService, serviceType: 'online' }] }
    })
    const wrapper = await openEditModal()
    await wrapper.find('.submit-btn').trigger('click')
    await flushPromises()

    const payload = games.applyCompanion.mock.calls[0][0]
    expect(payload.serviceType).toBe('online')
    expect(payload.voiceTime).toBe(18)
  })

  it('P1-9：编辑弹窗回填 5 个入驻资料字段', async () => {
    games.getMyServices.mockResolvedValue({
      data: {
        list: [{
          ...offlineService,
          serviceType: 'online',
          city: 'shanghai',
          level: 'professional',
          zone: 'china-east',
          position: 'mid',
          playType: 'carry'
        }]
      }
    })
    const wrapper = await openEditModal()
    const selects = wrapper.findAll('.form-select').map(s => s.text())
    expect(selects.some(t => t.includes('上海市'))).toBe(true)
    expect(selects.some(t => t.includes('职业'))).toBe(true)
    expect(selects.some(t => t.includes('华东大区'))).toBe(true)
    expect(selects.some(t => t.includes('中路'))).toBe(true)
    expect(selects.some(t => t.includes('技术带飞'))).toBe(true)
  })

  it('P1-9：保存时提交 5 个入驻资料字段', async () => {
    games.getMyServices.mockResolvedValue({
      data: {
        list: [{
          ...offlineService,
          serviceType: 'online',
          city: 'shanghai',
          level: 'professional',
          zone: 'china-east',
          position: 'mid',
          playType: 'carry'
        }]
      }
    })
    const wrapper = await openEditModal()
    await wrapper.find('.submit-btn').trigger('click')
    await flushPromises()

    expect(games.applyCompanion).toHaveBeenCalledWith(expect.objectContaining({
      city: 'shanghai',
      skillLevel: 'professional',
      zone: 'china-east',
      position: 'mid',
      playType: 'carry'
    }))
  })

  it('审核状态按 status 展示：1 审核中 / 2 已通过 / 0 有申请未通过 / 0 无申请可编辑', async () => {
    const cases = [
      { status: { status: 1, gameId: 2 }, text: '审核中' },
      { status: { status: 2, gameId: 2 }, text: '已通过' },
      { status: { status: 0, gameId: 2 }, text: '未通过' },
      { status: { status: 0 }, text: '可编辑' }
    ]
    for (const item of cases) {
      games.getApplyStatus.mockResolvedValue({ data: item.status })
      const wrapper = mount(MyServices)
      await flushPromises()
      expect(wrapper.find('.apply-status-bar').text()).toContain(item.text)
      wrapper.unmount()
    }
  })

  it('审核状态接口失败时静默，不显示状态条也不影响服务列表', async () => {
    games.getApplyStatus.mockRejectedValue(new Error('status down'))
    const wrapper = mount(MyServices)
    await flushPromises()

    expect(wrapper.find('.apply-status-bar').exists()).toBe(false)
    expect(wrapper.findAll('.service-card')).toHaveLength(1)
  })

  it('服务展示图优先用 profile 自身的 icon，保存时不再被游戏封面覆盖', async () => {
    games.getMyServices.mockResolvedValue({
      data: { list: [{ ...offlineService, serviceIcon: 'https://cos/me.png' }] }
    })
    const wrapper = await openEditModal()

    expect(wrapper.find('.service-icon').attributes('src')).toBe('https://cos/me.png')

    await wrapper.find('.submit-btn').trigger('click')
    await flushPromises()
    expect(games.applyCompanion.mock.calls[0][0].icon).toBe('https://cos/me.png')
  })
})
