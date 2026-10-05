import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { STORAGE_KEYS } from '@/common/constants'

// 审计低危项：socket 地址生产回落 localhost:3000 —— 单测里用 mock 断言传给 io() 的地址。
const { ioSpy } = vi.hoisted(() => ({
  ioSpy: vi.fn(() => ({ connected: false, on: vi.fn(), emit: vi.fn(), off: vi.fn(), disconnect: vi.fn() }))
}))
vi.mock('socket.io-client', () => ({ io: ioSpy }))

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../../src')
const readSrc = (rel) => readFileSync(resolve(SRC, rel), 'utf8')

describe('Socket 连接地址（低危：生产回退 localhost:3000）', () => {
  beforeEach(() => {
    ioSpy.mockClear()
    localStorage.setItem(STORAGE_KEYS.TOKEN, 'test-token')
  })

  it('显式空地址 → 交给 socket.io 同源连接（io 收到 undefined，而不是本机地址）', async () => {
    const { socketService } = await import('@/services/socketService')
    socketService.connect('')
    expect(ioSpy).toHaveBeenCalledTimes(1)
    expect(ioSpy.mock.calls[0][0]).toBeUndefined()
  })

  it('不传地址时取 common/config 的 socketUrl（开发环境为 localhost:3000）', async () => {
    const { socketService } = await import('@/services/socketService')
    socketService.connect()
    expect(ioSpy.mock.calls[0][0]).toBe('http://localhost:3000')
  })
})

describe('新窗口打开外部链接（低危：tabnabbing）', () => {
  it('PostDetail 预览图片的 window.open 带 noopener', () => {
    const src = readSrc('views/PostDetail.vue')
    const calls = [...src.matchAll(/window\.open\(([^)]*)\)/g)].map((m) => m[1])
    expect(calls.length).toBeGreaterThan(0)
    calls.forEach((args) => expect(args).toMatch(/noopener/))
  })

  it('App.vue 不再把 http://localhost:3000 当作生产 socket 回落', () => {
    const src = readSrc('App.vue')
    expect(src).not.toMatch(/VITE_SOCKET_URL\s*\|\|\s*['"]http:\/\/localhost:3000['"]/)
  })
})
