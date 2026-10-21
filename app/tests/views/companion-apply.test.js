import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { games, region, upload, perm, audio } = vi.hoisted(() => ({
  games: { getApplyStatus: vi.fn(), applyCompanion: vi.fn() },
  region: { getProvinces: vi.fn() },
  upload: { uploadFile: vi.fn() },
  perm: { requestMicrophonePermission: vi.fn(), getPermissionGuideSteps: vi.fn(() => []) },
  audio: { startRecord: vi.fn(), stopRecord: vi.fn(), cancelRecord: vi.fn() }
}))

vi.mock('@/services/gamesService', () => ({ default: games }))
vi.mock('@/services/regionService', () => ({ default: region }))
vi.mock('@/services/uploadService', () => ({ uploadFile: upload.uploadFile }))
vi.mock('@/services/audioRecorder', () => ({ default: audio }))
vi.mock('@/composables/usePermissions', () => ({ usePermissions: () => perm }))

// 子组件在别处已有独立用例；这里只验证父页面的数据收集、提交与审核状态展示
const OnlineCompanionStub = {
  name: 'OnlineCompanion',
  props: ['modelValue'],
  emits: ['update:modelValue', 'change'],
  template: '<div class="online-companion-stub"></div>'
}
const OfflineCompanionStub = {
  name: 'OfflineCompanion',
  props: ['modelValue'],
  emits: ['update:modelValue', 'change'],
  template: '<div class="offline-companion-stub"></div>'
}
const ApplyFormStub = {
  name: 'OnlineApplyForm',
  props: ['modelValue'],
  emits: ['submit', 'openPicker', 'imageUpload', 'toggleRecording', 'deleteAudio', 'toggleAudioPlay'],
  template: '<div class="apply-form-stub"></div>'
}

import CompanionApply from '@/pages/CompanionApply.vue'

const mountPage = () => mount(CompanionApply, {
  global: {
    stubs: {
      OnlineCompanion: OnlineCompanionStub,
      OfflineCompanion: OfflineCompanionStub,
      OnlineApplyForm: ApplyFormStub,
      OfflineApplyForm: ApplyFormStub
    }
  }
})

const acceptOnlineAgreements = async (wrapper) => {
  for (const id of ['online-register-agreement', 'online-privacy-agreement', 'online-minor-agreement']) {
    await wrapper.find('#' + id).setValue(true)
  }
}

const openOnlineApplyModal = async (wrapper) => {
  await acceptOnlineAgreements(wrapper)
  const companion = wrapper.findComponent(OnlineCompanionStub)
  companion.vm.$emit('update:modelValue', [9])
  companion.vm.$emit('change', [{ gameId: 5, tags: ['温柔'], category: 'online' }])
  await flushPromises()
  await wrapper.find('.confirm-btn').trigger('click')
  await flushPromises()
}

describe('CompanionApply 入驻 5 字段与审核状态（P1-9）', () => {
  beforeEach(() => {
    games.getApplyStatus.mockReset().mockResolvedValue({ data: { status: 0 } })
    games.applyCompanion.mockReset().mockResolvedValue({ data: {} })
    region.getProvinces.mockReset().mockResolvedValue({ code: 200, data: [] })
    perm.requestMicrophonePermission.mockReset()
    perm.getPermissionGuideSteps.mockReset().mockReturnValue([])
    audio.cancelRecord.mockReset()
  })

  it('按 status 展示审核中/已通过/未通过/可编辑', async () => {
    const cases = [
      { status: { status: 1, gameId: 5 }, text: '审核中' },
      { status: { status: 2, gameId: 5 }, text: '已通过' },
      { status: { status: 0, gameId: 5 }, text: '未通过' },
      { status: { status: 0 }, text: '可编辑' }
    ]
    for (const item of cases) {
      games.getApplyStatus.mockResolvedValue({ data: item.status })
      const wrapper = mountPage()
      await flushPromises()
      expect(wrapper.find('.apply-status-bar').text()).toContain(item.text)
      wrapper.unmount()
    }
  })

  it('审核状态接口失败时静默隐藏，不影响页面渲染', async () => {
    games.getApplyStatus.mockRejectedValue(new Error('status down'))
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('.apply-status-bar').exists()).toBe(false)
    expect(wrapper.findAll('.service-tabs').length).toBe(1)
  })

  it('提交申请时把表单已收集的 5 个入驻字段一并提交', async () => {
    const wrapper = mountPage()
    await flushPromises()
    await openOnlineApplyModal(wrapper)

    const form = wrapper.findComponent(ApplyFormStub)
    const model = form.props('modelValue')
    Object.assign(model, {
      skillIntro: '五年王者，节奏型打野',
      price: '30',
      city: 'shanghai',
      level: 'professional',
      zone: 'china-east',
      position: 'jungle',
      playType: 'carry'
    })
    form.vm.$emit('submit')
    await flushPromises()

    expect(games.applyCompanion).toHaveBeenCalledTimes(1)
    expect(games.applyCompanion).toHaveBeenCalledWith(expect.objectContaining({
      gameId: 5,
      serviceType: 'online',
      city: 'shanghai',
      skillLevel: 'professional',
      zone: 'china-east',
      position: 'jungle',
      playType: 'carry'
    }))
  })

  it('提交成功后刷新审核状态', async () => {
    const wrapper = mountPage()
    await flushPromises()
    await openOnlineApplyModal(wrapper)
    games.getApplyStatus.mockClear()

    const form = wrapper.findComponent(ApplyFormStub)
    Object.assign(form.props('modelValue'), { skillIntro: 'x', price: '30' })
    form.vm.$emit('submit')
    await flushPromises()

    expect(games.getApplyStatus).toHaveBeenCalledTimes(1)
  })
})
