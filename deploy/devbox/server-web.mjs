// DevBox 单容器 Web 服务：静态 H5 + 管理后台 + 反代后端（HTTP/WebSocket）
// 生产建议仍用 Dockerfile.web + nginx；本文件用于 Sealos DevBox 一键发布 / 临时正式环境。
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const H5_ROOT = path.join(ROOT, 'app/dist/build/h5')
const ADMIN_ROOT = path.join(ROOT, 'admin-frontend/dist')
const PORT = Number(process.env.WEB_PORT || 8080)
const BACKEND_HOST = process.env.BACKEND_HOST || '127.0.0.1'
const BACKEND_PORT = Number(process.env.BACKEND_PORT || 3000)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg'
}

const CSP = "default-src 'self'; img-src 'self' data: blob: https:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss: https:; media-src 'self' blob: https:; font-src 'self' data:; object-src 'none'; frame-ancestors 'self'; base-uri 'self'"

const setSecurityHeaders = (res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Content-Security-Policy', CSP)
}

const PROXY_PREFIXES = ['/api/', '/socket.io/', '/uploads/', '/public/', '/health']
const isProxyPath = (url) => PROXY_PREFIXES.some((p) => url === p.replace(/\/$/, '') || url.startsWith(p))

const proxyHttp = (req, res) => {
  const headers = Object.assign({}, req.headers)
  headers.host = req.headers.host || ''
  headers['x-forwarded-proto'] = headers['x-forwarded-proto'] || 'https'
  headers['x-forwarded-for'] = headers['x-forwarded-for'] || (req.socket.remoteAddress || '')
  headers['x-real-ip'] = headers['x-real-ip'] || (req.socket.remoteAddress || '')
  const upstream = http.request({ host: BACKEND_HOST, port: BACKEND_PORT, method: req.method, path: req.url, headers }, (up) => {
    res.writeHead(up.statusCode || 502, up.headers)
    up.pipe(res)
  })
  upstream.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ code: 502, message: '后端不可达: ' + e.message }))
  })
  req.pipe(upstream)
}

const serveFile = async (res, filePath, cache) => {
  try {
    const st = await fs.stat(filePath)
    if (!st.isFile()) return false
    const ext = path.extname(filePath).toLowerCase()
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': cache || (filePath.includes('/assets/') ? 'public, max-age=2592000, immutable' : 'no-cache')
    })
    res.end(await fs.readFile(filePath))
    return true
  } catch (e) { return false }
}

const safeJoin = (rootDir, urlPath) => {
  const decoded = decodeURIComponent(urlPath.split('?')[0])
  const target = path.normalize(path.join(rootDir, decoded))
  return target.startsWith(rootDir) ? target : null
}

const handleStatic = async (req, res) => {
  const url = req.url.split('?')[0]
  if (url.startsWith('/admin')) {
    const rel = url === '/admin' ? '/index.html' : url.slice('/admin'.length) || '/index.html'
    const target = safeJoin(ADMIN_ROOT, rel)
    if (target && await serveFile(res, target)) return
    const index = path.join(ADMIN_ROOT, 'index.html')
    if (await serveFile(res, index)) return
    res.writeHead(404); res.end('Not Found'); return
  }
  const target = safeJoin(H5_ROOT, url === '/' ? '/index.html' : url)
  if (target && await serveFile(res, target)) return
  // history fallback（旧路径由前端 legacy-redirect 改写）
  const index = path.join(H5_ROOT, 'index.html')
  if (await serveFile(res, index)) return
  res.writeHead(404); res.end('Not Found')
}

const server = http.createServer((req, res) => {
  setSecurityHeaders(res)
  if (isProxyPath(req.url)) return proxyHttp(req, res)
  handleStatic(req, res).catch((e) => { console.error('[web]', e); try { res.writeHead(500); res.end('Internal Error') } catch (_) {} })
})

// Socket.IO 的 WebSocket upgrade 直接透传到后端
server.on('upgrade', (req, socket, head) => {
  if (!req.url || !req.url.startsWith('/socket.io/')) { socket.destroy(); return }
  const upstream = net.connect(BACKEND_PORT, BACKEND_HOST, () => {
    const lines = [req.method + ' ' + req.url + ' HTTP/1.1']
    for (const [k, v] of Object.entries(req.headers)) {
      if (v === undefined) continue
      lines.push(k + ': ' + (Array.isArray(v) ? v.join(', ') : v))
    }
    upstream.write(lines.join('\r\n') + '\r\n\r\n')
    if (head && head.length) upstream.write(head)
    socket.pipe(upstream).pipe(socket)
  })
  upstream.on('error', () => socket.destroy())
  socket.on('error', () => upstream.destroy())
})

server.listen(PORT, '0.0.0.0', () => {
  console.log('[web] listening on 0.0.0.0:' + PORT + ' -> backend ' + BACKEND_HOST + ':' + BACKEND_PORT)
})
