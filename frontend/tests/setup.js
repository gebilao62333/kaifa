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
