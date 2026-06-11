/**
 * Pinia admin store 单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAdminStore } from '../../src/store/admin'

describe('useAdminStore', () => {
  beforeEach(() => {
    // 创建新的 Pinia 实例
    setActivePinia(createPinia())
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('初始状态', () => {
    it('应返回正确的初始值', () => {
      const store = useAdminStore()
      expect(store.adminToken).toBe('')
      expect(store.adminUser).toBeNull()
      expect(store.isLoggedIn).toBe(false)
      expect(store.username).toBe('管理员')
    })
  })

  describe('setLogin', () => {
    it('remember=true 应存储到 localStorage', () => {
      const store = useAdminStore()
      store.setLogin('token123', 'refresh456', { id: 1, username: 'admin' }, true)

      expect(store.adminToken).toBe('token123')
      expect(store.adminUser).toEqual({ id: 1, username: 'admin' })
      expect(store.isLoggedIn).toBe(true)
      expect(store.username).toBe('admin')

      expect(localStorage.getItem('admin_token')).toBe('token123')
      expect(localStorage.getItem('admin_refresh_token')).toBe('refresh456')
      expect(localStorage.getItem('admin_remember')).toBe('1')
    })

    it('remember=false 应存储到 sessionStorage', () => {
      const store = useAdminStore()
      store.setLogin('token123', 'refresh456', { id: 1, username: 'admin' }, false)

      expect(sessionStorage.getItem('admin_token')).toBe('token123')
      expect(sessionStorage.getItem('admin_refresh_token')).toBe('refresh456')
      expect(localStorage.getItem('admin_remember')).toBeNull()
    })
  })

  describe('logout', () => {
    it('应清除所有状态和存储', () => {
      const store = useAdminStore()
      store.setLogin('token', 'rt', { id: 1, username: 'admin' }, true)

      store.logout()

      expect(store.adminToken).toBe('')
      expect(store.adminUser).toBeNull()
      expect(store.isLoggedIn).toBe(false)
      expect(localStorage.getItem('admin_token')).toBeNull()
      expect(localStorage.getItem('admin_refresh_token')).toBeNull()
      expect(sessionStorage.getItem('admin_token')).toBeNull()
    })
  })

  describe('init', () => {
    it('应从 localStorage 恢复登录状态', () => {
      localStorage.setItem('admin_token', 'saved-token')
      localStorage.setItem('admin_user', JSON.stringify({ id: 1, username: 'admin' }))

      const store = useAdminStore()
      store.init()

      expect(store.adminToken).toBe('saved-token')
      expect(store.adminUser).toEqual({ id: 1, username: 'admin' })
    })

    it('应从 sessionStorage 恢复（localStorage 无值时）', () => {
      sessionStorage.setItem('admin_token', 'session-token')
      sessionStorage.setItem('admin_user', JSON.stringify({ id: 2, username: 'user2' }))

      const store = useAdminStore()
      store.init()

      expect(store.adminToken).toBe('session-token')
      expect(store.adminUser).toEqual({ id: 2, username: 'user2' })
    })

    it('无存储时应保持默认值', () => {
      const store = useAdminStore()
      store.init()

      expect(store.adminToken).toBe('')
      expect(store.adminUser).toBeNull()
    })
  })

  describe('暗黑模式', () => {
    it('toggleDark 应切换并持久化', () => {
      const store = useAdminStore()
      expect(store.isDark).toBe(false)

      store.toggleDark()
      expect(store.isDark).toBe(true)
      expect(localStorage.getItem('admin_dark_mode')).toBe('1')

      store.toggleDark()
      expect(store.isDark).toBe(false)
      expect(localStorage.getItem('admin_dark_mode')).toBe('0')
    })

    it('initDarkMode 应从存储恢复', () => {
      localStorage.setItem('admin_dark_mode', '1')

      const store = useAdminStore()
      store.init()

      expect(store.isDark).toBe(true)
    })
  })
})
