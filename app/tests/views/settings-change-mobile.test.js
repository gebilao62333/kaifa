import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { auth, mobileChange, userPref, toast, router, userStore } = vi.hoisted(() => ({
  auth: { getUserInfo: vi.fn() },
  mobileChange: { sendCode: vi.fn(), changeMobile: vi.fn() },
  userPref: { get: vi.fn(), save: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  router: { back: vi.fn(), push: vi.fn(), replace: vi.fn() },
  userStore: { logout: vi.fn() }
}))

vi.mock('@/services/authService', () => ({ default: auth }))
vi.mock('@/services/mobileChangeService', () => ({ default: mobileChange }))
vi.mock('@/services/userPrefService', () => ({ default: userPref }))
vi.mock('@/composables/useToast', () => ({ toast }))
vi.mock('@/common/route', () => ({
  useRouter: () => router,
  useRoute: () => ({ query: {}, params: {}, path: '/', meta: {} })
}))
vi.mock('@/store/user-info', () => ({ useUserStore: () => userStore }))
vi.mock('@/composables/useNavAnimation', () => ({
  useNavAnimation: () => ({ navAnimationEnabled: { value: false }, setNavAnimation: vi.fn() })
}))
vi.mock('@/common/platform', () => ({ isApp: false, isH5: true }))

import Settings from '@/pages/Settings.vue'

let wrapper = null

const mountPage = async () => {
  wrapper = mount(Settings)
  await flushPromises()
  return wrapper
}

const openPhoneModal = async () => {
  const item = wrapper.findAll('.menu-item').find((w) => w.text().includes('绑定手机号'))
  expect(item).toBeTruthy()
  await item.trigger('click')
  await flushPromises()
  return wrapper
}

// 弹窗里只有换号表单（其它弹窗 v-if 未渲染）：依次为 新手机号 / 旧号验证码 / 新号验证码
const modalInputs = () => wrapper.findAll('.modal-input')

const fillForm = async ({ phone, oldCode, newCode }) => {
  const inputs = modalInputs()
  if (phone !== undefined) await inputs[0].setValue(phone)
  if (oldCode !== undefined) await inputs[1].setValue(oldCode)
  if (newCode !== undefined) await inputs[2].setValue(newCode)
}

describe('Settings 更换手机号（P1-8）', () => {
  beforeEach(() => {
    auth.getUserInfo.mockReset().mockResolvedValue({ data: { maskedPhone: '138****8000', mobile: '138****8000' } })
    mobileChange.sendCode.mockReset().mockResolvedValue({ data: {} })
    mobileChange.changeMobile.mockReset().mockResolvedValue({ data: { requireRelogin: true, devicesRevoked: true } })
    userPref.get.mockReset().mockResolvedValue({ data: { data: {} } })
    userPref.save.mockReset()
    toast.success.mockReset()
    toast.error.mockReset()
    toast.warning.mockReset()
    router.replace.mockReset()
    userStore.logout.mockReset().mockResolvedValue(null)
  })

  afterEach(() => {
    // 触发 onUnmounted 清理验证码倒计时，避免定时器泄漏到后续用例
    if (wrapper) wrapper.unmount()
    wrapper = null
  })

  it('弹窗展示服务端返回的当前脱敏号', async () => {
    await mountPage()
    await openPhoneModal()

    expect(wrapper.find('.modal-tip').text()).toContain('138****8000')
    expect(wrapper.text()).toContain('绑定手机号')
    expect(wrapper.text()).toContain('138****8000')
  })

  it('点「获取验证码」调一次 send-code，并回填测试模式返回的两个验证码', async () => {
    mobileChange.sendCode.mockResolvedValue({ data: { devCodes: { oldCode: '111111', newCode: '222222' } } })
    await mountPage()
    await openPhoneModal()

    await fillForm({ phone: '13900000000' })
    await wrapper.find('.code-btn').trigger('click')
    await flushPromises()

    expect(mobileChange.sendCode).toHaveBeenCalledTimes(1)
    expect(mobileChange.sendCode).toHaveBeenCalledWith({ newPhone: '13900000000' })
    const inputs = modalInputs()
    expect(inputs[1].element.value).toBe('111111')
    expect(inputs[2].element.value).toBe('222222')
    expect(toast.success).toHaveBeenCalled()
  })

  it('新手机号格式非法时不发码', async () => {
    await mountPage()
    await openPhoneModal()

    await fillForm({ phone: '123' })
    await wrapper.find('.code-btn').trigger('click')
    await flushPromises()

    expect(mobileChange.sendCode).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('请输入正确的新手机号')
  })

  it('确认时提交新号 + 两个验证码，成功后清本地登录态并跳转 /login', async () => {
    await mountPage()
    await openPhoneModal()

    await fillForm({ phone: '13900000000', oldCode: '111111', newCode: '222222' })
    await wrapper.find('.modal-btn.confirm').trigger('click')
    await flushPromises()

    expect(mobileChange.changeMobile).toHaveBeenCalledWith({
      newPhone: '13900000000',
      oldCode: '111111',
      newCode: '222222'
    })
    expect(userStore.logout).toHaveBeenCalledTimes(1)
    expect(router.replace).toHaveBeenCalledWith('/login')
    expect(toast.success).toHaveBeenCalledWith('手机号更换成功，请重新登录')
  })

  it('缺少验证码时不提交，停留在弹窗', async () => {
    await mountPage()
    await openPhoneModal()

    await fillForm({ phone: '13900000000', oldCode: '', newCode: '' })
    await wrapper.find('.modal-btn.confirm').trigger('click')
    await flushPromises()

    expect(mobileChange.changeMobile).not.toHaveBeenCalled()
    expect(userStore.logout).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('请填写原手机号和新手机号的验证码')
  })

  it('服务端拒绝时提示错误且不清登录态（例如新号已被占用）', async () => {
    mobileChange.changeMobile.mockRejectedValue(new Error('该手机号已被其他账号绑定'))
    await mountPage()
    await openPhoneModal()

    await fillForm({ phone: '13900000000', oldCode: '111111', newCode: '222222' })
    await wrapper.find('.modal-btn.confirm').trigger('click')
    await flushPromises()

    expect(toast.error).toHaveBeenCalledWith('该手机号已被其他账号绑定')
    expect(userStore.logout).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
    // 失败时弹窗不关闭，用户可修改后重试
    expect(wrapper.find('.modal').exists()).toBe(true)
  })
})
