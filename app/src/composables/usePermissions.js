import { ref } from 'vue'
import { isApp } from '../common/platform'

const CAMERA_PERMISSION_KEY = 'camera_permission_status'
const MICROPHONE_PERMISSION_KEY = 'microphone_permission_status'

// App 端 localStorage 不一定可用（部分 WebView/隐私设置），模块加载阶段就要兜住读写
const readStoredStatus = (key) => {
  try {
    if (typeof uni !== 'undefined' && typeof uni.getStorageSync === 'function') {
      const value = uni.getStorageSync(key)
      if (value) return value
    }
  } catch (e) { /* uni 存储不可用时回落到 localStorage */ }
  try {
    return localStorage.getItem(key) || 'prompt'
  } catch (e) {
    return 'prompt'
  }
}

const writeStoredStatus = (key, value) => {
  try {
    if (typeof uni !== 'undefined' && typeof uni.setStorageSync === 'function') {
      uni.setStorageSync(key, value)
      return
    }
  } catch (e) { /* uni 存储不可用时回落到 localStorage */ }
  try {
    localStorage.setItem(key, value)
  } catch (e) { /* 存储不可用时只保留内存态 */ }
}

const cameraPermissionStatus = ref(readStoredStatus(CAMERA_PERMISSION_KEY))
const microphonePermissionStatus = ref(readStoredStatus(MICROPHONE_PERMISSION_KEY))

const UNI_SCOPES = { camera: 'scope.camera', microphone: 'scope.record' }

const toPermissionResult = (status, label) => {
  if (status === 'granted') return { granted: true, error: null, message: `${label}权限已获取` }
  if (status === 'denied') return { granted: false, error: 'denied', message: `${label}权限已被拒绝，请在系统设置中开启` }
  if (status === 'not_supported') return { granted: false, error: 'not_supported', message: `当前环境不支持${label}权限申请` }
  return { granted: false, error: 'failed', message: `无法获取${label}权限，请稍后重试` }
}

// uni.getSetting 是回调式 API：Promise 化并把失败收口为「拿不到授权状态」，不向上抛错
const getUniAuthSetting = () => new Promise((resolve) => {
  if (typeof uni === 'undefined' || typeof uni.getSetting !== 'function') { resolve(null); return }
  try {
    uni.getSetting({
      success: (res) => resolve((res && res.authSetting) || {}),
      fail: () => resolve(null)
    })
  } catch (e) {
    resolve(null)
  }
})

const authorizeUniScope = (scope) => new Promise((resolve) => {
  if (typeof uni === 'undefined' || typeof uni.authorize !== 'function') { resolve('not_supported'); return }
  try {
    uni.authorize({
      scope,
      success: () => resolve('granted'),
      // 用户曾拒绝时 uni.authorize 不再弹系统授权框，直接按 denied 处理，交给页面引导去设置
      fail: (err) => resolve(/deny|denied|auth|拒绝/i.test(String((err && (err.errMsg || err.message)) || '')) ? 'denied' : 'failed')
    })
  } catch (e) {
    resolve('failed')
  }
})

const requestAppPermission = async (type) => {
  const label = type === 'camera' ? '相机' : '麦克风'
  const scope = UNI_SCOPES[type]
  const statusRef = type === 'camera' ? cameraPermissionStatus : microphonePermissionStatus
  const storageKey = type === 'camera' ? CAMERA_PERMISSION_KEY : MICROPHONE_PERMISSION_KEY

  if (typeof uni === 'undefined' || typeof uni.getSetting !== 'function' || typeof uni.authorize !== 'function') {
    return toPermissionResult('not_supported', label)
  }

  const authSetting = await getUniAuthSetting()
  if (authSetting && authSetting[scope] === true) {
    statusRef.value = 'granted'
    writeStoredStatus(storageKey, 'granted')
    return toPermissionResult('granted', label)
  }
  if (authSetting && authSetting[scope] === false) {
    statusRef.value = 'denied'
    writeStoredStatus(storageKey, 'denied')
    return toPermissionResult('denied', label)
  }

  const authorized = await authorizeUniScope(scope)
  if (authorized === 'granted' || authorized === 'denied') {
    statusRef.value = authorized
    writeStoredStatus(storageKey, authorized)
  }
  return toPermissionResult(authorized, label)
}

const requestCameraPermission = async () => {
  // App 原生端没有 navigator.mediaDevices/getUserMedia，改用 uni 的授权 API
  if (isApp) return requestAppPermission('camera')

  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      granted: false,
      error: 'not_supported',
      message: '您的浏览器不支持相机功能'
    }
  }
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach(track => track.stop())
    
    cameraPermissionStatus.value = 'granted'
    localStorage.setItem(CAMERA_PERMISSION_KEY, 'granted')
    
    return {
      granted: true,
      error: null,
      message: '相机权限已获取'
    }
  } catch (error) {
    console.error('相机权限请求失败:', error)
    
    let errorType = 'unknown'
    let message = '无法访问相机'
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorType = 'denied'
      message = '相机权限被拒绝'
      cameraPermissionStatus.value = 'denied'
      localStorage.setItem(CAMERA_PERMISSION_KEY, 'denied')
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorType = 'not_found'
      message = '未检测到相机设备'
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorType = 'in_use'
      message = '相机被其他应用占用'
    } else if (error.name === 'OverconstrainedError') {
      errorType = 'not_supported'
      message = '相机不支持所需的格式'
    }
    
    return {
      granted: false,
      error: errorType,
      message
    }
  }
}

const requestMicrophonePermission = async () => {
  // App 原生端没有 navigator.mediaDevices/getUserMedia，改用 uni 的授权 API
  if (isApp) return requestAppPermission('microphone')

  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      granted: false,
      error: 'not_supported',
      message: '您的浏览器不支持录音功能'
    }
  }
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop())
    
    microphonePermissionStatus.value = 'granted'
    localStorage.setItem(MICROPHONE_PERMISSION_KEY, 'granted')
    
    return {
      granted: true,
      error: null,
      message: '麦克风权限已获取'
    }
  } catch (error) {
    console.error('麦克风权限请求失败:', error)
    
    let errorType = 'unknown'
    let message = '无法访问麦克风'
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorType = 'denied'
      message = '麦克风权限被拒绝'
      microphonePermissionStatus.value = 'denied'
      localStorage.setItem(MICROPHONE_PERMISSION_KEY, 'denied')
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorType = 'not_found'
      message = '未检测到麦克风设备'
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorType = 'in_use'
      message = '麦克风被其他应用占用'
    } else if (error.name === 'OverconstrainedError') {
      errorType = 'not_supported'
      message = '麦克风不支持所需的格式'
    }
    
    return {
      granted: false,
      error: errorType,
      message
    }
  }
}

// 只查询当前授权状态、不触发系统弹窗：App 用 uni.getSetting，H5 用浏览器 Permission API，均不抛错
const queryUniAuthStatus = async (scope) => {
  const authSetting = await getUniAuthSetting()
  if (!authSetting) return 'not_supported'
  if (authSetting[scope] === true) return 'granted'
  if (authSetting[scope] === false) return 'denied'
  return 'prompt'
}

const checkCameraPermission = async () => {
  if (isApp) return queryUniAuthStatus(UNI_SCOPES.camera)
  try {
    if (typeof navigator !== 'undefined' && navigator.permissions && typeof navigator.permissions.query === 'function') {
      const result = await navigator.permissions.query({ name: 'camera' })
      return (result && result.state) || cameraPermissionStatus.value
    }
  } catch (e) { /* 浏览器不支持 camera 查询名时回落本地记录 */ }
  return cameraPermissionStatus.value
}

const checkMicrophonePermission = async () => {
  if (isApp) return queryUniAuthStatus(UNI_SCOPES.microphone)
  try {
    if (typeof navigator !== 'undefined' && navigator.permissions && typeof navigator.permissions.query === 'function') {
      const result = await navigator.permissions.query({ name: 'microphone' })
      return (result && result.state) || microphonePermissionStatus.value
    }
  } catch (e) { /* 浏览器不支持 microphone 查询名时回落本地记录 */ }
  return microphonePermissionStatus.value
}

const getBrowserInfo = () => {
  if (typeof navigator === 'undefined') return 'other'
  if (navigator.userAgentData && navigator.userAgentData.brands) {
    const brands = navigator.userAgentData.brands
    if (brands.some(b => b.brand.includes('Chrome') && !b.brand.includes('Chromium'))) {
      return 'chrome'
    }
    if (brands.some(b => b.brand.includes('Edg'))) {
      return 'edge'
    }
    if (brands.some(b => b.brand.includes('Safari') && !b.brand.includes('Chrome'))) {
      return 'safari'
    }
    if (brands.some(b => b.brand.includes('Firefox'))) {
      return 'firefox'
    }
    return 'other'
  }
  
  const ua = navigator.userAgent.toLowerCase()
  
  if (ua.indexOf('chrome') > -1 && ua.indexOf('google') > -1) {
    return 'chrome'
  }
  if (ua.indexOf('edg') > -1) {
    return 'edge'
  }
  if (ua.indexOf('safari') > -1 && ua.indexOf('chrome') === -1) {
    return 'safari'
  }
  if (ua.indexOf('firefox') > -1) {
    return 'firefox'
  }
  
  return 'other'
}

const getPermissionGuideSteps = (permissionType) => {
  const permissionName = permissionType === 'camera' ? '相机' : '麦克风'
  const icon = permissionType === 'camera' ? '📷' : '🎤'

  // App 端没有浏览器地址栏/网站设置，引导去系统应用权限页
  if (isApp) {
    return [
      { step: 1, icon: '⚙️', text: '打开手机「设置」→「应用管理」' },
      { step: 2, icon, text: `找到本应用，进入「权限管理」开启${permissionName}权限` },
      { step: 3, icon: '🔄', text: '返回应用重新操作' }
    ]
  }

  const browser = getBrowserInfo()
  
  if (browser === 'chrome' || browser === 'edge') {
    return [
      { step: 1, icon: '🔒', text: '点击地址栏左侧的锁形图标或"不安全"标识' },
      { step: 2, icon, text: `找到"${permissionName}"选项，将其设置为"允许"` },
      { step: 3, icon: '🔄', text: '刷新页面使设置生效' }
    ]
  } else if (browser === 'safari') {
    return [
      { step: 1, icon: '⚙️', text: '点击菜单栏的"Safari"，选择"设置"' },
      { step: 2, icon: '🌐', text: '切换到"网站"标签页' },
      { step: 3, icon, text: `在左侧找到"${permissionName}"，将其设置为"允许"` },
      { step: 4, icon: '🔄', text: '刷新页面使设置生效' }
    ]
  } else if (browser === 'firefox') {
    return [
      { step: 1, icon: '🔒', text: '点击地址栏左侧的图标' },
      { step: 2, icon, text: `找到"${permissionName}"权限，选择"允许"` },
      { step: 3, icon: '🔄', text: '刷新页面使设置生效' }
    ]
  }
  
  return [
    { step: 1, icon: '⚙️', text: '打开浏览器设置' },
    { step: 2, icon: '🔒', text: '找到隐私或网站设置' },
    { step: 3, icon, text: `允许${permissionName}权限` },
    { step: 4, icon: '🔄', text: '刷新页面使设置生效' }
  ]
}

export function usePermissions() {
  return {
    checkCameraPermission,
    checkMicrophonePermission,
    requestCameraPermission,
    requestMicrophonePermission,
    getPermissionGuideSteps
  }
}