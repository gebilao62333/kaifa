/**
 * useAdmin composable 单元测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdmin } from '../../src/views/admin/composables/useAdmin'

// Mock config
vi.mock('../../../common/config', () => ({
  host: 'http://localhost:3001'
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
  // 清理 localStorage/sessionStorage
  localStorage.clear()
  sessionStorage.clear()
})

describe('useAdmin', () => {
  describe('getToken', () => {
    it('应优先读取 localStorage', () => {
      localStorage.setItem('admin_token', 'local-token')
      sessionStorage.setItem('admin_token', 'session-token')

      const { token } = useAdmin()
      expect(token.value).toBe('local-token')
    })

    it('localStorage 无值时应读取 sessionStorage', () => {
      sessionStorage.setItem('admin_token', 'session-only-token')

      const { token } = useAdmin()
      expect(token.value).toBe('session-only-token')
    })

    it('都无值时应返回空字符串', () => {
      const { token } = useAdmin()
      expect(token.value).toBe('')
    })
  })

  describe('totalPages', () => {
    it('应正确计算总页数', () => {
      const { total, pageSize, totalPages } = useAdmin()
      total.value = 100
      pageSize.value = 20
      expect(totalPages.value).toBe(5)
    })

    it('总数为0时应至少1页', () => {
      const { total, totalPages } = useAdmin()
      total.value = 0
      expect(totalPages.value).toBe(1)
    })
  })

  describe('pageNumbers', () => {
    it('少于7页时应显示全部页码', () => {
      const { total, pageSize, pageNumbers } = useAdmin()
      total.value = 60
      pageSize.value = 20
      expect(pageNumbers.value).toEqual([1, 2, 3])
    })

    it('多页时应显示省略号', () => {
      const { total, pageSize, page, pageNumbers } = useAdmin()
      total.value = 200
      pageSize.value = 20
      page.value = 5
      expect(pageNumbers.value).toContain('...')
    })
  })

  describe('handleLogout', () => {
    it('应清除所有存储并跳转', () => {
      localStorage.setItem('admin_token', 'token')
      localStorage.setItem('admin_refresh_token', 'rt')
      localStorage.setItem('admin_user', '{"name":"admin"}')
      localStorage.setItem('admin_remember', '1')
      sessionStorage.setItem('admin_token', 'token')

      const { handleLogout } = useAdmin()
      // 避免实际跳转，mock window.location
      const hrefSetter = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      })
      const originalLocation = window.location
      Object.defineProperty(window, 'location', {
        value: new Proxy(originalLocation, {
          set: (target, prop, value) => {
            if (prop === 'href') hrefSetter(value)
            return true
          }
        }),
        writable: true
      })

      handleLogout()

      expect(localStorage.getItem('admin_token')).toBeNull()
      expect(sessionStorage.getItem('admin_token')).toBeNull()
    })
  })

  describe('formatTime', () => {
    it('空值应返回 "-"', () => {
      const { formatTime } = useAdmin()
      expect(formatTime(0)).toBe('-')
      expect(formatTime(null)).toBe('-')
    })

    it('应返回中文本地化时间', () => {
      const { formatTime } = useAdmin()
      const ts = Math.floor(Date.now() / 1000)
      const result = formatTime(ts)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(5)
    })
  })

  describe('exportCSV', () => {
    it('空数据不应执行导出', () => {
      const { exportCSV } = useAdmin()
      const createObjectURL = vi.fn()
      URL.createObjectURL = createObjectURL

      exportCSV([], [], 'test')

      expect(createObjectURL).not.toHaveBeenCalled()
    })

    it('有数据时应生成 CSV 文件', () => {
      const { exportCSV } = useAdmin()
      const createObjectURL = vi.fn(() => 'blob:test')
      URL.createObjectURL = createObjectURL
      URL.revokeObjectURL = vi.fn()

      // Mock document.createElement
      const mockLink = { href: '', download: '', click: vi.fn() }
      const origCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') return mockLink
        return origCreateElement(tag)
      })

      const data = [{ id: 1, name: 'test' }]
      const columns = [
        { label: 'ID', key: 'id' },
        { label: '名称', key: 'name' }
      ]

      exportCSV(data, columns, 'test-export')

      expect(createObjectURL).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toBe('test-export.csv')
    })
  })

  describe('toast', () => {
    it('应创建并自动移除 toast 元素', () => {
      vi.useFakeTimers()
      const { toast } = useAdmin()
      const appendChildSpy = vi.spyOn(document.body, 'appendChild')

      toast('操作成功', 'success')

      expect(appendChildSpy).toHaveBeenCalled()
      const el = appendChildSpy.mock.calls[0][0]
      expect(el.textContent).toBe('操作成功')

      // 快进 3 秒后应被移除
      vi.advanceTimersByTime(3100)
      expect(document.body.contains(el)).toBe(false)

      vi.useRealTimers()
    })

    it('error 类型应使用红色背景', () => {
      const { toast } = useAdmin()
      const appendChildSpy = vi.spyOn(document.body, 'appendChild')

      toast('错误信息', 'error')

      const el = appendChildSpy.mock.calls[0][0]
      // jsdom 会将 hex 颜色转为 rgb 格式
      expect(el.style.background).toMatch(/d63031|rgb\(214,\s*48,\s*49\)/)
    })

    it('warning 类型应使用黄色背景', () => {
      const { toast } = useAdmin()
      const appendChildSpy = vi.spyOn(document.body, 'appendChild')

      toast('警告', 'warning')

      const el = appendChildSpy.mock.calls[0][0]
      expect(el.style.background).toMatch(/fdcb6e|rgb\(253,\s*203,\s*110\)/)
    })
  })

  describe('confirm', () => {
    it('应返回 Promise', () => {
      const { confirm } = useAdmin()
      const result = confirm('确定删除？')
      expect(result).toBeInstanceOf(Promise)
    })

    it('应在页面上创建确认弹窗', async () => {
      const { confirm } = useAdmin()
      const appendChildSpy = vi.spyOn(document.body, 'appendChild')

      const promise = confirm('确认操作？', '提示')

      expect(appendChildSpy).toHaveBeenCalled()
      const overlay = appendChildSpy.mock.calls[0][0]
      expect(overlay.innerHTML).toContain('确认操作？')
      expect(overlay.innerHTML).toContain('提示')

      // 点击取消按钮
      overlay.querySelector('#_confirm_cancel').click()
      const result = await promise
      expect(result).toBe(false)
    })
  })
})
