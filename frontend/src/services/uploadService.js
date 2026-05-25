import { api, uploadUrl } from '../common/config'
import { validateParams } from '../common/common'

const DEFAULT_TIMEOUT = 60000

export const uploadFile = async (file, type = 'image', onProgress = null) => {
  validateParams({ file }, {
    file: { required: true, label: '文件', type: 'object' }
  })

  const formData = new FormData()
  formData.append('file', file)
  if (type) formData.append('type', type)

  const token = localStorage.getItem('token')
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    xhr.timeout = DEFAULT_TIMEOUT

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
        window.location.href = '/login'
        reject(new Error('登录已过期，请重新登录'))
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

    const uploadEndpoint = type === 'image' ? '/api/upload/image' :
                           type === 'audio' ? '/api/upload/audio' :
                           type === 'video' ? '/api/upload/video' : '/api/upload/file'

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

const uploadService = {
  uploadFile,
  uploadImage,
  uploadAudio,
  uploadVideo
}

export default uploadService
