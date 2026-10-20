const isDev = import.meta.env.DEV
const appOrigin = import.meta.env.VITE_API_ORIGIN || ''

// api: 所有 API 请求的前缀，开发和生产统一为相对路径 /api
//   - 开发：Vite proxy 将 /api/* → http://localhost:3000
//   - 生产：nginx 将 /api/* → backend:3000
export const api = '/api'

// socketUrl: Socket.IO 连接地址
//   - 开发：直连本地后端
//   - 生产：空字符串表示同源连接（nginx 代理 /socket.io/ → backend）
export const socketUrl = isDev ? 'http://localhost:3000' : (import.meta.env.VITE_SOCKET_URL || appOrigin)
