import { vi } from 'vitest'

// Mock uni API
global.uni = {
  showToast: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showModal: vi.fn(),
  showActionSheet: vi.fn(),
  navigateTo: vi.fn(),
  navigateBack: vi.fn(),
  switchTab: vi.fn(),
  request: vi.fn(),
  uploadFile: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  clearStorageSync: vi.fn(),
  getRecorderManager: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    onStop: vi.fn(),
    onError: vi.fn()
  })),
  createInnerAudioContext: vi.fn(() => ({
    src: '',
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    destroy: vi.fn()
  })),
  previewImage: vi.fn(),
  chooseImage: vi.fn(),
  getUserProfile: vi.fn(),
  login: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({
    statusBarHeight: 20,
    platform: 'h5',
    version: '3.0.0'
  })),
  getMenuButtonBoundingClientRect: vi.fn(() => ({
    top: 10,
    bottom: 50,
    width: 80
  })),
  getApp: vi.fn(() => ({
    globalData: {
      host: 'https://api.test.com'
    }
  }))
}

// Mock getCurrentPages
global.getCurrentPages = vi.fn(() => [
  {
    options: {}
  }
])

// Mock window object
window.scrollTo = vi.fn()

// 被测代码在 401 分支会执行 window.location.href = '/login'。jsdom 未实现导航，
// 会抛出 'Not implemented: navigation' —— 并发跑测试时该报错可能晚于用例结束才被记录，
// 被 vitest 当作未处理错误，导致「全部用例通过但退出码为 1」。
// 这里把 location 替换为可写对象，既保留赋值语义，又不再触发导航报错。
try {
  const fakeLocation = {
    href: '',
    origin: 'http://localhost',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn()
  }
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: fakeLocation
  })
} catch (e) {
  // jsdom 把 location 定义为不可覆盖属性时忽略，用例本身仍是确定性的
}
