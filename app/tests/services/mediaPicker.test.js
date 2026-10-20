import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// 说明：
// - H5 分支直接使用模块默认状态（isApp=false）
// - App 分支通过 globalThis.plus + vi.resetModules() 重新加载 platform.js 后动态 import
//   （uni 条件编译在 vitest 下不生效，因此原生插件 import 的模块不在这里加载）

const setAppEnv = () => {
  globalThis.plus = { runtime: { platform: 'android' } }
}

const clearAppEnv = () => {
  delete globalThis.plus
}

describe('mediaPicker（H5 兜底）', () => {
  beforeEach(async () => {
    clearAppEnv()
    vi.resetModules()
  })

  it('H5 下 chooseImages/chooseVideo 返回 supported:false，交回页面 input[type=file]', async () => {
    const picker = await import('@/services/mediaPicker')
    await expect(picker.chooseImages(3)).resolves.toEqual({ supported: false, files: [] })
    await expect(picker.chooseVideo()).resolves.toEqual({ supported: false, file: null })
  })

  it('detectMime 按扩展名推断并支持回落', async () => {
    const picker = await import('@/services/mediaPicker')
    expect(picker.detectMime('/cache/a.PNG')).toBe('image/png')
    expect(picker.detectMime('/cache/b.mov')).toBe('video/quicktime')
    expect(picker.detectMime('/cache/c.m4a')).toBe('audio/mp4')
    expect(picker.detectMime('noext', 'video')).toBe('video/mp4')
  })

  it('normalizePickedFile 从 path 补齐 name/type', async () => {
    const picker = await import('@/services/mediaPicker')
    const file = picker.normalizePickedFile({ path: '/cache/avatar.jpg', size: 2048 }, 'image')
    expect(file).toEqual({ path: '/cache/avatar.jpg', name: 'avatar.jpg', type: 'image/jpeg', size: 2048, duration: 0 })
  })
})

describe('mediaPicker（App 端）', () => {
  beforeEach(() => {
    setAppEnv()
    vi.resetModules()
  })

  afterEach(() => {
    clearAppEnv()
  })

  it('chooseImages 归一化 uni.chooseImage 的 tempFiles', async () => {
    global.uni.chooseImage.mockImplementation((opts) => {
      opts.success({ tempFiles: [{ path: '/storage/emulated/0/a.png', size: 1024 }] })
    })
    const picker = await import('@/services/mediaPicker')
    const res = await picker.chooseImages(1)
    expect(res.supported).toBe(true)
    expect(res.files[0]).toMatchObject({ path: '/storage/emulated/0/a.png', name: 'a.png', type: 'image/png', size: 1024 })
  })

  it('chooseVideo 返回视频文件对象', async () => {
    global.uni.chooseVideo = vi.fn((opts) => {
      opts.success({ tempFilePath: '/storage/emulated/0/v.mp4', size: 9000, duration: 12 })
    })
    const picker = await import('@/services/mediaPicker')
    const res = await picker.chooseVideo()
    expect(res.supported).toBe(true)
    expect(res.file).toMatchObject({ path: '/storage/emulated/0/v.mp4', type: 'video/mp4', size: 9000, duration: 12 })
  })

  it('用户取消选择时 resolve 空结果而不是抛错', async () => {
    global.uni.chooseImage.mockImplementation((opts) => {
      opts.fail({ errMsg: 'chooseImage:fail cancel' })
    })
    const picker = await import('@/services/mediaPicker')
    await expect(picker.chooseImages(1)).resolves.toEqual({ supported: true, files: [] })
  })
})

describe('uploadService（App 上传链路）', () => {
  beforeEach(() => {
    setAppEnv()
    vi.resetModules()
    global.uni.getStorageSync.mockReturnValue('app-token')
    global.uni.uploadFile.mockReset()
    // 401 分支会调用 goLogin()，测试环境补齐这两个 API，避免异步未处理错误
    global.uni.reLaunch = vi.fn()
    global.uni.removeStorageSync = vi.fn()
  })

  afterEach(() => {
    clearAppEnv()
    global.uni.uploadFile.mockReset()
  })

  it('App 端跳过 COS 直传，直接用 uni.uploadFile 带 token 上传临时文件', async () => {
    let captured = null
    global.uni.uploadFile.mockImplementation((opts) => {
      captured = opts
      setTimeout(() => opts.success({ statusCode: 200, data: JSON.stringify({ code: 200, data: { url: 'https://cos/a.jpg' } }) }), 0)
      return { onProgressUpdate: vi.fn() }
    })
    const { uploadFile } = await import('@/services/uploadService')
    const res = await uploadFile({ path: '/storage/a.jpg', name: 'a.jpg', type: 'image/jpeg', size: 1024 }, 'image')
    expect(res.code).toBe(200)
    expect(captured.filePath).toBe('/storage/a.jpg')
    expect(captured.name).toBe('image')
    expect(captured.header.Authorization).toBe('Bearer app-token')
    expect(global.uni.request).not.toHaveBeenCalled() // 没有请求 /upload/token
  })

  it('App 端 401 清 token 并抛登录过期', async () => {
    global.uni.uploadFile.mockImplementation((opts) => {
      setTimeout(() => opts.success({ statusCode: 401, data: '{}' }), 0)
      return { onProgressUpdate: vi.fn() }
    })
    const { uploadFile } = await import('@/services/uploadService')
    await expect(uploadFile({ path: '/storage/a.jpg', name: 'a.jpg', type: 'image/jpeg', size: 1024 }, 'image'))
      .rejects.toThrow('登录已过期')
  })

  it('只有 path/size 的临时文件也能通过格式校验', async () => {
    const { validateFile } = await import('@/services/uploadService')
    expect(validateFile({ path: '/storage/a.jpg', size: 1024 }, 'image')).toBe(true)
    expect(() => validateFile({ path: '/storage/a.txt', size: 1024 }, 'image')).toThrow('格式不支持')
  })
})
