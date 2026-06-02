import { api, uploadUrl, host } from '../common/config'
import { validateParams } from '../common/common'

const DEFAULT_TIMEOUT = 60000
const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024,  // 10MB
  audio: 50 * 1024 * 1024,  // 50MB
  video: 100 * 1024 * 1024, // 100MB
  file: 50 * 1024 * 1024   // 50MB
}

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  file: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}

const validateFile = (file, type) => {
  if (!file) {
    throw new Error('请选择文件')
  }

  const maxSize = MAX_FILE_SIZE[type] || MAX_FILE_SIZE.file
  if (file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(1)
    throw new Error(`文件大小不能超过 ${sizeMB}MB`)
  }

  const allowedTypes = ALLOWED_TYPES[type] || ALLOWED_TYPES.file
  if (type !== 'file' && !allowedTypes.includes(file.type)) {
    throw new Error(`不支持的文件类型: ${file.type}`)
  }

  return true
}

export const uploadFile = async (file, type = 'image', onProgress = null, options = {}) => {
  validateParams({ file }, {
    file: { required: true, label: '文件', type: 'object' }
  })

  validateFile(file, type)

  const formData = new FormData()
  formData.append('file', file)
  if (type) formData.append('type', type)
  
  if (options.filename) {
    formData.append('filename', options.filename)
  }

  const token = localStorage.getItem('token')
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    xhr.timeout = options.timeout || DEFAULT_TIMEOUT

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100)
        onProgress(percent)
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
        localStorage.removeItem('token')
        reject(new Error('登录已过期，请重新登录'))
      } else if (xhr.status === 413) {
        reject(new Error('文件过大，请压缩后重新上传'))
      } else {
        reject(new Error(`上传失败 (${xhr.status})`))
      }
    }

    xhr.onerror = () => {
      reject(new Error('网络连接失败'))
    }

    xhr.ontimeout = () => {
      reject(new Error('上传超时，请检查网络'))
    }

    const uploadEndpoint = type === 'image' ? `${api}/upload/image` :
                           type === 'audio' ? `${api}/upload/audio` :
                           type === 'video' ? `${api}/upload/video` : `${api}/upload/file`

    xhr.open('POST', uploadEndpoint)
    
    Object.keys(headers).forEach(key => {
      xhr.setRequestHeader(key, headers[key])
    })

    xhr.send(formData)
  })
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

export const upload = (file, onProgress) => {
  const fileType = file.type
  let type = 'file'
  if (fileType.startsWith('image/')) {
    type = 'image'
  } else if (fileType.startsWith('audio/')) {
    type = 'audio'
  } else if (fileType.startsWith('video/')) {
    type = 'video'
  }
  return uploadFile(file, type, onProgress)
}

export const uploadMultiple = async (files, onProgress = null) => {
  const results = []
  const totalFiles = files.length
  let completedFiles = 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    try {
      const result = await upload(file, (percent) => {
        if (onProgress) {
          const overallProgress = Math.round(((completedFiles + percent / 100) / totalFiles) * 100)
          onProgress(overallProgress, i, percent)
        }
      })
      results.push({ success: true, result })
    } catch (error) {
      results.push({ success: false, error: error.message })
    }
    completedFiles++
  }

  return results
}

export const compressImage = async (file, options = {}) => {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.8 } = options
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

const uploadService = {
  uploadFile,
  uploadImage,
  uploadAudio,
  uploadVideo,
  upload,
  uploadMultiple,
  compressImage
}

export default uploadService
