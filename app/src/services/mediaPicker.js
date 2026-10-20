import { isApp } from '../common/platform'

// 扩展名 → MIME 映射：uni.chooseImage/chooseVideo 在 App 端返回的 tempFiles
// 往往只有 path/size，没有 name/type；上传前需要用扩展名补齐，否则
// uploadService 的格式校验与 COS Content-Type 都会受影响。
const MIME_BY_EXT = {
  // 图片
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  heic: 'image/heic',
  heif: 'image/heif',
  // 视频
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4v: 'video/mp4',
  webm: 'video/webm',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  '3gp': 'video/3gpp',
  // 音频
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg'
}

const FALLBACK_MIME = {
  image: 'image/jpeg',
  video: 'video/mp4',
  audio: 'audio/mpeg'
}

const basename = (value) => {
  const text = String(value || '')
  const index = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\'))
  return index >= 0 ? text.slice(index + 1) : text
}

const extname = (value) => {
  const name = basename(value)
  const index = name.lastIndexOf('.')
  return index >= 0 ? name.slice(index + 1).toLowerCase() : ''
}

// 按扩展名推断 MIME；推断不出来时回落到该类型默认值
export function detectMime(nameOrPath, fallbackType = 'image') {
  const ext = extname(nameOrPath)
  return MIME_BY_EXT[ext] || FALLBACK_MIME[fallbackType] || FALLBACK_MIME.image
}

// 把 uni.chooseImage/chooseVideo 的临时文件统一成 uploadService 可消费的对象：
// { path, name, type, size }。H5 的 File 本身已满足这些字段，页面侧无需转换。
export function normalizePickedFile(raw, fallbackType = 'image') {
  if (!raw) return null
  const path = raw.path || raw.tempFilePath || raw.tempFilePaths?.[0] || ''
  if (!path) return null
  const name = raw.name || basename(path) || 'file'
  return {
    path,
    name,
    type: raw.type || detectMime(name || path, fallbackType),
    size: Number(raw.size || raw.fileSize || 0),
    duration: Number(raw.duration || 0)
  }
}

const isCancel = (err) => String((err && (err.errMsg || err.message)) || '').toLowerCase().includes('cancel')

// App 端统一选图；H5 端页面继续使用 <input type=file>，这里返回 supported:false
export function chooseImages(count = 1) {
  if (!isApp) return Promise.resolve({ supported: false, files: [] })
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: Math.max(1, Number(count) || 1),
      sizeType: ['compressed', 'original'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const files = (res.tempFiles || []).map((f) => normalizePickedFile(f, 'image')).filter(Boolean)
        resolve({ supported: true, files })
      },
      fail: (err) => {
        if (isCancel(err)) return resolve({ supported: true, files: [] })
        reject(new Error((err && err.errMsg) || '选择图片失败'))
      }
    })
  })
}

// App 端选视频；H5 端由页面 <input type=file accept="video/*"> 处理
export function chooseVideo() {
  if (!isApp) return Promise.resolve({ supported: false, file: null })
  return new Promise((resolve, reject) => {
    uni.chooseVideo({
      sourceType: ['album', 'camera'],
      compressed: true,
      maxDuration: 60,
      success: (res) => {
        const file = normalizePickedFile({
          path: res.tempFilePath,
          size: res.size,
          duration: res.duration
        }, 'video')
        resolve({ supported: true, file })
      },
      fail: (err) => {
        if (isCancel(err)) return resolve({ supported: true, file: null })
        reject(new Error((err && err.errMsg) || '选择视频失败'))
      }
    })
  })
}

export default { chooseImages, chooseVideo, normalizePickedFile, detectMime }
