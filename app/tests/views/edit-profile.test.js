import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { auth, toast, router, region, upload, media } = vi.hoisted(() => ({
  auth: { getUserInfo: vi.fn(), updateUserInfo: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  router: { back: vi.fn(), push: vi.fn() },
  region: { getProvinces: vi.fn(), getCities: vi.fn(), getDistricts: vi.fn() },
  upload: vi.fn(),
  media: { chooseImages: vi.fn() }
}))

vi.mock('@/services/authService', () => ({ default: auth }))
vi.mock('@/services/regionService', () => ({ default: region }))
vi.mock('@/services/uploadService', () => ({ uploadFile: upload }))
vi.mock('@/services/mediaPicker', () => ({ chooseImages: media.chooseImages }))
vi.mock('@/common/platform', () => ({ isApp: false }))
vi.mock('@/common/route', () => ({ useRouter: () => router }))
vi.mock('@/composables/useToast', () => ({ toast }))

import EditProfile from '@/pages/EditProfile.vue'

const FULL_EXTRA = {
  birthday: '1999-01-02',
  height: 172,
  profession: '工程师',
  hobbies: ['游戏', '音乐'],
  games: ['王者荣耀'],
  price: 88,
  wechat: 'wx_abc',
  email: 'a@b.com',
  bgImage: 'https://cdn.example.com/bg.png',
  tags: [1, 2, 3]
}

const userInfo = (profileExtra) => ({
  code: 200,
  data: {
    nickname: '老王',
    avatar: 'https://cdn.example.com/avatar.png',
    sex: 1,
    city: '杭州',
    dec: '这个人的签名',
    profileExtra
  }
})

const mountPage = async () => {
  // picker 是 App 分支的 uni 组件，H5 测试环境用 stub 消除 "Failed to resolve component" 噪声
  const wrapper = mount(EditProfile, { global: { stubs: { picker: true } } })
  await flushPromises()
  return wrapper
}

describe('EditProfile 扩展资料回填（P2-7）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    region.getProvinces.mockResolvedValue({ code: 200, data: [] })
    auth.updateUserInfo.mockResolvedValue({ code: 200 })
  })

  it('回填 profileExtra 的生日/身高/职业/爱好/擅长游戏/价格/微信/邮箱/背景图/标签', async () => {
    auth.getUserInfo.mockResolvedValue(userInfo(FULL_EXTRA))
    const wrapper = await mountPage()

    expect(wrapper.find('input[placeholder="请输入昵称"]').element.value).toBe('老王')
    expect(wrapper.find('input[type="date"]').element.value).toBe('1999-01-02')
    expect(wrapper.find('input[placeholder="170"]').element.value).toBe('172')
    expect(wrapper.find('input[placeholder="请输入职业"]').element.value).toBe('工程师')
    expect(wrapper.find('input[placeholder="88"]').element.value).toBe('88')
    expect(wrapper.find('input[placeholder="请输入微信号"]').element.value).toBe('wx_abc')
    expect(wrapper.find('input[type="email"]').element.value).toBe('a@b.com')

    // hobbyOptions 里「音乐」重复出现一次，渲染会命中两个节点，这里按唯一值断言
    expect([...new Set(wrapper.findAll('.hobby-tag.active').map((n) => n.text()))]).toEqual(['游戏', '音乐'])
    expect(wrapper.findAll('.game-tag.active').map((n) => n.text())).toEqual(['王者荣耀'])
    expect(wrapper.findAll('.tag-item.selected')).toHaveLength(3)
    expect(wrapper.find('.bg-preview').attributes('style')).toContain('https://cdn.example.com/bg.png')
  })

  it('保存时把扩展字段作为 profileExtra 一起提交，且保留基础字段逻辑', async () => {
    auth.getUserInfo.mockResolvedValue(userInfo(FULL_EXTRA))
    const wrapper = await mountPage()

    await wrapper.find('.save-btn').trigger('click')
    await flushPromises()

    expect(auth.updateUserInfo).toHaveBeenCalledTimes(1)
    const payload = auth.updateUserInfo.mock.calls[0][0]
    expect(payload).toMatchObject({ nickname: '老王', sex: 1, city: '杭州', dec: '这个人的签名' })
    expect(payload.profileExtra).toEqual(FULL_EXTRA)
    expect(router.back).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalled()
  })

  it('数组/数字/空值异常时安全降级，不崩溃也不把脏数据写进表单', async () => {
    auth.getUserInfo.mockResolvedValue(userInfo({
      birthday: 19990102,
      height: 'abc',
      profession: null,
      hobbies: '游戏',
      games: null,
      price: 'x',
      wechat: null,
      email: null,
      bgImage: undefined,
      tags: '1,2'
    }))
    const wrapper = await mountPage()

    expect(wrapper.find('input[type="date"]').element.value).toBe('')
    expect(wrapper.find('input[placeholder="170"]').element.value).toBe('')
    expect(wrapper.find('input[placeholder="请输入职业"]').element.value).toBe('')
    expect(wrapper.find('input[placeholder="请输入微信号"]').element.value).toBe('')
    expect(wrapper.find('input[type="email"]').element.value).toBe('')
    expect(wrapper.findAll('.hobby-tag.active')).toHaveLength(0)
    expect(wrapper.findAll('.game-tag.active')).toHaveLength(0)
    expect(wrapper.findAll('.tag-item.selected')).toHaveLength(0)
  })

  it('profileExtra 缺失时不报错，页面仍可正常打开', async () => {
    auth.getUserInfo.mockResolvedValue(userInfo(undefined))
    const wrapper = await mountPage()
    expect(wrapper.find('input[placeholder="请输入昵称"]').element.value).toBe('老王')
    expect(wrapper.find('input[type="date"]').element.value).toBe('')
  })

  it('清空身高/价格后按 null 提交，支持用户删除已填内容', async () => {
    auth.getUserInfo.mockResolvedValue(userInfo(FULL_EXTRA))
    const wrapper = await mountPage()

    await wrapper.find('input[placeholder="170"]').setValue('')
    await wrapper.find('input[placeholder="88"]').setValue('')
    await wrapper.find('.save-btn').trigger('click')
    await flushPromises()

    const payload = auth.updateUserInfo.mock.calls[0][0]
    expect(payload.profileExtra.height).toBeNull()
    expect(payload.profileExtra.price).toBeNull()
    expect(payload.profileExtra.tags).toEqual([1, 2, 3])
  })
})
