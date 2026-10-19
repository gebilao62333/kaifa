import { isApp } from '../common/platform'

const normalize = (files) => (files || []).map((f) => ({
  path: f.path || f.tempFilePath || '',
  name: f.name || (f.path ? f.path.split('/').pop() : 'file'),
  type: f.type || '',
  size: f.size || 0
}))

// App 端统一选图；H5 端页面继续使用 <input type=file>，这里返回 supported:false
export function chooseImages(count = 1) {
  if (!isApp) return Promise.resolve({ supported: false, files: [] })
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count,
      sizeType: ['compressed', 'original'],
      sourceType: ['album', 'camera'],
      success: (res) => resolve({ supported: true, files: normalize(res.tempFiles || []) }),
      fail: (err) => reject(new Error(err.errMsg || '选择图片失败'))
    })
  })
}

export function chooseVideo() {
  if (!isApp) return Promise.resolve({ supported: false, file: null })
  return new Promise((resolve, reject) => {
    uni.chooseVideo({
      sourceType: ['album', 'camera'],
      compressed: true,
      success: (res) => resolve({ supported: true, file: { path: res.tempFilePath, name: (res.tempFilePath || '').split('/').pop(), type: 'video/mp4', size: res.size || 0, duration: res.duration } }),
      fail: (err) => reject(new Error(err.errMsg || '选择视频失败'))
    })
  })
}
