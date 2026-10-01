const isDev = import.meta.env.DEV

// host: 开发环境指向本地后端，生产环境使用空字符串（同源部署，nginx 代理）
export const host = isDev ? 'http://localhost:3000' : ''

// api: 所有 API 请求的前缀，开发和生产统一为相对路径 /api
//   - 开发：Vite proxy 将 /api/* → http://localhost:3000
//   - 生产：nginx 将 /api/* → backend:3000
export const api = '/api'

// socketUrl: Socket.IO 连接地址
//   - 开发：直连本地后端
//   - 生产：空字符串表示同源连接（nginx 代理 /socket.io/ → backend）
export const socketUrl = isDev ? 'http://localhost:3000' : ''

// webSocket: 备用 WebSocket 路径（保留向后兼容）
export const webSocket = import.meta.env.VITE_WEBSOCKET || ''

// sdkappid: 腾讯云 TRTC/IM 应用 ID
export const sdkappid = Number(import.meta.env.VITE_SDK_APP_ID) || 1400745478

// uploadUrl: 文件上传端点
export const uploadUrl = import.meta.env.VITE_UPLOAD_URL || '/api/upload/file'

// cosConfig: 腾讯云 COS 对象存储配置
export const cosConfig = {
  bucket: import.meta.env.VITE_COS_BUCKET || 'your-bucket-1250000000',
  region: import.meta.env.VITE_COS_REGION || 'ap-guangzhou'
}

// appName / version: 应用元信息
export const appName = import.meta.env.VITE_APP_NAME || 'eu搭子'
export const version = import.meta.env.VITE_VERSION || '3.0.0'

// isDebug: 调试模式标志
export const isDebug = isDev
