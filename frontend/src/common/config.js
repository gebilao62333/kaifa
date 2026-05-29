const isDev = import.meta.env.DEV

export const host = isDev ? 'http://localhost:3002' : (import.meta.env.VITE_API_BASE || 'https://api.your-domain.com')
export const api = isDev ? 'http://localhost:3002/api' : `${host}/api`
export const socketUrl = isDev ? 'http://localhost:3002' : (import.meta.env.VITE_SOCKET_URL || `${host}`)
export const webSocket = import.meta.env.VITE_WEBSOCKET || 'wss://your-domain.com/socket.io/'
export const sdkappid = Number(import.meta.env.VITE_SDK_APP_ID) || 1400745478
export const uploadUrl = import.meta.env.VITE_UPLOAD_URL || (isDev ? '/api/upload/file' : `${host}/api/upload/file`)
export const cosConfig = {
  bucket: import.meta.env.VITE_COS_BUCKET || 'your-bucket-1250000000',
  region: import.meta.env.VITE_COS_REGION || 'ap-guangzhou'
}
export const appName = import.meta.env.VITE_APP_NAME || '多客陪玩'
export const version = import.meta.env.VITE_VERSION || '3.0.0'
export const isDebug = isDev
