import { describe, it, expect } from 'vitest'
import { validateFile } from '@/services/uploadService'

const file = (name, type, size) => ({ name, type, size })

describe('uploadService.validateFile', () => {
  it('合法图片通过', () => {
    expect(validateFile(file('a.png', 'image/png', 1024), 'image')).toBe(true)
    expect(validateFile(file('a.webp', 'image/webp', 2048), 'image')).toBe(true)
  })

  it('空文件被拒绝', () => {
    expect(() => validateFile(file('a.png', 'image/png', 0), 'image')).toThrow('文件内容为空')
  })

  it('超过图片上限被拒绝', () => {
    expect(() => validateFile(file('a.png', 'image/png', 11 * 1024 * 1024), 'image')).toThrow('不能超过')
  })

  it('格式不支持被拒绝', () => {
    expect(() => validateFile(file('a.exe', 'application/x-msdownload', 100), 'image')).toThrow('格式不支持')
  })

  it('视频/音频按各自上限校验', () => {
    expect(validateFile(file('a.mp4', 'video/mp4', 50 * 1024 * 1024), 'video')).toBe(true)
    expect(() => validateFile(file('a.mp4', 'video/mp4', 101 * 1024 * 1024), 'video')).toThrow('不能超过')
    expect(validateFile(file('a.mp3', 'audio/mpeg', 5 * 1024 * 1024), 'audio')).toBe(true)
  })

  it('录音 webm 无扩展名时按 MIME 放行', () => {
    expect(validateFile({ name: 'recording', type: 'audio/webm', size: 1024 }, 'audio')).toBe(true)
  })
})
