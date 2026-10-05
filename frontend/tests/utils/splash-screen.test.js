import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getSplashList } = vi.hoisted(() => ({ getSplashList: vi.fn() }))

vi.mock('@/services/homeService', () => ({ default: { getSplashList } }))

import { canShowSplash, markSplashShown, pickSplash } from '@/utils/splashScreen'

const at = (y, m, d, h = 10) => new Date(y, m - 1, d, h)

const splash = (frequency, id = 1) => ({ id, title: `活动${id}`, image: `https://cdn/${id}.png`, link: '', frequency })

describe('开屏弹窗频率去重', () => {
  beforeEach(() => {
    getSplashList.mockReset()
    localStorage.clear()
  })

  it('每次打开（frequency=1）不做本地去重', () => {
    const now = at(2026, 10, 4)
    markSplashShown(splash(1), now)
    expect(canShowSplash(splash(1), now)).toBe(true)
  })

  it('每天一次：当天不再展示，跨天恢复', () => {
    markSplashShown(splash(2), at(2026, 10, 4))
    expect(canShowSplash(splash(2), at(2026, 10, 4, 23))).toBe(false)
    expect(canShowSplash(splash(2), at(2026, 10, 5))).toBe(true)
  })

  it('每周一次：同一自然周不再展示，下个周一恢复', () => {
    // 2026-10-05 是周一，10-08 周四在同一周
    markSplashShown(splash(3), at(2026, 10, 5))
    expect(canShowSplash(splash(3), at(2026, 10, 8))).toBe(false)
    expect(canShowSplash(splash(3), at(2026, 10, 12))).toBe(true)
  })

  it('仅一次（frequency=4）展示过之后永久不再展示', () => {
    markSplashShown(splash(4), at(2026, 10, 4))
    expect(canShowSplash(splash(4), at(2026, 10, 4))).toBe(false)
    expect(canShowSplash(splash(4), at(2030, 1, 1))).toBe(false)
  })

  it('不同弹窗各自独立去重', () => {
    markSplashShown(splash(2, 7), at(2026, 10, 4))
    expect(canShowSplash(splash(2, 7), at(2026, 10, 4))).toBe(false)
    expect(canShowSplash(splash(2, 8), at(2026, 10, 4))).toBe(true)
  })

  it('只挑排序最靠前且未到去重周期的一条', async () => {
    getSplashList.mockResolvedValue({
      code: 200,
      data: { list: [splash(2, 1), splash(2, 2)] }
    })
    const now = at(2026, 10, 4)
    markSplashShown(splash(2, 1), now)
    const picked = await pickSplash(now)
    expect(picked.id).toBe(2)
  })

  it('已到去重周期的弹窗按顺序跳过，全部看完后返回 null', async () => {
    getSplashList.mockResolvedValue({
      code: 200,
      data: { list: [splash(4, 1), splash(4, 2)] }
    })
    const now = at(2026, 10, 4)
    expect((await pickSplash(now)).id).toBe(1)
    expect((await pickSplash(now)).id).toBe(2)
    expect(await pickSplash(now)).toBeNull()
  })

  it('接口异常或空列表返回 null，不阻断启动', async () => {
    getSplashList.mockResolvedValue({ code: 200, data: { list: [] } })
    expect(await pickSplash()).toBeNull()
    getSplashList.mockResolvedValue(null)
    expect(await pickSplash()).toBeNull()
    getSplashList.mockRejectedValue(new Error('网络异常'))
    await expect(pickSplash()).rejects.toThrow('网络异常')
  })

  it('未知频率不做去重', () => {
    markSplashShown(splash(9), at(2026, 10, 4))
    expect(canShowSplash(splash(9), at(2026, 10, 4))).toBe(true)
  })

  it('缺少弹窗对象时不展示', () => {
    expect(canShowSplash(null)).toBe(false)
    expect(canShowSplash(undefined)).toBe(false)
  })
})
