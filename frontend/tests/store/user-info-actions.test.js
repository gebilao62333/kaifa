import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/services/authService', () => ({
  default: {
    login: vi.fn(),
    loginMobile: vi.fn(),
    loginThird: vi.fn(),
    sendSms: vi.fn(),
    register: vi.fn(),
    resetPassword: vi.fn(),
    getUserInfo: vi.fn(),
    updateProfile: vi.fn(),
    follow: vi.fn(),
    unfollow: vi.fn()
  }
}))

vi.mock('@/services/socketService', () => ({
  default: { disconnect: vi.fn() }
}))

vi.mock('@/plugins/persistedState', () => ({
  clearPersistedState: vi.fn(),
  default: vi.fn()
}))

import { useUserStore } from '@/store/user-info'
import authService from '@/services/authService'
import socketService from '@/services/socketService'
import { clearPersistedState } from '@/plugins/persistedState'

const ok = (data) => ({ code: 200, data, message: 'ok' })

describe('User Store - actions', () => {
  let store

  beforeEach(() => {
    vi.clearAllMocks()
    // 错误分支会由被测代码打印 console.error，这里静音以保持测试输出可读
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    localStorage.clear()
    setActivePinia(createPinia())
    store = useUserStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ---------- 基础设置 ----------

  it('setToken 写入与清除 localStorage', () => {
    store.setToken('t1')
    expect(store.token).toBe('t1')
    expect(localStorage.getItem('token')).toBe('t1')
    store.setToken('')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('setProfile 直接赋值', () => {
    store.setProfile({ userId: 1 })
    expect(store.profile).toEqual({ userId: 1 })
  })

  it('setUserInfo 归一化多种后端字段命名', () => {
    store.setUserInfo({
      userId: 9,
      nickname: '昵称',
      lv: 3,
      vip_lv: 2,
      money: '12.5',
      score: '7',
      fans_num: 5,
      follow_num: 4,
      like_num: 3,
      sex: 1,
      city: '上海',
      dec: '签名',
      mobile: '13800000000'
    })
    expect(store.profile).toMatchObject({
      userId: 9,
      nickName: '昵称',
      level: 3,
      vipLevel: 2,
      balance: 12.5,
      score: 7,
      fansCount: 5,
      followCount: 4,
      likeCount: 3,
      gender: 'male',
      region: '上海',
      signature: '签名',
      phone: '13800000000'
    })
  })

  it('setUserInfo 对 sex=2 与缺失字段兜底', () => {
    store.setUserInfo({ sex: 2 })
    expect(store.profile.gender).toBe('female')
    store.setUserInfo({ sex: 9 })
    expect(store.profile.gender).toBe('unknown')
    store.setUserInfo({ balance: { bad: true } })
    expect(store.profile.balance).toBe(0)
  })

  it('setUserInfo 传入空值时直接返回', () => {
    store.setUserInfo(null)
    expect(store.profile).toBeNull()
  })

  it('extractToken 兼容 accessToken 与 token', () => {
    expect(store.extractToken({ accessToken: 'a' })).toBe('a')
    expect(store.extractToken({ token: 'b' })).toBe('b')
    expect(store.extractToken({})).toBe('')
  })

  // ---------- getters ----------

  it('getters 在无 profile 时返回安全默认值', () => {
    expect(store.isLogin).toBe(false)
    expect(store.isVip).toBe(false)
    expect(store.userId).toBe(0)
    expect(store.nickName).toBe('')
    expect(store.avatar).toBeTruthy()
    expect(store.level).toBe(0)
    expect(store.vip).toBe(0)
    expect(store.vipLevel).toBe(0)
    expect(store.balance).toBe(0)
    expect(store.score).toBe(0)
    expect(store.gender).toBe('unknown')
    expect(store.region).toBe('')
    expect(store.signature).toBe('')
    expect(store.phone).toBe('')
    expect(store.isHomeSearchOpen).toBe(false)
  })

  it('getters 反映 profile 数据', () => {
    store.token = 't'
    store.setUserInfo({ userId: 3, vip: 1, balance: '5', score: '6', fans_num: 2, follow_num: 1, like_num: 4 })
    store.setConfigInfo({ isHomeSearchOpen: 1 })
    expect(store.isLogin).toBe(true)
    expect(store.isVip).toBe(true)
    expect(store.balance).toBe(5)
    expect(store.score).toBe(6)
    expect(store.fansCount).toBe(2)
    expect(store.followCount).toBe(1)
    expect(store.likeCount).toBe(4)
    expect(store.isHomeSearchOpen).toBe(true)
  })

  // ---------- 登录 ----------

  it('login 成功后写入 token 与资料', async () => {
    authService.login.mockResolvedValue(ok({ token: 'tk', userId: 1, nickName: 'n' }))
    const r = await store.login({ phone: '138', password: 'p' })
    expect(r.success).toBe(true)
    expect(store.token).toBe('tk')
    expect(store.profile.userId).toBe(1)
    expect(store.loading).toBe(false)
  })

  it('login 业务失败返回消息', async () => {
    authService.login.mockResolvedValue({ code: 400, message: '密码错误' })
    const r = await store.login({ phone: '138', password: 'bad' })
    expect(r).toEqual({ success: false, message: '密码错误' })
  })

  it('login 抛出带 fieldErrors 的错误时透传 error', async () => {
    const err = new Error('校验失败')
    err.fieldErrors = { phone: '格式错误' }
    authService.login.mockRejectedValue(err)
    const r = await store.login({ phone: 'x', password: 'y' })
    expect(r.success).toBe(false)
    expect(r.error).toBe(err)
    expect(store.loading).toBe(false)
  })

  it('login 抛出普通错误的兜底消息', async () => {
    authService.login.mockRejectedValue(new Error())
    const r = await store.login({ phone: 'x', password: 'y' })
    expect(r.message).toBe('网络错误')
  })

  it('loginMobile 成功、失败、异常三态', async () => {
    authService.loginMobile.mockResolvedValue(ok({ accessToken: 'm1', userId: 2 }))
    expect((await store.loginMobile('138', '0000')).success).toBe(true)
    expect(store.token).toBe('m1')

    authService.loginMobile.mockResolvedValue({ code: 400, message: '验证码错误' })
    expect((await store.loginMobile('138', '0')).message).toBe('验证码错误')

    authService.loginMobile.mockRejectedValue(new Error('e'))
    expect((await store.loginMobile('138', '0')).message).toBe('e')
  })

  it('loginThird 成功、失败、异常三态', async () => {
    authService.loginThird.mockResolvedValue(ok({ token: 't3', userId: 3 }))
    expect((await store.loginThird('wechat', 'openid')).success).toBe(true)

    authService.loginThird.mockResolvedValue({ code: 400, message: '绑定失败' })
    expect((await store.loginThird('wechat', 'openid')).message).toBe('绑定失败')

    authService.loginThird.mockRejectedValue(new Error('net'))
    expect((await store.loginThird('wechat', 'openid')).message).toBe('net')
  })

  it('sendSms 成功与异常', async () => {
    authService.sendSms.mockResolvedValue(ok({ code: '1234' }))
    const r = await store.sendSms('138')
    expect(r.success).toBe(true)
    authService.sendSms.mockRejectedValue(new Error('sms fail'))
    expect((await store.sendSms('138')).message).toBe('sms fail')
  })

  it('register 成功与失败与异常', async () => {
    authService.register.mockResolvedValue(ok({ token: 'rt', userInfo: { userId: 4 } }))
    expect((await store.register('138', 'p', '0000')).success).toBe(true)
    expect(store.profile.userId).toBe(4)

    authService.register.mockResolvedValue({ code: 400, message: '已注册' })
    expect((await store.register('138', 'p', '0')).message).toBe('已注册')

    authService.register.mockRejectedValue(new Error('e'))
    expect((await store.register('138', 'p', '0')).message).toBe('e')
  })

  it('resetPassword 成功与异常', async () => {
    authService.resetPassword.mockResolvedValue({ code: 200, message: '已重置' })
    expect((await store.resetPassword('138', 'p', '0')).success).toBe(true)
    authService.resetPassword.mockRejectedValue(new Error('e'))
    expect((await store.resetPassword('138', 'p', '0')).message).toBe('e')
  })

  // ---------- 资料 ----------

  it('fetchUserInfo 支持 data.user 与 data 两种结构', async () => {
    authService.getUserInfo.mockResolvedValue({ code: 200, data: { user: { userId: 8 } } })
    expect((await store.fetchUserInfo()).success).toBe(true)
    expect(store.profile.userId).toBe(8)

    authService.getUserInfo.mockResolvedValue({ code: 200, data: { userId: 9 } })
    await store.fetchUserInfo('9')
    expect(store.profile.userId).toBe(9)
  })

  it('fetchUserInfo 失败与异常', async () => {
    authService.getUserInfo.mockResolvedValue({ code: 500, message: '失败' })
    expect((await store.fetchUserInfo()).success).toBe(false)
    authService.getUserInfo.mockRejectedValue(new Error('e'))
    expect((await store.fetchUserInfo()).message).toBe('e')
  })

  it('updateProfile 成功后刷新资料', async () => {
    authService.updateProfile.mockResolvedValue({ code: 200 })
    authService.getUserInfo.mockResolvedValue(ok({ userId: 10 }))
    const r = await store.updateProfile({ nickName: 'x' })
    expect(r.success).toBe(true)
    expect(store.profile.userId).toBe(10)
    expect(store.loading).toBe(false)
  })

  it('updateProfile 失败与异常', async () => {
    authService.updateProfile.mockResolvedValue({ code: 500, message: 'bad' })
    expect((await store.updateProfile({})).success).toBe(false)
    authService.updateProfile.mockRejectedValue(new Error('e'))
    expect((await store.updateProfile({})).message).toBe('e')
  })

  it('follow 成功时本地计数 +1', async () => {
    store.setProfile({ followCount: 2 })
    authService.follow.mockResolvedValue({ code: 200 })
    expect((await store.follow(1)).success).toBe(true)
    expect(store.profile.followCount).toBe(3)
  })

  it('follow 无 profile 时也返回成功', async () => {
    authService.follow.mockResolvedValue({ code: 200 })
    expect((await store.follow(1)).success).toBe(true)
  })

  it('follow 失败与异常', async () => {
    authService.follow.mockResolvedValue({ code: 500, message: 'no' })
    expect((await store.follow(1)).success).toBe(false)
    authService.follow.mockRejectedValue(new Error('e'))
    expect((await store.follow(1)).message).toBe('e')
  })

  it('unfollow 成功时计数减一且不为负', async () => {
    store.setProfile({ followCount: 1 })
    authService.unfollow.mockResolvedValue({ code: 200 })
    await store.unfollow(1)
    expect(store.profile.followCount).toBe(0)
    await store.unfollow(1)
    expect(store.profile.followCount).toBe(0)
  })

  it('unfollow 失败与异常', async () => {
    authService.unfollow.mockResolvedValue({ code: 500, message: 'no' })
    expect((await store.unfollow(1)).success).toBe(false)
    authService.unfollow.mockRejectedValue(new Error('e'))
    expect((await store.unfollow(1)).message).toBe('e')
  })

  // ---------- 本地数值操作 ----------

  it('updateBalance 在无 profile 时不报错', () => {
    store.updateBalance(10)
    expect(store.profile).toBeNull()
  })

  it('updateBalance 累加并归一化脏数据', () => {
    store.setProfile({ balance: '10' })
    store.updateBalance(5)
    expect(store.profile.balance).toBe(15)
    store.setProfile({ balance: { bad: 1 } })
    store.updateBalance(3)
    expect(store.profile.balance).toBe(3)
  })

  it('setBalance 在无 profile 时创建对象', () => {
    store.setBalance('20')
    expect(store.profile.balance).toBe(20)
    store.setBalance('abc')
    expect(store.profile.balance).toBe(0)
  })

  it('setScore 在无 profile 时创建对象', () => {
    store.setScore('8')
    expect(store.profile.score).toBe(8)
  })

  it('setConfigInfo 与 setStatusBarHeight', () => {
    store.setConfigInfo({ a: 1 })
    expect(store.configInfo).toEqual({ a: 1 })
    store.setStatusBarHeight(44)
    expect(store.ui.statusBarHeight).toBe(44)
  })

  // ---------- 登出与恢复 ----------

  it('logout 清理本地态、持久化与长连接', () => {
    store.setToken('t')
    store.setProfile({ userId: 1 })
    store.setConfigInfo({ a: 1 })
    localStorage.setItem('userInfo', '{}')

    store.logout()

    expect(store.token).toBe('')
    expect(store.profile).toBeNull()
    expect(store.configInfo).toEqual({})
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('userInfo')).toBeNull()
    expect(clearPersistedState).toHaveBeenCalled()
    expect(socketService.disconnect).toHaveBeenCalled()
  })

  it('initFromStorage 恢复有效 token', () => {
    localStorage.setItem('token', 'valid')
    store.initFromStorage()
    expect(store.token).toBe('valid')
  })

  it('initFromStorage 修正脏 balance/score', () => {
    localStorage.setItem('token', 'valid')
    store.profile = { balance: { bad: 1 }, score: 'abc' }
    store.initFromStorage()
    expect(store.profile.balance).toBe(0)
    expect(store.profile.score).toBe(0)
  })

  it('initFromStorage 对 undefined/null 字符串做清理', () => {
    localStorage.setItem('token', 'undefined')
    store.initFromStorage()
    expect(store.token).toBe('')
    expect(store.profile).toBeNull()
    expect(clearPersistedState).toHaveBeenCalled()

    localStorage.setItem('token', 'null')
    store.initFromStorage()
    expect(store.token).toBe('')
  })

  it('checkAndRefreshUserInfo 仅在缺资料时拉取', async () => {
    authService.getUserInfo.mockResolvedValue(ok({ userId: 1 }))
    await store.checkAndRefreshUserInfo()
    expect(authService.getUserInfo).not.toHaveBeenCalled()

    store.setToken('t')
    store.profile = null
    await store.checkAndRefreshUserInfo()
    expect(authService.getUserInfo).toHaveBeenCalled()
  })
})
