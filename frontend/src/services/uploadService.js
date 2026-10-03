import { api, uploadUrl } from '../common/config'
import { validateParams } from '../common/common'
import { STORAGE_KEYS } from '../common/constants'

const DEFAULT_TIMEOUT = 60000

const getExt = (file) => {
  const name = file.name || ''
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.substring(idx).toLowerCase() : ''
}

// 客户端上传校验规则：与后端 multer/业务限制保持一致，提前拦截明显不合法的文件，
// 避免浪费用户流量与带宽。type 为 image/audio/video（audio 含录音 blob）。
const MB = 1024 * 1024
const FILE_RULES = {
  image: {
    label: '图片',
    maxSize: 10 * MB,
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
    mimePrefix: 'image/'
  },
  video: {
    label: '视频',
    maxSize: 100 * MB,
    extensions: ['.mp4', '.mov', '.m4v', '.webm', '.avi', '.mkv'],
    mimePrefix: 'video/'
  },
  audio: {
    label: '音频',
    maxSize: 10 * MB,
    extensions: ['.mp3', '.wav', '.aac', '.m4a', '.ogg', '.webm'],
    mimePrefix: 'audio/'
  }
}

export const validateFile = (file, type = 'image') => {
  const rule = FILE_RULES[type] || FILE_RULES.image

  if (!file || typeof file.size !== 'number') {
    throw new Error('文件无效，请重新选择')
  }
  if (file.size === 0) {
    throw new Error('文件内容为空，请重新选择')
  }
  if (file.size > rule.maxSize) {
    const current = (file.size / MB).toFixed(1)
    throw new Error(`${rule.label}大小不能超过 ${Math.round(rule.maxSize / MB)}MB，当前 ${current}MB`)
  }

  // 录音场景（MediaRecorder 生成的 webm）可能没有扩展名，扩展名与 MIME 满足其一即可
  const ext = getExt(file)
  const mime = (file.type || '').toLowerCase()
  const extOk = rule.extensions.includes(ext)
  const mimeOk = mime.startsWith(rule.mimePrefix)
  if (!extOk && !mimeOk) {
    throw new Error(`${rule.label}格式不支持，仅支持 ${rule.extensions.join(' / ')}`)
  }
  return true
}

const getToken = async (type, ext) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${api}/upload/token?type=${encodeURIComponent(type)}&ext=${encodeURIComponent(ext)}`, {
    method: 'GET',
    headers
  })

  if (res.status === 401) {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    window.location.href = '/login'
    throw new Error('登录已过期，请重新登录')
  }

  const data = await res.json()
  if (data.code !== 200 || !data.data) {
    throw new Error(data.message || '获取上传凭证失败')
  }
  return data.data
}

// 使用预签名 URL 直传 COS（绕过后端中转，节省服务器带宽）
const directUploadToCos = (uploadInfo, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.timeout = DEFAULT_TIMEOUT

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(uploadInfo.accessUrl)
      } else {
        reject(new Error(`直传COS失败 (${xhr.status})`))
      }
    }

    xhr.onerror = () => reject(new Error('网络连接失败'))
    xhr.ontimeout = () => reject(new Error('上传超时，请检查网络'))

    xhr.open('PUT', uploadInfo.url)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.send(file)
  })
}

// 直传完成后把访问 URL 回传给后端登记（只存 URL 索引）
const registerUpload = async (url, type) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${api}/upload/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url, type })
  })
  if (!res.ok) {
    const err = await res.text().catch(() => `状态码 ${res.status}`)
    throw new Error(`上传登记失败: ${err}`)
  }
}

// 兜底：仍走原后端中转接口（COS 未配置或直传失败时）
const BACKEND_FIELD_MAP = {
  image: 'image',
  audio: 'audio',
  video: 'video'
}

const uploadViaBackend = (file, type, onProgress) => {
  // 后端 multer 按 image/audio/video 区分字段名，字段名必须与路由一致
  const fieldName = BACKEND_FIELD_MAP[type] || 'image'
  const formData = new FormData()
  formData.append(fieldName, file)
  if (type) formData.append('type', type)

  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.timeout = DEFAULT_TIMEOUT

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const result = JSON.parse(xhr.responseText)
          if (result.code === 200) {
            resolve(result)
          } else {
            reject(new Error(result.message || '上传失败'))
          }
        } catch (e) {
          reject(new Error('解析响应失败'))
        }
      } else if (xhr.status === 401) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        window.location.href = '/login'
        reject(new Error('登录已过期，请重新登录'))
      } else {
        reject(new Error(`上传失败 (${xhr.status})`))
      }
    }

    xhr.onerror = () => reject(new Error('网络连接失败'))
    xhr.ontimeout = () => reject(new Error('上传超时，请检查网络'))

    // 后端仅提供 image/audio/video 三个中转端点，其余类型统一按 image 处理
    const uploadEndpoint = type === 'audio' ? '/api/upload/audio' :
                           type === 'video' ? '/api/upload/video' : '/api/upload/image'

    xhr.open('POST', uploadEndpoint)
    // 强制 UTF-8 解码响应，防止后端返回缺少 charset 导致中文乱码
    xhr.overrideMimeType('application/json; charset=utf-8')
    Object.keys(headers).forEach(key => xhr.setRequestHeader(key, headers[key]))
    xhr.send(formData)
  })
}

export const uploadFile = async (file, type = 'image', onProgress = null) => {
  validateParams({ file }, {
    file: { required: true, label: '文件', type: 'object' }
  })

  // 上传前做大小与类型校验，不符合规则时抛出明确错误
  validateFile(file, type)

  // 优先前端直传 COS，失败时回退后端中转
  try {
    const uploadInfo = await getToken(type, getExt(file))
    const accessUrl = await directUploadToCos(uploadInfo, file, onProgress)
    await registerUpload(accessUrl, type)
    return {
      code: 200,
      data: { url: accessUrl, key: uploadInfo.key, filename: uploadInfo.filename },
      message: '上传成功'
    }
  } catch (err) {
    console.warn('[上传] 直传COS失败，回退后端中转:', err.message)
    return await uploadViaBackend(file, type, onProgress)
  }
}

export const uploadImage = (file, onProgress) => {
  return uploadFile(file, 'image', onProgress)
}

export const uploadAudio = (file, onProgress) => {
  return uploadFile(file, 'audio', onProgress)
}

export const uploadVideo = (file, onProgress) => {
  return uploadFile(file, 'video', onProgress)
}

const uploadService = {
  uploadFile,
  uploadImage,
  uploadAudio,
  uploadVideo
}

export default uploadService
