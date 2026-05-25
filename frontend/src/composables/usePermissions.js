import { ref, computed } from 'vue'

const CAMERA_PERMISSION_KEY = 'camera_permission_status'
const MICROPHONE_PERMISSION_KEY = 'microphone_permission_status'

const cameraPermissionStatus = ref(localStorage.getItem(CAMERA_PERMISSION_KEY) || 'prompt')
const microphonePermissionStatus = ref(localStorage.getItem(MICROPHONE_PERMISSION_KEY) || 'prompt')

const checkCameraPermission = async () => {
  if (!navigator.permissions || !navigator.permissions.query) {
    return 'unknown'
  }
  
  try {
    const result = await navigator.permissions.query({ name: 'camera' })
    cameraPermissionStatus.value = result.state
    localStorage.setItem(CAMERA_PERMISSION_KEY, result.state)
    
    result.addEventListener('change', () => {
      cameraPermissionStatus.value = result.state
      localStorage.setItem(CAMERA_PERMISSION_KEY, result.state)
    })
    
    return result.state
  } catch (error) {
    console.warn('无法检查相机权限状态:', error)
    return 'unknown'
  }
}

const checkMicrophonePermission = async () => {
  if (!navigator.permissions || !navigator.permissions.query) {
    return 'unknown'
  }
  
  try {
    const result = await navigator.permissions.query({ name: 'microphone' })
    microphonePermissionStatus.value = result.state
    localStorage.setItem(MICROPHONE_PERMISSION_KEY, result.state)
    
    result.addEventListener('change', () => {
      microphonePermissionStatus.value = result.state
      localStorage.setItem(MICROPHONE_PERMISSION_KEY, result.state)
    })
    
    return result.state
  } catch (error) {
    console.warn('无法检查麦克风权限状态:', error)
    return 'unknown'
  }
}

const requestCameraPermission = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
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
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
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

const getBrowserInfo = () => {
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
  const browser = getBrowserInfo()
  
  const permissionName = permissionType === 'camera' ? '相机' : '麦克风'
  const icon = permissionType === 'camera' ? '📷' : '🎤'
  
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
    cameraPermissionStatus: computed(() => cameraPermissionStatus.value),
    microphonePermissionStatus: computed(() => microphonePermissionStatus.value),
    checkCameraPermission,
    checkMicrophonePermission,
    requestCameraPermission,
    requestMicrophonePermission,
    getPermissionGuideSteps
  }
}