// 始终使用相对路径 /api/，由 Nginx 或 Vite proxy 统一代理到后端
// 避免 dev 模式下直接请求 localhost:3000（该端口可能不可达或 JWT 密钥不一致）
export const host = ''

// API 路径前缀，与 main frontend 保持一致
export const api = '/api'

