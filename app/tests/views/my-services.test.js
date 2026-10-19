import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { games, upload, toast, router } = vi.hoisted(() => ({
  games: { getMyServices: vi.fn(), applyCompanion: vi.fn(), toggleServiceStatus: vi.fn() },
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
