import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/store/user-info'

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with empty user info', () => {
    const userStore = useUserStore()
    
    expect(userStore.token).toBe('')
    expect(userStore.userId).toBe(0)
    expect(userStore.nickName).toBe('')
    expect(userStore.avatar).toBe('')
  })

  it('should set token correctly', () => {
    const userStore = useUserStore()
    const testToken = 'test_token_123'
    
    userStore.setToken(testToken)
    
    expect(userStore.token).toBe(testToken)
  })

  it('should set user info correctly', () => {
    const userStore = useUserStore()
    const userInfo = {
      userId: 1,
      nickName: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      level: 5,
      vip: 1,
      vipLevel: 2,
      balance: 1000,
      score: 500,
      fansCount: 100,
      followCount: 50,
      likeCount: 200
    }
    
    userStore.setUserInfo(userInfo)
    
    expect(userStore.userId).toBe(1)
    expect(userStore.nickName).toBe('Test User')
    expect(userStore.avatar).toBe('https://example.com/avatar.jpg')
    expect(userStore.level).toBe(5)
    expect(userStore.vip).toBe(1)
    expect(userStore.vipLevel).toBe(2)
    expect(userStore.balance).toBe(1000)
    expect(userStore.score).toBe(500)
    expect(userStore.fansCount).toBe(100)
    expect(userStore.followCount).toBe(50)
    expect(userStore.likeCount).toBe(200)
  })

  it('should handle null userInfo gracefully', () => {
    const userStore = useUserStore()
    
    userStore.setUserInfo(null)
    
    expect(userStore.userId).toBe(0)
    expect(userStore.nickName).toBe('')
  })

  it('should calculate isLogin correctly', () => {
    const userStore = useUserStore()
    
    expect(userStore.isLogin).toBe(false)
    
    userStore.setToken('test_token')
    expect(userStore.isLogin).toBe(true)
  })

  it('should calculate isVip correctly', () => {
    const userStore = useUserStore()
    
    expect(userStore.isVip).toBe(false)
    
    userStore.setUserInfo({ vip: 1 })
    expect(userStore.isVip).toBe(true)
  })

  it('should logout and clear data', () => {
    const userStore = useUserStore()
    
    userStore.setToken('test_token')
    userStore.setUserInfo({
      userId: 1,
      nickName: 'Test',
      avatar: 'test.jpg'
    })
    
    userStore.logout()
    
    expect(userStore.token).toBe('')
    expect(userStore.userId).toBe(0)
    expect(userStore.nickName).toBe('')
  })

  it('should set balance correctly', () => {
    const userStore = useUserStore()
    
    userStore.setBalance(5000)
    
    expect(userStore.balance).toBe(5000)
  })

  it('should set score correctly', () => {
    const userStore = useUserStore()
    
    userStore.setScore(1000)
    
    expect(userStore.score).toBe(1000)
  })

  it('should set config info correctly', () => {
    const userStore = useUserStore()
    const configInfo = {
      isHomeSearchOpen: 1,
      otherSetting: 'value'
    }
    
    userStore.setConfigInfo(configInfo)
    
    expect(userStore.configInfo).toEqual(configInfo)
    expect(userStore.isHomeSearchOpen).toBe(true)
  })
})
